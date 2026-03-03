import { Hono } from 'hono';
import { cors } from 'hono/cors';
import Anthropic from '@anthropic-ai/sdk';
import { runPreview, runResult } from './agents/orchestrator';
import { generateUpgradeToken, verifyUpgradeToken } from './agents/growthAgent';
import { imageGenAgent } from './agents/imageGenAgent';

// ─── Environment Bindings ─────────────────────────────────────────────────────
// Secrets  → `wrangler secret put <NAME>`
// Plain vars → wrangler.toml [vars]
// R2 native binding → wrangler.toml [[r2_buckets]]

export type Bindings = {
  // Secrets
  ANTHROPIC_API_KEY: string;
  NANOBANANA_API_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_WEBHOOK_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  RESEND_API_KEY: string;
  GOOGLE_PLACES_API_KEY: string;
  CLOUDFLARE_TURNSTILE_SECRET_KEY: string;
  // Plain vars (wrangler.toml [vars])
  SUPABASE_URL: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
  POLAR_PRODUCT_ID_STANDARD: string;
  POLAR_PRODUCT_ID_PRO: string;
  POLAR_PRODUCT_ID_ANNUAL: string;
  SKIP_TURNSTILE: string; // "true" for local dev only
  // R2 native binding (wrangler.toml [[r2_buckets]])
  R2: R2Bucket;
};

export type PlanType = 'standard' | 'pro' | 'annual';

// ─── Supabase REST Helper ─────────────────────────────────────────────────────

/**
 * Thin wrapper around the Supabase REST API.
 * Always creates a fresh request — no shared state between calls.
 */
export async function supabase(
  env: Bindings,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
    ...(options.headers as Record<string, string> | undefined),
  };
  return fetch(url, { ...options, headers });
}

// ─── HMAC-SHA256 Verification ─────────────────────────────────────────────────

/**
 * Timing-safe HMAC-SHA256 verification for Polar webhook signatures.
 * Polar follows the Standard Webhooks spec:
 *   - Headers: webhook-id, webhook-timestamp, webhook-signature
 *   - Signed content: "{msgId}.{timestamp}.{body}"
 *   - Signature format: "v1,<base64>" (space-delimited for multiple)
 *   - Secret format: may be prefixed with "whsec_" (base64-encoded)
 */
async function verifyHmac(
  body: string,
  signature: string,
  secret: string,
  msgId: string,
  msgTimestamp: string
): Promise<boolean> {
  try {
    // Strip "whsec_" prefix if present, then base64-decode to raw bytes
    const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    let keyBytes: Uint8Array;
    try {
      keyBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));
    } catch {
      // If not valid base64, treat as raw UTF-8 (fallback for plain secrets)
      keyBytes = new TextEncoder().encode(rawSecret);
    }

    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Standard Webhooks signed content: "{msgId}.{timestamp}.{body}"
    const signedContent = `${msgId}.${msgTimestamp}.${body}`;
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
    const computedB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

    // signature header: "v1,<b64>" or space-delimited list of "v1,<b64>"
    const parts = signature.split(' ');
    for (const part of parts) {
      const [version, sigB64] = part.split(',');
      if (version !== 'v1' || !sigB64) continue;

      // Timing-safe comparison of base64 strings
      if (computedB64.length !== sigB64.length) continue;
      let mismatch = 0;
      for (let i = 0; i < computedB64.length; i++) {
        mismatch |= computedB64.charCodeAt(i) ^ sigB64.charCodeAt(i);
      }
      if (mismatch === 0) return true;
    }
    return false;
  } catch (err) {
    console.error('[verifyHmac] Error:', (err as Error).message);
    return false;
  }
}

// ─── Turnstile Verification ───────────────────────────────────────────────────

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[verifyTurnstile] Failed:', (err as Error).message);
    return false;
  }
}

// ─── Input Guards ─────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(v: string): boolean {
  return UUID_RE.test(v);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v) && v.length <= 254;
}

// ─── Polar Product ID Picker ──────────────────────────────────────────────────

function polarProductId(plan: PlanType, env: Bindings): string {
  if (plan === 'pro') return env.POLAR_PRODUCT_ID_PRO;
  if (plan === 'annual') return env.POLAR_PRODUCT_ID_ANNUAL;
  return env.POLAR_PRODUCT_ID_STANDARD;
}

// ─── Hono App ─────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://travelscapsule.com',
  'https://www.travelscapsule.com',
  'https://travel-cloth-recommend.pages.dev',
  'http://localhost:3000',
  'http://localhost:5173',
];

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global error handler — MUST add CORS headers manually because the cors
// middleware's "after next()" code does not run when the route throws.
app.onError((err, c) => {
  const origin = c.req.header('origin') ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Credentials', 'false');
  }
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[onError]', msg);
  return c.json({ error: 'Internal Server Error', detail: msg.slice(0, 200) }, 500);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/health
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (c) =>
  c.json({ ok: true, timestamp: new Date().toISOString() })
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST /api/preview
// ─────────────────────────────────────────────────────────────────────────────
// Creates a trip, runs the free-tier preview pipeline (weather+vibe+teaser+
// capsule free mode). Enforces Turnstile and 5-trips/day rate limit.

app.post('/api/preview', async (c) => {
  let body: {
    session_id?: string;
    cities?: unknown[];
    month?: number;
    face_url?: string;
    cf_turnstile_token?: string;
    /** Traveller profile fields from the trip form */
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    /** Array of aesthetic keywords e.g. ["minimalist", "classic"] */
    style_preferences?: string[];
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const {
    session_id,
    cities,
    month,
    face_url,
    cf_turnstile_token,
    gender,
    height_cm,
    weight_kg,
    style_preferences,
  } = body;

  // Input validation
  if (!session_id || typeof session_id !== 'string' || session_id.length > 128) {
    return c.json({ error: 'session_id is required (max 128 chars)' }, 400);
  }
  if (!Array.isArray(cities) || cities.length === 0 || cities.length > 5) {
    return c.json({ error: 'cities must be a non-empty array (max 5)' }, 400);
  }
  if (typeof month !== 'number' || month < 1 || month > 12) {
    return c.json({ error: 'month must be 1–12' }, 400);
  }

  // Turnstile verification (skip in local dev when SKIP_TURNSTILE === "true")
  if (c.env.SKIP_TURNSTILE !== 'true') {
    if (!cf_turnstile_token || typeof cf_turnstile_token !== 'string') {
      return c.json({ error: 'Turnstile token required' }, 403);
    }
    // Fail closed: if the secret key is not configured, refuse the request.
    // This prevents bots from bypassing Turnstile in a misconfigured deployment.
    // Fix: run `wrangler secret put CLOUDFLARE_TURNSTILE_SECRET_KEY` before deploying.
    if (!c.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      console.error('[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY not configured — returning 503');
      return c.json({ error: 'Service temporarily unavailable' }, 503);
    }
    const ok = await verifyTurnstile(cf_turnstile_token, c.env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
    if (!ok) {
      return c.json({ error: 'Turnstile verification failed' }, 403);
    }
  }

  // Rate limit: 20 previews per session_id OR IP per calendar day.
  // Both checks are independent — either hitting 20 triggers 429.
  const DAILY_LIMIT = 20;
  const clientIp = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? '';
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  // Check session_id rate limit
  const sessionCountRes = await supabase(
    c.env,
    `/trips?session_id=eq.${encodeURIComponent(session_id)}&created_at=gte.${todayIso}&select=id`,
    { headers: { Prefer: 'count=exact' } }
  );
  const sessionCount = parseInt(
    sessionCountRes.headers.get('content-range')?.split('/')[1] ?? '0',
    10
  );
  if (sessionCount >= DAILY_LIMIT) {
    return c.json({ error: 'Daily limit reached', limit: DAILY_LIMIT }, 429);
  }

  // Check IP rate limit (only when IP is available)
  if (clientIp) {
    const ipCountRes = await supabase(
      c.env,
      `/trips?client_ip=eq.${encodeURIComponent(clientIp)}&created_at=gte.${todayIso}&select=id`,
      { headers: { Prefer: 'count=exact' } }
    );
    const ipCount = parseInt(
      ipCountRes.headers.get('content-range')?.split('/')[1] ?? '0',
      10
    );
    if (ipCount >= DAILY_LIMIT) {
      return c.json({ error: 'Daily limit reached', limit: DAILY_LIMIT }, 429);
    }
  }

  // Validate optional profile fields — accept only safe primitive types
  const safeGender =
    gender === 'male' || gender === 'female' || gender === 'non-binary'
      ? gender
      : undefined;
  const safeHeightCm =
    typeof height_cm === 'number' && height_cm > 0 && height_cm < 300
      ? height_cm
      : undefined;
  const safeWeightKg =
    typeof weight_kg === 'number' && weight_kg > 0 && weight_kg < 500
      ? weight_kg
      : undefined;
  const safeAesthetics = Array.isArray(style_preferences)
    ? style_preferences
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.toLowerCase().trim())
        .slice(0, 10) // cap to 10 aesthetic tags
    : [];

  // Insert trip row (client_ip stored for rate limiting; never exposed in API responses)
  const tripPayload = {
    session_id,
    cities,
    month,
    ...(face_url ? { face_url } : {}),
    ...(clientIp ? { client_ip: clientIp } : {}),
    ...(safeGender ? { gender: safeGender } : {}),
    ...(safeHeightCm !== undefined ? { height_cm: safeHeightCm } : {}),
    ...(safeWeightKg !== undefined ? { weight_kg: safeWeightKg } : {}),
    aesthetics: safeAesthetics,
    status: 'pending',
  };
  const insertRes = await supabase(c.env, '/trips', {
    method: 'POST',
    body: JSON.stringify(tripPayload),
  });
  if (!insertRes.ok) {
    const detail = await insertRes.text();
    console.error('[POST /api/preview] Trip insert failed:', insertRes.status, detail);
    return c.json({ error: 'Failed to create trip', detail }, 500);
  }
  const rows = (await insertRes.json()) as Array<{ id: string }>;
  const trip = rows[0];
  if (!trip?.id) {
    console.error('[POST /api/preview] Trip insert returned no row');
    return c.json({ error: 'Trip insert returned no row' }, 500);
  }
  const tripId = trip.id;

  // Run preview pipeline (async — results written to DB)
  try {
    const preview = await runPreview(
      {
        trip_id: tripId,
        session_id,
        cities: cities as unknown[],
        month,
        face_url,
        user_profile: {
          gender:      safeGender,
          height_cm:   safeHeightCm,
          weight_kg:   safeWeightKg,
          aesthetics:  safeAesthetics,
        },
      },
      c.env
    );
    return c.json(preview);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Check for annual limit error
    if (msg.includes('AnnualLimitReached')) {
      return c.json({ error: 'Annual plan trip limit reached (12/year)' }, 429);
    }
    console.error(`[POST /api/preview] Pipeline error for trip ${tripId}:`, msg);
    return c.json({ error: `Preview generation failed: ${msg.slice(0, 200)}`, trip_id: tripId }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/preview/email
// ─────────────────────────────────────────────────────────────────────────────
// Captures email for a preview trip and sends a mood card email via Resend.

app.post('/api/preview/email', async (c) => {
  let body: { trip_id?: string; email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { trip_id, email } = body;
  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Valid trip_id required' }, 400);
  }
  if (!email || !isValidEmail(email)) {
    return c.json({ error: 'Valid email required' }, 400);
  }

  // Upsert email capture
  await supabase(c.env, '/email_captures', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ trip_id, email }),
  });

  // Fetch teaser image from generation_jobs
  const jobsRes = await supabase(
    c.env,
    `/generation_jobs?trip_id=eq.${trip_id}&job_type=eq.teaser&limit=1`
  );
  const jobs = jobsRes.ok
    ? ((await jobsRes.json()) as Array<{ image_url?: string }>)
    : [];
  const teaserUrl = jobs[0]?.image_url ?? '';

  // Send mood card email via Resend
  const galleryPreviewUrl = `https://travelscapsule.com/result/${trip_id}`;
  const emailHtml = buildMoodCardEmail(galleryPreviewUrl, teaserUrl);

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Travel Capsule AI <hello@travelscapsule.com>',
      to: [email],
      subject: 'Your Travel Mood Card is Ready',
      html: emailHtml,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!emailRes.ok) {
    console.error('[POST /api/preview/email] Resend error:', await emailRes.text());
    // Non-fatal — return ok anyway so UX is not disrupted
  }

  return c.json({ ok: true });
});

function buildMoodCardEmail(galleryUrl: string, teaserUrl: string): string {
  const safeGallery = galleryUrl.replace(/"/g, '');
  const safeTeaser = teaserUrl.replace(/"/g, '');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Your Mood Card</title></head>
<body style="font-family:sans-serif;background:#fafaf8;margin:0;padding:40px 20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:36px 28px;text-align:center">
      <p style="color:#c9a96e;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Travel Capsule AI</p>
      <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0">Your Mood Card</h1>
    </div>
    ${safeTeaser ? `<img src="${safeTeaser}" alt="Mood Preview" style="width:100%;display:block">` : ''}
    <div style="padding:32px 28px;text-align:center">
      <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 24px">
        Your AI travel style preview is ready. Unlock the full capsule wardrobe for just $5.
      </p>
      <a href="${safeGallery}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600">
        View Full Capsule — $5
      </a>
    </div>
  </div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /api/payment/checkout
// ─────────────────────────────────────────────────────────────────────────────
// Creates a Polar checkout session for the given trip + plan.

app.post('/api/payment/checkout', async (c) => {
  let body: { trip_id?: string; plan?: string; customer_email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { trip_id, plan, customer_email } = body;
  // trip_id is optional — auto-generate if not provided so the frontend
  // doesn't need to create a trip before initiating checkout.
  const resolvedTripId = (trip_id && isValidUUID(trip_id)) ? trip_id : crypto.randomUUID();
  if (!plan || !['standard', 'pro', 'annual'].includes(plan)) {
    return c.json({ error: 'plan must be standard | pro | annual' }, 400);
  }
  if (customer_email && !isValidEmail(customer_email)) {
    return c.json({ error: 'Invalid customer_email' }, 400);
  }

  const typedPlan = plan as PlanType;
  const productId = polarProductId(typedPlan, c.env);

  // success_url: redirect to the checkout-success page so the frontend knows
  // which plan was purchased and can surface the correct result view.
  // {CHECKOUT_ID} is a Polar placeholder that gets replaced with the actual checkout ID.
  // Use the request Origin to support both travelscapsule.com and pages.dev.
  const reqOrigin = c.req.header('origin') ?? 'https://travelscapsule.com';
  const allowedOrigins = ['https://travelscapsule.com', 'https://www.travelscapsule.com', 'https://travel-cloth-recommend.pages.dev'];
  const returnBase = allowedOrigins.includes(reqOrigin) ? reqOrigin : 'https://travelscapsule.com';
  const returnUrl = `${returnBase}/checkout/success?plan=${typedPlan}&tripId=${resolvedTripId}&checkout_id={CHECKOUT_ID}`;

  const checkoutPayload: Record<string, unknown> = {
    product_id: productId,
    metadata: { trip_id: resolvedTripId, plan: typedPlan },
    success_url: returnUrl,
    ...(customer_email ? { customer_email } : {}),
  };

  // Use /v1/checkouts/ (not the legacy /v1/checkouts/custom/ endpoint)
  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutPayload),
    signal: AbortSignal.timeout(15_000),
  });

  if (!polarRes.ok) {
    console.error('[POST /api/payment/checkout] Polar error:', polarRes.status, await polarRes.text());
    return c.json({ error: 'Failed to create checkout session' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };
  return c.json({ checkout_url: session.url, checkout_id: session.id, trip_id: resolvedTripId });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/payment/webhook
// ─────────────────────────────────────────────────────────────────────────────
// Polar webhook receiver. Verifies HMAC-SHA256, inserts order, triggers pipeline.

app.post('/api/payment/webhook', async (c) => {
  const rawBody = await c.req.text();
  // Standard Webhooks headers from Polar
  const signature = c.req.header('webhook-signature') ?? c.req.header('x-polar-signature') ?? '';
  const msgId = c.req.header('webhook-id') ?? '';
  const msgTimestamp = c.req.header('webhook-timestamp') ?? '';

  const isValid = await verifyHmac(rawBody, signature, c.env.POLAR_WEBHOOK_SECRET, msgId, msgTimestamp);
  if (!isValid) {
    console.warn('[Webhook] Invalid Polar signature');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  let event: {
    type: string;
    data: {
      id: string;
      metadata?: Record<string, string | number | boolean | null>;
      amount?: number;
      net_amount?: number;
      customer?: { email?: string };
      // checkout metadata is the primary carrier for our trip_id + plan
      checkout?: { metadata?: Record<string, string | number | boolean | null> };
      // subscription-specific fields (for renewal/cancel events)
      current_period_start?: string;
      current_period_end?: string;
      status?: string;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (event.type === 'order.paid') {
    const polarOrderId = event.data.id;
    // Polar stores checkout metadata on both data.metadata and data.checkout.metadata
    const meta = event.data.metadata ?? event.data.checkout?.metadata ?? {};
    const tripId = (meta.trip_id as string | undefined);
    const plan = ((meta.plan as string | undefined) ?? 'standard') as PlanType;
    const amount = event.data.net_amount ?? event.data.amount ?? 500;
    const userEmail = event.data.customer?.email ?? '';

    if (!tripId || !isValidUUID(tripId)) {
      return c.json({ error: 'Missing or invalid trip_id in metadata' }, 400);
    }

    // Idempotency: check for existing order with this polar_order_id
    const existingRes = await supabase(
      c.env,
      `/orders?polar_order_id=eq.${encodeURIComponent(polarOrderId)}&limit=1`
    );
    const existing = (await existingRes.json()) as Array<{ id: string }>;
    if (existing.length > 0) {
      return c.json({ received: true, idempotent: true });
    }

    // Insert order record
    const orderRes = await supabase(c.env, '/orders', {
      method: 'POST',
      body: JSON.stringify({
        polar_order_id: polarOrderId,
        trip_id: tripId,
        status: 'paid',
        amount,
        plan,
      }),
    });
    if (!orderRes.ok) {
      console.error('[Webhook] Failed to insert order:', await orderRes.text());
      return c.json({ error: 'Failed to record order' }, 500);
    }

    // Mark trip as processing
    await supabase(c.env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'processing' }),
    });

    // Standard plan: generate upgrade token and store on order
    if (plan === 'standard') {
      try {
        const upgradeToken = await generateUpgradeToken(tripId, c.env);
        await supabase(
          c.env,
          `/orders?polar_order_id=eq.${encodeURIComponent(polarOrderId)}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ upgrade_token: upgradeToken }),
          }
        );
      } catch (err) {
        console.error('[Webhook] Failed to generate upgrade token:', (err as Error).message);
      }
    }

    // Run result pipeline in the background — auto-refund on failure
    c.executionCtx.waitUntil(
      runResult(tripId, plan, userEmail, c.env).catch(async (err: Error) => {
        console.error(`[Webhook] runResult failed for trip ${tripId}:`, err.message);
        await supabase(c.env, `/trips?id=eq.${tripId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'failed' }),
        });

        // Auto-refund: if service fails, refund the customer via Polar API
        try {
          console.log(`[Webhook] Initiating auto-refund for order ${polarOrderId}`);
          const refundRes = await fetch(`https://api.polar.sh/v1/refunds/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order_id: polarOrderId,
              reason: 'service_not_rendered',
              comment: `Auto-refund: AI generation failed for trip ${tripId}`,
            }),
            signal: AbortSignal.timeout(15_000),
          });
          if (refundRes.ok) {
            console.log(`[Webhook] Refund successful for order ${polarOrderId}`);
            await supabase(c.env, `/orders?polar_order_id=eq.${encodeURIComponent(polarOrderId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'refunded' }),
            });
          } else {
            console.error(`[Webhook] Refund failed (${refundRes.status}):`, await refundRes.text());
          }
        } catch (refundErr) {
          console.error(`[Webhook] Refund request failed:`, (refundErr as Error).message);
        }
      })
    );
  }

  // ── subscription.active — handles annual subscription renewals ──────────
  // When Polar renews an annual subscription, reset trip_count for the new period.
  if (event.type === 'subscription.active') {
    const customerEmail = event.data.customer?.email;
    const periodStart = event.data.current_period_start; // ISO date from Polar
    const periodEnd = event.data.current_period_end;

    if (customerEmail && periodStart && periodEnd) {
      // Parse Polar dates to DATE strings (YYYY-MM-DD)
      const pStart = periodStart.slice(0, 10);
      const pEnd = periodEnd.slice(0, 10);

      // Find existing usage record for this user
      const usageRes = await supabase(
        c.env,
        `/usage_records?user_email=eq.${encodeURIComponent(customerEmail)}&plan=eq.annual&order=period_end.desc&limit=1`
      );
      const usageRows = (await usageRes.json()) as Array<{ id: string; period_end: string }>;

      if (usageRows.length > 0 && usageRows[0]) {
        const existing = usageRows[0];
        // Only reset if this is a new period (Polar period_start is after existing period_end)
        if (pStart > existing.period_end) {
          console.log(`[Webhook] Annual renewal for ${customerEmail}: resetting trip_count`);
          await supabase(c.env, `/usage_records?id=eq.${existing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              trip_count: 0,
              period_start: pStart,
              period_end: pEnd,
            }),
          });
        }
      } else {
        // No existing record — create one with 0 trips for the new period
        await supabase(c.env, '/usage_records', {
          method: 'POST',
          body: JSON.stringify({
            user_email: customerEmail,
            plan: 'annual',
            trip_count: 0,
            period_start: pStart,
            period_end: pEnd,
          }),
        });
      }
    }
  }

  // ── subscription.canceled / subscription.revoked ────────────────────────
  // Log cancellation. The user can still use remaining trips until period_end.
  if (event.type === 'subscription.canceled' || event.type === 'subscription.revoked') {
    const customerEmail = event.data.customer?.email;
    const status = event.data.status ?? event.type.split('.')[1];
    console.log(`[Webhook] Subscription ${status} for ${customerEmail ?? 'unknown'}`);
    // No trip_count change — user keeps access until period_end expires.
    // checkAnnualLimit already validates period_end, so access naturally expires.
  }

  return c.json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/payment/upgrade
// ─────────────────────────────────────────────────────────────────────────────
// Upgrades a Standard purchase to Pro. Verifies the 3-minute upgrade token,
// creates a Polar checkout for the $2 Pro upgrade price difference.

app.post('/api/payment/upgrade', async (c) => {
  let body: { trip_id?: string; upgrade_token?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { trip_id, upgrade_token } = body;
  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Valid trip_id required' }, 400);
  }
  if (!upgrade_token || typeof upgrade_token !== 'string') {
    return c.json({ error: 'upgrade_token required' }, 400);
  }

  // Verify the upgrade token (3-minute HMAC window)
  const isValid = await verifyUpgradeToken(trip_id, upgrade_token, c.env);
  if (!isValid) {
    return c.json({ error: 'Invalid or expired upgrade token' }, 403);
  }

  // Verify Standard order exists
  const orderRes = await supabase(
    c.env,
    `/orders?trip_id=eq.${trip_id}&plan=eq.standard&status=eq.paid&limit=1`
  );
  const orders = (await orderRes.json()) as Array<{ id: string; polar_order_id: string }>;
  if (orders.length === 0) {
    return c.json({ error: 'No paid standard order found for this trip' }, 404);
  }

  const standardOrder = orders[0];

  // Create Polar checkout for Pro upgrade
  const upgradeReqOrigin = c.req.header('origin') ?? 'https://travelscapsule.com';
  const upgradeAllowed = ['https://travelscapsule.com', 'https://www.travelscapsule.com', 'https://travel-cloth-recommend.pages.dev'];
  const upgradeBase = upgradeAllowed.includes(upgradeReqOrigin) ? upgradeReqOrigin : 'https://travelscapsule.com';
  const upgradeReturnUrl = `${upgradeBase}/checkout/success?plan=pro&tripId=${trip_id}`;
  const checkoutPayload = {
    product_id: c.env.POLAR_PRODUCT_ID_PRO,
    metadata: {
      trip_id,
      plan: 'pro',
      upgrade_from: standardOrder.polar_order_id,
    },
    success_url: upgradeReturnUrl,
  };

  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutPayload),
    signal: AbortSignal.timeout(15_000),
  });

  if (!polarRes.ok) {
    console.error('[POST /api/payment/upgrade] Polar error:', await polarRes.text());
    return c.json({ error: 'Failed to create upgrade checkout' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };

  // Record upgrade_from reference on the standard order
  await supabase(c.env, `/orders?id=eq.${standardOrder.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ upgrade_initiated_at: new Date().toISOString() }),
  });

  return c.json({ checkout_url: session.url });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/trips/:tripId
// ─────────────────────────────────────────────────────────────────────────────
// Unified trip data for ResultClient. Requires paid order.
// Returns trip + generation_jobs + capsule wardrobe + upgrade_token.

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/preview/:tripId
// ─────────────────────────────────────────────────────────────────────────────
// Returns free preview data for a trip (weather, vibe, teaser, free capsule).
// No payment required. Used by PreviewClient when navigating to /preview/[tripId].

app.get('/api/preview/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) return c.json({ error: 'Invalid trip ID' }, 400);

  const [tripRows, jobRows] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&job_type=eq.teaser&status=eq.completed&select=city,image_url&limit=1`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (tripRows.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const trip = tripRows[0];
  const teaserJob = jobRows[0] ?? null;
  const expiresAt = (trip.expires_at as string) ?? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Reconstruct vibes array — ensure city field is present
  const rawVibes = Array.isArray(trip.vibe_data) ? (trip.vibe_data as Array<Record<string, unknown>>) : [];
  const rawCities = Array.isArray(trip.cities) ? (trip.cities as Array<Record<string, unknown>>) : [];
  const vibes = rawVibes.map((v, i) => ({
    city: (v.city as string) ?? (rawCities[i]?.name as string) ?? '',
    mood_name: (v.mood_name as string) ?? '',
    mood_label: (v.mood_label as string) ?? '',
    vibe_tags: Array.isArray(v.vibe_tags) ? v.vibe_tags : [],
    color_palette: Array.isArray(v.color_palette) ? v.color_palette : [],
    avoid_note: (v.avoid_note as string) ?? '',
  }));

  const weather = Array.isArray(trip.weather_data) ? trip.weather_data : [];
  const capsuleFree = (trip.capsule_free as Record<string, unknown> | null) ?? { count: 10, principles: [] };

  return c.json({
    trip_id: tripId,
    weather,
    vibes,
    teaser: {
      city: (teaserJob?.city as string) ?? (rawCities[0]?.name as string) ?? '',
      teaser_url: (teaserJob?.image_url as string) ?? '',
      expires_at: expiresAt,
      watermark: true,
    },
    capsule: capsuleFree,
    expires_at: expiresAt,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload-photo
// ─────────────────────────────────────────────────────────────────────────────
// Accepts multipart/form-data with a "photo" file field.
// Uploads to R2 at a temp path, returns the face_url for use in /api/preview.
// SECURITY: No public exposure — temp path is random UUID-keyed.

app.post('/api/upload-photo', async (c) => {
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: 'Expected multipart/form-data' }, 400);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Failed to parse form data' }, 400);
  }

  const photo = formData.get('photo');
  // In Cloudflare Workers, File extends Blob — check for Blob to be safe
  if (!photo || typeof photo === 'string') {
    return c.json({ error: 'photo field required' }, 400);
  }
  const photoBlob = photo as Blob & { name?: string; type: string; size: number };

  if (photoBlob.size > 5 * 1024 * 1024) {
    return c.json({ error: 'Photo must be under 5MB' }, 400);
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(photoBlob.type)) {
    return c.json({ error: 'Only JPEG, PNG, WebP allowed' }, 400);
  }

  const ext = photoBlob.type === 'image/png' ? 'png' : photoBlob.type === 'image/webp' ? 'webp' : 'jpg';
  const key = `faces/temp-${crypto.randomUUID()}.${ext}`;

  try {
    const arrayBuffer = await photoBlob.arrayBuffer();
    await c.env.R2.put(key, arrayBuffer, {
      httpMetadata: { contentType: photoBlob.type },
    });
    const face_url = `${c.env.R2_PUBLIC_URL}/${key}`;
    return c.json({ face_url });
  } catch (err) {
    console.error('[POST /api/upload-photo] R2 upload error:', (err as Error).message);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

app.get('/api/trips/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) return c.json({ error: 'Invalid trip ID' }, 400);

  // Require payment
  const orderRes = await supabase(c.env, `/orders?trip_id=eq.${tripId}&status=eq.paid&limit=1`);
  const orders = (await orderRes.json()) as Array<Record<string, unknown>>;
  if (orders.length === 0) return c.json({ error: 'Payment required' }, 402);

  const [tripRows, capsuleRows, jobRows] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(c.env, `/capsule_results?trip_id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&select=id,city,mood,status,image_url&order=created_at.asc`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (tripRows.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const trip = tripRows[0];
  const capsule = capsuleRows[0] ?? null;
  const order = orders[0];

  return c.json({
    id: trip.id,
    status: trip.status,
    cities: trip.cities,
    month: trip.month,
    plan: (order.plan as string) ?? 'standard',
    generation_jobs: jobRows,
    wardrobe_items: (capsule?.items as unknown[]) ?? [],
    daily_plan: (capsule?.daily_plan as unknown[]) ?? [],
    created_at: trip.created_at,
    upgrade_token: (order.upgrade_token as string | undefined) ?? null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /api/result/:tripId
// ─────────────────────────────────────────────────────────────────────────────
// Returns the full paid result for a trip (requires paid order).

app.get('/api/result/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) return c.json({ error: 'Invalid trip ID' }, 400);

  // Must have a paid order
  const orderRes = await supabase(
    c.env,
    `/orders?trip_id=eq.${tripId}&status=eq.paid&limit=1`
  );
  const orders = (await orderRes.json()) as Array<Record<string, unknown>>;
  if (orders.length === 0) {
    return c.json({ error: 'Payment required to view results' }, 402);
  }

  const [tripRows, capsuleRows, jobRows] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(c.env, `/capsule_results?trip_id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&select=city,mood,status,image_url,job_type,created_at&order=created_at.asc`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (tripRows.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const tripRow = tripRows[0];
  const capsuleRow = capsuleRows[0] ?? null;
  const order = orders[0];

  // Normalise images: api.ts ResultData expects { city, url, index }[]
  // generation_jobs stores the URL in `image_url`; filter to completed full-gen images only.
  const images = jobRows
    .filter(
      (j) =>
        j.status === 'completed' &&
        (j.job_type === 'full' || j.job_type === 'regen') &&
        j.image_url
    )
    .map((j, idx) => ({
      city: (j.city as string) ?? '',
      url: (j.image_url as string) ?? '',
      index: idx,
    }));

  // Also expose the teaser as a fallback image if no full images exist
  const teaserJobs = jobRows.filter(
    (j) => j.status === 'completed' && j.job_type === 'teaser' && j.image_url
  );
  const teaserUrl =
    (teaserJobs[0]?.image_url as string | undefined) ?? '';

  const shareUrl = `https://travelscapsule.com/share/${tripId}?utm_source=share&utm_medium=direct`;

  // Reconstruct vibes and weather from trip row (stored by runPreview)
  const vibes = Array.isArray(tripRow.vibe_data) ? tripRow.vibe_data : [];
  const weather = Array.isArray(tripRow.weather_data) ? tripRow.weather_data : [];

  return c.json({
    // Top-level fields expected by api.ts ResultData
    trip_id: tripId,
    plan: (order.plan as string) ?? 'standard',
    cities: tripRow.cities,
    month: tripRow.month,
    weather,
    vibes,
    capsule: {
      items: (capsuleRow?.items as unknown[]) ?? [],
      daily_plan: (capsuleRow?.daily_plan as unknown[]) ?? [],
    },
    images,
    teaser_url: teaserUrl,
    // User profile fields (stored during /api/preview)
    gender: (tripRow.gender as string) ?? undefined,
    height_cm: (tripRow.height_cm as number) ?? undefined,
    weight_kg: (tripRow.weight_kg as number) ?? undefined,
    aesthetics: Array.isArray(tripRow.aesthetics) ? tripRow.aesthetics : [],
    growth: {
      share_url: (tripRow.share_url as string) ?? shareUrl,
      upgrade_token: (order.upgrade_token as string | undefined) ?? null,
      social_copies: {
        instagram: '',
        twitter: '',
        kakao: '',
      },
    },
    created_at: (tripRow.created_at as string) ?? '',
    // Nested shape for legacy consumers (result/[tripId] page using nested access)
    trip: tripRow,
    order,
    share_url: shareUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /api/share/:tripId
// ─────────────────────────────────────────────────────────────────────────────
// Public share page data — teaser image + trip vibe (no auth required).

app.get('/api/share/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) return c.json({ error: 'Invalid trip ID' }, 400);

  const [tripRows, jobRows] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&select=id,cities,month,status,vibe_data&limit=1`).then(
      (r) => r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&job_type=eq.teaser&status=eq.completed&select=city,mood,image_url&limit=1`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (tripRows.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const trip = tripRows[0];
  const teaserJob = jobRows[0] ?? null;
  const vibes = Array.isArray(trip.vibe_data) ? (trip.vibe_data as Array<Record<string, unknown>>) : [];
  const firstVibe = vibes[0];
  const cities = Array.isArray(trip.cities) ? (trip.cities as Array<Record<string, unknown>>) : [];
  const firstCity = (cities[0]?.name as string) ?? '';
  const moodName = (firstVibe?.mood_label as string) ?? (firstVibe?.mood_name as string) ?? firstCity;
  const ogTitle = `${moodName} | Travel Capsule AI`;
  const ogDesc = `AI-generated travel outfit styling for ${firstCity}. See the full capsule wardrobe.`;
  const shareUrl = `https://travelscapsule.com/share/${tripId}?utm_source=share&utm_medium=direct`;

  // Returns ShareResult shape as expected by ShareClient
  return c.json({
    trip_id: tripId,
    share_url: shareUrl,
    og_title: ogTitle,
    og_description: ogDesc,
    teaser_url: (teaserJob?.image_url as string) ?? '',
    mood_name: moodName,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. POST /api/account/delete
// ─────────────────────────────────────────────────────────────────────────────
// Deletes a user account and associated data. Requires a valid Supabase JWT.

app.post('/api/account/delete', async (c) => {
  // Verify the user's JWT via Supabase Auth
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization required' }, 401);
  }
  const token = authHeader.slice(7);

  // Validate JWT by fetching the user from Supabase Auth
  const userRes = await fetch(`${c.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!userRes.ok) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }
  const authUser = (await userRes.json()) as { id: string; email?: string };
  const userId = authUser.id;

  // Clean up user data from our tables (best-effort)
  // Delete in order: generation_jobs, capsule_results, orders, email_captures → trips
  const tripRes = await supabase(c.env, `/trips?session_id=eq.${encodeURIComponent(userId)}&select=id`);
  const trips = tripRes.ok ? ((await tripRes.json()) as Array<{ id: string }>) : [];
  const tripIds = trips.map((t) => t.id);

  if (tripIds.length > 0) {
    const tripFilter = `trip_id=in.(${tripIds.join(',')})`;
    await Promise.allSettled([
      supabase(c.env, `/generation_jobs?${tripFilter}`, { method: 'DELETE' }),
      supabase(c.env, `/capsule_results?${tripFilter}`, { method: 'DELETE' }),
      supabase(c.env, `/orders?${tripFilter}`, { method: 'DELETE' }),
      supabase(c.env, `/email_captures?${tripFilter}`, { method: 'DELETE' }),
    ]);
    await supabase(c.env, `/trips?session_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }

  // Delete usage_records by email
  if (authUser.email) {
    await supabase(c.env, `/usage_records?user_email=eq.${encodeURIComponent(authUser.email)}`, {
      method: 'DELETE',
    });
  }

  // Delete the auth user via Supabase Admin API
  const deleteRes = await fetch(`${c.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!deleteRes.ok) {
    console.error('[DELETE /api/account/delete] Failed to delete auth user:', await deleteRes.text());
    return c.json({ error: 'Failed to delete account' }, 500);
  }

  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. POST /api/regenerate
// ─────────────────────────────────────────────────────────────────────────────
// Regenerates one outfit image for a given city in an existing trip.
// Allowed plans: pro (1 regen lifetime per trip), annual (1 regen per trip).
// Standard plan is not eligible.
//
// Body: { trip_id: string, city: string }
// Auth: Authorization: Bearer <supabase_access_token>  (optional — anonymous
//       access is allowed if the order is verified against the trip_id)
//
// Regen jobs are stored with job_type='regen' (migration 005_add_regen_job_type).
// Quota is enforced by counting generation_jobs rows where job_type='regen'
// for the given trip_id + city combination.

app.post('/api/regenerate', async (c) => {
  // ── 1. Parse and validate body ──────────────────────────────────────────
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).trip_id !== 'string' ||
    typeof (body as Record<string, unknown>).city !== 'string'
  ) {
    return c.json({ error: 'trip_id and city are required' }, 400);
  }

  const { trip_id, city } = body as { trip_id: string; city: string };

  if (!isValidUUID(trip_id)) {
    return c.json({ error: 'invalid_trip_id' }, 400);
  }

  const cityTrimmed = city.trim();
  if (!cityTrimmed || cityTrimmed.length > 100) {
    return c.json({ error: 'city must be a non-empty string (max 100 chars)' }, 400);
  }

  try {
    // ── 2. Look up order: must be paid and belong to this trip ─────────────
    // Note: DB uses status='paid' for fulfilled orders (not 'completed').
    const orderRes = await supabase(
      c.env,
      `/orders?trip_id=eq.${trip_id}&status=eq.paid&limit=1&select=id,plan,customer_email`
    );
    const orders = (await orderRes.json()) as Array<{
      id: string;
      plan: PlanType;
      customer_email: string | null;
    }>;

    if (orders.length === 0) {
      return c.json({ error: 'no_order' }, 403);
    }

    const order = orders[0];

    // ── 3. Standard plan is not eligible ──────────────────────────────────
    if (order.plan === 'standard') {
      return c.json({ error: 'plan_not_eligible' }, 403);
    }

    // ── 4. Check regen quota ───────────────────────────────────────────────
    // Both 'pro' and 'annual' allow exactly 1 regeneration per trip.
    // Regen jobs are identified by job_type='regen' (migration 005).
    //
    // We count existing regen jobs for this trip_id + city combination.
    const regenJobsRes = await supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${trip_id}&city=eq.${encodeURIComponent(cityTrimmed)}&job_type=eq.regen&select=id`,
      {
        headers: {
          // Request a count so we can read the total from content-range
          Prefer: 'count=exact',
        },
      }
    );

    // Parse count from the Content-Range header: "0-0/N" or "*/N"
    const contentRange = regenJobsRes.headers.get('content-range') ?? '';
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const existingRegenCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    if (order.plan === 'annual') {
      // Annual: 1 regen per trip (tracked via generation_jobs, same as Pro)
      // usage_records.trip_count tracks trip quota; regen quota uses generation_jobs
      if (existingRegenCount >= 1) {
        return c.json({ error: 'regen_limit_reached' }, 429);
      }
    }

    if (order.plan === 'pro') {
      // Pro: 1 regen per trip
      if (existingRegenCount >= 1) {
        return c.json({ error: 'regen_limit_reached' }, 429);
      }
    }

    // ── 5. Fetch existing vibe/prompt data for the city ───────────────────
    // Pull vibe_data from trips to reconstruct a StylePrompts-compatible object.
    // If no existing prompt is found we fall back to a generic travel prompt.
    const tripRes = await supabase(
      c.env,
      `/trips?id=eq.${trip_id}&select=vibe_data,cities,month&limit=1`
    );
    const tripRows = (await tripRes.json()) as Array<{
      vibe_data: unknown;
      cities: unknown;
      month: number;
    }>;

    let existingPrompt: string | null = null;
    let existingMood = 'travel-style';

    if (tripRows.length > 0) {
      const tripRow = tripRows[0];
      const vibes = Array.isArray(tripRow.vibe_data)
        ? (tripRow.vibe_data as Array<Record<string, unknown>>)
        : [];
      const cityVibe = vibes.find(
        (v) =>
          typeof v.city === 'string' &&
          v.city.toLowerCase() === cityTrimmed.toLowerCase()
      );
      if (cityVibe) {
        existingMood = (cityVibe.mood_label as string) ?? (cityVibe.mood_name as string) ?? existingMood;
      }
    }

    // Also look up the most recent successful full-gen job prompt for this city
    const promptRes = await supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${trip_id}&city=eq.${encodeURIComponent(cityTrimmed)}&job_type=eq.full&status=eq.completed&order=created_at.desc&limit=1&select=prompt`
    );
    const promptRows = (await promptRes.json()) as Array<{ prompt: string }>;
    if (promptRows.length > 0 && promptRows[0].prompt) {
      existingPrompt = promptRows[0].prompt;
    }

    // Build a StylePrompts-compatible object for imageGenAgent
    // If no stored prompt, fall back to a generic style prompt for the city
    const finalPrompt =
      existingPrompt ??
      `High-quality travel fashion editorial photograph. Location: ${cityTrimmed}. ` +
      `Outfit style: ${existingMood}. Realistic photography, natural lighting, ` +
      `full-body shot, stylish travel attire appropriate for the destination. ` +
      `Professional fashion photography quality.`;

    const stylePrompt = {
      city: cityTrimmed,
      mood: existingMood,
      prompt: finalPrompt,
      negative_prompt:
        'nudity, revealing clothes, cartoon, illustration, anime, painting, sketch, ' +
        'drawing, 3d render, blurry, low quality, nsfw, watermark, text overlay, logo',
    };

    // ── 6. Call imageGenAgent to generate 1 new image ─────────────────────
    // face_url is nulled after initial generation for privacy; not available for regen.
    const { imageGenAgent } = await import('./agents/imageGenAgent');

    const genResult = await imageGenAgent(
      {
        prompts: [stylePrompt],
        tripId: trip_id,
      },
      c.env
    );

    const firstResult = genResult.results[0];

    if (!firstResult || !firstResult.success) {
      const errorMsg =
        firstResult && !firstResult.success ? firstResult.error : 'Image generation failed';
      console.error('[POST /api/regenerate] imageGenAgent failed:', errorMsg);
      return c.json({ error: 'generation_failed', detail: errorMsg }, 500);
    }

    const imageUrl = firstResult.image_url;

    // ── 7. Record the regen job in generation_jobs ─────────────────────────
    // job_type='regen' is now supported by the CHECK constraint
    // (migration 005_add_regen_job_type).
    const insertRes = await supabase(c.env, '/generation_jobs', {
      method: 'POST',
      body: JSON.stringify({
        trip_id,
        city: cityTrimmed,
        job_type: 'regen',
        prompt: finalPrompt,
        negative_prompt: stylePrompt.negative_prompt,
        status: 'completed',
        image_url: imageUrl,
        attempts: 1,
      }),
    });

    if (!insertRes.ok) {
      // Non-fatal: log the error but don't fail the response — the image was generated.
      console.error(
        '[POST /api/regenerate] Failed to insert generation_jobs row:',
        await insertRes.text()
      );
    }

    console.log(
      `[POST /api/regenerate] trip=${trip_id} city="${cityTrimmed}" plan=${order.plan} url=${imageUrl}`
    );

    // ── 8. Return the new image URL ────────────────────────────────────────
    return c.json({
      ok: true,
      image_url: imageUrl,
      city: cityTrimmed,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/regenerate] Unexpected error:', errorMsg);
    return c.json({ error: 'internal_error' }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─── AI Outfit Item Breakdown ─────────────────────────────────────────────────
// Calls Claude haiku to generate structured item lists for each outfit in a city.
// Returns "city::outfit-N" → items[] map.

interface OutfitItemAI {
  name: string;
  category: 'top' | 'bottom' | 'footwear' | 'accessory' | 'outerwear' | 'dress' | 'bag';
  desc: string;
  essential: boolean;
}

interface CityOutfitBreakdown {
  city: string;
  outfits: Array<{ mood: string; title: string; items: OutfitItemAI[] }>;
}

const OUTFIT_CONTEXTS = [
  { key: 'outfit-1', title: 'Day Exploration',       ctx: 'comfortable daytime sightseeing and walking' },
  { key: 'outfit-2', title: 'Smart Casual Evening',  ctx: 'casual bar, wine bar or bistro evening' },
  { key: 'outfit-3', title: 'Cultural Site Visit',   ctx: 'museums, galleries, temples or historic sites' },
  { key: 'outfit-4', title: 'Fine Dining',            ctx: 'upscale restaurant or rooftop dinner' },
] as const;

async function generateOutfitItems(
  cityEntry: { city: string; country: string },
  vibeData: { mood: string; tags: string[] },
  aesthetics: string[],
  gender: string,
  count: number,
  apiKey: string
): Promise<CityOutfitBreakdown> {
  const client = new Anthropic({ apiKey });
  const contexts = OUTFIT_CONTEXTS.slice(0, Math.min(count, 4));
  const stylingNote = aesthetics.length > 0 ? aesthetics.slice(0, 3).join(', ') : vibeData.tags.slice(0, 2).join(', ');

  const prompt = `You are a professional travel stylist. Generate outfit item lists for a ${vibeData.mood} trip to ${cityEntry.city}.

Traveller profile:
- Gender: ${gender}
- Style aesthetic: ${stylingNote}
- City mood tags: ${vibeData.tags.join(', ')}

Generate exactly ${contexts.length} outfits. Each outfit must have 4-5 items. Keep names concise (2-4 words). Make choices realistic for ${cityEntry.city} in this style.

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "outfits": [
    {
      "key": "outfit-1",
      "title": "Day Exploration",
      "items": [
        {"name": "Slim tapered chinos", "category": "bottom", "desc": "Camel tone, cuffed", "essential": true},
        {"name": "Linen shirt", "category": "top", "desc": "Soft white, half-tucked", "essential": true},
        {"name": "Canvas sneakers", "category": "footwear", "desc": "Clean white, minimalist", "essential": true},
        {"name": "Crossbody bag", "category": "bag", "desc": "Tan leather, compact", "essential": false},
        {"name": "Linen blazer", "category": "outerwear", "desc": "Unstructured, ivory", "essential": false}
      ]
    }
  ]
}

Outfits to generate:
${contexts.map((o) => `- key: "${o.key}", title: "${o.title}", context: ${o.ctx}`).join('\n')}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}';
    // Strip potential markdown fences
    const clean = text.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();
    const parsed = JSON.parse(clean) as { outfits: Array<{ key: string; title: string; items: OutfitItemAI[] }> };
    return {
      city: cityEntry.city,
      outfits: parsed.outfits.map((o) => ({ mood: o.key, title: o.title, items: o.items })),
    };
  } catch (err) {
    console.warn(`[generateOutfitItems] Failed for ${cityEntry.city}:`, (err as Error).message);
    return { city: cityEntry.city, outfits: [] };
  }
}

// POST /api/generate
// ─────────────────────────────────────────────────────────────────────────────
// Direct AI outfit image generation from user profile + cities.
// Does NOT require a trip_id or payment — used for pro/annual dashboard
// immediate generation using user's onboarding profile + optional face photo.
//
// Body: {
//   cities: [{city: string, country: string}][],
//   gender: "male"|"female"|"non-binary",
//   height_cm?: number,
//   weight_kg?: number,
//   aesthetics?: string[],
//   face_url?: string,    // R2 URL from /api/upload-photo
//   count_per_city?: number  // default 4
// }

app.post('/api/generate', async (c) => {
  let body: {
    cities?: Array<{ city: string; country: string }>;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    aesthetics?: string[];
    face_url?: string;
    count_per_city?: number;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { cities, gender, height_cm, weight_kg, aesthetics = [], face_url, count_per_city = 4 } = body;

  if (!Array.isArray(cities) || cities.length === 0) {
    return c.json({ error: 'cities array required' }, 400);
  }

  // Validate gender
  const safeGender = (gender === 'male' || gender === 'female' || gender === 'non-binary')
    ? gender : 'female';

  const userProfile = {
    gender: safeGender as 'male' | 'female' | 'non-binary',
    height_cm: typeof height_cm === 'number' && height_cm > 0 ? height_cm : undefined,
    weight_kg: typeof weight_kg === 'number' && weight_kg > 0 ? weight_kg : undefined,
    aesthetics: Array.isArray(aesthetics) ? aesthetics.slice(0, 10) : [],
  };

  // Build minimal vibes from city + aesthetics (no Claude call needed)
  const CITY_VIBES: Record<string, { mood: string; tags: string[] }> = {
    paris:     { mood: 'Parisian Chic',    tags: ['sophisticated', 'effortless', 'layered'] },
    tokyo:     { mood: 'Urban Minimal',    tags: ['clean', 'structured', 'functional'] },
    rome:      { mood: 'Golden Hour',      tags: ['warm tones', 'relaxed elegance', 'Italian flair'] },
    barcelona: { mood: 'Sun-Soaked Bold',  tags: ['colorful', 'vibrant', 'coastal'] },
    milan:     { mood: 'Avant-Garde',      tags: ['sharp silhouettes', 'luxury', 'editorial'] },
    london:    { mood: 'Understated Layer',tags: ['muted tones', 'functional chic', 'layered'] },
    seoul:     { mood: 'Clean Contemporary', tags: ['minimal', 'oversized', 'monochrome'] },
    bali:      { mood: 'Coastal Ease',     tags: ['breezy', 'natural textures', 'relaxed'] },
    istanbul:  { mood: 'Spice & Silk',     tags: ['rich textures', 'vibrant', 'layered'] },
    amsterdam: { mood: 'Nordic Clean',     tags: ['functional', 'understated', 'practical'] },
  };

  // Build style prompts directly for each city (count_per_city each)
  const stylePrompts: Array<{ city: string; mood: string; prompt: string; negative_prompt: string }> = [];
  const NEGATIVE = 'nudity, revealing clothes, cartoon, illustration, anime, painting, sketch, drawing, 3d render, blurry, low quality, nsfw, watermark, text overlay, logo';

  // Resolve model directive from gender
  const modelDirective = safeGender === 'male' ? 'Male model' : safeGender === 'non-binary' ? 'Androgynous model' : 'Female model';
  const heightDesc = (height_cm && height_cm >= 175) ? 'tall slender figure' : (height_cm && height_cm <= 160) ? 'petite figure' : 'average height';
  const bmiNote = (() => {
    if (!height_cm || !weight_kg) return '';
    const bmi = weight_kg / ((height_cm / 100) ** 2);
    if (bmi < 18.5) return 'slender build';
    if (bmi < 25) return 'slim build';
    if (bmi < 30) return 'regular build';
    return 'full-figured silhouette';
  })();
  const profilePrefix = [modelDirective, heightDesc, bmiNote].filter(Boolean).join(', ');

  const OUTFITS = ['day exploration look', 'smart casual evening', 'cultural site visit', 'fine dining outfit'];
  const safeCount = Math.min(Math.max(count_per_city, 1), 6);

  for (const cityEntry of cities.slice(0, 5)) {
    const cityKey = cityEntry.city.toLowerCase().replace(/[^a-z]/g, '');
    const vibeData = CITY_VIBES[cityKey] ?? { mood: `${cityEntry.city} Style`, tags: aesthetics.length > 0 ? aesthetics : ['chic', 'travel-ready'] };
    const aestheticStyle = aesthetics.length > 0 ? aesthetics.slice(0, 3).join(', ') : vibeData.tags.slice(0, 2).join(', ');

    for (let i = 0; i < safeCount; i++) {
      const outfit = OUTFITS[i % OUTFITS.length];
      stylePrompts.push({
        city: cityEntry.city,
        mood: `outfit-${i + 1}`,
        prompt: `${profilePrefix}, ${outfit} in ${cityEntry.city}, ${vibeData.tags.join(', ')}, ${aestheticStyle} style, ${cityEntry.city} street backdrop, professional fashion editorial photography, natural lighting, sharp focus, photorealistic, full body shot`,
        negative_prompt: NEGATIVE,
      });
    }
  }

  // Generate images + outfit item breakdowns in parallel
  const tempTripId = crypto.randomUUID();
  const cityList = cities.slice(0, 5);

  try {
    // imageGenAgent may throw if Gemini key is invalid or network fails
    // Run image gen and item breakdowns in parallel; if image gen fails we
    // still return item breakdowns so the UI has something useful.
    const [imageResult, ...breakdownResults] = await Promise.all([
      imageGenAgent({ prompts: stylePrompts, tripId: tempTripId, faceUrl: face_url }, c.env)
        .catch((err: Error) => {
          console.error('[POST /api/generate] imageGenAgent failed:', err.message);
          return { results: [] as Array<{ city: string; mood: string; success: boolean; image_url?: string; error?: string }>, succeeded: 0, failed: stylePrompts.length };
        }),
      ...cityList.map((cityEntry) => {
        const cityKey = cityEntry.city.toLowerCase().replace(/[^a-z]/g, '');
        const vibeData = CITY_VIBES[cityKey] ?? {
          mood: `${cityEntry.city} Style`,
          tags: aesthetics.length > 0 ? aesthetics : ['chic', 'travel-ready'],
        };
        return generateOutfitItems(cityEntry, vibeData, userProfile.aesthetics, safeGender, safeCount, c.env.ANTHROPIC_API_KEY);
      }),
    ]);

    // Delete face photo from R2 immediately after generation (privacy policy).
    // face_url format: {R2_PUBLIC_URL}/faces/temp-{uuid}.{ext}
    // This is best-effort — a failed deletion must not fail the response.
    if (face_url) {
      try {
        const r2Key = face_url.replace(`${c.env.R2_PUBLIC_URL}/`, '');
        if (r2Key.startsWith('faces/temp-')) {
          await c.env.R2.delete(r2Key);
          console.log(`[POST /api/generate] Deleted face photo: ${r2Key}`);
        }
      } catch (err) {
        console.warn(
          '[POST /api/generate] Failed to delete face photo:',
          (err as Error).message
        );
      }
    }

    // Build "CityName::outfit-N" → items[] lookup
    const outfitItems: Record<string, OutfitItemAI[]> = {};
    for (const breakdown of breakdownResults) {
      for (const outfit of breakdown.outfits) {
        outfitItems[`${breakdown.city}::${outfit.mood}`] = outfit.items;
      }
    }

    return c.json({
      images: imageResult.results,
      succeeded: imageResult.succeeded,
      failed: imageResult.failed,
      outfitItems,   // "Paris::outfit-1" → [{name, category, desc, essential}]
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/generate] Unexpected error:', msg);
    return c.json({ error: 'Generation failed', detail: msg.slice(0, 200) }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility routes (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;

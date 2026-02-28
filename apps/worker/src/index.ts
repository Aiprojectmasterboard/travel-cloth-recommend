import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runPreview, runResult } from './agents/orchestrator';
import { generateUpgradeToken, verifyUpgradeToken } from './agents/growthAgent';

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
 * Polar sends `webhook-signature` as `sha256=<hex>`.
 */
async function verifyHmac(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Polar sends either "sha256=<hex>" or plain "<hex>"
  const normalized = signature.startsWith('sha256=') ? signature.slice(7) : signature;

  if (computedHex.length !== normalized.length) return false;

  // Constant-time comparison via XOR
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ normalized.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── Turnstile Verification ───────────────────────────────────────────────────

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
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

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  '/api/*',
  cors({
    origin: ['https://travelcapsule.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

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
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { session_id, cities, month, face_url, cf_turnstile_token } = body;

  // Input validation
  if (!session_id || typeof session_id !== 'string' || session_id.length > 128) {
    return c.json({ error: 'session_id is required (max 128 chars)' }, 400);
  }
  if (!Array.isArray(cities) || cities.length === 0 || cities.length > 10) {
    return c.json({ error: 'cities must be a non-empty array (max 10)' }, 400);
  }
  if (typeof month !== 'number' || month < 1 || month > 12) {
    return c.json({ error: 'month must be 1–12' }, 400);
  }

  // Turnstile verification (skip in local dev when SKIP_TURNSTILE === "true")
  if (c.env.SKIP_TURNSTILE !== 'true') {
    if (!cf_turnstile_token || typeof cf_turnstile_token !== 'string') {
      return c.json({ error: 'Turnstile token required' }, 403);
    }
    const ok = await verifyTurnstile(cf_turnstile_token, c.env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
    if (!ok) {
      return c.json({ error: 'Turnstile verification failed' }, 403);
    }
  }

  // Rate limit: 5 previews per session_id per calendar day
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const countRes = await supabase(
    c.env,
    `/trips?session_id=eq.${encodeURIComponent(session_id)}&created_at=gte.${todayStart.toISOString()}&select=id`,
    { headers: { Prefer: 'count=exact' } }
  );
  const countHeader = countRes.headers.get('content-range');
  const totalCount = countHeader ? parseInt(countHeader.split('/')[1] ?? '0', 10) : 0;
  if (totalCount >= 5) {
    return c.json({ error: 'Daily limit reached', limit: 5 }, 429);
  }

  // Insert trip row
  const tripPayload = {
    session_id,
    cities,
    month,
    ...(face_url ? { face_url } : {}),
    status: 'pending',
  };
  const insertRes = await supabase(c.env, '/trips', {
    method: 'POST',
    body: JSON.stringify(tripPayload),
  });
  if (!insertRes.ok) {
    return c.json({ error: 'Failed to create trip', detail: await insertRes.text() }, 500);
  }
  const [trip] = (await insertRes.json()) as Array<{ id: string }>;
  const tripId = trip.id;

  // Run preview pipeline (async — results written to DB)
  try {
    const preview = await runPreview(
      { trip_id: tripId, session_id, cities: cities as unknown[], month, face_url },
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
    return c.json({ error: 'Preview generation failed', trip_id: tripId }, 500);
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
  const galleryPreviewUrl = `https://travelcapsule.com/result/${trip_id}`;
  const emailHtml = buildMoodCardEmail(galleryPreviewUrl, teaserUrl);

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Travel Capsule AI <hello@travelcapsule.com>',
      to: [email],
      subject: 'Your Travel Mood Card is Ready',
      html: emailHtml,
    }),
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
  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Valid trip_id required' }, 400);
  }
  if (!plan || !['standard', 'pro', 'annual'].includes(plan)) {
    return c.json({ error: 'plan must be standard | pro | annual' }, 400);
  }
  if (customer_email && !isValidEmail(customer_email)) {
    return c.json({ error: 'Invalid customer_email' }, 400);
  }

  const typedPlan = plan as PlanType;
  const productId = polarProductId(typedPlan, c.env);

  const checkoutPayload: Record<string, unknown> = {
    product_id: productId,
    metadata: { trip_id, plan: typedPlan },
    ...(customer_email ? { customer_email } : {}),
  };

  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutPayload),
  });

  if (!polarRes.ok) {
    console.error('[POST /api/payment/checkout] Polar error:', await polarRes.text());
    return c.json({ error: 'Failed to create checkout session' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };
  return c.json({ checkout_url: session.url, checkout_id: session.id });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/payment/webhook
// ─────────────────────────────────────────────────────────────────────────────
// Polar webhook receiver. Verifies HMAC-SHA256, inserts order, triggers pipeline.

app.post('/api/payment/webhook', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('webhook-signature') ?? c.req.header('x-polar-signature') ?? '';

  const isValid = await verifyHmac(rawBody, signature, c.env.POLAR_WEBHOOK_SECRET);
  if (!isValid) {
    console.warn('[Webhook] Invalid Polar signature');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  let event: {
    type: string;
    data: {
      id: string;
      metadata?: { trip_id?: string; plan?: string };
      amount?: number;
      user?: { email?: string };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (event.type === 'order.paid') {
    const polarOrderId = event.data.id;
    const tripId = event.data.metadata?.trip_id;
    const plan = (event.data.metadata?.plan ?? 'standard') as PlanType;
    const amount = event.data.amount ?? 500;
    const userEmail = event.data.user?.email ?? '';

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

    // Run result pipeline in the background
    c.executionCtx.waitUntil(
      runResult(tripId, plan, userEmail, c.env).catch(async (err: Error) => {
        console.error(`[Webhook] runResult failed for trip ${tripId}:`, err.message);
        await supabase(c.env, `/trips?id=eq.${tripId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'failed' }),
        });
      })
    );
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

  // Create Polar checkout for Pro upgrade (charge the $2 difference via pro product)
  const checkoutPayload = {
    product_id: c.env.POLAR_PRODUCT_ID_PRO,
    metadata: {
      trip_id,
      plan: 'pro',
      upgrade_from: standardOrder.polar_order_id,
    },
  };

  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutPayload),
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
// 7. GET /api/result/:tripId
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

  const [trip, capsule, images] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(c.env, `/capsule_results?trip_id=eq.${tripId}&limit=1`).then((r) =>
      r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&select=city,mood,status,image_url,job_type`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (trip.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const shareUrl = `https://travelcapsule.com/share/${tripId}?utm_source=share&utm_medium=direct`;

  return c.json({
    trip: trip[0],
    order: orders[0],
    capsule: capsule[0] ?? null,
    images,
    share_url: shareUrl,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /api/share/:tripId
// ─────────────────────────────────────────────────────────────────────────────
// Public share page data — teaser image + trip vibe (no auth required).

app.get('/api/share/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) return c.json({ error: 'Invalid trip ID' }, 400);

  const [tripRows, jobRows] = await Promise.all([
    supabase(c.env, `/trips?id=eq.${tripId}&select=id,cities,month,status&limit=1`).then(
      (r) => r.json() as Promise<Array<Record<string, unknown>>>
    ),
    supabase(
      c.env,
      `/generation_jobs?trip_id=eq.${tripId}&job_type=eq.teaser&status=eq.completed&select=city,mood,image_url&limit=1`
    ).then((r) => r.json() as Promise<Array<Record<string, unknown>>>),
  ]);

  if (tripRows.length === 0) return c.json({ error: 'Trip not found' }, 404);

  return c.json({
    trip: tripRows[0],
    teaser: jobRows[0] ?? null,
    cta_url: `https://travelcapsule.com/result/${tripId}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility routes (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;

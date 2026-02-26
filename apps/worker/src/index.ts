import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { orchestrateTrip } from './agents/orchestrator';

// ─── Environment Bindings ─────────────────────────────────────────────────────
// Secrets → `wrangler secret put <NAME>`
// Plain vars → wrangler.toml [vars]
// R2 → wrangler.toml [[r2_buckets]]

export interface Env {
  // Secrets
  ANTHROPIC_API_KEY: string;
  NANOBANANA_API_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_WEBHOOK_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  GOOGLE_PLACES_API_KEY: string;
  // Plain vars (wrangler.toml [vars])
  SUPABASE_URL: string;
  POLAR_PRODUCT_ID: string;
  R2_PUBLIC_URL: string;
  // Native R2 binding (wrangler.toml [[r2_buckets]])
  R2_BUCKET: R2Bucket;
}

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function supabaseRequest(
  env: Env,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}

// ─── Polar HMAC Verification ──────────────────────────────────────────────────

async function verifyPolarSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const expected = `sha256=${computedHex}`;
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

app.use(
  '/api/*',
  cors({
    origin: ['https://travelcapsule.ai', 'https://www.travelcapsule.ai'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── POST /api/uploads/face ───────────────────────────────────────────────────
// Accepts: multipart/form-data with field `file` (image)
// Returns: { face_url } — temporary R2 path, deleted after image generation

app.post('/api/uploads/face', async (c) => {
  const formData = await c.req.formData().catch(() => null);
  if (!formData) return c.json({ error: 'Expected multipart/form-data' }, 400);

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    return c.json({ error: 'Missing file field' }, 400);
  }
  const file = fileEntry as File;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Only JPEG, PNG, WEBP are allowed' }, 415);
  }

  const ext = file.type.split('/')[1];
  const key = `faces/tmp/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  await c.env.R2_BUCKET.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { uploaded_at: new Date().toISOString() },
  });

  const face_url = `${c.env.R2_PUBLIC_URL}/${key}`;
  return c.json({ face_url }, 201);
});

// ─── POST /api/trips ──────────────────────────────────────────────────────────
// Creates a trip record. Caller provides session_id, cities, month.
// face_url is optional (from /api/uploads/face).

app.post('/api/trips', async (c) => {
  let body: { session_id: string; cities: unknown[]; month: number; face_url?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { session_id, cities, month, face_url } = body;

  if (!session_id || !Array.isArray(cities) || cities.length === 0) {
    return c.json({ error: 'session_id and non-empty cities array are required' }, 400);
  }
  if (typeof month !== 'number' || month < 1 || month > 12) {
    return c.json({ error: 'month must be an integer 1-12' }, 400);
  }

  const payload = {
    session_id,
    cities,
    month,
    ...(face_url ? { face_url } : {}),
    status: 'pending',
  };

  const res = await supabaseRequest(c.env, '/trips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return c.json({ error: 'Failed to create trip', detail: await res.text() }, 500);
  }

  const [trip] = (await res.json()) as Array<{ id: string; status: string }>;
  return c.json({ trip_id: trip.id, status: trip.status }, 201);
});

// ─── POST /api/checkout ───────────────────────────────────────────────────────
// Creates a Polar checkout session for the given trip.
// Returns { checkout_url } — redirect the user there.

app.post('/api/checkout', async (c) => {
  let body: { trip_id: string; customer_email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { trip_id, customer_email } = body;
  if (!trip_id) return c.json({ error: 'trip_id is required' }, 400);

  // Verify trip exists
  const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${trip_id}&limit=1`);
  if (!tripRes.ok) return c.json({ error: 'Failed to fetch trip' }, 500);

  const trips = (await tripRes.json()) as Array<{ id: string }>;
  if (trips.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const checkoutPayload: Record<string, unknown> = {
    product_id: c.env.POLAR_PRODUCT_ID,
    metadata: { trip_id },
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
    const err = await polarRes.text();
    console.error('Polar checkout error:', err);
    return c.json({ error: 'Failed to create checkout session' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };
  return c.json({ checkout_url: session.url, checkout_id: session.id });
});

// ─── GET /api/trips/:tripId ───────────────────────────────────────────────────

app.get('/api/trips/:tripId', async (c) => {
  const tripId = c.req.param('tripId');

  const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
  if (!tripRes.ok) return c.json({ error: 'Failed to fetch trip' }, 500);

  const trips = (await tripRes.json()) as Array<Record<string, unknown>>;
  if (trips.length === 0) return c.json({ error: 'Trip not found' }, 404);

  const trip = trips[0];

  if (trip.status === 'completed') {
    const resultRes = await supabaseRequest(
      c.env,
      `/capsule_results?trip_id=eq.${tripId}&limit=1`
    );
    const results = (await resultRes.json()) as Array<Record<string, unknown>>;
    if (results.length > 0) return c.json({ trip, capsule: results[0] });
  }

  // Also attach generation_jobs for progress polling
  const jobsRes = await supabaseRequest(
    c.env,
    `/generation_jobs?trip_id=eq.${tripId}&select=city,mood,status,image_url`
  );
  const jobs = jobsRes.ok ? ((await jobsRes.json()) as unknown[]) : [];

  return c.json({ trip, jobs });
});

// ─── POST /api/trips/:tripId/process ─────────────────────────────────────────
// Manual trigger (dev/admin). Normally triggered by Polar webhook.

app.post('/api/trips/:tripId/process', async (c) => {
  const tripId = c.req.param('tripId');

  const orderRes = await supabaseRequest(
    c.env,
    `/orders?trip_id=eq.${tripId}&status=eq.paid&limit=1`
  );
  if (!orderRes.ok) return c.json({ error: 'Failed to check order status' }, 500);

  const orders = (await orderRes.json()) as Array<{ id: string }>;
  if (orders.length === 0) return c.json({ error: 'No paid order found for this trip' }, 402);

  const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
  const [trip] = (await tripRes.json()) as Array<Record<string, unknown>>;

  await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'processing' }),
  });

  c.executionCtx.waitUntil(
    orchestrateTrip(tripId, trip, c.env).catch(async (err: Error) => {
      console.error(`Orchestration failed for trip ${tripId}:`, err.message);
      await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'failed' }),
      });
    })
  );

  return c.json({ trip_id: tripId, status: 'processing' });
});

// ─── POST /api/webhooks/polar ─────────────────────────────────────────────────

app.post('/api/webhooks/polar', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('X-Polar-Signature') ?? '';

  const isValid = await verifyPolarSignature(rawBody, signature, c.env.POLAR_WEBHOOK_SECRET);
  if (!isValid) return c.json({ error: 'Invalid signature' }, 401);

  let event: {
    type: string;
    data: {
      id: string;
      metadata?: { trip_id?: string };
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
    const amount = event.data.amount ?? 500;
    const userEmail = event.data.user?.email ?? '';

    if (!tripId) return c.json({ error: 'Missing trip_id in order metadata' }, 400);

    // Idempotency: polar_order_id is UNIQUE in DB
    const existingRes = await supabaseRequest(
      c.env,
      `/orders?polar_order_id=eq.${encodeURIComponent(polarOrderId)}&limit=1`
    );
    const existing = (await existingRes.json()) as Array<{ id: string }>;
    if (existing.length > 0) return c.json({ received: true, idempotent: true });

    const orderRes = await supabaseRequest(c.env, '/orders', {
      method: 'POST',
      body: JSON.stringify({ polar_order_id: polarOrderId, trip_id: tripId, status: 'paid', amount }),
    });
    if (!orderRes.ok) {
      console.error('Failed to insert order:', await orderRes.text());
      return c.json({ error: 'Failed to record order' }, 500);
    }

    const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
    const [trip] = (await tripRes.json()) as Array<Record<string, unknown>>;

    if (trip) {
      await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'processing' }),
      });

      c.executionCtx.waitUntil(
        orchestrateTrip(tripId, trip, c.env, userEmail).catch(async (err: Error) => {
          console.error(`Orchestration failed for trip ${tripId}:`, err.message);
          await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'failed' }),
          });
        })
      );
    }
  }

  return c.json({ received: true });
});

// ─── GET /api/cities/search ───────────────────────────────────────────────────

app.get('/api/cities/search', async (c) => {
  const input = c.req.query('input') ?? '';
  if (input.trim().length < 2) return c.json({ predictions: [] });

  const params = new URLSearchParams({
    input: input.trim(),
    types: '(cities)',
    key: c.env.GOOGLE_PLACES_API_KEY,
  });

  const googleRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
  );
  if (!googleRes.ok) return c.json({ error: 'Google Places API error' }, 502);

  const data = (await googleRes.json()) as {
    predictions: Array<{
      place_id: string;
      description: string;
      structured_formatting: { main_text: string; secondary_text: string };
    }>;
  };

  const predictions = (data.predictions ?? []).map((p) => ({
    place_id: p.place_id,
    description: p.description,
    city: p.structured_formatting?.main_text ?? '',
    country: p.structured_formatting?.secondary_text ?? '',
  }));

  return c.json({ predictions });
});

export default app;

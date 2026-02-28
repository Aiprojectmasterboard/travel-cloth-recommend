# Travel Capsule AI -- Technical Specification

> Version 2.0 | 2026-02-28 | Cloudflare Workers + Supabase + Polar

---

## Table of Contents

1. [Worker Routing Structure (Hono)](#1-worker-routing-structure-hono)
2. [Agent Interfaces (9 Agents)](#2-agent-interfaces-9-agents)
3. [TypeScript Type Definitions](#3-typescript-type-definitions)
4. [DB Schema (8 Tables)](#4-db-schema-8-tables)
5. [R2 File Path Rules](#5-r2-file-path-rules)
6. [Turnstile Verification Flow](#6-turnstile-verification-flow)
7. [Cost Optimization Rules](#7-cost-optimization-rules)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js App Router -> Cloudflare Pages |
| API | Cloudflare Workers (Hono) |
| DB | Supabase (Postgres + RLS) |
| Storage | Cloudflare R2 |
| Payment | Polar (MoR) |
| Image Generation | NanoBanana API |
| AI (Style / Capsule / Vibe) | Claude API (`claude-sonnet-4-6-20260219`) |
| Climate Data | Open-Meteo (free, no signup) |
| City Search | Google Places API |
| Email | Resend |
| Bot Protection | Cloudflare Turnstile |

---

## 1. Worker Routing Structure (Hono)

### 1.1 Bindings Type (20 variables)

All environment variables are accessed via Hono context `c.env`. Using `process.env` inside Cloudflare Workers is **strictly prohibited** -- it is undefined at runtime.

```typescript
// apps/worker/src/index.ts

export interface Bindings {
  // ── Secrets (wrangler secret put) ─────────────────────────────────────────
  ANTHROPIC_API_KEY: string;                // Claude API authentication
  NANOBANANA_API_KEY: string;               // NanoBanana image generation
  POLAR_ACCESS_TOKEN: string;               // Polar payment API
  POLAR_WEBHOOK_SECRET: string;             // Webhook HMAC-SHA256 verification
  SUPABASE_SERVICE_ROLE_KEY: string;        // Server-side DB (bypasses RLS)
  R2_ACCESS_KEY_ID: string;                 // R2 S3-compat access key
  R2_SECRET_ACCESS_KEY: string;             // R2 S3-compat secret key
  RESEND_API_KEY: string;                   // Resend email delivery
  GOOGLE_PLACES_API_KEY: string;            // Google Places Autocomplete
  CLOUDFLARE_TURNSTILE_SECRET_KEY: string;  // Turnstile server-side verification

  // ── Plain vars (wrangler.toml [vars]) ─────────────────────────────────────
  SUPABASE_URL: string;                     // e.g., https://xxxx.supabase.co
  POLAR_PRODUCT_ID_STANDARD: string;        // $5 Standard plan product ID
  POLAR_PRODUCT_ID_PRO: string;             // $12 Pro plan product ID
  POLAR_PRODUCT_ID_ANNUAL: string;          // $29/yr Annual plan product ID
  R2_ACCOUNT_ID: string;                    // Cloudflare account ID
  R2_BUCKET_NAME: string;                   // e.g., "travel-capsule"
  R2_PUBLIC_URL: string;                    // e.g., https://assets.travelcapsule.ai
  SKIP_TURNSTILE: string;                   // "true" = bypass (dev only, NEVER in prod)

  // ── Native R2 Binding (wrangler.toml [[r2_buckets]]) ──────────────────────
  R2: R2Bucket;                             // Cloudflare R2 native binding
}

const app = new Hono<{ Bindings: Bindings }>();
```

### 1.2 Middleware

#### CORS Middleware

```typescript
import { cors } from 'hono/cors';

app.use(
  '/api/*',
  cors({
    origin: [
      'https://travelcapsule.com',
      'https://www.travelcapsule.com',
      'https://travelcapsule.ai',
      'https://www.travelcapsule.ai',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);
```

#### Turnstile Verification Middleware

Applied to `POST /api/preview` only. When `SKIP_TURNSTILE === "true"`, verification is bypassed for local development.

```typescript
async function verifyTurnstile(
  token: string,
  secret: string
): Promise<boolean> {
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    }
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

app.use('/api/preview', async (c, next) => {
  // Dev bypass
  if (c.env.SKIP_TURNSTILE === 'true') return next();

  const body = await c.req.json<{ cf_turnstile_token?: string }>();
  const token = body.cf_turnstile_token;

  if (!token) {
    return c.json({ error: 'Turnstile token required' }, 403);
  }

  const valid = await verifyTurnstile(token, c.env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
  if (!valid) {
    return c.json({ error: 'Turnstile verification failed' }, 403);
  }

  return next();
});
```

#### Rate Limit Middleware

Checks the `trips` table for `session_id` + today's date, limiting to 5 free previews per day.

```typescript
async function checkRateLimit(
  sessionId: string,
  env: Bindings
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const res = await supabaseRequest(
    env,
    `/trips?session_id=eq.${encodeURIComponent(sessionId)}&created_at=gte.${today}T00:00:00Z&select=id`,
    { method: 'GET', headers: { Prefer: 'count=exact' } }
  );

  const countHeader = res.headers.get('content-range');
  const total = countHeader
    ? parseInt(countHeader.split('/')[1] ?? '0', 10)
    : 0;

  const MAX_DAILY = 5;
  return { allowed: total < MAX_DAILY, remaining: Math.max(0, MAX_DAILY - total) };
}

app.use('/api/preview', async (c, next) => {
  // Runs AFTER Turnstile middleware
  const body = await c.req.json<{ session_id: string }>();
  const { allowed, remaining } = await checkRateLimit(body.session_id, c.env);

  if (!allowed) {
    return c.json(
      { error: 'Daily limit reached (5/day)', remaining: 0 },
      429
    );
  }

  return next();
});
```

#### Global Error Handler

```typescript
app.onError((err, c) => {
  console.error(`[Worker Error] ${c.req.method} ${c.req.url}:`, err.message);
  return c.json({ error: 'Internal server error' }, 500);
});
```

---

### 1.3 Routes (8 endpoints)

#### Route 1: `GET /api/health`

Health check. No auth required.

```typescript
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});
```

---

#### Route 2: `POST /api/preview`

Main free funnel endpoint. Turnstile + rate limit enforced.

**Request:**
```json
{
  "session_id": "uuid-string",
  "cities": [
    { "name": "Paris", "country": "France", "days": 4, "lat": 48.8566, "lon": 2.3522 }
  ],
  "month": 6,
  "face_url": "https://assets.travelcapsule.ai/faces/tmp/xxx.jpg",
  "cf_turnstile_token": "0.xxxxx"
}
```

**Response (200):**
```json
{
  "trip_id": "uuid",
  "weather": [
    {
      "city": "Paris",
      "temperature_day_avg": 22.3,
      "temperature_night_avg": 14.1,
      "precipitation_prob": 35,
      "diurnal_swing": 8.2,
      "climate_band": "warm",
      "style_hint": "Light layers for warm days, a jacket for cool evenings"
    }
  ],
  "vibe": {
    "mood_name": "Rainy Chic",
    "vibe_tags": ["romantic", "layered", "muted-tones"],
    "color_palette": ["#8B7D6B", "#C4B7A6", "#D4AF37"],
    "avoid_note": "Skip bulky down jackets -- too warm for mild days"
  },
  "teaser": {
    "teaser_url": "https://assets.travelcapsule.ai/temp/{tripId}/teaser.webp",
    "expires_at": "2026-03-02T12:00:00Z",
    "watermark": true
  },
  "capsule_estimate": {
    "count": 10,
    "principles": [
      "Layer for temperature swings",
      "Neutral base + 1 accent color",
      "Wrinkle-resistant fabrics only"
    ]
  }
}
```

```typescript
app.post('/api/preview', async (c) => {
  const body = await c.req.json<PreviewRequest>();
  const { session_id, cities, month, face_url } = body;

  // Input validation
  if (!session_id || typeof session_id !== 'string') {
    return c.json({ error: 'session_id is required' }, 400);
  }
  if (session_id.length > 128) {
    return c.json({ error: 'session_id must be 128 characters or fewer' }, 400);
  }
  if (!Array.isArray(cities) || cities.length === 0) {
    return c.json({ error: 'cities must be a non-empty array' }, 400);
  }
  if (cities.length > 5) {
    return c.json({ error: 'Maximum 5 cities per trip' }, 400);
  }
  if (typeof month !== 'number' || month < 1 || month > 12) {
    return c.json({ error: 'month must be 1-12' }, 400);
  }

  // 1. Create trip record
  const tripRes = await supabaseRequest(c.env, '/trips', {
    method: 'POST',
    body: JSON.stringify({
      session_id,
      cities,
      month,
      ...(face_url ? { face_url } : {}),
      status: 'pending',
    }),
  });

  if (!tripRes.ok) {
    return c.json({ error: 'Failed to create trip' }, 500);
  }

  const [trip] = (await tripRes.json()) as Array<{ id: string }>;
  const tripId = trip.id;

  // 2. Run preview pipeline (free agents)
  const [weatherResults, vibeResult, teaserResult, capsuleEstimate] =
    await orchestratePreview(tripId, { cities, month, face_url }, c.env);

  return c.json({
    trip_id: tripId,
    weather: weatherResults,
    vibe: vibeResult,
    teaser: teaserResult,
    capsule_estimate: capsuleEstimate,
  });
});
```

---

#### Route 3: `POST /api/preview/email`

Email capture micro-conversion. Saves email and sends mood card via Resend.

```typescript
app.post('/api/preview/email', async (c) => {
  const { trip_id, email } = await c.req.json<{
    trip_id: string;
    email: string;
  }>();

  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Invalid trip_id' }, 400);
  }
  if (!email || !isValidEmail(email)) {
    return c.json({ error: 'Invalid email' }, 400);
  }

  // Save email capture
  await supabaseRequest(c.env, '/email_captures', {
    method: 'POST',
    body: JSON.stringify({ trip_id, email }),
  });

  // Send mood card email via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Travel Capsule AI <hello@travelcapsule.ai>',
      to: [email],
      subject: 'Your City Vibe Mood Card',
      html: buildMoodCardEmailHtml(trip_id),
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend email error:', await emailRes.text());
    return c.json({ error: 'Failed to send email' }, 502);
  }

  return c.json({ sent: true });
});
```

---

#### Route 4: `POST /api/payment/checkout`

Creates a Polar checkout session. Accepts `plan` to select the correct product ID.

```typescript
app.post('/api/payment/checkout', async (c) => {
  const { trip_id, plan, customer_email } = await c.req.json<{
    trip_id: string;
    plan: PlanType;
    customer_email?: string;
  }>();

  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Invalid trip_id' }, 400);
  }

  // Map plan -> Polar product ID
  const productIdMap: Record<PlanType, string> = {
    standard: c.env.POLAR_PRODUCT_ID_STANDARD,
    pro: c.env.POLAR_PRODUCT_ID_PRO,
    annual: c.env.POLAR_PRODUCT_ID_ANNUAL,
  };
  const productId = productIdMap[plan];
  if (!productId) {
    return c.json({ error: 'Invalid plan type' }, 400);
  }

  // Annual plan: check 12-trip limit before even creating checkout
  if (plan === 'annual' && customer_email) {
    const { allowed } = await checkAnnualUsage(customer_email, c.env);
    if (!allowed) {
      return c.json(
        { error: 'Annual limit reached (12 trips/year)', code: 'ANNUAL_LIMIT' },
        429
      );
    }
  }

  // Create Polar checkout
  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      metadata: { trip_id, plan },
      ...(customer_email ? { customer_email } : {}),
    }),
  });

  if (!polarRes.ok) {
    console.error('Polar checkout error:', await polarRes.text());
    return c.json({ error: 'Failed to create checkout session' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };
  return c.json({ checkout_url: session.url, checkout_id: session.id });
});
```

---

#### Route 5: `POST /api/payment/webhook`

Polar webhook handler. **HMAC-SHA256 signature verification is mandatory.**

```typescript
app.post('/api/payment/webhook', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('X-Polar-Signature') ?? '';

  // Step 1: HMAC-SHA256 verification
  const isValid = await verifyPolarSignature(
    rawBody,
    signature,
    c.env.POLAR_WEBHOOK_SECRET
  );
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Step 2: Parse event
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (event.type === 'order.paid') {
    const { id: polarOrderId, metadata, amount, user } = event.data;
    const tripId = metadata?.trip_id;
    const plan = (metadata?.plan ?? 'standard') as PlanType;
    const userEmail = user?.email ?? '';

    if (!tripId || !isValidUUID(tripId)) {
      return c.json({ error: 'Invalid trip_id in metadata' }, 400);
    }

    // Step 3: Idempotency -- polar_order_id is UNIQUE in DB
    const existingRes = await supabaseRequest(
      c.env,
      `/orders?polar_order_id=eq.${encodeURIComponent(polarOrderId)}&limit=1`
    );
    const existing = (await existingRes.json()) as Array<{ id: string }>;
    if (existing.length > 0) {
      return c.json({ received: true, idempotent: true });
    }

    // Step 4: Insert order
    const upgradeFrom = metadata?.upgrade_from ?? null;
    await supabaseRequest(c.env, '/orders', {
      method: 'POST',
      body: JSON.stringify({
        polar_order_id: polarOrderId,
        trip_id: tripId,
        plan,
        status: 'paid',
        amount: amount ?? 500,
        customer_email: userEmail,
        ...(upgradeFrom ? { upgrade_from: upgradeFrom } : {}),
      }),
    });

    // Step 5: Update trip status -> processing
    await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'processing' }),
    });

    // Step 6: Annual plan -- increment usage_records
    if (plan === 'annual' && userEmail) {
      await incrementAnnualUsage(userEmail, c.env);
    }

    // Step 7: Trigger full pipeline in background
    const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
    const [trip] = (await tripRes.json()) as Array<Record<string, unknown>>;

    c.executionCtx.waitUntil(
      orchestrateResult(tripId, trip, plan, c.env, userEmail).catch(
        async (err: Error) => {
          console.error(`Orchestration failed for trip ${tripId}:`, err.message);
          await supabaseRequest(c.env, `/trips?id=eq.${tripId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'failed' }),
          });
        }
      )
    );
  }

  return c.json({ received: true });
});
```

**HMAC-SHA256 helper (constant-time comparison):**

```typescript
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
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(body)
  );
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const expected = `sha256=${computedHex}`;
  if (expected.length !== signature.length) return false;

  // Constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
```

---

#### Route 6: `POST /api/payment/upgrade`

Standard -> Pro upgrade. Validates HMAC `upgrade_token` with 3-minute TTL.

```typescript
app.post('/api/payment/upgrade', async (c) => {
  const { trip_id, upgrade_token } = await c.req.json<{
    trip_id: string;
    upgrade_token: string;
  }>();

  if (!trip_id || !isValidUUID(trip_id)) {
    return c.json({ error: 'Invalid trip_id' }, 400);
  }

  // Verify HMAC upgrade_token (3-minute window)
  const isValid = await verifyUpgradeToken(upgrade_token, trip_id, c.env);
  if (!isValid) {
    return c.json({ error: 'Invalid or expired upgrade token' }, 403);
  }

  // Create Polar checkout for Pro upgrade ($7 difference)
  const polarRes = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: c.env.POLAR_PRODUCT_ID_PRO,
      metadata: { trip_id, plan: 'pro', upgrade_from: 'standard' },
    }),
  });

  if (!polarRes.ok) {
    return c.json({ error: 'Failed to create upgrade checkout' }, 502);
  }

  const session = (await polarRes.json()) as { url: string; id: string };
  return c.json({ checkout_url: session.url, checkout_id: session.id });
});
```

---

#### Route 7: `GET /api/result/:tripId`

Returns the full paid result: capsule items, daily plan, images, share data.

```typescript
app.get('/api/result/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) {
    return c.json({ error: 'Invalid trip ID' }, 400);
  }

  // Fetch trip
  const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
  const trips = (await tripRes.json()) as Array<Record<string, unknown>>;
  if (trips.length === 0) {
    return c.json({ error: 'Trip not found' }, 404);
  }
  const trip = trips[0];

  // Verify paid order exists
  const orderRes = await supabaseRequest(
    c.env,
    `/orders?trip_id=eq.${tripId}&status=eq.paid&limit=1`
  );
  const orders = (await orderRes.json()) as Array<{ plan: PlanType }>;
  if (orders.length === 0) {
    return c.json({ error: 'No paid order found' }, 402);
  }

  // Fetch capsule results
  const capsuleRes = await supabaseRequest(
    c.env,
    `/capsule_results?trip_id=eq.${tripId}&limit=1`
  );
  const capsules = (await capsuleRes.json()) as Array<Record<string, unknown>>;

  // Fetch completed generation jobs (images)
  const jobsRes = await supabaseRequest(
    c.env,
    `/generation_jobs?trip_id=eq.${tripId}&status=eq.completed&select=city,mood,image_url`
  );
  const jobs = (await jobsRes.json()) as Array<{
    city: string;
    mood: string;
    image_url: string;
  }>;

  return c.json({
    trip,
    plan: orders[0].plan,
    capsule: capsules[0] ?? null,
    images: jobs,
    share: {
      share_url: `https://travelcapsule.com/share/${tripId}?utm_source=share&utm_medium=direct&utm_campaign=trip_share`,
    },
  });
});
```

---

#### Route 8: `GET /api/share/:tripId`

Public share page data. Returns teaser + limited metadata for viral loop.

```typescript
app.get('/api/share/:tripId', async (c) => {
  const tripId = c.req.param('tripId');
  if (!isValidUUID(tripId)) {
    return c.json({ error: 'Invalid trip ID' }, 400);
  }

  // Fetch trip (public fields only)
  const tripRes = await supabaseRequest(c.env, `/trips?id=eq.${tripId}&limit=1`);
  const trips = (await tripRes.json()) as Array<{
    id: string;
    cities: Array<{ name: string }>;
    month: number;
    status: string;
  }>;

  if (trips.length === 0) {
    return c.json({ error: 'Trip not found' }, 404);
  }
  const trip = trips[0];

  // Fetch teaser image (first completed teaser job)
  const jobRes = await supabaseRequest(
    c.env,
    `/generation_jobs?trip_id=eq.${tripId}&job_type=eq.teaser&status=eq.completed&limit=1&select=image_url,city,mood`
  );
  const teaserJobs = (await jobRes.json()) as Array<{
    image_url: string;
    city: string;
    mood: string;
  }>;

  const cityNames = trip.cities.map((city) => city.name);
  const ogTitle = `My ${cityNames.join(' & ')} Travel Style`;
  const ogDescription = `AI-styled capsule wardrobe for ${cityNames.join(', ')}. Get yours for $5.`;

  return c.json({
    trip_id: trip.id,
    cities: cityNames,
    month: trip.month,
    teaser_url: teaserJobs[0]?.image_url ?? null,
    mood: teaserJobs[0]?.mood ?? null,
    og: {
      title: ogTitle,
      description: ogDescription,
      teaser_url: teaserJobs[0]?.image_url ?? null,
    },
  });
});
```

---

## 2. Agent Interfaces (9 Agents)

All agents reside in `apps/worker/src/agents/`. Every agent receives `env: Bindings` as a parameter. Agents **never** use `process.env`.

---

### 2.1 weatherAgent

Fetches monthly climate data from Open-Meteo archive API. Caches results in `weather_cache` for 24 hours.

```typescript
// apps/worker/src/agents/weatherAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface WeatherInput {
  city: string;
  lat: number;
  lon: number;
  month: number;                    // 1-12
}

// ── Output ──────────────────────────────────────────────────────────────────
interface WeatherResult {
  city: string;
  month: number;
  temperature_day_avg: number;      // Celsius
  temperature_night_avg: number;    // Celsius
  precipitation_prob: number;       // percentage 0-100
  diurnal_swing: number;            // day-night temperature difference
  climate_band: ClimateBand;        // "cold" | "mild" | "warm" | "hot" | "rainy"
  style_hint: string;               // e.g., "Pack layers for 12C temperature swings"
}

// ── Error ───────────────────────────────────────────────────────────────────
interface WeatherError {
  code: 'WEATHER_FETCH_FAILED' | 'WEATHER_PARSE_FAILED' | 'MISSING_COORDINATES';
  message: string;
  city: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function weatherAgent(
  input: WeatherInput,
  env: Bindings
): Promise<WeatherResult>;
```

**Behavior:**
1. Check `weather_cache` for existing entry with `UNIQUE(city, month)` where `cached_at > now() - 24h`.
2. If cache hit -> return cached data immediately.
3. If cache miss -> call Open-Meteo `GET https://archive-api.open-meteo.com/v1/archive` with `latitude`, `longitude`, `monthly` parameters.
4. Classify `climate_band` using:
   ```
   precipitation > 100mm -> "rainy"
   tempMax < 10C         -> "cold"
   tempMax < 18C         -> "mild"
   tempMax <= 26C        -> "warm"
   tempMax > 26C         -> "hot"
   ```
5. Compute `diurnal_swing = temperature_day_avg - temperature_night_avg`.
6. Generate `style_hint` string based on `climate_band` and `diurnal_swing`.
7. Upsert result into `weather_cache` (UPSERT on `UNIQUE(city, month)`).

---

### 2.2 vibeAgent

Uses Claude API (`claude-sonnet-4-6-20260219`) to generate mood naming and vibe analysis for a city.

```typescript
// apps/worker/src/agents/vibeAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface VibeInput {
  city: string;
  country: string;
  weather: WeatherResult;
}

// ── Output ──────────────────────────────────────────────────────────────────
interface VibeResult {
  mood_name: string;                // e.g., "Rainy Chic"
  vibe_tags: [string, string, string]; // exactly 3 tags
  color_palette: string[];          // 3-5 hex codes, e.g., ["#8B7D6B", "#C4B7A6", "#D4AF37"]
  avoid_note: string;               // e.g., "Avoid bulky down jackets - too warm for mild days"
}

// ── Error ───────────────────────────────────────────────────────────────────
interface VibeError {
  code: 'VIBE_GENERATION_FAILED' | 'CLAUDE_API_ERROR' | 'PARSE_FAILED';
  message: string;
  city: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function vibeAgent(
  input: VibeInput,
  env: Bindings
): Promise<VibeResult>;
```

**Behavior:**
1. Construct system prompt: "You are a fashion-forward city culture analyst..."
2. Provide city name, country, weather data, climate band.
3. Request JSON output: `{ mood_name, vibe_tags[3], color_palette[3-5 hex], avoid_note }`.
4. Parse Claude response (strip markdown fences if present).
5. Validate: exactly 3 `vibe_tags`, 3-5 hex codes in `color_palette`.
6. Model: `claude-sonnet-4-6-20260219`, `temperature: 0.7`, `max_tokens: 512`.

---

### 2.3 teaserAgent

Calls NanoBanana API for exactly **1 teaser image**. Saves to R2 `temp/{tripId}/teaser.webp`.

```typescript
// apps/worker/src/agents/teaserAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface TeaserInput {
  tripId: string;
  vibeResult: VibeResult;
  faceUrl?: string;                 // optional face preservation
}

// ── Output ──────────────────────────────────────────────────────────────────
interface TeaserResult {
  teaser_url: string;               // R2 public URL
  expires_at: string;               // ISO8601, 48h from creation
  watermark: true;                  // always true for teaser
}

// ── Error ───────────────────────────────────────────────────────────────────
interface TeaserError {
  code: 'TEASER_GENERATION_FAILED' | 'NANOBANANA_API_ERROR' | 'R2_UPLOAD_FAILED';
  message: string;
  tripId: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function teaserAgent(
  input: TeaserInput,
  env: Bindings
): Promise<TeaserResult>;
```

**Behavior:**
1. Build NanoBanana prompt from `vibeResult.mood_name` + `vibeResult.color_palette`.
2. Call NanoBanana `POST /v1/generate` with `width: 768`, `height: 1024`, `num_inference_steps: 30`.
3. If `faceUrl` provided, include `face_image_url` and `face_preservation_strength: 0.8`.
4. **Only 1 API call.** Remaining 3 teaser slots are CSS `blur(8px)` variations on the frontend.
5. Upload generated image to R2 at key `temp/{tripId}/teaser.webp`.
6. Return `{ teaser_url: "{R2_PUBLIC_URL}/temp/{tripId}/teaser.webp", expires_at: now + 48h, watermark: true }`.
7. The `temp/` prefix is covered by R2 Lifecycle Rule (48h auto-delete).

---

### 2.4 capsuleAgent

Uses Claude API to generate capsule wardrobe. **Behavior differs between free and paid.**

```typescript
// apps/worker/src/agents/capsuleAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface CapsuleInput {
  vibeResult: VibeResult;
  weather: WeatherResult;
  plan: PlanType | 'free';
}

// ── Output ──────────────────────────────────────────────────────────────────
interface CapsuleResult {
  // Free: count + principles only
  count?: number;                   // 9-11 estimated items
  principles?: string[];            // 3 packing principles

  // Paid: full items + daily plan
  items?: CapsuleItem[];            // 8-12 wardrobe items
  daily_plan?: DayPlan[];           // per-day outfit assignments
}

// ── Error ───────────────────────────────────────────────────────────────────
interface CapsuleError {
  code: 'CAPSULE_GENERATION_FAILED' | 'CLAUDE_API_ERROR' | 'PARSE_FAILED';
  message: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function capsuleAgent(
  input: CapsuleInput,
  env: Bindings
): Promise<CapsuleResult>;
```

**Free mode (`plan === "free"`):**
1. Call Claude with lightweight prompt.
2. Request only `count` (9-11) and `principles` (3 strings).
3. `max_tokens: 256` to minimize cost.
4. **Do NOT return `items` or `daily_plan`** -- those are paywalled.

**Paid mode (`plan === "standard" | "pro" | "annual"`):**
1. Call Claude with full capsule generation prompt.
2. Request `items[8-12]` with `{ name, category, why, versatility_score }`.
3. Request `daily_plan` with `{ day, city, outfit[], note }`.
4. `max_tokens: 2048`, `temperature: 0.7`.
5. Validate and clamp item count to 8-12.

---

### 2.5 styleAgent

Pro-tier only. Uses Claude API to generate NanoBanana image prompts (1-2 per city).

```typescript
// apps/worker/src/agents/styleAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface StyleInput {
  vibeResults: VibeResult[];
  cities: CityInput[];
}

// ── Output ──────────────────────────────────────────────────────────────────
interface StylePrompts {
  city: string;
  prompt: string;                   // NanoBanana positive prompt
  mood: string;                     // e.g., "golden-hour-cafe"
}

// ── Error ───────────────────────────────────────────────────────────────────
interface StyleError {
  code: 'STYLE_GENERATION_FAILED' | 'CLAUDE_API_ERROR';
  message: string;
  city: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function styleAgent(
  input: StyleInput,
  env: Bindings
): Promise<StylePrompts[]>;
```

**Behavior:**
1. For each city + corresponding `vibeResult`, construct Claude prompt.
2. Request 1-2 fashion editorial image prompts per city.
3. Include city backdrop, lighting style, climate-appropriate clothing.
4. Model: `claude-sonnet-4-6-20260219`, `temperature: 0.8`, `max_tokens: 1024`.
5. Return flat array of `StylePrompts` (total: `cities.length * 1-2`).

---

### 2.6 imageGenAgent

Calls NanoBanana API for multiple images with exponential backoff retry. Stores in R2.

```typescript
// apps/worker/src/agents/imageGenAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface ImageGenInput {
  prompts: StylePrompts[];
  tripId: string;
  faceUrl?: string;
}

// ── Output ──────────────────────────────────────────────────────────────────
interface GeneratedImages {
  tripId: string;
  images: Array<{
    city: string;
    url: string;                    // R2 public URL
    index: number;
  }>;
  failed: Array<{
    city: string;
    error: string;
  }>;
}

// ── Error ───────────────────────────────────────────────────────────────────
interface ImageGenError {
  code: 'IMAGE_GEN_FAILED' | 'NANOBANANA_API_ERROR' | 'R2_UPLOAD_FAILED' | 'ALL_FAILED';
  message: string;
  tripId: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function imageGenAgent(
  input: ImageGenInput,
  env: Bindings
): Promise<GeneratedImages>;
```

**Behavior:**
1. For each prompt, call NanoBanana `POST /v1/generate`.
2. **Exponential backoff:** delays = `[1000ms, 2000ms, 4000ms]`, max 3 attempts.
3. If NanoBanana returns a job ID (async), poll `GET /v1/jobs/{jobId}` every 5s, max 60 polls (5min timeout).
4. On success: upload to R2 at `outputs/{tripId}/{city}/{i}.webp`.
5. Update `generation_jobs` table: `status = "completed"`, `image_url = R2 URL`.
6. On failure after 3 attempts: `status = "failed"`, `attempts = 3`.
7. **Concurrency limit: max 2 parallel NanoBanana calls** (rate limit protection).
8. Concurrency is implemented via a pool-based worker pattern:

```typescript
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const taskIndex = index++;
      const task = tasks[taskIndex];
      if (task) results[taskIndex] = await task();
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => worker())
  );
  return results;
}
```

---

### 2.7 fulfillmentAgent

Handles post-payment fulfillment: R2 final storage, Resend email, temp file cleanup.

```typescript
// apps/worker/src/agents/fulfillmentAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface FulfillmentInput {
  tripId: string;
  results: {
    capsule: CapsuleResult;
    images: GeneratedImages;
  };
  email?: string;
}

// ── Error ───────────────────────────────────────────────────────────────────
interface FulfillmentError {
  code: 'FULFILLMENT_FAILED' | 'EMAIL_FAILED' | 'R2_CLEANUP_FAILED';
  message: string;
  tripId: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function fulfillmentAgent(
  input: FulfillmentInput,
  env: Bindings
): Promise<void>;
```

**Behavior:**
1. Verify all `generation_jobs` for the trip are completed or failed.
2. Build gallery URL: `https://travelcapsule.com/result/{tripId}`.
3. If `email` provided and valid: send gallery link email via Resend (`POST https://api.resend.com/emails`).
4. **Privacy cleanup:**
   - Derive R2 key from `face_url` (strip origin prefix).
   - Delete `temp/{tripId}/face.jpg` from R2 via native `env.R2.delete(key)`.
   - Set `trips.face_url = NULL` in Supabase regardless of R2 delete success.
5. Delete all remaining `temp/{tripId}/*` files from R2:
   ```typescript
   const objects = await env.R2.list({ prefix: `temp/${tripId}/` });
   const keys = objects.objects.map((obj) => obj.key);
   if (keys.length > 0) await env.R2.delete(keys);
   ```
6. Email failure is **non-fatal**: log error but do not abort pipeline.

---

### 2.8 growthAgent

Generates share links with UTM parameters and HMAC upgrade tokens.

```typescript
// apps/worker/src/agents/growthAgent.ts

// ── Input ───────────────────────────────────────────────────────────────────
interface GrowthInput {
  tripId: string;
  moodName: string;
  plan: PlanType;
}

// ── Output ──────────────────────────────────────────────────────────────────
interface GrowthResult {
  share_url: string;                // UTM-tagged share URL
  upgrade_token: string;            // HMAC token, 3-min TTL (Standard only; empty for Pro/Annual)
  social_copies: SocialCopies;
}

interface SocialCopies {
  twitter: string;                  // 280 chars max
  instagram: string;                // caption-style
  generic: string;                  // universal share text
}

// ── Error ───────────────────────────────────────────────────────────────────
interface GrowthError {
  code: 'GROWTH_FAILED' | 'TOKEN_GENERATION_FAILED';
  message: string;
}

// ── Signature ───────────────────────────────────────────────────────────────
export async function growthAgent(
  input: GrowthInput,
  env: Bindings
): Promise<GrowthResult>;
```

**Behavior:**

1. **Share URL construction:**
   ```
   https://travelcapsule.com/share/{tripId}?utm_source=share&utm_medium=direct&utm_campaign={moodName}
   ```

2. **HMAC upgrade_token generation (Standard plan only):**
   ```typescript
   // Payload: "{tripId}:{unix_timestamp}"
   // Secret:  env.POLAR_WEBHOOK_SECRET (reused for simplicity)
   // Format:  "{hmac_hex}:{unix_timestamp}"
   // TTL:     180 seconds (3 minutes)

   async function generateUpgradeToken(
     tripId: string,
     env: Bindings
   ): Promise<string> {
     const timestamp = Math.floor(Date.now() / 1000).toString();
     const payload = `${tripId}:${timestamp}`;
     const encoder = new TextEncoder();

     const key = await crypto.subtle.importKey(
       'raw',
       encoder.encode(env.POLAR_WEBHOOK_SECRET),
       { name: 'HMAC', hash: 'SHA-256' },
       false,
       ['sign']
     );

     const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
     const hmacHex = Array.from(new Uint8Array(sig))
       .map((b) => b.toString(16).padStart(2, '0'))
       .join('');

     return `${hmacHex}:${timestamp}`;
   }
   ```

3. **Upgrade token verification:**
   ```typescript
   async function verifyUpgradeToken(
     token: string,
     tripId: string,
     env: Bindings
   ): Promise<boolean> {
     const [hmacHex, timestampStr] = token.split(':');
     if (!hmacHex || !timestampStr) return false;

     const timestamp = parseInt(timestampStr, 10);
     const now = Math.floor(Date.now() / 1000);

     // 3-minute TTL check
     if (now - timestamp > 180) return false;

     const payload = `${tripId}:${timestampStr}`;
     const encoder = new TextEncoder();
     const key = await crypto.subtle.importKey(
       'raw',
       encoder.encode(env.POLAR_WEBHOOK_SECRET),
       { name: 'HMAC', hash: 'SHA-256' },
       false,
       ['sign']
     );
     const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
     const computed = Array.from(new Uint8Array(sig))
       .map((b) => b.toString(16).padStart(2, '0'))
       .join('');

     // Constant-time comparison
     if (computed.length !== hmacHex.length) return false;
     let mismatch = 0;
     for (let i = 0; i < computed.length; i++) {
       mismatch |= computed.charCodeAt(i) ^ hmacHex.charCodeAt(i);
     }
     return mismatch === 0;
   }
   ```

4. For Pro/Annual plans, `upgrade_token` is returned as an empty string `""`.

5. **Social copy generation:**
   ```typescript
   const social_copies: SocialCopies = {
     twitter: `Just got my AI travel wardrobe for ${moodName}! Pack smarter. ${shareUrl}`,
     instagram: `My ${moodName} travel capsule is ready.\nAI-styled outfits for every day of the trip.\nGet yours at travelcapsule.com`,
     generic: `Check out my AI-styled travel wardrobe: ${shareUrl}`,
   };
   ```

---

### 2.9 orchestrator

Coordinates the `/api/preview` (free) and `/api/result` (paid) flows.

```typescript
// apps/worker/src/agents/orchestrator.ts

// ── Preview flow (free) ─────────────────────────────────────────────────────
export async function orchestratePreview(
  tripId: string,
  input: { cities: CityInput[]; month: number; face_url?: string },
  env: Bindings
): Promise<[WeatherResult[], VibeResult, TeaserResult, CapsuleResult]>;

// ── Result flow (paid, triggered by webhook) ────────────────────────────────
export async function orchestrateResult(
  tripId: string,
  tripData: Record<string, unknown>,
  plan: PlanType,
  env: Bindings,
  userEmail?: string
): Promise<void>;
```

**Preview flow (`/api/preview`):**

```
Step 1: weatherAgent(city, lat, lon, month)  -- parallel for ALL cities
Step 2: vibeAgent(city, country, weather)    -- first/primary city (single mood)
Step 3: teaserAgent(tripId, vibeResult, faceUrl?)  -- 1 NanoBanana call
Step 4: capsuleAgent(vibeResult, weather, "free")  -- count + principles only
   -> return [weatherResults[], vibeResult, teaserResult, capsuleEstimate]
```

**Result flow (`/api/payment/webhook` -> `orchestrateResult`):**

```
Step 1: weatherAgent   -- parallel for all cities (likely cache hits)
Step 2: vibeAgent      -- parallel for all cities
Step 3: IF plan === "pro" || plan === "annual":
           styleAgent(vibeResults, cities)            -- Claude prompts
           imageGenAgent(prompts, tripId, faceUrl)    -- NanoBanana multi-call
        ELSE (standard):
           // Teaser already generated; just unlock it (no new API calls)
Step 4: capsuleAgent(vibeResult, weather, plan)       -- full items + daily_plan
Step 5: fulfillmentAgent(tripId, results, email)      -- R2 + Resend + cleanup
Step 6: growthAgent(tripId, moodName, plan)           -- share links + upgrade token
Step 7: UPDATE trips SET status = 'completed'
```

**Annual 12-trip limit enforcement (in result flow):**

```typescript
// BEFORE calling imageGenAgent (the expensive step)
if (plan === 'annual' && userEmail) {
  const { allowed, remaining } = await checkAnnualUsage(userEmail, env);
  if (!allowed) {
    throw new AnnualLimitError(
      `Annual limit reached: 12 trips/year. Remaining: ${remaining}`
    );
  }
}
```

---

## 3. TypeScript Type Definitions

All shared types live in `packages/types/index.ts`.

```typescript
// packages/types/index.ts

// ═══════════════════════════════════════════════════════════════════════════════
// Enums / Unions
// ═══════════════════════════════════════════════════════════════════════════════

export type PlanType = 'standard' | 'pro' | 'annual';

export type TripStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'expired'
  | 'failed';

export type OrderStatus = 'pending' | 'paid' | 'refunded';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type JobType = 'teaser' | 'full';

export type ClimateBand = 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';

// ═══════════════════════════════════════════════════════════════════════════════
// Input Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CityInput {
  name: string;
  country: string;
  days: number;
  lat?: number;
  lon?: number;
}

export interface TripInput {
  session_id: string;
  cities: CityInput[];
  month: number;                        // 1-12
  face_url?: string;
  cf_turnstile_token: string;
}

export interface PreviewRequest {
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  cf_turnstile_token: string;
}

export interface CheckoutRequest {
  trip_id: string;
  plan: PlanType;
  customer_email?: string;
}

export interface UpgradeRequest {
  trip_id: string;
  upgrade_token: string;
}

export interface EmailCaptureRequest {
  trip_id: string;
  email: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DB Row Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface Trip {
  id: string;
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  status: TripStatus;
  expires_at?: string;                  // ISO8601
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  polar_order_id: string;              // UNIQUE -- idempotency key
  trip_id: string;
  plan: PlanType;
  status: OrderStatus;
  amount: number;                       // cents (500 = $5.00)
  customer_email?: string;
  upgrade_from?: PlanType;              // nullable -- tracks Standard->Pro upgrades
  created_at: string;
}

export interface GenerationJob {
  id: string;
  trip_id: string;
  city: string;
  mood: string;
  job_type: JobType;                    // "teaser" | "full"
  prompt: string;
  negative_prompt?: string;
  status: JobStatus;
  image_url?: string;
  attempts: number;                     // default 0, max 3
  created_at: string;
  updated_at: string;
}

export interface CapsuleResultRow {
  id: string;
  trip_id: string;                      // UNIQUE
  items: CapsuleItem[];
  daily_plan: DayPlan[];
  created_at: string;
}

export interface CityVibe {
  id: string;
  city: string;                         // UNIQUE
  country: string;
  lat: number;
  lon: number;
  vibe_cluster: string;
  style_keywords: string[];
  mood_name?: string;
}

export interface WeatherCache {
  id: string;
  city: string;
  month: number;
  data: WeatherResult;                  // JSONB
  cached_at: string;                    // UNIQUE(city, month) for upsert
}

export interface EmailCapture {
  id: string;
  trip_id: string;
  email: string;
  captured_at: string;
}

export interface UsageRecord {
  id: string;
  user_email: string;
  plan: 'annual';
  trip_count: number;                   // incremented per trip, max 12
  period_start: string;                 // ISO8601
  period_end: string;                   // ISO8601
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Agent Result Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface WeatherResult {
  city: string;
  month: number;
  temperature_day_avg: number;          // Celsius
  temperature_night_avg: number;        // Celsius
  precipitation_prob: number;           // 0-100
  diurnal_swing: number;                // day-night difference
  climate_band: ClimateBand;
  style_hint: string;
}

export interface VibeResult {
  mood_name: string;                    // e.g., "Rainy Chic"
  vibe_tags: [string, string, string];  // exactly 3
  color_palette: string[];              // 3-5 hex codes
  avoid_note: string;
}

export interface TeaserResult {
  teaser_url: string;                   // R2 public URL
  expires_at: string;                   // ISO8601, 48h
  watermark: true;
}

export interface CapsuleItem {
  name: string;
  category: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'dress/jumpsuit' | 'accessory';
  why: string;
  versatility_score: number;            // 1-10
}

export interface DayPlan {
  day: number;
  city: string;
  outfit: string[];                     // item names from CapsuleItem[]
  note: string;
}

export interface CapsuleResult {
  // Free plan: count + principles only
  count?: number;                       // 9-11
  principles?: string[];                // 3 packing principles

  // Paid plan: full data
  items?: CapsuleItem[];                // 8-12 items
  daily_plan?: DayPlan[];
}

export interface StylePrompts {
  city: string;
  prompt: string;                       // NanoBanana positive prompt
  mood: string;                         // e.g., "golden-hour-cafe"
}

export interface GeneratedImages {
  tripId: string;
  images: Array<{
    city: string;
    url: string;                        // R2 public URL
    index: number;
  }>;
  failed: Array<{
    city: string;
    error: string;
  }>;
}

export interface OrderResult {
  order_id: string;
  polar_order_id: string;
  trip_id: string;
  plan: PlanType;
  status: OrderStatus;
  checkout_url?: string;
}

export interface SocialCopies {
  twitter: string;                      // 280 chars max
  instagram: string;
  generic: string;
}

export interface GrowthResult {
  share_url: string;
  upgrade_token: string;                // empty string for Pro/Annual
  social_copies: SocialCopies;
}

export interface ShareResult {
  share_url: string;
  og_title: string;
  og_description: string;
  teaser_url: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Webhook Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebhookEvent {
  type: 'order.paid' | 'order.refunded';
  data: {
    id: string;
    metadata?: {
      trip_id?: string;
      plan?: PlanType;
      upgrade_from?: PlanType;
    };
    amount?: number;
    user?: {
      email?: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentError {
  code: string;
  message: string;
  agent: string;
  tripId?: string;
  city?: string;
}

export class AnnualLimitError extends Error {
  code = 'ANNUAL_LIMIT_EXCEEDED' as const;
  constructor(message: string) {
    super(message);
    this.name = 'AnnualLimitError';
  }
}
```

---

## 4. DB Schema (8 Tables)

### 4.1 Complete CREATE TABLE SQL

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Travel Capsule AI -- Full Database Schema
-- supabase/migrations/001_initial_schema.sql
-- 8 tables, RLS on all, indexes, triggers
-- Idempotent: uses IF NOT EXISTS / CREATE OR REPLACE throughout
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── Helper: updated_at trigger function ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 1: trips
-- One row per user styling session.
-- face_url MUST be set to NULL after image generation (privacy requirement).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trips (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL,
  cities      JSONB       NOT NULL DEFAULT '[]',
  -- cities structure: [{"name":"Paris","country":"France","days":4,"lat":48.85,"lon":2.35}]
  month       INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  face_url    TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','processing','completed','failed','expired')),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 2: orders
-- One row per Polar payment.
-- polar_order_id UNIQUE enforces webhook idempotency.
-- upgrade_from tracks Standard->Pro upgrades.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  polar_order_id   TEXT        NOT NULL UNIQUE,
  trip_id          UUID        NOT NULL REFERENCES trips(id),
  plan             TEXT        NOT NULL DEFAULT 'standard'
                               CHECK (plan IN ('standard','pro','annual')),
  status           TEXT        NOT NULL DEFAULT 'paid'
                               CHECK (status IN ('pending','paid','refunded')),
  amount           INTEGER     NOT NULL DEFAULT 500,
  -- amount stored in cents: 500 = $5.00, 1200 = $12.00, 2900 = $29.00
  customer_email   TEXT,
  upgrade_from     TEXT        CHECK (upgrade_from IS NULL
                               OR upgrade_from IN ('standard','pro')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 3: generation_jobs
-- One row per image generation task.
-- job_type: "teaser" (free preview) or "full" (paid generation).
-- attempts tracks retries (max 3, exponential backoff).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS generation_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city            TEXT        NOT NULL,
  mood            TEXT        NOT NULL,
  job_type        TEXT        NOT NULL DEFAULT 'full'
                              CHECK (job_type IN ('teaser','full')),
  prompt          TEXT,
  negative_prompt TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','completed','failed')),
  image_url       TEXT,
  attempts        INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 4: capsule_results
-- One row per trip (trip_id UNIQUE).
-- items: [{name, category, why, versatility_score}]
-- daily_plan: [{day, city, outfit[], note}]
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capsule_results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  items       JSONB       NOT NULL DEFAULT '[]',
  daily_plan  JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 5: city_vibes
-- Reference/seed data for 30+ cities. Read-only from client.
-- mood_name: vibeAgent-generated mood (e.g., "Rainy Chic").
-- style_keywords: TEXT[] (Postgres native array) -- flat list, GIN-indexed.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS city_vibes (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  city           TEXT         NOT NULL UNIQUE,
  country        TEXT         NOT NULL,
  lat            NUMERIC(9,6) NOT NULL,
  lon            NUMERIC(9,6) NOT NULL,
  vibe_cluster   TEXT         NOT NULL,
  style_keywords TEXT[]       NOT NULL DEFAULT '{}',
  mood_name      TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 6: weather_cache
-- UNIQUE(city, month) enables upsert-based caching.
-- Cached for 24 hours (checked in weatherAgent at query time).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS weather_cache (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city      TEXT        NOT NULL,
  month     INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  data      JSONB       NOT NULL,
  -- data structure: {temperature_day_avg, temperature_night_avg, precipitation_prob, ...}
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(city, month)
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 7: email_captures
-- Micro-conversion: email captured at the preview/email step.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_captures (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID        NOT NULL REFERENCES trips(id),
  email       TEXT        NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE 8: usage_records
-- Annual plan: tracks trip_count per subscription period.
-- Server-side only. Frontend NEVER enforces this limit.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS usage_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT        NOT NULL,
  plan         TEXT        NOT NULL DEFAULT 'annual'
                           CHECK (plan IN ('annual')),
  trip_count   INTEGER     NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.2 RLS Policies

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS: Enable on ALL 8 tables
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsule_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_vibes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records    ENABLE ROW LEVEL SECURITY;


-- ── service_role: ALL on every table ────────────────────────────────────────
-- service_role bypasses RLS automatically in Supabase.
-- All Worker writes use SUPABASE_SERVICE_ROLE_KEY.
-- No explicit policy needed for service_role.


-- ── anon: trips -- SELECT + INSERT ──────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "trips_anon_select" ON trips
    FOR SELECT TO anon
    USING (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trips_anon_insert" ON trips
    FOR INSERT TO anon
    WITH CHECK (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: orders -- NO ACCESS ───────────────────────────────────────────────
-- Orders are write-only from service_role (Polar webhook).
-- No anon policy = no access.


-- ── anon: generation_jobs -- SELECT only ────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "generation_jobs_anon_select" ON generation_jobs
    FOR SELECT TO anon
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE session_id = current_setting('app.session_id', true)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: capsule_results -- SELECT only ────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "capsule_results_anon_select" ON capsule_results
    FOR SELECT TO anon
    USING (
      trip_id IN (
        SELECT id FROM trips
        WHERE session_id = current_setting('app.session_id', true)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: city_vibes -- SELECT (public reference data) ──────────────────────

DO $$ BEGIN
  CREATE POLICY "city_vibes_public_read" ON city_vibes
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: weather_cache -- SELECT (public cache) ────────────────────────────

DO $$ BEGIN
  CREATE POLICY "weather_cache_public_read" ON weather_cache
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: email_captures -- INSERT only ─────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "email_captures_anon_insert" ON email_captures
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── anon: usage_records -- SELECT only ──────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "usage_records_anon_select" ON usage_records
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

### 4.3 Indexes

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

-- trips
CREATE INDEX IF NOT EXISTS idx_trips_session_id  ON trips(session_id);
CREATE INDEX IF NOT EXISTS idx_trips_status       ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at   ON trips(created_at);

-- orders (polar_order_id already has UNIQUE index)
CREATE INDEX IF NOT EXISTS idx_orders_trip_id         ON orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_orders_polar_order_id  ON orders(polar_order_id);

-- generation_jobs
CREATE INDEX IF NOT EXISTS idx_generation_jobs_trip_id ON generation_jobs(trip_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status  ON generation_jobs(status);

-- capsule_results
CREATE INDEX IF NOT EXISTS idx_capsule_results_trip_id ON capsule_results(trip_id);

-- city_vibes
CREATE INDEX IF NOT EXISTS idx_city_vibes_city ON city_vibes(city);

-- weather_cache (UNIQUE(city, month) already creates index)
CREATE INDEX IF NOT EXISTS idx_weather_cache_city_month ON weather_cache(city, month);

-- email_captures
CREATE INDEX IF NOT EXISTS idx_email_captures_trip_id ON email_captures(trip_id);

-- usage_records
CREATE INDEX IF NOT EXISTS idx_usage_records_user_email_plan ON usage_records(user_email, plan);
CREATE INDEX IF NOT EXISTS idx_usage_records_period          ON usage_records(period_end);
```

---

## 5. R2 File Path Rules

### 5.1 Path Structure

```
R2 Bucket: travel-capsule
│
├── temp/{tripId}/
│   ├── face.jpg              # Original face photo -- DELETED after image generation
│   └── teaser.webp           # Free teaser image (1 real NanoBanana call)
│                              # R2 Lifecycle Rule: 48h TTL auto-delete
│
└── outputs/{tripId}/
    └── {city}/
        ├── 0.webp            # Paid generated image #0
        ├── 1.webp            # Paid generated image #1
        └── ...               # Up to 6 images per city (Pro plan)
                              # Permanent storage -- no auto-delete
```

### 5.2 Public URL Access

All public URLs follow the pattern:

```
{R2_PUBLIC_URL}/{path}
```

Examples:
```
https://assets.travelcapsule.ai/temp/550e8400-e29b-41d4-a716-446655440000/teaser.webp
https://assets.travelcapsule.ai/outputs/550e8400-e29b-41d4-a716-446655440000/Paris/0.webp
```

### 5.3 Upload (Native R2 Binding)

```typescript
// Upload face photo
await env.R2.put(
  `temp/${tripId}/face.jpg`,
  imageArrayBuffer,
  {
    httpMetadata: { contentType: 'image/jpeg' },
    customMetadata: { trip_id: tripId, uploaded_at: new Date().toISOString() },
  }
);

// Upload teaser image
await env.R2.put(
  `temp/${tripId}/teaser.webp`,
  imageBuffer,
  {
    httpMetadata: { contentType: 'image/webp' },
    customMetadata: { trip_id: tripId, type: 'teaser' },
  }
);

// Upload final output image
await env.R2.put(
  `outputs/${tripId}/${city}/${index}.webp`,
  imageBuffer,
  {
    httpMetadata: { contentType: 'image/webp' },
    customMetadata: { trip_id: tripId, city, mood },
  }
);
```

### 5.4 Deletion

```typescript
// Delete single object
await env.R2.delete(`temp/${tripId}/face.jpg`);

// Delete all temp files for a trip (batch)
const objects = await env.R2.list({ prefix: `temp/${tripId}/` });
const keys = objects.objects.map((obj) => obj.key);
if (keys.length > 0) {
  await env.R2.delete(keys);
}
```

### 5.5 R2 Lifecycle Rule Configuration

Configured in **Cloudflare Dashboard** (not in code):

| Prefix | TTL | Behavior |
|--------|-----|----------|
| `temp/` | 48 hours | Auto-delete all objects after 48h |
| `outputs/` | -- | Permanent retention (no lifecycle rule) |

**Setup path:** Cloudflare Dashboard -> R2 -> `travel-capsule` bucket -> Settings -> Lifecycle Rules -> Add Rule:
- **Filter prefix:** `temp/`
- **Action:** Delete objects after 2 days (48 hours)
- **Apply to:** Current and future objects

This serves as a safety net. The `fulfillmentAgent` actively deletes temp files after image generation, but the lifecycle rule catches any objects missed due to errors.

---

## 6. Turnstile Verification Flow

### 6.1 Frontend Widget Integration

```tsx
// apps/web/components/funnel/TurnstileWidget.tsx
'use client';

import Script from 'next/script';
import { useEffect, useRef, useState, useCallback } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    // turnstile is injected globally by the Cloudflare script
    (window as any).turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!,
      callback: (token: string) => onVerify(token),
      theme: 'light',
    });
  }, [loaded, onVerify]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={handleLoad}
        strategy="lazyOnload"
      />
      <div ref={containerRef} />
    </>
  );
}
```

Alternative static HTML approach:

```html
<div
  class="cf-turnstile"
  data-sitekey="{NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}"
></div>
```

The widget produces a `cf_turnstile_token` string, included in the `POST /api/preview` request body.

### 6.2 Worker Server-Side Verification

```typescript
// apps/worker/src/middleware/turnstile.ts

interface TurnstileSiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token: string,
  secretKey: string
): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    }
  );

  if (!response.ok) {
    console.error('[Turnstile] siteverify HTTP error:', response.status);
    return false;
  }

  const data = (await response.json()) as TurnstileSiteverifyResponse;

  if (!data.success) {
    console.warn('[Turnstile] Verification failed:', data['error-codes']);
  }

  return data.success === true;
}
```

### 6.3 Complete Flow

```
Frontend (Next.js on Cloudflare Pages)          Worker (Hono on Cloudflare Workers)
──────────────────────────────────────          ────────────────────────────────────

1. Render Turnstile widget:
   <div class="cf-turnstile"
        data-sitekey={SITE_KEY}>

2. User passes invisible challenge
   -> cf_turnstile_token (string)

3. POST /api/preview
   {
     session_id: "...",
     cities: [...],
     month: 6,
     cf_turnstile_token: "0.xxxxx"
   }
                                        4. Extract cf_turnstile_token from body

                                        5. Check SKIP_TURNSTILE:
                                           IF env.SKIP_TURNSTILE === "true"
                                              -> SKIP verification (dev only)
                                           ELSE
                                              -> Continue to step 6

                                        6. POST https://challenges.cloudflare.com/
                                                turnstile/v0/siteverify
                                           body: {
                                             secret: env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
                                             response: cf_turnstile_token
                                           }

                                        7. IF response.success !== true
                                              -> 403 {"error":"Turnstile verification failed"}
                                           ELSE
                                              -> Continue to rate limit check
                                              -> Continue to preview pipeline
```

### 6.4 Error Response

When Turnstile fails:

```json
HTTP 403 Forbidden

{
  "error": "Turnstile verification failed"
}
```

### 6.5 Local Development Bypass

In `.env.local`:
```
SKIP_TURNSTILE=true
```

In `wrangler.toml` for local `wrangler dev`:
```toml
[vars]
SKIP_TURNSTILE = "true"
```

**CRITICAL:** `SKIP_TURNSTILE` must **never** be `"true"` in production. The production `wrangler.toml` either omits this variable or sets it to `"false"`. In code, the check is `=== "true"` (strict equality), so `undefined` and `"false"` both enforce Turnstile normally.

---

## 7. Cost Optimization Rules

### 7.1 Teaser Image: NanoBanana 1-Call Rule

The single most impactful cost optimization. Free preview generates **exactly 1 real image** via NanoBanana API.

**Backend (teaserAgent):**
- Calls NanoBanana API **once**.
- Produces 1 image at `temp/{tripId}/teaser.webp`.

**Frontend (TeaserGrid 2x2):**
- `[0]` = real image (sharp, no filter)
- `[1][2][3]` = **same image** + CSS `filter: blur(8px)` + absolute tint overlay + lock icon
- **Zero additional API calls** for positions 1-3.

```tsx
// apps/web/components/funnel/TeaserGrid.tsx

function TeaserGrid({ teaserUrl }: { teaserUrl: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Position 0: Real image (sharp) */}
      <div className="relative rounded-xl overflow-hidden aspect-[3/4]">
        <img
          src={teaserUrl}
          alt="Your travel look"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Positions 1, 2, 3: CSS blur variations (no API call) */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="relative rounded-xl overflow-hidden aspect-[3/4]"
        >
          <img
            src={teaserUrl}
            alt="Locked look"
            className="w-full h-full object-cover"
            style={{ filter: 'blur(8px)' }}
          />
          {/* Tint overlay */}
          <div className="absolute inset-0 bg-cream/40" />
          {/* Lock icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-secondary/60">
              lock
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Cost comparison:**

| Strategy | NanoBanana API Calls | Cost per Preview |
|----------|---------------------|-----------------|
| 4 real images | 4 | ~$0.08-0.12 |
| 1 real + 3 CSS blur | **1** | ~$0.01-0.03 |
| **Savings** | **-75%** | **~$0.06-0.09/preview** |

---

### 7.2 Weather Cache: 24-Hour TTL

Weather data changes slowly. The `weather_cache` table with `UNIQUE(city, month)` prevents redundant Open-Meteo API calls.

```typescript
// Inside weatherAgent:

async function getCachedWeather(
  city: string,
  month: number,
  env: Bindings
): Promise<WeatherResult | null> {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const res = await supabaseRequest(
    env,
    `/weather_cache?city=eq.${encodeURIComponent(city)}&month=eq.${month}&cached_at=gte.${twentyFourHoursAgo}`
  );

  const rows = (await res.json()) as Array<{ data: WeatherResult }>;
  return rows.length > 0 ? rows[0].data : null;
}

async function upsertWeatherCache(
  city: string,
  month: number,
  data: WeatherResult,
  env: Bindings
): Promise<void> {
  await supabaseRequest(env, '/weather_cache', {
    method: 'POST',
    headers: {
      // UPSERT: on UNIQUE(city, month) conflict, merge/update
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      city,
      month,
      data,
      cached_at: new Date().toISOString(),
    }),
  });
}
```

**Impact:** For popular cities (Paris, Tokyo, New York, etc.), weather API calls drop to ~1/day per city-month combination instead of 1 per user request.

---

### 7.3 Annual Plan: 12-Trip Server-Side Enforcement

The 12-trip annual limit is enforced **exclusively server-side**. The frontend may display remaining count for UX, but the backend is the sole authority.

```typescript
// Shared helper used in checkout AND orchestrator

async function checkAnnualUsage(
  email: string,
  env: Bindings
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date().toISOString();
  const res = await supabaseRequest(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(email)}&plan=eq.annual&period_end=gte.${now}&select=trip_count`
  );

  const records = (await res.json()) as Array<{ trip_count: number }>;
  if (records.length === 0) {
    return { allowed: true, remaining: 12 };
  }

  const used = records[0].trip_count;
  return {
    allowed: used < 12,
    remaining: Math.max(0, 12 - used),
  };
}

// Increment after successful generation

async function incrementAnnualUsage(
  email: string,
  env: Bindings
): Promise<void> {
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const res = await supabaseRequest(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(email)}&plan=eq.annual&period_end=gte.${now.toISOString()}`,
    { method: 'GET' }
  );

  const records = (await res.json()) as Array<{ id: string; trip_count: number }>;

  if (records.length > 0) {
    // Increment existing record
    await supabaseRequest(
      env,
      `/usage_records?id=eq.${records[0].id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ trip_count: records[0].trip_count + 1 }),
      }
    );
  } else {
    // Create new annual period record
    await supabaseRequest(env, '/usage_records', {
      method: 'POST',
      body: JSON.stringify({
        user_email: email,
        plan: 'annual',
        trip_count: 1,
        period_start: now.toISOString(),
        period_end: yearEnd.toISOString(),
      }),
    });
  }
}
```

**Enforcement points (all server-side, never frontend):**

| Checkpoint | Location | Timing |
|-----------|----------|--------|
| Pre-checkout | `POST /api/payment/checkout` | Before creating Polar session |
| Pre-generation | `orchestrateResult()` | Before calling `imageGenAgent` |
| Response | HTTP 429 | `{ "error": "Annual limit reached (12 trips/year)", "code": "ANNUAL_LIMIT" }` |

---

### 7.4 Claude API Token Minimization

| Agent | Model | temperature | max_tokens | Rationale |
|-------|-------|------------|------------|-----------|
| vibeAgent | `claude-sonnet-4-6-20260219` | 0.7 | 512 | Small JSON (mood + 3 tags + palette) |
| capsuleAgent (free) | `claude-sonnet-4-6-20260219` | 0.7 | 256 | Count + 3 principles only |
| capsuleAgent (paid) | `claude-sonnet-4-6-20260219` | 0.7 | 2048 | Full items[8-12] + daily_plan |
| styleAgent | `claude-sonnet-4-6-20260219` | 0.8 | 1024 | 1-2 NanoBanana prompts per city |

**Additional rules:**
- All agents use `claude-sonnet-4-6-20260219` exclusively (not Opus, not Haiku).
- Every system prompt ends with `"Respond with valid JSON only -- no markdown, no extra text."` to minimize non-JSON token output.
- JSON responses are parsed with defensive markdown-fence stripping:
  ```typescript
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  ```

---

### 7.5 Cost Summary per Plan

| Plan | Price | NanoBanana Calls | Claude Calls | Estimated API Cost | Margin |
|------|-------|-----------------|-------------|-------------------|--------|
| Free preview | $0 | 1 (teaser) | 2 (vibe + capsule-free) | ~$0.04 | Loss leader |
| Standard | $5 | 0 (unlock existing teaser) | 1 (capsule-full) | ~$0.06 total | ~$4.94 |
| Pro | $12 | 4-6 (full generation) | 3 (vibe + style + capsule) | ~$0.30 total | ~$11.70 |
| Annual | $29/yr | 4-6 per trip x 12 | 3 per trip x 12 | ~$3.60/year max | ~$25.40 |

---

## Appendix: wrangler.toml Reference

```toml
# apps/worker/wrangler.toml

name = "travel-capsule-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[r2_buckets]]
binding = "R2"
bucket_name = "travel-capsule"

[vars]
SUPABASE_URL = ""
R2_ACCOUNT_ID = ""
R2_BUCKET_NAME = "travel-capsule"
R2_PUBLIC_URL = ""
POLAR_PRODUCT_ID_STANDARD = ""
POLAR_PRODUCT_ID_PRO = ""
POLAR_PRODUCT_ID_ANNUAL = ""
SKIP_TURNSTILE = "false"

# ── Secrets (set via CLI) ────────────────────────────────────────────────────
# wrangler secret put ANTHROPIC_API_KEY
# wrangler secret put NANOBANANA_API_KEY
# wrangler secret put POLAR_ACCESS_TOKEN
# wrangler secret put POLAR_WEBHOOK_SECRET
# wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# wrangler secret put R2_ACCESS_KEY_ID
# wrangler secret put R2_SECRET_ACCESS_KEY
# wrangler secret put RESEND_API_KEY
# wrangler secret put GOOGLE_PLACES_API_KEY
# wrangler secret put CLOUDFLARE_TURNSTILE_SECRET_KEY
```

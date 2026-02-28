# Travel Capsule AI -- Technical Design Specification

> Version: 1.0
> Last Updated: 2026-02-28
> Status: Implementation Reference

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Cloudflare Worker Routing Structure (Hono)](#2-cloudflare-worker-routing-structure-hono)
3. [7 Agent Interfaces and Data Contracts](#3-7-agent-interfaces-and-data-contracts)
4. [TypeScript Type Definitions](#4-typescript-type-definitions)
5. [Supabase RLS Policy Design](#5-supabase-rls-policy-design)
6. [R2 File Path Convention](#6-r2-file-path-convention)
7. [Data Flow Diagram](#7-data-flow-diagram)
8. [Error Handling Strategy](#8-error-handling-strategy)

---

## 1. Product Overview

**Travel Capsule AI** is a $5/trip AI-powered travel styling service targeting global users.

### Core Flow

1. User inputs destination cities + travel month + optional selfie photo
2. AI analyzes city-specific climate and cultural vibe
3. AI generates 3-4 fashion editorial outfit images per city
4. AI builds an optimized capsule wardrobe (8-12 items) + daily outfit plan
5. After payment, user receives a shareable gallery link via email

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js App Router on Cloudflare Pages |
| API | Cloudflare Workers (Hono) |
| Database | Supabase (Postgres + RLS) |
| Object Storage | Cloudflare R2 (native binding) |
| Payment | Polar (Merchant of Record) |
| Image Generation | NanoBanana API |
| AI Reasoning | Claude API (claude-sonnet-4-6) |
| Climate Data | Open-Meteo (free, no signup) |
| City Search | Google Places API |
| Email | Resend |

### DB Schema Summary

```
trips            -- session_id, cities(JSONB), month, face_url, status
orders           -- polar_order_id(UNIQUE), trip_id, status
generation_jobs  -- city, mood, prompt, status, image_url, attempts
capsule_results  -- trip_id, items(JSONB), daily_plan(JSONB)
city_vibes       -- city, country, lat, lon, vibe_cluster, style_keywords
```

### Agent Architecture

```
User
 +-- Orchestrator
      |-- Climate Agent     (Open-Meteo API)
      |-- Style Agent       (Claude API)
      |-- ImageGen Agent    (NanoBanana API)
      |-- Capsule Agent     (Claude API)
      |-- Fulfillment Agent (R2 + Resend)
      +-- Growth Agent      (UTM + share copy)
```

---

## 2. Cloudflare Worker Routing Structure (Hono)

### 2.1 Bindings Type Definition

All environment variables accessed through Hono's context object (`c.env`). Cloudflare Workers do NOT support `process.env`.

```typescript
// apps/worker/src/index.ts

export interface Env {
  // ── Secrets (wrangler secret put) ──────────────────────────────
  ANTHROPIC_API_KEY: string;        // Claude API authentication
  NANOBANANA_API_KEY: string;       // Image generation service
  POLAR_ACCESS_TOKEN: string;       // Polar payment API
  POLAR_WEBHOOK_SECRET: string;     // Webhook HMAC-SHA256 verification
  SUPABASE_SERVICE_ROLE_KEY: string;// Server-side DB access (bypasses RLS)
  RESEND_API_KEY: string;           // Email delivery
  GOOGLE_PLACES_API_KEY: string;    // City autocomplete

  // ── Plain Variables (wrangler.toml [vars]) ─────────────────────
  SUPABASE_URL: string;             // Supabase project URL
  POLAR_PRODUCT_ID: string;         // Polar product identifier
  R2_PUBLIC_URL: string;            // CDN URL prefix for R2 objects

  // ── Native R2 Binding (wrangler.toml [[r2_buckets]]) ──────────
  R2_BUCKET: R2Bucket;              // Direct R2 API -- no S3 credentials
}
```

### 2.2 Full Router Structure

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { orchestrateTrip } from './agents/orchestrator';

const app = new Hono<{ Bindings: Env }>();

// ── Middleware ──────────────────────────────────────────────────────

// CORS: restrict to production domains
app.use('/api/*', cors({
  origin: ['https://travelcapsule.ai', 'https://www.travelcapsule.ai'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ── Route Groups ───────────────────────────────────────────────────

// Health check
app.get('/health', handler);

// Uploads
app.post('/api/uploads/face', handler);     // Face photo upload to R2

// Trip lifecycle
app.post('/api/trips', handler);            // Create trip record
app.get('/api/trips/:tripId', handler);     // Poll trip status + results
app.post('/api/trips/:tripId/process', handler); // Manual processing trigger

// Payment
app.post('/api/checkout', handler);         // Create Polar checkout session
app.post('/api/webhooks/polar', handler);   // Polar webhook receiver

// City search
app.get('/api/cities/search', handler);     // Google Places autocomplete proxy

export default app;
```

### 2.3 Middleware Summary

| Middleware | Path | Purpose |
|-----------|------|---------|
| `cors()` | `/api/*` | Restricts cross-origin requests to `travelcapsule.ai` |
| Input Validation | Per-route | UUID format, email format, file size/type, JSON parse |
| HMAC Verification | `/api/webhooks/polar` | Polar signature verification (SHA-256) |
| Error Boundary | Global | try-catch with structured JSON error responses |

### 2.4 Route Details

#### POST /api/uploads/face

Accepts multipart/form-data. Validates file type (JPEG, PNG, WEBP), size (max 10 MB), and extension-to-MIME consistency. Stores to R2 at `faces/tmp/{uuid}.{ext}`. Returns `{ face_url }`.

#### POST /api/trips

Creates a trip record in Supabase. Validates `session_id` (max 128 chars), `cities` (non-empty array, max 10), `month` (1-12). Optional `face_url`. Returns `{ trip_id, status }`.

#### GET /api/trips/:tripId

Fetches trip state. If `completed`, includes `capsule_results`. Always includes `generation_jobs` with progress (city, mood, status, image_url).

#### POST /api/trips/:tripId/process

Admin/dev endpoint. Verifies a paid order exists. Sets trip status to `processing`. Launches `orchestrateTrip()` via `c.executionCtx.waitUntil()` for background processing.

#### POST /api/checkout

Creates a Polar checkout session. Validates `trip_id` (UUID) and optional `customer_email`. Verifies trip exists. Returns `{ checkout_url, checkout_id }`.

#### POST /api/webhooks/polar

Receives `order.paid` events. Verifies HMAC-SHA256 signature. Enforces idempotency via `polar_order_id` UNIQUE constraint. On success: inserts order, sets trip to `processing`, launches orchestration pipeline.

#### GET /api/cities/search

Proxies Google Places Autocomplete API. Requires `input` query param (min 2 chars, max 100 chars). Filters to `(cities)` type. Returns `{ predictions: [{ place_id, description, city, country }] }`.

### 2.5 Supabase Helper (shared utility)

```typescript
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
```

### 2.6 Polar HMAC Verification

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
    'HMAC', cryptoKey, encoder.encode(body)
  );
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  const expected = `sha256=${computedHex}`;
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
```

### 2.7 Input Validation Helpers

```typescript
// UUID v4 format validation -- prevents Supabase REST filter injection
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

// Loose RFC-5322 email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= 254;
}

// HTML escape for user-controlled text in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## 3. 7 Agent Interfaces and Data Contracts

All agents live in `apps/worker/src/agents/`. Each agent receives `env: Env` either directly or through individual API keys extracted from `Env`.

### 3.1 Orchestrator Agent

**File**: `apps/worker/src/agents/orchestrator.ts`

#### Function Signature

```typescript
export async function orchestrateTrip(
  tripId: string,
  tripData: Record<string, unknown>,
  env: Env,
  userEmail?: string
): Promise<void>;
```

#### Input

| Field | Type | Description |
|-------|------|-------------|
| `tripId` | `string` (UUID) | Primary key in `trips` table |
| `tripData` | `Record<string, unknown>` | Raw trip row from Supabase |
| `env` | `Env` | Cloudflare Worker environment bindings |
| `userEmail` | `string` (optional) | From Polar order `user.email` |

#### Output

`Promise<void>` -- orchestrator writes results to DB directly. Side effects:

- Updates `trips.status` to `processing` -> `completed` or `failed`
- Inserts rows into `generation_jobs`
- Updates `generation_jobs.status` and `image_url`
- Inserts `capsule_results`
- Sends email via Resend
- Deletes face photo from R2

#### Internal Execution Strategy

```
Phase 1: Data Gathering (parallel)
  |-- Climate Agent (all cities in parallel via Promise.allSettled)
  +-- City Vibe Lookup (all cities in parallel via Promise.all)

Phase 2: Style Generation (parallel per city)
  +-- Style Agent (per city, parallel via Promise.allSettled)

Phase 3: Image Generation (concurrency-limited)
  +-- ImageGen Agent (concurrency: 2, via runWithConcurrency)

Phase 4: Capsule Wardrobe (sequential)
  +-- Capsule Agent (single call, needs all climate data)

Phase 5: Delivery (sequential)
  |-- Fulfillment Agent (email + face photo deletion)
  +-- Growth Agent (share URL + copy generation)
```

#### Concurrency Limiter

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
      if (task) {
        results[taskIndex] = await task();
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}
```

#### Error Handling

- Climate data failure: uses fallback values (15-22 C, warm, 50mm precip)
- Style prompt failure: logged and skipped; orchestration fails only if ALL cities produce zero prompts
- Image generation failure: individual jobs marked `failed`; trip continues with partial results
- Capsule/fulfillment failure: trip marked `failed`; error is thrown upward

---

### 3.2 Climate Agent (Open-Meteo)

**File**: `apps/worker/src/agents/climateAgent.ts`

#### Function Signature

```typescript
export async function getClimateData(
  city: CityInput,
  month: number
): Promise<ClimateData>;
```

#### Input Type

```typescript
interface CityInput {
  name: string;     // e.g. "Paris"
  country: string;  // e.g. "France"
  days: number;     // stay duration
  lat?: number;     // latitude (required for climate lookup)
  lon?: number;     // longitude (required for climate lookup)
}
```

#### Output Type

```typescript
interface ClimateData {
  city: string;                                    // city name
  month: number;                                   // 1-12
  temp_min: number;                                // Celsius, 1 decimal
  temp_max: number;                                // Celsius, 1 decimal
  precipitation: number;                           // mm, 1 decimal
  vibe_band: 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';
}
```

#### Error Type

```typescript
// All errors thrown as standard Error with descriptive message:
// - "City X is missing lat/lon coordinates required for climate lookup"
// - "Network error fetching climate data for X: ..."
// - "Open-Meteo API error for X: HTTP {status}"
// - "Open-Meteo returned an error for X: {reason}"
// - "Open-Meteo returned no monthly data for X"
// - "Open-Meteo returned empty monthly arrays for X"
```

#### Open-Meteo API Call

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &monthly=temperature_2m_max,temperature_2m_min,precipitation_sum
  &timezone=auto
  &forecast_months=12
```

Response shape:

```typescript
interface OpenMeteoResponse {
  monthly?: {
    time: string[];                       // ["2026-01-01", "2026-02-01", ...]
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
  error?: boolean;
  reason?: string;
}
```

#### Climate Band Classification Logic

```typescript
function classifyClimateBand(tempMax: number, precipitation: number): ClimateBand {
  if (precipitation > 100) return 'rainy';  // rainy takes highest priority
  if (tempMax < 10) return 'cold';
  if (tempMax < 18) return 'mild';
  if (tempMax <= 26) return 'warm';
  return 'hot';
}
```

#### Month Matching Strategy

1. Try `YYYY-{month}` for current year
2. Try `YYYY-{month}` for next year
3. Fallback: use `month - 1` as index (clamped to array length)

---

### 3.3 Style Agent (Claude API)

**File**: `apps/worker/src/agents/styleAgent.ts`

#### Function Signature

```typescript
export async function generateStylePrompts(
  city: CityVibe,
  climate: ClimateData,
  apiKey: string
): Promise<StylePrompt[]>;
```

#### Input Types

```typescript
interface CityVibe {
  city: string;           // e.g. "Paris"
  country: string;        // e.g. "France"
  lat: number;
  lon: number;
  vibe_cluster: string;   // e.g. "romantic", "urban-edge", "coastal"
  style_keywords: string[]; // e.g. ["chic", "understated", "effortless"]
}

// ClimateData as defined in 3.2
```

#### Output Type

```typescript
interface StylePrompt {
  city: string;           // city name
  mood: string;           // e.g. "morning-exploration", "golden-hour-cafe"
  prompt_en: string;      // Full image generation prompt in English
  negative_prompt: string; // Constant negative prompt for quality control
}
```

Negative prompt constant:
```
"nudity, revealing clothes, cartoon, illustration, anime, painting,
sketch, drawing, 3d render, blurry, low quality"
```

#### Error Types

```typescript
// - "Unexpected response type from Claude: {type}"
// - "Failed to parse Claude response as JSON for {city}: {parseError}\nRaw: {text}"
// - "Claude returned no prompts for {city}"
```

#### Claude Prompt Structure

**System prompt**: Professional fashion stylist and photographer role. Must respond with valid JSON only.

**User prompt** contains:
- City, country, vibe cluster, style keywords
- Travel month name, climate band, temperature range, precipitation
- Climate-specific clothing guidance (cold/mild/warm/hot/rainy)
- Required JSON output format: `{ prompts: [{ mood, prompt_en }] }`

**Model configuration**:
- Model: `claude-sonnet-4-6`
- `max_tokens`: 1024
- `temperature`: 0.8 (higher for creative diversity)

**Response parsing**: Strips markdown code fences, parses JSON, validates array structure. Each returned prompt gets the constant `negative_prompt` appended.

---

### 3.4 ImageGen Agent (NanoBanana)

**File**: `apps/worker/src/agents/imageGenAgent.ts`

#### Function Signature

```typescript
export async function generateImage(
  prompt: StylePrompt,
  apiKey: string,
  faceUrl?: string
): Promise<string>;  // returns image URL
```

#### Input Types

```typescript
// StylePrompt as defined in 3.3

// Internal request body sent to NanoBanana:
interface NanoBananaGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;              // default: 768
  height?: number;             // default: 1024 (portrait orientation)
  num_inference_steps?: number; // default: 30
  guidance_scale?: number;     // default: 7.5
  face_image_url?: string;     // optional face preservation
  face_preservation_strength?: number; // default: 0.8
}
```

#### Output Type

```typescript
// Returns: string (image URL from NanoBanana CDN)
```

#### Error Types

```typescript
// - "NanoBanana API error: HTTP {status} -- {errorText}"
// - "NanoBanana job poll failed: HTTP {status}"
// - "NanoBanana job completed but returned no image URL"
// - "NanoBanana job failed: {error}"
// - "NanoBanana job {id} timed out after polling"
// - "NanoBanana API returned neither image_url nor job id"
// - "Image generation failed after {MAX_ATTEMPTS} attempts"
```

#### Retry Logic

```
Attempt 1: immediate
Attempt 2: 1s backoff
Attempt 3: 2s backoff
(MAX_ATTEMPTS = 3, exported for orchestrator use)
```

Exponential backoff delays: `[1000, 2000, 4000]` ms.

#### Async Job Polling

NanoBanana may return either:
1. **Synchronous**: `{ image_url }` or `{ url }` -- image ready immediately
2. **Asynchronous**: `{ id }` -- poll `GET /v1/jobs/{id}` until `completed` or `failed`

Polling config:
- Interval: 5 seconds
- Max attempts: 60 (= 5 minute timeout)
- Terminal states: `completed` (return URL) or `failed` (throw error)

#### NanoBanana API Endpoints

```
POST https://api.nanobanan.ai/v1/generate
  Authorization: Bearer {apiKey}
  Content-Type: application/json

GET  https://api.nanobanan.ai/v1/jobs/{jobId}
  Authorization: Bearer {apiKey}
```

---

### 3.5 Capsule Agent (Claude API)

**File**: `apps/worker/src/agents/capsuleAgent.ts`

#### Function Signature

```typescript
export async function generateCapsule(
  cities: CityInput[],
  month: number,
  climateData: ClimateData[],
  apiKey: string
): Promise<{ items: CapsuleItem[]; daily_plan: DailyPlan[] }>;
```

#### Input Types

```typescript
// CityInput as defined in 3.2
// ClimateData as defined in 3.2
```

#### Output Types

```typescript
interface CapsuleItem {
  name: string;              // e.g. "White linen button-down shirt"
  category: string;          // top | bottom | outerwear | shoes | dress/jumpsuit | accessory
  why: string;               // One sentence on its role in the capsule
  versatility_score: number; // 1-10 (clamped)
}

interface DailyPlan {
  day: number;         // 1 to totalDays
  city: string;        // city name for that day
  outfit: string[];    // 3-5 item names from the items list
  note: string;        // activity/occasion description
}
```

#### Error Types

```typescript
// - "Unexpected Claude response type: {type}"
// - "Failed to parse Claude capsule response: {parseError}\nRaw: {first 500 chars}"
// - "Claude returned no capsule items"
// - "Claude returned no daily plan"
```

#### Claude Prompt Structure

**System prompt**: Expert travel fashion consultant and capsule wardrobe specialist. Carry-on friendly philosophy. JSON-only output.

**User prompt** contains:
- Destination list with per-city climate details
- Total trip duration (summed days)
- Strict carry-on constraints: 8-12 items, 3+ pairings per item
- Per-item output schema: name, category, why, versatility_score
- Per-day plan schema: day, city, outfit[], note

**Model configuration**:
- Model: `claude-sonnet-4-6`
- `max_tokens`: 2048 (larger than style agent due to structured output)
- `temperature`: 0.7 (slightly lower for consistency)

**Post-processing**:
- Items clamped to max 12
- `versatility_score` clamped to 1-10
- All fields coerced to expected types with fallbacks

---

### 3.6 Fulfillment Agent (R2 + Resend)

**File**: `apps/worker/src/agents/fulfillmentAgent.ts`

#### Function Signature

```typescript
export async function fulfillTrip(
  tripId: string,
  userEmail: string,
  env: Env
): Promise<void>;
```

#### Input

| Field | Type | Description |
|-------|------|-------------|
| `tripId` | `string` (UUID) | Trip primary key |
| `userEmail` | `string` | Customer email from Polar order |
| `env` | `Env` | Full Worker environment bindings |

#### Output

`Promise<void>` -- side effects only:

- Sends gallery email via Resend (if valid email provided)
- Deletes face photo from R2 (privacy requirement)
- Sets `trips.face_url` to `null` in DB

#### Processing Steps

1. Fetch trip from Supabase (get cities, face_url)
2. Verify all `generation_jobs` are terminal (`completed` or `failed`)
3. Build gallery URL: `https://travelcapsule.ai/result/{tripId}`
4. Send email via Resend API (non-fatal on failure -- logged but continues)
5. Privacy cleanup:
   - Extract R2 object key from `face_url` (strip origin from URL)
   - Delete object via native R2 binding: `env.R2_BUCKET.delete(faceKey)`
   - Set `trips.face_url = null` in DB (always, even if R2 delete fails)

#### Resend API Call

```
POST https://api.resend.com/emails
  Authorization: Bearer {RESEND_API_KEY}
  Content-Type: application/json

{
  "from": "Travel Capsule AI <hello@travelcapsule.ai>",
  "to": ["{userEmail}"],
  "subject": "Your Travel Capsule for {cities} is Ready!",
  "html": "{email template HTML}"
}
```

#### Email Template

Professional HTML email with:
- Branded header (gradient background, gold accent)
- City list, CTA button to gallery, direct link text
- Trip ID reference in footer
- All user-supplied strings HTML-escaped via `escapeHtml()`

---

### 3.7 Growth Agent (UTM + Share)

**File**: `apps/worker/src/agents/growthAgent.ts`

#### Function Signature

```typescript
export function generateShareContent(trip: Trip): ShareContent;
```

Note: This agent is **synchronous** -- it performs no I/O.

#### Input Type

```typescript
// Trip as defined in packages/types/index.ts
```

#### Output Type

```typescript
interface ShareContent {
  message_ko: string;   // Korean share copy
  message_en: string;   // English share copy
  share_url: string;    // UTM-tagged gallery URL
}
```

#### UTM Parameters

```
utm_source   = share
utm_medium   = user
utm_campaign = trip_share
```

#### Share URL Format

```
https://travelcapsule.ai/result/{tripId}?utm_source=share&utm_medium=user&utm_campaign=trip_share
```

#### City List Formatting

| Cities Count | English Output | Korean Output |
|-------------|---------------|---------------|
| 0 | "my destination" | "여행지" |
| 1 | "Paris" | "Paris" |
| 2 | "Paris & Tokyo" | "Paris & Tokyo" |
| 3+ | "Paris, Tokyo & London" | "Paris, Tokyo & London" |

---

## 4. TypeScript Type Definitions

Complete type definitions for `packages/types/index.ts`.

```typescript
// =========================================================================
// packages/types/index.ts
// Complete type definitions for Travel Capsule AI
// =========================================================================

// ─── Enums / Literal Unions ─────────────────────────────────────────────

export type TripStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type OrderStatus = 'pending' | 'paid' | 'refunded';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ClimateBand = 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';

// ─── DB Schema Types ────────────────────────────────────────────────────

/** Represents a single city in the trip's cities JSONB array. */
export interface CityInput {
  name: string;
  country: string;
  days: number;
  lat?: number;
  lon?: number;
}

/** Row in `trips` table. */
export interface Trip {
  id: string;
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
  status: TripStatus;
  gallery_url?: string;
  created_at: string;
  updated_at?: string;
}

/** Row in `orders` table. */
export interface Order {
  id: string;
  polar_order_id: string;
  trip_id: string;
  status: OrderStatus;
  amount: number;            // stored in cents (500 = $5.00)
  customer_email?: string;
  created_at?: string;
}

/** Row in `generation_jobs` table. */
export interface GenerationJob {
  id: string;
  trip_id: string;
  city: string;
  mood: string;
  prompt: string;
  negative_prompt?: string;
  status: JobStatus;
  image_url?: string;
  attempts: number;
  created_at?: string;
  updated_at?: string;
}

/** Single item in the capsule wardrobe. Stored in capsule_results.items JSONB. */
export interface CapsuleItem {
  name: string;
  category: string;          // top | bottom | outerwear | shoes | dress/jumpsuit | accessory
  why: string;
  versatility_score: number; // 1-10
}

/** Single day's outfit plan. Stored in capsule_results.daily_plan JSONB. */
export interface DailyPlan {
  day: number;
  city: string;
  outfit: string[];          // references CapsuleItem.name
  note: string;
}

/** Row in `capsule_results` table. */
export interface CapsuleResult {
  id: string;
  trip_id: string;
  items: CapsuleItem[];
  daily_plan: DailyPlan[];
  created_at?: string;
}

/** Row in `city_vibes` table. */
export interface CityVibe {
  city: string;
  country: string;
  lat: number;
  lon: number;
  vibe_cluster: string;
  style_keywords: string[];
}

// ─── Agent I/O Types ────────────────────────────────────────────────────

/** Climate Agent output. */
export interface ClimateData {
  city: string;
  month: number;
  temp_min: number;
  temp_max: number;
  precipitation: number;
  vibe_band: ClimateBand;
}

/** Style Agent output -- one prompt per mood. */
export interface StylePrompt {
  city: string;
  mood: string;
  prompt_en: string;
  negative_prompt: string;
}

/** Growth Agent output. */
export interface ShareContent {
  message_ko: string;
  message_en: string;
  share_url: string;
}

/** Single image generation result from orchestrator. */
export interface ImageTaskResult {
  jobId: string | undefined;
  imageUrl: string | null;
  success: boolean;
}

// ─── API Request Types ──────────────────────────────────────────────────

/** POST /api/trips request body. */
export interface CreateTripRequest {
  session_id: string;
  cities: CityInput[];
  month: number;
  face_url?: string;
}

/** POST /api/checkout request body. */
export interface CreateCheckoutRequest {
  trip_id: string;
  customer_email?: string;
}

/** POST /api/webhooks/polar request body (Polar event). */
export interface PolarWebhookEvent {
  type: string;              // e.g. "order.paid"
  data: {
    id: string;              // polar_order_id
    metadata?: {
      trip_id?: string;
    };
    amount?: number;         // cents
    user?: {
      email?: string;
    };
  };
}

/** GET /api/cities/search query params. */
export interface CitySearchQuery {
  input: string;             // min 2 chars, max 100 chars
}

// ─── API Response Types ─────────────────────────────────────────────────

/** POST /api/uploads/face response. */
export interface UploadFaceResponse {
  face_url: string;
}

/** POST /api/trips response. */
export interface CreateTripResponse {
  trip_id: string;
  status: TripStatus;
}

/** POST /api/checkout response. */
export interface CreateCheckoutResponse {
  checkout_url: string;
  checkout_id: string;
}

/** GET /api/trips/:tripId response (processing state). */
export interface GetTripResponse {
  trip: Trip;
  jobs?: GenerationJob[];
  capsule?: CapsuleResult;
}

/** GET /api/cities/search response. */
export interface CitySearchResponse {
  predictions: CityPrediction[];
}

export interface CityPrediction {
  place_id: string;
  description: string;
  city: string;
  country: string;
}

/** POST /api/webhooks/polar response. */
export interface WebhookResponse {
  received: boolean;
  idempotent?: boolean;
}

/** Standard error response shape. */
export interface ApiError {
  error: string;
  detail?: string;
}

// ─── Cloudflare Worker Bindings ─────────────────────────────────────────

/** Environment bindings for Cloudflare Workers (Hono). */
export interface Env {
  // Secrets
  ANTHROPIC_API_KEY: string;
  NANOBANANA_API_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_WEBHOOK_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  GOOGLE_PLACES_API_KEY: string;

  // Plain vars
  SUPABASE_URL: string;
  POLAR_PRODUCT_ID: string;
  R2_PUBLIC_URL: string;

  // Native R2 binding
  R2_BUCKET: R2Bucket;
}
```

---

## 5. Supabase RLS Policy Design

### 5.1 Access Model Overview

| Role | Access Method | RLS Behavior |
|------|-------------|-------------|
| `anon` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client) | Subject to RLS policies |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` (Worker) | Bypasses RLS entirely |

Session identification: the Worker sets `SET LOCAL app.session_id = '<value>'` before executing anon-context queries. No JWT authentication is used in v1.

### 5.2 Policy Summary Table

| Table | anon SELECT | anon INSERT | anon UPDATE | anon DELETE | service_role | Policy Name |
|-------|:-----------:|:-----------:|:-----------:|:-----------:|:------------:|-------------|
| trips | own session | own session | -- | -- | full bypass | `trips_anon_select`, `trips_anon_insert` |
| orders | -- | -- | -- | -- | full bypass | (none for anon) |
| generation_jobs | own session's trips | -- | -- | -- | full bypass | `generation_jobs_anon_select` |
| capsule_results | own session's trips | -- | -- | -- | full bypass | `capsule_results_anon_select` |
| city_vibes | all (public data) | -- | -- | -- | full bypass | `city_vibes_public_read` |

### 5.3 Complete SQL Policies

#### trips

```sql
-- RLS enabled
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: user can only read trips belonging to their session
DO $$ BEGIN
  CREATE POLICY "trips_anon_select" ON trips
    FOR SELECT TO anon
    USING (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon INSERT: user can only create trips for their own session
DO $$ BEGIN
  CREATE POLICY "trips_anon_insert" ON trips
    FOR INSERT TO anon
    WITH CHECK (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No UPDATE/DELETE policies for anon.
-- service_role bypasses RLS automatically.
```

#### orders

```sql
-- RLS enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- No anon policies at all. Orders are exclusively managed by
-- the Cloudflare Worker via service_role (Polar webhook handler).
-- Anon clients must NEVER read or write order data directly.
```

#### generation_jobs

```sql
-- RLS enabled
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: read jobs for trips in current session (for progress polling)
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

-- All writes (INSERT/UPDATE) are by the Worker via service_role.
```

#### capsule_results

```sql
-- RLS enabled
ALTER TABLE capsule_results ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: read results for trips in current session
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

-- All writes are by the Worker via service_role.
```

#### city_vibes

```sql
-- RLS enabled
ALTER TABLE city_vibes ENABLE ROW LEVEL SECURITY;

-- Public read: city vibes is reference/seed data, readable by anyone
DO $$ BEGIN
  CREATE POLICY "city_vibes_public_read" ON city_vibes
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- All writes (seed inserts, updates) are via service_role.
```

### 5.4 Idempotency Policy Note

The `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` wrapper makes every policy creation idempotent -- the migration file is safe to run multiple times during local development resets.

---

## 6. R2 File Path Convention

### 6.1 Path Structure

```
travel-capsule-assets/                    <-- R2 bucket name
|
|-- faces/
|   +-- tmp/
|       +-- {uuid}.{ext}                 <-- temporary face photo
|           Example: faces/tmp/a1b2c3d4-e5f6-4789-abcd-123456789abc.jpg
|
+-- outputs/
    +-- {trip_id}/
        +-- {city}/
            +-- {index}.webp             <-- generated outfit image
                Example: outputs/f1e2d3c4-b5a6-4789-abcd-987654321abc/paris/0.webp
                Example: outputs/f1e2d3c4-b5a6-4789-abcd-987654321abc/paris/1.webp
                Example: outputs/f1e2d3c4-b5a6-4789-abcd-987654321abc/tokyo/0.webp
```

### 6.2 File Naming Rules

| Path Segment | Format | Constraints |
|-------------|--------|-------------|
| `{uuid}` | UUID v4 | Generated by `crypto.randomUUID()` |
| `{ext}` | `jpg`, `png`, `webp` | Derived from upload MIME type |
| `{trip_id}` | UUID v4 | From `trips.id` |
| `{city}` | lowercase, hyphenated | e.g., `paris`, `new-york`, `hong-kong` |
| `{index}` | zero-based integer | Sequential per city: `0`, `1`, `2`, `3` |

### 6.3 Access Permissions

| Path Pattern | Access | Reason |
|-------------|--------|--------|
| `faces/tmp/*` | **Private** | Contains user selfie photos. Never exposed publicly. Accessed only by Worker via native R2 binding. |
| `outputs/{trip_id}/*` | **Public (CDN)** | Generated outfit images. Served via `R2_PUBLIC_URL` CDN. Shareable gallery content. |

### 6.4 Deletion Policy

| Path Pattern | Lifecycle | Trigger |
|-------------|----------|---------|
| `faces/tmp/{uuid}.{ext}` | **Ephemeral** | Deleted by `fulfillmentAgent` immediately after image generation completes. `trips.face_url` is set to `null` in DB regardless of R2 deletion success. |
| `outputs/{trip_id}/**` | **Permanent** | Retained indefinitely. Future consideration: TTL-based cleanup for unpaid/abandoned trips. |

### 6.5 CDN URL Pattern

```
Public URL format:
  {R2_PUBLIC_URL}/{object_key}

Examples:
  https://assets.travelcapsule.ai/outputs/f1e2d3c4.../paris/0.webp
  https://assets.travelcapsule.ai/outputs/f1e2d3c4.../tokyo/1.webp
```

The `R2_PUBLIC_URL` environment variable stores the CDN origin. Object keys are appended directly.

### 6.6 Upload Constraints (face photos)

| Constraint | Value |
|-----------|-------|
| Max file size | 10 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Extension validation | Must match declared MIME type |
| Metadata | `uploaded_at` timestamp stored as custom R2 metadata |

---

## 7. Data Flow Diagram

### 7.1 Full Pipeline (User Request to Gallery Delivery)

```
User (Browser / Next.js Client)
  |
  |  1. Select cities + month + upload face (optional)
  |
  v
+-------------------------------------------------------------+
|  Cloudflare Pages (Next.js App Router)                      |
|                                                             |
|  page.tsx --> FormSection --> POST /api/uploads/face         |
|                          --> POST /api/trips                 |
|                          --> POST /api/checkout              |
+--------|----------------------------------------------------+
         |
         |  2. API calls via fetch()
         |
         v
+-------------------------------------------------------------+
|  Cloudflare Worker (Hono)                                   |
|                                                             |
|  /api/uploads/face -----> R2: faces/tmp/{uuid}.{ext}        |
|  /api/trips -----------> Supabase: INSERT trips             |
|  /api/checkout --------> Polar API: Create checkout session |
|                          <-- checkout_url                   |
+-------------------------------------------------------------+
         |
         |  3. User redirected to Polar checkout
         |
         v
+-------------------------------------------------------------+
|  Polar Payment                                              |
|  User pays $5 --> order.paid webhook fires                  |
+--------|----------------------------------------------------+
         |
         |  4. Webhook POST /api/webhooks/polar
         |
         v
+-------------------------------------------------------------+
|  Cloudflare Worker - Webhook Handler                        |
|                                                             |
|  Verify HMAC-SHA256 signature                               |
|  Check idempotency (polar_order_id UNIQUE)                  |
|  INSERT orders (status: paid)                               |
|  PATCH trips (status: processing)                           |
|  waitUntil(orchestrateTrip(...))                            |
+--------|----------------------------------------------------+
         |
         |  5. Background orchestration pipeline
         |
         v
+=====================================================================+
||  ORCHESTRATOR (background via waitUntil)                          ||
||                                                                   ||
||  Phase 1: Data Gathering                                          ||
||  +---------------------+  +-------------------+                   ||
||  | Climate Agent       |  | City Vibe Lookup  |                   ||
||  | (Open-Meteo API)    |  | (Supabase query)  |   -- parallel     ||
||  | per city, parallel  |  | per city, parallel|                   ||
||  +------|--------------+  +--------|----------+                   ||
||         v                          v                              ||
||  ClimateData[]              CityVibe[]                            ||
||                                                                   ||
||  Phase 2: Style Prompts                                           ||
||  +--------------------------------------------+                   ||
||  | Style Agent (Claude claude-sonnet-4-6)     |                   ||
||  | per city, parallel via Promise.allSettled   |                   ||
||  +-------|------------------------------------+                   ||
||          v                                                        ||
||  StylePrompt[] (3-4 per city)                                     ||
||  INSERT generation_jobs (status: pending)                         ||
||                                                                   ||
||  Phase 3: Image Generation                                        ||
||  +--------------------------------------------+                   ||
||  | ImageGen Agent (NanoBanana API)            |                   ||
||  | concurrency: 2, retry: 3x with backoff    |                   ||
||  | PATCH generation_jobs per image            |                   ||
||  +-------|------------------------------------+                   ||
||          v                                                        ||
||  image_url per job                                                ||
||                                                                   ||
||  Phase 4: Capsule Wardrobe                                        ||
||  +--------------------------------------------+                   ||
||  | Capsule Agent (Claude claude-sonnet-4-6)   |                   ||
||  | single call, all cities + climate          |                   ||
||  +-------|------------------------------------+                   ||
||          v                                                        ||
||  CapsuleItem[8-12] + DailyPlan[]                                  ||
||  INSERT capsule_results                                           ||
||                                                                   ||
||  Phase 5: Delivery                                                ||
||  +--------------------------------------------+                   ||
||  | Fulfillment Agent                          |                   ||
||  | 1. Send email via Resend                   |                   ||
||  | 2. Delete face photo from R2               |                   ||
||  | 3. NULL trips.face_url in DB               |                   ||
||  +-------|------------------------------------+                   ||
||  +--------------------------------------------+                   ||
||  | Growth Agent                               |                   ||
||  | Generate UTM share URL + bilingual copy    |                   ||
||  +-------|------------------------------------+                   ||
||          v                                                        ||
||  PATCH trips (status: completed)                                  ||
+=====================================================================+
         |
         |  6. Email sent to user
         |
         v
+-------------------------------------------------------------+
|  User receives email with gallery link                      |
|  https://travelcapsule.ai/result/{tripId}                   |
+--------|----------------------------------------------------+
         |
         |  7. User visits gallery
         |
         v
+-------------------------------------------------------------+
|  Next.js Result Page: /result/[tripId]/page.tsx             |
|                                                             |
|  GET /api/trips/{tripId}                                    |
|    --> trip data + capsule_results + generation_jobs         |
|    --> Display outfit images from R2 CDN                    |
|    --> Display capsule wardrobe items + daily plan           |
|    --> Share button (Growth Agent UTM link)                  |
+-------------------------------------------------------------+
```

### 7.2 Progress Polling (during processing)

```
Next.js Client                  Cloudflare Worker              Supabase
     |                               |                            |
     |  GET /api/trips/{tripId}      |                            |
     |------------------------------>|                            |
     |                               |  SELECT trips WHERE id=..  |
     |                               |--------------------------->|
     |                               |  SELECT generation_jobs    |
     |                               |  WHERE trip_id=..          |
     |                               |--------------------------->|
     |                               |<---------------------------|
     |<------------------------------|                            |
     |                                                            |
     |  { trip: { status: "processing" },                         |
     |    jobs: [                                                  |
     |      { city: "Paris", mood: "cafe", status: "completed",   |
     |        image_url: "https://..." },                         |
     |      { city: "Paris", mood: "evening", status: "processing"|
     |        image_url: null },                                  |
     |      { city: "Tokyo", mood: "street", status: "pending",   |
     |        image_url: null }                                   |
     |    ] }                                                     |
     |                                                            |
     |  (poll every 5s until status: "completed")                 |
```

---

## 8. Error Handling Strategy

### 8.1 Agent Failure Retry Policy

| Agent | Retry Count | Backoff | Timeout | Failure Impact |
|-------|:-----------:|---------|---------|----------------|
| Climate Agent | 0 (no retry) | -- | fetch timeout | Fallback to default climate values |
| Style Agent | 0 (no retry) | -- | Claude API timeout | City skipped; fatal only if ALL cities fail |
| ImageGen Agent | 3 | Exponential (1s, 2s, 4s) | 5 min per job | Individual job marked `failed` |
| Capsule Agent | 0 (no retry) | -- | Claude API timeout | **Fatal** -- trip marked `failed` |
| Fulfillment Agent | 0 (no retry) | -- | fetch timeout | Email failure is non-fatal; face deletion always attempted |
| Growth Agent | 0 (no retry) | -- | synchronous | Non-fatal (no I/O) |

### 8.2 Partial Failure Handling

#### Scenario: Some cities fail climate lookup

```
Strategy: Fallback values
Action:
  - Use Promise.allSettled for parallel climate fetches
  - Failed cities get default ClimateData:
    { temp_min: 15, temp_max: 22, precipitation: 50, vibe_band: 'warm' }
  - Log warning, continue pipeline
Result: Trip succeeds with approximate styling for failed cities
```

#### Scenario: Some cities fail style prompt generation

```
Strategy: Skip and continue
Action:
  - Use Promise.allSettled for parallel style generation
  - Failed cities produce no StylePrompt entries
  - Pipeline continues if at least 1 city produced prompts
  - Fatal error only if allStylePrompts.length === 0
Result: Trip succeeds with fewer outfit images
```

#### Scenario: Some image generation jobs fail

```
Strategy: Mark failed, continue
Action:
  - Each job retries up to 3x with exponential backoff
  - After 3 failures: job.status = 'failed', job.attempts = 3
  - Other jobs continue independently
  - Capsule Agent still runs (independent of images)
Result: Trip completes with partial image gallery
```

#### Scenario: Capsule Agent fails

```
Strategy: Fatal failure
Action:
  - Capsule wardrobe is a core deliverable -- no fallback
  - Trip status set to 'failed'
  - Error thrown, caught by orchestrator outer try-catch
Result: Trip fails. User may request re-processing.
```

### 8.3 Payment Failure Recovery

#### Scenario: Polar checkout abandoned

```
Strategy: No action needed
Action:
  - Trip record exists with status: 'pending'
  - No order record created
  - User can retry checkout by calling POST /api/checkout again
  - No expiration on trip records (future: TTL cleanup)
```

#### Scenario: Polar webhook delivery failure

```
Strategy: Polar automatic retry
Action:
  - Polar retries webhook delivery automatically
  - polar_order_id UNIQUE constraint prevents double-fulfillment
  - Idempotency check: existing order returns { received: true, idempotent: true }
```

#### Scenario: Webhook received but orchestration fails

```
Strategy: Trip marked failed, manual re-trigger available
Action:
  - orchestrateTrip() error caught in waitUntil()
  - Trip status set to 'failed'
  - Admin can re-trigger via POST /api/trips/:tripId/process
  - Re-trigger verifies paid order exists before processing
```

### 8.4 HTTP Error Response Format

All API errors return a consistent JSON shape:

```typescript
// Standard error response
{
  "error": "Human-readable error message"
}

// Extended error response (debug info, non-production)
{
  "error": "Human-readable error message",
  "detail": "Supabase/upstream error text"
}
```

### 8.5 HTTP Status Code Usage

| Code | Usage |
|------|-------|
| `200` | Success (GET, webhook acknowledgment) |
| `201` | Resource created (POST /api/trips, POST /api/uploads/face) |
| `400` | Validation error (missing fields, invalid format) |
| `401` | Invalid webhook signature |
| `402` | Payment required (no paid order for processing) |
| `404` | Trip not found |
| `413` | File too large (face upload > 10 MB) |
| `415` | Unsupported media type (invalid file type/extension) |
| `500` | Internal server error (DB failure, unhandled error) |
| `502` | Upstream service error (Polar API, Google Places API) |

### 8.6 Logging Strategy

All agents log with prefix tags for structured log analysis:

```
[Orchestrator] Starting pipeline for trip {tripId}
[Orchestrator] Fetching climate data for {n} cities
[Orchestrator] Generating style prompts for {n} cities
[Orchestrator] Saving {n} generation jobs to DB
[Orchestrator] Generating {n} images (concurrency: 2)
[Orchestrator] Generating capsule wardrobe via Claude
[Orchestrator] Running fulfillment for trip {tripId}
[Orchestrator] Share content generated. URL: {shareUrl}
[Orchestrator] Trip {tripId} completed successfully
[Orchestrator] Fatal error for trip {tripId}: {message}
[Fulfillment] Deleting face image at R2 key: {key} for trip {tripId}
[Fulfillment] Face image deleted from R2 for trip {tripId}
[Fulfillment] face_url nulled in DB for trip {tripId}
```

Non-fatal failures use `console.warn()`. Fatal failures use `console.error()`.

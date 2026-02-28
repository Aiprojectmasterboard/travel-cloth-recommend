# Travel Capsule AI — Backend Builder Memory

## Project Structure
- Worker entry: `apps/worker/src/index.ts` — exports `Bindings` type, Hono app
- Agents: `apps/worker/src/agents/` (9 files: weather, vibe, teaser, capsule, style, imageGen, fulfillment, growth, orchestrator)
- Shared types: `packages/types/index.ts` — imported via relative path `../../../../packages/types/index`
- DB migration: `supabase/migrations/001_initial_schema.sql` — complete, idempotent

## Bindings Type (in index.ts) — 20 variables
Named `Bindings` (exported as `export type Bindings`). All agents: `import type { Bindings } from '../index'`.
- Secrets (10): ANTHROPIC_API_KEY, NANOBANANA_API_KEY, POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET,
  SUPABASE_SERVICE_ROLE_KEY, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, RESEND_API_KEY,
  GOOGLE_PLACES_API_KEY, CLOUDFLARE_TURNSTILE_SECRET_KEY
- Plain vars (8): SUPABASE_URL, R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_URL,
  POLAR_PRODUCT_ID_STANDARD, POLAR_PRODUCT_ID_PRO, POLAR_PRODUCT_ID_ANNUAL, SKIP_TURNSTILE
- Native R2 binding: `R2: R2Bucket` (wrangler.toml [[r2_buckets]])

## Agent Signatures (2026-02-28 rewrite)
All agents accept `env: Bindings` as last param.
- `runPreview(input: TripInput, env): Promise<PreviewResponse>` — orchestrator
- `runResult(tripId, plan: PlanType, userEmail, env): Promise<void>` — orchestrator
- `weatherAgent({city,lat,lon,month}, env): Promise<WeatherResult>` — Open-Meteo archive + DB cache
- `vibeAgent({city,country,weather}, env): Promise<VibeResult>` — Claude API
- `teaserAgent({tripId,vibeResult,faceUrl?}, env): Promise<TeaserResult>` — NanoBanana + R2
- `capsuleAgent({vibeResults,weather,plan,cities,month,tripDays?}, env): Promise<CapsuleResult>` — Claude
- `styleAgent({vibeResults,cities,weather?}, env): Promise<StylePrompts[]>` — Claude (Pro only)
- `imageGenAgent({prompts,tripId,jobIds?,faceUrl?}, env): Promise<GeneratedImages>` — NanoBanana (Pro only)
- `fulfillmentAgent({tripId,email?,galleryUrl}, env): Promise<void>` — Resend + R2 cleanup
- `growthAgent({tripId,moodName,plan}, env): Promise<GrowthResult>` — HMAC upgrade token + share copy
- `generateUpgradeToken(tripId, env): Promise<string>` — exported from growthAgent
- `verifyUpgradeToken(tripId, token, env): Promise<boolean>` — exported from growthAgent

## index.ts Routes (8 API endpoints)
1. GET  /api/health
2. POST /api/preview — Turnstile check (skip if SKIP_TURNSTILE==="true") + 5/day session rate limit
3. POST /api/preview/email — email_captures upsert + Resend mood card
4. POST /api/payment/checkout — Polar checkout (3 product IDs)
5. POST /api/payment/webhook — HMAC verify + order idempotency + runResult in waitUntil
6. POST /api/payment/upgrade — verifyUpgradeToken (3 min) + Polar Pro checkout
7. GET  /api/result/:tripId — 402 if no paid order
8. GET  /api/share/:tripId — public teaser data

## Key Patterns
- Supabase: raw fetch helper (`sbFetch`) in each agent — no @supabase/supabase-js
- R2 write: `env.R2.put(key, buffer, {httpMetadata, customMetadata})`
- R2 delete: `env.R2.delete(key)` — native binding, NOT S3 client
- R2 bulk delete: `env.R2.list({prefix})` → `.objects.map(o => o.key)` → `Promise.allSettled(keys.map(delete))`
- Face URL to R2 key: `new URL(face_url).pathname.replace(/^\//, '')`
- Anthropic model: `claude-sonnet-4-6-20260219` (all Claude calls)
- NanoBanana: polls `/jobs/{id}` every 5s up to 60 attempts (5 min max)
- Upgrade token format: `"{timestampMs}.{hmacHex}"` — 3 min TTL
- Polar webhook headers: check both `webhook-signature` AND `x-polar-signature`
- Turnstile: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Rate limit: `Prefer: count=exact` → parse `content-range: 0-0/N` header

## Supabase REST API Notes
- Auth headers: `apikey` + `Authorization: Bearer <service_role_key>`
- `Prefer: return=representation` makes POST return inserted rows
- `Prefer: return=minimal` for PATCH (faster, no body)
- `Prefer: resolution=merge-duplicates` for upsert
- Multiple `neq` filters: `?status=neq.completed&status=neq.failed` — PostgREST ANDs them
- `parseCities()` in orchestrator: must push into array, NOT use filter+type-predicate on inline object type

## Capsule Agent Modes
- free: `{ plan:'free', count:9-11, principles:string[3] }` — preview page teaser
- paid: `{ plan:PlanType, items:CapsuleItem[], daily_plan:DailyOutfit[] }` — full result

## DB Tables (key columns used by agents)
- trips: id, session_id, cities(JSONB), month, face_url, status, vibe_data, weather_data, share_url, upgrade_token
- orders: polar_order_id(UNIQUE), trip_id, status, amount, plan, upgrade_token
- generation_jobs: trip_id, city, mood, prompt, status, image_url, job_type('teaser'|'pro'), attempts
- capsule_results: trip_id, items(JSONB), daily_plan(JSONB), plan
- weather_cache: city, month, data(JSONB), cached_at — 24h TTL, upsert on conflict
- email_captures: trip_id, email
- usage_records: user_email, plan, trip_count, period_start — annual limit 12/year

## TypeScript Notes
- `tsconfig.json`: `moduleResolution: "bundler"`, `strict: true`, `skipLibCheck: true`
- `parseCities` fix: use `for..of` with `push` instead of `.map().filter()` to avoid null type predicate error
- TypeScript clean (0 errors) after 2026-02-28 full rewrite — verified with `npx tsc --noEmit`
- `crypto.subtle` available via `@cloudflare/workers-types` (no import needed)

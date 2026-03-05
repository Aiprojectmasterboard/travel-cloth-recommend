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
- `styleAgent({vibeResults,cities,weather?,userProfile?}, env): Promise<StylePrompts[]>` — Claude (Pro only)
- `imageGenAgent({prompts,tripId,jobIds?,faceUrl?}, env): Promise<GeneratedImages>` — NanoBanana (Pro only)
- `fulfillmentAgent({tripId,email?,galleryUrl}, env): Promise<void>` — Resend + R2 cleanup
- `growthAgent({tripId,moodName,plan}, env): Promise<GrowthResult>` — HMAC upgrade token + share copy
- `generateUpgradeToken(tripId, env): Promise<string>` — exported from growthAgent
- `verifyUpgradeToken(tripId, token, env): Promise<boolean>` — exported from growthAgent

## index.ts Routes (11 API endpoints)
1. GET  /api/health
2. POST /api/preview — Turnstile check (skip if SKIP_TURNSTILE==="true") + 5/day session rate limit
3. POST /api/preview/email — email_captures upsert + Resend mood card
4. POST /api/payment/checkout — Polar checkout (3 product IDs)
5. POST /api/payment/webhook — HMAC verify + order idempotency + runResult in waitUntil
6. POST /api/payment/upgrade — verifyUpgradeToken (3 min) + Polar Pro checkout
7. GET  /api/trips/:tripId — unified for ResultClient: trip+jobs+capsule+upgrade_token, 402 if no paid order
8. GET  /api/result/:tripId — legacy route, same auth check, nested {trip,order,capsule,images} shape
9. GET  /api/share/:tripId — public teaser data
10. POST /api/account/delete — JWT auth + cascade delete user data
11. POST /api/regenerate — regenerate 1 image for a city (pro/annual only, 1 regen per trip)

## Key Patterns
- Supabase: raw fetch helper (`sbFetch`) in each agent — no @supabase/supabase-js
- R2 write: `env.R2.put(key, buffer, {httpMetadata, customMetadata})`
- R2 delete: `env.R2.delete(key)` — native binding, NOT S3 client
- R2 bulk delete: `env.R2.list({prefix})` → `.objects.map(o => o.key)` → `Promise.allSettled(keys.map(delete))`
- Face URL to R2 key: `new URL(face_url).pathname.replace(/^\//, '')`
- Anthropic model: `claude-sonnet-4-6-20260219` (all Claude calls)
- NanoBanana: polls `/jobs/{id}` every 5s up to 60 attempts (5 min max)
- Upgrade token format: `"{timestampMs}.{hmacHex}"` — 3 min TTL
- Polar webhook headers: `webhook-signature`, `webhook-id`, `webhook-timestamp` (Standard Webhooks)
- Turnstile: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Rate limit: `Prefer: count=exact` → parse `content-range: 0-0/N` header

## Polar API Gotchas (CRITICAL — verified 2026-03-01)
- Checkout: use `success_url` NOT `return_url` — wrong field causes 502
- Polar follows Standard Webhooks spec for webhook signature verification:
  - Signed content: `"{webhook-id}.{webhook-timestamp}.{rawBody}"`
  - Signature header: `"v1,<base64>"` (space-delimited for multiple keys)
  - Secret may be prefixed with `whsec_` — strip prefix, then base64-decode to bytes
  - Customer email in event: `event.data.customer?.email` (NOT `event.data.user?.email`)
  - Metadata in event: `event.data.metadata` (from checkout metadata set at creation)
  - Amount field: `event.data.net_amount ?? event.data.amount`

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

## User Profile in Image Prompts (styleAgent — added 2026-03-02)
- `UserProfile` exported from `styleAgent.ts`: `{gender:'male'|'female'|'non-binary', height_cm?, weight_kg?, aesthetics:string[]}`
- `index.ts /api/preview` parses `gender`, `height_cm`, `weight_kg`, `style_preferences[]` from body
  → validates & stores as `gender`, `height_cm`, `weight_kg`, `aesthetics` columns on `trips` row
- `orchestrator runResult` reads those columns back from trips row → builds `UserProfile` → passes to `styleAgent`
- `buildProfileBlock()` injects profile text block into Claude user prompt
- `buildImagePrefix()` injects "Female model, petite figure, slim build, " at start of each image prompt
- Aesthetic keyword→guidance map: minimalist, classic, streetwear, bohemian, romantic, edgy, sporty, preppy, luxury, vintage
- All helpers degrade gracefully when profile is absent (no profile = neutral prompts, original behavior)
- DB columns required (add to migration if missing): `gender TEXT`, `height_cm NUMERIC`, `weight_kg NUMERIC`, `aesthetics JSONB`

## DB Tables (key columns used by agents)
- trips: id, session_id, cities(JSONB), month, face_url, status, vibe_data, weather_data, share_url, upgrade_token,
         gender, height_cm, weight_kg, aesthetics(JSONB)
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

## CORS Config (index.ts)
- Allowed origins: `https://travelcapsule.com`, `https://travelcapsule.ai`, `http://localhost:3000`
- Both production domains must be present — travelcapsule.ai was missing and was added 2026-02-28

## wrangler.toml Notes
- `SKIP_TURNSTILE = "false"` is a plain var — set to "true" locally via .dev.vars override
- `compatibility_date = "2025-01-01"` (updated from 2024-01-01)
- Must include SKIP_TURNSTILE in [vars] so `c.env.SKIP_TURNSTILE` resolves without TS errors

## Face Reference Image — imageGenAgent (updated 2026-03-02)
- `generateWithRetry` now fetches `faceUrl` as binary and passes as `inline_data` to Gemini (multimodal)
- Build: `fetch(faceUrl, AbortSignal.timeout(10_000))` → `arrayBuffer()` → byte loop → `btoa()` → `{ inline_data: { mime_type, data } }`
- If fetch fails (network error, timeout, non-2xx): warn and continue without face reference — graceful degradation
- Request `parts` array order: [image inline_data, face instruction text, main prompt text] when face present
- Variable naming: request array is `parts: GeminiPart[]`, response array renamed `responseParts` to avoid same-scope collision
- Face photo R2 deletion in `/api/generate`: `c.env.R2.delete(r2Key)` after `Promise.all([imageGenAgent, ...])` resolves
  - Only deletes keys starting with `faces/temp-` (guards against stripping producing wrong key)
  - Best-effort try/catch — deletion failure must never fail the API response

## Error Handling / Resilience Patterns (added 2026-03-01)
- `teaserAgent`: Has 3-attempt exponential backoff (1s/2s/4s) via `generateWithRetry` — same as imageGenAgent
- `orchestrator runResult`: `capsuleAgent` wrapped in try/catch with `PaidCapsuleResult` fallback
  so `fulfillmentAgent` ALWAYS runs (guarantees face cleanup + email delivery)
- `orchestrator runResult`: Pro/Annual — `cleanupFace()` called IMMEDIATELY after `imageGenAgent` returns
  (success or failure). Standard — face cleanup handled by fulfillmentAgent.
- `cleanupFace(tripId, faceUrl, env)` in orchestrator: non-throwing helper, R2 delete + DB null face_url
- Rate limit /api/preview: session_id AND IP (OR조건) 각각 5/day — migration 004 (trips.client_ip 컬럼)
  - IP: `CF-Connecting-IP` 헤더, fallback `X-Forwarded-For`; IP 없으면 session_id만 체크
  - trip INSERT에 `client_ip` 저장 (rate limit용, API 응답에 노출 안 함)
- Turnstile: SKIP_TURNSTILE !== 'true' + 키 미설정 → 503 fail-closed (이전: warn+통과)

## Regenerate Endpoint Notes (added 2026-03-01)
- Route: POST /api/regenerate — body `{ trip_id, city }`, no mandatory auth header
- Quota: pro=1 regen/trip, annual=1 regen/trip, standard=403 plan_not_eligible
- Regen tracking workaround: generation_jobs.job_type CHECK only allows 'teaser'|'full' (NOT 'regen')
  - Store regen jobs with job_type='full' AND mood='regen-<timestamp>'
  - Count regens by querying: `mood=like.regen-*` filter on generation_jobs
  - TODO migration: add 'regen' to CHECK constraint, then use job_type='regen'
- Order lookup uses status='paid' (not 'completed' as spec says — actual DB column values)
- imageGenAgent called with dynamic import: `const { imageGenAgent } = await import('./agents/imageGenAgent')`
- Prompt sourced from: (1) existing completed full-gen job prompt, (2) vibe_data mood, (3) generic fallback
- R2 key for regen image: `outputs/{tripId}/{citySlug}/{index}.png` — index auto-incremented by imageGenAgent
- DB insert for regen job is non-fatal: failure is logged but 200 still returned if image was generated

## Business Logic Constraints
- `/api/preview` cities: max 5 (per CLAUDE.md spec) — enforce `cities.length > 5` in validation
- `/api/payment/upgrade`: creates Polar checkout for `POLAR_PRODUCT_ID_PRO` (full $12 price)
  - Known gap: needs separate Polar product for $7 upgrade delta — current impl charges full Pro price
- Annual plan trip_count reset: does NOT auto-reset on Polar subscription renewal (no renewal webhook yet)
- NanoBanana is Gemini-based — uses Google generativelanguage.googleapis.com with NANOBANANA_API_KEY as x-goog-api-key header
- Polar checkout `success_url`: MUST be `/checkout/success?plan={plan}&tripId={tripId}` (NOT `/result/{tripId}`)
  — the checkout/success page reads ?plan to route to StandardView/ProView/AnnualView

## GET /api/result/:tripId Response Shape (CONFIRMED 2026-03-02)
- Returns BOTH flat fields (for `api.ts ResultData`) AND nested `trip`/`order` fields (legacy)
- Flat: `trip_id, plan, cities, month, weather, vibes, capsule{items,daily_plan}, images[{city,url,index}], teaser_url, growth, created_at`
- Legacy nested: `trip, order, share_url`
- `images` = completed full/regen generation_jobs rows, mapped to `{city, url, index}` (NOT raw `image_url`)
- `plan` is at TOP LEVEL extracted from `order.plan` — NOT buried inside nested `order`
- `vibes`/`weather` sourced from `trip.vibe_data` / `trip.weather_data` (set by runPreview)

## packages/types/index.ts Key Alignments (2026-03-02)
- `WeatherResult.diurnal_swing`: optional (weatherAgent doesn't return it)
- `WeatherResult.month`: optional (weatherAgent includes it, packages/types didn't — now aligned)
- `VibeResult.mood_label`: optional — vibeAgent sets it as `"{City} — {mood_name}"`, packages/types didn't have it
- These mismatches were causing silent runtime gaps between api.ts types and actual agent output

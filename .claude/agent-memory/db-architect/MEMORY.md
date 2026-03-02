# DB Architect Agent Memory — Travel Capsule AI

## Migration Files
- `supabase/migrations/001_initial_schema.sql` — 8-table schema (added 2026-02-28)
- `supabase/migrations/002_add_preview_columns.sql` — preview pipeline columns + job_type/status CHECK fixes
- `supabase/migrations/003_usage_records_period_index.sql` — Annual quota composite index (added 2026-03-01)
- `supabase/migrations/004_add_client_ip.sql` — trips.client_ip INET + idx_trips_client_ip_created_at for rate limiting (added 2026-03-01)
- `supabase/migrations/005_add_regen_job_type.sql` — extends generation_jobs.job_type CHECK to include 'regen'; backfills old mood=like.regen-* workaround rows (added 2026-03-01)
- `supabase/migrations/006_add_user_profile.sql` — trips user-profile columns for NanoBanana prompt personalisation (added 2026-03-02)

## Schema: 8 Tables (v3)
1. trips — session_id, cities(JSONB), month, face_url, status, gallery_url, expires_at, client_ip(INET nullable), gender(TEXT nullable), height_cm(NUMERIC nullable), weight_kg(NUMERIC nullable), aesthetics(JSONB DEFAULT '[]')
2. orders — polar_order_id(UNIQUE), trip_id, plan, amount, upgrade_from, status, customer_email
3. generation_jobs — trip_id, city, job_type, prompt, negative_prompt, status, image_url, attempts
4. capsule_results — trip_id(UNIQUE FK), items(JSONB), daily_plan(JSONB)
5. city_vibes — city(UNIQUE), country, lat, lon, vibe_cluster, style_keywords(JSONB), mood_name
6. weather_cache — city, month, data(JSONB), cached_at; UNIQUE(city, month)
7. email_captures — trip_id FK, email, captured_at
8. usage_records — user_email, plan, trip_count, period_start(DATE), period_end(DATE)

## RLS Access Model (v2)
- Service role: explicit ALL USING (true) policy on every table (documents intent).
- No JWT users in v1. Anon role is the only client-side role.
- trips/generation_jobs/capsule_results/city_vibes/weather_cache: anon SELECT USING (true).
  trip_id UUID is the unguessable access token — no session-var check needed for read path.
- trips: anon INSERT WITH CHECK (true).
- email_captures: anon INSERT WITH CHECK (true); anon SELECT USING (false).
- orders/usage_records: anon SELECT USING (false) — never exposed to client.

## Key Table Decisions (v2)
- trips.status CHECK: ('pending','processing','completed','expired') — not 'failed'.
- trips.expires_at: NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'). Indexed for expiry sweep.
- orders.plan: TEXT NOT NULL CHECK ('standard','pro','annual').
- orders.upgrade_from: UUID REFERENCES orders(id) nullable — plan upgrade chain.
- orders.amount: INTEGER NOT NULL (no default — explicit on insert). Cents: 500 = $5.00.
- generation_jobs.job_type: TEXT NOT NULL CHECK ('teaser','full','regen'). 'regen' added in migration 005.
- generation_jobs.prompt: TEXT NOT NULL (required on insert in v2).
- city_vibes.style_keywords: JSONB (not TEXT[]) — consistent with cities.json source format.
- city_vibes.mood_name: TEXT NOT NULL — new in v2.
- weather_cache.data JSONB; cached_at TIMESTAMPTZ DEFAULT NOW().
- usage_records.period_start/period_end: DATE (calendar-day aligned billing windows).

## Idempotency Patterns
- Tables: CREATE TABLE IF NOT EXISTS
- Indexes: CREATE INDEX IF NOT EXISTS
- Functions: CREATE OR REPLACE FUNCTION
- Triggers: CREATE OR REPLACE TRIGGER (Postgres 14+)
- RLS Policies: DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;

## Indexes Summary (v2)
- trips: session_id, status, expires_at (btree), cities (GIN), (client_ip, created_at) composite for rate-limit query, aesthetics (GIN) for @> containment queries
- orders: trip_id (btree); polar_order_id auto-indexed by UNIQUE
- generation_jobs: trip_id, status (btree)
- capsule_results: trip_id (btree), items, daily_plan (GIN)
- city_vibes: city (btree), style_keywords (GIN)
- weather_cache: (city, month) composite btree + UNIQUE index
- email_captures: trip_id (btree)
- usage_records: (user_email, plan) btree + (user_email, plan, period_start, period_end) for Annual quota query

## JSONB Structures
- trips.cities: [{"name": "Paris", "country": "France", "days": 4, "lat": 48.8566, "lon": 2.3522}]
- trips.aesthetics: ["minimalist", "bohemian", "streetwear"] — user style tags from TripClient Step 2
- capsule_results.items: [{"name": "Linen Blazer", "category": "outerwear", "why": "...", "versatility_score": 9}]
- capsule_results.daily_plan: [{"day": 1, "city": "Paris", "outfit": ["item_a"], "note": "..."}]
- city_vibes.style_keywords: ["trench coat", "silk scarf", "ballet flat"]

## city-vibes-db (packages/city-vibes-db/cities.json)
- 30 cities with mood_name field. lat/lon to 6 decimal places (matches NUMERIC(9,6)).
- Cities: Paris, Tokyo, Bali, New York, Barcelona, London, Rome, Seoul, Sydney, Dubai,
  Amsterdam, Lisbon, Prague, Marrakech, Kyoto, Singapore, Istanbul, Buenos Aires, Cape Town,
  Bangkok, Vienna, Mexico City, Berlin, Mumbai, Copenhagen, Ho Chi Minh City, Athens, Zurich,
  Cairo, Reykjavik.

## Types Package (packages/types/index.ts)
- Scalar types: PlanType, TripStatus, JobType, ClimateBand, JobStatus
- Input: CityInput, TripInput
- Agent results: WeatherResult, VibeResult, TeaserResult, CapsuleItem, DayPlan, CapsuleResult,
  StylePrompts, GeneratedImage, GeneratedImages, GrowthResult, ShareResult, UsageRecord
- API responses: PreviewResponse, CheckoutResponse
- DB rows: Trip, Order, GenerationJob, CityVibe

## Security Notes
- Polar webhook: HMAC-SHA256 verified at Worker level before any DB write.
- Raw card data: never stored. face_url nulled after image generation (privacy).
- Service role key: Worker env only, never client-side.
- email_captures: SELECT denied to anon — emails never returned to browser.
- trips.height_cm / weight_kg: soft-PII — null after image generation, same lifecycle as face_url. Raw numerics stored; labels derived server-side in outfitGenerator.buildProfile().
- trips.gender CHECK: ('male','female','non-binary') only — matches TripClient Step 2 UI options.

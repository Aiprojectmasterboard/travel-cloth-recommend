-- Migration: 001_initial_schema.sql
-- Description: Full initial schema for Travel Capsule AI — 8 tables:
--              trips, orders, generation_jobs, capsule_results, city_vibes,
--              weather_cache, email_captures, usage_records.
--              Includes RLS policies, indexes, and updated_at triggers.
-- Created: 2026-02-28
-- Author: DB Architect Agent
--
-- Access model summary:
--   - Cloudflare Worker uses SUPABASE_SERVICE_ROLE_KEY → bypasses RLS entirely.
--     An explicit service_role ALL policy is added to each table for clarity and
--     future-proofing (in case Supabase changes bypass behaviour).
--   - Next.js client uses NEXT_PUBLIC_SUPABASE_ANON_KEY → subject to RLS.
--   - Anon access is intentionally permissive for the trip/result read path
--     (no session-variable guard required in v1 — the Worker controls all writes
--     and the public share model only needs trip_id to be unguessable).
--   - No authenticated (JWT) user access is needed for v1 — purely session-based.
--   - orders and usage_records: anon SELECT is explicitly denied (USING (false)).
--
-- Payment security:
--   - Polar webhook HMAC-SHA256 signature is verified in the Worker before any
--     DB write.  Raw card data is never stored.
--   - orders.polar_order_id UNIQUE constraint prevents double-fulfillment on
--     duplicate webhook deliveries.
--
-- Privacy:
--   - trips.face_url is nullable and MUST be set to NULL immediately after image
--     generation completes.  See comment on the column below.
--
-- Idempotency: every statement uses IF NOT EXISTS / CREATE OR REPLACE / DO-block
-- so this file is safe to re-run (e.g., during local development resets or CI).

-- ─── updated_at helper function ──────────────────────────────────────────────
-- Created first so triggers can reference it immediately.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. trips
-- ─────────────────────────────────────────────────────────────────────────────
-- One row per user styling session.  face_url is temporary — it MUST be set to
-- NULL immediately after image generation completes (privacy requirement).
--
-- cities JSONB structure: [{"name": "Paris", "country": "France", "days": 4, "lat": 48.8566, "lon": 2.3522}, ...]
-- status values: pending → processing → completed | expired
-- expires_at: 48-hour TTL; expired rows may be purged by a scheduled Worker job.

CREATE TABLE IF NOT EXISTS trips (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT         NOT NULL,
  cities      JSONB        NOT NULL DEFAULT '[]',
  month       INTEGER      NOT NULL CHECK (month BETWEEN 1 AND 12),
  face_url    TEXT,        -- Nulled after image generation for privacy
  status      TEXT         NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'processing', 'completed', 'expired')),
  gallery_url TEXT,        -- Populated by fulfillmentAgent after R2 upload
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_session_id  ON trips(session_id);
CREATE INDEX IF NOT EXISTS idx_trips_status       ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_expires_at   ON trips(expires_at); -- used by expiry sweep job
CREATE INDEX IF NOT EXISTS idx_trips_cities_gin   ON trips USING GIN (cities);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Service role: full access (bypass is automatic, but explicit policy documents intent)
DO $$ BEGIN
  CREATE POLICY "trips_service_role_all" ON trips
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon SELECT: any anon user may read any trip row.
-- trip_id is a UUID (unguessable) — this is the access-control mechanism for
-- the public share/result page.  No session-variable check is needed here.
DO $$ BEGIN
  CREATE POLICY "trips_anon_select" ON trips
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon INSERT: clients create their own trip row.
DO $$ BEGIN
  CREATE POLICY "trips_anon_insert" ON trips
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- trips updated_at trigger
CREATE OR REPLACE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. orders
-- ─────────────────────────────────────────────────────────────────────────────
-- One row per Polar payment event.
-- polar_order_id UNIQUE enforces webhook idempotency: a duplicate webhook for
-- the same Polar order hits the UNIQUE constraint and is safely rejected.
--
-- plan values: standard | pro | annual
-- amount: stored in cents (500 = $5.00 USD).
-- upgrade_from: self-referential FK for plan upgrade tracking (nullable).
-- customer_email: used by fulfillmentAgent to send the gallery link email.
--
-- NOTE: Polar webhook HMAC-SHA256 verified at Worker level before any DB write.
--       Raw card data is never stored here.

CREATE TABLE IF NOT EXISTS orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  polar_order_id   TEXT         NOT NULL UNIQUE, -- idempotency key for Polar webhooks
  trip_id          UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  plan             TEXT         NOT NULL CHECK (plan IN ('standard', 'pro', 'annual')),
  amount           INTEGER      NOT NULL,        -- in cents, e.g. 500 = $5.00
  upgrade_from     UUID         REFERENCES orders(id), -- nullable; set on plan upgrades
  status           TEXT         NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'paid', 'refunded')),
  customer_email   TEXT,        -- used by fulfillmentAgent for email delivery
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- polar_order_id already has a unique btree index from the UNIQUE constraint.
CREATE INDEX IF NOT EXISTS idx_orders_trip_id ON orders(trip_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "orders_service_role_all" ON orders
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon: no read access to payment data.
-- USING (false) makes this explicit and avoids any accidental permissive overlap.
DO $$ BEGIN
  CREATE POLICY "orders_anon_select_deny" ON orders
    FOR SELECT TO anon
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. generation_jobs
-- ─────────────────────────────────────────────────────────────────────────────
-- One row per city-image generation task.
-- job_type: 'teaser' (watermarked preview) | 'full' (paid, full-resolution).
-- imageGenAgent increments attempts on each retry; max 3 retries enforced in
-- Worker code.  ON DELETE CASCADE cleans up orphaned jobs if the trip is removed.
--
-- prompt: positive NanoBanana prompt, built by styleAgent.
-- negative_prompt: NanoBanana-specific negative guidance.

CREATE TABLE IF NOT EXISTS generation_jobs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id          UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city             TEXT         NOT NULL,
  job_type         TEXT         NOT NULL CHECK (job_type IN ('teaser', 'full')),
  prompt           TEXT         NOT NULL,
  negative_prompt  TEXT,        -- NanoBanana negative prompt, optional
  status           TEXT         NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url        TEXT,        -- R2 CDN URL, populated after successful generation
  attempts         INTEGER      NOT NULL DEFAULT 0, -- max 3 retries enforced in Worker
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_trip_id ON generation_jobs(trip_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status  ON generation_jobs(status);

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "generation_jobs_service_role_all" ON generation_jobs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon SELECT: read-only access for result display (trip_id is the access token)
DO $$ BEGIN
  CREATE POLICY "generation_jobs_anon_select" ON generation_jobs
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- generation_jobs updated_at trigger
CREATE OR REPLACE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. capsule_results
-- ─────────────────────────────────────────────────────────────────────────────
-- One row per trip (UNIQUE on trip_id).  capsuleAgent writes the final wardrobe
-- items and daily outfit plan here after image generation completes.
-- ON DELETE CASCADE cleans up if the parent trip is removed.
--
-- items JSONB structure:
--   [{"name": "Linen Blazer", "category": "outerwear", "why": "...", "versatility_score": 9}, ...]
--
-- daily_plan JSONB structure:
--   [{"day": 1, "city": "Paris", "outfit": ["item_a", "item_b"], "note": "..."}, ...]

CREATE TABLE IF NOT EXISTS capsule_results (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID         NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  items       JSONB        NOT NULL DEFAULT '[]', -- 8-12 wardrobe items
  daily_plan  JSONB        NOT NULL DEFAULT '[]', -- per-day outfit assignments
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capsule_results_trip_id        ON capsule_results(trip_id);
CREATE INDEX IF NOT EXISTS idx_capsule_results_items_gin      ON capsule_results USING GIN (items);
CREATE INDEX IF NOT EXISTS idx_capsule_results_daily_plan_gin ON capsule_results USING GIN (daily_plan);

ALTER TABLE capsule_results ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "capsule_results_service_role_all" ON capsule_results
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon SELECT: read-only (trip_id is the access token)
DO $$ BEGIN
  CREATE POLICY "capsule_results_anon_select" ON capsule_results
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. city_vibes
-- ─────────────────────────────────────────────────────────────────────────────
-- Reference / seed data for 30 cities.  Read-only from the client side.
-- Populated by seed script using packages/city-vibes-db/cities.json.
--
-- style_keywords: JSONB array of style tag strings.
--   Example: ["trench coat", "silk scarf", "ballet flat", "beret"]
--   JSONB is used (not TEXT[]) to stay consistent with the cities.json source
--   format and to allow richer filtering in future (e.g., @> queries by tag).
--
-- mood_name: short evocative label used in UI and image prompts, e.g. "Rainy Chic".
-- vibe_cluster: machine-readable cluster tag, e.g. "romantic-chic".
-- lat/lon: NUMERIC(9,6) for consistent precision (e.g., 48.856614).
-- city: UNIQUE (one canonical entry per city name).

CREATE TABLE IF NOT EXISTS city_vibes (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  city           TEXT          NOT NULL UNIQUE,
  country        TEXT          NOT NULL,
  lat            NUMERIC(9,6)  NOT NULL,
  lon            NUMERIC(9,6)  NOT NULL,
  vibe_cluster   TEXT          NOT NULL,
  style_keywords JSONB         NOT NULL DEFAULT '[]',
  mood_name      TEXT          NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_vibes_city              ON city_vibes(city);
CREATE INDEX IF NOT EXISTS idx_city_vibes_style_keywords_gin ON city_vibes USING GIN (style_keywords);

ALTER TABLE city_vibes ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "city_vibes_service_role_all" ON city_vibes
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public read: city reference data is not sensitive
DO $$ BEGIN
  CREATE POLICY "city_vibes_anon_select" ON city_vibes
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. weather_cache
-- ─────────────────────────────────────────────────────────────────────────────
-- Caches Open-Meteo API responses (city + month key) to avoid redundant API
-- calls on repeated trip requests for the same city/month combination.
-- cached_at is used by the climateAgent to decide whether to refresh.
-- UNIQUE(city, month) enforces one cache row per city+month pair.
--
-- data JSONB structure (Open-Meteo response subset):
--   {"temp_min": 8.2, "temp_max": 16.5, "precipitation_prob": 0.42, ...}

CREATE TABLE IF NOT EXISTS weather_cache (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  city       TEXT         NOT NULL,
  month      INTEGER      NOT NULL CHECK (month BETWEEN 1 AND 12),
  data       JSONB        NOT NULL DEFAULT '{}',
  cached_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (city, month)
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_city_month ON weather_cache(city, month);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Service role: full access (all reads/writes go through Worker)
DO $$ BEGIN
  CREATE POLICY "weather_cache_service_role_all" ON weather_cache
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon SELECT: clients may read cached weather to display climate info
DO $$ BEGIN
  CREATE POLICY "weather_cache_anon_select" ON weather_cache
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. email_captures
-- ─────────────────────────────────────────────────────────────────────────────
-- Stores email addresses submitted by users for gallery delivery.
-- Linked to a trip via FK.  ON DELETE CASCADE removes email if trip is purged.
-- email is not UNIQUE here — the same address may be entered for multiple trips.
-- Deduplication for marketing is handled at the application layer.

CREATE TABLE IF NOT EXISTS email_captures (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID         NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email       TEXT         NOT NULL,
  captured_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_captures_trip_id ON email_captures(trip_id);

ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "email_captures_service_role_all" ON email_captures
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon INSERT: user submits their own email address
DO $$ BEGIN
  CREATE POLICY "email_captures_anon_insert" ON email_captures
    FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon SELECT: intentionally denied — email addresses are never returned to the client
DO $$ BEGIN
  CREATE POLICY "email_captures_anon_select_deny" ON email_captures
    FOR SELECT TO anon
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. usage_records
-- ─────────────────────────────────────────────────────────────────────────────
-- Tracks usage against annual / pro plan quotas.  One row per user+plan+period.
-- trip_count is incremented by the Worker on each fulfilled trip.
-- period_start / period_end define the billing window (DATE, not TIMESTAMPTZ,
-- because billing periods are calendar-day aligned).
--
-- user_email is the primary identifier (no auth user ID in v1).
-- plan defaults to 'annual' as the primary subscription tier.

CREATE TABLE IF NOT EXISTS usage_records (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    TEXT         NOT NULL,
  plan          TEXT         NOT NULL DEFAULT 'annual'
                             CHECK (plan IN ('standard', 'pro', 'annual')),
  trip_count    INTEGER      NOT NULL DEFAULT 0,
  period_start  DATE         NOT NULL,
  period_end    DATE         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_email_plan ON usage_records(user_email, plan);

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ BEGIN
  CREATE POLICY "usage_records_service_role_all" ON usage_records
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon: no access — usage data is internal only
DO $$ BEGIN
  CREATE POLICY "usage_records_anon_select_deny" ON usage_records
    FOR SELECT TO anon
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries (run after applying migration to confirm success)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm all 8 tables exist:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    ORDER BY table_name;
--    Expected: capsule_results, city_vibes, email_captures, generation_jobs,
--              orders, trips, usage_records, weather_cache

-- 2. Confirm RLS is enabled on all tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY tablename;
--    Expected: rowsecurity = true for all 8 tables

-- 3. Confirm all RLS policies:
--    SELECT tablename, policyname, roles, cmd, qual
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;

-- 4. Confirm all indexes:
--    SELECT indexname, tablename FROM pg_indexes
--    WHERE schemaname = 'public'
--    ORDER BY tablename, indexname;

-- 5. Confirm updated_at triggers:
--    SELECT trigger_name, event_object_table
--    FROM information_schema.triggers
--    WHERE trigger_schema = 'public'
--    ORDER BY event_object_table;
--    Expected: trips_updated_at, generation_jobs_updated_at

-- 6. Confirm orders.polar_order_id UNIQUE constraint (idempotency check):
--    SELECT conname, contype FROM pg_constraint
--    WHERE conrelid = 'orders'::regclass AND contype = 'u';
--    Expected: orders_polar_order_id_key  u

-- 7. Confirm weather_cache composite UNIQUE constraint:
--    SELECT conname, contype FROM pg_constraint
--    WHERE conrelid = 'weather_cache'::regclass AND contype = 'u';
--    Expected: weather_cache_city_month_key  u

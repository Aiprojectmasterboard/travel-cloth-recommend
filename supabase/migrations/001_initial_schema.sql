-- Migration: 001_initial_schema.sql
-- Description: Initial schema for Travel Capsule AI — trips, orders,
--              generation_jobs, capsule_results, city_vibes tables with
--              RLS policies, indexes, and updated_at triggers.
-- Created: 2026-02-26
-- Author: DB Architect Agent
--
-- Access model summary:
--   - Cloudflare Worker uses SUPABASE_SERVICE_ROLE_KEY → bypasses RLS entirely.
--   - Next.js client uses NEXT_PUBLIC_SUPABASE_ANON_KEY → subject to RLS.
--   - Anon users identify themselves via the 'app.session_id' session variable,
--     set at query time: SET LOCAL app.session_id = '<value>';
--   - No authenticated (JWT) user access is needed for v1 — purely session-based.
--
-- Idempotency: every statement uses IF NOT EXISTS or CREATE OR REPLACE so this
-- file is safe to run multiple times (e.g., during local development resets).

-- ─── updated_at helper function ──────────────────────────────────────────────
-- Created before tables so triggers can reference it immediately.
-- Using CREATE OR REPLACE makes this idempotent.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── trips ───────────────────────────────────────────────────────────────────
-- One row per user styling session. face_url is temporary — it MUST be set to
-- NULL immediately after image generation completes (privacy requirement).

CREATE TABLE IF NOT EXISTS trips (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL,
  -- cities JSONB structure: [{"name": "Paris", "days": 4}, ...]
  cities      JSONB       NOT NULL DEFAULT '[]',
  month       INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  face_url    TEXT,       -- Nulled after image generation for privacy
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  gallery_url TEXT,       -- Populated by fulfillmentAgent after R2 upload
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_session_id ON trips(session_id);
CREATE INDEX IF NOT EXISTS idx_trips_status     ON trips(status);
-- GIN index for querying inside the cities JSONB array
CREATE INDEX IF NOT EXISTS idx_trips_cities_gin ON trips USING GIN (cities);

-- trips RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: users may only read trips that belong to their own session.
-- The Worker sets `SET LOCAL app.session_id = ?` before executing anon queries.
DO $$ BEGIN
  CREATE POLICY "trips_anon_select" ON trips
    FOR SELECT TO anon
    USING (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Anon INSERT: users create their own trip row; session_id is enforced by the
-- WITH CHECK so a client cannot insert a row for a different session.
DO $$ BEGIN
  CREATE POLICY "trips_anon_insert" ON trips
    FOR INSERT TO anon
    WITH CHECK (session_id = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role bypasses RLS automatically — no explicit policy needed.
-- All Worker writes (UPDATE status, NULL face_url, set gallery_url) go through
-- the service role key and are therefore unrestricted.

-- trips updated_at trigger
CREATE OR REPLACE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── orders ──────────────────────────────────────────────────────────────────
-- One row per Polar payment. polar_order_id UNIQUE enforces webhook idempotency:
-- a duplicate webhook for the same order will hit the UNIQUE constraint and be
-- safely rejected without double-fulfillment.
--
-- NOTE: Polar webhook signature (HMAC-SHA256) is verified in the Worker before
-- any DB write. Raw card data is never stored here.

CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  polar_order_id   TEXT        NOT NULL UNIQUE, -- idempotency key for Polar webhooks
  trip_id          UUID        NOT NULL REFERENCES trips(id),
  status           TEXT        NOT NULL DEFAULT 'paid'
                               CHECK (status IN ('pending', 'paid', 'refunded')),
  amount           INTEGER     NOT NULL DEFAULT 500, -- stored in cents (500 = $5.00 USD)
  customer_email   TEXT,       -- used by fulfillmentAgent to send the gallery link
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- orders indexes
-- polar_order_id already has a unique index from the UNIQUE constraint.
CREATE INDEX IF NOT EXISTS idx_orders_trip_id ON orders(trip_id);

-- orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders are write-only from the service role (Polar webhook handler).
-- Anon clients must NEVER read or write order data directly — no anon policy.
-- Service role bypasses RLS automatically.

-- ─── generation_jobs ─────────────────────────────────────────────────────────
-- One row per city-image generation task. imageGenAgent writes attempts and
-- status here. ON DELETE CASCADE ensures orphaned jobs are cleaned up if the
-- parent trip is deleted.

CREATE TABLE IF NOT EXISTS generation_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city            TEXT        NOT NULL,
  mood            TEXT        NOT NULL,
  prompt          TEXT,       -- NanoBanana positive prompt, built by styleAgent
  negative_prompt TEXT,       -- NanoBanana negative prompt
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url       TEXT,       -- R2 CDN URL, populated after successful generation
  attempts        INTEGER     NOT NULL DEFAULT 0, -- imageGenAgent retries up to 3×
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- generation_jobs indexes
CREATE INDEX IF NOT EXISTS idx_generation_jobs_trip_id ON generation_jobs(trip_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status  ON generation_jobs(status);

-- generation_jobs RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: allow reading jobs that belong to a trip in the current session.
-- The sub-select re-uses the same session_id guard from the trips table.
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

-- All writes (INSERT / UPDATE) are performed by the Worker via service role.

-- generation_jobs updated_at trigger
CREATE OR REPLACE TRIGGER generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── capsule_results ─────────────────────────────────────────────────────────
-- One row per trip (UNIQUE on trip_id). capsuleAgent writes the final wardrobe
-- items and daily outfit plan here after image generation completes.
-- ON DELETE CASCADE keeps the DB clean if a trip is removed.
--
-- items JSONB structure:
--   [{"name": "Linen Blazer", "category": "outerwear", "color": "beige", ...}, ...]
--
-- daily_plan JSONB structure:
--   [{"day": 1, "city": "Paris", "outfit": "...", "image_url": "..."}, ...]

CREATE TABLE IF NOT EXISTS capsule_results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  items       JSONB       NOT NULL DEFAULT '[]', -- 8-12 wardrobe items
  daily_plan  JSONB       NOT NULL DEFAULT '[]', -- per-day outfit assignments
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- capsule_results indexes
CREATE INDEX IF NOT EXISTS idx_capsule_results_trip_id   ON capsule_results(trip_id);
-- GIN indexes for querying inside JSONB arrays (e.g., filter by category/city)
CREATE INDEX IF NOT EXISTS idx_capsule_results_items_gin      ON capsule_results USING GIN (items);
CREATE INDEX IF NOT EXISTS idx_capsule_results_daily_plan_gin ON capsule_results USING GIN (daily_plan);

-- capsule_results RLS
ALTER TABLE capsule_results ENABLE ROW LEVEL SECURITY;

-- Anon SELECT: allow reading results for trips in the current session.
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

-- All writes are performed by the Worker via service role.

-- ─── city_vibes ──────────────────────────────────────────────────────────────
-- Reference/seed data for 30 cities. Read-only from the client side.
-- Populated via seed script (packages/city-vibes-db/cities.json).
--
-- style_keywords is TEXT[] (Postgres native array) rather than JSONB because
-- it is a flat list of strings with no nested structure. GIN indexing works on
-- both; TEXT[] is more compact and easier to query with the && and @> operators.

CREATE TABLE IF NOT EXISTS city_vibes (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  city           TEXT         NOT NULL UNIQUE,
  country        TEXT         NOT NULL,
  lat            NUMERIC(9,6) NOT NULL, -- e.g., 48.856614
  lon            NUMERIC(9,6) NOT NULL, -- e.g., 2.352222
  vibe_cluster   TEXT         NOT NULL, -- e.g., 'romantic', 'urban-edge', 'coastal'
  style_keywords TEXT[]       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- city_vibes indexes
CREATE INDEX IF NOT EXISTS idx_city_vibes_city ON city_vibes(city);
-- GIN index allows efficient `style_keywords && ARRAY['minimalist']` queries
CREATE INDEX IF NOT EXISTS idx_city_vibes_style_keywords_gin
  ON city_vibes USING GIN (style_keywords);

-- city_vibes RLS
ALTER TABLE city_vibes ENABLE ROW LEVEL SECURITY;

-- city_vibes is public reference data — anon and authenticated users may read.
DO $$ BEGIN
  CREATE POLICY "city_vibes_public_read" ON city_vibes
    FOR SELECT TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- All writes (seed inserts, updates) are performed via service role.

-- ─── Verification queries (run after applying to confirm success) ─────────────
--
-- 1. Confirm all five tables exist:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    ORDER BY table_name;
--
-- 2. Confirm RLS is enabled on all tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY tablename;
--
-- 3. Confirm all RLS policies:
--    SELECT tablename, policyname, roles, cmd
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;
--
-- 4. Confirm all indexes:
--    SELECT indexname, tablename FROM pg_indexes
--    WHERE schemaname = 'public'
--    ORDER BY tablename, indexname;
--
-- 5. Confirm triggers:
--    SELECT trigger_name, event_object_table
--    FROM information_schema.triggers
--    WHERE trigger_schema = 'public'
--    ORDER BY event_object_table;
--
-- 6. Confirm orders.polar_order_id UNIQUE constraint (idempotency check):
--    SELECT conname, contype FROM pg_constraint
--    WHERE conrelid = 'orders'::regclass AND contype = 'u';

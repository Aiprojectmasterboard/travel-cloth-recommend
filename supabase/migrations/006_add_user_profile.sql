-- Migration: 006_add_user_profile.sql
-- Description: Add user profile columns to trips for personalised image generation.
--              gender, height_cm, weight_kg, and aesthetics are passed by the
--              Worker to NanoBanana when building the image generation prompt.
--              All columns are nullable so existing rows and anonymous sessions
--              that skip the profile step remain fully compatible.
-- Created: 2026-03-02
-- Author: DB Architect Agent
--
-- Prompt-building usage (Worker / styleAgent):
--   gender     → body silhouette directive in the NanoBanana positive prompt
--                e.g. "female figure", "male figure", "person"
--   height_cm  → used by outfitGenerator.ts to derive a proportional length cue
--                e.g. "tall", "petite" (binned server-side, never stored as a label)
--   weight_kg  → combined with height_cm to derive BMI-based size recommendation
--                (S/M/L/XL) — the raw numeric value is what is stored here;
--                the label derivation happens in outfitGenerator.buildProfile()
--   aesthetics → user-selected style tags from Step 2 of the TripClient form
--                (e.g. ["minimalist", "bohemian", "streetwear"])
--                stored as JSONB to allow future @> operator filtering and to
--                match the existing JSONB-first convention in this schema
--
-- Privacy / data minimisation:
--   height_cm and weight_kg are soft-PII.  Like trips.face_url, they should be
--   set to NULL after image generation completes and are subject to the existing
--   48-hour expires_at TTL sweep in the Worker.
--
-- Idempotency: every ADD COLUMN uses IF NOT EXISTS.  Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- trips: user profile columns
-- ─────────────────────────────────────────────────────────────────────────────

-- Gender identifier.
-- Used in NanoBanana prompt as the body silhouette directive.
-- Allowed values are intentionally limited to the three options presented in the
-- TripClient Step 2 UI; NULL means the user skipped the profile step.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('male', 'female', 'non-binary'));
  -- NanoBanana prompt directive: "male figure" | "female figure" | "person"

-- Height in centimetres.
-- NUMERIC(5,1) accommodates values from 0.0 to 9999.9 cm; realistic range is
-- 100.0–250.0 cm.  Precision of one decimal place matches common scale accuracy.
-- Passed to outfitGenerator.buildProfile() for proportional length cues.
-- Soft-PII: NULL after image generation (same lifecycle as face_url).
ALTER TABLE trips ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1);
  -- Nulled after image generation for privacy (soft-PII, same lifecycle as face_url)

-- Weight in kilograms.
-- NUMERIC(5,1) accommodates values from 0.0 to 9999.9 kg; realistic range is
-- 30.0–300.0 kg.  Combined with height_cm in outfitGenerator.buildProfile() to
-- derive BMI-based size recommendation (S/M/L/XL) used in the NanoBanana prompt.
-- Soft-PII: NULL after image generation (same lifecycle as face_url).
ALTER TABLE trips ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1);
  -- Nulled after image generation for privacy (soft-PII, same lifecycle as face_url)

-- User-selected aesthetic / style preference tags.
-- Collected on TripClient Step 2 (Aesthetic step).
-- JSONB array of strings, e.g. ["minimalist", "bohemian", "streetwear"].
-- Used by styleAgent to inject style adjectives into the NanoBanana positive prompt
-- and by capsuleAgent to filter wardrobe items toward the user's stated preferences.
-- DEFAULT '[]' means existing rows get an empty array — fully backward compatible.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS aesthetics JSONB NOT NULL DEFAULT '[]';
  -- Style preference tags, e.g. ["minimalist", "bohemian"]; used in NanoBanana prompt

-- ─────────────────────────────────────────────────────────────────────────────
-- GIN index on aesthetics
-- ─────────────────────────────────────────────────────────────────────────────
-- Enables efficient containment queries (@>) such as:
--   SELECT * FROM trips WHERE aesthetics @> '["minimalist"]'
-- Useful for analytics (which styles are most popular) and potential future
-- style-cohort features.  CREATE INDEX IF NOT EXISTS is idempotent.
CREATE INDEX IF NOT EXISTS idx_trips_aesthetics_gin
  ON trips USING GIN (aesthetics);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS note
-- ─────────────────────────────────────────────────────────────────────────────
-- No RLS policy changes are required.  The existing policies on trips are:
--   trips_service_role_all — service_role: full access (Worker writes profile data)
--   trips_anon_select      — anon: SELECT USING (true) (trip_id is the access token)
--   trips_anon_insert      — anon: INSERT WITH CHECK (true) (client creates trip row)
--
-- gender / height_cm / weight_kg are only written by the Worker (service_role)
-- via the POST /api/preview body.  They are readable by anon on the result page
-- (trip_id is unguessable; the same access model as all other trips columns).
-- Downstream: outfitGenerator.ts derives display labels from raw values server-side;
--             raw numerics are never surfaced in client-rendered result views.

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm all four new columns exist with correct types and nullability:
--    SELECT column_name, data_type, is_nullable, column_default
--    FROM information_schema.columns
--    WHERE table_name = 'trips'
--      AND column_name IN ('gender', 'height_cm', 'weight_kg', 'aesthetics')
--    ORDER BY column_name;
--
--    Expected:
--      aesthetics | jsonb   | NO  | '[]'::jsonb
--      gender     | text    | YES | (null)
--      height_cm  | numeric | YES | (null)
--      weight_kg  | numeric | YES | (null)

-- 2. Confirm the gender CHECK constraint is present:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conrelid = 'trips'::regclass
--      AND conname LIKE '%gender%';
--
--    Expected:
--      trips_gender_check | CHECK ((gender = ANY (ARRAY['male', 'female', 'non-binary'])))

-- 3. Confirm the GIN index on aesthetics:
--    SELECT indexname, indexdef
--    FROM pg_indexes
--    WHERE tablename = 'trips'
--      AND indexname = 'idx_trips_aesthetics_gin';
--
--    Expected:
--      idx_trips_aesthetics_gin | CREATE INDEX idx_trips_aesthetics_gin
--                                  ON public.trips USING gin (aesthetics)

-- 4. Smoke-test containment query uses the GIN index (no full-scan):
--    EXPLAIN SELECT id FROM trips WHERE aesthetics @> '["minimalist"]';
--    Expected plan node: Bitmap Index Scan on idx_trips_aesthetics_gin

-- 5. Confirm existing rows received the aesthetics default without errors:
--    SELECT COUNT(*) AS rows_with_empty_aesthetics
--    FROM trips
--    WHERE aesthetics = '[]';
--    Expected: equal to the total number of trips rows created before this migration.

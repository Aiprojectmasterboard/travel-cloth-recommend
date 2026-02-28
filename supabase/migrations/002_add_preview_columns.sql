-- Migration: 002_add_preview_columns.sql
-- Description: Add columns needed by the preview pipeline and result pipeline.
--   - trips: vibe_data, weather_data, capsule_free (preview data cached for GET endpoint)
--   - trips: share_url (populated by growthAgent)
--   - orders: upgrade_token, upgrade_initiated_at (for Standard→Pro upgrade flow)
--   - Fix generation_jobs.job_type CHECK to include 'pro' → changed to 'full' in code,
--     but add idempotent migration in case old 'pro' rows exist.
-- Created: 2026-02-28
-- Idempotent: safe to re-run.

-- ── trips: preview pipeline cached data ──────────────────────────────────────

ALTER TABLE trips ADD COLUMN IF NOT EXISTS vibe_data      JSONB DEFAULT '[]';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS weather_data   JSONB DEFAULT '[]';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS capsule_free   JSONB DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS share_url      TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS upgrade_token  TEXT;

-- ── orders: upgrade flow columns ─────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS upgrade_token          TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upgrade_initiated_at   TIMESTAMPTZ;

-- ── generation_jobs: extend job_type CHECK to allow 'full' (was 'teaser'|'full') ──
-- The orchestrator previously inserted 'pro' (bug). The code now uses 'full'.
-- Drop the old CHECK and add a corrected one that is backward compatible.

DO $$
BEGIN
  -- Drop old CHECK constraint if it exists (name may vary by Postgres version)
  ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_job_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE generation_jobs
  ADD CONSTRAINT generation_jobs_job_type_check
  CHECK (job_type IN ('teaser', 'full'));

-- Note: any rows with job_type = 'pro' (from the old bug) will fail the new constraint.
-- Clean them up first:
UPDATE generation_jobs SET job_type = 'full' WHERE job_type = 'pro';

-- ── generation_jobs: extend status CHECK to remove 'unblurred' (was a bug) ──
-- The orchestrator previously set status='unblurred' for standard plan (invalid).
-- Clean up any such rows and restore valid status.

UPDATE generation_jobs SET status = 'completed' WHERE status = 'unblurred';

-- Drop and re-add status CHECK to confirm valid values
DO $$
BEGIN
  ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE generation_jobs
  ADD CONSTRAINT generation_jobs_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Migration: 005_add_regen_job_type.sql
-- Description: Extend generation_jobs.job_type CHECK constraint to include 'regen'.
--              Enables /api/regenerate to store regen jobs with the canonical
--              job_type value instead of the 'full' + mood workaround.
-- Created: 2026-03-01
-- Author: DB Architect Agent

-- ─────────────────────────────────────────────────────────────────────────────
-- generation_jobs.job_type CHECK constraint update
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Before: CHECK (job_type IN ('teaser', 'full'))
-- After:  CHECK (job_type IN ('teaser', 'full', 'regen'))
--
-- 'regen' represents a paid regeneration request (Pro / Annual plans only).
-- These rows are counted per trip to enforce the 1-regen-per-trip quota that
-- previously required a mood=like.regen-* filter workaround.
--
-- Idempotency: DROP CONSTRAINT IF EXISTS means this migration is safe to re-run.
-- The constraint name 'generation_jobs_job_type_check' is the Postgres default
-- for a CHECK on column job_type in table generation_jobs; it is also used
-- explicitly in 002_add_preview_columns.sql which patched the status CHECK.

ALTER TABLE generation_jobs
  DROP CONSTRAINT IF EXISTS generation_jobs_job_type_check;

ALTER TABLE generation_jobs
  ADD CONSTRAINT generation_jobs_job_type_check
  CHECK (job_type IN ('teaser', 'full', 'regen'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill: re-classify any existing workaround rows
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Rows created by the old /api/regenerate code used job_type='full' with a
-- mood value matching 'regen-%'.  Now that the constraint allows 'regen' we
-- convert them to the canonical value so quota counting works correctly.
--
-- The mood column was added in 002_add_preview_columns.sql (preview pipeline).
-- The UPDATE is safe to run even if no such rows exist.

UPDATE generation_jobs
   SET job_type   = 'regen',
       updated_at = NOW()
 WHERE job_type = 'full'
   AND mood LIKE 'regen-%';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Run after applying the migration to confirm the new constraint is live:
--
--   -- 1. Inspect the constraint definition
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'generation_jobs'::regclass
--      AND conname  = 'generation_jobs_job_type_check';
--
--   Expected output:
--     generation_jobs_job_type_check | CHECK ((job_type = ANY (ARRAY['teaser', 'full', 'regen'])))
--
--   -- 2. Confirm no residual workaround rows remain
--   SELECT COUNT(*) AS legacy_regen_rows
--     FROM generation_jobs
--    WHERE job_type = 'full'
--      AND mood LIKE 'regen-%';
--
--   Expected output: 0
--
--   -- 3. Smoke-test: inserting a 'regen' row should succeed (then rollback)
--   BEGIN;
--     INSERT INTO generation_jobs
--       (trip_id, city, job_type, prompt, status)
--     VALUES
--       (gen_random_uuid(), 'TestCity', 'regen', 'test prompt', 'pending');
--   ROLLBACK;

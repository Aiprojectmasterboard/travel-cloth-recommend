-- Migration: 003_usage_records_period_index.sql
-- Description: Add composite index on usage_records(user_email, plan, period_start, period_end)
--              to efficiently support the Annual 12-count quota check query.
-- Created: 2026-03-01
-- Author: DB Architect Agent
--
-- Background:
--   The Annual quota enforcement query in the Worker looks like:
--     SELECT trip_count FROM usage_records
--     WHERE user_email = $1
--       AND plan = 'annual'
--       AND period_start <= CURRENT_DATE
--       AND period_end   >= CURRENT_DATE;
--
--   The existing index idx_usage_records_user_email_plan covers (user_email, plan)
--   but Postgres must still evaluate the date-range predicates with a heap fetch
--   for each matching row.  The new 4-column index allows an index-range scan that
--   satisfies ALL four predicates without a heap fetch, giving O(log n) performance
--   even as usage_records grows.
--
--   The old 2-column index is NOT dropped — it remains useful for non-date queries
--   (e.g., "count all trips for this email across all periods").
--
-- Idempotent: uses CREATE INDEX IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_usage_records_annual_quota
  ON usage_records (user_email, plan, period_start, period_end);

-- ── Verification ─────────────────────────────────────────────────────────────
-- Confirm the new index exists:
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename = 'usage_records'
--   ORDER BY indexname;
--   Expected rows:
--     idx_usage_records_annual_quota  — (user_email, plan, period_start, period_end)
--     idx_usage_records_user_email_plan — (user_email, plan)
--     usage_records_pkey              — (id)

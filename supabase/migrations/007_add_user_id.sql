-- Migration: 007_add_user_id.sql
-- Description: Add user_id column to trips and orders for user-trip association.
--              Enables querying "all trips for user X" and fixing the account
--              deletion endpoint which incorrectly matched session_id = userId.
-- Created: 2026-03-04
-- Author: DB Architect Agent
--
-- Context:
--   - trips.session_id is a client-generated string like "sess_1709..."
--   - user_id is the Supabase Auth UUID (auth.users.id)
--   - user_id is nullable because anonymous/non-logged-in users can still create trips
--   - The Worker sets user_id when the Authorization header carries a valid JWT
--
-- Idempotency: every statement uses IF NOT EXISTS. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- trips: add user_id column
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- orders: add user_id column
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes for fast user trip/order lookups
-- ─────────────────────────────────────────────────────────────────────────────
-- Partial indexes (WHERE user_id IS NOT NULL) avoid indexing anonymous rows,
-- keeping the index compact and efficient.

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS note
-- ─────────────────────────────────────────────────────────────────────────────
-- No RLS policy changes are required. The existing service_role ALL policies
-- on trips and orders give the Worker full access. user_id is only written
-- by the Worker (service_role) via the POST /api/preview and webhook handlers.
-- The column is readable by anon on the result page (trip_id is the access token).

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification queries
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm both new columns exist:
--    SELECT table_name, column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE column_name = 'user_id'
--      AND table_name IN ('trips', 'orders')
--    ORDER BY table_name;
--
--    Expected:
--      orders | user_id | text | YES
--      trips  | user_id | text | YES

-- 2. Confirm partial indexes:
--    SELECT indexname, indexdef
--    FROM pg_indexes
--    WHERE indexname IN ('idx_trips_user_id', 'idx_orders_user_id');
--
--    Expected:
--      idx_trips_user_id  | CREATE INDEX idx_trips_user_id ON public.trips USING btree (user_id) WHERE (user_id IS NOT NULL)
--      idx_orders_user_id | CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id) WHERE (user_id IS NOT NULL)

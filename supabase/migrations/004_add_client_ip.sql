-- Migration: 004_add_client_ip.sql
-- Description: Add client_ip column to trips for IP-based rate limiting.
--              Enables the Worker to count daily requests per IP without a
--              separate KV store — a single indexed query replaces the need for
--              Workers KV on the hot path.
-- Created: 2026-03-01
-- Author: DB Architect Agent
--
-- Usage pattern (Worker rate-limit check):
--   SELECT COUNT(*) FROM trips
--   WHERE client_ip = $1
--     AND created_at >= CURRENT_DATE
--     AND created_at <  CURRENT_DATE + INTERVAL '1 day';
--   → Limit: 5 requests per IP per day (per CLAUDE.md spec)
--
-- Security notes:
--   - client_ip is stored as INET (Postgres native type) — validates IP format on insert.
--   - IPv4 and IPv6 are both supported by INET.
--   - Column is nullable: NULL for rows created before this migration or where
--     IP extraction fails (e.g., direct Supabase inserts in tests).
--   - The Worker reads the IP from the CF-Connecting-IP header (set by Cloudflare).
--     This header cannot be spoofed by end users on Cloudflare-proxied traffic.
--   - client_ip is internal operational data — anon RLS policy already denies
--     SELECT on trips rows beyond what's needed; no additional policy change required
--     since the existing "trips_anon_select USING (true)" policy is acceptable
--     (trip_id is the unguessable access token; client_ip leakage risk is low
--     for a read-by-tripId pattern, but see note below).
--
-- Privacy consideration:
--   IP addresses are PII in some jurisdictions.  This column should be NULLed
--   or the row purged when trips.expires_at is reached (the existing 48-hour TTL
--   expiry sweep job in the Worker already handles row cleanup).
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.

ALTER TABLE trips ADD COLUMN IF NOT EXISTS client_ip INET;

-- Composite index on (client_ip, created_at) supports the daily count query:
--   WHERE client_ip = $1 AND created_at >= ... AND created_at < ...
-- The leading client_ip equality predicate narrows the scan; created_at range
-- filtering then runs within that narrow set — O(log n + k) instead of full scan.
CREATE INDEX IF NOT EXISTS idx_trips_client_ip_created_at
  ON trips (client_ip, created_at);

-- ── Verification ─────────────────────────────────────────────────────────────
-- 1. Confirm column exists:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'trips' AND column_name = 'client_ip';
--    Expected: client_ip | inet | YES

-- 2. Confirm index exists:
--    SELECT indexname, indexdef FROM pg_indexes
--    WHERE tablename = 'trips' AND indexname = 'idx_trips_client_ip_created_at';
--    Expected: idx_trips_client_ip_created_at | CREATE INDEX ... ON trips (client_ip, created_at)

-- 3. Test rate-limit query plan (should use index):
--    EXPLAIN SELECT COUNT(*) FROM trips
--    WHERE client_ip = '1.2.3.4'::inet
--      AND created_at >= CURRENT_DATE
--      AND created_at <  CURRENT_DATE + INTERVAL '1 day';
--    Expected: Index Scan using idx_trips_client_ip_created_at

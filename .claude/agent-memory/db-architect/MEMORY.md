# DB Architect Agent Memory — Travel Capsule AI

## Migration Files
- `supabase/migrations/001_initial_schema.sql` — initial schema (all 5 tables, reviewed 2026-02-26)

## RLS Access Model (v1)
- No JWT authenticated users in v1. Access is purely session-based (anon role only).
- Anon access guard: `session_id = current_setting('app.session_id', true)`
- Worker sets this before anon queries: `SET LOCAL app.session_id = '<value>';`
- Service role (Worker) bypasses RLS — no explicit service_role policies needed.
- `orders` table: zero anon policies (no client access to payment data at all).
- `city_vibes` table: public read for both `anon` and `authenticated`.

## Table Decisions
- `trips.face_url`: nullable TEXT, nulled after image gen (privacy). Comment required.
- `trips.gallery_url`: populated by fulfillmentAgent after R2 upload.
- `orders.amount`: INTEGER in cents (500 = $5.00 USD).
- `orders.customer_email`: TEXT nullable, used by fulfillmentAgent for email.
- `orders.polar_order_id`: TEXT NOT NULL UNIQUE — Polar webhook idempotency key.
- `generation_jobs.prompt`: nullable TEXT (not NOT NULL) — built by styleAgent after insert.
- `generation_jobs.negative_prompt`: TEXT nullable — NanoBanana-specific field.
- `generation_jobs` and `capsule_results`: FK to trips uses ON DELETE CASCADE.
- `city_vibes.style_keywords`: TEXT[] (not JSONB) — flat string list, GIN-indexed with && operator.
- `city_vibes.lat`/`lon`: NUMERIC(9,6) (not DOUBLE PRECISION) — spec requirement.
- `city_vibes.city`: UNIQUE constraint (not composite UNIQUE with country).

## Idempotency Patterns
- Tables: `CREATE TABLE IF NOT EXISTS`
- Indexes: `CREATE INDEX IF NOT EXISTS`
- Functions: `CREATE OR REPLACE FUNCTION`
- Triggers: `CREATE OR REPLACE TRIGGER` (Postgres 14+)
- RLS Policies: `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`

## Indexes Summary
- trips: session_id (btree), status (btree), cities (GIN)
- orders: trip_id (btree); polar_order_id index auto-created by UNIQUE constraint
- generation_jobs: trip_id (btree), status (btree)
- capsule_results: trip_id (btree), items (GIN), daily_plan (GIN)
- city_vibes: city (btree), style_keywords (GIN)

## JSONB Structures (documented in migration)
- `trips.cities`: `[{"name": "Paris", "days": 4}, ...]`
- `capsule_results.items`: `[{"name": "Linen Blazer", "category": "outerwear", "color": "beige", ...}, ...]`
- `capsule_results.daily_plan`: `[{"day": 1, "city": "Paris", "outfit": "...", "image_url": "..."}, ...]`

## Security Notes
- Polar webhook: HMAC-SHA256 signature verified at Worker level before any DB write.
- Raw card data: never stored in DB.
- Service role key: Worker env only, never client-side.

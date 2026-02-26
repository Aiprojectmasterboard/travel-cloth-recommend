# Travel Capsule AI — Backend Builder Memory

## Project Structure
- Worker entry: `apps/worker/src/index.ts` — exports `Env` interface, Hono app
- Agents: `apps/worker/src/agents/` (7 files)
- Shared types: `packages/types/index.ts` — imported via relative path `../../../../packages/types/index`
- Cities seed data: `packages/city-vibes-db/cities.json` — 30 cities, complete
- DB migration: `supabase/migrations/001_initial_schema.sql` — complete, idempotent

## Env Interface (in index.ts)
Named `Env` (not `Bindings`). All agents import via `import type { Env } from '../index'`.
R2 access is via native binding `env.R2_BUCKET: R2Bucket` — NOT S3 client.

## Agent Signatures
- `orchestrateTrip(tripId, tripData: Record<string,unknown>, env: Env, userEmail?)`
- `getClimateData(city: CityInput, month: number): Promise<ClimateData>` — no env needed
- `generateStylePrompts(city: CityVibe, climate: ClimateData, apiKey: string): Promise<StylePrompt[]>`
- `generateImage(prompt: StylePrompt, apiKey: string, faceUrl?: string): Promise<string>`
- `generateCapsule(cities, month, climateData, apiKey): Promise<{items, daily_plan}>`
- `fulfillTrip(tripId, userEmail, env: Env): Promise<void>`
- `generateShareContent(trip: Trip): ShareContent` — sync, no env needed

## Key Patterns
- Supabase access: raw fetch with service role key (no `@supabase/supabase-js` package installed)
- R2 deletion: `await env.R2_BUCKET.delete(faceKey)` — use native binding, not S3 client
- Face URL format: `${R2_PUBLIC_URL}/${key}` — strip origin with `new URL(url).pathname.replace(/^\//, '')`
- Anthropic SDK v0.24.3 installed at root node_modules; `temperature` IS supported in MessageCreateParamsBase
- NanoBanana polling: polls `/jobs/{id}` every 5s up to 60 attempts (5 min)
- Concurrency limiter `runWithConcurrency(tasks, 2)` in orchestrator for image gen

## Confirmed Working
- `tsconfig.json`: `moduleResolution: "bundler"`, `strict: true`, `skipLibCheck: true`
- All dependencies hoisted to root `node_modules` (npm workspaces)
- No `noUncheckedIndexedAccess` — array indexing returns `T` not `T | undefined`
- `crypto.subtle` provided by `@cloudflare/workers-types`

## Fixed Issues (2026-02-26)
1. `fulfillmentAgent.ts`: R2 face deletion was logging-only — fixed to call `env.R2_BUCKET.delete(faceKey)`
2. `growthAgent.ts`: Array indexing `cities[0]`, `cities[1]`, `cities[N-1]` — added `?? fallback` for safety
3. `orchestrator.ts`: Style prompt map callback was synchronous — changed to `async` so synchronous throws
   become rejected promises caught by `Promise.allSettled`

## Supabase REST API Notes
- Auth headers: `apikey` + `Authorization: Bearer <service_role_key>`
- `Prefer: return=representation` makes POST return inserted rows
- Multiple `neq` filters on same column: `?status=neq.completed&status=neq.failed` — PostgREST ANDs them
- Batch insert returns array in insertion order (no ordering guarantee, but reliable in practice)

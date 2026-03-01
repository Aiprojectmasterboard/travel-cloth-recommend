# Security Reviewer Memory — Travel Capsule AI

## Architecture Quick Reference
- Backend: `apps/worker/src/index.ts` (Hono router) + `apps/worker/src/agents/`
- Frontend: `apps/web/` (Next.js App Router, Cloudflare Pages)
- Secrets: all live in Cloudflare Worker via `c.env.*` — `process.env` is ALWAYS wrong in worker code
- Supabase queries use REST filter syntax: `/table?col=eq.${value}` — user values in filter paths MUST be UUID-validated or URL-encoded
- Details in: `patterns.md`

## Confirmed Safe Patterns
- `verifyPolarSignature()` in `index.ts`: constant-time HMAC-SHA256 comparison using XOR accumulator — CORRECT
- rawBody read (`c.req.text()`) happens BEFORE `JSON.parse()` in webhook handler — CORRECT
- `polar_order_id UNIQUE` in `orders` table enforces idempotency — CORRECT
- `fulfillmentAgent.ts`: face R2 delete inside `try/catch`, face_url DB null in code outside `try` block (always runs) — CORRECT
- CORS locked to `['https://travelcapsule.ai', 'https://www.travelcapsule.ai']` — CORRECT
- All secrets accessed via `c.env.*` / `env.*` (Hono bindings), never `process.env` — CORRECT

## Recurring Vulnerabilities Found (2026-03-01 review)
6. HARDCODED SUPABASE CREDENTIALS AS FALLBACK in frontend files
   - `sb_publishable_3_Vzle5e2GXFtLG5d8F69Q_oznMxXm2` and `https://lmrrawhvjmuexajllint.supabase.co` were hardcoded as `?? fallback` values
   - Affected: `apps/web/lib/supabase.ts`, `apps/web/lib/supabase-browser.ts`, `apps/web/app/auth/callback/route.ts`
   - Fixed: Replaced with `?? ''` (empty string) — env vars must be properly configured
   - Note: Even though `sb_publishable_` is the anon/public key, real credentials MUST NOT be hardcoded in source

## Recurring Vulnerabilities Found (2026-02-26 review)
1. MISSING UUID VALIDATION on all Supabase filter path params (`tripId` from URL params and webhook metadata)
   - Fixed in: `index.ts` routes GET/POST `:tripId`, POST `/api/checkout`, POST `/api/webhooks/polar`
   - Pattern to always check: any `supabaseRequest(env, \`/table?id=eq.${variable}\`)` — variable must pass `isValidUUID()`
2. MISSING FILE SIZE LIMIT on `/api/uploads/face` — no byte check before `file.arrayBuffer()`
   - Fixed: 10 MB cap added before arrayBuffer() call
3. XSS IN HTML EMAIL TEMPLATE — `cityNames`, `galleryUrl`, `tripId` were interpolated raw into HTML
   - Fixed in: `fulfillmentAgent.ts` `buildEmailHtml()` — `escapeHtml()` applied to all user-controlled values
4. MISSING EMAIL VALIDATION — `customer_email` accepted without format check in `/api/checkout` and `fulfillTrip()`
   - Fixed: `isValidEmail()` guard added in both locations
5. `.dev.vars` MISSING FROM .gitignore — Cloudflare Workers local secrets file was not excluded
   - Fixed in: root `.gitignore`

## Validation Helpers Added to `index.ts`
- `isValidUUID(value)` — RFC-4122 v4 regex
- `isValidEmail(value)` — loose RFC-5322, max 254 chars
- `escapeHtml(str)` — 5-char HTML entity replacement

## Files with Highest Security Risk (check first on future reviews)
1. `apps/worker/src/index.ts` — all route handlers, HMAC verification, CORS
2. `apps/worker/src/agents/fulfillmentAgent.ts` — privacy cleanup, email HTML, Resend call
3. `apps/worker/src/agents/imageGenAgent.ts` — face_url forwarded to NanoBanana (external service)

## Gitignore Status (as of 2026-02-26)
- `.env`, `.env.local`, `.env*.local`, `.env.production` — covered
- `.dev.vars` — ADDED in this review
- `apps/worker/.dev.vars` — ADDED in this review

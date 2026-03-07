# QA Verifier Agent Memory

## Project Domains
- Primary: https://travelscapsule.com  (NOTE: has extra 's' — travelSCAPSULE not travelCAPSULE)
- Pages: https://travel-cloth-recommend.pages.dev
- Worker: https://travel-capsule-worker.netson94.workers.dev

## Domain URL Discrepancy (Known/Intentional)
- CLAUDE.md calls it "travelcapsule.com" (no extra s) — appears to be doc error
- All deployed code, wrangler.toml, index.ts, email templates use "travelscapsule.com"
- R2_PUBLIC_URL = "https://images.travelscapsule.com"
- Do not flag as bug — this is the actual registered domain

## API UUID Validation
- Worker returns HTTP 400 (not 404) for syntactically invalid UUIDs on all routes
- Must use well-formed UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- isValidUUID() uses UUID_RE regex at line 146 of index.ts
- For QA testing use a valid-format UUID: a1b2c3d4-e5f6-4a7b-8c9d-000000000001

## /api/payment/checkout — GET returns 404
- GET is not registered (only POST), so GET returns 404 — this is CORRECT
- POST checkout returns 502 when POLAR_ACCESS_TOKEN secret is not configured

## Pages Deployment Status

### Tenth QA Run 2026-03-07 (commit f0fed51 — full QA with detailed checks)
- Both domains FULLY DEPLOYED — all pages return valid HTML (SPA shell)
- Worker /api/health: 200 OK with JSON {ok:true, timestamp:...}
- /api/result/:tripId: 402 for unpaid trips (correct)
- /api/share/:tripId: 404 for non-existent trips (correct)
- /api/upload-photo: GET returns 404 (POST only — correct behavior)
- SKIP_TURNSTILE: CONFIRMED REMOVED from wrangler.toml (fix from commit 15f730d)
  NOTE: Still declared in Bindings type (index.ts line 33) — acceptable, just dead in prod
- og-image.png: 200 OK at https://travelscapsule.com/og-image.png (PNG, ~66.6KB)
- Static OG tags ARE in figma/index.html (og:title, og:image, twitter:card = summary_large_image)
- Copyright footer: confirmed in LandingPage.tsx line 738 — "&copy; {year} Travel Capsule AI"
- ImageWithFallback component: confirmed fixed (f0fed51), wraps in relative div, handles load/error states

## Known Issues (carry-forward)
- CONTACT_EMAIL = "netson94@gmail.com" in TermsPage.tsx, PrivacyPage.tsx, ContactPage.tsx
  ISSUE: Should be hello@travelscapsule.com for brand consistency — MEDIUM severity
- JSON-LD schema.org and noscript show prices ($5, $12, $29) — may differ from live UI promo pricing
  ISSUE: Prices in index.html noscript/JSON-LD not updated when promo pricing changes
- POLAR_ENV = "sandbox" in polarCheckout.ts — dead variable, not a prod bug but code clarity concern

## Frontend Architecture (Current)
- Active frontend: figma/ directory (Vite+React, React Router v7)
- apps/web/ is LEGACY (Next.js, not deployed)
- Routes: /, /onboarding/1-4, /preview, /checkout/success, /dashboard/standard|pro|annual
  /share/:tripId, /examples/pro, /examples/annual, /privacy, /terms, /contact, /mypage
  /demo/pro, /sitemap (also registered in routes.ts)

## polarCheckout.ts Architecture (confirmed)
- POLAR_ENV = "sandbox" at line 94 — ONLY used in commented-out stub functions
- Live checkout path: createCheckoutSession → POST Worker /api/payment/checkout → Polar production API
- confirmCheckoutSession() and getCheckoutSession() are MOCK stubs only (return hardcoded values)
- The actual post-checkout flow is: Polar redirects to /checkout/success, CheckoutSuccess reads URL params

## Design System (Figma/Vite frontend)
- Colors in theme.css: --tc-primary: #C4613A (NOT #b8552e from CLAUDE.md — CLAUDE.md is outdated)
- --tc-dark: #1A1410, --tc-cream: #FDF8F3, --tc-gold: #D4AF37
- Fonts: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)
- Material Symbols Outlined for icons
- body element: font-family: var(--font-body) = DM Sans (correct for this frontend)
- Note: CLAUDE.md spec says Plus Jakarta Sans — but Figma frontend uses DM Sans (intentional design change)

## Onboarding Flow (confirmed)
- Step 1: City search from cities.json (90+ cities including Bali confirmed at line 21)
- Step 2: Gender, Height, Weight (metric/imperial toggle)
- Step 3: Style aesthetics selection + photo upload (optional)
- Step 4: AI analysis loading screen → submits to /api/preview
- Login is optional but gated at checkout for Standard (free) plan

## Secrets Status (tenth QA run 2026-03-07)
- SKIP_TURNSTILE: REMOVED from wrangler.toml — Turnstile is active in production
- POLAR_ACCESS_TOKEN: CONFIRMED SET (Worker returns 402, not 500/503)
- SUPABASE_SERVICE_ROLE_KEY: WORKING (Worker returns 402 for unpaid trips)
- CLOUDFLARE_TURNSTILE_SECRET_KEY: assumed set (Worker doesn't 503 on preview calls)

## DB Schema
- polar_order_id UNIQUE constraint: CONFIRMED in migrations/001_initial_schema.sql line 121
- generation_jobs.job_type CHECK constraint: MIGRATION 005 WRITTEN AND APPLIED

## Worker API Routes (confirmed in index.ts)
- GET /api/health
- POST /api/preview
- POST /api/preview/email
- GET /api/preview/:tripId
- POST /api/payment/checkout
- POST /api/payment/webhook (HMAC-SHA256 verified)
- POST /api/payment/upgrade
- GET /api/result/:tripId
- GET /api/share/:tripId
- GET /api/trips/:tripId
- POST /api/upload-photo
- POST /api/account/delete
- POST /api/regenerate

## False Positives / Known Acceptable Behaviors
- /api/share/:tripId returning 404 for valid UUID with no trip is CORRECT
- /api/result/:tripId returning 402 for unpaid trip is CORRECT
- /api/upload-photo returning 404 on GET is correct (POST only endpoint)
- /api/payment/checkout returning 404 on GET is correct (POST only endpoint)
- OG tags not visible in WebFetch output — they ARE in static index.html (confirmed by file read)
- WebFetch always returns landing page SPA shell for all SPA routes — not an error
- POLAR_ENV = "sandbox" in polarCheckout.ts is a dead variable — not a production bug
- SKIP_TURNSTILE still in Bindings type declaration — acceptable (no runtime effect since not in wrangler.toml)
- "Stripe" mentions in figma/src/imports/api-endpoints.md — this is Polar's API docs file, not app code

## Security Checks (confirmed PASS)
- No process.env in apps/worker/ — uses c.env throughout
- No SUPABASE_SERVICE_ROLE_KEY in figma/src/ — PASS
- .env.local in .gitignore — PASS (line 1)
- No Stripe imports in actual source files — PASS
- HMAC-SHA256 webhook verification at index.ts line 72 + line 605 — PASS
- polar_order_id UNIQUE constraint — PASS
- R2 photo deletion in orchestrator.ts (line 74) and fulfillmentAgent.ts (lines 168, 176, 199) — PASS

## deploy.yml Key Facts
- NEXT_PUBLIC_WORKER_URL = https://travel-capsule-worker.netson94.workers.dev
- NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = 0x4AAAAAACj5TNMi2k0b77UT

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

### Fourteenth QA Run 2026-03-08 (post-BUG-004 + new commits)
- Both domains FULLY DEPLOYED — all pages return valid HTML (SPA shell)
- Worker /api/health: 200 OK with JSON {ok:true, timestamp:2026-03-08T09:35:23.019Z, services:{gemini:true, claude:true, supabase:true, polar:true, r2:true, turnstile:true, resend:true}}
- ALL 7 services reporting healthy
- New commits verified: face detection warning (BUG-004), weather exact dates, outfit item sync, StandardDashboard teaser fix, unique outfit images per city
- CONTACT_EMAIL in TermsPage.tsx and PrivacyPage.tsx is "netson94@gmail.com" (not hello@travelscapsule.com) — LOW SEVERITY (personal email in legal pages)

## Pricing Model (Live — confirmed)
- Standard plan: FREE during launch promo
- Pro plan: $3.99 one-time
- Annual plan: $9.99/yr
- index.html JSON-LD now updated to match live prices ($0/$3.99/$9.99) — CONFIRMED IN FILE (lines 87-104)
- CLAUDE.md price table ($5/$12/$29) is outdated; live prices are the promo prices

## Teaser Pipeline Architecture (confirmed)
- /api/preview returns immediately (no Gemini wait)
- Frontend calls POST /api/teaser/generate as fire-and-forget (triggerTeaserGeneration())
- Teaser generated synchronously in ~30-50s inside that long-running Worker request
- Frontend polls GET /api/teaser/:tripId every 3s (max 25 polls = ~75s total)
- Status flow: pending → ready (AI success) | fallback (Gemini failed, static image used)
- On 'fallback' status: PreviewPage.tsx line 330-333 — sets teaserReady=true without updating polledTeaserUrl
  (minor: fallback teaser_url from server not surfaced to UI, uses initialTeaserUrl instead — acceptable)
- sessionStorage persistence of teaser_url confirmed at PreviewPage.tsx lines 319-326

## Safety-Block Fallback (confirmed)
- teaserAgent.ts generateWithRetry(): Phase 1 = with face, Phase 2 = without face (2 attempts)
- Both phases use generateNanoBanana() targeting gemini-3.1-flash-image-preview

## Turnstile Fix (confirmed)
- WIDGET_SIZE = 'compact', Turnstile is ACTIVE in production

## SEO / OG Tags
- Static index.html (figma/index.html) has og:title, og:image, og:type, twitter:card = "summary_large_image"
- These are present for crawlers before JS hydration
- SEO component dynamically updates og:title/description per-page via document.head manipulation
- WebFetch returns SPA shell — OG tags ARE in static HTML and confirmed by file read

## Fallback Image Architecture
- orchestrator.ts: getCityFallbackImage(city, gender) exported at line 872
- index.ts line 594: uses getCityFallbackImage() in /api/preview fallbackTeaser — CONFIRMED
- orchestrator.ts line 938: uses getCityFallbackImage() in runTeaserBackground catch block — CONFIRMED
- PreviewPage.tsx: local getCityFallbackImg() is a simple generic fallback (not city-specific)

## outfitGenerator.ts — City Coverage
- FEMALE_OUTFITS: paris, rome, barcelona, tokyo, london, "new york", seoul, milan, bali, bangkok — ALL PRESENT
- MALE_OUTFITS: paris, rome, barcelona, tokyo, london, "new york", seoul, milan, bali, bangkok — ALL PRESENT
  (Confirmed at lines 87-141 for female, 155-210 for male)

## routes.ts — Lazy Loading
- Dashboard pages use React.lazy() — CONFIRMED at routes.ts lines 27-35
- Comment: "Isolates TDZ/init errors so they don't crash the entire app"
- LazyStandardDashboard, LazyProDashboard, LazyAnnualDashboard all lazy-loaded

## ProDashboard — TDZ Fix
- apiResultImages declared at line 102 BEFORE any useEffect that references it (lines 107-111)
- Guard comment at lines 99-101 explains the TDZ issue
- CONFIRMED SAFE

## ErrorBoundary
- figma/src/app/components/ErrorBoundary.tsx exists — full class component with retry/home buttons
- Imported and wrapping <Outlet /> in RootLayout.tsx at lines 49+63
- CONFIRMED PRESENT AND ACTIVE

## StandardDashboard — Teaser Polling
- pollTeaser() used to fill polledTeaser state (line 134-157 of StandardDashboard)
- Max 20 polls (~60s total) at 3s intervals
- Falls back to result?.teaser_url || preview?.teaser_url chain

## Known Issues (carry-forward)
- POLAR_ENV = "sandbox" in polarCheckout.ts — dead variable, not a prod bug
- /api/test-teaser returns 404 — acceptable (diagnostic only, not in index.ts)
- PreviewPage.tsx fallback branch (status='fallback'): sets teaserReady=true but does NOT
  update polledTeaserUrl with the fallback teaser_url from server — low severity, UI still shows initialTeaserUrl

## Open Issues (low severity)
- CONTACT_EMAIL in TermsPage.tsx + PrivacyPage.tsx = "netson94@gmail.com" (personal email) — should be hello@travelscapsule.com for professionalism

## RESOLVED Issues (from prior QA runs)
- CONTACT_EMAIL previously "hello@travelscapsule.com" — reverted to personal email in current code (re-opened above)
- index.html JSON-LD prices: NOW MATCH live UI ($0, $3.99, $9.99) — FIXED
- ProDashboard TDZ bug: FIXED at line 102
- BUG-004 default face injection: FIXED (effectiveFaceUrl = face_url || undefined)
- Weather exact dates: FIXED (fromDate/toDate propagation to weatherAgent)
- Outfit item sync: FIXED (capsule → style → imageGen pipeline order)
- StandardDashboard teaser: FIXED (pollTeaser() + updatePreviewTeaser())
- Unique outfit images: FIXED (usedCombos Set prevents duplicates)

## Frontend Architecture (Current)
- Active frontend: figma/ directory (Vite+React, React Router v7)
- apps/web/ is LEGACY (Next.js, not deployed)
- Routes: /, /onboarding/1-4, /preview, /checkout/success, /dashboard/standard|pro|annual
  /share/:tripId, /examples/pro, /examples/annual, /privacy, /terms, /contact, /mypage
  /demo/pro, /sitemap (also registered in routes.ts)

## polarCheckout.ts Architecture (confirmed)
- POLAR_ENV = "sandbox" at line 94 — ONLY used in commented-out stub functions
- Live checkout path: createCheckoutSession → POST Worker /api/payment/checkout → Polar production API

## Design System (Figma/Vite frontend)
- Colors in theme.css: --tc-primary: #C4613A (NOT #b8552e from CLAUDE.md — CLAUDE.md is outdated)
- --tc-dark: #1A1410, --tc-cream: #FDF8F3, --tc-gold: #D4AF37
- Fonts: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)
- Material Symbols Outlined for icons
- CLAUDE.md spec says Plus Jakarta Sans — but Figma frontend uses DM Sans (intentional design change)

## Onboarding Flow (confirmed)
- Step 1: City search from cities.json (90+ cities), custom city via geocoding, Korean aliases
- Step 2: Gender, Height, Weight (metric/imperial toggle)
- Step 3: Style aesthetics selection + photo upload (optional)
- Step 4: AI analysis loading screen → submits to /api/preview
- Login is REQUIRED at step 4 before API call

## Secrets Status (confirmed healthy via /api/health)
- ALL 7 services: gemini, claude, supabase, polar, r2, turnstile, resend — ALL true

## DB Schema
- polar_order_id UNIQUE constraint: CONFIRMED in migrations/001_initial_schema.sql line 121
- generation_jobs.job_type CHECK constraint: MIGRATION 005 WRITTEN AND APPLIED

## Worker API Routes (confirmed in index.ts)
- GET /api/health
- GET /api/debug/recent-trips, GET /api/test-gemini (diagnostic)
- POST /api/preview, POST /api/preview/email
- GET /api/preview/:tripId
- GET /api/teaser/:tripId, POST /api/teaser/generate
- POST /api/payment/checkout, POST /api/payment/webhook, POST /api/payment/upgrade
- GET /api/result/:tripId, GET /api/share/:tripId, GET /api/trips/:tripId
- POST /api/upload-photo, POST /api/account/delete, POST /api/regenerate

## False Positives / Known Acceptable Behaviors
- /api/share/:tripId returning 404 for valid UUID with no trip is CORRECT
- /api/result/:tripId returning 402 for unpaid trip is CORRECT
- OG tags not visible in WebFetch output — they ARE in static index.html
- WebFetch always returns landing page SPA shell for all SPA routes — not an error
- POLAR_ENV = "sandbox" in polarCheckout.ts is a dead variable — not a production bug
- "Stripe" mentions in figma/src/imports/api-endpoints.md — Polar's API docs file, not app code

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

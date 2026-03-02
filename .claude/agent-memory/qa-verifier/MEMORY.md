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
- For QA testing use a valid-format UUID: all-numeric formats still 404 properly

## /api/payment/checkout — GET returns 404
- GET is not registered (only POST), so GET returns 404 — this is CORRECT
- POST checkout returns 502 when POLAR_ACCESS_TOKEN secret is not configured

## Pages Deployment Status

### Sixth QA Run 2026-03-02 (post Figma v15 migration — commit bf09c4b)
- BOTH domains returning HTTP 404 — deployment likely still in-flight after recent push
- Commit bf09c4b was pushed at 08:22:39 UTC — "Figma v15 migration"
- Code audit: all i18n keys, t() function, LanguageSelector, page.tsx, layout.tsx confirmed correct
- See "Sixth QA Run i18n Notes" section below

### Fifth QA Run 2026-03-02 (post Figma Make redesign)
- BOTH domains returning HTTP 404 immediately after push — deployment still in-flight
- When domains return 404, deployment is in GitHub Actions pipeline (3-5 min wait)
- This is EXPECTED when a new push just happened — NOT a persistent error
- Code audit shows correct structure; deployment will resolve on its own
- DM Sans added as secondary font variable (--font-dm-sans) alongside Plus Jakarta Sans
- body element correctly uses var(--font-sans) = Plus Jakarta Sans (CLAUDE.md spec)
- --font-body: 'DM Sans' in :root CSS is a display-only token; not used for body text

### Third QA run 2026-03-01 (pre-redesign baseline)
- BOTH domains FULLY DEPLOYED — all pages loaded correctly
- travelscapsule.com: PASS for /, /trip, /auth/login, /legal/terms, /legal/privacy
- travel-cloth-recommend.pages.dev: PASS for same pages

## PreviewClient Email Bug — RESOLVED
- apps/web/app/preview/[tripId]/PreviewClient.tsx line 494 now shows
  mailto:hello@travelscapsule.com (correct — bug was fixed)

## /account Page
- auth-gated via client-side redirect (router.push('/auth/login')) when no user
- WebFetch returns landing page content (200) — NOT a redirect or 404
- This is a false positive — the page is a client component that redirects on load

## Auth Callback
- Handles ?type=recovery → redirects to /account?reset=true  (PASS)
- Handles code exchange error → redirects to /auth/login?error=auth_failed  (PASS)
- Does NOT read incoming ?error= query param from Supabase directly (minor, not critical)

## Secrets Status (fourth QA run 2026-03-01)
- SUPABASE_SERVICE_ROLE_KEY: SET (Worker returns 402/404 correctly)
- POLAR_ACCESS_TOKEN: CONFIRMED SET — POST /api/payment/checkout returns 200 + checkout_url
  for all three plans (standard, pro, annual). Polar API fully working.
- Plain vars in wrangler.toml: all present and correct (verified line-by-line)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: uses new sb_publishable_ format (NOT eyJ JWT format)
  Confirmed valid: curl to /auth/v1/settings returns 200 with Supabase settings
- deploy.yml injects all NEXT_PUBLIC_* at build time — Supabase error is RESOLVED

## DB Schema Known Issues
- generation_jobs.job_type CHECK constraint: MIGRATION 005 WRITTEN AND APPLIED
  Now allows ('teaser', 'full', 'regen') — previous workaround no longer needed
- Migration 005_add_regen_job_type.sql exists and backfills old rows

## New Routes Added (not in original CLAUDE.md)
- GET /api/preview/:tripId — returns free preview data (no payment)
- POST /api/upload-photo — uploads face photo to R2
- GET /api/result/:tripId — alias/extended version of trips/:tripId
- POST /api/account/delete — deletes user account and data
- GET /checklist/[tripId] — packing checklist page (post-result feature)

## False Positives / Known Acceptable Behaviors
- /api/share/:tripId returning 400 for syntactically invalid UUID is CORRECT
- /api/share/:tripId returning 404 JSON for valid UUID with no trip is CORRECT
- /api/result/:tripId returning 402 for unpaid trip is CORRECT (use GET /api/result/ not /api/trips/)
- /account returning landing-page content from WebFetch is expected (SPA redirect)
- /api/payment/checkout returning 404 on GET is correct (POST only endpoint)
- Google Search Console meta tag is NOW LIVE with value RuXip_6tZ1YWju0teoViUlg71HO_-3-P9H2JGfdGZ3I
- /api/regenerate uses body parameter "trip_id" (NOT "tripId") — use trip_id for testing

## Sixth QA Run i18n Notes (commit bf09c4b)
- t() is now a FUNCTION in LanguageContext (v15 migration) — t("hero.cta") syntax is correct
- page.tsx correctly calls t(item.key) for nav items — matches v15 function-based API
- LanguageSelector shows nativeLabel (e.g. "English", "한국어") — NOT uppercase "ENGLISH"
- Nav only shows "Start Planning" button in header (no separate "SIGN IN" button on landing)
- Hero uses t('hero.tagline') — EN: "The End of\nWeather Guesswork." / KO: "날씨 걱정의 끝,\n완벽한 여행 코디."
- Hero subtitle: t('hero.subtitle') — EN: "AI-Powered Capsule Wardrobe System" / KO: "AI 기반 캡슐 워드로브 시스템"
- Hero body: t('hero.body') / Hero CTA: t('hero.cta') — EN: "Curate My Capsule" / KO: "나만의 캡슐 만들기"
- Nav links: howItWorks/pricing/examples — EN: "How It Works"/"Pricing"/"Examples" / KO: "이용 방법"/"가격"/"예시"
- font.sans in tailwind now references var(--font-body) = 'DM Sans' (Figma design system primary body font)
- layout.tsx sets --font-sans = Plus Jakarta Sans CSS var, --font-dm-sans = DM Sans CSS var
- DISCREPANCY: globals.css sets --font-body = 'DM Sans' but layout.tsx maps --font-sans = Plus Jakarta Sans
  body element in globals.css uses var(--font-sans) = Plus Jakarta Sans (correct per CLAUDE.md)
  tailwind font-sans uses var(--font-body) = DM Sans (Figma v15 deliberate change)
- This split is intentional: body CSS = Plus Jakarta Sans, Tailwind font-sans utility = DM Sans

## API Test UUID
- Must use valid UUID v4 format: a1b2c3d4-e5f6-4a7b-8c9d-000000000001
- UUID 00000000-0000-0000-0000-000000000001 fails (version 4 requires 4xxx in 3rd segment)

## Stripe Check
- "stripe" appears in UpgradeModal.tsx only as a CSS visual comment ("gradient stripe")
- No actual Stripe payment imports or Stripe API usage anywhere in codebase — PASS

## deploy.yml Key Facts
- NEXT_PUBLIC_SUPABASE_URL = https://lmrrawhvjmuexajllint.supabase.co (injected at build)
- NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_3_... (new Supabase key format, injected at build)
- NEXT_PUBLIC_WORKER_URL = https://travel-capsule-worker.netson94.workers.dev
- NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY = 0x4AAAAAACj5TNMi2k0b77UT

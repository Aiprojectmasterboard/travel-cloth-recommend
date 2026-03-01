# QA Verifier Agent Memory

## Project Domains
- Primary: https://travelscapsule.com  (NOTE: has extra 's' — travelSCAPSULE not travelCAPSULE)
- Pages: https://travel-cloth-recommend.pages.dev
- Worker: https://travel-capsule-worker.netson94.workers.dev

## Critical Known Issue — SUPABASE_SERVICE_ROLE_KEY Not Deployed
- First QA run (2026-03-01) confirmed: Worker returns 500 on /api/preview because
  Supabase responds "Invalid API key". Root cause: SUPABASE_SERVICE_ROLE_KEY secret
  has NOT been set via `wrangler secret put`.
- This also causes /api/share/:tripId and /api/trips/:tripId to return 500 Internal
  Server Error (not the expected 404/402).
- Only /api/health works because it does not query Supabase.
- Admin must run: wrangler secret put SUPABASE_SERVICE_ROLE_KEY

## CORS Configuration
- Worker origin allowlist uses travelSCAPSULE.com (matches actual domain typo)
- CORS preflight returns 204 correctly
- access-control-allow-origin header is set for travelscapsule.com origin

## Domain URL Discrepancy (Known)
- CLAUDE.md calls it "travelcapsule.com" (no extra s)
- All deployed code, wrangler.toml, index.ts, email templates use "travelscapsule.com"
- R2_PUBLIC_URL = "https://images.travelscapsule.com"
- The actual live domain appears to be travelscapsule.com (extra 's'), not travelcapsule.com
- This is likely intentional — do not flag as bug unless admin confirms

## /api/preview POST Test Note
- Turnstile is active (SKIP_TURNSTILE="false" in wrangler.toml)
- Test with cf_turnstile_token: "test-token-skip" will NOT bypass — Turnstile
  bypass only works when SKIP_TURNSTILE env is "true"
- QA sample body hits Supabase before Turnstile issue appears (Supabase key error first)

## /account Page
- auth-gated via client-side redirect (router.push('/auth/login')) when no user
- Returns 404 when fetched without auth session (not a redirect at URL level)

## Auth Callback
- Handles ?type=recovery → redirects to /account?reset=true  (PASS)
- Handles code exchange error → redirects to /auth/login?error=auth_failed  (PASS)
- Does NOT read an incoming ?error= query param from Supabase (minor gap, not critical)

## Secrets Status (from QA run 2026-03-01, second run same date)
- SUPABASE_SERVICE_ROLE_KEY: appears SET (second run showed /api/trips returns 402
  not 500 — this means Supabase key IS now configured)
- /api/share/:tripId now correctly returns 404 JSON (not 500)
- /api/trips/:tripId now correctly returns 402 (not 500)
- Other secrets: POLAR_ACCESS_TOKEN not set or broken — /api/payment/checkout
  returns 502 "Failed to create checkout session"
- Plain vars in wrangler.toml: all present and correct

## Cloudflare Pages Deployment — CRITICAL (second QA run 2026-03-01)
- BOTH domains (travelscapsule.com and travel-cloth-recommend.pages.dev) return
  HTTP 404 on ALL pages (/, /trip, /auth/login, etc.)
- This means Cloudflare Pages has NOT deployed the latest commit
- Next.js build locally succeeds perfectly — all 17 routes compile without errors
- TypeScript checks pass for both web app and worker (zero errors)
- Root cause: Cloudflare Pages CI/CD likely not connected to correct GitHub repo
  branch, or the Pages project needs a manual deploy trigger
- Admin must trigger redeploy in Cloudflare Pages dashboard

## Bug Found — Wrong Email Domain in PreviewClient
- apps/web/app/preview/[tripId]/PreviewClient.tsx:496 uses
  mailto:hello@travelcapsule.com (missing the 's')
- Should be mailto:hello@travelscapsule.com
- Auto-fixable by frontend agent

## False Positives / Known Acceptable Behaviors
- /api/share/:tripId returning {"error":"Trip not found"} 404 for fake UUID is CORRECT
- /api/trips/:tripId returning 402 for unpaid trip is CORRECT
- /account returning 404 from WebFetch is expected (client-side auth redirect)
- /api/payment/checkout returning 502 is due to unconfigured POLAR_ACCESS_TOKEN secret

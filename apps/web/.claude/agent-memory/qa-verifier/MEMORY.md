# QA Verifier Agent Memory

## Critical Domain Notes

- **The canonical domain in codebase is `travelscapsule.com` (with extra 's')** — NOT `travelcapsule.com`.
  - `SITE_URL` in `apps/web/app/layout.tsx` line 98 is `https://travelscapsule.com`
  - `R2_PUBLIC_URL` in `apps/worker/wrangler.toml` is `https://images.travelscapsule.com`
  - Auth callback allowedOrigins includes `https://travelscapsule.com`
  - `travelcapsule.com` (no extra 's') consistently TIMES OUT — likely DNS not configured or not pointed at Pages
  - `travelscapsule.com` LOADS successfully (200 OK)
  - Task briefs may say "travelcapsule.com" — always verify BOTH and note the typo-domain situation

- **Cloudflare Pages domain:** `https://travel-cloth-recommend.pages.dev` — always accessible
- **Worker URL:** `https://travel-capsule-worker.netson94.workers.dev` (from `apps/web/lib/api.ts` line 16)
  - `/api/health` returns `{"ok":true,"timestamp":"..."}` — confirmed working
  - Note: `api.travelcapsule.com` subdomain does NOT resolve

## Known False Positives

- `stripe` appearing in `components/funnel/UpgradeModal.tsx` line 115 is a CSS gradient comment ("gradient stripe"), NOT a Stripe payment import.
- `stripe` in `components/CapsuleSection.tsx` line 22 is a clothing item name ("Stripe Shirt"), NOT a payment library.
- `stripe` in `lib/outfitGenerator.ts` line 135 is "Breton Stripe" (clothing item), NOT a payment library.
- No actual `import ... from 'stripe'` exists anywhere in the codebase.

## Confirmed Architecture Points

- `globals.css` has `--font-body: 'DM Sans'` as a CSS custom property — this is a legacy variable name only; the actual Tailwind `font-sans` uses `var(--font-sans)` which maps to Plus Jakarta Sans. Not a bug.
- `outfitGenerator.ts` is a frontend-only service using Unsplash image pools — it does NOT call Stripe or any payment API.
- Auth callback at `apps/web/app/auth/callback/route.ts` handles both `?type=recovery` and `?error=` params correctly.
- `polar_order_id UNIQUE` constraint confirmed in `supabase/migrations/001_initial_schema.sql` line 121.
- R2 face photo deletion confirmed in `apps/worker/src/agents/fulfillmentAgent.ts` lines 167-199.
- HMAC-SHA256 webhook verification confirmed in `apps/worker/src/index.ts` lines 60-98, 472+.
- No `process.env` usage in `apps/worker/src/` — all env via `c.env`.
- No `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/` — confirmed clean.
- `.env.local` is in `.gitignore` — confirmed.

## Figma v14 Component Update (deployed 2026-03-02)

- 25 new components added to `apps/web/components/travel-capsule/`
- New `apps/web/lib/outfitGenerator.ts` service added (frontend-only, uses Unsplash image pools)
- All pages verified loading after this deployment

## Account Page Auth Gate

- `apps/web/app/account/page.tsx` — client-side auth gate: redirects to `/auth/login` if `!user` (line 49-52)
- This is a client-side redirect (not server-side), so the page itself loads with a spinner before redirecting

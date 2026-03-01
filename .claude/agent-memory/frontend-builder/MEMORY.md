# Frontend Builder Agent Memory

## Project Structure
- Web app root: `/home/user/travel-cloth-recom/apps/web/`
- Components: `/home/user/travel-cloth-recom/apps/web/components/`
- i18n: `/home/user/travel-cloth-recom/apps/web/lib/i18n/` (index.ts + types.ts + translations/{ko,en,ja,zh,fr,es}.ts)
- Pages (App Router): `/home/user/travel-cloth-recom/apps/web/app/`
- Shared types: `/home/user/travel-cloth-recom/packages/types/`

## Design Tokens (CSS variables used throughout)
- `--terracotta`: primary brand color (approx #c4613a)
- `--gold`: accent color (approx #c8a96e)
- `--ink`: primary text (approx #1a1410)
- `--muted`: secondary text (approx #9c8c7e)
- `--cream`: background (approx #fdfaf6)
- `--sand`: section background (approx #f5f0e8)
- `--border`: divider color (approx #e8e0d5)

## i18n Translation Sync Rules
- `ko.ts` is always the canonical source of truth; other locales must match its key structure
- `viralCopies` and `nativeShareTitle` are function types `(cities, month, city0) => string[]` — never replace with string literals
- After any translation edit, verify with: `cd /home/user/travel-cloth-recom/apps/web && npx tsc --noEmit`
- FAQ items are appended to the end of the `faq.items` array — never replace existing items

## i18n Pattern
- Locales: `['ko', 'en', 'ja', 'zh', 'fr', 'es']`
- `LOCALE_LABELS[locale]` has `{ flag, label, nativeLabel }`
- `useLanguage()` hook returns `{ locale, setLocale, t }` — must be inside `LanguageProvider`
- Components needing i18n use `'use client'` and call `useLanguage()`
- For hardcoded bilingual text not in the i18n system: define `{ ko: string; en: string }` objects and resolve with locale check (ko vs en fallback for other locales)

## Styling Pattern
- All components use `styled-jsx` (`<style jsx>{...}</style>`) — NOT Tailwind utility classes
- Fonts: 'Playfair Display' (headings), 'Plus Jakarta Sans' (body/UI) — CSS var `--font-sans`
- DO NOT use DM Sans — CLAUDE.md specifies Plus Jakarta Sans as the body font
- Mobile breakpoint: max-width 480px (compact), 640px (grid changes), 767px (hamburger menu)
- Responsive via CSS `@media` inside styled-jsx blocks

## Font Setup (layout.tsx)
- Playfair Display: `--font-playfair` variable, weights 400/700, styles normal/italic
- Plus Jakarta Sans: `--font-sans` variable, weights 300/400/500/600
- Both variables applied to `<html>` className

## Auth Patterns
- Auth callback route: `/apps/web/app/auth/callback/route.ts`
  - Redirects always use `NEXT_PUBLIC_SITE_URL` env var (never `requestUrl.origin`) to prevent open redirects
  - On `exchangeCodeForSession` error → redirect to `/auth/login?error=auth_failed`
  - On success → redirect to `/`
- Login page success state for email signup uses sentinel `'check-email'` in `message` state

## Legal Pages (placeholders)
- `/apps/web/app/legal/terms/page.tsx` — "Coming soon" server component
- `/apps/web/app/legal/privacy/page.tsx` — "Coming soon" server component

## Trip Form Patterns (apps/web/app/trip/page.tsx)
- Turnstile token must be validated before submit — never fall back to `'dev-bypass'` string
- Blob URLs from `URL.createObjectURL` must be revoked: use a `useRef<string|null>` to track and revoke on replacement + unmount `useEffect`
- File uploads: validate `file.size > 5 * 1024 * 1024` before creating object URL
- City error state: only clear error on successful city add, NOT on each keystroke
- Step transitions: always call `window.scrollTo({ top: 0, behavior: 'smooth' })` when changing steps

## Result / Checklist / Share Patterns
- ResultClient: redirect to `/preview/${tripId}` if `trip.status === 'pending'` (unpaid)
- ChecklistClient: show error UI (not DEMO_TRIP) when API returns non-OK or throws; DEMO_TRIP only for `!WORKER_URL` dev mode
- ShareClient: copy-to-clipboard uses async/await with `copied` state + 2s setTimeout reset

## Components Inventory
See `components.md` for full list with props interfaces.

## Confirmed API Endpoint Paths (CLAUDE.md canonical)
- Email capture: `POST /api/preview/email`
- Checkout: `POST /api/payment/checkout`
- Upgrade: `POST /api/payment/upgrade`
- Preview submit: `POST /api/preview`
- Preview fetch: `GET /api/preview/:tripId`
- Result fetch: `GET /api/result/:tripId`
- Share fetch: `GET /api/share/:tripId`
- Photo upload: `POST /api/upload-photo`

## ShareResult Type (packages/types)
Top-level flat fields: `trip_id`, `share_url`, `og_title`, `og_description`, `teaser_url`, `mood_name`
Not nested under `teaser.*` or `trip.*`.

## Key Architectural Rules (see system prompt for full list)
- Only `NEXT_PUBLIC_*` env vars in client code
- All business logic goes to Cloudflare Worker (`NEXT_PUBLIC_WORKER_URL`)
- Supabase: anon key + RLS only in client code
- `'use client'` required for: hooks, useState/useEffect, browser APIs, event handlers

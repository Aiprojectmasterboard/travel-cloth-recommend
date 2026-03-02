# Frontend Builder Agent Memory

## Project Structure
- Web app root: `/home/user/travel-cloth-recom/apps/web/`
- Components: `/home/user/travel-cloth-recom/apps/web/components/`
- i18n: `/home/user/travel-cloth-recom/apps/web/lib/i18n/` (index.ts + types.ts + translations/{ko,en,ja,zh,fr,es}.ts)
- Pages (App Router): `/home/user/travel-cloth-recom/apps/web/app/`
- Shared types: `/home/user/travel-cloth-recom/packages/types/`

## Design Tokens (CSS variables used throughout)
Legacy vars (still valid):
- `--terracotta`: #C4613A, `--gold`: #D4AF37, `--ink`: #1A1410, `--muted`: #8A7B6E
- `--cream`: #FDF8F3, `--sand`: #F5EFE6, `--border`: rgba(26,20,16,0.12)

Figma tc-* tokens (in globals.css + tailwind.config.ts):
- `--tc-primary`: #C4613A, `--tc-primary-dark`: #A84A25
- `--tc-cream`: #FDF8F3, `--tc-dark`: #1A1410
- `--tc-sand`: #EFE8DF, `--tc-border`: #E8DDD4
- `--tc-gold`: #D4AF37, `--tc-text`: #292524, `--tc-sub`: #57534e
- `--font-display`: Playfair Display, `--font-body`: DM Sans, `--font-mono`: JetBrains Mono

Tailwind: `tc-primary`, `tc-primary-dark`, `tc-cream`, `tc-dark`, `tc-sand`, `tc-border`, `tc-gold`, `tc-gold-accent`, `tc-text`, `tc-sub`
CSS utilities: `.gold-gradient`, `.locked-overlay` (blur teaser images), `.font-data` (mono)

## i18n Translation Sync Rules
- `ko.ts` is always the canonical source of truth; other locales must match its key structure
- `viralCopies` and `nativeShareTitle` are function types `(cities, month, city0) => string[]` — never replace with string literals
- After any translation edit, verify with: `cd /home/user/travel-cloth-recom/apps/web && npx tsc --noEmit`
- FAQ items are appended to the end of the `faq.items` array — never replace existing items
- When adding new keys to types.ts, the linter may auto-apply some changes to locale files — always re-read files before editing after a types.ts change
- New landing page sections added: `weather`, `blueprint`, `guide`, `testimonial`, `cta` (between `partner` and `footer`)
- New nav keys: `philosophy`, `curations`, `membership`; new hero keys: `badge`, `heading1`, `heading2`, `cta`, `estLabel`, `scrollLabel`, `editionLabel`
- New footer keys: `journal`, `methodology`, `pricing`, `login`, `instagram`
- ko.ts strategy: editorial/UI labels stay English, descriptive body text translated to Korean

## i18n Pattern
- Locales: `['ko', 'en', 'ja', 'zh', 'fr', 'es']`
- `LOCALE_LABELS[locale]` has `{ flag, label, nativeLabel }`
- `useLanguage()` / `useLang()` (alias) returns `{ locale, setLocale, t, displayFont, bodyFont }` — must be inside `LanguageProvider`
- `getDisplayFont(lang)`, `getBodyFont(lang)`, `getHeroSize(lang)` exported from LanguageContext for font-aware styling
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
- DM Sans: `--font-dm-sans` variable, weights 300/400/500/600 (Figma body font)
- JetBrains Mono: `--font-mono` variable, weights 400/500, preload: false
- All variables applied to `<html>` className in layout.tsx

## Auth Patterns
- Auth callback route: `/apps/web/app/auth/callback/route.ts`
  - Redirects always use `NEXT_PUBLIC_SITE_URL` env var (never `requestUrl.origin`) to prevent open redirects
  - On `exchangeCodeForSession` error → redirect to `/auth/login?error=auth_failed`
  - On success → redirect to `/`
- Login page success state for email signup uses sentinel `'check-email'` in `message` state

## Legal Pages (placeholders)
- `/apps/web/app/legal/terms/page.tsx` — "Coming soon" server component
- `/apps/web/app/legal/privacy/page.tsx` — "Coming soon" server component

## Trip Form Patterns (apps/web/app/trip/TripClient.tsx)
- 4-step OnboardingLayout: two-column grid `grid-cols-[2fr_3fr]` on lg — left sidebar (image + quote), right form
- Step 1: city search + dates; Step 2: gender + body info; Step 3: aesthetics + photo upload; Step 4: review + submit
- Sidebar images: `SIDEBAR_IMAGES: Record<Step, string>` with Figma-spec Unsplash URLs for steps 1-4
- Step 1 city dropdown: `CITY_OPTIONS` (8 popular cities with 80px Unsplash thumbnails) shown in dropdown; cities from full CITY_DB without a matching CITY_OPTIONS entry show an icon fallback
- `CityWithDates extends CityInput` adds `start_date`, `end_date`, `imageUrl?`; `imageUrl` is stored on city-add via `getCityImageUrl(name)` helper
- City cards (Step 1): top row = thumbnail + name + nights + delete button; bottom row = From / To DateSelect pickers
- Step 2: gender grid (3 buttons, `aria-pressed`) + TCInput for height/weight
- Step 3: AestheticCard 3-col grid + "Personalize with AI" photo panel; skip button text = "Skip, style me without a photo"
- `removePhoto()`: revokes blob URL via ref, clears `photo` + `photoPreview` state, resets file input `.value`
- `dragOver` boolean state: updated by `onDragOver` / `onDragLeave` — controls dashed border highlight
- Step 4 Summary Card: `<Image fill priority unoptimized>` in `h-[200px]` container; hero src = first city imageUrl or SIDEBAR_IMAGES[4] fallback
- Step 4 "Edit Details" uses `goTo(1)`; `goTo(s)` always calls `window.scrollTo({ top: 0, behavior: 'smooth' })`
- Turnstile token must be validated before submit; never fall back to `'dev-bypass'` string
- Blob URLs: track with `useRef<string|null>`, revoke on replacement and on unmount via cleanup `useEffect`
- File uploads: validate `file.size > 5 * 1024 * 1024` before `URL.createObjectURL`
- City error: only cleared on successful city-add, not on keystroke
- Design tokens: `#C4613A` primary, `#292524` text, `#57534e` sub-text, `#E8DDD4` border, `#FDF8F3` bg
- i18n hook: `useLanguage()` → `{ displayFont, bodyFont }` destructured; TripClient uses hardcoded English strings (not `t` keys)

## Result / Checklist / Share Patterns
- ResultClient: 402 = no order → redirect to `/preview/`. 'pending' or 'processing' = post-payment queue → KEEP POLLING (never redirect on pending!). 'failed' → ErrorView. 'completed' → GalleryView.
- ResultClient polling: `setTimeout(fetchTrip, 3000)` when status is 'pending' or 'processing'
- ResultClient plan routing: GalleryView → AnnualView | ProView | StandardView based on `trip.plan`
- UpgradeModal: shown after 2s delay if `trip.upgrade_token` exists; 3-min (180s) countdown; calls `/api/payment/upgrade` → checkout_url
- ChecklistClient: show error UI (not DEMO_TRIP) when API returns non-OK or throws; DEMO_TRIP only for `!WORKER_URL` dev mode
- ShareClient: copy-to-clipboard uses async/await with `copied` state + 2s setTimeout reset
- Share URL UTM params are set by the backend growthAgent — `data.share_url` already includes UTM params

## next/image Usage Patterns
- `next.config.js` has `images: { unoptimized: true }` — allows any external URL with next/image
- Always use `<Image fill>` for images inside positioned containers (aspect-ratio or explicit h/w divs)
- For fill images: parent must have `position: relative/absolute/fixed` + explicit height/aspect-ratio
- For blurred images: `<Image fill style={{filter:'blur(Npx)',transform:'scale(1.1)'}} unoptimized />`
- Always add `priority` to above-fold hero images for LCP
- Always add `unoptimized` when src is a dynamic external URL (R2 CDN, external APIs)

## framer-motion TypeScript Patterns
- Import `type { Variants }` from 'framer-motion' and annotate variant objects: `const variants: Variants = {...}`
- Cubic bezier ease needs explicit tuple type: `ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]`
- Named easing strings need `as const`: `ease: 'easeOut' as const`

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

## outfitGenerator Integration Pattern
- `buildProfile(gender, height, weight, aesthetics)` → `UserProfile` (gender coerces to 'male'|'female'|'non-binary')
- `generateCityOutfits(profile, { city, country, month, days }, count)` → `CityOutfitSet`
- `CityOutfitSet.outfits[i]` has `label`, `styleTag`, `imageUrl`, `items[]` (each: `name`, `imageUrl`, `category`, `size?`)
- User profile stored in `localStorage` under key `tc_user_profile` (set in TripClient.tsx handleSubmit, after session ID)
- StandardView reads profile in `useEffect` → calls generator → `setCityOutfitSet` → used in accordionDays.map with `??` fallback to original data
- ProView: `trip.generation_jobs?.find(j => j.city === cityName)?.mood ?? CITY_MOOD_NAMES[idx % ...]` for real mood names
- `outfitGenerator.ts` CityInput type has field `city` (NOT `name`) — watch for confusion with `packages/types/` CityInput which uses `name`

## ProView / Result Page Patterns
- Result views directory: `/home/user/travel-cloth-recom/apps/web/app/result/[tripId]/views/`
- Result components directory: `/home/user/travel-cloth-recom/apps/web/app/result/[tripId]/components/`
- Shared types from `../result-types`: ViewProps, Trip, DEMO_OUTFIT_IMAGES, DEMO_CAPSULE_IMAGES, CITY_FILTERS, getCityFlag, getMonthName
- ProView: ALL cities shown simultaneously as scrollable sections (NOT tabs), each with `scroll-mt-24` anchor
- CityGallery: even-index cities have hero left + smalls right; odd-index cities flip (smalls left, hero right)
- CityGallery hero uses `md:col-span-2 md:row-span-2` in 3-col grid, container height `md:h-[600px]`
- First city gets active regen button (bg-[#C4613A]); subsequent cities get disabled lock button
- First city quote border: `border-[#C4613A]`; city 1: `border-stone-400`; city 2+: `border-stone-500`
- MultiCityTimeline: active city dot = `bg-[#C4613A]`, inactive = `bg-stone-300` with `opacity-80 grayscale`
- Sidebar sticky: `lg:sticky lg:top-24` on the inner wrapper div inside the col div

## Preview / Result Dashboard Patterns
- PreviewClient: uses `styled-jsx global` (not Tailwind) for all CSS; preserves `getPreview` + `createCheckout` API calls
- PreviewClient layout: sticky header → hero copy → 21:9 banner with glassmorphism card → 2×4 outfit grid (Unsplash) → 4-col trip summary → 3-col pricing grid → footer quote
- PreviewClient banner card: progress-bar UI inside glassmorphism overlay showing `mood_name` + vibe tags
- StandardView: accordion outfit cards (4 days) + day strip itinerary + 5-col capsule grid + right sticky sidebar
- StandardView sidebar: Style Code card + City Mood card (2-img grid + color swatches) + Capsule stats + Pro unlock dashed box
- Unused ViewProps fields: prefix with `_` (e.g., `tripId: _tripId`) to avoid TS no-unused-vars errors
- Outfit accordion: `OutfitAccordionCard` sub-component with `isOpen/onToggle` prop pattern (controlled from parent state)
- Day strip: `overflow-x: auto; scrollbar-width: none` for horizontal scroll without visible scrollbar

## Checkout Success Page Pattern
- File: `/apps/web/app/checkout/success/page.tsx`
- URL: `/checkout/success?plan=standard|pro|annual&tripId=xxx`
- `useSearchParams` requires Suspense boundary — export a wrapper `CheckoutSuccessPage` that wraps `CheckoutSuccessInner` in `<Suspense>`
- Polls `GET WORKER_URL/api/result/:tripId` at 500ms interval, max 30s timeout
- Status 402/404 = keep polling; other non-OK status = terminal failure; `data.status === 'completed'` = confirmed
- On confirmed: show success UI, then `router.replace('/result/{tripId}?plan={plan}')` after 2500ms
- On failed: show error + "Back to Pricing" button → `router.push('/#pricing')`
- Three CSS animations: `fillBar` (determinate, 0→100%, 2.5s forwards) and `indeterminate` (sliding bar, 1.4s infinite)
- Icon component has no `filled` prop — just `name`, `size`, `className`
- `done` boolean ref pattern prevents double-redirect if race condition between polling + timeout

## Landing Page Examples Section
- Pro card: `onClick={() => router.push('/result/demo?plan=pro')}` (NOT `/trip`)
- Annual card: `onClick={() => router.push('/result/demo?plan=annual')}` (NOT `/trip`)
- Cards use white card + h-[280px] image + bottom meta strip (not full dark overlay) — matches Figma
- Non-button divs acting as buttons: add `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space for a11y
- Card hover: `hover:border-[#C4613A]/30` (Pro), `hover:border-[#D4AF37]/40` (Annual)
- Annual badge uses `.gold-gradient` CSS utility class

## PreviewClient Pricing Card Figma Pattern
- Standard: `bg-white border border-[#C4613A]/10 rounded-2xl`, h3 text-[28px] Playfair, $5 text-[48px], border-2 border-[#C4613A] outline button `h-[56px] rounded-none`
- Pro: `bg-[#C4613A] boxShadow: '0 4px 16px rgba(196,97,58,.25)'`, badge as `absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1A1410] ... rounded-full`, button `bg-white text-[#C4613A] h-[56px] rounded-none`
- Annual: `relative ... border-[#C4613A]/10`, gold-gradient badge as `absolute -top-3 left-1/2 -translate-x-1/2 ... rounded-full`, button `bg-[#1A1410] text-white h-[56px] rounded-none hover:bg-[#C4613A]`
- Grid uses `items-start` (not `items-stretch`) when cards have absolute-positioned top badges that overflow
- `filled` icon effect: use `<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>` — Icon component has no `filled` prop
- `handleSelectPlan`: `checkout_url` → `window.location.href = checkout_url`; no checkout_url → `router.push('/checkout/success?plan={plan}&tripId={tripId}')`

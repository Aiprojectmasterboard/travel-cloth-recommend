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
- Fonts: 'Playfair Display' (headings), 'DM Sans' (body/UI)
- Mobile breakpoint: max-width 480px (compact), 640px (grid changes), 767px (hamburger menu)
- Responsive via CSS `@media` inside styled-jsx blocks

## Components Inventory
See `components.md` for full list with props interfaces.

## Key Architectural Rules (see system prompt for full list)
- Only `NEXT_PUBLIC_*` env vars in client code
- All business logic goes to Cloudflare Worker (`NEXT_PUBLIC_WORKER_URL`)
- Supabase: anon key + RLS only in client code
- `'use client'` required for: hooks, useState/useEffect, browser APIs, event handlers

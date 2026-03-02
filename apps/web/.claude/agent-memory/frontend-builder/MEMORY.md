# Frontend Builder Agent Memory

## Project: Travel Capsule AI — apps/web

### Key File Paths
- Landing page: `apps/web/app/page.tsx`
- Layout (fonts + JSON-LD): `apps/web/app/layout.tsx`
- i18n system: `apps/web/lib/i18n.ts`
- Language context: `apps/web/components/LanguageContext.tsx`
- Language switcher: `apps/web/components/LanguageSwitcher.tsx`
- Supabase client: `apps/web/lib/supabase.ts`
- API helpers: `apps/web/lib/api.ts`
- Tailwind config: `apps/web/tailwind.config.ts`
- Global CSS: `apps/web/app/globals.css`

### Design System Tokens (from tailwind.config.ts)
- primary: `#b8552e` (CTA, accents)
- secondary: `#1A1410` (text, dark bg)
- cream: `#FDF8F3` (main bg)
- sand: `#F5EFE6` (alt bg)
- gold: `#D4AF37` (stars, italic accents)
- terracotta: `#C4613A` (hover states)
- muted: `#8A7B6E`
- font-playfair: Playfair Display (serif headings, editorial)
- font-sans: DM Sans (body, UI) — via `var(--font-body)`

### CSS Variables (globals.css :root)
- `--font-display`: 'Playfair Display', serif
- `--font-body`: 'DM Sans', sans-serif
- `--font-mono`: 'JetBrains Mono', monospace
- `--max-w`: 1400px
- `--shadow-card`: 0 2px 12px rgba(0,0,0,.06)
- `--shadow-cta`: 0 4px 16px rgba(196,97,58,.25)
- Utility classes: `.grain-overlay`, `.gold-gradient`, `.locked-overlay`

### i18n Architecture (Figma v15 — CURRENT)
- Supported locales: `en`, `ko`, `ja`, `zh`, `fr`, `es` (type `Locale`)
- `LOCALES` array and `LOCALE_LABELS` record still exported for LanguageSwitcher
- `LANGUAGES` array with code/label/nativeLabel for v15 components
- `getTranslations(lang)` — returns `(key: string) => string` function (v15 pattern)
  - Usage: `const t = getTranslations(locale); t("hero.cta")`
  - Falls back to English if key missing
- `detectLocale()` — reads localStorage key `tc-lang` then `tc-locale` (legacy) then navigator.language
- `saveLocale(locale)` — persists to localStorage key `tc-lang`
- `getDisplayFont(lang)`, `getBodyFont(lang)`, `getHeroSize(lang)` — exported from i18n.ts

### LanguageContext (Figma v15 — CURRENT)
- Interface: `{ locale, lang, setLocale, t: (key: string) => string, displayFont, bodyFont }`
- `lang` is alias for `locale`
- `useLanguage()` and `useLang()` both exported
- `getDisplayFont`/`getBodyFont`/`getHeroSize` are in `lib/i18n.ts`

### Translation Key Namespaces (flat keys)
- `hero.*`, `nav.*`, `section.intelligence.*`, `section.capsules.*`, `section.darkCta.*`
- `section.examples.*`, `pricing.*`, `preview.*`, `footer.*`
- `auth.*`, `share.*`, `dashboard.*`, `capsule.*`, `general.*`

### Build Commands
- TypeScript check: `cd /home/user/travel-cloth-recom && npx tsc --noEmit -p apps/web/tsconfig.json`
- Next.js build: run from `apps/web/` dir: `npx next build` (NOT from repo root)

### Migration Status (v15)
- i18n.ts: DONE — flat-key function pattern
- LanguageContext.tsx: DONE — t is now (key: string) => string
- globals.css: DONE — added --max-w, --shadow-card, --shadow-cta
- tailwind.config.ts: DONE — fontFamily.sans uses var(--font-body)/DM Sans
- Old components using t.hero.xxx pattern: WILL BE FIXED by Tasks #2-5 (page rebuilds)
- Expected TS errors until page rebuilds: ~243, all from old object-pattern usage

### Auth System (Supabase SSR)
- Browser client: `apps/web/lib/supabase-browser.ts` — `createBrowserClient` from `@supabase/ssr`
- Auth context: `apps/web/components/AuthProvider.tsx` — exports `AuthProvider` + `useAuth()`
- Auth button: `apps/web/components/AuthButton.tsx` — shows Sign In link or avatar+signout
- OAuth callback: `apps/web/app/auth/callback/route.ts` — Node.js runtime (NOT edge), `await cookies()`
- Login page: `apps/web/app/auth/login/page.tsx` — edge runtime, 'use client'
- layout.tsx wraps: `<AuthProvider><LanguageProvider>{children}</LanguageProvider></AuthProvider>`
- `cookies()` is async in Next.js 15 — always `await cookies()` in route handlers
- The old `apps/web/lib/supabase.ts` has `persistSession: false` — use supabase-browser.ts for auth

### travel-capsule Component Library (apps/web/components/travel-capsule/)
- 27 components total: all are Next.js-adapted (no `import React`, no `useNavigate`, no AuthContext)
- New in v15: `PricingCard.tsx` (plan cards), `Header.tsx` (sticky nav + LanguageSelector + auth)
- `SocialShareButton` is a re-export alias of `SocialShare` from `SocialShare.tsx`
- `LanguageSelector` uses `useLanguage` from `@/components/LanguageContext` (identical to `useLang`)
- `ProfileBadge` uses `useAuth` from `@/components/AuthProvider` — real auth dependency, keep it
- `PricingCard` props: `plan`, `price`, `period`, `description`, `features[]`, `ctaLabel`, `onSelect`, `highlighted`, `badge`
- `Header` props: `onLoginClick`, `userInitials`, `onSignOut`, `showAuth`

### Common Pitfalls
- LanguageSwitcher imports `LOCALES`, `LOCALE_LABELS`, `Locale` from `@/lib/i18n` — all still exported
- New components: use `t("key.subkey")` function pattern, NOT `t.key.subkey` object pattern
- `getDisplayFont`/`getBodyFont`/`getHeroSize` are in `lib/i18n.ts` (also importable from LanguageContext as re-exports? No — import from lib/i18n directly)
- Never use `process.env` without `NEXT_PUBLIC_` prefix in client components
- All `<img>` tags use `eslint-disable-next-line @next/next/no-img-element` comment

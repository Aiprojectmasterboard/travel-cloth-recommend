# Travel Capsule AI — Frontend Builder Memory

## i18n System (implemented 2026-02-26)

### Architecture
- **No external i18n packages** — pure React Context + TypeScript
- Locale: `'ko' | 'en' | 'ja' | 'zh' | 'fr' | 'es'` (6 languages)
- Files: `apps/web/lib/i18n/` — types.ts, index.ts, translations/{ko,en,ja,zh,fr,es}.ts
- Context: `apps/web/components/LanguageContext.tsx` — `LanguageProvider`, `useLanguage()`
- Switcher: `apps/web/components/LanguageSwitcher.tsx` — compact dropdown for Header

### Key Pattern
```tsx
'use client'
import { useLanguage } from '@/components/LanguageContext'
export default function MyComponent() {
  const { t, locale } = useLanguage()
  return <p>{t.hero.headline1}</p>
}
```

### Locale Detection Order
1. `localStorage.getItem('locale')` (persisted user preference)
2. `navigator.language` browser detection
3. Default: `'en'`

### LanguageProvider placement
Wraps `{children}` inside `<body>` in `apps/web/app/layout.tsx`.
Layout is a Server Component with `export const runtime = 'edge'`.
LanguageProvider is `'use client'` — only placed inside body, not wrapping html tag.

### Month handling in FormSection
Use index (`selectedMonthIndex: number`) instead of string label so month
name updates correctly when locale changes. `t.form.months[index]` gives
the translated month name.

### viralCopies type in Translations
`viralCopies` is a function `(cities: string, month: string, city0: string) => string[]`
so each locale can produce properly localised social copy.

## Component Locations
- `apps/web/components/` — all UI components
- `apps/web/app/page.tsx` — home page (`'use client'`)
- `apps/web/app/layout.tsx` — root layout (`export const runtime = 'edge'`)
- `apps/web/app/result/[tripId]/ResultClient.tsx` — gallery result page

## Design Tokens (from globals.css)
- `--ink`: dark text
- `--terracotta`: brand accent (#C4714C area)
- `--cream`: background
- `--sand`: subtle background
- `--warm-white`: slightly warm white
- `--border`: border color
- `--muted`: muted text
- `--gold`: gold accent

## Build Target
Cloudflare Pages — every page needs `export const runtime = 'edge'`
Build command: `cd apps/web && npx next build`
Build succeeds cleanly as of 2026-02-26.

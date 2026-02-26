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

## Conversion Copy Patterns (ko locale — 2026-02-26)
Pain-first headline: "파리 3월, 뭐 입어야 할지 모르겠다면?"
Primary CTA: low-commitment "무료 미리보기 — 지금 바로"
Social proof badge with animated pulse dot: "이번 달 2,400+ 여행자가 사용 중"
Pricing anchoring block: ~~$200/hr~~ vs $5 side-by-side in `.pricing-compare`
Soft urgency nudge below guarantee: "여행 출발 전에 준비하세요 — 나중에 하면 잊어요"
Checkout micro-copy row above button: "👥 이번 달 2,400+ 사용 · ⚡ 결제 후 4분 내 완성"
Blur overlay label: "🔒 $5로 잠금 해제" (3 locked images)
Price anchor below total row: strikethrough $200/hr vs bold $5

### i18n Rule: new keys require types.ts + ALL locale files update
`\n` in strings needs `whiteSpace: 'pre-line'` on the parent element to render as line break.
FAQ items array is append-only — new items go at the end.

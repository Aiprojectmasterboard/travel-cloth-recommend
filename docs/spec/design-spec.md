# Travel Capsule AI -- Design System Specification

> **Product**: Travel Capsule AI
> **Pricing**: $5 Standard / $12 Pro / $29 Annual
> **Positioning**: Luxury travel editorial -- AI travel styling at the intersection of fashion and travel
> **Mood**: Luxury Travel Editorial
> **Last updated**: 2026-02-28

---

## Table of Contents

1. [tailwind.config.ts](#1-tailwindconfigts)
2. [globals.css](#2-globalscss)
3. [Component Tailwind Class Spec](#3-component-tailwind-class-spec)
4. [Funnel Component UI Detail](#4-funnel-component-ui-detail)
5. [Copy Guide (English)](#5-copy-guide-english)

---

## 1. tailwind.config.ts

The single source of truth for all design tokens. This file lives at `apps/web/tailwind.config.ts`.

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#b8552e` | CTA buttons, active states, brand accent, links, check icons |
| `secondary` | `#1A1410` | Body text, headings, dark section backgrounds (Hero, CTA) |
| `cream` | `#FDF8F3` | Default page background, modal backgrounds |
| `sand` | `#F5EFE6` | Alternate section backgrounds, card borders, input borders |
| `gold` | `#D4AF37` | Mood name italic accents, premium highlights, star ratings |
| `weatherBlue` | `#E0F2FE` | Weather UI elements, precipitation bars |

### Full Configuration

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#b8552e',
        secondary: '#1A1410',
        cream: '#FDF8F3',
        sand: '#F5EFE6',
        gold: '#D4AF37',
        weatherBlue: '#E0F2FE',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

### Next.js Font Loading (app/layout.tsx)

```typescript
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta-sans',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Dark Mode

Not supported in the current version. The warm editorial palette is designed exclusively for light mode. The `darkMode: 'class'` configuration is included as a forward-compatible option for a potential future iteration.

---

## 2. globals.css

This file lives at `apps/web/app/globals.css`. It imports Google Fonts (for development convenience), defines Tailwind layers, and establishes global styles including the editorial grain texture overlay.

```css
/* apps/web/app/globals.css */

/* =============================================
   1. Google Fonts
   ============================================= */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

/* =============================================
   2. Tailwind Layers
   ============================================= */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* =============================================
   3. Grain Texture Overlay
   Used on Hero and dark sections for editorial feel.
   Apply class `grain-overlay` on a `relative overflow-hidden` container.
   ============================================= */
.grain-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
  z-index: 1;
}

/* =============================================
   4. Editorial Typography Utility
   ============================================= */
.editorial-text {
  font-family: 'Playfair Display', serif;
}

/* =============================================
   5. Material Symbols Icon Font
   ============================================= */
.material-symbols {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}

/* =============================================
   6. Base / Body Defaults
   ============================================= */
body {
  @apply font-sans antialiased text-secondary bg-cream;
}

/* =============================================
   7. Scrollbar Styling (optional, editorial polish)
   ============================================= */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #FDF8F3; /* cream */
}
::-webkit-scrollbar-thumb {
  background: #F5EFE6; /* sand */
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #b8552e; /* primary */
}

/* =============================================
   8. Selection Color
   ============================================= */
::selection {
  background-color: rgba(184, 85, 46, 0.15); /* primary/15 */
  color: #1A1410; /* secondary */
}
```

### Grain Overlay Usage Example

```tsx
{/* Hero section with grain texture */}
<section className="relative overflow-hidden bg-secondary grain-overlay">
  {/* Content sits above the ::before pseudo-element */}
  <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
    <h1 className="font-serif text-5xl text-cream">Your Style, Destination-Ready</h1>
  </div>
</section>
```

---

## 3. Component Tailwind Class Spec

All reusable UI components live in `apps/web/components/ui/`. Each component below includes every variant, state, and their complete Tailwind class strings. Developers should copy these classes directly into the component implementation.

---

### 3.1 Button (`components/ui/Button.tsx`)

```tsx
// Type definition
type ButtonProps = {
  variant?: 'primary' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'xl'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>
```

#### Variants

| Variant | Tailwind Classes |
|---------|-----------------|
| `primary` | `bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200` |
| `ghost` | `bg-transparent border border-white/30 hover:border-white text-white px-6 py-3 rounded-lg transition-all` |
| `secondary` | `bg-sand hover:bg-sand/80 text-secondary border border-sand px-6 py-3 rounded-lg transition-all` |

#### Sizes

| Size | Tailwind Classes |
|------|-----------------|
| `sm` | `px-4 py-2 text-sm` |
| `md` | `px-6 py-3 text-base` (default) |
| `xl` | `px-10 py-4 text-lg` |

#### States

| State | Tailwind Classes |
|-------|-----------------|
| `loading` | Spinner SVG + `"..."` text appended, `pointer-events-none opacity-80` |
| `disabled` | `opacity-50 cursor-not-allowed` |

#### Full Implementation Reference

```tsx
// apps/web/components/ui/Button.tsx
import { forwardRef } from 'react'

const variantClasses = {
  primary:
    'bg-primary hover:bg-primary/90 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
  ghost:
    'bg-transparent border border-white/30 hover:border-white text-white transition-all',
  secondary:
    'bg-sand hover:bg-sand/80 text-secondary border border-sand transition-all',
} as const

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  xl: 'px-10 py-4 text-lg',
} as const

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg font-sans
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${loading ? 'pointer-events-none opacity-80' : ''}
          ${className ?? ''}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
        {loading && '...'}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

---

### 3.2 Card (`components/ui/Card.tsx`)

```
Default:  p-8 rounded-2xl bg-white border border-sand hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group
```

```tsx
// apps/web/components/ui/Card.tsx
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        p-8 rounded-2xl bg-white border border-sand
        hover:border-primary/30 hover:shadow-xl hover:-translate-y-1
        transition-all duration-300 group
        ${className ?? ''}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
```

---

### 3.3 Input (`components/ui/Input.tsx`)

| State | Tailwind Classes |
|-------|-----------------|
| Default | `border border-sand focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 py-3 w-full bg-white` |
| Error | `border-red-400 focus:border-red-400 focus:ring-red-400` |

```tsx
// apps/web/components/ui/Input.tsx
type InputProps = {
  error?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={`
        border rounded-lg px-4 py-3 w-full bg-white font-sans
        focus:outline-none focus:ring-1 transition-colors
        ${error
          ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
          : 'border-sand focus:border-primary focus:ring-primary'
        }
        ${className ?? ''}
      `}
      {...props}
    />
  )
}
```

---

### 3.4 ImageCard (`components/ui/ImageCard.tsx`)

Two modes: **visible** (unlocked) and **blurred** (locked).

| Mode | Container Classes | Image Classes | Overlay Classes |
|------|-------------------|---------------|-----------------|
| Visible | `rounded-xl overflow-hidden shadow-md aspect-square` | `w-full h-full object-cover` | -- |
| Blurred | `relative rounded-xl overflow-hidden aspect-square` | `w-full h-full object-cover blur-sm scale-105` | `absolute inset-0 bg-black/30 flex items-center justify-center` |

Lock icon inside the overlay:

```tsx
<span className="material-symbols text-white text-4xl">lock</span>
```

Full implementation:

```tsx
// apps/web/components/ui/ImageCard.tsx
type ImageCardProps = {
  src: string
  alt: string
  locked?: boolean
}

export function ImageCard({ src, alt, locked = false }: ImageCardProps) {
  if (!locked) {
    return (
      <div className="rounded-xl overflow-hidden shadow-md aspect-square">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden aspect-square">
      <img src={src} alt={alt} className="w-full h-full object-cover blur-sm scale-105" />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <span className="material-symbols text-white text-4xl">lock</span>
      </div>
    </div>
  )
}
```

---

### 3.5 WeatherWidget (`components/ui/WeatherWidget.tsx`)

```
Container:  w-48 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20
```

```tsx
// apps/web/components/ui/WeatherWidget.tsx
type WeatherWidgetProps = {
  city: string
  tempDay: number
  tempNight: number
  icon: string // Material Symbols icon name, e.g. "sunny", "cloud", "rainy"
}

export function WeatherWidget({ city, tempDay, tempNight, icon }: WeatherWidgetProps) {
  return (
    <div className="w-48 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols text-primary text-xl">{icon}</span>
        <span className="font-sans font-semibold text-secondary text-sm">{city}</span>
      </div>
      <div className="flex justify-between text-secondary">
        <div>
          <div className="text-xs text-secondary/60">Day</div>
          <div className="text-lg font-bold">{tempDay}&deg;</div>
        </div>
        <div>
          <div className="text-xs text-secondary/60">Night</div>
          <div className="text-lg font-bold">{tempNight}&deg;</div>
        </div>
      </div>
    </div>
  )
}
```

---

### 3.6 Badge (`components/ui/Badge.tsx`)

```tsx
// apps/web/components/ui/Badge.tsx
const badgeVariants = {
  default: 'bg-sand text-secondary text-xs px-2 py-0.5 rounded-full font-sans',
  primary: 'bg-primary text-white text-xs px-2 py-0.5 rounded-full font-sans',
  gold: 'bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full font-sans font-semibold',
} as const

type BadgeProps = {
  variant?: keyof typeof badgeVariants
  children: React.ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return <span className={badgeVariants[variant]}>{children}</span>
}
```

---

## 4. Funnel Component UI Detail

All funnel components live in `apps/web/components/funnel/`. These components power the Free-to-Paid conversion flow. Each includes full JSX structure with exact Tailwind classes.

---

### 4.1 ProgressChecklist (`components/funnel/ProgressChecklist.tsx`)

The progress checklist builds trust by showing the user what the AI has already completed for them. Completed items use `check_circle` in primary color; locked items use `lock` in muted/30.

```tsx
// apps/web/components/funnel/ProgressChecklist.tsx
type ProgressItem = {
  label: string
  completed: boolean
  highlight?: string // italic gold text, e.g. moodName
}

type ProgressChecklistProps = {
  items: ProgressItem[]
}

export function ProgressChecklist({ items }: ProgressChecklistProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.completed ? (
            <span className="material-symbols text-primary text-xl">check_circle</span>
          ) : (
            <span className="material-symbols text-secondary/30 text-xl">lock</span>
          )}
          {item.completed ? (
            <span className="text-secondary font-medium">
              {item.label}
              {item.highlight && (
                <>
                  {' -- '}
                  <em className="font-serif italic text-gold">{item.highlight}</em>
                </>
              )}
            </span>
          ) : (
            <span className="text-secondary/40">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### Example Usage

```tsx
<ProgressChecklist
  items={[
    { label: 'Weather analyzed for Paris, Tokyo', completed: true },
    { label: 'City vibe matched', completed: true, highlight: 'Rainy Chic' },
    { label: '4 looks generated (1 unlocked)', completed: true },
    { label: 'Full capsule (10 items) + Day-by-day plan', completed: false },
  ]}
/>
```

#### Rendered Structure

```tsx
<div className="flex flex-col gap-3">
  {/* Completed item */}
  <div className="flex items-center gap-2">
    <span className="material-symbols text-primary text-xl">check_circle</span>
    <span className="text-secondary font-medium">Weather analyzed for Paris, Tokyo</span>
  </div>

  {/* MoodName highlighted item */}
  <div className="flex items-center gap-2">
    <span className="material-symbols text-primary text-xl">check_circle</span>
    <span className="text-secondary font-medium">
      City vibe matched -- <em className="font-serif italic text-gold">Rainy Chic</em>
    </span>
  </div>

  {/* Locked item */}
  <div className="flex items-center gap-2">
    <span className="material-symbols text-secondary/30 text-xl">lock</span>
    <span className="text-secondary/40">Full capsule (10 items) + Day-by-day plan</span>
  </div>
</div>
```

---

### 4.2 WeatherCard (`components/funnel/WeatherCard.tsx`)

Displays per-city weather data from Open-Meteo. Uses weatherBlue for precipitation.

**Container**: `bg-white rounded-2xl border border-sand p-6`

```tsx
// apps/web/components/funnel/WeatherCard.tsx
type WeatherCardProps = {
  city: string
  country: string
  tempDay: number
  tempNight: number
  precipitationProb: number // 0-100
  humidity: number
  windSpeed: number
  icon: string // Material Symbols icon name
}

export function WeatherCard({
  city,
  country,
  tempDay,
  tempNight,
  precipitationProb,
  humidity,
  windSpeed,
  icon,
}: WeatherCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-sand p-6">
      {/* City heading */}
      <div className="flex items-center gap-3 mb-1">
        <span className="material-symbols text-primary text-2xl">{icon}</span>
        <h3 className="font-serif text-2xl italic">{city}</h3>
      </div>
      <p className="text-secondary/60 text-sm ml-11">{country}</p>

      {/* Temperature grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-secondary/60 text-xs uppercase tracking-wide">Daytime</div>
          <div className="text-3xl font-bold text-secondary">{tempDay}&deg;C</div>
        </div>
        <div>
          <div className="text-secondary/60 text-xs uppercase tracking-wide">Nighttime</div>
          <div className="text-3xl font-bold text-secondary">{tempNight}&deg;C</div>
        </div>
      </div>

      {/* Precipitation bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-secondary/60 mb-1">
          <span>Precipitation</span>
          <span>{precipitationProb}%</span>
        </div>
        <div className="bg-sand h-2 rounded-full overflow-hidden">
          <div
            className="bg-weatherBlue h-2 rounded-full transition-all duration-500"
            style={{ width: `${precipitationProb}%` }}
          />
        </div>
      </div>

      {/* Extra stats row */}
      <div className="flex gap-6 mt-4 pt-4 border-t border-sand text-sm text-secondary/70">
        <div className="flex items-center gap-1">
          <span className="material-symbols text-base">humidity_percentage</span>
          {humidity}%
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols text-base">air</span>
          {windSpeed} km/h
        </div>
      </div>
    </div>
  )
}
```

---

### 4.3 VibeCard (`components/funnel/VibeCard.tsx`)

Dark-background card showing the city's AI-matched mood. Gold italic mood name, vibe tags, color palette dots, and "avoid" section.

**Container**: `bg-secondary text-cream rounded-2xl p-6`

```tsx
// apps/web/components/funnel/VibeCard.tsx
type VibeCardProps = {
  city: string
  moodName: string
  vibeTags: string[]
  colorPalette: string[] // hex colors, e.g. ['#C4613A', '#F5EFE6', ...]
  avoidList: string[]
}

export function VibeCard({ city, moodName, vibeTags, colorPalette, avoidList }: VibeCardProps) {
  return (
    <div className="bg-secondary text-cream rounded-2xl p-6">
      {/* City + Mood Name */}
      <p className="text-cream/60 text-sm mb-1">{city}</p>
      <h3 className="font-serif italic text-gold text-2xl mb-4">{moodName}</h3>

      {/* Vibe Tags */}
      <div className="flex gap-2 flex-wrap">
        {vibeTags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded text-xs bg-white/10 border border-white/10"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Color Palette */}
      <div className="flex gap-2 mt-4">
        {colorPalette.map((color) => (
          <div
            key={color}
            className="w-8 h-8 rounded-full border-2 border-white/20"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Avoid Section */}
      {avoidList.length > 0 && (
        <div className="text-cream/60 text-sm mt-4 pt-4 border-t border-white/10">
          <span className="font-semibold text-cream/80">Avoid: </span>
          {avoidList.join(' / ')}
        </div>
      )}
    </div>
  )
}
```

---

### 4.4 CapsuleEstimator (`components/funnel/CapsuleEstimator.tsx`)

Shows estimated capsule item count and the 3 packing principles. Teases the full list behind the paywall.

**Container**: `bg-sand rounded-2xl p-6`

```tsx
// apps/web/components/funnel/CapsuleEstimator.tsx
type CapsuleEstimatorProps = {
  itemCount: number
  principles: string[] // exactly 3 items
}

export function CapsuleEstimator({ itemCount, principles }: CapsuleEstimatorProps) {
  return (
    <div className="bg-sand rounded-2xl p-6">
      {/* Big number */}
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-5xl text-primary">{itemCount}</span>
        <span className="text-secondary text-2xl">items</span>
      </div>
      <p className="text-secondary/60 text-sm mt-1">
        Estimated capsule wardrobe for your trip
      </p>

      {/* Three Principles */}
      <div className="flex flex-col gap-2 mt-4">
        {principles.map((principle) => (
          <div key={principle} className="flex items-center gap-2">
            <span className="material-symbols text-primary/60 text-lg">check_circle</span>
            <span className="text-secondary text-sm">{principle}</span>
          </div>
        ))}
      </div>

      {/* Locked teaser */}
      <div className="text-secondary/40 text-sm text-center mt-4 border-t border-secondary/10 pt-4">
        <span className="material-symbols text-sm align-middle mr-1">lock</span>
        Full item list + daily outfit plan unlocked after purchase
      </div>
    </div>
  )
}
```

#### Example Usage

```tsx
<CapsuleEstimator
  itemCount={10}
  principles={[
    'Mix & match across all cities',
    'Carry-on only — no checked luggage',
    'Weather-adaptive layering system',
  ]}
/>
```

---

### 4.5 TeaserGrid (`components/funnel/TeaserGrid.tsx`)

2x2 grid showing 1 unlocked image + 3 blurred locked images. Includes expiry countdown timer and UNLOCKED badge.

**Container**: `grid grid-cols-2 gap-2`

```tsx
// apps/web/components/funnel/TeaserGrid.tsx
'use client'

import { useEffect, useState } from 'react'

type TeaserGridProps = {
  images: string[] // [0] = unlocked, [1-3] = blurred
  expiresAt: Date
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TeaserGrid({ images, expiresAt }: TeaserGridProps) {
  const [remaining, setRemaining] = useState(() => expiresAt.getTime() - Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(expiresAt.getTime() - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div className="grid grid-cols-2 gap-2">
      {images.map((src, idx) => (
        <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
          {idx === 0 ? (
            <>
              {/* Unlocked image */}
              <img src={src} alt={`Look ${idx + 1}`} className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                UNLOCKED
              </span>
            </>
          ) : (
            <>
              {/* Blurred / locked image */}
              <img
                src={src}
                alt={`Look ${idx + 1} (locked)`}
                className="w-full h-full object-cover blur-sm"
              />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <span className="material-symbols text-white text-4xl">lock_outlined</span>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Expiry timer overlay — spans full grid width */}
      {remaining > 0 && (
        <div className="col-span-2 flex justify-center mt-1">
          <span className="bg-secondary/80 text-cream text-xs px-3 py-1 rounded-full font-mono">
            Expires in {formatCountdown(remaining)}
          </span>
        </div>
      )}
    </div>
  )
}
```

#### Visual Breakdown

| Grid Cell | Image State | Badge / Overlay |
|-----------|-------------|-----------------|
| `[0]` (top-left) | Sharp, full quality | `UNLOCKED` badge: `absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full` |
| `[1]` (top-right) | `blur-sm` | Overlay: `absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center` + `lock_outlined text-white text-4xl` |
| `[2]` (bottom-left) | `blur-sm` | Same overlay as [1] |
| `[3]` (bottom-right) | `blur-sm` | Same overlay as [1] |
| Timer (full width) | -- | `bg-secondary/80 text-cream text-xs px-3 py-1 rounded-full font-mono` |

---

### 4.6 EmailCapture (`components/funnel/EmailCapture.tsx`)

Micro-conversion step. Captures email before the paywall. Sends the mood card via Resend.

**Container**: `bg-white border border-sand rounded-2xl p-6`

```tsx
// apps/web/components/funnel/EmailCapture.tsx
'use client'

import { useState } from 'react'

type EmailCaptureProps = {
  city: string
  moodName: string
  onSubmit: (email: string) => Promise<void>
}

export function EmailCapture({ city, moodName, onSubmit }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await onSubmit(email)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-white border border-sand rounded-2xl p-6">
      {/* Heading */}
      <h3 className="font-serif text-xl">
        Get your {city} -- <em className="italic text-gold">{moodName}</em> mood card
      </h3>
      <p className="text-secondary/70 text-sm mt-1">
        We'll email you the weather + vibe summary. No spam, ever.
      </p>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="border border-sand focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 py-3 w-full bg-white"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Success message */}
      {status === 'success' && (
        <p className="text-green-600 flex items-center gap-1 mt-2 text-sm">
          <span className="material-symbols text-sm">check_circle</span>
          Mood card sent! Check your inbox.
        </p>
      )}

      {/* Error message */}
      {status === 'error' && (
        <p className="text-red-500 flex items-center gap-1 mt-2 text-sm">
          <span className="material-symbols text-sm">error</span>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}
```

---

### 4.7 PaywallModal (`components/funnel/PaywallModal.tsx`)

The primary monetization gate. Three pricing tiers: Standard ($5), Pro ($12, recommended), Annual ($29/yr).

**Backdrop**: `fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4`
**Modal body**: `max-w-lg w-full bg-cream rounded-3xl p-8 shadow-2xl`

```tsx
// apps/web/components/funnel/PaywallModal.tsx
'use client'

type Plan = 'standard' | 'pro' | 'annual'

type PaywallModalProps = {
  city: string
  moodName: string
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (plan: Plan) => void
}

export function PaywallModal({ city, moodName, isOpen, onClose, onSelectPlan }: PaywallModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-cream rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="font-serif text-2xl text-center">
          Your <em className="italic text-gold">{city} -- {moodName}</em> is ready
        </h2>
        <p className="text-secondary/60 text-sm text-center mt-2">
          Choose a plan to unlock your full capsule wardrobe
        </p>

        {/* Plan Cards */}
        <div className="flex flex-col gap-4 mt-6">

          {/* Standard */}
          <button
            onClick={() => onSelectPlan('standard')}
            className="border border-sand rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-secondary">Standard</h3>
                <p className="text-secondary/60 text-sm mt-1">
                  4 looks unlocked + capsule list + daily plan
                </p>
              </div>
              <span className="text-2xl font-bold text-secondary">$5</span>
            </div>
          </button>

          {/* Pro (recommended) */}
          <button
            onClick={() => onSelectPlan('pro')}
            className="bg-primary text-white rounded-2xl p-6 ring-2 ring-primary ring-offset-2 text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Pro</h3>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    BEST VALUE
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  All cities, 4-6 HD looks each, 1 free re-generation
                </p>
              </div>
              <span className="text-2xl font-bold">$12</span>
            </div>
          </button>

          {/* Annual */}
          <button
            onClick={() => onSelectPlan('annual')}
            className="border border-sand rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all text-left"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-secondary">Annual</h3>
                <p className="text-secondary/60 text-sm mt-1">
                  For the traveler who never stops -- $2.42/month, billed annually
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-secondary">$29</span>
                <span className="text-secondary/60 text-xs block">/year</span>
              </div>
            </div>
          </button>

        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full text-center text-secondary/50 text-sm hover:text-secondary transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
```

#### Plan Card Styles Summary

| Plan | Tailwind Classes |
|------|-----------------|
| Standard | `border border-sand rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all text-left` |
| Pro (recommended) | `bg-primary text-white rounded-2xl p-6 ring-2 ring-primary ring-offset-2 text-left` |
| Annual | `border border-sand rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all text-left` |

---

### 4.8 UpgradeModal (`components/funnel/UpgradeModal.tsx`)

Post-purchase upsell. Standard buyers see this immediately after checkout. 3-minute countdown timer. Upgrades to Pro for $7 more.

**Backdrop**: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center`
**Modal body**: `max-w-md w-full bg-cream rounded-3xl p-8`

```tsx
// apps/web/components/funnel/UpgradeModal.tsx
'use client'

import { useEffect, useState } from 'react'

type UpgradeModalProps = {
  isOpen: boolean
  onUpgrade: () => void
  onDismiss: () => void
  expiresAt: Date // 3 minutes from open
}

function formatTimer(ms: number): string {
  if (ms <= 0) return '00:00'
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function UpgradeModal({ isOpen, onUpgrade, onDismiss, expiresAt }: UpgradeModalProps) {
  const [remaining, setRemaining] = useState(() => expiresAt.getTime() - Date.now())

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      const r = expiresAt.getTime() - Date.now()
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        onDismiss()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, expiresAt, onDismiss])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-cream rounded-3xl p-8">
        {/* Heading */}
        <h2 className="font-serif text-2xl text-center">Want the full picture?</h2>
        <p className="text-secondary/60 text-sm text-center mt-2">
          Upgrade to Pro -- see every city's full wardrobe
        </p>

        {/* Timer */}
        <div className="text-center mt-6">
          <span className="font-mono text-2xl text-primary font-bold">
            {formatTimer(remaining)}
          </span>
          <p className="text-secondary/50 text-xs mt-1">Offer expires soon</p>
        </div>

        {/* What you get */}
        <ul className="mt-6 space-y-2 text-sm text-secondary">
          <li className="flex items-center gap-2">
            <span className="material-symbols text-primary text-lg">check_circle</span>
            All cities -- 4-6 HD editorial looks each
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols text-primary text-lg">check_circle</span>
            1 free re-generation if you want a different vibe
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols text-primary text-lg">check_circle</span>
            Priority image generation (2x faster)
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mt-6">
          {/* Upgrade CTA */}
          <button
            onClick={onUpgrade}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full text-center"
          >
            Upgrade for $7
          </button>

          {/* Dismiss CTA */}
          <button
            onClick={onDismiss}
            className="bg-transparent border border-white/30 hover:border-secondary/30 text-secondary/50 hover:text-secondary px-6 py-3 rounded-lg transition-all w-full text-center"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 5. Copy Guide (English)

All user-facing copy for the Travel Capsule AI conversion funnel. Organized by context. Use these strings as-is or as templates (replace `{City}`, `{MoodName}`, `{N}`, `{HH:MM:SS}` with dynamic values).

---

### 5.1 Free Reward Copy

Shown on the preview page after the AI generates free results.

| Context | Copy |
|---------|------|
| Headline | `Your {City} -- {MoodName} is ready to unlock` |
| Sub-headline | `4 looks are waiting for you` |
| Secondary CTA | `See what to wear in {City}` |

---

### 5.2 CTA Button Copy

| Context | Copy |
|---------|------|
| Primary unlock | `Unlock Your {City} Looks` |
| Standard plan | `Start My $5 Plan` |
| Pro plan | `Get Pro -- Best Value` |
| Upgrade upsell | `Upgrade for $7` |

---

### 5.3 Annual Plan Copy

| Context | Copy |
|---------|------|
| Tagline | `For the traveler who never stops` |
| Price detail | `$2.42/month, billed annually` |
| Benefit | `12 trips/year included` |

---

### 5.4 Expiry / Urgency Copy

| Context | Copy |
|---------|------|
| Static notice | `Your looks expire in 48 hours` |
| Live countdown | `Expires in {HH:MM:SS}` |
| Re-engagement | `Don't let your capsule disappear` |

---

### 5.5 Upsell Copy (Standard to Pro)

| Context | Copy |
|---------|------|
| Headline | `Want the full picture?` |
| Sub-headline | `Upgrade to Pro -- just $7 more` |
| Benefit | `See every city's full wardrobe` |

---

### 5.6 Share / Viral Loop Copy

| Context | Copy |
|---------|------|
| OG title | `See my {City} -- {MoodName} look` |
| Share CTA | `My travel capsule for {City}` |
| Social copy | `I'm packing like this for {City}` |
| Receiver CTA | `Create yours -- free to start` |

---

### 5.7 Section Background Patterns

Reference for page-level layout. Each section uses a specific background treatment to create visual rhythm.

```
Section         │ Background Classes
────────────────┼──────────────────────────────────────────────────────
Header          │ bg-cream/95 backdrop-blur-sm border-b border-sand
Hero            │ bg-secondary grain-overlay (relative overflow-hidden)
Features        │ bg-cream
How It Works    │ bg-sand
Testimonials    │ bg-white border-y border-sand
CTA Section     │ bg-secondary
Footer          │ bg-white border-t border-sand
```

#### Section Layout Examples

```tsx
{/* Header */}
<header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-sand">
  <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <span className="font-serif text-xl text-secondary">Travel Capsule</span>
    <button className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 text-sm rounded-lg shadow-md transition-all">
      Start Free
    </button>
  </nav>
</header>

{/* Hero */}
<section className="relative overflow-hidden bg-secondary grain-overlay">
  <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
    <h1 className="font-serif text-4xl md:text-6xl text-cream leading-tight">
      Your Style,<br />Destination-Ready
    </h1>
    <p className="text-cream/70 text-lg mt-6 max-w-2xl mx-auto font-sans">
      AI-powered capsule wardrobes tailored to every city's weather and vibe
    </p>
    <button className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold px-10 py-4 text-lg rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      Start My $5 Plan
    </button>
  </div>
</section>

{/* Features */}
<section className="bg-cream py-20">
  <div className="max-w-7xl mx-auto px-6">
    {/* Feature cards grid */}
  </div>
</section>

{/* How It Works */}
<section className="bg-sand py-20">
  <div className="max-w-7xl mx-auto px-6">
    {/* Steps */}
  </div>
</section>

{/* Testimonials */}
<section className="bg-white border-y border-sand py-20">
  <div className="max-w-7xl mx-auto px-6">
    {/* Testimonial cards */}
  </div>
</section>

{/* CTA Section */}
<section className="bg-secondary py-20">
  <div className="max-w-7xl mx-auto px-6 text-center">
    <h2 className="font-serif text-3xl md:text-4xl text-cream">
      Don't let your capsule disappear
    </h2>
    <button className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold px-10 py-4 text-lg rounded-lg shadow-md hover:shadow-lg transition-all">
      Unlock Your Looks
    </button>
  </div>
</section>

{/* Footer */}
<footer className="bg-white border-t border-sand py-12">
  <div className="max-w-7xl mx-auto px-6 text-secondary/60 text-sm">
    {/* Footer content */}
  </div>
</footer>
```

---

## Appendix: Quick Reference Card

### Token Cheat Sheet

```
Primary    #b8552e   CTA, accent, check icons
Secondary  #1A1410   Text, dark BG (Hero, CTA section)
Cream      #FDF8F3   Page BG, modal BG
Sand       #F5EFE6   Section BG, borders, input borders
Gold       #D4AF37   MoodName italic, premium highlights
WeatherBl  #E0F2FE   Weather precipitation bars

Serif      Playfair Display   Headings, editorial italic
Sans       Plus Jakarta Sans  Body, UI text
Icons      Material Symbols Outlined
```

### File Path Map

```
apps/web/tailwind.config.ts          <- Tailwind config (Section 1)
apps/web/app/globals.css             <- Global styles (Section 2)
apps/web/components/ui/Button.tsx    <- Button component
apps/web/components/ui/Card.tsx      <- Card component
apps/web/components/ui/Input.tsx     <- Input component
apps/web/components/ui/ImageCard.tsx  <- ImageCard (visible/blurred)
apps/web/components/ui/WeatherWidget.tsx <- WeatherWidget
apps/web/components/ui/Badge.tsx     <- Badge component
apps/web/components/funnel/ProgressChecklist.tsx
apps/web/components/funnel/WeatherCard.tsx
apps/web/components/funnel/VibeCard.tsx
apps/web/components/funnel/CapsuleEstimator.tsx
apps/web/components/funnel/TeaserGrid.tsx
apps/web/components/funnel/EmailCapture.tsx
apps/web/components/funnel/PaywallModal.tsx
apps/web/components/funnel/UpgradeModal.tsx
```

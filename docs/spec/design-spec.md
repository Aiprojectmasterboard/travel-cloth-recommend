# Travel Capsule AI -- Design System Specification

> **Product**: Travel Capsule AI
> **Pricing**: $5 / trip (one-time, no subscription)
> **Positioning**: Luxury editorial mood -- AI travel styling at the intersection of fashion and travel
> **Last updated**: 2026-02-28

---

## Table of Contents

1. [Brand Direction](#1-brand-direction)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Component Catalog & States](#4-component-catalog--states)
5. [Page Layout Specifications](#5-page-layout-specifications)
6. [Animation Rules](#6-animation-rules)
7. [Spacing System](#7-spacing-system)
8. [Icon System](#8-icon-system)
9. [Responsive Image Strategy](#9-responsive-image-strategy)

---

## 1. Brand Direction

### Mood

**"Luxury Travel Editorial"** -- Vogue Voyage meets AI.

Travel Capsule AI sits at the premium end of AI consumer tools. Every visual decision should feel like flipping through a high-end travel magazine: warm tones, generous whitespace, editorial photography, and confident typography.

### Tone of Voice

- **Warm & refined** -- never cold or clinical
- **Trustworthy** -- professional without being corporate
- **Inviting** -- approachable luxury, not exclusive luxury
- **Confident** -- clear value proposition, no apologizing for the price

### Reference Brands

| Brand | What we borrow |
|-------|---------------|
| **Net-a-Porter** | Product card elegance, serif/sans contrast, cream-and-ink palette |
| **Kinfolk Magazine** | Generous whitespace, editorial grid, muted photography style |
| **Airbnb Luxe** | Trust through simplicity, warm photography, smooth micro-interactions |

### Brand Principles

1. **Editorial first** -- every page should feel like a magazine spread
2. **Warm over cool** -- terracotta and sand over blue and grey
3. **Typography drives hierarchy** -- Playfair Display creates instant luxury
4. **Restraint is luxury** -- fewer elements, more breathing room
5. **Photography sets the tone** -- 3:4 portrait ratio, warm color grading

---

## 2. Color System

### Color Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary (Terracotta)** | `#C4613A` | `rgb(196, 97, 58)` | CTA buttons, active states, brand accent, links |
| **Ink** | `#1A1410` | `rgb(26, 20, 16)` | Body text, headings, primary foreground |
| **Sand** | `#F5EFE6` | `rgb(245, 239, 230)` | Alternate section backgrounds, subtle fills |
| **Cream** | `#FDF8F3` | `rgb(253, 248, 243)` | Default page background |
| **Gold** | `#C8A96E` | `rgb(200, 169, 110)` | Premium accents, pricing, selected states, month picker active |
| **Muted** | `#8A7B6E` | `rgb(138, 123, 110)` | Secondary text, captions, placeholders |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Card backgrounds, overlays |
| **Warm White** | `#FAF6F0` | `rgb(250, 246, 240)` | "How It Works" section background, input fills |
| **Error** | `#D64545` | `rgb(214, 69, 69)` | Validation errors, destructive actions |
| **Success** | `#2D7D52` | `rgb(45, 125, 82)` | Success states, completed steps |
| **Border** | `rgba(26,20,16,0.12)` | -- | Dividers, card borders, subtle separators |

### Derived Colors (Functional)

| Token | Value | Usage |
|-------|-------|-------|
| Primary Hover | `#B3582F` | Button hover state (darkened terracotta) |
| Primary Shadow | `rgba(196, 97, 58, 0.35)` | CTA button box-shadow |
| Primary Shadow Hover | `rgba(196, 97, 58, 0.45)` | CTA hover box-shadow |
| Ink Overlay | `rgba(26, 20, 16, 0.8)` | Modal backdrop |
| Gold Glow | `rgba(200, 169, 110, 0.3)` | Active step ring |
| Success Green | `#5B8C5A` | Completed step dots, live indicator |

### CSS Custom Properties

```css
:root {
  /* -- Core Palette -- */
  --color-primary: #C4613A;
  --color-primary-hover: #B3582F;
  --color-ink: #1A1410;
  --color-sand: #F5EFE6;
  --color-cream: #FDF8F3;
  --color-gold: #C8A96E;
  --color-muted: #8A7B6E;
  --color-white: #FFFFFF;
  --color-warm-white: #FAF6F0;

  /* -- Semantic -- */
  --color-error: #D64545;
  --color-success: #2D7D52;
  --color-success-alt: #5B8C5A;
  --color-border: rgba(26, 20, 16, 0.12);

  /* -- Shadows -- */
  --shadow-primary: 0 4px 20px rgba(196, 97, 58, 0.35);
  --shadow-primary-hover: 0 8px 30px rgba(196, 97, 58, 0.45);
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.3);

  /* -- Overlay -- */
  --overlay-backdrop: rgba(26, 20, 16, 0.8);
  --overlay-blur: blur(8px);
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C4613A',
          hover: '#B3582F',
        },
        ink: '#1A1410',
        sand: '#F5EFE6',
        cream: '#FDF8F3',
        gold: '#C8A96E',
        muted: '#8A7B6E',
        'warm-white': '#FAF6F0',
        error: '#D64545',
        success: '#2D7D52',
        'success-alt': '#5B8C5A',
        border: 'rgba(26, 20, 16, 0.12)',
      },
      boxShadow: {
        'primary': '0 4px 20px rgba(196, 97, 58, 0.35)',
        'primary-hover': '0 8px 30px rgba(196, 97, 58, 0.45)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config
```

### Dark Mode

Not supported. Out of scope for the current product version. The warm editorial palette is designed exclusively for light mode.

---

## 3. Typography

### Font Stack

| Role | Font Family | Source | Fallback |
|------|-------------|--------|----------|
| **Heading** | Playfair Display | Google Fonts | Georgia, serif |
| **Body / UI** | DM Sans | Google Fonts | system-ui, sans-serif |
| **Mono / Price** | JetBrains Mono | Google Fonts | monospace |

### Next.js Font Loading

```typescript
// app/layout.tsx
import { Playfair_Display, DM_Sans } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})
```

### Tailwind Font Extension

```typescript
// tailwind.config.ts > theme.extend
fontFamily: {
  playfair: ['Playfair Display', 'Georgia', 'serif'],
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

### Type Scale

| Token | Size (rem) | Size (px) | Weight | Line-height | Letter-spacing | Font Family | Usage |
|-------|-----------|-----------|--------|-------------|----------------|-------------|-------|
| **Display** | 4rem | 64px | 700 | 1.1 | -0.03em | Playfair Display | Hero headline |
| **H1** | 2.5rem | 40px | 700 | 1.2 | -0.025em | Playfair Display | Page titles |
| **H2** | 2rem | 32px | 600 | 1.3 | -0.025em | Playfair Display | Section titles |
| **H3** | 1.5rem | 24px | 600 | 1.4 | 0 | Playfair Display | Card titles |
| **Body LG** | 1.125rem | 18px | 400 | 1.6 | 0 | DM Sans | Lead paragraphs |
| **Body** | 1rem | 16px | 400 | 1.6 | 0 | DM Sans | Default body text |
| **Body SM** | 0.875rem | 14px | 400 | 1.5 | 0 | DM Sans | Secondary text, captions |
| **Label** | 0.75rem | 12px | 500 | 1.4 | 0.12em | DM Sans | Labels, tags, overlines (uppercase) |
| **Price** | 2rem | 32px | 700 | 1.0 | 0 | JetBrains Mono | Price display |

### Responsive Type

Hero headline uses `clamp()` for fluid scaling:

```css
/* Hero headline */
.hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.8rem, 5vw, 5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

/* Section titles */
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.9rem, 3.5vw, 3rem);
  line-height: 1.15;
  letter-spacing: -0.025em;
}
```

### Section Labels (Overline)

Used above every section title for category context:

```css
.section-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: 0.75rem;
}
```

---

## 4. Component Catalog & States

### 4.1 Button

#### Props Interface

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
  ariaLabel?: string
  fullWidth?: boolean
  className?: string
}
```

#### Size Scale

| Size | Padding | Font Size | Border Radius | Min Height |
|------|---------|-----------|---------------|------------|
| `sm` | `0.5rem 1.2rem` | `0.85rem` | `50px` | `36px` |
| `md` | `0.9rem 2rem` | `0.95rem` | `50px` | `44px` |
| `lg` | `1rem 2.5rem` | `1rem` | `50px` | `52px` |

#### Variant: Primary

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-primary);
  color: #FFFFFF;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.15s ease,
              box-shadow 0.15s ease,
              background 0.15s ease;
  box-shadow: var(--shadow-primary);
}

/* Hover */
.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary-hover);
}

/* Active / Pressed */
.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(196, 97, 58, 0.3);
}

/* Focus Visible (keyboard navigation) */
.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

/* Loading */
.btn-primary[data-loading="true"] {
  opacity: 0.75;
  cursor: not-allowed;
  pointer-events: none;
}

/* Disabled */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Loading Spinner (inside button)

```css
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Variant: Secondary

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  color: var(--color-primary);
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  border: 1.5px solid var(--color-primary);
  border-radius: 50px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* Hover */
.btn-secondary:hover {
  background: rgba(196, 97, 58, 0.06);
  transform: translateY(-1px);
}

/* Active */
.btn-secondary:active {
  transform: translateY(0);
}

/* Focus Visible */
.btn-secondary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

/* Disabled */
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Variant: Ghost

```css
.btn-ghost {
  background: none;
  border: none;
  color: var(--color-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

/* Hover */
.btn-ghost:hover {
  color: var(--color-ink);
}

/* Focus Visible */
.btn-ghost:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Disabled */
.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Checkout Button (Special Primary Variant)

Used in pricing and form preview. Gradient-enhanced primary button.

```css
.checkout-btn {
  display: block;
  width: 100%;
  background: linear-gradient(135deg, #C4613A 0%, #D97A52 100%);
  color: #FFFFFF;
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  padding: 1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 25px rgba(196, 97, 58, 0.4);
  transition: transform 0.15s ease,
              box-shadow 0.15s ease,
              background 0.15s ease;
}

.checkout-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #B8552F 0%, #C46840 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 35px rgba(196, 97, 58, 0.5);
}

.checkout-btn:active {
  transform: translateY(0);
}

.checkout-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  transform: none;
}
```

---

### 4.2 Card

#### Props Interface

```typescript
interface CardProps {
  variant: 'default' | 'elevated'
  selected?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}
```

#### Variant: Default

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease,
              box-shadow 0.2s ease,
              border-color 0.2s ease;
}

/* Hover -- lift effect */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

/* Selected -- gold border */
.card[data-selected="true"],
.card.selected {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 1px var(--color-gold);
}
```

#### Variant: Elevated

```css
.card-elevated {
  background: var(--color-white);
  border: none;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-elevated:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}
```

#### Dark Card (Form section context)

Used inside the dark-background form section:

```css
.form-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  transition: box-shadow 0.2s ease;
}
```

#### Pricing Card (Dark, premium)

```css
.pricing-card {
  background: linear-gradient(145deg, #1E1A16 0%, #26201A 100%);
  border: 1px solid rgba(200, 169, 110, 0.3);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: var(--shadow-modal);
  position: relative;
  overflow: hidden;
  text-align: center;
  color: #FFFFFF;
}

/* Radial gold glow overlay (::before pseudo) */
.pricing-card::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(
    circle at 70% 30%,
    rgba(200, 169, 110, 0.15) 0%,
    transparent 60%
  );
  pointer-events: none;
}
```

---

### 4.3 Input

#### Props Interface

```typescript
interface InputProps {
  type: 'text' | 'email' | 'file' | 'number'
  value?: string | number
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  success?: boolean
  label?: string
  ariaLabel?: string
  className?: string
}
```

#### Default State

```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-warm-white);
  color: var(--color-ink);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input::placeholder {
  color: var(--color-muted);
  opacity: 0.6;
}
```

#### Focus State

```css
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(196, 97, 58, 0.1);
}
```

#### Error State

```css
.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(214, 69, 69, 0.1);
}

.input-error-message {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: var(--color-error);
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
```

#### Success State

```css
.input-success {
  border-color: var(--color-success);
}

.input-success:focus {
  border-color: var(--color-success);
  box-shadow: 0 0 0 3px rgba(45, 125, 82, 0.1);
}
```

#### Disabled State

```css
.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-sand);
}
```

#### Dark Input (Form section context)

```css
.city-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #FFFFFF;
  font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif;
}

.city-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Wrapper for dark inputs */
.city-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  transition: border-color 0.2s ease;
}

.city-row:focus-within {
  border-color: var(--color-gold);
}
```

#### iOS Zoom Prevention

Inputs on mobile must have `font-size >= 16px` to prevent iOS auto-zoom:

```css
@media (max-width: 480px) {
  .city-input,
  .days-input,
  input[type="number"] {
    font-size: 16px;
  }
}
```

---

### 4.4 ImageCard

#### Props Interface

```typescript
interface ImageCardProps {
  src: string
  alt: string
  city?: string
  mood?: string
  look?: string
  state: 'loading' | 'visible' | 'blurred'
  onUnlock?: () => void
  className?: string
}
```

#### State: Loading (Skeleton)

```css
.image-card-skeleton {
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    var(--color-sand) 25%,
    var(--color-warm-white) 37%,
    var(--color-sand) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1500ms ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

#### State: Visible (Unlocked)

```css
.image-card {
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-cream);
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.image-card-img {
  aspect-ratio: 3 / 4;
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.image-card-info {
  padding: 0.9rem;
}

.image-card-city {
  font-size: 0.75rem;
  color: var(--color-muted);
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.image-card-look {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-ink);
  line-height: 1.3;
}

/* Mood badge (top-left overlay) */
.image-card-mood {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(253, 250, 246, 0.9);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--color-ink);
  font-weight: 500;
}
```

#### State: Blurred (Paywall Overlay)

```css
.image-card-blurred img {
  filter: blur(6px) brightness(0.7);
  transition: filter 0.8s ease-out;
}

.image-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  text-align: center;
  gap: 0.3rem;
  z-index: 2;
}

.image-card-lock-icon {
  font-size: 1.4rem;
}

.image-card-lock-text {
  font-size: 0.7rem;
  font-family: 'DM Sans', sans-serif;
}

/* Watermark gradient (bottom) */
.image-card-watermark {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 0.8rem 0.5rem 0.4rem;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  letter-spacing: 0.08em;
}
```

#### Blur Reveal Animation (post-payment)

```css
.image-card-revealed img {
  filter: blur(0);
  transition: filter 800ms ease-out;
}

.image-card-revealed .image-card-overlay {
  opacity: 0;
  transition: opacity 400ms ease-out;
  pointer-events: none;
}
```

---

### 4.5 ProgressBar

#### Props Interface

```typescript
interface ProgressBarProps {
  currentStep: 1 | 2 | 3 | 4
}

// Step definition
interface Step {
  num: number
  icon: string
  label: string
}
```

#### Steps Data

```typescript
const STEPS: Step[] = [
  { num: 1, icon: '\uD83D\uDCCD', label: 'City Input' },
  { num: 2, icon: '\uD83D\uDCC5', label: 'Month Select' },
  { num: 3, icon: '\uD83D\uDC41',  label: 'Preview' },
  { num: 4, icon: '\uD83D\uDD13', label: 'Checkout Complete' },
]
```

#### Visual Design

```css
/* Container */
.progress-steps-wrap {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 2rem;
}

.progress-steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

/* Each step item */
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

/* Circle */
.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

/* Step states */
.step-circle-completed {
  background: var(--color-primary);
  color: #FFFFFF;
}

.step-circle-current {
  background: var(--color-gold);
  color: var(--color-ink);
  box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.3);
}

.step-circle-upcoming {
  background: var(--color-border);
  color: var(--color-muted);
}

/* Labels */
.step-label {
  margin-top: 0.45rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.step-label-completed { color: var(--color-primary); }
.step-label-current   { color: var(--color-ink); font-weight: 600; }
.step-label-upcoming  { color: var(--color-muted); }

/* Connector line between steps */
.step-connector {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  z-index: 0;
}

.step-connector-done    { background: var(--color-primary); }
.step-connector-pending { background: var(--color-border); }
```

#### Modal Progress Bar (Linear)

```css
.progress-bar {
  height: 4px;
  background: var(--color-sand);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 1s ease;
}
```

#### Mobile Adaptation

```css
@media (max-width: 480px) {
  .step-label   { display: none; }
  .step-circle  { width: 30px; height: 30px; }
  .step-icon    { font-size: 0.8rem; }
  .step-connector { top: 15px; }
}
```

---

### 4.6 CityTag

#### Props Interface

```typescript
interface CityTagProps {
  city: string
  flag: string
  days: number
  onRemove: () => void
  canRemove: boolean
}
```

#### Visual Design

```css
.city-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  transition: border-color 0.2s ease;
}

.city-row:focus-within {
  border-color: var(--color-gold);
}

.city-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.city-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  transition: color 0.2s ease;
  flex-shrink: 0;
  padding: 0 0.2rem;
}

.city-remove:hover {
  color: var(--color-primary);
}

/* Days badge */
.days-input {
  width: 58px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  outline: none;
  color: #FFFFFF;
  font-size: 0.9rem;
  font-family: 'DM Sans', sans-serif;
  text-align: center;
  border-radius: 6px;
  padding: 0.3rem;
  flex-shrink: 0;
}

.days-label {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
```

#### Add City Button

```css
.add-city-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  font-family: 'DM Sans', sans-serif;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
}

.add-city-btn:hover:not(:disabled) {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.add-city-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### 4.7 MonthPicker

#### Props Interface

```typescript
interface MonthPickerProps {
  selectedIndex: number
  onSelect: (index: number) => void
  months: string[]  // Localized month names, 12 items
}
```

#### Visual Design

```css
.month-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
}

.month-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.72rem;
  font-family: 'DM Sans', sans-serif;
  padding: 0.5rem 0;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  letter-spacing: 0.03em;
}

/* Hover & Active (selected) */
.month-btn:hover,
.month-btn.active {
  background: var(--color-gold);
  border-color: var(--color-gold);
  color: var(--color-ink);
  font-weight: 500;
}

/* Focus Visible */
.month-btn:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}
```

#### Mobile Layout

```css
/* Tablet */
@media (max-width: 640px) {
  .month-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .month-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

### 4.8 Toast / Notification

#### Props Interface

```typescript
interface ToastProps {
  message: string
  visible: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number  // Default: 3000ms
}
```

#### Visual Design

```css
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.8rem 1.4rem;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  z-index: 2000;
  max-width: 280px;
  line-height: 1.4;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  pointer-events: none;
}

/* Visible state */
.toast.show {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

/* Type variants */
.toast-default,
.toast-info {
  background: var(--color-ink);
  color: #FFFFFF;
}

.toast-success {
  background: var(--color-success);
  color: #FFFFFF;
}

.toast-error {
  background: var(--color-error);
  color: #FFFFFF;
}

.toast-warning {
  background: #E8A93E;
  color: var(--color-ink);
}
```

#### Auto-dismiss Behavior

```typescript
// Usage pattern
const TOAST_DURATION = 3000 // 3 seconds

function showToast(message: string, type: ToastType = 'info') {
  setToast({ message, visible: true, type })
  setTimeout(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, TOAST_DURATION)
}
```

#### Mobile Adaptation

```css
@media (max-width: 640px) {
  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
```

---

## 5. Page Layout Specifications

### Grid System

| Breakpoint | Width Range | Container | Columns | Gutter | Side Padding |
|------------|------------|-----------|---------|--------|--------------|
| **Mobile** | 320-767px | `100% - 32px` | 4 | 16px | 16px each |
| **Tablet** | 768-1023px | `100% - 64px` | 8 | 24px | 32px each |
| **Desktop** | 1024px+ | `max-width: 1200px` | 12 | 32px | auto (centered) |

```css
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

@media (max-width: 640px) {
  .container {
    padding: 0 1.2rem;
  }
}
```

### Section Rhythm

```css
section {
  padding: 5rem 0;
}

@media (max-width: 640px) {
  section {
    padding: 3.5rem 0;
  }
}
```

---

### 5.1 Landing Page Layout

#### Section Flow & Background Pattern

| Order | Section | Background | Notes |
|-------|---------|------------|-------|
| 1 | Header (fixed) | `cream @ 92% opacity + blur(12px)` | Sticky, z-index: 100 |
| 2 | Hero | `sand` | Full viewport height |
| 3 | Social Proof Bar | `cream` | Inline trust signals |
| 4 | How It Works | `warm-white` | Border-top, border-bottom |
| 5 | Form (Trip Builder) | `ink` (dark) | Dark background, gold accents |
| 6 | Sample Output | `sand` | 4-column image grid |
| 7 | Capsule Wardrobe | `cream` | 5-column item grid |
| 8 | Pricing | `warm-white` | Centered dark card |
| 9 | FAQ | `cream` | 2-column accordion |
| 10 | Partner CTA | `sand` | Contact form |
| 11 | Footer | `ink` (dark) | Minimal |

#### Hero Layout

**Desktop** (>1024px):
```
+------------------------------+------------------------------+
|        hero-left (6col)      |       hero-right (6col)      |
|                              |                              |
|  [tag]                       |  +--------+ +--------+       |
|  [headline - Playfair]       |  |        | |  img2  |       |
|  [sub text]                  |  | main   | +--------+       |
|  [social proof]              |  | image  | +--------+       |
|  [CTA primary] [CTA ghost]  |  |        | |  img3  |       |
|  [trust numbers: 3-4 | 8-12 |  +--------+ +--------+       |
|    | 2-4min | $5]            |                              |
+------------------------------+------------------------------+
```

**Tablet** (768-1024px):
```
+--------------------------------------------+
|            hero-left (full width)          |
|  [tag] [headline] [sub] [CTAs] [trust]    |
+--------------------------------------------+
|  [horizontal scroll strip of 3 cards]      |
+--------------------------------------------+
```

**Mobile** (<768px):
```
+------------------------+
| [tag]                  |
| [headline]             |
| [sub text]             |
| [social proof]         |
| [CTA full width]       |
| [ghost link]           |
| [trust row centered]   |
+------------------------+
| [scroll strip cards]   |
+------------------------+
```

#### CTA Fixed Bottom (Mobile)

On mobile, the primary CTA can optionally be fixed to the bottom of the viewport for maximum conversion:

```css
@media (max-width: 640px) {
  .btn-primary--hero {
    width: 100%;
    justify-content: center;
  }
}
```

---

### 5.2 Trip Form Layout

**Desktop** (>1024px):

```
+-----------------------------------------------------+
|               [Progress Steps: 1 - 2 - 3 - 4]       |
+-----------------------------------------------------+
|  Left (6 col)                |  Right (6 col)        |
|  +-------------------------+ |  +------------------+ |
|  | [City Input Card]       | |  | Preview Card     | |
|  |  Paris  [4 nights]  x   | |  | [2x2 image grid] | |
|  |  Rome   [3 nights]  x   | |  | blur + lock      | |
|  |  + Add city              | |  |                  | |
|  +-------------------------+ |  | [price breakdown] | |
|  +-------------------------+ |  | $5 total          | |
|  | [Month Picker: 6-col]   | |  |                  | |
|  |  Jan Feb Mar Apr May Jun | |  | [Checkout CTA]   | |
|  |  Jul Aug Sep Oct Nov Dec | |  | [security note]  | |
|  +-------------------------+ |  +------------------+ |
|  +-------------------------+ |     (sticky)          |
|  | [Photo Upload Zone]     | |                       |
|  +-------------------------+ |                       |
+-----------------------------------------------------+
```

- Left: form inputs stacked vertically
- Right: `position: sticky; top: 90px;` preview card

**Mobile** (<768px):

```
+------------------------+
| [Progress Steps]       |
+------------------------+
| [City Input Card]      |
+------------------------+
| [Month Picker]         |
+------------------------+
| [Photo Upload]         |
+------------------------+
| [Preview Card]         |
| [Price / CTA]          |
+------------------------+
```

---

### 5.3 Preview Page Layout

**Desktop** (>1024px):

```
+--------------------------------------------------+
| [2x2 Image Grid]           | [Pricing Sidebar]   |
| +--------+ +--------+      | [Price: $5]         |
| | img 1  | | img 2  |      | [Features list]     |
| | visible| | blurred|      | [CTA button]        |
| +--------+ +--------+      | [Guarantee]         |
| +--------+ +--------+      |                     |
| | img 3  | | img 4  |      |                     |
| | blurred| | blurred|      |                     |
| +--------+ +--------+      |                     |
+--------------------------------------------------+
```

**Mobile** (<768px):

```
+------------------------+
| [img 1] [img 2]        |
| [img 3] [img 4]        |
+------------------------+
| [fixed bottom CTA bar] |
+------------------------+
```

---

### 5.4 Result Gallery Layout

**Desktop** (>1024px):

```
+-------------------------------------------------+
|  [Trip Header: City names + date + share btn]   |
+-------------------------------------------------+
|  [3-column image grid]                          |
|  +----------+ +----------+ +----------+        |
|  | Paris 1  | | Paris 2  | | Paris 3  |        |
|  +----------+ +----------+ +----------+        |
|  | Rome 1   | | Rome 2   | | Rome 3   |        |
|  +----------+ +----------+ +----------+        |
+-------------------------------------------------+
|  [Capsule Wardrobe Section]                     |
|  [horizontal scroll card row]                   |
|  +------+ +------+ +------+ +------+ +------+  |
|  | item | | item | | item | | item | | item |  |
|  +------+ +------+ +------+ +------+ +------+  |
+-------------------------------------------------+
|  [Daily Outfit Plan]                            |
+-------------------------------------------------+
```

**Tablet** (768-1023px): 2-column image grid
**Mobile** (<768px): 1-column image grid

```css
.output-demo {
  display: grid;
  gap: 1.2rem;
  margin-top: 3rem;
}

/* Desktop: 4 columns */
@media (min-width: 1024px) {
  .output-demo { grid-template-columns: repeat(4, 1fr); }
}

/* Tablet: 2 columns */
@media (max-width: 1024px) {
  .output-demo { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile: 2 columns (compact) */
@media (max-width: 640px) {
  .output-demo {
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }
}

/* Capsule wardrobe */
.capsule-grid {
  display: grid;
  gap: 1rem;
  margin-top: 3rem;
}

@media (min-width: 1024px) {
  .capsule-grid { grid-template-columns: repeat(5, 1fr); }
}

@media (max-width: 1024px) {
  .capsule-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 640px) {
  .capsule-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }
}
```

---

## 6. Animation Rules

All animations follow the principle of **subtlety and purpose**. Every animation should feel natural and editorial, never flashy or gimmicky.

### Global Motion Preferences

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.1 Scroll-triggered Fade-up

Used on section headings, cards, and content blocks when they enter the viewport.

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

**Parameters:**
- `opacity`: 0 -> 1
- `translateY`: 24px -> 0
- `duration`: 600ms
- `easing`: ease-out
- `stagger`: 100ms between sibling elements
- `threshold`: 10% viewport intersection

**JavaScript (Intersection Observer):**

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('in-view')
        }, index * 100) // stagger
        observer.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.1 }
)

document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
```

### 6.2 Hover Lift

Used on cards, image tiles, and interactive elements.

```css
.hover-lift {
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

**Parameters:**
- `translateY`: 0 -> -4px
- `box-shadow`: base -> enhanced
- `duration`: 300ms
- `easing`: ease-out

### 6.3 CTA Pulse

Subtle attention-drawing pulse on the primary CTA. Used sparingly -- only on the hero CTA.

```css
@keyframes ctaPulse {
  0%   { box-shadow: 0 0 0 0 rgba(196, 97, 58, 0.4); }
  70%  { box-shadow: 0 0 0 12px rgba(196, 97, 58, 0); }
  100% { box-shadow: 0 0 0 0 rgba(196, 97, 58, 0); }
}

.btn-primary--pulse {
  animation: ctaPulse 2000ms ease-out infinite;
}
```

**Parameters:**
- Shadow spread: 0 -> 12px -> 0
- Shadow opacity: 0.4 -> 0
- `duration`: 2000ms
- `timing`: infinite
- `easing`: ease-out

### 6.4 Image Blur Reveal (Post-payment)

When a user completes payment, locked images transition from blurred to clear.

```css
@keyframes blurReveal {
  from { filter: blur(20px); opacity: 0.7; }
  to   { filter: blur(0);    opacity: 1;   }
}

.image-revealed {
  animation: blurReveal 800ms ease-out forwards;
}
```

**Parameters:**
- `filter`: blur(20px) -> blur(0)
- `opacity`: 0.7 -> 1
- `duration`: 800ms
- `easing`: ease-out
- `fill-mode`: forwards

### 6.5 Loading Skeleton (Shimmer)

Used as a placeholder while images or content are loading.

```css
@keyframes shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-sand) 25%,
    var(--color-warm-white) 37%,
    var(--color-sand) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1500ms ease-in-out infinite;
  border-radius: 8px;
}
```

**Parameters:**
- `background`: linear-gradient shimmer sweep
- `duration`: 1500ms
- `timing`: ease-in-out, infinite

### 6.6 Page Transition

Fade-in when navigating between pages.

```css
@keyframes pageEnter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.page-enter {
  animation: pageEnter 400ms ease-out;
}
```

**Parameters:**
- `opacity`: 0 -> 1
- `duration`: 400ms
- `easing`: ease-out

### 6.7 Modal Slide-up

Modals enter from below with a spring-like cubic bezier.

```css
.modal-slide {
  transform: translateY(32px);
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.35s ease;
}

.modal-slide-in {
  transform: translateY(0);
  opacity: 1;
}
```

### 6.8 Spinner (Loading States)

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(196, 97, 58, 0.25);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

### 6.9 Live Indicator Blink

Green dot pulsing indicator for social proof ("X people using now").

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success-alt);
  animation: blink 2.2s ease-in-out infinite;
}
```

---

## 7. Spacing System

Base unit: **4px**. All spacing values are multiples of 4px.

### Spacing Scale

| Token | Value | rem | Common Usage |
|-------|-------|-----|--------------|
| `space-1` | 4px | 0.25rem | Icon gaps, tight internal spacing |
| `space-2` | 8px | 0.5rem | Compact component padding |
| `space-3` | 12px | 0.75rem | Small gaps between related elements |
| `space-4` | 16px | 1rem | Default component padding, form group gaps |
| `space-5` | 20px | 1.25rem | Medium gaps |
| `space-6` | 24px | 1.5rem | Section sub-margins, card padding |
| `space-8` | 32px | 2rem | Container horizontal padding, card group gaps |
| `space-10` | 40px | 2.5rem | Large component spacing |
| `space-12` | 48px | 3rem | Section vertical margins (inner) |
| `space-16` | 64px | 4rem | Major section spacing |
| `space-20` | 80px | 5rem | Section vertical padding (standard) |
| `space-24` | 96px | 6rem | Hero section padding |

### Tailwind Spacing Extension

```typescript
// tailwind.config.ts > theme.extend
spacing: {
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
},
```

### Component Spacing Reference

| Element | Padding / Margin | Value |
|---------|-----------------|-------|
| `.container` horizontal | padding | `0 2rem` (32px) |
| `.container` horizontal (mobile) | padding | `0 1.2rem` (~19px) |
| `section` vertical | padding | `5rem 0` (80px) |
| `section` vertical (mobile) | padding | `3.5rem 0` (56px) |
| Card internal | padding | `2rem` (32px) |
| Card internal (mobile) | padding | `1.2rem` (~19px) |
| Form card gap | margin-bottom | `1.2rem` |
| Grid gap (steps) | gap | `2.5rem` (40px) |
| Output grid gap | gap | `1.2rem` (~19px) |
| Hero left padding (desktop) | padding | `5rem 3rem 5rem 6rem` |
| Header padding | padding | `1.2rem 2.5rem` |

---

## 8. Icon System

### Library

**Lucide React** -- consistent, clean, MIT-licensed icon set.

```bash
npm install lucide-react
```

### Sizes

| Token | Size | Usage |
|-------|------|-------|
| `icon-sm` | 16px | Inline text, labels, badges |
| `icon-md` | 20px | Default UI icons, buttons, nav |
| `icon-lg` | 24px | Section headers, empty states |

### Icon Color Rules

- Icons inherit `currentColor` by default
- Primary action icons: `var(--color-primary)` (#C4613A)
- Muted / secondary icons: `var(--color-muted)` (#8A7B6E)
- On dark backgrounds: `rgba(255, 255, 255, 0.6)` or white
- Success: `var(--color-success)` (#2D7D52)
- Error: `var(--color-error)` (#D64545)

### Icon Catalog (Primary Usage)

| Icon | Lucide Name | Context |
|------|-------------|---------|
| Search / City Lookup | `Search` | City autocomplete input |
| Calendar | `Calendar` | Month picker label |
| Upload | `Upload` | Photo upload zone |
| Camera | `Camera` | Photo upload alternative |
| X / Close | `X` | Remove city, close modal, dismiss toast |
| Check | `Check` | Completed step, success state |
| ChevronDown | `ChevronDown` | Dropdown indicators |
| ChevronRight | `ChevronRight` | Navigation, CTA arrow |
| Lock | `Lock` | Locked/blurred image overlay |
| Unlock | `Unlock` | Post-payment reveal |
| Share2 | `Share2` | Share gallery link |
| Copy | `Copy` | Copy link to clipboard |
| Mail | `Mail` | Email receipt / newsletter |
| Globe | `Globe` | Language switcher |
| Plane | `Plane` | Travel context, header icon |
| MapPin | `MapPin` | City input, destination marker |
| Thermometer | `Thermometer` | Climate data display |
| Sun / Cloud / CloudRain | `Sun`, `Cloud`, `CloudRain` | Weather badges |
| Loader2 | `Loader2` | Spinning loader (animated) |
| AlertCircle | `AlertCircle` | Error state, validation |
| CheckCircle2 | `CheckCircle2` | Success state |
| Info | `Info` | Tooltip, info badge |
| CreditCard | `CreditCard` | Payment context |
| Shield | `Shield` | Security / privacy badge |
| Eye | `Eye` | Preview step |

### Usage Example

```tsx
import { MapPin, Calendar, Upload, Check, X } from 'lucide-react'

// Default size (20px)
<MapPin size={20} className="text-primary" />

// Small inline (16px)
<Check size={16} className="text-success" />

// Large header (24px)
<Calendar size={24} className="text-muted" />
```

---

## 9. Responsive Image Strategy

### Aspect Ratio

All AI-generated outfit images use a **3:4 portrait ratio** (vertical), consistent with fashion editorial and lookbook standards.

```css
.outfit-image {
  aspect-ratio: 3 / 4;
  width: 100%;
  object-fit: cover;
}
```

### Format

- **Primary format**: WebP (required)
- **Fallback**: JPEG (for older browsers)
- **Quality**: 80 for display images, 60 for thumbnails

```html
<picture>
  <source srcset="/outfit-paris-1.webp" type="image/webp" />
  <img
    src="/outfit-paris-1.jpg"
    alt="Paris spring outfit: linen blazer and wide-leg trousers"
    loading="lazy"
    decoding="async"
    width="600"
    height="800"
  />
</picture>
```

### Lazy Loading

All images below the fold use native lazy loading:

```html
<img
  src="outfit.webp"
  alt="descriptive text"
  loading="lazy"
  decoding="async"
/>
```

Hero images use `loading="eager"` for immediate display:

```html
<img
  src="hero-card.webp"
  alt="Travel outfit preview"
  loading="eager"
  decoding="async"
/>
```

### Blur Placeholder (LQIP)

For progressive loading, use a low-quality blurred placeholder:

```css
/* Blur placeholder pattern */
.image-container {
  position: relative;
  overflow: hidden;
  background: var(--color-sand);
}

.image-placeholder {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  transform: scale(1.1); /* prevent blur edge artifacts */
  transition: opacity 0.4s ease-out;
}

.image-loaded .image-placeholder {
  opacity: 0;
}
```

### Responsive Image Sizes

| Context | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Hero card (main) | 230px width | -- | -- |
| Hero card (secondary) | 200px width | -- | -- |
| Hero strip card | -- | 160px | 120-140px |
| Output grid card | 25% container | 50% container | 50% container |
| Gallery image | 33% container | 50% container | 100% container |
| Preview thumb | ~190px | ~190px | 50% container |

### Image Optimization Pipeline

1. **Generation**: NanoBanana API outputs 1024x1368 PNG (3:4)
2. **Processing**: Convert to WebP at 80% quality via Cloudflare Workers
3. **Storage**: Upload to Cloudflare R2
4. **Delivery**: Serve via R2 public URL (CDN)
5. **Client-side**: Display with `aspect-ratio: 3/4`, `object-fit: cover`, `loading: lazy`

### srcset for Responsive Density

```html
<img
  srcset="
    /outfit-paris-1-400w.webp 400w,
    /outfit-paris-1-600w.webp 600w,
    /outfit-paris-1-800w.webp 800w
  "
  sizes="
    (max-width: 640px) 50vw,
    (max-width: 1024px) 33vw,
    25vw
  "
  src="/outfit-paris-1-600w.webp"
  alt="Paris spring outfit"
  loading="lazy"
  decoding="async"
/>
```

---

## Appendix: Full CSS Variable Reference

```css
:root {
  /* Colors */
  --color-primary: #C4613A;
  --color-primary-hover: #B3582F;
  --color-ink: #1A1410;
  --color-sand: #F5EFE6;
  --color-cream: #FDF8F3;
  --color-gold: #C8A96E;
  --color-muted: #8A7B6E;
  --color-white: #FFFFFF;
  --color-warm-white: #FAF6F0;
  --color-error: #D64545;
  --color-success: #2D7D52;
  --color-success-alt: #5B8C5A;
  --color-border: rgba(26, 20, 16, 0.12);

  /* Typography */
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Shadows */
  --shadow-primary: 0 4px 20px rgba(196, 97, 58, 0.35);
  --shadow-primary-hover: 0 8px 30px rgba(196, 97, 58, 0.45);
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.3);

  /* Overlay */
  --overlay-backdrop: rgba(26, 20, 16, 0.8);
  --overlay-blur: blur(8px);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 50px;
  --radius-circle: 50%;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease-out;
  --transition-reveal: 600ms ease-out;
  --transition-spring: 350ms cubic-bezier(0.22, 1, 0.36, 1);

  /* Z-index Scale */
  --z-base: 0;
  --z-card: 1;
  --z-sticky: 10;
  --z-header: 100;
  --z-dropdown: 50;
  --z-modal: 1000;
  --z-toast: 2000;
}
```

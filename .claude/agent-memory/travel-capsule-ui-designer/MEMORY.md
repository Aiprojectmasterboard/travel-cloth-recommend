# Travel Capsule UI Designer — Agent Memory

## Project Architecture
- Web app: `/home/user/travel-cloth-recom/apps/web/`
- Components: `/home/user/travel-cloth-recom/apps/web/components/` (co-located with app/, not in a separate dir)
- Global CSS: `/home/user/travel-cloth-recom/apps/web/app/globals.css`
- Layout: `/home/user/travel-cloth-recom/apps/web/app/layout.tsx`
- Main page: `/home/user/travel-cloth-recom/apps/web/app/page.tsx`

## CSS Approach
- This project uses **CSS classes in globals.css** (not Tailwind utility classes for most styles)
- `styled-jsx` (`<style jsx>`) is used in components for component-scoped styles
- Design tokens are CSS custom properties in `:root` (--sand, --ink, --terracotta, --muted, --cream, --warm-white, --border, --gold)
- Tailwind utilities can be used but the main styling pattern is globals.css classes

## Section IDs (for smooth scroll nav)
- How It Works: `id="howSection"`
- Form / Trip input: `id="formSection"`
- Sample Output: `id="sampleSection"`
- FAQ: `id="faqSection"`

## Component Patterns
- All interactive components use `'use client'` directive
- Scroll reveal: CSS class `.reveal` + JS IntersectionObserver in `page.tsx` adds `.in-view`
- Toast system: `onToast(msg: string)` callback prop passed from `page.tsx`
- Checkout trigger: `onCheckout(cities, month)` callback from FormSection → page.tsx → CheckoutModal or Polar redirect

## Responsive Breakpoints (in globals.css)
- Desktop (default): grid layouts, full mosaic hero
- Tablet ≤1024px: hero 1-col, steps 2-col, form-grid 1-col, capsule-grid 4-col
- Mobile ≤640px: hero-right hidden, hero 1-col, steps 1-col, capsule 2-col, font clamp
- Small mobile ≤480px: further padding reduction

## Key Design Decisions Made
- Hero mosaic replaced with staggered 3-card editorial grid (desktop) + horizontal swipe strip (tablet/mobile ≤1024px)
  - `.hero-right` (desktop grid) hidden at ≤1024px; `.hero-strip` shown instead (overflow-x: auto, scrollbar hidden)
  - Weather badges: `rgba(255,255,255,0.92)` pill with backdrop-filter on each card
- h1 uses `clamp(2.2rem, 10vw, 2.8rem)` on mobile, `clamp(2.8rem, 5vw, 5rem)` desktop
- Hero trust row uses `.trust-divider` (1px vertical line) between items; dividers hidden on mobile
- Capsule grid: 5-col desktop, 4-col tablet, 2-col mobile
- HowItWorks: 4-step card grid (desktop 4-col, tablet 2-col, mobile 1-col timeline)
  - Mobile timeline: vertical dashed line via `.how-steps::before`, terracotta `.step-connector` dots per card
  - Each step card has icon mini-teaser visuals (inline JSX) above the text body
  - Uses `:global()` in styled-jsx for cross-component class targeting
  - `stepMeta` array holds accentColor + visual JSX — `style={{ background: meta.accentColor } as React.CSSProperties}` pattern for dynamic colors
- FormSection CityInput is a sub-component with its own `styled-jsx` for dropdown styles
- Header uses `styled-jsx` for all styles (not globals.css) — hamburger menu via useState
- globals.css patch pattern: append new CSS blocks after existing breakpoints, never overwrite existing rules
- iOS zoom prevention: `font-size: 16px` on all mobile inputs (city-input, days-input, number inputs)
- btn-primary: uses `box-shadow: 0 4px 20px rgba(196,97,58,0.35)` + `translateY(-2px)` on hover
- checkout-btn: linear-gradient(135deg) terracotta upgrade

## Page Section Order (page.tsx)
Header → HeroSection → SocialProof → HowItWorksSection → PhotoComparison → PreviewExplainer → FormSection → SampleOutputSection → CapsuleSection → PricingSection → FaqSection → PartnerSection → Footer

## Accordion Pattern (FaqSection)
- `useState<number>(0)` for openIdx — first item open by default, -1 = all closed
- Toggle: `setOpenIdx(prev => prev === i ? -1 : i)` (single-expand)
- Animation: `max-height: 0` → `max-height: 600px` via CSS transition (0.32s ease) on `.faq-a-wrap`
- Open class `.faq-item-acc.open` applied to wrapper div
- Touch target: `min-height: 44px` on button, `padding: 1.1rem 0.5rem`
- Accessibility: `aria-expanded`, `aria-controls`, `aria-labelledby`, `role="region"` on answer panel
- `+` / `−` icon in `.faq-icon` (terracotta color, 1.3rem)
- `focus-visible` outline: `2px solid var(--terracotta)` with `border-radius: 4px`

## Two-Column Comparison Card Pattern
- Used in `PhotoComparison` and `PreviewExplainer`
- Grid: `grid-template-columns: 1fr 1fr` desktop, `1fr` mobile
- Featured/recommended card: `border-color: var(--terracotta)`, `box-shadow: 0 4px 24px rgba(196,97,58,0.12)`
- On mobile, featured card moved first via `order: -1`
- Badge pills: `font-size: 0.65rem`, `letter-spacing: 0.1em`, `text-transform: uppercase`, `border-radius: 50px`
- Primary badge: `background: rgba(196,97,58,0.1)`, `color: var(--terracotta)`
- Secondary badge: `background: rgba(26,20,16,0.06)`, `color: var(--muted)`
- Hover lift: `translateY(-2px)` + `box-shadow` increase (0.3s ease)

## PreviewExplainer Arrow Pattern
- Desktop: `→` arrow between two columns (`grid-template-columns: 1fr auto 1fr`)
- Mobile: arrow rotated 90deg via `transform: rotate(90deg)` when grid collapses to 1-col

## Build Command
`cd /home/user/travel-cloth-recom/apps/web && npx next build`
Build is confirmed clean (no TypeScript errors, no lint errors) after all UI changes.

## Fonts
- Playfair Display: loaded via next/font, variable `--font-playfair`, class `font-serif`
- DM Sans: loaded via next/font, variable `--font-dm-sans`, class `font-sans`
- Both added as class variables on `<html>` in layout.tsx

## code.html (Standalone Landing Page)
- Located at `/home/user/travel-cloth-recom/code.html` — pure HTML/CSS/JS, no build step
- Uses Tailwind CDN + custom CSS in `<style>` block (NOT globals.css)
- DM Sans replaces Plus Jakarta Sans as body font in code.html
- Color tokens: `--terracotta:#C4613A`, `--ink:#1A1410`, `--sand:#F5EFE6`, `--cream:#FDF8F3`, `--gold:#C8A96E`, `--muted:#8A7B6E`
- Material Symbols filled stars: class `.star-filled` with `font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- Material Symbols filled icons: class `.icon-filled` with `font-variation-settings: 'FILL' 1, 'wght' 300`
- Scroll reveal: `.reveal` opacity:0, `.reveal.visible` triggers `fadeInUp` animation via IntersectionObserver
- Announcement bar: `#announcement-bar` dismissible with animated collapse (max-height 0 + opacity 0)
- Hero: `hero-gradient` class with animated gradient + `grain` overlay pseudo-element
- Hero card: `.hero-img-card` aspect-ratio 3/4, frosted glass `.hero-overlay-card` at bottom
- Stats bar uses `.stats-bar` dark ink bg with `.stat-number` in Playfair Display + gold color
- Testimonial: `.testimonial-quote-mark` decorative large `&ldquo;` behind quote text
- CTA: radial gradient glows via `::before` (terracotta top-right) and `::after` (gold bottom-left)
- Mobile menu: `#mobile-menu` toggles `.open` class, closes on outside click
- Dashed step connector: `.steps-grid::before` with `repeating-linear-gradient` in gold
- Feature card border glow on hover: CSS `-webkit-mask` / `mask-composite: exclude` technique
- Price anchor displayed in CTA: struck-through "$200+" vs large gold "$5" in Playfair Display

## Landing Page (app/page.tsx) Mobile Patterns
- Hero h1: `text-4xl sm:text-6xl md:text-7xl lg:text-8xl` — starts at 4xl to prevent 320px overflow
- Header right group gap: `gap-2 sm:gap-4` — tighter on mobile
- LanguageSwitcher + AuthButton: always visible (no `hidden sm:block` wrapper)
- Nav CTA button: `hidden sm:inline-flex` — hidden on mobile (hero section CTA is enough)
- Hamburger button: `flex md:hidden` — toggles `mobileMenuOpen` useState
- Mobile drawer: `fixed top-[65px] left-0 right-0 z-50 bg-cream` + `fixed inset-0 z-40` backdrop overlay
  - Backdrop: `bg-secondary/40`, closes on click, `aria-hidden="true"`
  - Drawer links: `border-b border-sand last:border-0`, close drawer `onClick`
  - Drawer CTA: full-width `bg-primary` button, `mt-3`
- Blueprint masonry grid: `h-[280px] sm:h-[400px] md:h-[520px] lg:h-[600px]`
- Section 2 floating weather card: `top-4 right-2 md:top-8 md:-right-6` (no negative right on mobile)
- Section 2 image wrapper: `pb-16 md:pb-10` to absorb polaroid overflow
- Section 2 polaroids: `bottom-0` / `bottom-2` on mobile (not negative), negative only on `md:`
- Section 4 flat-lay wrapper: `pb-20 md:pb-0` to absorb floating card overflow
- Section 4 activity card: `-bottom-4 left-0 md:-bottom-8 md:-left-6` (no negative left on mobile)
- Footer legal links: `/legal/privacy` and `/legal/terms` (not `/`)

## Checklist Page (`/checklist/[tripId]`)
- Files: `apps/web/app/checklist/[tripId]/page.tsx` (server, edge runtime) + `ChecklistClient.tsx` (client)
- Layout: `flex h-screen overflow-hidden pt-20` — left `lg:w-3/5` scrollable + right `lg:w-2/5` sidebar (hidden on mobile)
- Primary color in checklist: `#b8552e` (not `#C4613A`) — matches `--primary` in globals.css
- `buildChecklist(trip)` derives ChecklistItem[] from capsule_items + weather + personal basics
- Weight by category: Outerwear 1.0, Tops/Essential 0.3, Bottoms 0.5, Evening 0.4, Footwear 0.7, Accessory 0.2
- Weather Essentials: umbrella if precip ≥ 30%, knit layer if cold/mild, sunscreen if warm/hot
- Basic items: undergarments × totalDays (0.08kg each), toiletries 0.5kg, adapter 0.15kg, charger 0.15kg, passport 0.1kg
- Checkbox state: `useState<Set<string>>` persisted to `localStorage` key `checklist-${tripId}`
- Progress: packedCount/totalItems → progressPct; packedWeight/totalWeight displayed
- `ChecklistRow` sub-component: label wraps thumbnail + name + checkbox; `compact` prop for Personal Basics (no thumbnail)
- Sidebar: Weather Alert card + Bag Preview suitcase diagram + Pro Tip + CTA button
- CTA: if progressPct < 100 → "Mark All Packed" (dark bg); if 100% → "I'm All Packed" + flight_takeoff → `/result/${tripId}`
- Mobile bottom bar: `lg:hidden fixed bottom-0` — shows weight + progress% + CTA
- Skeleton: `animate-pulse bg-[#E8DDD2]` rows matching content shape, aria-busy="true"
- DEMO_TRIP: Paris Oct, 60% rain, mild, 8 capsule items — used when no WORKER_URL or fetch fails
- ResultClient.tsx CTA changed from `<button onClick={openShare}>` to `<a href="/checklist/${tripId}">` with checklist icon

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

## Build Command
`cd /home/user/travel-cloth-recom/apps/web && npx next build`
Build is confirmed clean (no TypeScript errors, no lint errors) after all UI changes.

## Fonts
- Playfair Display: loaded via next/font, variable `--font-playfair`, class `font-serif`
- DM Sans: loaded via next/font, variable `--font-dm-sans`, class `font-sans`
- Both added as class variables on `<html>` in layout.tsx

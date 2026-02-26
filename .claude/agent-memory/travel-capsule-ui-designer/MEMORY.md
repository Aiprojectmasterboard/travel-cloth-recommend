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
- Hero mosaic (`.hero-right`) hidden on mobile ≤640px via `display: none` in CSS
- h1 uses `clamp(2.2rem, 10vw, 2.8rem)` on mobile, `clamp(2.8rem, 5vw, 5rem)` desktop
- Capsule grid changed from 6-col to 5-col desktop (fits 10 items in 2 rows of 5)
- FormSection CityInput is a sub-component with its own `styled-jsx` for dropdown styles
- Header uses `styled-jsx` for all styles (not globals.css) — hamburger menu via useState

## Build Command
`cd /home/user/travel-cloth-recom/apps/web && npx next build`
Build is confirmed clean (no TypeScript errors, no lint errors) after all UI changes.

## Fonts
- Playfair Display: loaded via next/font, variable `--font-playfair`, class `font-serif`
- DM Sans: loaded via next/font, variable `--font-dm-sans`, class `font-sans`
- Both added as class variables on `<html>` in layout.tsx

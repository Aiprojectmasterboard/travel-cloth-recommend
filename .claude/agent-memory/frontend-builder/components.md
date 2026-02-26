# Components Inventory

## Existing components (pre-session)
- `Header.tsx` — fixed top nav, hamburger mobile menu, uses `useLanguage()`, `LanguageSwitcher`
- `HeroSection.tsx` — hero, props: `{ onScrollToForm, onScrollToSample }`
- `HowItWorksSection.tsx` — how it works steps
- `FormSection.tsx` — main booking form, props: `{ onCheckout, onToast }`
- `SampleOutputSection.tsx` — sample AI output gallery
- `CapsuleSection.tsx` — capsule wardrobe display
- `PricingSection.tsx` — pricing, props: `{ onCheckout }`
- `FaqSection.tsx` — FAQ accordion
- `PartnerSection.tsx` — partnership section
- `Footer.tsx` — site footer
- `CheckoutModal.tsx` — checkout modal, props: `{ isOpen, onClose, onToast }`
- `Toast.tsx` — toast notification, props: `{ message, visible }`
- `LanguageSwitcher.tsx` — language switcher, props: `{ variant?: 'dropdown' | 'inline' }`
- `LanguageContext.tsx` — provides `LanguageProvider` and `useLanguage()` hook

## Components added this session

### `LanguageSwitcher.tsx` (updated)
Props: `{ variant?: 'dropdown' | 'inline' }` (default: 'dropdown')
- `variant='dropdown'`: original pill button + dropdown list (used in desktop Header)
- `variant='inline'`: horizontal row of flag+code buttons with flex-wrap (used in mobile menu)
  - Active button style: terracotta border + background + font-weight 600
  - Short codes: KO, EN, JA, ZH, FR, ES

### `ProgressSteps.tsx` (new)
Props: `{ currentStep: 1 | 2 | 3 | 4 }`
- 4-step progress indicator for the form flow
- Step states: 'completed' (terracotta bg + checkmark), 'current' (gold bg + glow), 'upcoming' (border bg)
- Desktop: circle + label below; Mobile (≤480px): circle only (labels hidden, aria-label for SR)
- Connector lines between steps: terracotta if completed segment, var(--border) if pending
- Usage: import and render above FormSection content with currentStep prop

### `SocialProof.tsx` (new)
Props: none (reads locale from `useLanguage()`)
- Stats band (var(--sand) bg, border top/bottom): 4 stats in 4-col grid → 2×2 on mobile
- Reviews section (white bg): 3 review cards in 3-col grid → 2-col tablet → 1-col mobile
- Review cards: border-radius 12px, box-shadow 0 2px 12px rgba(0,0,0,0.06)
- Localization: `{ ko: string; en: string }` objects, resolves ko for 'ko' locale, en for all others
- Inserted in `page.tsx` between `<HeroSection>` and `<HowItWorksSection>`

## page.tsx component order
1. Header
2. HeroSection
3. **SocialProof** (added this session)
4. HowItWorksSection
5. FormSection
6. SampleOutputSection
7. CapsuleSection
8. PricingSection
9. FaqSection
10. PartnerSection
11. Footer

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AuthButton from '@/components/AuthButton'
import { useAuth } from '@/components/AuthProvider'

// ─── Image URLs (Unsplash — Figma Make design reference) ──────────────────────

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1533026795897-5bb93fa969d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
  clothingRack: 'https://images.unsplash.com/photo-1655252205431-5d0ef316837b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  earthTone: 'https://images.unsplash.com/photo-1764697907661-322b4e1b51a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  streetwear: 'https://images.unsplash.com/photo-1635650804263-1a1941e14df5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  resort: 'https://images.unsplash.com/photo-1722340319384-e3a9f24dff09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
}

// ─── Pricing plan data ────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$5',
    period: 'one-time',
    badge: null,
    featured: false,
    features: [
      '1 city, 4 outfit images',
      'Capsule wardrobe list (8–12 items)',
      'Day-by-day outfit plan',
      'Shareable gallery link',
      'Photo deleted after generation',
    ],
    cta: 'Get Started',
    href: '/trip',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: 'one-time',
    badge: 'Most Popular',
    featured: true,
    features: [
      'Up to 5 cities, 4–6 images each',
      'High-res outfit generation',
      '1 free regeneration per city',
      'Everything in Standard',
      'Priority generation queue',
    ],
    cta: 'Start with Pro',
    href: '/trip',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$29',
    period: 'per year',
    badge: 'Save $115/yr',
    featured: false,
    features: [
      'All Pro features included',
      'Up to 12 trips per year',
      'Early access to new features',
      'Member-only city guides',
      'Dedicated support channel',
    ],
    cta: 'Join Annual',
    href: '/trip',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const ctaHref = '/trip'

  // Hero font size — CJK locales need slightly smaller clamp
  const heroFontSize =
    locale === 'ko' || locale === 'ja' || locale === 'zh'
      ? 'clamp(40px, 6vw, 80px)'
      : 'clamp(48px, 7vw, 96px)'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="font-sans antialiased text-secondary bg-cream">

      {/* ─── HEADER ──────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full bg-cream/95 backdrop-blur-sm border-b border-sand transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 no-underline"
            aria-label="Travel Capsule AI home"
          >
            <span
              className="material-symbols-outlined text-primary text-2xl select-none"
              aria-hidden="true"
            >
              luggage
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase font-playfair text-secondary">
              Travel Capsule
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <a
              href="#intelligence"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.philosophy}
            </a>
            <a
              href="#capsules"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.curations}
            </a>
            <a
              href="#pricing"
              className="text-xs font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors"
            >
              {t.nav.membership}
            </a>
          </nav>

          {/* Right group */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 min-w-0">
            <LanguageSwitcher variant="dropdown" />
            <AuthButton />
            <Link
              href={ctaHref}
              className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-cream text-xs font-bold tracking-widest uppercase py-3 px-5 transition-all"
              aria-label={t.nav.cta}
            >
              {t.nav.cta}
            </Link>
            {/* Hamburger */}
            <button
              className="flex md:hidden items-center justify-center w-9 h-9 text-secondary"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-secondary/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="fixed top-[65px] left-0 right-0 z-50 bg-cream border-b border-sand shadow-xl md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {[
                { label: t.nav.philosophy, href: '#intelligence' },
                { label: t.nav.curations, href: '#capsules' },
                { label: t.nav.membership, href: '#pricing' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="block py-3 text-sm font-medium tracking-widest uppercase text-secondary/70 hover:text-primary transition-colors border-b border-sand last:border-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link
                href={ctaHref}
                className="mt-3 flex items-center justify-center bg-primary text-cream text-sm font-bold tracking-widest uppercase py-3.5 px-6 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.cta}
              </Link>
            </div>
          </nav>
        </>
      )}

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col grain-overlay overflow-hidden"
        aria-label="Hero"
      >
        {/* Full-screen background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES.hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover brightness-[0.60]"
          fetchPriority="high"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(26,20,16,0.4) 0%, transparent 40%, rgba(26,20,16,0.6) 100%)',
            zIndex: 1,
          }}
          aria-hidden="true"
        />

        {/* Centered content */}
        <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-28" style={{ zIndex: 2 }}>

          {/* Animated pill badge */}
          <div className="mb-8 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 border border-cream/30 text-cream/90 text-[10px] font-semibold tracking-[0.2em] uppercase px-5 py-2 backdrop-blur-sm bg-secondary/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              ALGORITHM ACTIVE
            </span>
          </div>

          {/* Heading */}
          <h1
            className="font-playfair font-bold text-cream leading-tight mb-4"
            style={{ fontSize: heroFontSize }}
          >
            {t.hero.heading1}
            <br />
            <em className="italic text-cream/90">{t.hero.heading2}</em>
          </h1>

          {/* Divider line */}
          <div className="w-16 h-0.5 bg-primary mb-6" aria-hidden="true" />

          {/* Subtitle */}
          <p className="text-cream/75 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed font-light">
            {t.hero.sub}
          </p>

          {/* CTA */}
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-cream text-sm font-bold tracking-widest uppercase py-4 px-8 sm:px-12 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Curate My Capsule &rarr;
          </Link>

          {/* Trust line */}
          <p className="mt-6 text-cream/40 text-[11px] tracking-widest uppercase">
            From $5 &middot; No subscription &middot; Results in 2–4 min
          </p>
        </div>

        {/* Bottom editorial bar */}
        <div className="relative border-t border-cream/15 py-4 px-6" style={{ zIndex: 2 }}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-10 text-cream/45 text-[10px] sm:text-xs tracking-widest uppercase">
            <span>{t.hero.estLabel}</span>
            <span className="w-px h-3 bg-cream/25" aria-hidden="true" />
            <span>{t.hero.scrollLabel}</span>
            <span className="w-px h-3 bg-cream/25" aria-hidden="true" />
            <span>{t.hero.editionLabel}</span>
          </div>
        </div>
      </section>

      {/* ─── INTELLIGENCE SECTION ─────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 bg-cream"
        id="intelligence"
        aria-label="Fashion meets forecast"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — editorial text */}
          <div className="flex flex-col gap-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              INTELLIGENCE LAYER
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
              Fashion Meets
              <br />
              <em className="italic">Forecast.</em>
            </h2>
            <p className="text-secondary/70 leading-relaxed max-w-md">
              Our AI cross-references real-time climate data, local cultural vibes, and seasonal style trends to curate a capsule wardrobe that works every day of your trip — not just on paper.
            </p>

            {/* Stats row */}
            <div className="flex gap-10 pt-2">
              <div>
                <p className="font-playfair text-4xl font-bold text-secondary">12+</p>
                <p className="text-xs uppercase tracking-widest text-secondary/50 mt-1">Cities Supported</p>
              </div>
              <div className="w-px bg-sand" aria-hidden="true" />
              <div>
                <p className="font-playfair text-4xl font-bold text-secondary">100%</p>
                <p className="text-xs uppercase tracking-widest text-secondary/50 mt-1">Weather-Accurate</p>
              </div>
            </div>

            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-primary text-sm font-bold tracking-widest uppercase border-b border-primary/40 hover:border-primary pb-0.5 self-start transition-colors mt-2"
            >
              Start Planning &rarr;
            </Link>
          </div>

          {/* Right — clothing rack image with floating badge */}
          <div className="relative">
            <div className="relative overflow-hidden aspect-[4/5] bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.clothingRack}
                alt="AI-curated clothing selection on a rack"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm shadow-xl px-5 py-3 border-l-2 border-primary">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-primary mb-0.5">
                AI Curated
              </p>
              <p className="text-secondary text-sm font-bold">AI-curated selections</p>
              <p className="text-secondary/50 text-xs mt-0.5">Weather &bull; Vibe &bull; Season</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── CAPSULES IN MOTION ───────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 bg-sand"
        id="capsules"
        aria-label="Capsules in Motion"
      >
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                LIVE CAPSULES
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
                Capsules in Motion
              </h2>
            </div>
            <p className="text-secondary/55 text-sm leading-relaxed md:max-w-xs md:text-right">
              Each capsule adapts to the city&rsquo;s energy — from Tokyo&rsquo;s precision to Bali&rsquo;s ease.
            </p>
          </div>

          {/* 3-column card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Card 1 — Mediterranean Drift */}
            <div className="relative aspect-[3/4] overflow-hidden group cursor-default bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.earthTone}
                alt="Earth tone Mediterranean capsule wardrobe"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(26,20,16,0.85) 0%, transparent 55%)',
                }}
                aria-hidden="true"
              />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-cream/70 border border-cream/30 px-3 py-1 mb-3">
                  Warm &amp; Earthy
                </span>
                <p className="font-playfair text-xl font-bold text-cream italic">
                  Mediterranean Drift
                </p>
                <p className="text-cream/55 text-xs mt-1">Paris &bull; Rome &bull; Barcelona</p>
              </div>
            </div>

            {/* Card 2 — Tokyo After Dark */}
            <div className="relative aspect-[3/4] overflow-hidden group cursor-default bg-secondary sm:mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.streetwear}
                alt="Urban edge streetwear capsule wardrobe"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(26,20,16,0.85) 0%, transparent 55%)',
                }}
                aria-hidden="true"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-cream/70 border border-cream/30 px-3 py-1 mb-3">
                  Urban Edge
                </span>
                <p className="font-playfair text-xl font-bold text-cream italic">
                  Tokyo After Dark
                </p>
                <p className="text-cream/55 text-xs mt-1">Tokyo &bull; Seoul &bull; Singapore</p>
              </div>
            </div>

            {/* Card 3 — Island Transition */}
            <div className="relative aspect-[3/4] overflow-hidden group cursor-default bg-secondary sm:col-span-2 lg:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.resort}
                alt="Relaxed luxe resort capsule wardrobe"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(26,20,16,0.85) 0%, transparent 55%)',
                }}
                aria-hidden="true"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-cream/70 border border-cream/30 px-3 py-1 mb-3">
                  Relaxed Luxe
                </span>
                <p className="font-playfair text-xl font-bold text-cream italic">
                  Island Transition
                </p>
                <p className="text-cream/55 text-xs mt-1">Bali &bull; Maldives &bull; Phuket</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── EXAMPLES SECTION ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-cream" aria-label="Plan examples">
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
              PLAN EXAMPLES
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
              See What&rsquo;s Inside
            </h2>
          </div>

          {/* 2-column examples grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Pro example */}
            <div className="relative overflow-hidden group aspect-[4/3] bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.earthTone}
                alt="Multi-city Pro plan example"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(26,20,16,0.90) 0%, transparent 60%)',
                }}
                aria-hidden="true"
              />
              <div className="absolute top-5 left-5">
                <span className="inline-block bg-primary text-cream text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Pro
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-playfair text-2xl font-bold text-cream italic mb-1">
                  Multi-City Style Guide
                </p>
                <p className="text-cream/60 text-sm">Up to 5 cities &bull; 4–6 images each &bull; $12</p>
              </div>
            </div>

            {/* Annual example */}
            <div className="relative overflow-hidden group aspect-[4/3] bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.streetwear}
                alt="Annual member dashboard example"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(26,20,16,0.90) 0%, transparent 60%)',
                }}
                aria-hidden="true"
              />
              <div className="absolute top-5 left-5">
                <span className="inline-block bg-gold text-secondary text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Annual
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-playfair text-2xl font-bold text-cream italic mb-1">
                  Annual Member Dashboard
                </p>
                <p className="text-cream/60 text-sm">12 trips/year &bull; All Pro features &bull; $29/yr</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── DARK CTA SECTION ────────────────────────────────────────────────── */}
      <section
        className="relative py-28 px-6 bg-secondary overflow-hidden grain-overlay"
        aria-label="Call to action"
      >
        <div className="relative max-w-2xl mx-auto text-center" style={{ zIndex: 2 }}>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-6">
            YOUR STYLE AWAITS
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl md:text-6xl font-bold text-cream leading-tight mb-6">
            {t.cta.heading1}
            <br />
            <em className="italic">{t.cta.heading2}</em>
          </h2>
          <p className="text-cream/65 text-base md:text-lg mb-10 leading-relaxed max-w-lg mx-auto">
            {t.cta.sub}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-cream text-sm font-bold tracking-widest uppercase py-4 px-8 sm:px-14 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto"
            >
              {t.cta.button}
            </Link>
            <p className="text-cream/35 text-xs tracking-widest uppercase">{t.cta.note}</p>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 bg-cream"
        id="pricing"
        aria-label="Pricing plans"
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
              {t.pricing.label}
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-secondary leading-tight">
              Simple, Honest Pricing
            </h2>
            <p className="text-secondary/60 mt-4 text-base max-w-md mx-auto leading-relaxed">
              No subscriptions by default. Pay once, get your capsule wardrobe.
            </p>
          </div>

          {/* 3-column pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 border transition-all ${
                  plan.featured
                    ? 'bg-primary border-primary text-cream shadow-2xl scale-105'
                    : 'bg-white border-sand text-secondary hover:border-secondary/20 hover:shadow-lg'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 ${
                      plan.featured ? 'bg-secondary text-cream' : 'bg-gold text-secondary'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                {/* Plan name */}
                <p
                  className={`text-xs font-bold tracking-widest uppercase mb-4 ${
                    plan.featured ? 'text-cream/70' : 'text-secondary/50'
                  }`}
                >
                  {plan.name}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`font-playfair text-5xl font-bold ${plan.featured ? 'text-cream' : 'text-secondary'}`}>
                    {plan.price}
                  </span>
                </div>
                <p className={`text-xs tracking-widest uppercase mb-6 ${plan.featured ? 'text-cream/60' : 'text-secondary/45'}`}>
                  {plan.period}
                </p>

                {/* Features */}
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 text-xs font-bold shrink-0 ${plan.featured ? 'text-cream' : 'text-primary'}`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span className={plan.featured ? 'text-cream/85' : 'text-secondary/70'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Link
                  href={plan.href}
                  className={`flex items-center justify-center text-sm font-bold tracking-widest uppercase py-3.5 px-6 transition-all ${
                    plan.featured
                      ? 'bg-cream text-primary hover:bg-cream/90'
                      : 'border border-secondary text-secondary hover:bg-secondary hover:text-cream'
                  }`}
                >
                  {plan.cta}
                </Link>

              </div>
            ))}
          </div>

          {/* Guarantee line */}
          <p className="text-center text-secondary/40 text-xs mt-10 tracking-wide">
            {t.pricing.guarantee}
          </p>

        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-sand" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start justify-between gap-8">

          {/* Left — logo + tagline */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline"
              aria-label="Travel Capsule AI home"
            >
              <span
                className="material-symbols-outlined text-primary text-xl select-none"
                aria-hidden="true"
              >
                luggage
              </span>
              <span className="text-sm font-bold tracking-widest uppercase font-playfair text-secondary">
                Travel Capsule
              </span>
            </Link>
            <p className="text-secondary/50 text-xs leading-relaxed">{t.footer.tagline}</p>
          </div>

          {/* Right — nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer navigation">
            {[
              { label: t.footer.journal, href: '/' },
              { label: t.footer.methodology, href: '/' },
              { label: t.footer.pricing, href: '#pricing' },
              { label: t.footer.login, href: '/auth/login' },
              { label: t.footer.instagram, href: '/' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-medium tracking-widest uppercase text-secondary/50 hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-sand">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-secondary/40">{t.footer.copyright}</p>
            <div className="flex items-center gap-6">
              <Link href="/legal/privacy" className="text-xs text-secondary/40 hover:text-primary transition-colors">
                {t.footer.privacy}
              </Link>
              <Link href="/legal/terms" className="text-xs text-secondary/40 hover:text-primary transition-colors">
                {t.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

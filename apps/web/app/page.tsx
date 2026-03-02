'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLang } from '@/components/LanguageContext'
import { getHeroSize } from '@/lib/i18n'
import {
  BtnPrimary,
  Icon,
  LanguageSelector,
  PricingCard,
} from '@/components/travel-capsule'

// ─── Image URLs ────────────────────────────────────────────────────────────────

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1533026795897-5bb93fa969d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920',
  wardobe: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
  mediterranean: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  tokyo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
  island: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600',
  earthTone: 'https://images.unsplash.com/photo-1764697907661-322b4e1b51a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  streetwear: 'https://images.unsplash.com/photo-1635650804263-1a1941e14df5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const { t, lang, displayFont, bodyFont } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const heroSize = getHeroSize(lang)

  return (
    <div className="min-h-screen bg-[#FDF8F3]">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex flex-col overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.hero}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.60)' }}
            fetchPriority="high"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(26,20,16,0.4) 0%, transparent 40%, rgba(26,20,16,0.6) 100%)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 grain-overlay" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `linear-gradient(rgba(196,97,58,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(196,97,58,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        <div className="relative z-20">
          <header className="w-full px-6 py-5">
            <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 'var(--max-w)' }}>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Travel Capsule home">
                <Icon name="luggage" size={28} className="text-white" />
                <span
                  className="text-[20px] tracking-tight text-white"
                  style={{ fontFamily: displayFont, fontWeight: 700 }}
                >
                  Travel Capsule
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
                {[
                  { key: 'nav.howItWorks', href: '#how-it-works' },
                  { key: 'nav.pricing', href: '#pricing' },
                  { key: 'nav.examples', href: '#examples' },
                ].map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    className="text-[12px] tracking-[0.08em] uppercase text-white/70 hover:text-white transition-colors"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    {t(item.key)}
                  </a>
                ))}
              </nav>

              {/* Right group */}
              <div className="flex items-center gap-3">
                <LanguageSelector />
                <BtnPrimary size="sm" onClick={() => router.push('/trip')}>
                  {t('nav.startPlanning')}
                </BtnPrimary>
                {/* Hamburger */}
                <button
                  className="flex md:hidden items-center justify-center w-9 h-9 text-white"
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
                className="fixed top-[72px] left-0 right-0 z-50 bg-[#1A1410]/95 border-b border-white/10 shadow-xl md:hidden backdrop-blur-sm"
                aria-label="Mobile navigation"
              >
                <div className="px-6 py-5 flex flex-col gap-1">
                  {[
                    { key: 'nav.howItWorks', href: '#how-it-works' },
                    { key: 'nav.pricing', href: '#pricing' },
                    { key: 'nav.examples', href: '#examples' },
                  ].map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      className="block py-3 text-sm tracking-[0.08em] uppercase text-white/70 hover:text-white transition-colors border-b border-white/10 last:border-0"
                      style={{ fontFamily: bodyFont, fontWeight: 500 }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t(item.key)}
                    </a>
                  ))}
                  <button
                    className="mt-3 flex items-center justify-center bg-[#C4613A] text-white text-sm font-bold tracking-widest uppercase py-3.5 px-6 transition-all hover:bg-[#A84A25]"
                    onClick={() => { setMobileMenuOpen(false); router.push('/trip') }}
                  >
                    {t('nav.startPlanning')}
                  </button>
                </div>
              </nav>
            </>
          )}
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-[800px]">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A] animate-pulse" />
              <span
                className="text-[10px] uppercase tracking-[0.15em] text-white/80"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('hero.pill')}
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-white italic whitespace-pre-line"
              style={{ fontSize: heroSize, lineHeight: 1.02, fontFamily: displayFont }}
            >
              {t('hero.tagline')}
            </h1>

            <div className="w-16 h-0.5 bg-[#C4613A] mx-auto my-8" aria-hidden="true" />

            <p
              className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-4"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {t('hero.subtitle')}
            </p>

            <p
              className="text-[18px] text-white/70 max-w-[520px] mx-auto mb-10"
              style={{ fontFamily: bodyFont, fontWeight: 300 }}
            >
              {t('hero.body')}
            </p>

            <BtnPrimary size="lg" onClick={() => router.push('/trip')}>
              <span className="flex items-center gap-2">
                {t('hero.cta')}
                <Icon name="arrow_forward" size={18} className="text-white" />
              </span>
            </BtnPrimary>

          </div>
        </div>

        {/* Bottom editorial bar */}
        <div className="relative z-10 border-t border-white/10">
          <div
            className="mx-auto flex items-center justify-between px-6 py-4"
            style={{ maxWidth: 'var(--max-w)' }}
          >
            {['Sys.Ver 2.4', 'Initialize Style Synthesis', 'Dynamic Weather Mapping'].map((text, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-[0.12em] text-white/30"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTELLIGENCE ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#FDF8F3] py-32 px-6" aria-label="Style Intelligence">
        <div
          className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          style={{ maxWidth: 'var(--max-w)' }}
        >

          {/* Left — text */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C4613A]" aria-hidden="true" />
              <span
                className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('section.intelligence.label')}
              </span>
            </div>

            <h2
              className="text-[#292524] whitespace-pre-line"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontFamily: displayFont }}
            >
              {t('section.intelligence.title')}
            </h2>

            <div className="w-12 h-0.5 bg-[#C4613A] my-8" aria-hidden="true" />

            <p
              className="text-[18px] text-[#57534e] mb-4"
              style={{ fontFamily: bodyFont, fontWeight: 300, lineHeight: 1.7 }}
            >
              {t('section.intelligence.body1')}
            </p>
            <p
              className="text-[18px] text-[#57534e] mb-10"
              style={{ fontFamily: bodyFont, fontWeight: 300, lineHeight: 1.7 }}
            >
              {t('section.intelligence.body2')}
            </p>

            <div className="flex gap-12">
              <div>
                <span
                  className="text-[36px] text-[#C4613A]"
                  style={{ fontFamily: displayFont, fontWeight: 700 }}
                >
                  12+
                </span>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>
                  {t('section.intelligence.stat1')}
                </p>
              </div>
              <div>
                <span
                  className="text-[36px] text-[#C4613A]"
                  style={{ fontFamily: displayFont, fontWeight: 700 }}
                >
                  100%
                </span>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>
                  {t('section.intelligence.stat2')}
                </p>
              </div>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.wardobe}
                alt="Curated wardrobe"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div
              className="absolute -bottom-4 -left-4 bg-white rounded-xl px-5 py-3 border border-[#E8DDD4]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-3">
                <Icon name="auto_awesome" size={20} className="text-[#C4613A]" />
                <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  AI-curated selections
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── CAPSULES IN MOTION ────────────────────────────────────────────── */}
      <section className="bg-[#FDF8F3] py-32 px-6" aria-label="Capsules in Motion">
        <div className="mx-auto" style={{ maxWidth: 'var(--max-w)' }}>

          <div className="text-center mb-16">
            <h2
              className="text-[#292524]"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontFamily: displayFont }}
            >
              {t('section.capsules.title').split(' ').slice(0, -1).join(' ')}{' '}
              <em>{t('section.capsules.title').split(' ').pop()}</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Card 1 — Mediterranean */}
            <div className="group cursor-pointer" onClick={() => router.push('/trip')}>
              <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMAGES.mediterranean}
                  alt={t('capsule.mediterranean')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-[0.1em] text-white border border-white/20"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    Warm &amp; Earthy
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <h3
                  className="text-[24px] text-[#292524] not-italic"
                  style={{ fontFamily: displayFont, fontWeight: 600 }}
                >
                  {t('capsule.mediterranean')}
                </h3>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>
                  {t('capsule.mediterraneanSub')}
                </p>
              </div>
            </div>

            {/* Card 2 — Tokyo */}
            <div className="group cursor-pointer" onClick={() => router.push('/trip')}>
              <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMAGES.tokyo}
                  alt={t('capsule.tokyo')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-[0.1em] text-white border border-white/20"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    Urban Edge
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <h3
                  className="text-[24px] text-[#292524] not-italic"
                  style={{ fontFamily: displayFont, fontWeight: 600 }}
                >
                  {t('capsule.tokyo')}
                </h3>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>
                  {t('capsule.tokyoSub')}
                </p>
              </div>
            </div>

            {/* Card 3 — Island */}
            <div className="group cursor-pointer" onClick={() => router.push('/trip')}>
              <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMAGES.island}
                  alt={t('capsule.island')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-[0.1em] text-white border border-white/20"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    Relaxed Luxe
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <h3
                  className="text-[24px] text-[#292524] not-italic"
                  style={{ fontFamily: displayFont, fontWeight: 600 }}
                >
                  {t('capsule.island')}
                </h3>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>
                  {t('capsule.islandSub')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── EXAMPLES ──────────────────────────────────────────────────────── */}
      <section id="examples" className="bg-[#FDF8F3] py-32 px-6" aria-label="Plan examples">
        <div className="mx-auto" style={{ maxWidth: 'var(--max-w)' }}>

          <div className="text-center mb-16">
            <h2
              className="text-[#292524]"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontFamily: displayFont }}
            >
              {t('section.examples.title')}
            </h2>
            <p
              className="mt-4 text-[18px] text-[#57534e] max-w-[600px] mx-auto"
              style={{ fontFamily: bodyFont, fontWeight: 300 }}
            >
              {t('section.examples.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">

            {/* Pro example */}
            <div
              className="relative overflow-hidden group aspect-[4/3] bg-[#1A1410] cursor-pointer rounded-xl"
              onClick={() => router.push('/trip')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.earthTone}
                alt="Multi-city Pro plan example"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(26,20,16,0.90) 0%, transparent 60%)' }}
                aria-hidden="true"
              />
              <div className="absolute top-5 left-5">
                <span className="inline-block bg-[#C4613A] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Pro
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p
                  className="text-2xl text-white italic mb-1"
                  style={{ fontFamily: displayFont, fontWeight: 700 }}
                >
                  Multi-City Style Guide
                </p>
                <p className="text-white/60 text-sm" style={{ fontFamily: bodyFont }}>
                  Paris · Rome · Barcelona &mdash; $12
                </p>
              </div>
              <div className="absolute bottom-6 right-6">
                <span
                  className="inline-flex items-center gap-1 text-white/70 text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: bodyFont }}
                >
                  {t('section.examples.viewPro')}
                  <Icon name="arrow_forward" size={14} className="text-white/70" />
                </span>
              </div>
            </div>

            {/* Annual example */}
            <div
              className="relative overflow-hidden group aspect-[4/3] bg-[#1A1410] cursor-pointer rounded-xl"
              onClick={() => router.push('/trip')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.streetwear}
                alt="Annual member dashboard example"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(26,20,16,0.90) 0%, transparent 60%)' }}
                aria-hidden="true"
              />
              <div className="absolute top-5 left-5">
                <span className="inline-block bg-[#D4AF37] text-[#1A1410] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
                  Annual
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p
                  className="text-2xl text-white italic mb-1"
                  style={{ fontFamily: displayFont, fontWeight: 700 }}
                >
                  Annual Style DNA
                </p>
                <p className="text-white/60 text-sm" style={{ fontFamily: bodyFont }}>
                  Tokyo · Seoul · 12 trips/year &mdash; $29/yr
                </p>
              </div>
              <div className="absolute bottom-6 right-6">
                <span
                  className="inline-flex items-center gap-1 text-white/70 text-[11px] uppercase tracking-[0.1em]"
                  style={{ fontFamily: bodyFont }}
                >
                  {t('section.examples.viewAnnual')}
                  <Icon name="arrow_forward" size={14} className="text-white/70" />
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── DARK CTA ──────────────────────────────────────────────────────── */}
      <section
        className="relative bg-[#1A1410] py-32 px-6 overflow-hidden"
        aria-label="Call to action"
      >
        <div className="absolute inset-0 grain-overlay" aria-hidden="true" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(196,97,58,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(196,97,58,0.15) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto text-center" style={{ maxWidth: 'var(--max-w)' }}>
          <h2
            className="text-white italic whitespace-pre-line"
            style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            {t('section.darkCta.title')}
          </h2>
          <div className="mt-10">
            <BtnPrimary size="lg" onClick={() => router.push('/trip')}>
              <span className="flex items-center gap-2">
                {t('section.darkCta.cta')}
                <Icon name="arrow_forward" size={18} className="text-white" />
              </span>
            </BtnPrimary>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#FDF8F3] py-32 px-6" aria-label="Pricing plans">
        <div className="mx-auto" style={{ maxWidth: 'var(--max-w)' }}>

          <div className="text-center mb-16">
            <h2
              className="text-[#292524]"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontFamily: displayFont }}
            >
              {t('pricing.title')}
            </h2>
            <p
              className="mt-4 text-[18px] text-[#57534e] max-w-[500px] mx-auto"
              style={{ fontFamily: bodyFont, fontWeight: 300 }}
            >
              {t('pricing.noAccountNeeded')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[960px] mx-auto">

            {/* Standard */}
            <PricingCard
              plan="Standard"
              price="$5"
              period={t('pricing.oneTime')}
              features={[
                { text: t('pricing.standard.features.1'), included: true },
                { text: t('pricing.standard.features.2'), included: true },
                { text: t('pricing.standard.features.3'), included: true },
                { text: t('pricing.standard.features.4'), included: true },
                { text: t('pricing.standard.features.5'), included: true },
              ]}
              ctaLabel={t('pricing.standard.cta')}
              onSelect={() => router.push('/trip')}
            />

            {/* Pro — highlighted */}
            <PricingCard
              plan="Pro"
              price="$12"
              period={t('pricing.oneTime')}
              badge={t('pricing.pro.badge')}
              features={[
                { text: t('pricing.pro.features.1'), included: true },
                { text: t('pricing.pro.features.2'), included: true },
                { text: t('pricing.pro.features.3'), included: true },
                { text: t('pricing.pro.features.4'), included: true },
                { text: t('pricing.pro.features.5'), included: true },
              ]}
              ctaLabel={t('pricing.pro.cta')}
              highlighted
              onSelect={() => router.push('/trip')}
            />

            {/* Annual */}
            <PricingCard
              plan="Annual"
              price="$29"
              period={t('pricing.perYear')}
              badge={t('pricing.annual.badge')}
              features={[
                { text: t('pricing.annual.features.1'), included: true },
                { text: t('pricing.annual.features.2'), included: true },
                { text: t('pricing.annual.features.3'), included: true },
                { text: t('pricing.annual.features.4'), included: true },
              ]}
              ctaLabel={t('pricing.annual.cta')}
              onSelect={() => router.push('/trip')}
            />

          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#EFE8DF] py-10 px-6" aria-label="Site footer">
        <div
          className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ maxWidth: 'var(--max-w)' }}
        >

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="Travel Capsule home">
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span
              className="text-[16px] tracking-tight text-[#1A1410]"
              style={{ fontFamily: displayFont, fontWeight: 700 }}
            >
              Travel Capsule
            </span>
          </Link>

          {/* Footer links */}
          <nav className="flex items-center gap-6 flex-wrap justify-center" aria-label="Footer navigation">
            {[
              { key: 'footer.privacy', href: '/legal/privacy' },
              { key: 'footer.terms', href: '/legal/terms' },
              { key: 'footer.sustainability', href: '/' },
              { key: 'footer.contact', href: '/' },
            ].map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors"
                style={{ fontFamily: bodyFont, fontWeight: 500 }}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#EFE8DF] mt-8 pt-6">
          <div
            className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ maxWidth: 'var(--max-w)' }}
          >
            <p
              className="text-[11px] text-[#9c8c7e] italic"
              style={{ fontFamily: displayFont }}
            >
              &ldquo;{t('footer.quote')}&rdquo; &mdash; {t('footer.quoteAuthor')}
            </p>
            <p className="text-[11px] text-[#9c8c7e]" style={{ fontFamily: bodyFont }}>
              &copy; {new Date().getFullYear()} Travel Capsule AI
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPreview, createCheckout } from '@/lib/api'
import { useLang } from '@/components/LanguageContext'
import { Icon } from '@/components/travel-capsule/Icon'
import { LanguageSelector } from '@/components/travel-capsule/LanguageSelector'
import { BtnPrimary, BtnSecondary, BtnDark } from '@/components/travel-capsule/Buttons'
import { CheckItem } from '@/components/travel-capsule/CheckItem'
import type { PreviewResponse } from '../../../../../packages/types'
import type { PlanType } from '../../../../../packages/types'

// ─── Static outfit previews ───────────────────────────────────────────────────

const OUTFIT_PREVIEWS = [
  {
    label: 'Day 1 · Arrival',
    // eslint-disable-next-line @next/next/no-img-element
    img: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600',
    style: 'Classic Layering',
  },
  {
    label: 'Day 2 · Explore',
    // eslint-disable-next-line @next/next/no-img-element
    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
    style: 'Smart Casual',
  },
  {
    label: 'Day 3 · Culture',
    // eslint-disable-next-line @next/next/no-img-element
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    style: 'Cozy Intellectual',
  },
  {
    label: 'Day 4 · Dinner',
    // eslint-disable-next-line @next/next/no-img-element
    img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    style: 'Evening Elegance',
  },
]

// ─── Plan feature key sets ─────────────────────────────────────────────────────

const STANDARD_FEATURE_KEYS = [
  'pricing.standard.features.1',
  'pricing.standard.features.2',
  'pricing.standard.features.3',
  'pricing.standard.features.4',
  'pricing.standard.features.5',
]

const PRO_FEATURE_KEYS = [
  'pricing.pro.features.1',
  'pricing.pro.features.2',
  'pricing.pro.features.3',
  'pricing.pro.features.4',
  'pricing.pro.features.5',
]

const ANNUAL_FEATURE_KEYS = [
  'pricing.annual.features.1',
  'pricing.annual.features.2',
  'pricing.annual.features.3',
  'pricing.annual.features.4',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PreviewClient({ tripId }: { tripId: string }) {
  const router = useRouter()
  const { t, displayFont, bodyFont } = useLang()

  const [data, setData] = useState<PreviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState<PlanType | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    getPreview(tripId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tripId])

  async function handleSelectPlan(plan: PlanType) {
    setPaymentLoading(plan)
    setPaymentError(null)
    try {
      const { checkout_url } = await createCheckout(tripId, plan)
      window.location.href = checkout_url
    } catch {
      setPaymentError('Could not start checkout. Please try again.')
      setPaymentLoading(null)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#FDF8F3' }}
      >
        <div
          className="w-11 h-11 rounded-full border-2 border-[#F5EFE6] border-t-[#C4613A] animate-spin"
        />
        <p
          className="text-sm text-[#9c8c7e]"
          style={{ fontFamily: bodyFont }}
        >
          Analyzing your trip...
        </p>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: '#FDF8F3' }}
      >
        <h1
          className="text-[28px] text-[#1A1410]"
          style={{ fontFamily: displayFont }}
        >
          Preview not found
        </h1>
        <p className="text-[15px] text-[#9c8c7e] max-w-[360px]">
          This preview may have expired. Start a new trip to try again.
        </p>
        <BtnPrimary href="/trip" className="mt-2 rounded-full">
          Start New Trip
        </BtnPrimary>
      </div>
    )
  }

  // ─── Derived display values ────────────────────────────────────────────────

  const firstVibe = data.vibes[0]
  const firstWeather = data.weather[0]
  const teaserUrl = data.teaser?.teaser_url ?? null

  const destinationLabel = data.vibes.map((v) => v.city).join(', ') || '—'
  const aestheticLabel = firstVibe?.mood_name?.split('—')[1]?.trim() ?? '—'
  const weatherFocusLabel = firstWeather?.climate_band
    ? firstWeather.climate_band.charAt(0).toUpperCase() +
      firstWeather.climate_band.slice(1) +
      ' Layers'
    : '—'
  const durationLabel = firstWeather?.climate_band
    ? firstWeather.climate_band.charAt(0).toUpperCase() +
      firstWeather.climate_band.slice(1) +
      ' climate'
    : '—'

  const summaryStats = [
    { key: 'preview.destination', value: destinationLabel },
    { key: 'preview.duration', value: durationLabel },
    { key: 'preview.aesthetic', value: aestheticLabel },
    { key: 'preview.weather', value: weatherFocusLabel },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F3', fontFamily: bodyFont, color: '#1A1410' }}>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50"
        style={{ backgroundColor: 'rgba(253,248,243,0.8)', backdropFilter: 'blur(16px)' }}
      >
        <div
          className="mx-auto flex items-center justify-between px-6 py-4"
          style={{ maxWidth: 'var(--max-w)' }}
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
            role="link"
            aria-label="Go to home"
          >
            <Icon name="luggage" size={28} className="text-[#C4613A]" />
            <span
              className="text-[20px] tracking-tight text-[#1A1410]"
              style={{ fontFamily: displayFont, fontWeight: 700 }}
            >
              Travel Capsule
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <main className="mx-auto px-6 py-12" style={{ maxWidth: 1200 }}>

        {/* ─── Step label + hero copy ─────────────────────────────────────── */}
        <span
          className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A] block"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          {t('preview.step')}
        </span>
        <h1
          className="mt-4 text-[#292524] italic whitespace-pre-line"
          style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontFamily: displayFont, lineHeight: 1.05 }}
        >
          {t('preview.title')}
        </h1>
        <p
          className="mt-4 text-[18px] text-[#57534e] max-w-[600px]"
          style={{ fontFamily: bodyFont, fontWeight: 300 }}
        >
          {t('preview.body')}
        </p>

        {/* ─── Preview hero card (21:9) ────────────────────────────────────── */}
        <div
          className="mt-10 relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '21/9' }}
        >
          {teaserUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={teaserUrl}
              alt="Your travel look teaser"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1A1410 0%, #3d2b1f 50%, #1A1410 100%)' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          {/* Glass card overlay */}
          <div
            className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-[380px] p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                <Icon name="auto_awesome" size={20} className="text-white" />
              </div>
              <span
                className="text-[20px] text-white italic"
                style={{ fontFamily: displayFont }}
              >
                Lookbook Preview
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-[75%] bg-[#C4613A] rounded-full" />
            </div>
            <span
              className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/70"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {firstVibe?.mood_name ?? '75% AI Analysis Complete'}
            </span>
            {firstVibe?.vibe_tags && firstVibe.vibe_tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {firstVibe.vibe_tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-white/15 border border-white/28 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase text-white/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── AI Outfit Preview grid ──────────────────────────────────────── */}
        <section className="mt-12">
          <h2
            className="text-[#292524] mb-6"
            style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontFamily: displayFont }}
          >
            AI Outfit Preview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OUTFIT_PREVIEWS.map((outfit, i) => (
              <div key={i} className="group">
                <div
                  className="relative rounded-xl overflow-hidden bg-[#E8DDD4]"
                  style={{ aspectRatio: '3/4' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={outfit.img}
                    alt={outfit.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span
                      className="text-white/70 text-[10px] uppercase tracking-[0.1em] block"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {outfit.label}
                    </span>
                    <span
                      className="text-white text-[15px] italic"
                      style={{ fontFamily: displayFont }}
                    >
                      {outfit.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Trip Summary ────────────────────────────────────────────────── */}
        <section className="mt-12 pt-8 border-t border-[#C4613A]/10">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#C4613A]/8">
            <h2
              className="text-[#1A1410]"
              style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontFamily: displayFont }}
            >
              {t('preview.tripSummary')}
            </h2>
            <button
              onClick={() => router.push('/trip')}
              className="text-[12px] font-bold tracking-[0.08em] text-[#C4613A] uppercase hover:opacity-70 transition-opacity"
              aria-label="Edit trip details"
            >
              {t('preview.editDetails')} ✏
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {summaryStats.map(({ key, value }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <span
                  className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#C4613A]"
                  style={{ fontFamily: bodyFont }}
                >
                  {t(key)}
                </span>
                <p
                  className="text-[20px] font-medium text-[#1A1410]"
                  style={{ fontFamily: bodyFont }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing ─────────────────────────────────────────────────────── */}
        <section className="mt-20 mb-20">
          {/* Price anchor pill */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-3 rounded-full px-5 py-1.5 flex-wrap justify-center"
              style={{ background: '#1A1410' }}
            >
              <span className="text-[12px] text-[#9c8c7e] line-through">Personal stylist: $200+</span>
              <span className="text-[12px] text-white/30">→</span>
              <span className="text-[12px] font-bold text-[#D4AF37]">Travel Capsule AI: from $5</span>
            </div>
          </div>

          <h2
            className="text-center text-[#1A1410] mb-3"
            style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontFamily: displayFont }}
          >
            {t('pricing.title')}
          </h2>
          <p
            className="text-center text-[16px] text-[#1A1410]/60 mb-10"
            style={{ fontFamily: bodyFont }}
          >
            {t('preview.selectPlan')}
          </p>

          {paymentError && (
            <p className="text-center text-red-600 text-sm mb-4" role="alert">
              {paymentError}
            </p>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto items-stretch">

            {/* Standard */}
            <div className="flex flex-col bg-white border border-[#C4613A]/12 rounded-[20px] p-8 relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col flex-1">
                <p
                  className="text-[15px] font-bold text-[#1A1410] mb-2"
                  style={{ fontFamily: bodyFont }}
                >
                  Standard
                </p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="text-[40px] font-bold text-[#1A1410]">$5</span>
                  <span className="text-[14px] text-[#1A1410]/50">/trip</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {STANDARD_FEATURE_KEYS.map((key) => (
                    <CheckItem key={key}>{t(key)}</CheckItem>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <BtnSecondary
                  onClick={() => handleSelectPlan('standard')}
                  disabled={paymentLoading !== null}
                  className={`w-full rounded-xl justify-center${paymentLoading !== null && paymentLoading !== 'standard' ? ' opacity-60' : ''}`}
                >
                  {paymentLoading === 'standard' ? 'Redirecting...' : t('pricing.standard.cta')}
                </BtnSecondary>
                <button
                  onClick={() => router.push('/trip')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#C4613A] border border-dashed border-[#C4613A]/40 hover:border-[#C4613A] transition-colors"
                  style={{ fontFamily: bodyFont }}
                  aria-label="See sample result"
                >
                  {t('preview.seeSample')}
                </button>
              </div>
            </div>

            {/* Pro — highlighted */}
            <div
              className="flex flex-col rounded-[20px] p-8 relative overflow-hidden md:scale-[1.03]"
              style={{ background: '#C4613A', boxShadow: '0 20px 48px rgba(196,97,58,0.35)' }}
            >
              {/* Most Popular badge */}
              <span
                className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
              >
                {t('pricing.pro.badge')}
              </span>
              <div className="flex flex-col flex-1">
                <p
                  className="text-[15px] font-bold text-white mb-2"
                  style={{ fontFamily: bodyFont }}
                >
                  Pro
                </p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="text-[40px] font-bold text-white">$12</span>
                  <span className="text-[14px] text-white/65">/trip</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {PRO_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-start gap-2.5">
                      <span
                        className="material-symbols-outlined shrink-0 text-white/80 mt-0.5"
                        style={{ fontSize: 16 }}
                      >
                        check_circle
                      </span>
                      <span className="text-sm leading-relaxed text-white/88">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  onClick={() => handleSelectPlan('pro')}
                  disabled={paymentLoading !== null}
                  className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide bg-white text-[#C4613A] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  style={{ fontFamily: bodyFont, opacity: paymentLoading !== null && paymentLoading !== 'pro' ? 0.6 : 1 }}
                  aria-label="Select Pro plan"
                >
                  {paymentLoading === 'pro' ? 'Redirecting...' : t('pricing.pro.cta')}
                </button>
                <button
                  onClick={() => router.push('/trip')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-dashed border-white/30 hover:border-white/60 transition-colors"
                  style={{ fontFamily: bodyFont }}
                  aria-label="See sample result"
                >
                  {t('preview.seeSample')}
                </button>
              </div>
            </div>

            {/* Annual */}
            <div className="flex flex-col bg-white border border-[#C4613A]/12 rounded-[20px] p-8 relative overflow-hidden hover:shadow-lg transition-shadow">
              {/* Gold savings badge */}
              <span
                className="inline-block mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#C4613A] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#B8920A' }}
              >
                {t('pricing.annual.badge')}
              </span>
              <div className="flex flex-col flex-1">
                <p
                  className="text-[15px] font-bold text-[#1A1410] mb-2"
                  style={{ fontFamily: bodyFont }}
                >
                  Annual
                </p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="text-[40px] font-bold text-[#1A1410]">$29</span>
                  <span className="text-[14px] text-[#1A1410]/50">{t('pricing.perYear')}</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {ANNUAL_FEATURE_KEYS.map((key) => (
                    <CheckItem key={key}>{t(key)}</CheckItem>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <BtnDark
                  onClick={() => handleSelectPlan('annual')}
                  disabled={paymentLoading !== null}
                  className={`w-full rounded-xl justify-center${paymentLoading !== null && paymentLoading !== 'annual' ? ' opacity-60' : ''}`}
                >
                  {paymentLoading === 'annual' ? 'Redirecting...' : t('pricing.annual.cta')}
                </BtnDark>
                <button
                  onClick={() => router.push('/trip')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-[#C4613A] border border-dashed border-[#C4613A]/40 hover:border-[#C4613A] transition-colors"
                  style={{ fontFamily: bodyFont }}
                  aria-label="See sample result"
                >
                  {t('preview.seeSample')}
                </button>
              </div>
            </div>

          </div>

          {/* Trust signals */}
          <div className="flex justify-center gap-6 mt-7 flex-wrap">
            <span className="flex items-center gap-1.5 text-[12px] text-[#9c8c7e]">
              <Icon name="lock" size={15} />
              Secure checkout via Polar
            </span>
            <span className="text-[12px] text-[#9c8c7e]">24h refund guarantee</span>
            <span className="text-[12px] text-[#9c8c7e]">Standard &amp; Pro: one-time charge</span>
          </div>
          <p className="text-center text-[10px] text-[#9c8c7e]/65 mt-4 leading-relaxed max-w-[560px] mx-auto">
            Annual plan automatically renews at $29/year. Cancel anytime before renewal.
            Standard and Pro plans are one-time payments with no auto-renewal.
          </p>
          <p
            className="text-center text-[12px] text-[#9c8c7e] mt-3"
            style={{ fontFamily: bodyFont }}
          >
            {t('pricing.noAccountNeeded')}
          </p>
        </section>

        {/* ─── Footer quote ────────────────────────────────────────────────── */}
        <footer className="text-center pt-16 pb-10 border-t border-[#C4613A]/10">
          <blockquote
            className="text-[26px] italic text-[#1A1410]/78 mb-5 leading-relaxed"
            style={{ fontFamily: displayFont }}
          >
            &ldquo;{t('footer.quote')}&rdquo;
          </blockquote>
          <p
            className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C4613A] mb-12"
            style={{ fontFamily: bodyFont }}
          >
            &mdash; {t('footer.quoteAuthor')}
          </p>
          <div className="flex justify-center gap-8 flex-wrap">
            {([
              { key: 'footer.privacy', href: '/legal/privacy' },
              { key: 'footer.terms', href: '/legal/terms' },
              { key: 'footer.contact', href: 'mailto:hello@travelscapsule.com' },
            ] as const).map(({ key, href }) => (
              <a
                key={key}
                href={href}
                className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#1A1410]/40 no-underline hover:text-[#C4613A] transition-colors"
              >
                {t(key)}
              </a>
            ))}
          </div>
        </footer>

      </main>
    </div>
  )
}

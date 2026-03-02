'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPreview, createCheckout } from '@/lib/api'
import { useLang } from '@/components/LanguageContext'
import { Icon } from '@/components/travel-capsule/Icon'
import { LanguageSelector } from '@/components/travel-capsule/LanguageSelector'
import { BtnPrimary } from '@/components/travel-capsule/Buttons'
import { CheckItem } from '@/components/travel-capsule/CheckItem'
import type { PreviewResponse } from '../../../../../packages/types'
import type { PlanType } from '../../../../../packages/types'

// ─── Static outfit previews ───────────────────────────────────────────────────

const OUTFIT_PREVIEWS = [
  {
    label: 'Day 1 \u00B7 Arrival',
    img: 'https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    style: 'Classic Layering',
  },
  {
    label: 'Day 2 \u00B7 Galleries',
    img: 'https://images.unsplash.com/photo-1746730921292-bd6be2c256d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    style: 'Smart Casual',
  },
  {
    label: 'Day 3 \u00B7 Museums',
    img: 'https://images.unsplash.com/photo-1570298529069-2ca77646dd89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    style: 'Cozy Intellectual',
  },
  {
    label: 'Day 4 \u00B7 Dinner',
    img: 'https://images.unsplash.com/photo-1587137276455-d0e42050e533?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
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
      if (checkout_url) {
        window.location.href = checkout_url
      } else {
        router.push(`/checkout/success?plan=${plan}&tripId=${tripId}`)
      }
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
        <div className="w-11 h-11 rounded-full border-2 border-[#F5EFE6] border-t-[#C4613A] animate-spin" />
        <p className="text-sm text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
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
        <p className="text-[15px] text-[#8A7B6E] max-w-[360px]">
          This preview may have expired. Start a new trip to try again.
        </p>
        <BtnPrimary href="/trip" className="mt-2">
          Start New Trip
        </BtnPrimary>
      </div>
    )
  }

  // ─── Derived display values ────────────────────────────────────────────────

  const firstVibe = data.vibes[0]
  const firstWeather = data.weather[0]
  const teaserUrl = data.teaser?.teaser_url ?? null
  const destinationLabel = data.vibes.map((v) => v.city).join(', ') || '\u2014'
  const moodName = firstVibe?.mood_name ?? null

  // ─── Progress checklist items ──────────────────────────────────────────────

  const checklistItems = [
    { label: `Weather analyzed for ${destinationLabel}`, done: true },
    { label: moodName ? `City vibe matched \u2014 ${moodName}` : 'City vibe matched', done: true, highlight: true },
    { label: '4 looks generated (1 unlocked)', done: true },
    { label: 'Full capsule + Day-by-day plan', done: false },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F3', fontFamily: bodyFont, color: '#1A1410' }}>

      {/* ─── Header (simple) ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/60"
        style={{ backgroundColor: 'rgba(253,248,243,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: 1200 }}>
          <a
            href="/"
            className="flex items-center gap-2"
            aria-label="Go to home"
          >
            <Icon name="luggage" size={26} className="text-[#C4613A]" />
            <span
              className="text-lg tracking-tight text-[#1A1410]"
              style={{ fontFamily: displayFont, fontWeight: 700, fontStyle: 'italic' }}
            >
              Travel Capsule
            </span>
          </a>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              className="w-9 h-9 rounded-full bg-[#F5EFE6] flex items-center justify-center hover:bg-[#E8DDD4] transition-colors"
              aria-label="User account"
            >
              <Icon name="person" size={20} className="text-[#8A7B6E]" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <main className="mx-auto px-6" style={{ maxWidth: 1200 }}>

        {/* ─── Step label + Hero copy ─────────────────────────────────────── */}
        <section className="pt-12 pb-8">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-[#C4613A] block mb-5 font-semibold"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            Step 4 of 4: Finalizing your journey
          </span>
          <h1
            className="text-[#1A1410] italic mb-5"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontFamily: displayFont, lineHeight: 1.08 }}
          >
            Your story is ready{'\n'}to unfold.
          </h1>
          <p
            className="text-[17px] text-[#8A7B6E] max-w-[560px] leading-relaxed"
            style={{ fontFamily: bodyFont }}
          >
            We&apos;ve analyzed your destination, weather patterns, and style preferences.
            Choose a plan to unlock your capsule.
          </p>
        </section>

        {/* ─── Wide city image ────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden mb-12" style={{ height: 'clamp(200px, 25vw, 320px)' }}>
          {teaserUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={teaserUrl}
              alt="Your travel destination"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1A1410 0%, #3d2b1f 50%, #1A1410 100%)' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Mood badge overlay */}
          {moodName && (
            <div className="absolute bottom-5 left-6">
              <span
                className="px-4 py-2 rounded-lg text-white text-sm italic"
                style={{
                  fontFamily: displayFont,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {moodName}
              </span>
            </div>
          )}
          {firstVibe?.vibe_tags && firstVibe.vibe_tags.length > 0 && (
            <div className="absolute bottom-5 right-6 flex gap-2">
              {firstVibe.vibe_tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white/90"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Progress checklist ─────────────────────────────────────────── */}
        <section className="mb-12 max-w-[560px]">
          <h3
            className="text-[10px] uppercase tracking-[0.15em] text-[#8A7B6E] font-bold mb-4"
            style={{ fontFamily: bodyFont }}
          >
            Analysis Progress
          </h3>
          <div className="space-y-3">
            {checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined shrink-0 ${item.done ? 'text-[#C4613A]' : 'text-[#E8DDD4]'}`}
                  style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {item.done ? 'check_circle' : 'lock'}
                </span>
                <span
                  className={`text-[14px] leading-relaxed ${
                    item.done ? 'text-[#1A1410]' : 'text-[#8A7B6E]'
                  } ${item.highlight ? 'italic' : ''}`}
                  style={{
                    fontFamily: item.highlight ? displayFont : bodyFont,
                    ...(item.highlight ? { color: '#D4AF37' } : {}),
                  }}
                >
                  {item.done ? '\u2705' : '\uD83D\uDD12'} {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Teaser 2x2 grid ───────────────────────────────────────────── */}
        <section className="mb-16">
          <h2
            className="text-[#1A1410] mb-6"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontFamily: displayFont }}
          >
            AI Outfit Preview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OUTFIT_PREVIEWS.map((outfit, i) => (
              <div key={i} className="group relative">
                <div
                  className="relative rounded-xl overflow-hidden bg-[#E8DDD4]"
                  style={{ aspectRatio: '3/4' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={outfit.img}
                    alt={outfit.label}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      i > 0 ? 'blur-lg scale-110' : ''
                    }`}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Lock icon for blurred images */}
                  {i > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon name="lock" size={24} className="text-white" />
                      </div>
                    </div>
                  )}

                  {/* Label overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span
                      className="text-white/70 text-[10px] uppercase tracking-[0.1em] block"
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
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

                  {/* "Unlocked" badge on first image */}
                  {i === 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 bg-[#C4613A] text-white text-[9px] uppercase tracking-widest font-bold rounded-sm">
                        Unlocked
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p
            className="text-center text-[13px] text-[#C4613A] mt-4 font-medium"
            style={{ fontFamily: bodyFont }}
          >
            3 more looks waiting &mdash; Unlock now
          </p>
        </section>

        {/* ─── Pricing ─────────────────────────────────────────────────────── */}
        <section className="mb-20" id="pricing">
          {/* Price anchor pill */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-3 rounded-full px-5 py-2 flex-wrap justify-center"
              style={{ background: '#1A1410' }}
            >
              <span className="text-[12px] text-[#8A7B6E] line-through">Personal stylist: $200+</span>
              <span className="text-[12px] text-white/30">&rarr;</span>
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
            className="text-center text-[15px] text-[#8A7B6E] mb-10"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto items-start">

            {/* Standard */}
            <div className="flex flex-col bg-white border border-[#E8DDD4] rounded-2xl p-7 relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col flex-1">
                <h3
                  className="not-italic text-[24px] text-[#1A1410] mb-3"
                  style={{ fontFamily: displayFont }}
                >
                  Standard
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="text-[44px] text-[#1A1410]"
                    style={{ fontFamily: displayFont, fontWeight: 700 }}
                  >
                    $5
                  </span>
                  <span className="text-[14px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
                    {t('pricing.oneTime')}
                  </span>
                </div>
                <span
                  className="mb-5 text-[11px] text-[#8A7B6E]/60"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {t('pricing.noAccountNeeded')}
                </span>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {STANDARD_FEATURE_KEYS.map((key) => (
                    <CheckItem key={key}>{t(key)}</CheckItem>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('standard')}
                disabled={paymentLoading !== null}
                className="h-[52px] w-full bg-white border-2 border-[#C4613A] text-[#C4613A] text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-[#C4613A] hover:text-white transition-all disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                style={{
                  fontFamily: bodyFont,
                  opacity: paymentLoading !== null && paymentLoading !== 'standard' ? 0.6 : 1,
                }}
                aria-label="Select Standard plan"
              >
                {paymentLoading === 'standard' ? 'Redirecting...' : t('pricing.standard.cta')}
              </button>
            </div>

            {/* Pro — highlighted */}
            <div
              className="relative flex flex-col rounded-2xl p-7 overflow-hidden"
              style={{ background: '#C4613A', boxShadow: '0 8px 32px rgba(196,97,58,.25)' }}
            >
              {/* Most Popular badge */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#1A1410] text-white text-[10px] uppercase tracking-[0.12em] rounded-full whitespace-nowrap font-semibold"
                style={{ fontFamily: bodyFont }}
              >
                {t('pricing.pro.badge')}
              </span>
              <div className="flex flex-col flex-1 mt-2">
                <h3
                  className="text-white not-italic text-[24px] mb-3"
                  style={{ fontFamily: displayFont }}
                >
                  Pro
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="text-[44px] text-white"
                    style={{ fontFamily: displayFont, fontWeight: 700 }}
                  >
                    $12
                  </span>
                  <span className="text-[14px] text-white/70" style={{ fontFamily: bodyFont }}>
                    {t('pricing.oneTime')}
                  </span>
                </div>
                <span
                  className="mb-5 text-[11px] text-white/40"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {t('pricing.noAccountNeeded')}
                </span>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {PRO_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-start gap-2.5">
                      <span
                        className="material-symbols-outlined text-white shrink-0 mt-0.5"
                        style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-[14px] text-white/90 leading-relaxed" style={{ fontFamily: bodyFont }}>
                        {t(key)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('pro')}
                disabled={paymentLoading !== null}
                className="h-[52px] w-full bg-white text-[#C4613A] text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                style={{
                  fontFamily: bodyFont,
                  opacity: paymentLoading !== null && paymentLoading !== 'pro' ? 0.6 : 1,
                }}
                aria-label="Select Pro plan"
              >
                {paymentLoading === 'pro' ? 'Redirecting...' : t('pricing.pro.cta')}
              </button>
            </div>

            {/* Annual */}
            <div className="relative flex flex-col bg-white border border-[#E8DDD4] rounded-2xl p-7 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Gold savings badge */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 text-white text-[10px] uppercase tracking-[0.12em] rounded-full whitespace-nowrap font-semibold"
                style={{ fontFamily: bodyFont, background: 'linear-gradient(135deg, #D4AF37, #C8A96E)' }}
              >
                {t('pricing.annual.badge')}
              </span>
              <div className="flex flex-col flex-1 mt-2">
                <h3
                  className="not-italic text-[24px] text-[#1A1410] mb-3"
                  style={{ fontFamily: displayFont }}
                >
                  Annual
                </h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span
                    className="text-[44px] text-[#1A1410]"
                    style={{ fontFamily: displayFont, fontWeight: 700 }}
                  >
                    $29
                  </span>
                  <span className="text-[14px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
                    {t('pricing.perYear')}
                  </span>
                </div>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {ANNUAL_FEATURE_KEYS.map((key) => (
                    <CheckItem key={key}>{t(key)}</CheckItem>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSelectPlan('annual')}
                disabled={paymentLoading !== null}
                className="h-[52px] w-full bg-[#1A1410] text-white text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-[#C4613A] transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                style={{
                  fontFamily: bodyFont,
                  opacity: paymentLoading !== null && paymentLoading !== 'annual' ? 0.6 : 1,
                }}
                aria-label="Select Annual plan"
              >
                {paymentLoading === 'annual' ? 'Redirecting...' : t('pricing.annual.cta')}
              </button>
            </div>

          </div>

          {/* Trust signals */}
          <div className="flex justify-center gap-6 mt-8 flex-wrap">
            <span className="flex items-center gap-1.5 text-[12px] text-[#8A7B6E]">
              <Icon name="lock" size={15} />
              Secure checkout via Polar
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#8A7B6E]">
              <Icon name="verified" size={15} />
              24h refund guarantee
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#8A7B6E]">
              <Icon name="bolt" size={15} />
              Instant access
            </span>
          </div>
          <p className="text-center text-[10px] text-[#8A7B6E]/60 mt-4 leading-relaxed max-w-[520px] mx-auto">
            Annual plan automatically renews at $29/year. Cancel anytime before renewal.
            Standard and Pro plans are one-time payments with no auto-renewal.
          </p>
        </section>

        {/* ─── Footer ────────────────────────────────────────────────────── */}
        <footer className="text-center pt-12 pb-10 border-t border-[#E8DDD4]">
          <blockquote
            className="text-[24px] italic text-[#1A1410]/70 mb-4 leading-relaxed max-w-[480px] mx-auto"
            style={{ fontFamily: displayFont }}
          >
            &ldquo;{t('footer.quote')}&rdquo;
          </blockquote>
          <p
            className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C4613A] mb-10"
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

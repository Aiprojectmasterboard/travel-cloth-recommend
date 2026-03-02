'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getPreview, createCheckout } from '@/lib/api'
import AuthButton from '@/components/AuthButton'
import type { PreviewResponse } from '../../../../../packages/types'
import type { PlanType } from '../../../../../packages/types'

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Outfit images (static demo for preview grid) ─────────────────────────────

const OUTFIT_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?q=80&w=600',
    day: 'Day 1',
    label: 'Arrival',
  },
  {
    src: 'https://images.unsplash.com/photo-1746730921292-bd6be2c256d5?q=80&w=600',
    day: 'Day 2',
    label: 'Galleries',
  },
  {
    src: 'https://images.unsplash.com/photo-1570298529069-2ca77646dd89?q=80&w=600',
    day: 'Day 3',
    label: 'Museums',
  },
  {
    src: 'https://images.unsplash.com/photo-1587137276455-d0e42050e533?q=80&w=600',
    day: 'Day 4',
    label: 'Dinner',
  },
]

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS: Array<{
  id: PlanType
  name: string
  price: string
  period: string
  badge: string | null
  savingLabel: string | null
  features: string[]
  cta: string
  highlight: boolean
}> = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$5',
    period: '/trip',
    badge: null,
    savingLabel: null,
    features: [
      'Weather & Vibe Analysis',
      'City Vibe Card',
      '4 AI-Generated Outfits',
      '10-Item Capsule List',
      'Day-by-Day Itinerary',
    ],
    cta: 'Select Standard',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/trip',
    badge: 'Most Popular',
    savingLabel: null,
    features: [
      'Everything in Standard',
      'Hero images for ALL cities',
      'Ultra High-Res Visuals',
      '1 Free Style Regeneration',
      'Multi-city coordination',
    ],
    cta: 'Unlock Pro Results',
    highlight: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$29',
    period: '/year',
    badge: null,
    savingLabel: 'Save $115/year',
    features: [
      'Full Pro Experience',
      'Up to 12 trips per year',
      'Priority AI processing',
      'VIP concierge support',
      'Early access to new features',
    ],
    cta: 'Go Annual',
    highlight: false,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PreviewClient({ tripId }: { tripId: string }) {
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
      <div className="preview-loading">
        <div className="preview-spinner" />
        <p className="preview-loading-text">Analyzing your trip...</p>
        <style jsx>{`
          .preview-loading {
            min-height: 100vh;
            background: #FDF8F3;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          .preview-spinner {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid #F5EFE6;
            border-top-color: #C4613A;
            animation: spin 0.8s linear infinite;
          }
          .preview-loading-text {
            font-size: 14px;
            color: #9c8c7e;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="preview-error-wrap">
        <h1 className="preview-error-h1">Preview not found</h1>
        <p className="preview-error-p">This preview may have expired. Start a new trip to try again.</p>
        <a href="/trip" className="preview-error-cta">Start New Trip</a>
        <style jsx>{`
          .preview-error-wrap {
            min-height: 100vh;
            background: #FDF8F3;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 24px;
            text-align: center;
            gap: 16px;
          }
          .preview-error-h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            color: #1A1410;
          }
          .preview-error-p {
            color: #9c8c7e;
            font-size: 15px;
            max-width: 360px;
          }
          .preview-error-cta {
            display: inline-block;
            background: #C4613A;
            color: #fff;
            padding: 12px 28px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            margin-top: 8px;
          }
        `}</style>
      </div>
    )
  }

  const firstVibe = data.vibes[0]
  const firstWeather = data.weather[0]
  const teaserUrl = data.teaser?.teaser_url || null

  const destinationLabel = data.vibes.map((v) => v.city).join(', ')
  const aestheticLabel = firstVibe?.mood_name?.split('—')[1]?.trim() ?? '—'
  const weatherFocusLabel = firstWeather?.climate_band
    ? firstWeather.climate_band.charAt(0).toUpperCase() + firstWeather.climate_band.slice(1) + ' Layers'
    : '—'
  const expiresDate = data.expires_at ? new Date(data.expires_at) : null
  const monthLabel = firstWeather?.style_hint
    ? firstWeather.style_hint.split(' ')[0]
    : expiresDate
      ? (MONTH_NAMES[expiresDate.getMonth() + 1] ?? '')
      : ''
  const durationLabel = firstWeather?.climate_band
    ? firstWeather.climate_band.charAt(0).toUpperCase() + firstWeather.climate_band.slice(1) + ' climate'
    : monthLabel || '—'

  return (
    <div className="preview-root">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="preview-header">
        <a href="/" className="preview-logo">
          <svg width="22" height="22" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
          </svg>
          <span className="preview-logo-text">Travel Capsule AI</span>
        </a>
        <div className="preview-header-right">
          <AuthButton />
        </div>
      </header>

      <main className="preview-main">
        {/* ─── Step indicator + hero copy ───────────────────────────────────── */}
        <div className="preview-hero-copy">
          <span className="preview-step-label">Step 4 of 4: Finalizing Your Journey</span>
          <h1 className="preview-h1">Your story is ready to unfold.</h1>
          <p className="preview-hero-p">
            We&apos;ve analyzed your destination, weather patterns, and style preferences to curate your perfect travel wardrobe. Review your personalized preview below.
          </p>
        </div>

        {/* ─── Banner image (21:9) ──────────────────────────────────────────── */}
        <div className="preview-banner">
          {teaserUrl ? (
            <Image
              src={teaserUrl}
              alt="Your travel look teaser"
              fill
              style={{ objectFit: 'cover' }}
              priority
              unoptimized
            />
          ) : (
            <div className="preview-banner-fallback" />
          )}
          {/* Gradient overlay */}
          <div className="preview-banner-overlay" />
          {/* Lookbook UI */}
          <div className="preview-banner-card">
            <p className="preview-banner-card-label">Lookbook Preview</p>
            <div className="preview-banner-progress-track">
              <div className="preview-banner-progress-fill" />
            </div>
            <p className="preview-banner-card-mood">
              {firstVibe?.mood_name ?? 'Your Travel Style'}
            </p>
            {firstVibe?.vibe_tags && firstVibe.vibe_tags.length > 0 && (
              <div className="preview-banner-tags">
                {firstVibe.vibe_tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="preview-banner-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── AI Outfit Preview Grid (2×4) ────────────────────────────────── */}
        <section className="preview-outfits-section">
          <div className="preview-section-header">
            <h2 className="preview-section-title">AI Outfit Preview</h2>
            <span className="preview-section-badge">4 looks curated</span>
          </div>
          <div className="preview-outfit-grid">
            {OUTFIT_IMAGES.map((outfit, i) => (
              <div key={i} className="preview-outfit-card">
                <div className="preview-outfit-img-wrap">
                  <Image
                    src={outfit.src}
                    alt={`${outfit.day} — ${outfit.label}`}
                    fill
                    style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    unoptimized
                    className="preview-outfit-img"
                  />
                  <div className="preview-outfit-img-overlay" />
                </div>
                <div className="preview-outfit-info">
                  <span className="preview-outfit-day">{outfit.day}</span>
                  <span className="preview-outfit-label">{outfit.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Trip Summary ─────────────────────────────────────────────────── */}
        <section className="preview-summary-section">
          <div className="preview-summary-header">
            <h2 className="preview-section-title">Trip Summary</h2>
            <a href="/trip" className="preview-edit-link">EDIT DETAILS ✏</a>
          </div>
          <div className="preview-summary-grid">
            {[
              { label: 'Destination', value: destinationLabel || '—' },
              { label: 'Duration', value: durationLabel },
              { label: 'Aesthetic', value: aestheticLabel },
              { label: 'Weather Focus', value: weatherFocusLabel },
            ].map(({ label, value }) => (
              <div key={label} className="preview-summary-cell">
                <span className="preview-summary-label">{label}</span>
                <p className="preview-summary-value">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing ──────────────────────────────────────────────────────── */}
        <section className="preview-pricing-section">
          <div className="preview-pricing-header">
            <div className="preview-price-anchor">
              <span className="preview-price-anchor-old">Personal stylist: $200+</span>
              <span className="preview-price-anchor-arrow">→</span>
              <span className="preview-price-anchor-new">Travel Capsule AI: from $5</span>
            </div>
            <h2 className="preview-pricing-title">Choose Your Experience</h2>
            <p className="preview-pricing-sub">Select the plan that best fits your travel style.</p>
          </div>

          {paymentError && (
            <p className="preview-payment-error" role="alert">{paymentError}</p>
          )}

          <div className="preview-plan-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`preview-plan-card${plan.highlight ? ' preview-plan-card--highlight' : ''}`}
              >
                {plan.badge && (
                  <span className="preview-plan-badge">{plan.badge}</span>
                )}
                {plan.savingLabel && (
                  <span className="preview-plan-saving">{plan.savingLabel}</span>
                )}

                <div className="preview-plan-price-block">
                  <h3 className="preview-plan-name">{plan.name}</h3>
                  <div className="preview-plan-price-row">
                    <span className="preview-plan-price">{plan.price}</span>
                    <span className="preview-plan-period">{plan.period}</span>
                  </div>
                </div>

                <ul className="preview-plan-features">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="preview-plan-feat">
                      <span className="preview-plan-feat-dot" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={paymentLoading !== null}
                  aria-label={`Select ${plan.name} plan`}
                  className={`preview-plan-cta${plan.highlight ? ' preview-plan-cta--highlight' : ''}`}
                  style={{ opacity: paymentLoading !== null && paymentLoading !== plan.id ? 0.6 : 1 }}
                >
                  {paymentLoading === plan.id ? 'Redirecting...' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="preview-trust">
            <span className="preview-trust-item">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
              Secure checkout via Polar
            </span>
            <span className="preview-trust-item">24h refund guarantee</span>
            <span className="preview-trust-item">Standard &amp; Pro: one-time charge</span>
          </div>
          <p className="preview-renewal-note">
            Annual plan automatically renews at $29/year. Cancel anytime before renewal. Standard and Pro plans are one-time payments with no auto-renewal.
          </p>
        </section>

        {/* ─── Footer quote ─────────────────────────────────────────────────── */}
        <footer className="preview-footer">
          <blockquote className="preview-quote">
            &ldquo;Style is a way to say who you are without having to speak.&rdquo;
          </blockquote>
          <p className="preview-quote-attr">&mdash; Rachel Zoe</p>
          <div className="preview-footer-links">
            {[
              { label: 'Privacy Policy', href: '/legal/privacy' },
              { label: 'Terms of Service', href: '/legal/terms' },
              { label: 'Contact', href: 'mailto:hello@travelscapsule.com' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="preview-footer-link">{label}</a>
            ))}
          </div>
        </footer>
      </main>

      <style jsx global>{`
        .preview-root {
          min-height: 100vh;
          background: #FDF8F3;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1A1410;
        }

        /* ── Header ── */
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px clamp(16px, 4vw, 48px);
          border-bottom: 1px solid rgba(196, 97, 58, 0.12);
          background: rgba(253, 248, 243, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .preview-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #C4613A;
        }
        .preview-logo-text {
          font-size: 17px;
          font-weight: 700;
          color: #1A1410;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .preview-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* ── Main ── */
        .preview-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px clamp(16px, 4vw, 48px) 80px;
        }

        /* ── Hero copy ── */
        .preview-hero-copy {
          text-align: center;
          margin-bottom: 56px;
        }
        .preview-step-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4613A;
          margin-bottom: 20px;
        }
        .preview-h1 {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(36px, 6vw, 64px);
          color: #1A1410;
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .preview-hero-p {
          font-size: 17px;
          color: rgba(26, 20, 16, 0.65);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.75;
        }

        /* ── Banner ── */
        .preview-banner {
          position: relative;
          width: 100%;
          aspect-ratio: 21/9;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 80px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
        }
        .preview-banner-fallback {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1A1410 0%, #3d2b1f 50%, #1A1410 100%);
        }
        .preview-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(26, 20, 16, 0.75) 0%, rgba(26, 20, 16, 0.15) 60%, transparent 100%);
        }
        .preview-banner-card {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          padding: 24px 32px;
          min-width: 280px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        }
        .preview-banner-card-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 10px;
        }
        .preview-banner-progress-track {
          height: 2px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .preview-banner-progress-fill {
          height: 100%;
          width: 75%;
          background: #C4613A;
          border-radius: 9999px;
        }
        .preview-banner-card-mood {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #fff;
          margin-bottom: 12px;
        }
        .preview-banner-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .preview-banner-tag {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.28);
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
        }

        /* ── Section shared ── */
        .preview-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .preview-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #1A1410;
        }
        .preview-section-badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #C4613A;
          background: rgba(196, 97, 58, 0.08);
          padding: 4px 12px;
          border-radius: 9999px;
        }

        /* ── Outfit grid ── */
        .preview-outfits-section {
          margin-bottom: 80px;
        }
        .preview-outfit-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .preview-outfit-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
        }
        .preview-outfit-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          border-radius: 12px;
          overflow: hidden;
          background: #E8E0D5;
        }
        .preview-outfit-img-wrap:hover .preview-outfit-img {
          transform: scale(1.04);
        }
        .preview-outfit-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(26, 20, 16, 0.4) 0%, transparent 60%);
          pointer-events: none;
        }
        .preview-outfit-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .preview-outfit-day {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #C4613A;
        }
        .preview-outfit-label {
          font-size: 14px;
          font-weight: 500;
          color: #1A1410;
        }
        @media (max-width: 640px) {
          .preview-outfit-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Trip summary ── */
        .preview-summary-section {
          margin-bottom: 80px;
          padding-top: 8px;
          border-top: 1px solid rgba(196, 97, 58, 0.1);
        }
        .preview-summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(196, 97, 58, 0.08);
        }
        .preview-edit-link {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #C4613A;
          text-decoration: none;
        }
        .preview-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 32px;
        }
        .preview-summary-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .preview-summary-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #C4613A;
        }
        .preview-summary-value {
          font-size: 20px;
          font-weight: 500;
          color: #1A1410;
        }

        /* ── Pricing ── */
        .preview-pricing-section {
          margin-bottom: 80px;
        }
        .preview-pricing-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .preview-price-anchor {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #1A1410;
          border-radius: 9999px;
          padding: 6px 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .preview-price-anchor-old {
          font-size: 12px;
          color: #9c8c7e;
          text-decoration: line-through;
        }
        .preview-price-anchor-arrow {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }
        .preview-price-anchor-new {
          font-size: 12px;
          font-weight: 700;
          color: #D4AF37;
        }
        .preview-pricing-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: #1A1410;
          margin-bottom: 12px;
        }
        .preview-pricing-sub {
          color: rgba(26, 20, 16, 0.6);
          font-size: 16px;
        }
        .preview-payment-error {
          text-align: center;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .preview-plan-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 767px) {
          .preview-plan-grid {
            grid-template-columns: 1fr;
          }
        }
        .preview-plan-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid rgba(196, 97, 58, 0.12);
          border-radius: 20px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .preview-plan-card:hover {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        .preview-plan-card--highlight {
          background: #C4613A;
          border: none;
          box-shadow: 0 20px 48px rgba(196, 97, 58, 0.35);
          transform: scale(1.03);
        }
        @media (max-width: 767px) {
          .preview-plan-card--highlight {
            transform: none;
          }
        }
        .preview-plan-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(8px);
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #fff;
        }
        .preview-plan-saving {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #C4613A;
          background: rgba(196, 97, 58, 0.1);
          padding: 3px 10px;
          border-radius: 9999px;
          margin-bottom: 12px;
        }
        .preview-plan-price-block {
          margin-bottom: 28px;
        }
        .preview-plan-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .preview-plan-card--highlight .preview-plan-name {
          color: #fff;
        }
        .preview-plan-card:not(.preview-plan-card--highlight) .preview-plan-name {
          color: #1A1410;
        }
        .preview-plan-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .preview-plan-price {
          font-size: 40px;
          font-weight: 700;
        }
        .preview-plan-card--highlight .preview-plan-price { color: #fff; }
        .preview-plan-card:not(.preview-plan-card--highlight) .preview-plan-price { color: #1A1410; }
        .preview-plan-period {
          font-size: 14px;
        }
        .preview-plan-card--highlight .preview-plan-period { color: rgba(255,255,255,0.65); }
        .preview-plan-card:not(.preview-plan-card--highlight) .preview-plan-period { color: rgba(26,20,16,0.5); }
        .preview-plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 28px 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .preview-plan-feat {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        .preview-plan-card--highlight .preview-plan-feat { color: rgba(255,255,255,0.88); }
        .preview-plan-card:not(.preview-plan-card--highlight) .preview-plan-feat { color: rgba(26,20,16,0.75); }
        .preview-plan-feat-dot {
          flex-shrink: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .preview-plan-card--highlight .preview-plan-feat-dot { background: rgba(255,255,255,0.6); }
        .preview-plan-card:not(.preview-plan-card--highlight) .preview-plan-feat-dot { background: #C4613A; }
        .preview-plan-cta {
          width: 100%;
          padding: 15px 0;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: opacity 0.2s, background 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
          border: none;
        }
        .preview-plan-cta--highlight {
          background: #fff;
          color: #C4613A;
        }
        .preview-plan-cta:not(.preview-plan-cta--highlight) {
          background: transparent;
          color: #C4613A;
          border: 1.5px solid #C4613A;
        }
        .preview-plan-cta:not(:disabled):hover {
          opacity: 0.85;
        }
        .preview-plan-cta:disabled {
          cursor: wait;
        }
        .preview-trust {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .preview-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9c8c7e;
        }
        .preview-renewal-note {
          text-align: center;
          font-size: 10px;
          color: rgba(156, 140, 126, 0.65);
          margin-top: 16px;
          line-height: 1.6;
        }

        /* ── Footer ── */
        .preview-footer {
          text-align: center;
          padding: 72px 0 40px;
          border-top: 1px solid rgba(196, 97, 58, 0.1);
        }
        .preview-quote {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 26px;
          color: rgba(26, 20, 16, 0.78);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .preview-quote-attr {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4613A;
          margin-bottom: 48px;
        }
        .preview-footer-links {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .preview-footer-link {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(26, 20, 16, 0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .preview-footer-link:hover {
          color: #C4613A;
        }
      `}</style>
    </div>
  )
}

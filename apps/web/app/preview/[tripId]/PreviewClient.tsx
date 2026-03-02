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

// ─── Plan definitions ────────────────────────────────────────────────────────

const PLANS: Array<{
  id: PlanType
  name: string
  price: string
  period: string
  badge: string | null
  savingLabel: string | null
  features: Array<{ icon: string; text: string; strong?: boolean }>
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
      { icon: 'check_circle', text: 'Weather & Vibe Analysis' },
      { icon: 'check_circle', text: 'City Vibe Card' },
      { icon: 'check_circle', text: '4 AI-Generated Outfits' },
      { icon: 'check_circle', text: '10-Item Capsule List' },
      { icon: 'check_circle', text: 'Day-by-Day Itinerary' },
    ],
    cta: 'Select Standard',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/trip',
    badge: 'MOST POPULAR',
    savingLabel: null,
    features: [
      { icon: 'auto_awesome', text: 'Everything in Standard', strong: true },
      { icon: 'check_circle', text: 'Hero images for ALL cities' },
      { icon: 'check_circle', text: 'Ultra High-Res Visuals' },
      { icon: 'check_circle', text: '1 Free Style Regeneration' },
      { icon: 'check_circle', text: 'Multi-city coordination' },
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
    savingLabel: 'SAVE $115/YEAR',
    features: [
      { icon: 'stars', text: 'Full Pro Experience', strong: true },
      { icon: 'check_circle', text: 'Up to 12 trips per year' },
      { icon: 'check_circle', text: 'Priority AI processing' },
      { icon: 'check_circle', text: 'VIP concierge support' },
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

  // ─── Payment handler ───────────────────────────────────────────────────────

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
      <div style={{ minHeight: '100vh', background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid #F5EFE6', borderTopColor: '#b8552e',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: 14, color: '#9c8c7e', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Analyzing your trip...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>&#128533;</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#1A1410', marginBottom: 8 }}>
            Preview not found
          </h1>
          <p style={{ color: '#9c8c7e', fontSize: 14, marginBottom: 24 }}>
            This preview may have expired. Start a new trip to try again.
          </p>
          <a
            href="/trip"
            style={{
              display: 'inline-block', background: '#b8552e', color: '#fff',
              padding: '12px 24px', borderRadius: 9999, fontWeight: 600,
              fontSize: 14, textDecoration: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Start New Trip
          </a>
        </div>
      </div>
    )
  }

  const firstVibe = data.vibes[0]
  const firstWeather = data.weather[0]
  // Use || instead of ?? so empty string ('') also falls back to null
  const teaserUrl = data.teaser?.teaser_url || null

  // Derive display values from data
  const destinationLabel = data.vibes.map((v) => v.city).join(', ')
  const aestheticLabel = firstVibe?.mood_name?.split('—')[1]?.trim() ?? '—'
  const weatherFocusLabel = firstWeather?.climate_band
    ? firstWeather.climate_band.charAt(0).toUpperCase() + firstWeather.climate_band.slice(1) + ' Layers'
    : '—'
  // Derive month from expires_at (trip is always set to expire ~48h after creation)
  const expiresDate = data.expires_at ? new Date(data.expires_at) : null
  const monthLabel = firstWeather?.style_hint
    ? firstWeather.style_hint.split(' ')[0]
    : expiresDate
      ? MONTH_NAMES[expiresDate.getMonth() + 1] ?? ''
      : ''

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F3', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px clamp(16px, 4vw, 48px)', borderBottom: '1px solid rgba(184, 85, 46, 0.1)',
        background: 'rgba(253, 248, 243, 0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#b8552e' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1A1410', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Travel Capsule AI
          </span>
        </a>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <AuthButton />
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {/* ─── Step indicator + Hero ─────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#b8552e', display: 'block', marginBottom: 16,
          }}>
            Step 4 of 4: Finalizing your journey
          </span>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 7vw, 72px)',
            color: '#1A1410', marginBottom: 24, lineHeight: 1.1,
          }}>
            Your story is ready to unfold.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(26, 20, 16, 0.7)', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            A bespoke itinerary crafted for your unique rhythm. Our AI is curating the perfect aesthetic for your upcoming adventure. Review your details below.
          </p>
        </div>

        {/* ─── Analysis preview card ─────────────────────────────────────────── */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '21/9', borderRadius: 16,
          overflow: 'hidden', marginBottom: 80, boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        }}>
          {/* Background */}
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
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #1A1410 0%, #3d2b1f 50%, #1A1410 100%)',
            }} />
          )}
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(26,20,16,0.8) 0%, transparent 60%)',
          }} />
          {/* Content */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 16,
              padding: '32px', maxWidth: 400, width: '100%', textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#b8552e',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fff' }}>auto_awesome</span>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#fff', marginBottom: 8 }}>
                {firstVibe?.mood_label ?? 'Your Travel Style'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 16 }}>
                {teaserUrl
                  ? 'Your AI-curated travel look is ready below.'
                  : 'AI analysis complete — unlock your full outfit gallery below.'}
              </p>
              {firstVibe?.vibe_tags && firstVibe.vibe_tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {firstVibe.vibe_tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{
                      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                      padding: '4px 12px', borderRadius: 9999,
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.9)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Trip Summary ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32, borderBottom: '1px solid rgba(184,85,46,0.1)', paddingBottom: 16,
          }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#1A1410' }}>
              Trip Summary
            </h2>
            <a
              href="/trip"
              style={{ color: '#b8552e', fontWeight: 700, fontSize: 13, textDecoration: 'none', letterSpacing: '0.05em' }}
            >
              EDIT DETAILS ✏
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#b8552e', fontWeight: 700 }}>
                Destination
              </span>
              <p style={{ fontSize: 20, fontWeight: 500, color: '#1A1410' }}>
                {destinationLabel || '—'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#b8552e', fontWeight: 700 }}>
                Duration
              </span>
              <p style={{ fontSize: 20, fontWeight: 500, color: '#1A1410' }}>
                {firstWeather?.climate_band
                  ? firstWeather.climate_band.charAt(0).toUpperCase() + firstWeather.climate_band.slice(1) + ' climate'
                  : monthLabel || '—'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#b8552e', fontWeight: 700 }}>
                Aesthetic
              </span>
              <p style={{ fontSize: 20, fontWeight: 500, color: '#1A1410' }}>
                {aestheticLabel}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#b8552e', fontWeight: 700 }}>
                Weather Focus
              </span>
              <p style={{ fontSize: 20, fontWeight: 500, color: '#1A1410' }}>
                {weatherFocusLabel}
              </p>
            </div>
          </div>
        </section>

        {/* ─── Pricing Section ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {/* Price anchor — the most important conversion element */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#1A1410', borderRadius: 9999,
              padding: '6px 20px', marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, color: '#9c8c7e', textDecoration: 'line-through' }}>Personal stylist: $200+</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>→</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>
                Travel Capsule AI: from $5
              </span>
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, color: '#1A1410', marginBottom: 16 }}>
              Choose Your Experience
            </h2>
            <p style={{ color: 'rgba(26,20,16,0.6)', fontSize: 16 }}>
              Select the plan that best fits your travel style.
            </p>
          </div>

          {paymentError && (
            <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14, marginBottom: 16 }} role="alert">
              {paymentError}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, alignItems: 'stretch' }}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: plan.highlight ? '#b8552e' : '#fff',
                  border: plan.highlight ? 'none' : '1px solid rgba(184,85,46,0.1)',
                  borderRadius: 16, padding: 32,
                  boxShadow: plan.highlight ? '0 25px 50px rgba(184,85,46,0.3)' : undefined,
                  transform: plan.highlight ? 'scale(1.05)' : undefined,
                  position: 'relative', overflow: 'hidden',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Most Popular badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    padding: '4px 12px', borderRadius: 9999,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#fff',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Price block */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: plan.highlight ? '#fff' : '#1A1410' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 700, color: plan.highlight ? '#fff' : '#1A1410' }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.7)' : 'rgba(26,20,16,0.5)' }}>
                      {plan.period}
                    </span>
                  </div>
                  {plan.savingLabel && (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b8552e' }}>
                      {plan.savingLabel}
                    </div>
                  )}
                </div>

                {/* Feature list */}
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32, flex: 1, listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: plan.highlight ? '#fff' : '#b8552e', flexShrink: 0, lineHeight: 1.4 }}
                      >
                        {feat.icon}
                      </span>
                      {feat.strong ? (
                        <strong style={{ color: plan.highlight ? '#fff' : '#1A1410' }}>{feat.text}</strong>
                      ) : (
                        <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : 'rgba(26,20,16,0.75)' }}>{feat.text}</span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={paymentLoading !== null}
                  aria-label={`Select ${plan.name} plan`}
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 8, fontWeight: 700, fontSize: 15,
                    cursor: paymentLoading !== null ? 'wait' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: paymentLoading !== null && paymentLoading !== plan.id ? 0.6 : 1,
                    ...(plan.highlight
                      ? { background: '#fff', color: '#b8552e', border: 'none' }
                      : { background: 'transparent', color: '#b8552e', border: '1.5px solid #b8552e' }
                    ),
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {paymentLoading === plan.id ? 'Redirecting...' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9c8c7e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
              Secure checkout via Polar
            </span>
            <span style={{ fontSize: 12, color: '#9c8c7e' }}>24h refund guarantee</span>
            <span style={{ fontSize: 12, color: '#9c8c7e' }}>Standard & Pro: one-time charge</span>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(156,140,126,0.6)', marginTop: 16, lineHeight: 1.6 }}>
            Annual plan automatically renews at $29/year. Cancel anytime before renewal. Standard and Pro plans are one-time payments with no auto-renewal.
          </p>
        </section>

        {/* ─── Footer quote ──────────────────────────────────────────────────── */}
        <footer style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid rgba(184,85,46,0.1)' }}>
          <blockquote style={{
            fontFamily: 'Playfair Display, serif', fontSize: 28, fontStyle: 'italic',
            color: 'rgba(26,20,16,0.8)', marginBottom: 24,
          }}>
            &ldquo;Style is a way to say who you are without having to speak.&rdquo;
          </blockquote>
          <p style={{ color: '#b8552e', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            &mdash; Rachel Zoe
          </p>
          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '/legal/privacy' },
              { label: 'Terms of Service', href: '/legal/terms' },
              { label: 'Contact', href: 'mailto:hello@travelscapsule.com' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'rgba(26,20,16,0.4)', textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  )
}

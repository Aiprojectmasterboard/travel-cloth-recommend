'use client'

import { useEffect, useState } from 'react'
import AuthButton from '@/components/AuthButton'
import ProgressChecklist from '@/components/funnel/ProgressChecklist'
import WeatherCard from '@/components/funnel/WeatherCard'
import VibeCard from '@/components/funnel/VibeCard'
import CapsuleEstimator from '@/components/funnel/CapsuleEstimator'
import TeaserGrid from '@/components/funnel/TeaserGrid'
import EmailCapture from '@/components/funnel/EmailCapture'
import PaywallModal from '@/components/funnel/PaywallModal'
import { getPreview } from '@/lib/api'
import type { PreviewResponse } from '../../../../../packages/types'

export default function PreviewClient({ tripId }: { tripId: string }) {
  const [data, setData] = useState<PreviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  useEffect(() => {
    getPreview(tripId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tripId])

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#F5EFE6] border-t-[#b8552e] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#9c8c7e]">Analyzing your trip...</p>
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-5xl mb-4">&#128533;</p>
          <h1
            className="text-2xl font-bold text-[#1A1410] mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Preview not found
          </h1>
          <p className="text-[#9c8c7e] text-sm mb-6">
            This preview may have expired. Start a new trip to try again.
          </p>
          <a
            href="/trip"
            className="inline-block bg-[#b8552e] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#a34828] transition-colors"
          >
            Start New Trip
          </a>
        </div>
      </div>
    )
  }

  const firstVibe = data.vibes[0]

  // ─── Main preview ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-[#FDF8F3]/95 backdrop-blur-sm border-b border-[#F5EFE6] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="font-bold text-[#1A1410] text-lg"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Travel <span className="italic text-[#b8552e]">Capsule</span> AI
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaywallOpen(true)}
              className="bg-[#b8552e] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#a34828] transition-colors"
            >
              Unlock Full Results
            </button>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress checklist */}
        <section>
          <ProgressChecklist completedSteps={4} />
        </section>

        {/* Mood headline */}
        {firstVibe && (
          <section className="text-center py-4">
            <p className="text-xs uppercase tracking-widest text-[#9c8c7e] font-medium mb-2">
              Your Travel Vibe
            </p>
            <h1
              className="text-3xl font-bold italic"
              style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37' }}
            >
              {firstVibe.mood_name}
            </h1>
          </section>
        )}

        {/* Teaser grid */}
        <section>
          <TeaserGrid
            teaserUrl={data.teaser.teaser_url}
            expiresAt={data.expires_at}
            onUnlock={() => setPaywallOpen(true)}
          />
        </section>

        {/* Weather cards */}
        {data.weather.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-wider text-[#9c8c7e] font-medium mb-3">
              Weather Report
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.weather.map((w) => (
                <WeatherCard
                  key={w.city}
                  city={w.city}
                  climateband={w.climate_band}
                  tempDay={w.temperature_day_avg}
                  tempNight={w.temperature_night_avg}
                  rainPct={w.precipitation_prob}
                />
              ))}
            </div>
          </section>
        )}

        {/* Vibe cards */}
        {data.vibes.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-wider text-[#9c8c7e] font-medium mb-3">
              City Vibes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.vibes.map((v) => (
                <VibeCard
                  key={v.city}
                  city={v.city}
                  moodName={v.mood_name}
                  vibeTags={v.vibe_tags}
                  colorPalette={v.color_palette}
                  avoidNote={v.avoid_note}
                />
              ))}
            </div>
          </section>
        )}

        {/* Capsule estimator */}
        {data.capsule.count !== undefined && data.capsule.principles && (
          <section>
            <CapsuleEstimator
              count={data.capsule.count}
              principles={data.capsule.principles}
            />
          </section>
        )}

        {/* Email capture */}
        <section>
          <EmailCapture tripId={tripId} />
        </section>

        {/* Paywall CTA */}
        <section className="py-6 text-center">
          <p className="text-sm text-[#9c8c7e] mb-4">Ready to see your full travel capsule?</p>
          <button
            onClick={() => setPaywallOpen(true)}
            className="inline-flex items-center gap-2 bg-[#1A1410] text-white px-8 py-4 rounded-full font-semibold text-base hover:bg-[#2a2015] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Unlock Full Results — from $5
          </button>
          <p className="text-xs text-[#9c8c7e] mt-3">No subscription · 24h refund guarantee</p>
        </section>
      </main>

      <footer className="border-t border-[#F5EFE6] py-6 text-center">
        <p className="text-xs text-[#9c8c7e]">
          &copy; {new Date().getFullYear()} Travel Capsule AI
        </p>
      </footer>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        tripId={tripId}
      />
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ShareModal from '@/components/ShareModal'
import UpgradeModal from '@/components/funnel/UpgradeModal'
import AuthButton from '@/components/AuthButton'
import { Trip, DEMO_OUTFIT_IMAGES } from './result-types'
import StandardView from './views/StandardView'
import ProView from './views/ProView'
import AnnualView from './views/AnnualView'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''

// ─── Plan Badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan?: 'standard' | 'pro' | 'annual' }) {
  if (plan === 'annual') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(251,191,36,0.15) 100%)', borderColor: 'rgba(212,175,55,0.4)', color: '#C8A055' }}
      >
        <span className="material-symbols-outlined !text-sm">workspace_premium</span>
        Annual Member
      </div>
    )
  }
  if (plan === 'pro') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#C8A055] text-xs font-bold uppercase tracking-wide">
        <span className="material-symbols-outlined !text-sm">diamond</span>
        Pro Plan
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wide">
      Standard Access
    </div>
  )
}

// ─── Processing View ──────────────────────────────────────────────────────────

function ProcessingView({ trip }: { trip: Trip }) {
  const completed = trip.generation_jobs.filter(j => j.status === 'completed').length
  const total = Math.max(trip.generation_jobs.length, 1)
  const progress = Math.round((completed / total) * 100)

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <p className="text-xs uppercase tracking-[0.15em] text-primary font-bold mb-4">Creating Your Capsule</p>
        <h1 className="font-playfair text-4xl text-secondary mb-3 leading-tight">
          Styling Your <span className="italic text-primary">Journey</span>
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          Your personalized travel wardrobe is being crafted by AI.
        </p>

        <div className="bg-sand rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted mb-8">{completed} / {total} items generated ({progress}%)</p>

        <div className="space-y-3 text-left">
          {trip.generation_jobs.map(job => (
            <div
              key={job.id}
              className="flex items-center gap-3 px-4 py-3 bg-cream rounded-xl border border-[#ebdcd5] text-sm"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${
                job.status === 'completed' ? 'bg-green-600'
                : job.status === 'processing' ? 'bg-primary animate-pulse'
                : 'bg-sand'
              }`}>
                {job.status === 'completed' ? '✓' : job.status === 'processing' ? '→' : ''}
              </span>
              <span className="text-secondary font-medium">{job.city}</span>
              <span className="text-muted">— {job.mood}</span>
              <span className={`ml-auto text-xs ${
                job.status === 'completed' ? 'text-green-600'
                : job.status === 'processing' ? 'text-primary'
                : 'text-muted'
              }`}>
                {job.status === 'completed' ? 'Done'
                : job.status === 'processing' ? 'Generating…'
                : 'Waiting'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Error View ───────────────────────────────────────────────────────────────

function ErrorView({ tripId }: { tripId: string }) {
  return (
    <div className="text-center py-32 px-6">
      <p className="text-5xl mb-4">😕</p>
      <h1 className="font-playfair text-3xl text-secondary mb-3">Trip not found</h1>
      <p className="text-muted mb-8 leading-relaxed">
        Trip ID: {tripId}
        <br />
        This trip may have expired or doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
      >
        Back to Home
      </a>
    </div>
  )
}

// ─── Gallery (Result) View — plan router ──────────────────────────────────────

function GalleryView({ trip, tripId }: { trip: Trip; tripId: string }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | undefined>()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Show upgrade modal after 2-second delay if an upgrade token is present
  useEffect(() => {
    if (!trip.upgrade_token) return
    const timer = setTimeout(() => setUpgradeOpen(true), 2000)
    return () => clearTimeout(timer)
  }, [trip.upgrade_token])

  function openShare(url?: string | null) {
    setSharePreviewUrl(url ?? undefined)
    setShareOpen(true)
  }

  const cityNames = trip.cities.map(c => c.name)

  return (
    <div>
      {trip.plan === 'annual' ? (
        <AnnualView trip={trip} tripId={tripId} onShare={openShare} />
      ) : trip.plan === 'pro' ? (
        <ProView trip={trip} tripId={tripId} onShare={openShare} />
      ) : (
        <StandardView trip={trip} tripId={tripId} onShare={openShare} />
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={tripId}
        cities={cityNames}
        month={trip.month}
        previewImageUrl={sharePreviewUrl}
      />

      {trip.upgrade_token && (
        <UpgradeModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          tripId={tripId}
          upgradeToken={trip.upgrade_token}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultClient({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSavePDF = useCallback(() => {
    window.print()
  }, [])

  const fetchTrip = useCallback(async () => {
    if (!WORKER_URL) {
      // Demo mode — uses reference design data
      setTrip({
        id: tripId,
        status: 'completed',
        plan: 'standard',
        face_url: null,
        vibe_description: 'Paris in October exudes effortless sophistication. Golden leaves line cobblestone streets as locals layer cashmere and structured trench coats against the crisp autumn breeze.',
        user_name: 'Traveler',
        trips_remaining: 11,
        cities: [{ name: 'Paris', days: 4 }, { name: 'Rome', days: 3 }],
        month: 'Autumn',
        generation_jobs: [
          { id: '1', city: 'Paris', mood: 'Louvre Visit', image_url: DEMO_OUTFIT_IMAGES[0], status: 'completed' },
          { id: '2', city: 'Paris', mood: 'Seine Dinner Cruise', image_url: DEMO_OUTFIT_IMAGES[1], status: 'completed' },
          { id: '3', city: 'Rome', mood: 'Le Marais Shopping', image_url: DEMO_OUTFIT_IMAGES[2], status: 'completed' },
        ],
        wardrobe_items: [
          { emoji: '🧥', name: 'Camel Trench', cities: 'Paris · Rome' },
          { emoji: '👗', name: 'Silk Slip Dress', cities: 'Paris Evening' },
          { emoji: '👕', name: 'Cashmere Knit', cities: 'All Days' },
          { emoji: '👟', name: 'Leather Boots', cities: 'Paris · Rome' },
          { emoji: '👕', name: 'White Shirt', cities: 'All Days' },
          { emoji: '👖', name: 'Tailored Trousers', cities: 'Paris · Rome' },
          { emoji: '🧥', name: 'Wool Blazer', cities: 'Evening' },
          { emoji: '👡', name: 'Loafers', cities: 'Day Use' },
          { emoji: '👜', name: 'Crossbody Bag', cities: 'All Days' },
          { emoji: '🧣', name: 'Statement Scarf', cities: 'Accessory' },
        ],
        daily_plan: [
          { day: 1, city: 'Paris', outfit: 'Camel Trench + White Shirt + Tailored Trousers', activities: ['Louvre', 'Champs-Élysées'] },
          { day: 2, city: 'Paris', outfit: 'Silk Slip Dress + Wool Blazer', activities: ['Seine Dinner Cruise'] },
          { day: 3, city: 'Rome', outfit: 'Cashmere Knit + Trousers + Loafers', activities: ['Colosseum', 'Shopping'] },
        ],
        created_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/result/${tripId}`)
      // 402 = payment required (no order found) — redirect to preview/paywall
      if (res.status === 402) { router.push(`/preview/${tripId}`); return }
      if (!res.ok) { setError(true); setLoading(false); return }
      const data: Trip = await res.json()
      setTrip(data)
      setLoading(false)
      // Keep polling while queued ('pending') or actively generating ('processing')
      if (data.status === 'pending' || data.status === 'processing') {
        pollingRef.current = setTimeout(fetchTrip, 3000)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [tripId, router])

  useEffect(() => {
    fetchTrip()
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current) }
  }, [fetchTrip])

  const isGenerating = trip?.status === 'pending' || trip?.status === 'processing'
  const isFailed = trip?.status === 'failed'

  return (
    <>
      <style>{`
        @media print {
          header, nav, button, .no-print { display: none !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#ebdcd5] bg-cream/95 backdrop-blur-sm px-6 py-4 md:px-10">
        <div className="flex items-center gap-3 text-secondary">
          <span className="material-symbols-outlined text-primary !text-[28px]">flight_takeoff</span>
          <h2 className="font-sans text-lg font-bold leading-tight tracking-tight">Travel Capsule AI</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            <a href="/" className="text-secondary hover:text-primary transition-colors text-sm font-medium">Home</a>
            <a href="/trip" className="text-secondary hover:text-primary transition-colors text-sm font-medium">New Trip</a>
          </nav>
          {trip && <PlanBadge plan={trip.plan} />}
          <button
            onClick={handleSavePDF}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-secondary/20 text-secondary hover:border-primary hover:text-primary px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <span className="material-symbols-outlined !text-base">download</span>
            Save PDF
          </button>
          <AuthButton />
        </div>
        <button className="md:hidden text-secondary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1440px] mx-auto">
        {loading && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-sand border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted">Preparing your capsule…</p>
            </div>
          </div>
        )}
        {error && <ErrorView tripId={tripId} />}
        {!loading && !error && trip && isFailed && <ErrorView tripId={tripId} />}
        {!loading && !error && trip && isGenerating && <ProcessingView trip={trip} />}
        {!loading && !error && trip && !isGenerating && !isFailed && <GalleryView trip={trip} tripId={tripId} />}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#ebdcd5] py-12 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-primary !text-[20px]">flight_takeoff</span>
            <span className="font-sans font-bold">Travel Capsule AI</span>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <a href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/legal/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="mailto:support@travelscapsule.com" className="hover:text-primary transition-colors">Support</a>
          </div>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Travel Capsule AI</p>
        </div>
      </footer>
    </>
  )
}

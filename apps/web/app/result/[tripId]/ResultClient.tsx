'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import ShareModal from '@/components/ShareModal'
import { useLanguage } from '@/components/LanguageContext'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''

// ─── Types ───

interface GenerationJob {
  id: string
  city: string
  mood: string
  image_url: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface WardrobeItem {
  emoji: string
  name: string
  cities: string
}

interface DailyPlan {
  day: number
  date?: string
  city: string
  outfit: string
  activities: string[]
}

interface Trip {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  cities: { name: string; days: number }[]
  month: string
  generation_jobs: GenerationJob[]
  wardrobe_items?: WardrobeItem[]
  daily_plan?: DailyPlan[]
  created_at: string
}

// ─── Sub-components ───

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--terracotta)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ProcessingView({ trip }: { trip: Trip }) {
  const { t } = useLanguage()
  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed').length
  const totalJobs = trip.generation_jobs.length
  const progress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0

  const titleLines = t.result.processing.title.split('\n')

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
      <p
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--terracotta)',
          marginBottom: '1rem',
        }}
      >
        {t.result.processing.label}
      </p>
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--ink)',
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}
      >
        {titleLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < titleLines.length - 1 && <br />}
          </span>
        ))}
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
        {t.result.processing.sub}
      </p>

      <div
        style={{
          background: 'var(--sand)',
          borderRadius: 8,
          height: 6,
          marginBottom: '0.8rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--terracotta)',
            borderRadius: 8,
            width: `${progress}%`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
        {completedJobs} / {totalJobs} {t.result.processing.completed} ({progress}%)
      </p>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {trip.generation_jobs.map(job => (
          <div
            key={job.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.7rem 1rem',
              background: 'var(--warm-white)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              fontSize: '0.88rem',
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background:
                  job.status === 'completed'
                    ? '#5B8C5A'
                    : job.status === 'processing'
                    ? 'var(--terracotta)'
                    : 'var(--sand)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: 'white',
                flexShrink: 0,
                border: job.status === 'processing' ? '2px solid var(--terracotta)' : 'none',
                animation: job.status === 'processing' ? 'pulse 1.5s infinite' : 'none',
              }}
            >
              {job.status === 'completed' ? '✓' : job.status === 'processing' ? '→' : ''}
            </span>
            <span style={{ color: 'var(--ink)' }}>{job.city}</span>
            <span style={{ color: 'var(--muted)' }}>— {job.mood}</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                color:
                  job.status === 'completed'
                    ? '#5B8C5A'
                    : job.status === 'processing'
                    ? 'var(--terracotta)'
                    : 'var(--muted)',
              }}
            >
              {job.status === 'completed'
                ? t.result.processing.status.completed
                : job.status === 'processing'
                ? t.result.processing.status.processing
                : t.result.processing.status.waiting}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}

function GalleryView({ trip }: { trip: Trip }) {
  const { t } = useLanguage()
  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed' && j.image_url)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | undefined>()
  const cityNames = trip.cities.map(c => c.name)
  const firstImage = completedJobs[0]?.image_url ?? undefined

  function openShare(imageUrl?: string | null) {
    setSharePreviewUrl(imageUrl ?? firstImage)
    setShareOpen(true)
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Hero */}
      <div
        style={{
          background: 'var(--ink)',
          color: 'white',
          padding: '5rem 2rem 4rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '1rem',
          }}
        >
          {t.result.gallery.label}
        </p>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}
        >
          {t.result.gallery.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
          {trip.cities.map(c => `${c.name} ${c.days}박`).join(' + ')} · {trip.month}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => openShare()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--gold)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: 50,
              padding: '0.8rem 1.8rem',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {t.result.gallery.shareBtn}
          </button>
        </div>
      </div>

      {/* Image Grid */}
      {completedJobs.length > 0 && (
        <section style={{ padding: '4rem 0', background: 'var(--cream)' }}>
          <div className="container">
            <p className="section-label">{t.result.wardrobe.label}</p>
            <h2 className="section-title">{t.result.gallery.title}</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.2rem',
                marginTop: '2rem',
              }}
            >
              {completedJobs.map(job => (
                <div
                  key={job.id}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--sand)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = ''
                    el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ aspectRatio: '3/4', position: 'relative', background: '#d4cbc0' }}>
                    {job.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.image_url}
                        alt={`${job.city} ${job.mood} travel outfit`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(253,250,246,0.9)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 4,
                        color: 'var(--ink)',
                        fontWeight: 500,
                      }}
                    >
                      {job.mood}
                    </div>
                    <button
                      onClick={() => openShare(job.image_url)}
                      title={t.result.gallery.shareBtn}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'rgba(253,250,246,0.92)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
                    >
                      ↗
                    </button>
                  </div>
                  <div style={{ padding: '0.9rem' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                        marginBottom: '0.2rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {job.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Capsule Wardrobe */}
      {trip.wardrobe_items && trip.wardrobe_items.length > 0 && (
        <section style={{ padding: '4rem 0', background: 'var(--warm-white)' }}>
          <div className="container">
            <p className="section-label">{t.result.wardrobe.label}</p>
            <h2 className="section-title">{t.result.wardrobe.title}</h2>
            <div className="capsule-grid">
              {trip.wardrobe_items.map((item, i) => (
                <div key={i} className="capsule-item">
                  <div className="capsule-emoji">{item.emoji}</div>
                  <div className="capsule-name">{item.name}</div>
                  <div className="capsule-cities">{item.cities}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Daily Plan */}
      {trip.daily_plan && trip.daily_plan.length > 0 && (
        <section style={{ padding: '4rem 0', background: 'var(--cream)' }}>
          <div className="container">
            <p className="section-label">{t.result.dailyPlan.label}</p>
            <h2 className="section-title">{t.result.dailyPlan.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              {trip.daily_plan.map(plan => (
                <div
                  key={plan.day}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    background: 'var(--warm-white)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: 'var(--terracotta)',
                        lineHeight: 1,
                      }}
                    >
                      {plan.day}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                      {t.result.dailyPlan.day}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                      {plan.city}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: 'var(--ink)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {plan.outfit}
                    </div>
                    {plan.activities && plan.activities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {plan.activities.map((act, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.72rem',
                              background: 'var(--sand)',
                              color: 'var(--muted)',
                              padding: '3px 10px',
                              borderRadius: 50,
                              border: '1px solid var(--border)',
                            }}
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Share CTA */}
      <section style={{ padding: '4rem 0', background: 'var(--sand)', textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title">{t.result.shareCta.title}</h2>
          <p className="section-sub" style={{ margin: '0 auto 2rem' }}>
            {t.result.shareCta.sub}
          </p>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => openShare()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--terracotta)',
                color: 'white',
                border: 'none',
                borderRadius: 50,
                padding: '0.9rem 2rem',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#b3582f' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--terracotta)' }}
            >
              📤 {t.result.gallery.shareBtn}
            </button>
            <button
              onClick={() => {
                const citiesStr = cityNames.slice(0, 2).join(' + ')
                const city0 = cityNames[0] ?? ''
                // use a neutral tweet for this locale
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`AI-styled outfits for ${citiesStr} — Travel Capsule AI\n#TravelCapsuleAI`)}&url=${encodeURIComponent(window.location.href)}`
                window.open(url, '_blank', 'width=600,height=500')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#000',
                color: 'white',
                border: 'none',
                borderRadius: 50,
                padding: '0.9rem 2rem',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              {t.result.gallery.twitterBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Sticky mobile share bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 150,
          background: 'var(--ink)',
          padding: '0.9rem 1.4rem calc(0.9rem + env(safe-area-inset-bottom))',
          display: 'flex',
          gap: '0.7rem',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
        className="sticky-share-bar"
      >
        <div style={{ flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: '0.1rem' }}>
            {t.result.stickyBar.myStyle}
          </p>
          <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500 }}>
            {cityNames.slice(0, 2).join(' + ')} · {trip.month}
          </p>
        </div>
        <button
          onClick={() => openShare()}
          style={{
            background: 'var(--gold)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: 50,
            padding: '0.65rem 1.4rem',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {t.result.stickyBar.shareBtn}
        </button>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={trip.id}
        cities={cityNames}
        month={trip.month}
        previewImageUrl={sharePreviewUrl}
      />

      <style>{`
        @media (min-width: 768px) {
          .sticky-share-bar { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function ErrorView({ tripId }: { tripId: string }) {
  const { t } = useLanguage()
  return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</p>
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '2rem',
          color: 'var(--ink)',
          marginBottom: '1rem',
        }}
      >
        {t.result.error.title}
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
        Trip ID: {tripId}
        <br />
        {t.result.error.sub}
      </p>
      <a
        href="/"
        style={{
          display: 'inline-block',
          background: 'var(--terracotta)',
          color: 'white',
          padding: '0.8rem 1.8rem',
          borderRadius: 50,
          textDecoration: 'none',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 500,
        }}
      >
        {t.result.error.home}
      </a>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function ResultClient({ tripId }: { tripId: string }) {
  const { t } = useLanguage()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!WORKER_URL) {
      // Demo mode
      setTrip({
        id: tripId,
        status: 'completed',
        cities: [{ name: 'Paris', days: 4 }, { name: 'Rome', days: 3 }],
        month: '5월',
        generation_jobs: [
          { id: '1', city: 'Paris', mood: 'Café Morning', image_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&q=70', status: 'completed' },
          { id: '2', city: 'Paris', mood: 'Sightseeing', image_url: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=400&q=70', status: 'completed' },
          { id: '3', city: 'Rome', mood: 'Evening Walk', image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=70', status: 'completed' },
          { id: '4', city: 'Rome', mood: 'Street Style', image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=70', status: 'completed' },
        ],
        wardrobe_items: [
          { emoji: '🧥', name: 'Linen Trench', cities: 'Paris · Rome · Travel Days' },
          { emoji: '👕', name: 'White Tee ×2', cities: 'All Days' },
          { emoji: '👖', name: 'Tailored Pants', cities: 'Paris · Rome · Evening' },
          { emoji: '👗', name: 'Midi Slip Dress', cities: 'Rome · Café · Evening' },
          { emoji: '👟', name: 'White Sneakers', cities: 'All Days · Sightseeing' },
          { emoji: '👡', name: 'Block Heel Mules', cities: 'Evening · Café' },
        ],
        daily_plan: [
          { day: 1, city: 'Paris', outfit: 'Linen Trench + White Tee + Tailored Pants', activities: ['Champs-Élysées', 'Louvre'] },
          { day: 2, city: 'Paris', outfit: 'Stripe Shirt + Wide Jeans + White Sneakers', activities: ['Eiffel Tower', 'Le Marais'] },
          { day: 3, city: 'Rome', outfit: 'Midi Slip Dress + Block Heel Mules', activities: ['Colosseum', 'Trevi Fountain'] },
          { day: 4, city: 'Rome', outfit: 'White Tee + Tailored Pants + Crossbody Bag', activities: ['Vatican Museums', 'Pantheon'] },
        ],
        created_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/trips/${tripId}`)
      if (!res.ok) {
        setError(true)
        setLoading(false)
        return
      }
      const data: Trip = await res.json()
      setTrip(data)
      setLoading(false)

      if (data.status === 'processing' || data.status === 'pending') {
        pollingRef.current = setTimeout(() => fetchTrip(), 2000)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [fetchTrip])

  const isProcessing = trip?.status === 'processing' || trip?.status === 'pending'

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.2rem 2.5rem',
          background: 'rgba(253,250,246,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.3rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          Travel{' '}
          <span style={{ color: 'var(--terracotta)', fontStyle: 'italic' }}>Capsule</span> AI
        </a>
        <a href="/" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>
          {t.result.homeLink}
        </a>
      </header>

      <main style={{ paddingTop: 70 }}>
        {loading && <Spinner />}
        {error && <ErrorView tripId={tripId} />}
        {!loading && !error && trip && isProcessing && <ProcessingView trip={trip} />}
        {!loading && !error && trip && !isProcessing && <GalleryView trip={trip} />}
      </main>

      <footer
        style={{
          background: 'var(--ink)',
          color: 'rgba(255,255,255,0.4)',
          padding: '2.5rem 0',
          textAlign: 'center',
          fontSize: '0.82rem',
        }}
      >
        <p>{t.footer.copyright}</p>
      </footer>
    </>
  )
}

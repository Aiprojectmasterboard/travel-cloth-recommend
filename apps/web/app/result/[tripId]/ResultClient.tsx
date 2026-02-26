'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

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
  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed').length
  const totalJobs = trip.generation_jobs.length
  const progress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0

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
        AI 스타일링 진행 중
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
        여행 스타일을<br />
        생성하고 있어요
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
        도시별 날씨와 분위기를 분석해 코디 이미지를 만드는 중입니다. 보통 2–4분 소요됩니다.
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
        {completedJobs} / {totalJobs} 이미지 완성 ({progress}%)
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
              {job.status === 'completed' ? '완료' : job.status === 'processing' ? '생성 중' : '대기 중'}
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
  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed' && j.image_url)

  async function handleShare() {
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Travel Capsule AI — 내 여행 스타일',
          text: 'AI가 만들어준 여행 코디를 확인해보세요!',
          url,
        })
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('링크가 클립보드에 복사됐습니다!')
      } catch {
        alert('링크를 복사해주세요: ' + url)
      }
    }
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
          Travel Capsule AI
        </p>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}
        >
          여행 스타일 갤러리
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
            onClick={handleShare}
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
            공유하기 →
          </button>
        </div>
      </div>

      {/* Image Grid */}
      {completedJobs.length > 0 && (
        <section style={{ padding: '4rem 0', background: 'var(--cream)' }}>
          <div className="container">
            <p className="section-label">AI 코디 이미지</p>
            <h2 className="section-title">도시별 스타일 갤러리</h2>
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
            <p className="section-label">Capsule Wardrobe</p>
            <h2 className="section-title">나의 여행 캡슐 워드로브</h2>
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
            <p className="section-label">Daily Plan</p>
            <h2 className="section-title">데일리 아웃핏 플랜</h2>
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
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.3rem' }}>DAY</div>
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
          <h2 className="section-title">친구에게 공유해보세요</h2>
          <p className="section-sub" style={{ margin: '0 auto 2rem' }}>
            이 갤러리 링크를 공유하면 누구나 볼 수 있어요.
          </p>
          <button
            onClick={handleShare}
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
          >
            갤러리 공유하기 →
          </button>
        </div>
      </section>
    </div>
  )
}

function ErrorView({ tripId }: { tripId: string }) {
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
        결과를 불러올 수 없어요
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
        Trip ID: {tripId}
        <br />
        잠시 후 다시 시도하거나 지원팀에 문의해주세요.
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
        홈으로 돌아가기
      </a>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function ResultClient({ tripId }: { tripId: string }) {
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
          { emoji: '🧥', name: '리넨 트렌치', cities: '파리 · 로마 · 이동일' },
          { emoji: '👕', name: '화이트 티 ×2', cities: '전 일정' },
          { emoji: '👖', name: '테일러드 팬츠', cities: '파리 · 로마 · 저녁' },
          { emoji: '👗', name: '미디 슬립 드레스', cities: '로마 · 카페 · 저녁' },
          { emoji: '👟', name: '화이트 스니커즈', cities: '전 일정 · 관광' },
          { emoji: '👡', name: '블록힐 뮬', cities: '저녁 · 카페' },
        ],
        daily_plan: [
          { day: 1, city: 'Paris', outfit: '리넨 트렌치 + 화이트 티 + 테일러드 팬츠', activities: ['샹젤리제 산책', '루브르 박물관'] },
          { day: 2, city: 'Paris', outfit: '스트라이프 셔츠 + 와이드 진 + 화이트 스니커즈', activities: ['에펠탑', '마레 지구 카페'] },
          { day: 3, city: 'Rome', outfit: '미디 슬립 드레스 + 블록힐 뮬', activities: ['콜로세움', '트레비 분수'] },
          { day: 4, city: 'Rome', outfit: '화이트 티 + 테일러드 팬츠 + 크로스바디백', activities: ['바티칸 박물관', '판테온'] },
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
          ← 홈으로
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
        <p>© 2025 Travel Capsule AI · Powered by NanoBanana · 결제: Polar</p>
      </footer>
    </>
  )
}

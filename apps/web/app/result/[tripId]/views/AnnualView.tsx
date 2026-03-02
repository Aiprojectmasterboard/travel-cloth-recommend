'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { regenerateOutfit } from '@/lib/api'
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type CityOutfitSet,
} from '@/lib/outfitGenerator'
import {
  AnnualBadge,
  TagChip,
  AiGeneratedBadge,
  SizeChip,
  ProfileBadge,
  TripUsageBar,
  WeatherWidget,
} from '@/components/travel-capsule'
import {
  type ViewProps,
  DEMO_OUTFIT_IMAGES,
  PAST_TRIPS,
  STYLE_DNA_SEGMENTS,
  getCityFlag,
  getMonthName,
} from '../result-types'

// ─── Static images ─────────────────────────────────────────────────────────────

const CITY_HEROES: Record<string, string> = {
  tokyo: 'https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  milan: 'https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  seoul: 'https://images.unsplash.com/photo-1670735411734-c9725326de3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  paris: 'https://images.unsplash.com/photo-1577056922428-a511301a562d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  rome: 'https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  barcelona: 'https://images.unsplash.com/photo-1633378532456-103a55a27261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
}

// ─── Local helpers ──────────────────────────────────────────────────────────────

function DonutChart({ percent, size = 100, stroke = 10 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE8DF" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C4613A" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="#292524" fontSize={20} fontFamily="var(--font-display, 'Playfair Display', serif)" fontWeight={700}>
        {percent}%
      </text>
    </svg>
  )
}

function BarStat({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#292524', fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>{percent}%</span>
      </div>
      <div style={{ width: '100%', height: 5, background: '#EFE8DF', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: '#C4613A', borderRadius: 9999 }} />
      </div>
    </div>
  )
}

// ─── AnnualView ─────────────────────────────────────────────────────────────────

export default function AnnualView({ trip, tripId, onShare }: ViewProps) {
  const cities = trip.cities ?? []
  const month = getMonthName(trip.month)

  const [activeCity, setActiveCity] = useState(0)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenCount, setRegenCount] = useState(0)
  const [regenImageUrl, setRegenImageUrl] = useState<string | null>(null)

  // Build profile from localStorage
  const profile = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) return buildProfile(raw.gender, raw.height, raw.weight, raw.aesthetics ?? [])
    } catch { /* ignore */ }
    return buildProfile('female', 165, 60, [])
  }, [])

  // Active city data
  const activeCityObj = cities[activeCity]
  const activeCityName = activeCityObj?.name ?? 'Your City'
  const activeCityDays = activeCityObj?.days ?? 7
  const activeCityKey = activeCityName.toLowerCase()

  // Generate outfits for the active city
  const outfitSet: CityOutfitSet = useMemo(() => {
    const monthNum = typeof trip.month === 'string' ? parseInt(trip.month, 10) : Number(trip.month)
    return generateCityOutfits(profile, {
      city: activeCityName,
      country: '',
      month: isNaN(monthNum) ? 10 : monthNum,
      days: activeCityDays,
    }, 4)
  }, [profile, activeCityName, activeCityDays, trip.month])

  // Derive packing from all city outfit sets
  const allCitySets: CityOutfitSet[] = useMemo(() => {
    const monthNum = typeof trip.month === 'string' ? parseInt(trip.month, 10) : Number(trip.month)
    return cities.slice(0, 5).map((c) =>
      generateCityOutfits(profile, {
        city: c.name,
        country: '',
        month: isNaN(monthNum) ? 10 : monthNum,
        days: c.days,
      }, 4)
    )
  }, [cities, profile, trip.month])

  const packing = useMemo(() => derivePacking(allCitySets), [allCitySets])

  // Style DNA computed from user aesthetics
  const styleDNA = useMemo(() => {
    const aesthetics = profile.aesthetics
    const all = ['Minimalist', 'Classic', 'Streetwear', 'Casual', 'Sporty', 'Business']
    const scores = all.map((a) => ({
      label: a,
      percent: aesthetics.includes(a) ? 70 + Math.floor(Math.abs(Math.sin(a.length * 7)) * 25) : 20 + Math.floor(Math.abs(Math.cos(a.length * 5)) * 25),
    }))
    scores.sort((a, b) => b.percent - a.percent)
    return scores
  }, [profile.aesthetics])

  const primaryStyle = styleDNA[0]?.label ?? 'Minimalist'
  const primaryPercent = styleDNA[0]?.percent ?? 88

  // Hero image: regen > job image > city hero > demo
  const jobImages = useMemo(() => {
    return (trip.generation_jobs ?? [])
      .filter((j) => j.city === activeCityName && j.image_url)
      .map((j) => j.image_url!)
  }, [trip.generation_jobs, activeCityName])

  const heroImageUrl =
    regenImageUrl ??
    jobImages[0] ??
    CITY_HEROES[activeCityKey] ??
    DEMO_OUTFIT_IMAGES[0]

  // Outfit images for day cards: use job images for first outfits, fallback to generator image
  const outfits = outfitSet.outfits

  const handleRegenerate = useCallback(async () => {
    if (regenLoading || regenCount >= 1) return
    setRegenLoading(true)
    try {
      const result = await regenerateOutfit(tripId, activeCityName)
      setRegenImageUrl(result.image_url)
      setRegenCount((c) => c + 1)
    } catch {
      // silently fail
    } finally {
      setRegenLoading(false)
    }
  }, [regenLoading, regenCount, activeCityName, tripId])

  // Renewal date: 1 year from trip creation
  const renewalDate = (() => {
    try {
      const d = new Date(trip.created_at)
      d.setFullYear(d.getFullYear() + 1)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } catch {
      return 'Jan 2027'
    }
  })()

  const tripsUsed = 12 - (trip.trips_remaining ?? 11)
  const mood = trip.generation_jobs?.[activeCity]?.mood ?? `${activeCityName} Capsule`
  const tripDateRange = `${month} · ${activeCityDays} days`
  const vibeDesc =
    trip.vibe_description ??
    `AI-generated outfits based on your profile, ${activeCityName}'s ${month} weather, and your ${primaryStyle.toLowerCase()} aesthetic preference.`

  const activeOutfit = outfits[activeDayIdx]

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F3', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* ── Title ───────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px clamp(16px, 3vw, 40px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AnnualBadge />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 9999,
            background: 'rgba(212,175,55,0.1)', color: '#C8A96E',
            fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>support_agent</span>
            VIP Concierge
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 9999,
            background: '#F0FDF4', color: '#16a34a',
            fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>bolt</span>
            Priority AI
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          color: '#292524',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Welcome Back, {trip.user_name ?? 'Traveler'}
        </h1>
        <p style={{ fontSize: 16, color: '#57534e', marginBottom: 16 }}>
          Your annual membership is active. Ready for your next adventure?
        </p>
        <div style={{ marginBottom: 8 }}>
          <AiGeneratedBadge />
        </div>
        <div style={{ maxWidth: 400, marginTop: 12, marginBottom: 32 }}>
          <TripUsageBar used={tripsUsed} total={12} renewalDate={renewalDate} />
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px, 3vw, 40px) 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

          {/* ── Left Column ────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* City Tabs + Hero Image */}
            <section style={{ background: '#F5EFE6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', border: '1px solid rgba(26,20,16,0.05)' }}>
              {/* Tab Bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(26,20,16,0.1)', background: '#FDF8F3', overflowX: 'auto' }}>
                {cities.map((city, idx) => (
                  <button
                    key={city.name}
                    onClick={() => { setActiveCity(idx); setRegenImageUrl(null); setRegenCount(0); setActiveDayIdx(0) }}
                    style={{
                      padding: '14px 28px',
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: activeCity === idx ? 700 : 500,
                      fontSize: 15,
                      whiteSpace: 'nowrap',
                      color: activeCity === idx ? '#1A1410' : '#8C8680',
                      borderBottom: activeCity === idx ? '2px solid #C4613A' : '2px solid transparent',
                      background: activeCity === idx ? '#F5EFE6' : 'transparent',
                      cursor: 'pointer',
                      border: 'none',
                      borderBottomStyle: 'solid' as const,
                      borderBottomWidth: 2,
                      borderBottomColor: activeCity === idx ? '#C4613A' : 'transparent',
                      transition: 'color 0.18s',
                    }}
                  >
                    {getCityFlag(city.name)} {city.name}
                  </button>
                ))}
                {cities.length === 0 && (
                  <span style={{ padding: '14px 28px', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: '#1A1410', borderBottom: '2px solid #C4613A', background: '#F5EFE6' }}>
                    Your City
                  </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 8 }}>
                  <button
                    onClick={() => onShare()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'none', border: '1px solid #E8DDD4',
                      borderRadius: 8, padding: '6px 14px',
                      fontSize: 12, color: '#57534e',
                      cursor: 'pointer', fontFamily: 'var(--font-sans, sans-serif)',
                    }}
                    aria-label="Share capsule"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
                    Share
                  </button>
                </div>
              </div>

              {/* Hero Image */}
              <div style={{ position: 'relative', height: 420 }}>
                <Image
                  src={heroImageUrl}
                  alt={activeCityName}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  unoptimized
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,20,16,0.85) 0%, rgba(26,20,16,0.2) 50%, transparent 100%)' }} />

                {/* Top left badges */}
                <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '4px 12px', background: 'rgba(255,255,255,0.9)', borderRadius: 9999,
                    display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)',
                  }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#C4613A', fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 600 }}>
                      Current Itinerary
                    </span>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 9999,
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    color: '#fff', fontSize: 9, textTransform: 'uppercase' as const,
                    letterSpacing: '0.12em', fontFamily: 'var(--font-mono, monospace)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>hd</span>
                    Ultra Hi-Res
                  </span>
                </div>

                {/* Bottom overlay */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#fff', display: 'block' }}>
                      {activeCityName}
                    </span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-sans, sans-serif)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                      {tripDateRange}
                    </span>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenLoading || regenCount >= 1}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 20px', borderRadius: 8,
                      background: regenCount >= 1 ? 'rgba(255,255,255,0.1)' : '#fff',
                      color: regenCount >= 1 ? 'rgba(255,255,255,0.6)' : '#1A1410',
                      border: 'none', fontSize: 13, fontWeight: 700,
                      cursor: regenLoading || regenCount >= 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans, sans-serif)',
                      opacity: regenLoading ? 0.6 : 1,
                      boxShadow: regenCount < 1 ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    <span className={`material-symbols-outlined${regenLoading ? ' animate-spin' : ''}`} style={{ fontSize: 18 }}>
                      {regenCount >= 1 ? 'check_circle' : 'refresh'}
                    </span>
                    {regenLoading ? 'Generating…' : regenCount >= 1 ? 'Regenerated' : 'Regenerate Itinerary'}
                  </button>
                </div>
              </div>

              {/* Capsule section below hero */}
              <div style={{ padding: 28, background: '#F5EFE6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#1A1410' }}>
                    Your {mood}
                  </h3>
                </div>
                <p style={{ fontSize: 14, color: '#8C8680', lineHeight: 1.65, marginBottom: 24, maxWidth: 600 }}>{vibeDesc}</p>

                {/* Outfit day cards — horizontal scroll */}
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, marginBottom: 20 }}>
                  {outfits.map((outfit, i) => {
                    const cardImgUrl = jobImages[i] ?? outfit.imageUrl
                    const isActive = activeDayIdx === i
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setActiveDayIdx(i)}
                        style={{
                          flexShrink: 0,
                          width: 200,
                          borderRadius: 16,
                          overflow: 'hidden',
                          border: `2px solid ${isActive ? '#C4613A' : 'transparent'}`,
                          cursor: 'pointer',
                          background: 'none',
                          padding: 0,
                          outline: 'none',
                          boxShadow: isActive ? '0 0 0 1px rgba(196,97,58,0.3)' : 'none',
                          transition: 'border-color 0.18s',
                        }}
                        aria-label={`Day ${outfit.day}: ${outfit.label}`}
                      >
                        <div style={{ position: 'relative', height: 240 }}>
                          <Image
                            src={cardImgUrl}
                            alt={outfit.label}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 50%)' }} />
                          <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 6px', borderRadius: 9999,
                              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                              color: '#fff', fontSize: 8, textTransform: 'uppercase' as const,
                              letterSpacing: '0.1em', fontFamily: 'var(--font-mono, monospace)',
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 8 }}>auto_awesome</span>
                              AI
                            </span>
                          </div>
                          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, textAlign: 'left' }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', display: 'block', fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 500 }}>
                              Day {outfit.day}
                            </span>
                            <span style={{ fontSize: 18, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#fff', display: 'block' }}>
                              {outfit.label.split(' ')[0]}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-sans, sans-serif)', marginTop: 2, display: 'block' }}>
                              {outfit.styleTag}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Selected day detail */}
                {activeOutfit && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8DDD4', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(196,97,58,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#C4613A',
                        fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {activeOutfit.day}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 16, color: '#292524', display: 'block', fontFamily: "'Playfair Display', serif" }}>
                          {activeOutfit.label}
                        </span>
                        <AiGeneratedBadge />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeOutfit.items.map((item) => (
                        <div key={item.name} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: 8, borderRadius: 8,
                        }}>
                          <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5efe8' }}>
                            <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, color: '#292524', fontWeight: 500, fontFamily: 'var(--font-sans, sans-serif)' }}>{item.name}</span>
                              {item.size && <SizeChip size={item.size} />}
                            </div>
                            <span style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{item.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeOutfit.styleTag && (
                      <p style={{ marginTop: 16, fontSize: 13, color: '#57534e', fontStyle: 'italic', lineHeight: 1.65, fontFamily: "'Playfair Display', serif" }}>
                        &ldquo;{activeOutfit.styleTag}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <button style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 20px', background: '#1A1410', color: '#FDF8F3',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans, sans-serif)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                    View Full Itinerary
                  </button>
                  <button style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 20px', border: '1px solid rgba(26,20,16,0.2)', color: '#1A1410',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'transparent', cursor: 'pointer',
                    fontFamily: 'var(--font-sans, sans-serif)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                    Hi-Res Export
                  </button>
                </div>
              </div>
            </section>

            {/* Past Trips */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#292524' }}>Past Trips</h2>
                <button style={{
                  fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                  color: '#C4613A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}>
                  View All Archive
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {PAST_TRIPS.map((pt) => (
                  <div key={pt.title} style={{
                    background: '#fff', borderRadius: 16, overflow: 'hidden',
                    border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                    cursor: 'pointer',
                  }}>
                    <div style={{ position: 'relative', height: 200 }}>
                      <Image src={pt.imageUrl} alt={pt.title} fill style={{ objectFit: 'cover' }} unoptimized />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span style={{
                          padding: '2px 8px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                          borderRadius: 9999, color: '#fff', fontSize: 10,
                          fontFamily: 'var(--font-mono, monospace)',
                        }}>
                          {pt.outfits} outfits
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 18 }}>
                      <h3 style={{ fontSize: 18, color: '#292524', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>{pt.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{pt.description}</span>
                      </div>
                      <div style={{ paddingTop: 12, borderTop: '1px solid #EFE8DF', display: 'flex', gap: 16, fontSize: 11, color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>
                        <span>{pt.days} days</span>
                        <span>{pt.outfits} outfits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right Sidebar ────────────────────────────────────────────────────── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* AI Profile */}
              <ProfileBadge plan="Annual" />

              {/* Weather Widget */}
              <WeatherWidget
                city={activeCityName}
                temp="18°C"
                condition="Partly Cloudy"
                high="23°"
                low="14°"
                rain="Rain: 20%"
                wind="Wind: 12 km/h"
              />

              {/* Packing List */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524' }}>Packing List</h3>
                  <span style={{
                    padding: '2px 8px', borderRadius: 9999,
                    background: 'rgba(196,97,58,0.1)', color: '#C4613A',
                    fontSize: 9, textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
                  }}>
                    Auto-derived
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#57534e', marginBottom: 16, fontFamily: 'var(--font-sans, sans-serif)' }}>
                  From {outfits.length} AI outfits · {packing.length} unique items
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {packing.slice(0, 8).map((item) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
                      {item.imageUrl && (
                        <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5efe8' }}>
                          <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: '#292524', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans, sans-serif)' }}>
                            {item.name}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>
                          {item.quantity > 1 ? `x${item.quantity} looks` : '1 look'} · {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style DNA */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524', marginBottom: 8 }}>Style DNA</h3>
                <p style={{ fontSize: 13, color: '#57534e', marginBottom: 20, fontFamily: 'var(--font-sans, sans-serif)' }}>
                  Your AI-analyzed fashion profile based on your preferences and past trips.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                  <DonutChart percent={primaryPercent} />
                  <div>
                    <span style={{ fontSize: 18, color: '#292524', display: 'block', fontFamily: "'Playfair Display', serif" }}>{primaryStyle}</span>
                    <span style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>Primary aesthetic</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {styleDNA.slice(0, 4).map((s) => (
                    <BarStat key={s.label} label={s.label} percent={s.percent} />
                  ))}
                </div>
              </div>

              {/* Style DNA — also show the Figma STYLE_DNA_SEGMENTS as supplementary */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#292524', marginBottom: 12 }}>Style Profile</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {STYLE_DNA_SEGMENTS.map((seg) => (
                    <div key={seg.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#292524', fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 500 }}>{seg.label}</span>
                        <span style={{ fontSize: 11, color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>{seg.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: '#EFE8DF', borderRadius: 9999 }}>
                        <div style={{ width: `${seg.pct}%`, height: '100%', background: seg.color, borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Minimalist Chic', 'Neutral Palette', 'Quality Over Quantity'].map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
              </div>

              {/* VIP Concierge */}
              <div className="gold-gradient" style={{ borderRadius: 16, padding: 24, color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>support_agent</span>
                  <h3 style={{ fontSize: 18, color: '#fff', fontFamily: "'Playfair Display', serif" }}>VIP Concierge</h3>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16, lineHeight: 1.65, fontFamily: 'var(--font-sans, sans-serif)' }}>
                  Your dedicated style concierge is available for personalized recommendations, last-minute trip changes, and exclusive shopping assistance.
                </p>
                <button style={{
                  width: '100%', padding: '10px 0', background: '#fff',
                  color: '#D4AF37', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}>
                  Contact Concierge
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type CityOutfitSet,
} from '@/lib/outfitGenerator'
import {
  SizeChip,
  TagChip,
  AiGeneratedBadge,
  ProfileBadge,
} from '@/components/travel-capsule'
import {
  ViewProps,
  DEMO_OUTFIT_IMAGES,
  DEMO_CAPSULE_IMAGES,
  CITY_FILTERS,
  getCityFlag,
  getMonthName,
} from '../result-types'
import { regenerateOutfit } from '@/lib/api'

// ─── City data lookup ─────────────────────────────────────────────────────────

const CITY_HEROES: Record<string, string> = {
  paris: 'https://images.unsplash.com/photo-1577056922428-a511301a562d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  rome: 'https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  barcelona: 'https://images.unsplash.com/photo-1633378532456-103a55a27261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  tokyo: 'https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  milan: 'https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
}

const CITY_WEATHER: Record<string, { temp: number; rain: number; wind: number; condition: string }> = {
  paris: { temp: 9, rain: 30, wind: 12, condition: 'Partly Cloudy' },
  rome: { temp: 16, rain: 15, wind: 8, condition: 'Sunny' },
  barcelona: { temp: 20, rain: 10, wind: 14, condition: 'Clear' },
  tokyo: { temp: 18, rain: 38, wind: 13, condition: 'Partly Cloudy' },
  milan: { temp: 12, rain: 25, wind: 10, condition: 'Overcast' },
}

const CITY_PALETTES: Record<string, string[]> = {
  paris: ['#8B7355', '#C4A882', '#4A5568', '#D4C5B2'],
  rome: ['#C2956B', '#E8C9A0', '#8B6E4E', '#F0E0C8'],
  barcelona: ['#E2A76F', '#5BA3C2', '#F5DEB3', '#4A7C59'],
  tokyo: ['#4A5568', '#8B7355', '#2D3748', '#D4C5B2'],
  milan: ['#1A1A2E', '#6B6E70', '#C4A882', '#E8DDD4'],
}

const CITY_ACTIVITIES: Record<string, string[]> = {
  paris: ['Cafe Culture', 'Gallery Walk', 'Bistro Dinner', 'Seine Stroll', 'Vintage Shopping'],
  rome: ['Colosseum Visit', 'Trastevere Dining', 'Vatican Morning', 'Piazza Exploring', 'Gelato Tour'],
  barcelona: ['Sagrada Familia', 'Beach Morning', 'El Born Markets', 'Tapas Crawl', 'Park Guell Sunset'],
  tokyo: ['Shibuya Crossing', 'Temple Visits', 'Ramen Crawl', 'Harajuku Walk', 'Tsukiji Market'],
  milan: ['Duomo Visit', 'Fashion District', 'Aperitivo Hour', 'Canal Walk', 'Gallery Tour'],
}

const CITY_MOOD_NAMES = [
  'Parisian Chic',
  'Roman Holiday',
  'Barcelona Sol',
  'Tokyo Minimal',
  'Milan Avant-Garde',
]

const CITY_TIMELINE_STYLES = [
  'Chic & Structured',
  'Edgy & Layered',
  'Functional & Cool',
  'Relaxed & Breezy',
  'Bold & Vibrant',
]

const CITY_QUOTES = [
  'Effortlessly transition from day to night with versatile staples tailored for the cobblestone streets.',
  'Sophisticated layers designed to handle unpredictable weather while looking sharp for evenings out.',
  'Functional yet trendy pieces perfect for sun-drenched days and golden-hour evenings.',
  'Minimalist precision meets urban exploration — curated for the most fashion-forward streets.',
  'Bold statements balanced with comfort — made for spontaneous adventures under Mediterranean sun.',
]

export default function ProView({ trip, tripId, onShare }: ViewProps) {
  const cities = trip.cities ?? []
  const month = getMonthName(trip.month)

  const [activeCity, setActiveCity] = useState(0)
  const [expandedOutfit, setExpandedOutfit] = useState(0)
  const [regenState, setRegenState] = useState<
    Record<string, { loading: boolean; count: number; newImageUrl: string | null }>
  >({})

  // Build profile from localStorage
  const profile = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) return buildProfile(raw.gender, raw.height, raw.weight, raw.aesthetics ?? [])
    } catch { /* ignore */ }
    return buildProfile('female', 165, 60, [])
  }, [])

  // Generate outfits per city
  const citySets = useMemo(() => {
    return cities.slice(0, 5).map((c) => {
      const key = c.name.toLowerCase()
      const monthNum = typeof trip.month === 'string' ? parseInt(trip.month, 10) : Number(trip.month)
      const outfitSet: CityOutfitSet = generateCityOutfits(profile, {
        city: c.name,
        country: '',
        month: isNaN(monthNum) ? 10 : monthNum,
        days: c.days,
      }, 4)
      // Get real job images for this city
      const jobImages = (trip.generation_jobs ?? [])
        .filter(j => j.city === c.name && j.image_url)
        .map(j => j.image_url!)
      const heroImg = jobImages[0] ?? CITY_HEROES[key] ?? CITY_HEROES.paris
      const weather = CITY_WEATHER[key] ?? CITY_WEATHER.paris
      const palette = CITY_PALETTES[key] ?? CITY_PALETTES.paris
      const activities = CITY_ACTIVITIES[key] ?? CITY_ACTIVITIES.paris
      const moodName = trip.generation_jobs?.find(j => j.city === c.name)?.mood
        ?? CITY_MOOD_NAMES[cities.indexOf(c) % CITY_MOOD_NAMES.length]
      return { city: c.name, heroImg, weather, palette, activities, moodName, outfitSet, jobImages }
    })
  }, [cities, profile, trip.generation_jobs, trip.month])

  // Consolidated packing from all cities
  const allOutfits = useMemo(() => citySets.flatMap(cs => cs.outfitSet.outfits), [citySets])
  const packing = useMemo(() => derivePacking(citySets.map(cs => cs.outfitSet)), [citySets])

  const currentSet = citySets[activeCity] ?? citySets[0]
  const bodyFitLabel = allOutfits[0]?.styleTag ?? ''

  const handleRegenerate = useCallback(async (cityName: string) => {
    const current = regenState[cityName]
    if (current?.loading || (current?.count ?? 0) >= 1) return
    setRegenState(prev => ({ ...prev, [cityName]: { loading: true, count: prev[cityName]?.count ?? 0, newImageUrl: prev[cityName]?.newImageUrl ?? null } }))
    try {
      const result = await regenerateOutfit(tripId, cityName)
      setRegenState(prev => ({ ...prev, [cityName]: { loading: false, count: (prev[cityName]?.count ?? 0) + 1, newImageUrl: result.image_url } }))
    } catch {
      setRegenState(prev => ({ ...prev, [cityName]: { loading: false, count: prev[cityName]?.count ?? 0, newImageUrl: prev[cityName]?.newImageUrl ?? null } }))
    }
  }, [tripId, regenState])

  // Travel date range
  let dayOffset = 1
  const cityDayRanges = cities.map((c) => {
    const start = dayOffset
    const end = dayOffset + (c.days ?? 3) - 1
    dayOffset = end + 1
    return { start, end }
  })
  const totalDays = cities.reduce((sum, c) => sum + (c.days ?? 3), 0)
  const travelDatesLabel = `${month} 1 – ${month} ${totalDays}`

  if (!currentSet) return null

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '32px clamp(16px, 3vw, 40px) 80px', fontFamily: 'var(--font-sans, sans-serif)', background: '#FDF8F3', minHeight: '100vh' }}>

      {/* ── Title + AI Badge ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          color: '#292524',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          Your Multi-City Style Guide
        </h1>
        <p style={{ fontSize: 15, color: '#57534e', maxWidth: 600, lineHeight: 1.65 }}>
          {cities.length} {cities.length === 1 ? 'city' : 'cities'}, one seamlessly curated capsule wardrobe.
          Every piece earns its place across your entire journey.
        </p>
        <div style={{ marginTop: 12 }}>
          <AiGeneratedBadge />
        </div>
      </div>

      {/* ── City Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 20, marginBottom: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {citySets.map((cs, i) => {
          const range = cityDayRanges[i]
          return (
            <button
              key={cs.city}
              onClick={() => { setActiveCity(i); setExpandedOutfit(0) }}
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                cursor: 'pointer',
                border: activeCity === i ? '1px solid #C4613A' : '1px solid #E8DDD4',
                background: activeCity === i ? '#C4613A' : '#fff',
                color: activeCity === i ? '#fff' : '#57534e',
                transition: 'all 0.18s',
                fontFamily: 'var(--font-sans, sans-serif)',
              }}
            >
              {getCityFlag(cs.city)} {cs.city} · Days {range?.start}–{range?.end}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => onShare()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#C4613A',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, sans-serif)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
            Share Guide
          </button>
        </div>
      </div>

      {/* ── Main 12-col Grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

        {/* ── Left: City Content ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* City Hero Image */}
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}>
            <Image
              src={currentSet.heroImg}
              alt={currentSet.city}
              fill
              style={{ objectFit: 'cover', filter: CITY_FILTERS[activeCity % CITY_FILTERS.length] }}
              priority={activeCity === 0}
              unoptimized
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%)' }} />

            {/* Top badges */}
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
              <TagChip>{currentSet.city}</TagChip>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>hd</span>
                Ultra Hi-Res
              </span>
            </div>

            {/* Bottom overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', display: 'block', fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 500, marginBottom: 4 }}>
                  {travelDatesLabel}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#fff', fontStyle: 'italic' }}>
                  {currentSet.outfitSet.outfits.length} AI Outfits
                </span>
              </div>
              {/* Regen button */}
              {(regenState[currentSet.city]?.count ?? 0) < 1 ? (
                <button
                  onClick={() => handleRegenerate(currentSet.city)}
                  disabled={regenState[currentSet.city]?.loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans, sans-serif)',
                    opacity: regenState[currentSet.city]?.loading ? 0.6 : 1,
                  }}
                >
                  <span className={`material-symbols-outlined${regenState[currentSet.city]?.loading ? ' animate-spin' : ''}`} style={{ fontSize: 16 }}>
                    refresh
                  </span>
                  Regenerate (1 left)
                </button>
              ) : (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  Regenerated
                </span>
              )}
            </div>
          </div>

          {/* Outfit Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#292524' }}>
                {currentSet.city} Outfits
              </h2>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>
                {currentSet.outfitSet.outfits.length} Looks · {profile.gender === 'male' ? 'Menswear' : profile.gender === 'non-binary' ? 'Unisex' : 'Womenswear'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentSet.outfitSet.outfits.map((outfit, idx) => {
                // Use real job images if available for this city
                const jobImgUrl = currentSet.jobImages[idx] ?? regenState[currentSet.city]?.newImageUrl
                const imgUrl = idx === 0 && regenState[currentSet.city]?.newImageUrl
                  ? regenState[currentSet.city].newImageUrl!
                  : jobImgUrl ?? outfit.imageUrl
                const isOpen = expandedOutfit === idx

                return (
                  <div key={outfit.id} style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #ebdacc',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                  }}>
                    <button
                      onClick={() => setExpandedOutfit(isOpen ? -1 : idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 24px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                        <span style={{
                          flexShrink: 0,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'rgba(196,97,58,0.1)',
                          color: '#C4613A',
                          fontWeight: 700,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}>
                          {outfit.day}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524', marginBottom: 2 }}>{outfit.label}</p>
                          <p style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{outfit.styleTag}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: 'rgba(196,97,58,0.08)',
                          color: '#C4613A',
                          fontSize: 9,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                        }}>
                          {88 - idx * 2}% match
                        </span>
                        <span className="material-symbols-outlined" style={{
                          fontSize: 24,
                          color: '#57534e',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s',
                        }}>expand_more</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f0e8e0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingTop: 20 }}>
                          {/* Outfit image */}
                          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', background: '#f0e8e0' }}>
                            <Image src={imgUrl} alt={outfit.label} fill style={{ objectFit: 'cover' }} unoptimized />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                            <div style={{ position: 'absolute', top: 12, left: 12 }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                                fontSize: 9,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}>
                                AI Generated
                              </span>
                            </div>
                            {/* Color palette bottom */}
                            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', gap: 6 }}>
                              {currentSet.palette.map((color) => (
                                <div key={color} style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', background: color }} />
                              ))}
                            </div>
                          </div>

                          {/* Outfit breakdown */}
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#57534e', marginBottom: 16, fontFamily: 'var(--font-sans, sans-serif)' }}>
                              Outfit Breakdown · Your Sizes
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {outfit.items.map((item) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
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
                            {/* Activities */}
                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #EFE8DF' }}>
                              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#57534e', marginBottom: 8, fontFamily: 'var(--font-sans, sans-serif)' }}>
                                Activities
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {currentSet.activities.map((a) => (
                                  <span key={a} style={{ padding: '4px 10px', background: '#FDF8F3', border: '1px solid #E8DDD4', borderRadius: 9999, fontSize: 11, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Style Quote */}
          <p style={{
            fontSize: 18,
            color: '#57534e',
            fontStyle: 'italic',
            borderLeft: `4px solid ${activeCity === 0 ? '#C4613A' : '#a8a29e'}`,
            paddingLeft: 16,
            paddingTop: 4,
            paddingBottom: 4,
            lineHeight: 1.7,
            fontFamily: "'Playfair Display', serif",
          }}>
            &ldquo;{CITY_QUOTES[activeCity % CITY_QUOTES.length]}&rdquo;
          </p>
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* AI Profile */}
            <ProfileBadge plan="Pro" />

            {/* Multi-City Packing Summary */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524' }}>Multi-City Packing</h3>
                <span style={{ padding: '2px 8px', borderRadius: 9999, background: 'rgba(196,97,58,0.1)', color: '#C4613A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                  Auto-derived
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#57534e', marginBottom: 16, fontFamily: 'var(--font-sans, sans-serif)' }}>
                Consolidated from {allOutfits.length} outfits across {citySets.length} cities
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                {packing.slice(0, 10).map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
                    {item.imageUrl && (
                      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5efe8' }}>
                        <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#292524', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans, sans-serif)' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 10, color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>
                        {item.quantity > 1 ? `x${item.quantity} looks` : '1 look'} · {item.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #EFE8DF' }}>
                <span style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>
                  {packing.length} unique items for {allOutfits.length} looks
                </span>
              </div>
            </div>

            {/* Weather Forecast */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524', marginBottom: 20 }}>
                Weather Forecast
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {citySets.map((cs) => (
                  <div key={cs.city} style={{ paddingBottom: 12, borderBottom: '1px solid #EFE8DF', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 14, color: '#292524', fontWeight: 500, fontFamily: 'var(--font-sans, sans-serif)' }}>{cs.city}</p>
                        <p style={{ fontSize: 11, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{cs.weather.condition}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: 'var(--font-mono, monospace)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#292524' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#C4613A' }}>thermostat</span>
                        {cs.weather.temp}°C
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57534e' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>water_drop</span>
                        {cs.weather.rain}%
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57534e' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>air</span>
                        {cs.weather.wind}km/h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capsule Stats */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524', marginBottom: 16 }}>Capsule Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { icon: 'public', label: 'Cities', value: `${citySets.length}` },
                  { icon: 'style', label: 'AI Outfits', value: `${allOutfits.length} looks` },
                  { icon: 'checkroom', label: 'Packing Items', value: `${packing.length} pieces` },
                  { icon: 'hd', label: 'Export Quality', value: 'Ultra Hi-Res' },
                  { icon: 'refresh', label: 'Regenerations', value: Object.values(regenState).some(r => r.count > 0) ? '0 left' : '1 left' },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EFE8DF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#C4613A' }}>{stat.icon}</span>
                      <span style={{ fontSize: 13, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{stat.label}</span>
                    </div>
                    <span style={{ fontSize: 13, color: '#292524', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .pro-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

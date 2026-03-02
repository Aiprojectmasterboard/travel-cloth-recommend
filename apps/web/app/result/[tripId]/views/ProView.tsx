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

const CITY_ACTIVITIES: Record<string, string[]> = {
  paris: ['Cafe Culture', 'Gallery Walk', 'Bistro Dinner', 'Seine Stroll', 'Vintage Shopping'],
  rome: ['Colosseum Visit', 'Trastevere Dining', 'Vatican Morning', 'Piazza Exploring', 'Gelato Tour'],
  barcelona: ['Sagrada Familia', 'Beach Morning', 'El Born Markets', 'Tapas Crawl', 'Park Guell Sunset'],
  tokyo: ['Shibuya Crossing', 'Temple Visits', 'Ramen Crawl', 'Harajuku Walk', 'Tsukiji Market'],
  milan: ['Duomo Visit', 'Fashion District', 'Aperitivo Hour', 'Canal Walk', 'Gallery Tour'],
}

// ─── AI Profile Sidebar (shared pattern) ─────────────────────────────────────

function AIProfileSidebar({ profile }: {
  profile: { gender: string; height: number; weight: number; aesthetics: string[] }
}) {
  const gender = profile.gender
  const genderIcon = gender === 'male' || gender === 'Male' ? '♂' : gender === 'female' || gender === 'Female' ? '♀' : '⚧'

  return (
    <div className="bg-white border border-[#E8DDD4] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 18 }}>auto_awesome</span>
        <h3 className="font-playfair text-lg text-[#292524]">AI Generation Profile</h3>
      </div>
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#C4613A] mb-4 font-mono">
        Outfits Tailored to Your Data
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7ED] border border-[#FDBA74]/30 text-[#9A3412] text-xs font-medium mb-5">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
        Tailored for {gender} · {profile.height}cm · average build
      </div>
      <div className="flex flex-col gap-0">
        {[
          { icon: genderIcon, label: 'Gender', value: gender },
          { icon: '↕', label: 'Height', value: `${profile.height} cm` },
          { icon: '⚖', label: 'Weight', value: `${profile.weight} kg` },
          { icon: '📷', label: 'Reference Photo', value: 'Not provided' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-[#EFE8DF] last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-sm w-5 text-center">{stat.icon}</span>
              <span className="text-sm text-[#57534e] font-sans">{stat.label}</span>
            </div>
            <span className="text-sm text-[#292524] font-semibold font-sans">{stat.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#57534e] mb-2 font-mono">
          Style Preferences
        </p>
        <div className="flex flex-wrap gap-2">
          {(profile.aesthetics.length > 0 ? profile.aesthetics : ['Minimalist', 'Streetwear']).map((tag: string) => (
            <span key={tag} className="inline-flex px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ProView ──────────────────────────────────────────────────────────────────

export default function ProView({ trip, tripId, onShare }: ViewProps) {
  const cities = trip.cities ?? []
  const month = getMonthName(trip.month)

  const [activeCity, setActiveCity] = useState(0)
  const [expandedOutfit, setExpandedOutfit] = useState(0)
  const [regenState, setRegenState] = useState<
    Record<string, { loading: boolean; count: number; newImageUrl: string | null }>
  >({})

  // Build profile from localStorage
  const profileData = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) return { gender: raw.gender ?? 'Male', height: raw.height ?? 180, weight: raw.weight ?? 80, aesthetics: raw.aesthetics ?? [] }
    } catch { /* ignore */ }
    return { gender: 'Female', height: 170, weight: 56, aesthetics: ['Minimalist', 'Classic', 'Casual'] }
  }, [])

  const profile = useMemo(() => {
    return buildProfile(profileData.gender, profileData.height, profileData.weight, profileData.aesthetics)
  }, [profileData])

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
      const jobImages = (trip.generation_jobs ?? [])
        .filter(j => j.city === c.name && j.image_url)
        .map(j => j.image_url!)
      const heroImg = jobImages[0] ?? CITY_HEROES[key] ?? CITY_HEROES.paris
      const weather = CITY_WEATHER[key] ?? CITY_WEATHER.paris
      const activities = CITY_ACTIVITIES[key] ?? CITY_ACTIVITIES.paris
      return { city: c.name, heroImg, weather, activities, outfitSet, jobImages }
    })
  }, [cities, profile, trip.generation_jobs, trip.month])

  // Consolidated packing
  const allOutfits = useMemo(() => citySets.flatMap(cs => cs.outfitSet.outfits), [citySets])
  const packing = useMemo(() => derivePacking(citySets.map(cs => cs.outfitSet)), [citySets])

  const currentSet = citySets[activeCity] ?? citySets[0]

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

  // Travel date ranges
  let dayOffset = 1
  const cityDayRanges = cities.map((c) => {
    const start = dayOffset
    const end = dayOffset + (c.days ?? 3) - 1
    dayOffset = end + 1
    return { start, end }
  })
  const totalDays = cities.reduce((sum, c) => sum + (c.days ?? 3), 0)

  const genderLabel = profileData.gender === 'male' || profileData.gender === 'Male' ? 'Menswear' : profileData.gender === 'female' || profileData.gender === 'Female' ? 'Womenswear' : 'Unisex'

  if (!currentSet) return null

  return (
    <div className="w-full min-h-screen bg-[#FDF8F3] font-sans">

      {/* ── Example Banner (demo mode) ──────────────────────────────────────── */}
      {!process.env.NEXT_PUBLIC_WORKER_URL && (
        <div className="bg-[#C4613A] text-white text-center py-2.5 px-4 text-sm font-medium">
          <span className="uppercase tracking-[0.1em] text-xs font-bold">Example Preview</span>
          <span className="mx-2">—</span>
          This is what you receive with the Pro Plan ($12)
          <a href="/trip" className="ml-3 inline-flex items-center gap-1 bg-white text-[#C4613A] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-white/90 transition-colors">
            Get Started
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </a>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20">

        {/* ── Badges + AI Generated ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1410]/80 text-white text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm backdrop-blur-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
            AI Generated
          </span>
          <span className="inline-flex items-center gap-1 text-[#C4613A] text-xs font-semibold font-mono">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
            93% AI Confidence
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
            Tailored for {profileData.gender} · {profileData.height}cm · {profileData.weight < 65 ? 'petite' : 'average'} build
          </span>
        </div>

        {/* ── Title ──────────────────────────────────────────────────────────── */}
        <h1 className="font-playfair italic text-[clamp(28px,3.5vw,44px)] text-[#292524] leading-tight mb-2">
          Multi-City Style Guide
        </h1>
        <p className="text-base text-[#57534e] max-w-xl leading-relaxed mb-6">
          {cities.length} {cities.length === 1 ? 'city' : 'cities'}, one seamlessly curated capsule wardrobe. Every piece earns its place across your entire European journey.
        </p>

        {/* ── City Tabs as pills ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {citySets.map((cs, i) => {
            const range = cityDayRanges[i]
            const isActive = activeCity === i
            return (
              <button
                key={cs.city}
                onClick={() => { setActiveCity(i); setExpandedOutfit(0) }}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.08em] font-medium cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#C4613A] border-[#C4613A] text-white'
                    : 'bg-white border-[#E8DDD4] text-[#57534e] hover:border-[#C4613A]/40'
                }`}
              >
                {cs.city} · {month} {range?.start} – {month} {range?.end}
              </button>
            )
          })}
        </div>

        {/* ── Main 2-Column Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* ── Left Column ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-10">

            {/* City Hero Image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
              <Image
                src={currentSet.heroImg}
                alt={currentSet.city}
                fill
                className="object-cover"
                style={{ filter: CITY_FILTERS[activeCity % CITY_FILTERS.length] }}
                priority={activeCity === 0}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Top left: city name + hi-res badge */}
              <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="text-white text-xs uppercase tracking-[0.12em] font-semibold font-sans">
                  {currentSet.city}, {currentSet.city === 'Paris' ? 'France' : currentSet.city === 'Rome' || currentSet.city === 'Milan' ? 'Italy' : currentSet.city === 'Barcelona' ? 'Spain' : currentSet.city === 'Tokyo' ? 'Japan' : ''}
                </span>
              </div>
              <div className="absolute top-5 right-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-lg text-white text-[9px] uppercase tracking-[0.12em] font-mono">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>hd</span>
                  Ultra Hi-Res
                </span>
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <span className="text-xs text-white/70 uppercase tracking-[0.15em] block font-sans font-medium mb-1">
                    {month} {cityDayRanges[activeCity]?.start} – {month} {cityDayRanges[activeCity]?.end}
                  </span>
                </div>
              </div>
            </div>

            {/* Outfit Accordion Cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-2xl text-[#292524]">
                  {currentSet.city} Outfits
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] font-mono font-semibold">
                  {currentSet.outfitSet.outfits.length} Looks · {genderLabel}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {currentSet.outfitSet.outfits.map((outfit, idx) => {
                  const jobImgUrl = currentSet.jobImages[idx] ?? regenState[currentSet.city]?.newImageUrl
                  const imgUrl = idx === 0 && regenState[currentSet.city]?.newImageUrl
                    ? regenState[currentSet.city].newImageUrl!
                    : jobImgUrl ?? outfit.imageUrl
                  const isOpen = expandedOutfit === idx

                  return (
                    <div key={outfit.id} className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      <button
                        onClick={() => setExpandedOutfit(isOpen ? -1 : idx)}
                        className="w-full flex items-center justify-between px-6 py-5 bg-transparent border-none cursor-pointer text-left gap-4 transition-colors hover:bg-[#FDF8F3]/50"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C4613A]/10 text-[#C4613A] font-bold text-sm flex items-center justify-center font-mono">
                            {outfit.day}
                          </span>
                          <div className="min-w-0">
                            <p className="font-playfair text-lg text-[#292524] mb-0.5">{outfit.label}</p>
                            <p className="text-xs text-[#57534e] font-sans">{outfit.styleTag}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] font-mono font-semibold">
                            {88 - idx * 2}% match
                          </span>
                          <span className="material-symbols-outlined text-[#57534e] transition-transform duration-300" style={{ fontSize: 24, transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 border-t border-[#f0e8e0]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#f0e8e0]">
                              <Image src={imgUrl} alt={outfit.label} fill className="object-cover" unoptimized />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                              <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-lg text-white text-[9px] uppercase tracking-[0.1em] font-mono">
                                  AI Generated
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#57534e] mb-4 font-sans">
                                Outfit Breakdown · Your Sizes
                              </p>
                              <div className="flex flex-col gap-2">
                                {outfit.items.map((item) => (
                                  <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#f5efe8]">
                                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-[#292524] font-medium font-sans">{item.name}</span>
                                        {item.size && (
                                          <span className="inline-flex items-center justify-center w-8 h-8 bg-white border border-[#E8DDD4] text-[#1A1410] text-xs font-bold rounded-full">
                                            {item.size}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-[#57534e] font-sans">{item.category}</span>
                                    </div>
                                  </div>
                                ))}
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
          </div>

          {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-5">
            <div className="sticky top-24 flex flex-col gap-5">

              {/* Example User card (from Figma) */}
              <div className="bg-white border border-[#E8DDD4] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center text-white text-sm font-bold">
                    {(trip.user_name ?? 'T')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1410]">{trip.user_name ?? 'Example User'}</p>
                    <p className="text-xs text-[#9c8c7e]">
                      {profileData.gender} · {profileData.height}cm · {profileData.weight}kg
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData.aesthetics.length > 0 ? profileData.aesthetics : ['Minimalist', 'Classic', 'Casual']).map((tag: string) => (
                    <span key={tag} className="inline-flex px-2.5 py-0.5 bg-[#F5EFE6] text-[#57534e] text-[11px] font-medium rounded-full border border-[#E8DDD4]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-City Packing */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8DDD4] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-playfair text-base text-[#292524] font-bold">Multi-City Packing</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em] font-mono font-semibold">
                    Auto-derived
                  </span>
                </div>
                <p className="text-xs text-[#57534e] mb-4 font-sans">
                  Consolidated from {allOutfits.length} outfits across {citySets.length} cities
                </p>
                <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto">
                  {packing.slice(0, 10).map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg">
                      {item.imageUrl && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#f5efe8]">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#292524] font-medium overflow-hidden text-ellipsis whitespace-nowrap font-sans">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#57534e] font-mono">
                          {item.quantity > 1 ? `x${item.quantity} looks` : '1 look'} · {item.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Profile */}
              <AIProfileSidebar profile={profileData} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

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
  type ViewProps,
  DEMO_OUTFIT_IMAGES,
  PAST_TRIPS,
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

const CITY_WEATHER: Record<string, { temp: number; rain: number; condition: string }> = {
  tokyo: { temp: 18, rain: 38, condition: 'Partly Cloudy' },
  paris: { temp: 9, rain: 30, condition: 'Partly Cloudy' },
  rome: { temp: 16, rain: 15, condition: 'Sunny' },
  barcelona: { temp: 20, rain: 10, condition: 'Clear' },
  milan: { temp: 12, rain: 25, condition: 'Overcast' },
  seoul: { temp: 22, rain: 20, condition: 'Clear' },
}

// ─── AI Profile Sidebar ─────────────────────────────────────────────────────

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
          {(profile.aesthetics.length > 0 ? profile.aesthetics : ['Minimalist', 'Classic']).map((tag: string) => (
            <span key={tag} className="inline-flex px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Weather Card ─────────────────────────────────────────────────────────────

function WeatherCard({ city, month }: { city: string; month: string }) {
  const key = city.toLowerCase()
  const w = CITY_WEATHER[key] ?? CITY_WEATHER.tokyo

  return (
    <div className="bg-white border border-[#E8DDD4] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-playfair italic text-lg text-[#292524]">{city} Weather</h3>
        <span className="text-xs text-[#57534e] font-mono uppercase tracking-[0.08em]">{month}</span>
      </div>
      <div className="flex items-center gap-4 text-sm font-mono">
        <span className="flex items-center gap-1 text-[#292524]">
          <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 16 }}>thermostat</span>
          {w.temp}°C
        </span>
        <span className="flex items-center gap-1 text-[#57534e]">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>water_drop</span>
          {w.rain}% Rain
        </span>
      </div>
    </div>
  )
}

// ─── AnnualView ─────────────────────────────────────────────────────────────────

export default function AnnualView({ trip, tripId, onShare }: ViewProps) {
  const cities = trip.cities ?? []
  const month = getMonthName(trip.month)

  const [activeCity, setActiveCity] = useState(0)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenCount, setRegenCount] = useState(0)
  const [regenImageUrl, setRegenImageUrl] = useState<string | null>(null)

  // Build profile from localStorage
  const profileData = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) return { gender: raw.gender ?? 'Female', height: raw.height ?? 170, weight: raw.weight ?? 56, aesthetics: raw.aesthetics ?? [] }
    } catch { /* ignore */ }
    return { gender: 'Female', height: 170, weight: 56, aesthetics: ['Minimalist', 'Classic'] }
  }, [])

  const profile = useMemo(() => {
    return buildProfile(profileData.gender, profileData.height, profileData.weight, profileData.aesthetics)
  }, [profileData])

  const activeCityObj = cities[activeCity]
  const activeCityName = activeCityObj?.name ?? 'Your City'
  const activeCityDays = activeCityObj?.days ?? 7
  const activeCityKey = activeCityName.toLowerCase()

  // Generate outfits for active city
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

  // Hero image
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

  // Renewal date
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
  const tripDateRange = `${month} · ${activeCityDays} days`

  return (
    <div className="min-h-screen bg-[#FDF8F3] font-sans">

      {/* ── Example Banner (demo mode) ──────────────────────────────────────── */}
      {!process.env.NEXT_PUBLIC_WORKER_URL && (
        <div className="bg-[#C4613A] text-white text-center py-2.5 px-4 text-sm font-medium">
          <span className="uppercase tracking-[0.1em] text-xs font-bold">Example Preview</span>
          <span className="mx-2">—</span>
          This is what you receive with the Annual Plan ($29/yr)
          <a href="/trip" className="ml-3 inline-flex items-center gap-1 bg-white text-[#C4613A] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-white/90 transition-colors">
            Get Started
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </a>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20">

        {/* ── Priority badges ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[10px] font-bold uppercase tracking-[0.08em]">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>bolt</span>
            Priority AI
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[10px] font-bold uppercase tracking-[0.08em]">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>support_agent</span>
            VIP Concierge
          </span>
        </div>

        {/* ── Title ──────────────────────────────────────────────────────────── */}
        <h1 className="font-playfair italic text-[clamp(28px,3.5vw,44px)] text-[#292524] leading-tight mb-2">
          Welcome Back, {trip.user_name ?? 'Sofia'}
        </h1>
        <p className="text-base text-[#57534e] mb-4">
          Your annual membership is active. Ready for your next adventure?
        </p>

        {/* ── AI confidence badges row ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1410]/80 text-white text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm backdrop-blur-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
            AI Generated
          </span>
          <span className="inline-flex items-center gap-1 text-[#C4613A] text-xs font-semibold font-mono">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
            96% AI Confidence
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
            Tailored for {profileData.gender} · {profileData.height}cm · {profileData.weight < 65 ? 'petite' : 'average'} build
          </span>
        </div>

        {/* ── Trip counter row ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between max-w-lg mb-8">
          <p className="text-sm text-[#292524]">
            <span className="font-bold">{12 - tripsUsed} of 12 trips remaining</span>
          </p>
          <p className="text-xs text-[#57534e]">
            Renews {renewalDate}
          </p>
        </div>

        {/* ── Main 2-Column Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* ── Left Column ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-10">

            {/* City Hero Image — full width */}
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 420 }}>
              <Image
                src={heroImageUrl}
                alt={activeCityName}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1410]/85 via-[#1A1410]/20 to-transparent" />

              {/* Top badges */}
              <div className="absolute top-5 left-5 flex gap-2">
                <div className="px-3 py-1 bg-white/90 backdrop-blur-lg rounded-full">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A] font-semibold font-sans">
                    Current Itinerary
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-lg text-white text-[9px] uppercase tracking-[0.12em] font-mono">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>hd</span>
                  Ultra Hi-Res
                </span>
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-7 flex items-end justify-between gap-4">
                <div>
                  <span className="text-3xl font-playfair italic text-white block">
                    {activeCityName}
                  </span>
                  <span className="text-sm text-white/80 font-sans flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                    {tripDateRange}
                  </span>
                </div>
              </div>
            </div>

            {/* Past Trips */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-playfair text-2xl text-[#292524]">Past Trips</h2>
                <button className="text-xs uppercase tracking-[0.08em] text-[#C4613A] font-semibold bg-transparent border-none cursor-pointer font-sans hover:underline">
                  View All Archive
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PAST_TRIPS.map((pt) => (
                  <div key={pt.title} className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] shadow-[0_2px_12px_rgba(0,0,0,0.04)] cursor-pointer hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-[200px]">
                      <Image src={pt.imageUrl} alt={pt.title} fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-lg rounded-full text-white text-[10px] font-mono">
                          {pt.outfits} outfits
                        </span>
                      </div>
                    </div>
                    <div className="p-[18px]">
                      <h3 className="text-lg text-[#292524] font-playfair mb-2">{pt.title}</h3>
                      <p className="text-[13px] text-[#57534e] font-sans mb-3">{pt.description}</p>
                      <div className="pt-3 border-t border-[#EFE8DF] flex gap-4 text-[11px] text-[#57534e] font-mono">
                        <span>{pt.days} days</span>
                        <span>{pt.outfits} outfits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-5">
            <div className="sticky top-24 flex flex-col gap-5">

              {/* User card */}
              <div className="bg-white border border-[#E8DDD4] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center text-white text-sm font-bold">
                    {(trip.user_name ?? 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1410]">{trip.user_name ?? 'Sofia (Example)'}</p>
                    <p className="text-xs text-[#9c8c7e]">
                      {profileData.gender} · {profileData.height}cm · {profileData.weight}kg
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData.aesthetics.length > 0 ? profileData.aesthetics : ['Minimalist', 'Classic']).map((tag: string) => (
                    <span key={tag} className="inline-flex px-2.5 py-0.5 bg-[#F5EFE6] text-[#57534e] text-[11px] font-medium rounded-full border border-[#E8DDD4]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weather Card */}
              <WeatherCard city={activeCityName} month={`${month} 10–31`} />

              {/* AI Profile */}
              <AIProfileSidebar profile={profileData} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TripData {
  cities: { name: string; country: string; days?: number }[]
  month: string
  mood_name: string
  weather: {
    temperature_day_avg: number
    temperature_night_avg: number
    precipitation_prob: number
    climate_band: string // 'cold' | 'mild' | 'warm' | 'hot' | 'rainy'
    style_hint: string
  }[]
  capsule_items: { name: string; category: string; why: string }[]
}

interface ChecklistItem {
  id: string
  name: string
  subtitle: string
  category: string
  weight_kg: number
  type: 'capsule' | 'weather' | 'basic'
  priority?: 'high'
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TRIP: TripData = {
  cities: [{ name: 'Paris', country: 'France', days: 6 }],
  month: 'October',
  mood_name: 'Paris — Rainy Chic',
  weather: [
    {
      temperature_day_avg: 16,
      temperature_night_avg: 10,
      precipitation_prob: 60,
      climate_band: 'mild',
      style_hint:
        'Pack breathable silk layers to manage the 78% humidity. Avoid heavy denim which retains moisture.',
    },
  ],
  capsule_items: [
    { name: 'Classic Camel Trench', category: 'Outerwear', why: 'Water Resistant' },
    { name: 'Cashmere Crewneck', category: 'Tops', why: 'Breathable Warmth' },
    { name: 'Tailored Wool Trousers', category: 'Bottoms', why: 'Wrinkle Resistant' },
    { name: 'Silk Midi Dress', category: 'Evening', why: 'Lightweight' },
    { name: 'White Oxford Shirt', category: 'Essential', why: 'Versatile base layer' },
    { name: 'Black Leather Loafers', category: 'Footwear', why: 'All-day comfort' },
    { name: 'Crossbody Bag', category: 'Accessory', why: 'Secure and stylish' },
    { name: 'Statement Scarf', category: 'Accessory', why: 'Wind Protection' },
  ],
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_WEIGHT: Record<string, number> = {
  Outerwear: 1.0,
  Tops: 0.3,
  Essential: 0.3,
  Bottoms: 0.5,
  Evening: 0.4,
  Footwear: 0.7,
  Accessory: 0.2,
}

const CATEGORY_EMOJI: Record<string, string> = {
  Outerwear: '🧥',
  Tops: '👕',
  Essential: '👕',
  Bottoms: '👖',
  Evening: '👗',
  Footwear: '👟',
  Accessory: '👜',
  Weather: '🌂',
}

// ─── buildChecklist ────────────────────────────────────────────────────────────

function buildChecklist(trip: TripData): ChecklistItem[] {
  const items: ChecklistItem[] = []
  const weather = trip.weather[0]
  const totalDays = trip.cities.reduce((sum, c) => sum + (c.days ?? 3), 0)

  // 1. Capsule Core
  trip.capsule_items.forEach((ci, i) => {
    items.push({
      id: `capsule-${i}`,
      name: ci.name,
      subtitle: `${ci.category} • ${ci.why}`,
      category: ci.category,
      weight_kg: CATEGORY_WEIGHT[ci.category] ?? 0.35,
      type: 'capsule',
    })
  })

  // 2. Weather Essentials
  if (weather) {
    if (weather.precipitation_prob >= 30) {
      items.push({
        id: 'weather-umbrella',
        name: 'Compact Windproof Umbrella',
        subtitle: `${weather.precipitation_prob}% rain chance — pack this first`,
        category: 'Weather',
        weight_kg: 0.3,
        type: 'weather',
        priority: 'high',
      })
    }
    if (weather.climate_band === 'cold' || weather.climate_band === 'mild') {
      items.push({
        id: 'weather-knit',
        name: 'Lightweight Knit Layer',
        subtitle: `${weather.climate_band} climate • adds versatile warmth`,
        category: 'Weather',
        weight_kg: 0.25,
        type: 'weather',
      })
    }
    if (weather.climate_band === 'warm' || weather.climate_band === 'hot') {
      items.push({
        id: 'weather-sunscreen',
        name: 'SPF 50 Sunscreen (100ml)',
        subtitle: `${weather.climate_band} climate • protect against UV`,
        category: 'Weather',
        weight_kg: 0.1,
        type: 'weather',
        priority: 'high',
      })
    }
  }

  // 3. Personal Basics
  items.push(
    {
      id: 'basic-undergarments',
      name: `Undergarments (×${totalDays})`,
      subtitle: `${totalDays} days of travel`,
      category: 'Basic',
      weight_kg: Math.round(totalDays * 0.08 * 100) / 100,
      type: 'basic',
    },
    {
      id: 'basic-toiletries',
      name: 'Toiletries Bag (100ml liquids)',
      subtitle: 'TSA-compliant, keep on top',
      category: 'Basic',
      weight_kg: 0.5,
      type: 'basic',
    },
    {
      id: 'basic-adapter',
      name: 'Universal Travel Adapter',
      subtitle: 'Multi-region plug compatibility',
      category: 'Basic',
      weight_kg: 0.15,
      type: 'basic',
    },
    {
      id: 'basic-charger',
      name: 'Phone Charger + Cable',
      subtitle: 'Keep devices powered on the go',
      category: 'Basic',
      weight_kg: 0.15,
      type: 'basic',
    },
    {
      id: 'basic-passport',
      name: 'Passport + Travel Documents',
      subtitle: 'Boarding pass, travel insurance, hotel confirmations',
      category: 'Basic',
      weight_kg: 0.1,
      type: 'basic',
    }
  )

  return items
}

// ─── ChecklistRow ─────────────────────────────────────────────────────────────

interface ChecklistRowProps {
  item: ChecklistItem
  checked: boolean
  onToggle: (id: string) => void
  highlight?: boolean
  compact?: boolean
}

function ChecklistRow({ item, checked, onToggle, highlight, compact }: ChecklistRowProps) {
  const emoji = CATEGORY_EMOJI[item.category] ?? '✨'
  const isWeatherPriority = item.type === 'weather' && item.priority === 'high'

  if (compact) {
    // Personal Basics — compact row without thumbnail
    return (
      <label
        className={[
          'flex items-center gap-4 cursor-pointer group py-1',
        ].join(' ')}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(item.id)}
          className="w-5 h-5 rounded border-2 cursor-pointer flex-shrink-0 transition-colors"
          style={{ accentColor: '#b8552e' }}
          aria-label={`Pack ${item.name}`}
        />
        <div className="flex-grow">
          <span
            className="text-sm transition-colors"
            style={{ color: checked ? '#8A7B6E' : '#1A1410', textDecoration: checked ? 'line-through' : 'none' }}
          >
            {item.name}
          </span>
          {item.subtitle && (
            <span className="block text-xs mt-0.5" style={{ color: '#9c8c7e' }}>
              {item.subtitle}
            </span>
          )}
        </div>
      </label>
    )
  }

  return (
    <label
      className={[
        'group flex items-center gap-6 p-4 bg-white hover:shadow-md border transition-all duration-300 cursor-pointer rounded-sm',
        highlight ? 'border-l-4 border-l-[#b8552e] border-[#f0e8e4]' : 'border-[#1A1410]/5',
        checked ? 'opacity-60' : 'opacity-100',
      ].join(' ')}
    >
      {/* Thumbnail */}
      {isWeatherPriority ? (
        <div
          className="w-16 h-16 flex items-center justify-center text-[#b8552e] flex-shrink-0"
          style={{ background: '#E0F2FE33' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>umbrella</span>
        </div>
      ) : (
        <div
          className="w-16 h-20 flex items-center justify-center text-2xl flex-shrink-0 rounded-sm"
          style={{ background: '#FDF8F3' }}
        >
          {emoji}
        </div>
      )}

      {/* Text */}
      <div className="flex-grow min-w-0">
        <h4
          className="transition-colors leading-tight"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.0625rem',
            color: checked ? '#9c8c7e' : '#1A1410',
            textDecoration: checked ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </h4>
        <p className="text-xs mt-1 truncate" style={{ color: '#9c8c7e' }}>
          {item.subtitle}
        </p>
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="w-6 h-6 rounded-full border-2 cursor-pointer flex-shrink-0 transition-colors"
        style={{ accentColor: '#b8552e' }}
        aria-label={`Pack ${item.name}`}
      />
    </label>
  )
}

// ─── Weather icon selector ────────────────────────────────────────────────────

function getWeatherIcon(climateBand: string, precipProb: number): string {
  if (precipProb >= 50 || climateBand === 'rainy') return 'rainy'
  if (climateBand === 'cold') return 'ac_unit'
  if (climateBand === 'hot') return 'wb_sunny'
  return 'partly_cloudy_day'
}

function getProTip(climateBand: string, cityName: string): string {
  if (climateBand === 'cold')
    return `Wear your heaviest item (coat) on the plane to ${cityName} to save luggage weight and stay warm at altitude.`
  if (climateBand === 'rainy' || climateBand === 'mild')
    return `Pack a silk base layer — it dries fast and manages humidity better than cotton. Roll knits to prevent creasing.`
  if (climateBand === 'hot')
    return `Pack light-coloured linens on top for easy access. Keep sunscreen in your personal item bag for the flight.`
  return `Roll soft items and fill shoes with socks to maximise carry-on space. Pack heaviest items at the base, closest to your back.`
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="flex h-screen overflow-hidden pt-20" aria-busy="true" aria-label="Loading checklist">
      {/* Left */}
      <div className="lg:w-3/5 xl:w-2/3 overflow-y-auto px-6 lg:px-16 py-10 space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded animate-pulse" style={{ background: '#E8DDD2' }} />
          <div className="h-12 w-3/4 rounded animate-pulse" style={{ background: '#E8DDD2' }} />
          <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: '#E8DDD2' }} />
          <div className="h-2 w-full rounded-full animate-pulse" style={{ background: '#E8DDD2' }} />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-6 p-4 rounded-sm" style={{ background: 'white', border: '1px solid #f0ebe6' }}>
            <div className="w-16 h-20 rounded-sm animate-pulse flex-shrink-0" style={{ background: '#E8DDD2' }} />
            <div className="flex-grow space-y-2">
              <div className="h-5 w-2/3 rounded animate-pulse" style={{ background: '#E8DDD2' }} />
              <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: '#E8DDD2' }} />
            </div>
            <div className="w-6 h-6 rounded-full animate-pulse flex-shrink-0" style={{ background: '#E8DDD2' }} />
          </div>
        ))}
      </div>
      {/* Right sidebar skeleton (desktop) */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 bg-white border-l flex-col p-10 space-y-6" style={{ borderColor: '#F5EFE6' }}>
        <div className="h-36 rounded-sm animate-pulse" style={{ background: '#E8DDD2' }} />
        <div className="h-64 rounded-sm animate-pulse" style={{ background: '#E8DDD2' }} />
        <div className="h-24 rounded-sm animate-pulse" style={{ background: '#E8DDD2' }} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChecklistClient({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // ── Fetch trip + restore localStorage ──────────────────────────────────────
  const fetchTrip = useCallback(async () => {
    // Restore localStorage first
    try {
      const saved = localStorage.getItem(`checklist-${tripId}`)
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        setChecked(new Set(parsed))
      }
    } catch {
      // Ignore localStorage errors
    }

    if (!WORKER_URL) {
      setTrip(DEMO_TRIP)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/result/${tripId}`)
      if (!res.ok) {
        setTrip(DEMO_TRIP)
        setLoading(false)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json()
      const mapped: TripData = {
        cities: data.cities ?? DEMO_TRIP.cities,
        month: data.month ?? DEMO_TRIP.month,
        mood_name: data.vibes?.[0]?.mood_name ?? DEMO_TRIP.mood_name,
        weather: data.weather ?? DEMO_TRIP.weather,
        capsule_items: data.capsule?.items ?? DEMO_TRIP.capsule_items,
      }
      setTrip(mapped)
    } catch {
      setTrip(DEMO_TRIP)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // ── Toggle item ─────────────────────────────────────────────────────────────
  const toggleItem = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem(`checklist-${tripId}`, JSON.stringify(Array.from(next)))
      } catch {
        // Ignore
      }
      return next
    })
  }, [tripId])

  // ── Mark all packed ─────────────────────────────────────────────────────────
  const markAllPacked = useCallback((items: ChecklistItem[]) => {
    const allIds = new Set(items.map(i => i.id))
    setChecked(allIds)
    try {
      localStorage.setItem(`checklist-${tripId}`, JSON.stringify(Array.from(allIds)))
    } catch {
      // Ignore
    }
  }, [tripId])

  if (loading) return <SkeletonLoader />

  const currentTrip = trip ?? DEMO_TRIP
  const allItems = buildChecklist(currentTrip)

  const capsuleItems = allItems.filter(i => i.type === 'capsule')
  const weatherItems = allItems.filter(i => i.type === 'weather')
  const basicItems = allItems.filter(i => i.type === 'basic')

  const totalItems = allItems.length
  const packedCount = allItems.filter(i => checked.has(i.id)).length
  const totalWeight = Math.round(allItems.reduce((s, i) => s + i.weight_kg, 0) * 10) / 10
  const packedWeight = Math.round(allItems.filter(i => checked.has(i.id)).reduce((s, i) => s + i.weight_kg, 0) * 10) / 10
  const progressPct = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0

  const weather = currentTrip.weather[0]
  const primaryCity = currentTrip.cities[0]?.name ?? 'Your City'
  const cityLabel = currentTrip.cities.map(c => `${c.name}, ${c.country}`).join(' · ')
  const weatherIcon = weather ? getWeatherIcon(weather.climate_band, weather.precipitation_prob) : 'partly_cloudy_day'
  const showHumidityAlert = weather && weather.precipitation_prob >= 50
  const proTip = getProTip(weather?.climate_band ?? 'mild', primaryCity)

  return (
    <>
      {/* ── Fixed Header ────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 z-50 w-full backdrop-blur-md border-b transition-all duration-300"
        style={{ background: 'rgba(253,248,243,0.92)', borderColor: 'rgba(26,20,16,0.05)' }}
      >
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#b8552e]" style={{ fontSize: '1.75rem', fontVariationSettings: "'wght' 200" }}>
              all_inclusive
            </span>
            <h1
              style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              className="font-medium text-[#1A1410]"
            >
              Travel Capsule AI
            </h1>
          </div>

          {/* Center trip info (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(26,20,16,0.55)' }}>
            <span>Trip: {cityLabel}</span>
            <span style={{ color: 'rgba(26,20,16,0.2)' }}>|</span>
            <span>{currentTrip.month}</span>
          </div>

          {/* Right: SAVED badge + back link */}
          <div className="flex items-center gap-4">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: 'white', border: '1px solid rgba(26,20,16,0.1)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#b8552e' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1A1410' }}>Saved</span>
            </div>
            <a
              href={`/result/${tripId}`}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[#b8552e]"
              style={{ color: 'rgba(26,20,16,0.55)', textDecoration: 'none' }}
              aria-label="Back to style gallery"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
              <span className="hidden sm:inline">Back to Gallery</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <main className="flex overflow-hidden" style={{ height: '100vh', paddingTop: '5rem' }}>

        {/* ── LEFT PANEL: Scrollable checklist ──────────────────────────────── */}
        <section
          className="lg:w-3/5 xl:w-2/3 h-full overflow-y-auto px-6 lg:px-16 py-10"
          style={{
            background: '#FDF8F3',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(180,85,46,0.3) transparent',
          }}
        >
          <div className="max-w-3xl mx-auto space-y-12 pb-28">

            {/* Hero heading */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2" style={{ color: '#b8552e' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>flight_takeoff</span>
                <span
                  className="font-bold uppercase"
                  style={{ fontSize: '0.7rem', letterSpacing: '0.2em' }}
                >
                  Ready for Departure
                </span>
              </div>
              <h2
                className="leading-tight"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                  color: '#1A1410',
                }}
              >
                Your {primaryCity}
                <br />
                <em style={{ color: 'rgba(180,85,46,0.8)', fontStyle: 'italic' }}>Smart Checklist.</em>
              </h2>
              <p className="font-light max-w-lg" style={{ color: 'rgba(26,20,16,0.6)', fontSize: '1.0625rem', lineHeight: 1.7 }}>
                {weather
                  ? `${totalItems} items curated for ${weather.temperature_night_avg}°C – ${weather.temperature_day_avg}°C.${weather.precipitation_prob >= 50 ? ' High humidity detected.' : ''}`
                  : `${totalItems} items curated for your trip.`}
              </p>

              {/* Progress bar */}
              <div className="w-full h-1 mt-6 rounded-full overflow-hidden" style={{ background: 'rgba(26,20,16,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ background: '#b8552e', width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="flex justify-between font-medium uppercase mt-1" style={{ fontSize: '0.7rem', color: 'rgba(26,20,16,0.4)', letterSpacing: '0.1em' }}>
                <span>{packedCount}/{totalItems} Items Packed</span>
                <span>Weight: {packedWeight} / {totalWeight}kg</span>
              </div>
            </div>

            {/* ── Section 1: The Capsule Core ───────────────────────────── */}
            <div className="space-y-6">
              <h3
                className="flex items-center gap-3"
                style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.375rem', color: '#1A1410' }}
              >
                <span className="w-6 h-px" style={{ background: 'rgba(26,20,16,0.2)' }} />
                The Capsule Core ({capsuleItems.length})
              </h3>
              <div className="space-y-3" role="list" aria-label="Capsule clothing items">
                {capsuleItems.map(item => (
                  <div key={item.id} role="listitem">
                    <ChecklistRow
                      item={item}
                      checked={checked.has(item.id)}
                      onToggle={toggleItem}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 2: Weather Essentials ─────────────────────────── */}
            {weatherItems.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3
                    className="flex items-center gap-3"
                    style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.375rem', color: '#1A1410' }}
                  >
                    <span className="w-6 h-px" style={{ background: 'rgba(26,20,16,0.2)' }} />
                    Weather Essentials
                  </h3>
                  {showHumidityAlert && (
                    <span
                      className="font-bold uppercase"
                      style={{
                        fontSize: '0.625rem',
                        letterSpacing: '0.12em',
                        color: '#b8552e',
                        background: 'rgba(180,85,46,0.1)',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '3px',
                      }}
                    >
                      High Humidity Alert
                    </span>
                  )}
                </div>
                <div className="space-y-3" role="list" aria-label="Weather essential items">
                  {weatherItems.map(item => (
                    <div key={item.id} role="listitem">
                      <ChecklistRow
                        item={item}
                        checked={checked.has(item.id)}
                        onToggle={toggleItem}
                        highlight={item.priority === 'high'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 3: Personal Basics ────────────────────────────── */}
            <div className="space-y-6">
              <h3
                className="flex items-center gap-3"
                style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.375rem', color: '#1A1410' }}
              >
                <span className="w-6 h-px" style={{ background: 'rgba(26,20,16,0.2)' }} />
                Personal Basics
              </h3>
              <div
                className="p-6 space-y-4 rounded-sm"
                style={{ background: 'white', border: '1px solid rgba(26,20,16,0.05)' }}
                role="list"
                aria-label="Personal basics"
              >
                {basicItems.map(item => (
                  <div key={item.id} role="listitem">
                    <ChecklistRow
                      item={item}
                      checked={checked.has(item.id)}
                      onToggle={toggleItem}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── RIGHT SIDEBAR: sticky, desktop only ───────────────────────────── */}
        <section
          className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col h-full overflow-y-auto"
          style={{ background: 'white', borderLeft: '1px solid #F5EFE6' }}
          aria-label="Packing sidebar"
        >
          <div className="p-10 space-y-10 flex-grow">

            {/* Weather Alert Card */}
            <div
              className="relative overflow-hidden p-6"
              style={{
                background: '#FDF8F3',
                border: '1px solid rgba(180,85,46,0.2)',
                borderRadius: '2px',
              }}
            >
              {/* Decorative background icon */}
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[#b8552e]" style={{ fontSize: '4rem' }}>
                  {weatherIcon}
                </span>
              </div>
              <div className="relative z-10">
                <span
                  className="block font-bold uppercase mb-2"
                  style={{ fontSize: '0.625rem', letterSpacing: '0.2em', color: '#b8552e' }}
                >
                  Live Weather Alert
                </span>
                <h4
                  className="mb-2"
                  style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#1A1410' }}
                >
                  {primaryCity} Forecast:{' '}
                  {weather?.precipitation_prob && weather.precipitation_prob >= 50
                    ? 'High Humidity'
                    : weather?.climate_band === 'cold'
                    ? 'Cold Snap'
                    : weather?.climate_band === 'hot'
                    ? 'Heat Advisory'
                    : 'Mild Conditions'}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,20,16,0.7)' }}>
                  {weather?.style_hint ?? 'Pack versatile layers suited to your destination.'}
                </p>
                {weather && (
                  <div className="flex gap-4 mt-4">
                    <div>
                      <span className="block" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9c8c7e' }}>
                        Day Avg
                      </span>
                      <span className="font-bold" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1A1410' }}>
                        {weather.temperature_day_avg}°C
                      </span>
                    </div>
                    <div>
                      <span className="block" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9c8c7e' }}>
                        Night Avg
                      </span>
                      <span className="font-bold" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#1A1410' }}>
                        {weather.temperature_night_avg}°C
                      </span>
                    </div>
                    <div>
                      <span className="block" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9c8c7e' }}>
                        Rain Chance
                      </span>
                      <span className="font-bold" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: weather.precipitation_prob >= 50 ? '#b8552e' : '#1A1410' }}>
                        {weather.precipitation_prob}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bag Preview */}
            <div>
              <div className="flex justify-between items-end mb-6">
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.375rem', color: '#1A1410' }}>
                  Bag Preview
                </h3>
                <span
                  className="uppercase"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(26,20,16,0.4)' }}
                >
                  Carry-on Only
                </span>
              </div>

              {/* Suitcase diagram */}
              <div
                className="relative p-8 flex items-center justify-center"
                style={{
                  background: '#F4F4F4',
                  aspectRatio: '3 / 4',
                  border: '1px solid rgba(26,20,16,0.05)',
                }}
              >
                <div
                  className="absolute"
                  style={{ inset: '1rem', border: '1px dashed rgba(26,20,16,0.1)' }}
                />
                <div className="grid gap-4 w-full h-full relative z-10" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {/* Base Layer — full width */}
                  <div
                    className="col-span-2 flex items-center gap-3 p-3 shadow-sm"
                    style={{ background: 'white' }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F5EFE6' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#9c8c7e' }}>checkroom</span>
                    </div>
                    <div>
                      <span className="block font-bold uppercase" style={{ fontSize: '0.7rem', color: '#1A1410' }}>Base Layer</span>
                      <span style={{ fontSize: '0.625rem', color: '#9c8c7e' }}>Shoes &amp; Heavy Items</span>
                    </div>
                  </div>

                  {/* Rolled Knits */}
                  <div
                    className="flex flex-col justify-center items-center gap-2 p-3 shadow-sm"
                    style={{ background: 'white', aspectRatio: '1' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#b8552e' }}>all_inclusive</span>
                    <span className="uppercase text-center" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>Rolled Knits</span>
                  </div>

                  {/* Folded Pants */}
                  <div
                    className="flex flex-col justify-center items-center gap-2 p-3 shadow-sm"
                    style={{ background: 'white', aspectRatio: '1' }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#b8552e' }}>layers</span>
                    <span className="uppercase text-center" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>Folded Pants</span>
                  </div>

                  {/* Toiletries row — full width */}
                  <div
                    className="col-span-2 flex items-center justify-between p-3 backdrop-blur-sm"
                    style={{
                      background: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(180,85,46,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(180,85,46,0.1)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#b8552e' }}>wb_sunny</span>
                      </div>
                      <span className="font-medium" style={{ fontSize: '0.75rem', color: '#1A1410' }}>Toiletries (Top)</span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#16a34a' }}>check_circle</span>
                  </div>
                </div>

                {/* Weight banner */}
                <div
                  className="absolute flex items-center gap-3 whitespace-nowrap shadow-lg"
                  style={{
                    bottom: '-1.25rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1A1410',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    zIndex: 20,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>scale</span>
                  <span className="font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}>
                    Total Weight: {totalWeight}kg
                  </span>
                </div>
              </div>
              <p className="text-center italic mt-10" style={{ fontSize: '0.75rem', color: 'rgba(26,20,16,0.4)' }}>
                *Based on standard carry-on limits (10kg)
              </p>
            </div>

            {/* Pro Tip */}
            <div
              className="p-6 rounded-sm"
              style={{ background: 'rgba(245,239,230,0.5)' }}
            >
              <h5 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.0625rem', marginBottom: '0.5rem', color: '#1A1410' }}>
                Pro Tip
              </h5>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,20,16,0.7)' }}>
                {proTip}
              </p>
            </div>

          </div>

          {/* CTA — pinned to sidebar bottom */}
          <div
            className="p-10"
            style={{ background: 'white', borderTop: '1px solid #F5EFE6', marginTop: 'auto' }}
          >
            {progressPct < 100 ? (
              <button
                onClick={() => markAllPacked(allItems)}
                className="w-full font-bold uppercase flex items-center justify-center gap-3 transition-all duration-300 group hover:opacity-90"
                style={{
                  background: '#1A1410',
                  color: 'white',
                  height: '3.5rem',
                  letterSpacing: '0.1em',
                  fontSize: '0.8125rem',
                  boxShadow: '0 4px 20px rgba(26,20,16,0.2)',
                }}
                aria-label="Mark all items as packed"
              >
                <span>Mark All Packed</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '1.1rem' }}>
                  check_circle
                </span>
              </button>
            ) : (
              <a
                href={`/result/${tripId}`}
                className="w-full font-bold uppercase flex items-center justify-center gap-3 transition-all duration-300 group"
                style={{
                  background: '#b8552e',
                  color: 'white',
                  height: '3.5rem',
                  letterSpacing: '0.1em',
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(184,85,46,0.35)',
                }}
                aria-label="All packed — go back to gallery"
              >
                <span>I&apos;m All Packed</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '1.1rem' }}>
                  flight_takeoff
                </span>
              </a>
            )}
          </div>
        </section>
      </main>

      {/* ── Mobile Bottom Bar ────────────────────────────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 w-full z-40"
        style={{
          background: 'white',
          borderTop: '1px solid #F5EFE6',
          padding: '1rem',
          boxShadow: '0 -5px 20px rgba(0,0,0,0.05)',
        }}
        aria-label="Mobile packing progress bar"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <span
              className="block uppercase"
              style={{ fontSize: '0.625rem', letterSpacing: '0.12em', color: 'rgba(26,20,16,0.4)' }}
            >
              Total Weight
            </span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.125rem', fontWeight: 700, color: '#1A1410' }}>
              {totalWeight}kg
            </span>
          </div>
          <div className="text-right">
            <span
              className="block uppercase"
              style={{ fontSize: '0.625rem', letterSpacing: '0.12em', color: 'rgba(26,20,16,0.4)' }}
            >
              Progress
            </span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.125rem', fontWeight: 700, color: '#b8552e' }}>
              {progressPct}%
            </span>
          </div>
        </div>
        {progressPct < 100 ? (
          <button
            onClick={() => markAllPacked(allItems)}
            className="w-full font-bold uppercase transition-all duration-300"
            style={{
              background: '#1A1410',
              color: 'white',
              padding: '1rem',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
            }}
            aria-label="Mark all items packed"
          >
            Mark All Packed
          </button>
        ) : (
          <a
            href={`/result/${tripId}`}
            className="w-full font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: '#b8552e',
              color: 'white',
              padding: '1rem',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              display: 'flex',
            }}
            aria-label="All packed, back to gallery"
          >
            <span>I&apos;m All Packed</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>flight_takeoff</span>
          </a>
        )}
      </div>
    </>
  )
}

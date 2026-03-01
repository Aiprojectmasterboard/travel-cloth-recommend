'use client'

import { useState, useCallback } from 'react'
import {
  ViewProps,
  DEMO_OUTFIT_IMAGES,
  DEMO_CAPSULE_IMAGES,
  CITY_FILTERS,
  getCityFlag,
  getMonthName,
} from '../result-types'
import CityGallery from '../components/CityGallery'
import MultiCityTimeline from '../components/MultiCityTimeline'
import PackingWeatherCard from '../components/PackingWeatherCard'
import { regenerateOutfit } from '@/lib/api'

// Per-city style descriptors
const CITY_STYLE_DESCRIPTORS = [
  'The Classics',
  'Urban Edge',
  'Functional Minimal',
  'Coastal Ease',
  'Sun-Soaked Bold',
]

// Mood names per city index (fallback)
const CITY_MOOD_NAMES = [
  'Parisian Chic',
  'London Layered',
  'Amsterdam Cool',
  'Coastal Ease',
  'Sun-Soaked Bold',
]

// Style descriptions for Multi-City Timeline
const CITY_TIMELINE_STYLES = [
  'Chic & Structured',
  'Edgy & Layered',
  'Functional & Cool',
  'Relaxed & Breezy',
  'Bold & Vibrant',
]

// Style quotes per city index
const CITY_QUOTES = [
  'Effortlessly transition from day to night with versatile staples tailored for the cobblestone streets of Montmartre.',
  'Sophisticated layers designed to handle the unpredictable drizzle while looking sharp for high tea.',
  'Functional yet trendy pieces perfect for cycling along the canals and exploring modern art galleries.',
  'Light and breathable silhouettes made for sun-drenched days and golden-hour evenings.',
  'Bold statements balanced with comfort — made for spontaneous adventures under the Mediterranean sun.',
]

// Gallery image labels
const GALLERY_LABELS = [
  ['Detail', 'Venue', 'Look 2'],
  ['Footwear', 'Texture', 'Look 2'],
  ['Comfort', 'Accessory', 'Basic'],
  ['Detail', 'Venue', 'Look 2'],
  ['Comfort', 'Accessory', 'Look 2'],
]

// Demo weather per city (used when real data not available)
const DEMO_WEATHER_EMOJIS = ['🌧️', '☁️', '🌥️', '☀️', '⛅']
const DEMO_WEATHER_TEMPS = [
  '12°C - 18°C',
  '10°C - 15°C',
  '11°C - 16°C',
  '22°C - 28°C',
  '18°C - 25°C',
]

// Missing essentials demo products
const MISSING_ESSENTIALS = [
  {
    name: 'Leather Ankle Boots',
    price: '$120',
    image: DEMO_CAPSULE_IMAGES[1],
  },
  {
    name: 'Crossbody Bag',
    price: '$85',
    image: DEMO_CAPSULE_IMAGES[7],
  },
]

export default function ProView({ trip, tripId, onShare }: ViewProps) {
  const cities = trip.cities ?? []
  const month = getMonthName(trip.month)

  // Regenerate state: cityName → { loading, regenCount, newImageUrl }
  const [regenState, setRegenState] = useState<
    Record<string, { loading: boolean; count: number; newImageUrl: string | null }>
  >({})

  const handleRegenerate = useCallback(
    async (cityName: string) => {
      const current = regenState[cityName]
      if (current?.loading || (current?.count ?? 0) >= 1) return
      setRegenState((prev) => ({
        ...prev,
        [cityName]: { loading: true, count: prev[cityName]?.count ?? 0, newImageUrl: prev[cityName]?.newImageUrl ?? null },
      }))
      try {
        const result = await regenerateOutfit(tripId, cityName)
        setRegenState((prev) => ({
          ...prev,
          [cityName]: { loading: false, count: (prev[cityName]?.count ?? 0) + 1, newImageUrl: result.image_url },
        }))
      } catch {
        setRegenState((prev) => ({
          ...prev,
          [cityName]: { loading: false, count: prev[cityName]?.count ?? 0, newImageUrl: prev[cityName]?.newImageUrl ?? null },
        }))
      }
    },
    [tripId, regenState],
  )

  // Build a map of city name → generation job images
  const jobsByCity = new Map<string, string[]>()
  for (const job of trip.generation_jobs ?? []) {
    if (job.image_url) {
      const existing = jobsByCity.get(job.city) ?? []
      existing.push(job.image_url)
      jobsByCity.set(job.city, existing)
    }
  }

  // Build travel date range string
  let dayOffset = 1
  const cityDayRanges = cities.map((c) => {
    const start = dayOffset
    const end = dayOffset + (c.days ?? 3) - 1
    dayOffset = end + 1
    return { start, end }
  })

  const totalDays = cities.reduce((sum, c) => sum + (c.days ?? 3), 0)
  const travelDatesLabel = `${month} 1 - ${month} ${totalDays}`

  // Timeline thumbnails: use capsule demo images for each city
  const timelineThumbnails = cities.map((_, idx) => [
    DEMO_CAPSULE_IMAGES[idx % DEMO_CAPSULE_IMAGES.length],
    DEMO_CAPSULE_IMAGES[(idx + 2) % DEMO_CAPSULE_IMAGES.length],
    DEMO_CAPSULE_IMAGES[(idx + 4) % DEMO_CAPSULE_IMAGES.length],
  ])

  // Build packing weather list
  const packingWeatherCities = cities.map((c, idx) => ({
    name: c.name,
    temp: DEMO_WEATHER_TEMPS[idx % DEMO_WEATHER_TEMPS.length],
    emoji: DEMO_WEATHER_EMOJIS[idx % DEMO_WEATHER_EMOJIS.length],
  }))

  // Build timeline city entries
  const timelineCities = cities.map((c, idx) => ({
    name: c.name,
    style: CITY_TIMELINE_STYLES[idx % CITY_TIMELINE_STYLES.length],
  }))

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-8 md:py-12">
      {/* Hero header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.1] mb-4">
            Your Multi-City Style Guide
          </h1>
          <p className="text-stone-600 text-lg leading-relaxed">
            Curated for your journey. One capsule,{' '}
            {cities.length === 1 ? '1 city' : `${cities.length} cities`}.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="text-sm font-medium text-stone-500 uppercase tracking-wide">Travel Dates</p>
          <div className="flex items-center gap-2 text-stone-900 font-semibold bg-[#FDF8F3] px-4 py-2 rounded-lg shadow-sm border border-[#E8DEC9]">
            <span className="material-symbols-outlined text-[#C4613A]">calendar_month</span>
            {travelDatesLabel}
          </div>
        </div>
      </div>

      {/* Share button row */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => onShare()}
          className="flex items-center gap-2 bg-[#C4613A] hover:bg-[#A64D2B] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          Share Your Style Guide
        </button>
      </div>

      {/* 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Per-city sections */}
        <div className="lg:col-span-8 flex flex-col gap-16">
          {cities.map((cityObj, idx) => {
            const cityName = cityObj.name
            const flag = getCityFlag(cityName)
            const filter = CITY_FILTERS[idx % CITY_FILTERS.length]
            const moodName = CITY_MOOD_NAMES[idx % CITY_MOOD_NAMES.length]
            const descriptor = CITY_STYLE_DESCRIPTORS[idx % CITY_STYLE_DESCRIPTORS.length]
            const range = cityDayRanges[idx]
            const labels = GALLERY_LABELS[idx % GALLERY_LABELS.length]
            const quote = CITY_QUOTES[idx % CITY_QUOTES.length]
            const isFirst = idx === 0

            // Get images for this city (use regen image if available)
            const jobImages = jobsByCity.get(cityName) ?? []
            const regenImageUrl = regenState[cityName]?.newImageUrl
            const baseImages =
              jobImages.length >= 4
                ? jobImages.slice(0, 4)
                : [...jobImages, ...DEMO_OUTFIT_IMAGES.slice(0, 4 - jobImages.length)]
            const images = regenImageUrl
              ? [regenImageUrl, ...baseImages.slice(1)]
              : baseImages

            const cityRegenCount = regenState[cityName]?.count ?? 0
            const cityRegenLoading = regenState[cityName]?.loading ?? false

            // Quote border color: first city gets primary, others get muted
            const quoteBorderClass = isFirst ? 'border-[#C4613A]' : idx === 1 ? 'border-stone-400' : 'border-stone-500'

            return (
              <section
                key={cityName}
                className="space-y-6 scroll-mt-24"
                id={cityName.toLowerCase().replace(/\s+/g, '-')}
              >
                {/* City header */}
                <div className="flex justify-between items-end border-b border-[#E8DEC9] pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl" aria-label={`${cityName} flag`}>
                        {flag}
                      </span>
                      <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">
                        {moodName}
                      </h2>
                    </div>
                    <p className="text-stone-500 text-sm font-medium uppercase tracking-wide">
                      Days {range.start}-{range.end} &bull; {descriptor}
                    </p>
                  </div>

                  {/* Regenerate button */}
                  {cityRegenCount < 1 ? (
                    <div className="flex items-center gap-2">
                      {isFirst && (
                        <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded">
                          1 Free Regen
                        </span>
                      )}
                      <button
                        onClick={() => handleRegenerate(cityName)}
                        disabled={cityRegenLoading}
                        className="flex items-center gap-2 bg-[#C4613A] hover:bg-[#A64D2B] disabled:opacity-60 disabled:cursor-wait text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        aria-label="Regenerate style for this city"
                      >
                        <span className={`material-symbols-outlined text-lg ${cityRegenLoading ? 'animate-spin' : ''}`}>
                          autorenew
                        </span>
                        {cityRegenLoading ? 'Generating…' : 'Regenerate Style'}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2 bg-stone-300 text-stone-500 cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
                      disabled
                      aria-label="Regenerate used"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Regenerated
                    </button>
                  )}
                </div>

                {/* City gallery */}
                <CityGallery
                  images={images}
                  cityIndex={idx}
                  filter={filter}
                  labels={labels}
                />

                {/* Style quote */}
                <p
                  className={`text-stone-600 text-lg italic border-l-4 ${quoteBorderClass} pl-4 py-1`}
                >
                  &ldquo;{quote}&rdquo;
                </p>
              </section>
            )
          })}
        </div>

        {/* Right: Sticky sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="lg:sticky lg:top-24 space-y-8">
            {/* Multi-City Timeline */}
            <MultiCityTimeline
              cities={timelineCities}
              activeIndex={0}
              itemThumbnails={timelineThumbnails}
            />

            {/* Packing Weather */}
            <PackingWeatherCard cities={packingWeatherCities} />

            {/* Missing Essentials */}
            <div className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-[#E8DEC9]">
              <h3 className="font-bold text-stone-900 mb-4 font-serif">Missing Essentials?</h3>
              <div className="grid grid-cols-2 gap-3">
                {MISSING_ESSENTIALS.map((item) => (
                  <a key={item.name} className="block group" href="#" aria-label={item.name}>
                    <div className="aspect-square bg-stone-100 rounded-lg mb-2 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
                        style={{ backgroundImage: `url("${item.image}")` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-500">{item.price}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { regenerateOutfit } from '@/lib/api'
import Image from 'next/image'
import {
  type ViewProps,
  DEMO_OUTFIT_IMAGES,
  PAST_TRIPS,
  TRENDING_ITEMS,
  STYLE_DNA_SEGMENTS,
  getCityFlag,
  getMonthName,
} from '../result-types'
import TripsRemainingBar from '../components/TripsRemainingBar'
import StyleDNACard from '../components/StyleDNACard'
import PastTripsCarousel from '../components/PastTripsCarousel'

export default function AnnualView({ trip, tripId, onShare }: ViewProps) {
  const [activeCity, setActiveCity] = useState(0)
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenCount, setRegenCount] = useState(0)
  const [regenImageUrl, setRegenImageUrl] = useState<string | null>(null)

  const handleRegenerate = useCallback(async () => {
    if (regenLoading || regenCount >= 1) return
    const cityName = cities[activeCity]?.name ?? 'Unknown'
    setRegenLoading(true)
    try {
      const result = await regenerateOutfit(tripId, cityName)
      setRegenImageUrl(result.image_url)
      setRegenCount((c) => c + 1)
    } catch {
      // silently fail — user can retry
    } finally {
      setRegenLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenLoading, regenCount, activeCity, tripId])

  const cities = trip.cities ?? []
  const userName = trip.user_name ?? 'Traveler'
  const tripsRemaining = trip.trips_remaining ?? 11
  const mood = trip.generation_jobs?.[activeCity]?.mood ?? 'Urban Minimalist'
  const vibeDesc =
    trip.vibe_description ??
    'Curated for your adventure focusing on clean lines and versatile layering. We\u2019ve prioritized comfort for exploring by day and style for evenings out. The palette revolves around neutrals with terracotta accents.'

  // Build per-city image arrays from generation jobs, fallback to demo
  const cityImages: string[][] = cities.map((_, idx) => {
    const jobs = trip.generation_jobs?.filter((j) => j.city === cities[idx]?.name) ?? []
    const urls = jobs.map((j) => j.image_url).filter(Boolean) as string[]
    return urls.length > 0 ? urls : DEMO_OUTFIT_IMAGES
  })

  const activeCityName = cities[activeCity]?.name ?? 'Your City'
  const activeCityDays = cities[activeCity]?.days ?? 7
  const activeCityImages = cityImages[activeCity] ?? DEMO_OUTFIT_IMAGES
  // Use regen image as hero if available (resets when switching cities)
  const heroImageUrl = regenImageUrl ?? activeCityImages[0] ?? DEMO_OUTFIT_IMAGES[0]

  const outfitCards = activeCityImages.slice(0, 3)
  const outfitLabels = ['Day 1', 'Day 2', 'Day 3']
  const outfitDescriptions = [
    'Beige Trench + Loafers',
    'Layered Street Style',
    'Evening Black Dress',
  ]

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

  const monthLabel = getMonthName(trip.month)
  const tripDateRange = `${monthLabel} ${activeCityDays} days`

  const dominantSegment = STYLE_DNA_SEGMENTS.reduce((a, b) => (a.pct >= b.pct ? a : b))

  return (
    <div className="min-h-screen bg-[#FDF8F3] font-sans">
      {/* Annual Member Badge */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#F5EFE6] to-[#FDF8F3] border border-[#C8A96E]/30 rounded-full mb-8">
          <span className="material-symbols-outlined text-[#C8A96E] text-lg">workspace_premium</span>
          <span className="text-xs font-bold text-[#1A1410] uppercase tracking-wider">
            Annual Member
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#1A1410]/10 pb-8">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl font-medium mb-3 text-[#1A1410]">
              Welcome Back, {userName}
            </h1>
            <div className="flex items-center gap-2 text-[#8C8680] text-lg font-light">
              Ready for your next adventure?
            </div>
          </div>
          <TripsRemainingBar
            remaining={tripsRemaining}
            total={12}
            renewalDate={renewalDate}
          />
        </div>

        {/* Main 12-col Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* City Tabs + Hero Image Card */}
            <section className="bg-[#F5EFE6] rounded-2xl overflow-hidden shadow-sm border border-[#1A1410]/5">
              {/* City Tab Bar */}
              <div className="flex border-b border-[#1A1410]/10 bg-[#FDF8F3] overflow-x-auto">
                {cities.map((city, idx) => (
                  <button
                    key={city.name}
                    onClick={() => { setActiveCity(idx); setRegenImageUrl(null); setRegenCount(0) }}
                    className={[
                      'px-8 py-4 font-serif font-medium whitespace-nowrap transition-colors',
                      activeCity === idx
                        ? 'text-[#1A1410] font-bold border-b-2 border-[#C4613A] bg-[#F5EFE6]'
                        : 'text-[#8C8680] hover:text-[#1A1410] hover:bg-[#F5EFE6]/50',
                    ].join(' ')}
                    aria-label={`View ${city.name} outfits`}
                  >
                    {getCityFlag(city.name)} {city.name}
                  </button>
                ))}
                {cities.length === 0 && (
                  <button className="px-8 py-4 text-[#1A1410] font-serif font-bold border-b-2 border-[#C4613A] bg-[#F5EFE6] whitespace-nowrap">
                    Your City
                  </button>
                )}
              </div>

              {/* Hero Image */}
              <div className="relative h-80 md:h-[28rem] w-full group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${heroImageUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1410]/90 via-[#1A1410]/20 to-transparent" />

                {/* Hover action buttons top-right */}
                <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={handleRegenerate}
                    disabled={regenLoading || regenCount >= 1}
                    className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={regenCount >= 1 ? 'Already regenerated' : 'Regenerate Image'}
                    aria-label="Regenerate outfit image"
                  >
                    <span className={`material-symbols-outlined ${regenLoading ? 'animate-spin' : ''}`}>autorenew</span>
                  </button>
                  <button
                    className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                    title="Change Location"
                    aria-label="Change location"
                  >
                    <span className="material-symbols-outlined">edit_location</span>
                  </button>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                  <div className="flex justify-between items-end flex-wrap gap-4">
                    <div>
                      <div className="bg-[#C8A96E]/90 backdrop-blur-sm text-[#1A1410] px-3 py-1 rounded mb-3 inline-block text-xs font-bold uppercase tracking-wider shadow-sm">
                        Current Trip
                      </div>
                      <h2 className="font-serif text-5xl mb-2">{activeCityName}</h2>
                      <p className="text-white/90 text-lg font-light flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                        {tripDateRange}
                      </p>
                    </div>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenLoading || regenCount >= 1}
                      className="bg-white text-[#1A1410] hover:bg-[#C4613A] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
                    >
                      <span className={`material-symbols-outlined text-[20px] ${regenLoading ? 'animate-spin' : ''}`}>refresh</span>
                      {regenLoading ? 'Generating…' : regenCount >= 1 ? 'Regenerated ✓' : 'Regenerate Itinerary'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Capsule Section */}
              <div className="p-8 bg-[#F5EFE6]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-2xl text-[#1A1410]">
                    Your {mood} Capsule
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onShare(null)}
                      className="text-[#8C8680] hover:text-[#C4613A] transition-colors"
                      aria-label="Share capsule"
                    >
                      <span className="material-symbols-outlined">share</span>
                    </button>
                    <button
                      className="text-[#8C8680] hover:text-[#C4613A] transition-colors"
                      aria-label="Download capsule"
                    >
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </div>

                <p className="text-[#8C8680] mb-8 leading-relaxed max-w-3xl">{vibeDesc}</p>

                {/* Outfit Grid: 3 cards + 1 CTA */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {outfitCards.map((imgUrl, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 relative shadow-sm">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url('${imgUrl}')` }}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <span className="material-symbols-outlined text-sm text-[#1A1410]">
                            autorenew
                          </span>
                        </div>
                      </div>
                      <h4 className="font-serif font-bold text-[#1A1410]">
                        {outfitLabels[i]}: {activeCityName.split(',')[0]}
                      </h4>
                      <p className="text-xs text-[#8C8680]">{outfitDescriptions[i]}</p>
                    </div>
                  ))}

                  {/* See Full Wardrobe CTA */}
                  <div className="border border-dashed border-[#C4613A]/30 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:bg-[#C4613A]/5 transition-colors cursor-pointer aspect-[3/4]">
                    <span className="material-symbols-outlined text-[#C4613A] text-3xl mb-2">
                      checkroom
                    </span>
                    <span className="text-[#C4613A] font-bold text-sm">See Full Wardrobe</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-[#1A1410]/10">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1410] text-[#FDF8F3] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-md">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    View Full Itinerary
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#1A1410]/20 text-[#1A1410] rounded-lg text-sm font-bold hover:border-[#1A1410] hover:bg-white/50 transition-all">
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    Shop Missing Items
                  </button>
                </div>
              </div>
            </section>

            {/* Past Trips */}
            <PastTripsCarousel trips={PAST_TRIPS} />
          </div>

          {/* Right Column (4) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Weather Insights */}
            <div className="bg-white rounded-2xl p-6 border border-[#1A1410]/5 shadow-sm">
              <h3 className="font-serif text-xl text-[#1A1410] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C4613A]">partly_cloudy_day</span>
                Weather Insights
              </h3>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-serif text-[#1A1410]">18&deg;C</p>
                  <p className="text-[#8C8680] text-sm">{activeCityName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1A1410]">Partly Cloudy</p>
                  <p className="text-xs text-[#8C8680]">H: 23&deg; L: 14&deg;</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[#F5EFE6] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8C8680]">umbrella</span>
                    <span className="text-sm font-medium">Rain Probability</span>
                  </div>
                  <span className="text-sm font-bold text-[#1A1410]">20%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#F5EFE6] rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8C8680]">air</span>
                    <span className="text-sm font-medium">Wind Speed</span>
                  </div>
                  <span className="text-sm font-bold text-[#1A1410]">12 km/h</span>
                </div>
              </div>
            </div>

            {/* Style DNA Card */}
            <StyleDNACard
              segments={STYLE_DNA_SEGMENTS}
              dominantLabel={dominantSegment.label}
              trendingItems={TRENDING_ITEMS}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

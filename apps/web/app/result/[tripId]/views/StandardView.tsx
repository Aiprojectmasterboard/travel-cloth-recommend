'use client'

import { useState } from 'react'
import {
  ViewProps,
  DEMO_OUTFIT_IMAGES,
  DEMO_CAPSULE_IMAGES,
  DEMO_WARDROBE_ITEMS,
  getCityFlag,
  getMonthName,
} from '../result-types'
import DayPlanSelector from '../components/DayPlanSelector'
import OutfitBreakdown from '../components/OutfitBreakdown'
import CapsuleGrid from '../components/CapsuleGrid'
import StyleLogicCard from '../components/StyleLogicCard'
import WeatherForecastCard from '../components/WeatherForecastCard'
import CityMoodCard from '../components/CityMoodCard'
import ProUpgradeBanner from '../components/ProUpgradeBanner'

// Day activity labels (fallback when no daily_plan data)
const DAY_LABELS = ['Arrival', 'Museums', 'Shopping', 'Dinner', 'Versailles', 'Seine', 'Depart']

export default function StandardView({ trip, tripId, onShare }: ViewProps) {
  const [selectedDay, setSelectedDay] = useState(0)

  const primaryCity = trip.cities[0]?.name ?? 'Your City'
  const totalDays = trip.cities.reduce((sum, c) => sum + c.days, 0)
  const month = getMonthName(trip.month)

  // Build day plans from trip data or generate demo ones
  const dayPlans =
    trip.daily_plan && trip.daily_plan.length > 0
      ? trip.daily_plan
      : Array.from({ length: Math.max(totalDays, 7) }, (_, i) => ({
          day: i + 1,
          city:
            trip.cities[
              Math.min(
                Math.floor(i / Math.max(1, Math.ceil(totalDays / trip.cities.length))),
                trip.cities.length - 1,
              )
            ]?.name ?? primaryCity,
          outfit: 'Curated Outfit',
          activities: ['Explore', 'Discover'],
        }))

  // Day selector data
  const selectorDays = dayPlans.map((dp, i) => ({
    label: `Day ${dp.day}`,
    subLabel: DAY_LABELS[i % DAY_LABELS.length],
  }))

  // Images for 2x2 grid
  const jobImages = (trip.generation_jobs ?? []).filter((j) => j.image_url).map((j) => j.image_url!)
  const dayImages = [
    ...jobImages,
    ...DEMO_OUTFIT_IMAGES,
    ...DEMO_OUTFIT_IMAGES,
  ].slice(0, 4)

  // Wardrobe items
  const wardrobeItems =
    trip.wardrobe_items && trip.wardrobe_items.length > 0 ? trip.wardrobe_items : DEMO_WARDROBE_ITEMS

  // Outfit breakdown for selected day (rotate through items)
  const offset = selectedDay * 3
  const breakdownItems =
    wardrobeItems.slice(offset, offset + 3).length >= 3
      ? wardrobeItems.slice(offset, offset + 3)
      : wardrobeItems.slice(0, 3)
  const outfitItems = breakdownItems.map((item) => ({
    name: item.name,
    description: item.description ?? item.cities,
    imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[0],
  }))

  // Style quote
  const styleQuote =
    trip.vibe_description ??
    'Perfect for exploring Le Marais or a casual coffee stop. The trench adds sophistication while keeping you prepared for light showers.'

  // Capsule grid items
  const capsuleItems = wardrobeItems.slice(0, 10).map((item, i) => ({
    name: item.name,
    imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
  }))

  // Current day info
  const currentDay = dayPlans[selectedDay] ?? dayPlans[0]

  // Mood images & palette
  const moodImages = [DEMO_CAPSULE_IMAGES[0], DEMO_CAPSULE_IMAGES[1]]
  const palette = ['#D8C4B6', '#2C3333', '#F5EFE6']

  // Date range for weather card
  const dateRange = `${month} 12 - ${month} ${12 + totalDays - 1}`

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/50 text-stone-600 text-xs font-bold uppercase tracking-wider">
            Standard Plan
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#292524] leading-tight">
            Your {primaryCity} Capsule
          </h2>
          <p className="text-lg text-[#57534e]">
            A curated selection for your {totalDays}-day trip to {primaryCity}.
          </p>
        </div>
      </section>

      {/* First grid: Day card + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Day card + day plan */}
        <div className="lg:col-span-8 space-y-8">
          {/* Day card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#ebdacc]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-serif font-bold text-[#292524]">
                Day {currentDay.day}: {DAY_LABELS[(selectedDay) % DAY_LABELS.length]}
              </h3>
              <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] text-xs font-bold uppercase rounded-full tracking-wider">
                Standard Access
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 2x2 image grid */}
              <div className="grid grid-cols-2 gap-2 aspect-[3/4]">
                {dayImages.map((src, i) => (
                  <div
                    key={i}
                    className={`bg-cover bg-center ${
                      i === 0
                        ? 'rounded-tl-xl rounded-bl-sm'
                        : i === 1
                          ? 'rounded-tr-xl rounded-br-sm'
                          : i === 2
                            ? 'rounded-tl-sm rounded-bl-xl'
                            : 'rounded-tr-sm rounded-br-xl'
                    }`}
                    style={{ backgroundImage: `url("${src}")` }}
                  />
                ))}
              </div>

              {/* Outfit breakdown */}
              <OutfitBreakdown items={outfitItems} styleQuote={styleQuote} />
            </div>
          </div>

          {/* Day plan selector */}
          <DayPlanSelector
            days={selectorDays}
            activeDay={selectedDay}
            onChange={setSelectedDay}
            dateRange={dateRange}
          />
        </div>

        {/* Right: Style logic + weather */}
        <div className="lg:col-span-4 space-y-6">
          <StyleLogicCard
            description="Based on your goal to blend in with locals, we prioritized neutral tones and classic silhouettes. The trench is a staple for autumn, offering both style and utility."
            tags={['Minimalist', 'Walkable', 'Transitional Weather']}
          />
          <WeatherForecastCard
            city={`${primaryCity}, ${getCityFlag(primaryCity)}`}
            dateRange={dateRange}
            high="16°C"
            low="9°C"
            rainPct="20%"
          />
        </div>
      </div>

      {/* Second grid: Capsule essentials + city mood */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        <div className="lg:col-span-8">
          <CapsuleGrid
            items={capsuleItems}
            columns={5}
            totalLabel={`${capsuleItems.length} Core Items`}
          />
        </div>
        <div className="lg:col-span-4">
          <CityMoodCard
            city={primaryCity}
            month={month}
            description={trip.vibe_description}
            moodImages={moodImages}
            palette={palette}
          />
        </div>
      </div>

      {/* Pro upgrade banner */}
      <ProUpgradeBanner
        onUpgrade={() => onShare()}
        backgroundImageUrl={DEMO_CAPSULE_IMAGES[0]}
      />
    </div>
  )
}

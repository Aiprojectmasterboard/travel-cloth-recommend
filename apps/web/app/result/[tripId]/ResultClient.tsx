'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ShareModal from '@/components/ShareModal'
import UpgradeModal from '@/components/funnel/UpgradeModal'
import AuthButton from '@/components/AuthButton'

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? ''

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  category?: string
  image_url?: string
  description?: string
  material?: string
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
  upgrade_token?: string | null
  plan?: 'standard' | 'pro' | 'annual'
  face_url?: string | null
  vibe_description?: string
  user_name?: string
  trips_remaining?: number
}

// ─── Demo images (from design reference) ──────────────────────────────────────

const DEMO_OUTFIT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAUkfJti7ncs3Fl2rfEcDXfgUzCOk19d5TmPElax6hp9uCN2ASSMW1GlpG4Y7Qjj1cmkrbcpPV2Q2GdGcLh0Ds3B95gGlIG3xpjZhQubc4vhKwrmIgzEeXceo4N0fOH_UBoSOfrMjpqYdLhHQbVl0KuL5NuJUBJRWIRVxg095dY3SQXbyKWZ4HBM1F6_81emm4gY_kbwhVjpSpH6HjsI4UxGoFTQz4dssuSE22WBdHGbmgIWlDoZ3oGeRVGYZWwVp2Wzbh_p7CwjQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAu15YAjFFK3tRmrnKHndUgC_QjkTTUkBlh4b6pg9ZV6v0uvwEPAdfIAuo5571YnV4IpkvU0YUN2QlB_B3I02Cv3z6H4x16Y3YPlWamtHd80VBWpMdxFTkjIy9oZAccBquOs5bgnNKP-RR9M4OnkPJQ2wP1z5glM4fcjM3IH1loz6ehtSpRnb-HmWh1cr0WjsRwgO4Okw1pD3VkhP5lVpRKlgaS3JZ-MTNVhtLn0_R4F7KVum7FRHPcaWXhubWbPAGIeIq07OEchQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAPiPONgmq89OGeIiLNBXwWqxlWnHBTBq2eHGGuIgQzHIq9la1irZg2kbL7v_Q_LGSuaImezkm_rdpipofdsn80CrxcEELE2rOvIZU4hUTmkcTsEm8SuTnGyt2HpDdO_mw4L5CrRWbRqXtC-uNs7vTcF0AGn6en2t8QTB8yVEZh_ekW-T6Qbl201cT9iq5gQgsY0cLXNtf1WLhgDiSWkww_dYLgEttnovDm4hspBJvvikgal9UFVXdCdt9vAiyzDj6-yRl8_iDIow',
]

const DEMO_CAPSULE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBuDZpw2j1UzGEniy99oLu1dMw8C9pt47t2QTBwGzBqUO_XRCxc7I9tum9gsl3Nwd_sChNDDdALN3nc69GmJlKZZJlEL-TUuCRx0ftUO-VCWwAGqvxcfF9STmKkV9XOwkjEHjpXm880G02H_RZ-VpWkl0wxIq0upTAXu5FSFnKMOjENTyVw2D4WyT79WCZk0bhSr6Dke4weNfyafNMEDuOShal8omWnIFgj7FQH5HphD__CVCRc412NmGpT3k-jnJNQazGQf-mTKA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrzUDy49psS8F5LDzffltmsyM3lJPC-jMI0P93Ftm1ApLbO8nGA0DGWC-PNgS-BbO5NAVmXd7zw3-Qi4PV1lXmWUBItV4SCnN2g9apscIPH45uv-hkBkhgh-IKFhncdI7DisiayLI2f9CU-IwLVLEqowlaZfEJn7KmRSqOM6fLxJx2BDLBmdEHe5cybaadkW6XqeVp4RNNpFgijkhuB1yXdm7Y8FxYaI1RvCDfsHZhh94JbApFULX3M1cx8E6H2P_k6TWuDt0T0A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA0x1D60f5ErF5Jk6cFoWsgvDAK2Vb14Axm3UnC05hmaGWTaNIsd7DnFU5K02ZBq8jnOMk4W3x7NyteJ-3ejV1_aU4QAUoIY7uxjOG7bH6q1h_2WEAZoPikB5VeR4_-MW3cBvp2_Z0eat0GiB8chyqwlTZUomAnkMB5GneSPk34BpsZVt2JFooQ3onYImLq45t881S2CeUDs6OOk1-Jr372j4ynsueI5QZ_9xMyo9rM_151WWeftMxDVB5XipQ-xv5bDw10dnE40w',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAR87ZxegUPUJJnp9F01VL-_HOAT0Vn-CP-gNffgmHBGlJi63ELC9MqNhrlbvbUO613z1Df-lYJdIWAE507RwLEq9UDjJ9pd4Mxg1_nx4rlw2lkcrQC1DJuKWFUm8yGNi6drRevq6Kxjp97z0bzwmkRIFXMkEoSP5-U6aofIZHFTzVBf57Jg6zWdseA8GhMNaHPirCO62FNFcPj7XvhzHWfCs3TucoUozkBkD_jGcHPKliPgTCSp5HzHnXg43-WqPAvPzlY1W4j5A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCjiar1RSTcMTXjwc2xX5oukbh6iJ4Sg2tS5kxC741mabKosXVRzJfF8SxvB67YStWc-EVLWesOZI3iR38v8oI-K1qYDh3ECLi150mhQI5rAjI9MSuwgHkfuzug8cN3Gl8xp6gxyGQtCn2Sl2NELCDviWaoRo8LyV9nxwRifihzyFgkX7y5i3SbFJZBTsdctqWu91Arr6IyrfSjdILugo8lHEg6E3C4I7wE2kdfYz13pf8jWdVmrKJuswhBrGViDGj8gI2BiONsPg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmQIJKYrBC4RMHxxOqC7byLE0jXcMdldgl4lnglKhoyt7RLr7VFUP-DgMsiZdHkZIac2FV8zQgnNNY1HBsLX_iDr1NYq4mXUvOylVi-qMd392pa_yRdD5YTb_01rU5tiyPUUufdBNAEe8FmTXsDrlwtEDPhKNze8Z8LDQSNseBLh-pxiQyJSAGagEBJRDmFbHwgICzlTUw93OeQ7F4YpXPqLbR1MEh97mthThsQcnfl_fBclxnEJeBkjreyeqxD6VqIyRI-Pukyw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLbZmKMHRseFwsYcffoHcvvUcnvo8ncLnYjnW6JpzewsaJoHb3JegJ24ZzYsGf-IMyANaCuv9OZPR_8JCTmt5pr-AF57qlw4G8TAI9Loj1_cPmVxKtOvY23-EovaeCTDHSB_DR7Tx_jB-SnklGvYh5hCoariDzFrc3WPHPE0L08yIYF0AFvIDqNr5hIjraLGlZqzJ0eDK00j0xFMZbJ7cg2N1bpUIM6wtUUwVBN__vW9PS5J_lDNU0PJ63gEWHdXkGu2mmxbf0qw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCiNuv6-6Mr613PqsCBF82iPIkUuVOXf4NfFmsv1mF1pkVhzQADelEo-kswgYBG5BxEzSA2nbpo-2Dv1XLl2b1p_C47xpXp1cQqoJbTurIDJbE1B7tCRPOrEU2QFnVuDzYpTTmgzQE0dzvF6uzswLVG8LulsZYt2FO46bWaThqB0PTm_LjPv98SUWR9qqzrDDxnAVIB7pr6I2s_-3ghWN_uHNg9iP9QaV2j3ayk-ruA25mz0zfZSwXseo7GRotTDIHZ6GxLTQqvRQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA3VACVMKt1VLyiS6LQFplRcRhsEqv-F7TQCfLrifm2prCZQ0zQrXdANosGI5_H8uGwLnf-E8DUYUq1WNKCiWe3xf8x7_KKftALjn--t8nZJ7fcDtezCKhC30l75-dFauuOzxkoOiqSjfjCyVRkM7uDJ7VP5zLm9DepX4fMBIDRTsTdDtT2M9__hsbSVlFKdMyz52xRpLJHEIOg_fln6GgYI7DMZzf-GgQoUjIlzCrYxPXz8ylcG_ixkIqqsdbcZ4lkSzgX6EmV6Q',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDuy6UZnX8r4LwBcUQeYMU25MZO0HRF4RnBqF4bwbLiOOa-YeQNoBGYCHCDugoqlv1sZhg-9LQFF36WNTDAQEs9yFSV3YzMh3VM70TVdsldMjKNtbx4k98pQS2r8QHVHIZW-fVGI9JwLchU_tKwEd-bkLL_l1hcAy52yKu6E1w0MtBTnDqh-Squ_8re1WUTCRkRnhfjH3C5p8MRXYbiCYt3KOfzdoQd1p173I9qyXyHKQ8J3jTVQIhZgqd7DJ4-dheDcDrQCms6mA',
]

const EMOJI_CATEGORY: Record<string, string> = {
  '🧥': 'Outerwear', '👕': 'Essential', '👖': 'Bottoms', '👗': 'Evening',
  '👟': 'Footwear', '👠': 'Footwear', '👡': 'Footwear', '👢': 'Footwear',
  '👜': 'Accessory', '👝': 'Accessory', '🎒': 'Accessory',
  '🧣': 'Accessory', '🧤': 'Accessory', '🧢': 'Accessory',
}

const TIME_SLOTS = ['Morning', 'Evening', 'Afternoon', 'Morning', 'Evening', 'Afternoon']
const WEATHER_SLOTS = [
  { temp: '14°C', condition: 'Breeze', icon: 'air' },
  { temp: '16°C', condition: 'Clear', icon: 'nightlight' },
  { temp: '18°C', condition: 'Sunny', icon: 'wb_sunny' },
  { temp: '15°C', condition: 'Cloudy', icon: 'cloud' },
  { temp: '12°C', condition: 'Rainy', icon: 'rainy' },
  { temp: '20°C', condition: 'Sunny', icon: 'wb_sunny' },
]

const CITY_FLAGS: Record<string, string> = {
  Paris: '🇫🇷', London: '🇬🇧', Tokyo: '🇯🇵', Rome: '🇮🇹', Barcelona: '🇪🇸',
  Amsterdam: '🇳🇱', Seoul: '🇰🇷', Bali: '🇮🇩', 'New York': '🇺🇸', Milan: '🇮🇹',
  Vienna: '🇦🇹', Prague: '🇨🇿', Bangkok: '🇹🇭', Sydney: '🇦🇺', Lisbon: '🇵🇹',
}

function getCityFlag(city: string): string {
  return CITY_FLAGS[city] ?? '🌍'
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan?: 'standard' | 'pro' | 'annual' }) {
  if (plan === 'annual') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-wide">
        <span className="material-symbols-outlined !text-sm">workspace_premium</span>
        Annual Member
      </div>
    )
  }
  if (plan === 'pro') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wide">
        <span className="material-symbols-outlined !text-sm">diamond</span>
        Pro Plan
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wide">
      Standard Access
    </div>
  )
}

// ─── Processing View ──────────────────────────────────────────────────────────

function ProcessingView({ trip }: { trip: Trip }) {
  const completed = trip.generation_jobs.filter(j => j.status === 'completed').length
  const total = Math.max(trip.generation_jobs.length, 1)
  const progress = Math.round((completed / total) * 100)

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <p className="text-xs uppercase tracking-[0.15em] text-primary font-bold mb-4">Creating Your Capsule</p>
        <h1 className="font-playfair text-4xl text-secondary mb-3 leading-tight">
          Styling Your <span className="italic text-primary">Journey</span>
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          Your personalized travel wardrobe is being crafted by AI.
        </p>

        <div className="bg-sand rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted mb-8">{completed} / {total} items generated ({progress}%)</p>

        <div className="space-y-3 text-left">
          {trip.generation_jobs.map(job => (
            <div
              key={job.id}
              className="flex items-center gap-3 px-4 py-3 bg-cream rounded-xl border border-[#ebdcd5] text-sm"
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${
                job.status === 'completed' ? 'bg-green-600'
                : job.status === 'processing' ? 'bg-primary animate-pulse'
                : 'bg-sand'
              }`}>
                {job.status === 'completed' ? '✓' : job.status === 'processing' ? '→' : ''}
              </span>
              <span className="text-secondary font-medium">{job.city}</span>
              <span className="text-muted">— {job.mood}</span>
              <span className={`ml-auto text-xs ${
                job.status === 'completed' ? 'text-green-600'
                : job.status === 'processing' ? 'text-primary'
                : 'text-muted'
              }`}>
                {job.status === 'completed' ? 'Done'
                : job.status === 'processing' ? 'Generating…'
                : 'Waiting'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Error View ───────────────────────────────────────────────────────────────

function ErrorView({ tripId }: { tripId: string }) {
  return (
    <div className="text-center py-32 px-6">
      <p className="text-5xl mb-4">😕</p>
      <h1 className="font-playfair text-3xl text-secondary mb-3">Trip not found</h1>
      <p className="text-muted mb-8 leading-relaxed">
        Trip ID: {tripId}
        <br />
        This trip may have expired or doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
      >
        Back to Home
      </a>
    </div>
  )
}

// ─── Standard View ────────────────────────────────────────────────────────────

function StandardView({
  trip,
  tripId,
  onShare,
}: {
  trip: Trip
  tripId: string
  onShare: (url?: string | null) => void
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const cityNames = trip.cities.map(c => c.name)
  const primaryCity = cityNames[0] ?? 'Your City'
  const totalDays = trip.cities.reduce((s, c) => s + c.days, 0)
  const hasFacePhoto = Boolean(trip.face_url)

  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed')
  const outfitCards = completedJobs.map((job, i) => ({
    ...job,
    displayImage: job.image_url ?? DEMO_OUTFIT_IMAGES[i % DEMO_OUTFIT_IMAGES.length],
    timeLabel: `Day ${i + 1} • ${TIME_SLOTS[i % TIME_SLOTS.length]}`,
    ...WEATHER_SLOTS[i % WEATHER_SLOTS.length],
  }))

  const capsuleItems = (trip.wardrobe_items ?? []).map((item, i) => ({
    ...item,
    displayImage: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
    displayCategory: item.category ?? EMOJI_CATEGORY[item.emoji] ?? 'Essential',
  }))

  function scrollCarousel(dir: 'prev' | 'next') {
    const el = carouselRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-outfit-card]')
    const w = card ? card.offsetWidth + 24 : 424
    el.scrollBy({ left: dir === 'next' ? w : -w, behavior: 'smooth' })
  }

  const DEMO_OUTFIT_ITEMS = [
    { emoji: '🧥', name: 'Classic Trench', desc: 'Water-resistant, beige' },
    { emoji: '👖', name: 'Straight Leg Denim', desc: 'Medium wash, high rise' },
    { emoji: '👡', name: 'Leather Loafers', desc: 'Black, gold hardware' },
  ]

  const STYLE_TAGS = ['Versatile', 'Packable', 'Weather-Matched']

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[#ebdcd5] py-10 px-6 md:px-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider">
              Standard Access
            </div>
            {hasFacePhoto && (
              <div className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold">
                <span className="material-symbols-outlined !text-sm">camera_alt</span>
                Styled with Your Photo
              </div>
            )}
          </div>
          <h1 className="font-playfair text-4xl md:text-6xl font-medium text-secondary leading-tight">
            Your {primaryCity} Capsule
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            A curated selection for your {totalDays}-day trip to {cityNames.join(', ')}.
          </p>
        </div>
      </section>

      {/* 12-col grid */}
      <div className="px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left col-span-8 */}
        <div className="lg:col-span-8 space-y-8">
          {outfitCards.map((card, i) => (
            <div key={card.id} className="bg-white rounded-2xl p-6 shadow-sm border border-[#ebdacc]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-playfair text-2xl font-bold text-secondary">
                  Day {i + 1}: {card.mood}
                </h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                  Standard Access
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden relative group">
                  {hasFacePhoto && (
                    <div className="absolute top-3 left-3 bg-primary/90 text-white rounded-sm px-2 py-0.5 text-xs font-bold backdrop-blur-sm z-10">
                      Your Style
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.displayImage}
                    alt={`${card.city} ${card.mood}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg">
                    <p className="font-playfair italic text-lg text-center text-secondary">&ldquo;{card.mood}&rdquo;</p>
                  </div>
                </div>
                {/* Outfit Breakdown */}
                <div className="flex flex-col justify-center space-y-6">
                  <h4 className="text-lg font-bold uppercase tracking-wide text-muted border-b border-stone-200 pb-2">
                    Outfit Breakdown
                  </h4>
                  {hasFacePhoto && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined !text-sm">check_circle</span>
                      AI generated using your uploaded photo
                    </p>
                  )}
                  <div className="space-y-4">
                    {DEMO_OUTFIT_ITEMS.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center flex-shrink-0 text-2xl">
                          {item.emoji}
                        </div>
                        <div>
                          <p className="font-playfair font-bold text-lg text-secondary">{item.name}</p>
                          <p className="text-sm text-muted">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-sm text-muted italic">
                      &ldquo;Perfect for exploring the city streets. Versatile pieces that transition from day to evening effortlessly.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Daily Style Guide Carousel */}
          {outfitCards.length > 0 && (
            <section className="pt-6 border-t border-[#ebdcd5]">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h2 className="font-playfair text-3xl md:text-4xl text-secondary mb-2">Daily Style Guide</h2>
                  <p className="text-muted max-w-md">Pre-styled combinations for your itinerary.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel('prev')}
                    className="w-10 h-10 rounded-full border border-[#ebdcd5] flex items-center justify-center text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all"
                    aria-label="Previous"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <button
                    onClick={() => scrollCarousel('next')}
                    className="w-10 h-10 rounded-full border border-[#ebdcd5] flex items-center justify-center text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all"
                    aria-label="Next"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {outfitCards.map((card) => (
                  <div
                    key={card.id}
                    data-outfit-card
                    className="min-w-[85vw] md:min-w-[400px] snap-center group cursor-pointer flex-shrink-0"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm mb-4">
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary rounded-sm z-10">
                        {card.timeLabel}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.displayImage}
                        alt={`${card.city} ${card.mood}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs flex items-center gap-1.5 border border-white/10">
                          <span className="material-symbols-outlined !text-sm">thermometer</span>
                          {card.temp}
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg text-white text-xs flex items-center gap-1.5 border border-white/10">
                          <span className="material-symbols-outlined !text-sm">{card.icon}</span>
                          {card.condition}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-playfair text-2xl text-secondary mb-1 group-hover:text-primary transition-colors">
                      {card.mood}
                    </h3>
                    <p className="text-muted text-sm">{card.city}</p>
                  </div>
                ))}
              </div>
              <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>
            </section>
          )}

          {/* N-Item Capsule Grid */}
          {capsuleItems.length > 0 && (
            <section className="pt-6 border-t border-[#ebdcd5]">
              <div className="text-center mb-10">
                <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
                  Minimalist Packing
                </span>
                <h2 className="font-playfair text-4xl md:text-5xl text-secondary mb-4">
                  The {capsuleItems.length}-Item Capsule
                </h2>
                <p className="text-muted max-w-lg mx-auto">
                  Everything you need for your trip, designed to mix and match effortlessly.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-10 gap-x-6">
                {capsuleItems.map((item, i) => (
                  <div key={i} className="flex flex-col group cursor-pointer">
                    <div className="relative w-full aspect-[4/5] bg-cream rounded-sm overflow-hidden mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.displayImage}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm text-secondary hover:text-primary">
                        <span className="material-symbols-outlined !text-lg">favorite</span>
                      </button>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <h4 className="font-sans font-bold text-secondary text-sm md:text-base">{item.name}</h4>
                      <span className="text-xs text-muted mt-0.5 uppercase tracking-wide">{item.displayCategory}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="py-10 text-center border-t border-[#ebdcd5]">
            <h2 className="font-playfair text-3xl text-secondary mb-6">Ready to pack this capsule?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={`/checklist/${tripId}`}
                className="bg-primary text-white font-bold h-12 px-8 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined !text-sm">checklist</span>
                View Packing Checklist
              </a>
              <button
                onClick={() => onShare(completedJobs[0]?.image_url)}
                className="bg-transparent border border-secondary text-secondary font-bold h-12 px-8 rounded-full hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined !text-sm">share</span>
                Share Capsule
              </button>
            </div>
          </section>
        </div>

        {/* Right sidebar col-span-4 */}
        <div className="lg:col-span-4 space-y-6">
          {/* Style Logic */}
          <div className="bg-cream rounded-2xl p-6 border border-[#ebdcd5]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="font-playfair font-bold text-secondary">Style Logic</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Based on your destination and travel month, we selected neutral tones and classic silhouettes — versatile pieces that handle every moment.
            </p>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map(tag => (
                <span key={tag} className="bg-sand rounded-full px-3 py-1 text-xs font-medium text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className="bg-white rounded-2xl p-6 border border-[#ebdcd5]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Weather Forecast</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-playfair text-2xl font-bold text-secondary">{primaryCity}</p>
                <p className="text-sm text-muted">{trip.month}</p>
              </div>
              <span className="material-symbols-outlined text-primary !text-4xl">partly_cloudy_day</span>
            </div>
            <div className="flex justify-between items-center bg-cream rounded-xl p-4">
              <div className="text-center">
                <span className="block text-xs font-bold uppercase text-muted mb-1">Avg High</span>
                <span className="text-xl font-bold text-secondary">22°C</span>
              </div>
              <div className="h-8 w-px bg-[#ebdcd5]" />
              <div className="text-center">
                <span className="block text-xs font-bold uppercase text-muted mb-1">Avg Low</span>
                <span className="text-xl font-bold text-secondary">14°C</span>
              </div>
              <div className="h-8 w-px bg-[#ebdcd5]" />
              <div className="text-center">
                <span className="block text-xs font-bold uppercase text-muted mb-1">Rain</span>
                <span className="text-xl font-bold text-secondary">20%</span>
              </div>
            </div>
          </div>

          {/* City Mood */}
          <div className="bg-cream rounded-2xl p-6 border border-[#ebdcd5]">
            <h3 className="font-playfair text-xl font-bold text-secondary mb-3">City Mood</h3>
            <div className="h-0.5 w-10 bg-primary mb-4" />
            <p className="text-sm text-muted italic leading-relaxed mb-4">
              {trip.vibe_description ??
                `${primaryCity} in ${trip.month} — a blend of style and adventure. Think versatile layers and classic pieces that adapt to every moment.`}
            </p>
            {outfitCards[0] && (
              <div className="rounded-xl overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outfitCards[0].displayImage}
                  alt={`${primaryCity} vibe`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pro View ─────────────────────────────────────────────────────────────────

function ProView({
  trip,
  tripId,
  onShare,
}: {
  trip: Trip
  tripId: string
  onShare: (url?: string | null) => void
}) {
  const [activeCity, setActiveCity] = useState(0)
  const cityNames = trip.cities.map(c => c.name)

  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed')

  const jobsByCity = cityNames.map(city =>
    completedJobs.filter(j => j.city === city)
  )

  const activeCityJobs = jobsByCity[activeCity] ?? completedJobs.slice(0, 3)
  const activeJob = activeCityJobs[0]
  const activeImage = activeJob?.image_url ?? DEMO_OUTFIT_IMAGES[activeCity % DEMO_OUTFIT_IMAGES.length]
  const sideImages = [
    activeCityJobs[1]?.image_url ?? DEMO_OUTFIT_IMAGES[(activeCity + 1) % DEMO_OUTFIT_IMAGES.length],
    activeCityJobs[2]?.image_url ?? DEMO_OUTFIT_IMAGES[(activeCity + 2) % DEMO_OUTFIT_IMAGES.length],
  ]

  const dayJob = activeJob
  const dayImage = dayJob?.image_url ?? DEMO_OUTFIT_IMAGES[activeCity % DEMO_OUTFIT_IMAGES.length]
  const hasFacePhoto = Boolean(trip.face_url)

  const DEMO_PRO_ITEMS = [
    { name: 'Classic Camel Trench', material: 'Water resistant, lightweight', thumb: DEMO_CAPSULE_IMAGES[0] },
    { name: 'Breton Striped Top', material: 'Cotton blend, breathable', thumb: DEMO_CAPSULE_IMAGES[1] },
    { name: 'Straight Leg Denim', material: 'Medium wash, high rise', thumb: DEMO_CAPSULE_IMAGES[2] },
  ]

  const CITY_WEATHER: Record<string, string> = {
    Paris: '12°C - 18°C 🌧️',
    London: '10°C - 15°C ☁️',
    Amsterdam: '11°C - 16°C 🌥️',
    Tokyo: '15°C - 22°C 🌤️',
    Rome: '14°C - 20°C ☀️',
    Barcelona: '16°C - 23°C ⛅',
    Seoul: '12°C - 19°C 🌥️',
  }

  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-10 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined !text-sm">diamond</span>
              Pro Plan Active
            </div>
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-secondary leading-tight">
              Your Multi-City Style Guide
            </h1>
            <p className="text-muted text-lg leading-relaxed">
              Curated for your journey. One capsule, {cityNames.length} cities.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm font-medium text-muted uppercase tracking-wide">Travel Dates</p>
            <div className="flex items-center gap-2 text-secondary font-semibold bg-cream px-4 py-2 rounded-lg shadow-sm border border-[#ebdcd5]">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              {trip.month}
            </div>
          </div>
        </div>
      </section>

      {/* City Tabs */}
      <div className="border-b border-[#ebdcd5] overflow-x-auto">
        <div className="flex gap-8 px-6 md:px-10 overflow-x-auto pb-px">
          {cityNames.map((city, i) => (
            <button
              key={city}
              onClick={() => setActiveCity(i)}
              className={`flex items-center gap-2 pb-4 border-b-2 px-2 min-w-max transition-all font-playfair font-bold text-lg ${
                i === activeCity
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:border-stone-300 hover:text-secondary'
              }`}
            >
              <span className="text-2xl">{getCityFlag(city)}</span>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 12-col grid */}
      <div className="px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left col-span-8 */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* City Mood + Photo Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-secondary">
                {activeJob?.mood ?? `${cityNames[activeCity]} Style`}
              </h2>
              <span className="text-muted text-sm font-medium">{trip.cities[activeCity]?.days ?? 3} Days</span>
            </div>
            <p className="text-muted max-w-2xl text-lg leading-relaxed">
              {trip.vibe_description ??
                `Effortlessly transition from day to night with versatile staples tailored for the streets of ${cityNames[activeCity]}.`}
            </p>
            {/* Photo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                {hasFacePhoto && (
                  <div className="absolute top-3 left-3 bg-primary/90 text-white rounded-sm px-2 py-0.5 text-xs font-bold backdrop-blur-sm z-10">
                    Your Style
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt={`${cityNames[activeCity]} style`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'sepia(0.1)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white font-playfair text-xl italic">
                    {activeJob?.mood ?? 'City Style'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 h-full">
                {sideImages.map((img, idx) => (
                  <div key={idx} className="relative flex-1 rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${cityNames[activeCity]} look ${idx + 2}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: 'sepia(0.1)' }}
                    />
                    <div className="absolute top-4 right-4 bg-cream/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm text-secondary">
                      {idx === 0 ? 'Museum Ready' : 'Dinner Look'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Card */}
          <div className="bg-cream rounded-2xl p-6 md:p-8 shadow-sm border border-[#ebdcd5] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
              {/* Image + Regenerate */}
              <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <div className="aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md relative">
                  {hasFacePhoto && (
                    <div className="absolute top-3 left-3 bg-primary/90 text-white rounded-sm px-2 py-0.5 text-xs font-bold backdrop-blur-sm z-10">
                      Your Style
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dayImage}
                    alt={dayJob?.mood ?? 'Day outfit'}
                    className="w-full h-full object-cover"
                    style={{ filter: 'sepia(0.1)' }}
                  />
                </div>
                <div className="bg-sand p-4 rounded-xl border border-[#ebdcd5]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-primary tracking-wide">Pro Feature</span>
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded">1 Free Swap Remaining</span>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                    <span className="material-symbols-outlined !text-lg">autorenew</span>
                    Regenerate This Look
                  </button>
                </div>
              </div>

              {/* Outfit Details */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <h3 className="font-playfair text-2xl font-bold text-secondary mb-2">
                  Day 1: The {cityNames[activeCity]} Stroll
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  A classic combination perfect for exploring the city and cafe hopping.
                </p>
                <div className="space-y-6">
                  {DEMO_PRO_ITEMS.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div
                        className="size-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200"
                        style={{ backgroundImage: `url(${item.thumb})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-secondary text-sm">{item.name}</h4>
                        <p className="text-muted text-xs mb-1">{item.material}</p>
                        <a
                          href="#"
                          className="text-primary text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Shop Similar <span className="material-symbols-outlined !text-[10px]">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right col-span-4 */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Multi-City Logic */}
          <div className="bg-cream rounded-2xl p-6 shadow-sm border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary text-white p-1 rounded">
                <span className="material-symbols-outlined !text-sm">hub</span>
              </div>
              <h3 className="font-playfair font-bold text-secondary">Multi-City Logic</h3>
            </div>
            <p className="text-sm text-muted mb-5">
              See how your core items adapt from city to city.
            </p>
            <div className="relative pl-4 border-l-2 border-dashed border-[#ebdcd5] space-y-8">
              {cityNames.map((city, i) => (
                <div key={city} className={`relative ${i !== activeCity ? 'opacity-60' : ''}`}>
                  <div
                    className={`absolute -left-[21px] top-1 size-3 rounded-full ring-4 ring-white ${
                      i === activeCity ? 'bg-primary' : 'bg-stone-300'
                    }`}
                  />
                  <h4 className="font-bold text-secondary text-sm mb-1">{city}</h4>
                  <p className="text-xs text-muted mb-2">
                    {i === activeCity ? 'Chic & Structured' : 'Adapted Style'}
                  </p>
                  <div className={`flex -space-x-2 ${i !== activeCity ? 'grayscale' : ''}`}>
                    {[0, 1, 2].map(j => (
                      <div
                        key={j}
                        className="size-8 rounded-full border-2 border-white overflow-hidden bg-sand"
                        style={{
                          backgroundImage: `url(${DEMO_CAPSULE_IMAGES[(i * 3 + j) % DEMO_CAPSULE_IMAGES.length]})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packing Weather */}
          <div className="bg-cream rounded-2xl p-6 shadow-sm border border-[#ebdcd5]">
            <h3 className="font-playfair font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud</span>
              Packing Weather
            </h3>
            <div className="space-y-3">
              {cityNames.map(city => (
                <div key={city} className="flex justify-between items-center text-sm">
                  <span className="text-muted">{city}</span>
                  <span className="font-bold text-secondary">
                    {CITY_WEATHER[city] ?? '14°C - 20°C 🌤️'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Essentials */}
          <div className="bg-cream rounded-2xl p-6 shadow-sm border border-[#ebdcd5]">
            <h3 className="font-playfair font-bold text-secondary mb-4">Missing Essentials?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Leather Ankle Boots', price: '$120', img: DEMO_CAPSULE_IMAGES[3] },
                { name: 'Crossbody Bag', price: '$85', img: DEMO_CAPSULE_IMAGES[4] },
              ].map((item, i) => (
                <a key={i} href="#" className="block group">
                  <div className="aspect-square bg-stone-100 rounded-lg mb-2 overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform"
                      style={{ backgroundImage: `url(${item.img})` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-secondary truncate">{item.name}</p>
                  <p className="text-[10px] text-muted">{item.price}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Share CTA */}
          <button
            onClick={() => onShare(activeImage)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold h-12 rounded-full hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined !text-sm">share</span>
            Share Style Guide
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Annual View ──────────────────────────────────────────────────────────────

function AnnualView({
  trip,
  tripId,
  onShare,
}: {
  trip: Trip
  tripId: string
  onShare: (url?: string | null) => void
}) {
  const [activeCity, setActiveCity] = useState(0)
  const cityNames = trip.cities.map(c => c.name)
  const completedJobs = trip.generation_jobs.filter(j => j.status === 'completed')
  const activeCityJobs = completedJobs.filter(j => j.city === cityNames[activeCity])
  const heroImage = activeCityJobs[0]?.image_url ?? DEMO_OUTFIT_IMAGES[activeCity % DEMO_OUTFIT_IMAGES.length]
  const gridJobs = activeCityJobs.length > 0 ? activeCityJobs : completedJobs.slice(0, 4)
  const userName = trip.user_name ?? 'Traveler'
  const tripsRemaining = trip.trips_remaining ?? 11
  const hasFacePhoto = Boolean(trip.face_url)

  const PAST_TRIPS = [
    { title: 'Milan Fashion Week', year: '2023', desc: 'September • Business Chic', days: 5, outfits: 8, img: DEMO_OUTFIT_IMAGES[0] },
    { title: 'Seoul Exploration', year: '2023', desc: 'July • Urban Streetwear', days: 7, outfits: 12, img: DEMO_OUTFIT_IMAGES[1] },
    { title: 'Tuscany Retreat', year: '2023', desc: 'May • Romantic Light', days: 10, outfits: 15, img: DEMO_OUTFIT_IMAGES[2] },
  ]

  const TRENDING_ITEMS = [
    { name: 'Silk Scarf', img: DEMO_CAPSULE_IMAGES[0] },
    { name: 'Loafers', img: DEMO_CAPSULE_IMAGES[1] },
    { name: 'Structured Tote', img: DEMO_CAPSULE_IMAGES[2] },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="px-6 md:px-10 py-10 md:py-12 border-b border-[#ebdcd5]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-playfair text-5xl md:text-6xl font-medium text-secondary mb-3 leading-tight">
              Welcome Back, {userName}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[#D4AF37] font-medium tracking-wide text-sm uppercase">
                <span className="material-symbols-outlined !text-lg">workspace_premium</span>
                Annual Member
              </div>
              {hasFacePhoto && (
                <div className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined !text-sm">camera_alt</span>
                  Styled with Your Photo
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              {tripsRemaining} Trips Remaining
            </div>
          </div>
        </div>
      </section>

      {/* 12-col grid */}
      <div className="px-6 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left col-span-8 */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Hero Section with Tabs */}
          <section className="bg-sand rounded-2xl overflow-hidden shadow-sm border border-[#ebdcd5]">
            {/* City Tabs */}
            <div className="flex border-b border-[#ebdcd5] bg-cream overflow-x-auto">
              {cityNames.map((city, i) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(i)}
                  className={`px-8 py-4 font-playfair font-bold transition-colors whitespace-nowrap ${
                    i === activeCity
                      ? 'text-secondary border-b-2 border-primary bg-sand'
                      : 'text-muted hover:text-secondary hover:bg-sand/50'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Hero Image */}
            <div className="relative h-80 md:h-[28rem] w-full group">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              {hasFacePhoto && (
                <div className="absolute top-4 left-4 z-20 bg-primary/90 text-white rounded-sm px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
                  Your Style
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
              <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors" title="Regenerate Image">
                  <span className="material-symbols-outlined">autorenew</span>
                </button>
                <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors" title="Change Location">
                  <span className="material-symbols-outlined">edit_location</span>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="bg-[#D4AF37]/90 backdrop-blur-sm text-secondary px-3 py-1 rounded mb-3 inline-block text-xs font-bold uppercase tracking-wider">
                      Current Trip
                    </div>
                    <h2 className="font-playfair text-5xl mb-2">{cityNames[activeCity]}</h2>
                    <p className="text-white/90 text-lg font-light flex items-center gap-2">
                      <span className="material-symbols-outlined !text-lg">calendar_month</span>
                      {trip.month}
                    </p>
                  </div>
                  <button className="bg-white text-secondary hover:bg-primary hover:text-white transition-colors px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
                    <span className="material-symbols-outlined !text-[20px]">refresh</span>
                    Regenerate Itinerary
                  </button>
                </div>
              </div>
            </div>

            {/* Capsule Content */}
            <div className="p-8 bg-sand">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-playfair text-2xl text-secondary">
                  Your {trip.generation_jobs[0]?.mood ?? 'City'} Capsule
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => onShare(heroImage)}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <button className="text-muted hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
              <p className="text-muted mb-8 leading-relaxed max-w-3xl">
                {trip.vibe_description ??
                  `Curated for your ${cityNames[activeCity]} adventure. We prioritized comfort and style, selecting versatile pieces that adapt from day to evening.`}
              </p>

              {/* 2×4 image grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {(gridJobs.length > 0 ? gridJobs : completedJobs).slice(0, 3).map((job, i) => (
                  <div key={job.id} className="group cursor-pointer">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 relative">
                      {hasFacePhoto && (
                        <div className="absolute top-2 left-2 z-10 bg-primary/90 text-white rounded-sm px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                          Your Style
                        </div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={job.image_url ?? DEMO_OUTFIT_IMAGES[i % DEMO_OUTFIT_IMAGES.length]}
                        alt={job.mood}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined !text-sm text-secondary">autorenew</span>
                      </div>
                    </div>
                    <h4 className="font-playfair font-bold text-secondary">Day {i + 1}: {cityNames[activeCity]}</h4>
                    <p className="text-xs text-muted">{job.mood}</p>
                  </div>
                ))}
                {/* See Full Wardrobe slot */}
                <div className="border border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:bg-primary/5 transition-colors cursor-pointer aspect-[3/4]">
                  <span className="material-symbols-outlined text-primary !text-3xl mb-2">checkroom</span>
                  <span className="text-primary font-bold text-sm">See Full Wardrobe</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-[#ebdcd5]">
                <a
                  href={`/checklist/${tripId}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-cream rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-md"
                >
                  <span className="material-symbols-outlined !text-[18px]">visibility</span>
                  View Full Itinerary
                </a>
                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[#ebdcd5] text-secondary rounded-lg text-sm font-bold hover:border-secondary hover:bg-white/50 transition-all">
                  <span className="material-symbols-outlined !text-[18px]">shopping_bag</span>
                  Shop Missing Items
                </button>
              </div>
            </div>
          </section>

          {/* Past Trips */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary !text-2xl">history_edu</span>
                <h3 className="font-playfair text-2xl text-secondary">Past Trips</h3>
              </div>
              <a href="#" className="text-sm font-bold text-primary hover:underline">View All Archive</a>
            </div>
            <div className="overflow-x-auto pb-4 -mx-2 px-2">
              <div className="flex gap-6 min-w-max">
                {PAST_TRIPS.map((pt, i) => (
                  <div key={i} className="w-80 bg-white rounded-xl overflow-hidden border border-[#ebdcd5] hover:shadow-lg transition-shadow group flex flex-col">
                    <div
                      className="h-40 bg-cover bg-center relative"
                      style={{ backgroundImage: `url(${pt.img})` }}
                    >
                      <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/0 transition-colors" />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-playfair text-xl font-bold text-secondary">{pt.title}</h4>
                        <span className="text-xs font-bold text-muted bg-sand px-2 py-1 rounded">{pt.year}</span>
                      </div>
                      <p className="text-muted text-sm mb-4">{pt.desc}</p>
                      <div className="mt-auto pt-4 border-t border-[#ebdcd5] flex justify-between items-center">
                        <span className="text-xs text-muted font-medium">{pt.days} Days • {pt.outfits} Outfits</span>
                        <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors" title="Download PDF">
                          <span className="material-symbols-outlined !text-xl">picture_as_pdf</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right col-span-4 */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Weather Insights */}
          <div className="bg-white rounded-2xl p-6 border border-[#ebdcd5] shadow-sm">
            <h3 className="font-playfair text-xl text-secondary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">partly_cloudy_day</span>
              Weather Insights
            </h3>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-playfair text-4xl text-secondary">18°C</p>
                <p className="text-muted text-sm">{cityNames[activeCity]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-secondary">Partly Cloudy</p>
                <p className="text-xs text-muted">H: 23° L: 14°</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: 'umbrella', label: 'Rain Probability', value: '20%' },
                { icon: 'air', label: 'Wind Speed', value: '12 km/h' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center p-3 bg-sand rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-muted">{row.icon}</span>
                    <span className="text-sm font-medium text-secondary">{row.label}</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Style DNA */}
          <div className="bg-white rounded-2xl p-8 border border-[#ebdcd5] shadow-sm sticky top-24">
            <h3 className="font-playfair text-2xl text-secondary mb-2">Style DNA</h3>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              Analyzing your unique style patterns to refine future recommendations.
            </p>
            {/* Donut Chart */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'conic-gradient(#b8552e 0% 65%, #F5EFE6 65% 85%, #1A1410 85% 100%)' }}
                />
                <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center z-10 shadow-inner">
                  <span className="text-muted text-[10px] uppercase tracking-widest font-bold mb-1">Dominant</span>
                  <span className="text-secondary text-xl font-playfair font-medium text-center leading-none">
                    Minimalist<br />Chic
                  </span>
                </div>
              </div>
            </div>
            {/* Percent Bars */}
            <div className="space-y-6">
              {[
                { label: 'Minimalist Chic', pct: 65, color: 'bg-primary' },
                { label: 'Avant-Garde', pct: 20, color: 'bg-[#E8D5CD]' },
                { label: 'Bohemian Luxe', pct: 15, color: 'bg-secondary' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-secondary font-medium text-sm">{bar.label}</span>
                    <span className="text-primary font-bold text-sm">{bar.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-sand rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Trending for You */}
            <div className="mt-10 pt-8 border-t border-[#ebdcd5]">
              <h4 className="text-secondary text-xs font-bold uppercase tracking-widest mb-4">Trending for You</h4>
              <div className="grid grid-cols-3 gap-3">
                {TRENDING_ITEMS.map(item => (
                  <div key={item.name} className="group cursor-pointer">
                    <div className="bg-sand rounded overflow-hidden aspect-square mb-2 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <span className="block text-center text-[10px] font-bold text-muted group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Gallery (Result) View — plan router ──────────────────────────────────────

function GalleryView({ trip, tripId }: { trip: Trip; tripId: string }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | undefined>()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Show upgrade modal after 2-second delay if an upgrade token is present
  useEffect(() => {
    if (!trip.upgrade_token) return
    const timer = setTimeout(() => setUpgradeOpen(true), 2000)
    return () => clearTimeout(timer)
  }, [trip.upgrade_token])

  function openShare(url?: string | null) {
    setSharePreviewUrl(url ?? undefined)
    setShareOpen(true)
  }

  const cityNames = trip.cities.map(c => c.name)

  return (
    <div>
      {trip.plan === 'annual' ? (
        <AnnualView trip={trip} tripId={tripId} onShare={openShare} />
      ) : trip.plan === 'pro' ? (
        <ProView trip={trip} tripId={tripId} onShare={openShare} />
      ) : (
        <StandardView trip={trip} tripId={tripId} onShare={openShare} />
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={tripId}
        cities={cityNames}
        month={trip.month}
        previewImageUrl={sharePreviewUrl}
      />

      {trip.upgrade_token && (
        <UpgradeModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          tripId={tripId}
          upgradeToken={trip.upgrade_token}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultClient({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!WORKER_URL) {
      // Demo mode — uses reference design data
      setTrip({
        id: tripId,
        status: 'completed',
        plan: 'standard',
        face_url: null,
        vibe_description: 'Paris in October exudes effortless sophistication. Golden leaves line cobblestone streets as locals layer cashmere and structured trench coats against the crisp autumn breeze.',
        user_name: 'Traveler',
        trips_remaining: 11,
        cities: [{ name: 'Paris', days: 4 }, { name: 'Rome', days: 3 }],
        month: 'Autumn',
        generation_jobs: [
          { id: '1', city: 'Paris', mood: 'Louvre Visit', image_url: DEMO_OUTFIT_IMAGES[0], status: 'completed' },
          { id: '2', city: 'Paris', mood: 'Seine Dinner Cruise', image_url: DEMO_OUTFIT_IMAGES[1], status: 'completed' },
          { id: '3', city: 'Rome', mood: 'Le Marais Shopping', image_url: DEMO_OUTFIT_IMAGES[2], status: 'completed' },
        ],
        wardrobe_items: [
          { emoji: '🧥', name: 'Camel Trench', cities: 'Paris · Rome' },
          { emoji: '👗', name: 'Silk Slip Dress', cities: 'Paris Evening' },
          { emoji: '👕', name: 'Cashmere Knit', cities: 'All Days' },
          { emoji: '👟', name: 'Leather Boots', cities: 'Paris · Rome' },
          { emoji: '👕', name: 'White Shirt', cities: 'All Days' },
          { emoji: '👖', name: 'Tailored Trousers', cities: 'Paris · Rome' },
          { emoji: '🧥', name: 'Wool Blazer', cities: 'Evening' },
          { emoji: '👡', name: 'Loafers', cities: 'Day Use' },
          { emoji: '👜', name: 'Crossbody Bag', cities: 'All Days' },
          { emoji: '🧣', name: 'Statement Scarf', cities: 'Accessory' },
        ],
        daily_plan: [
          { day: 1, city: 'Paris', outfit: 'Camel Trench + White Shirt + Tailored Trousers', activities: ['Louvre', 'Champs-Élysées'] },
          { day: 2, city: 'Paris', outfit: 'Silk Slip Dress + Wool Blazer', activities: ['Seine Dinner Cruise'] },
          { day: 3, city: 'Rome', outfit: 'Cashmere Knit + Trousers + Loafers', activities: ['Colosseum', 'Shopping'] },
        ],
        created_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${WORKER_URL}/api/result/${tripId}`)
      // 402 = payment required — redirect to preview/paywall
      if (res.status === 402) { router.push(`/preview/${tripId}`); return }
      if (!res.ok) { setError(true); setLoading(false); return }
      const data: Trip = await res.json()
      // Unpaid trips (pending) and truly failed/expired trips belong on the preview page
      if (data.status === 'pending' || data.status === 'failed') {
        router.push(`/preview/${tripId}`)
        return
      }
      setTrip(data)
      setLoading(false)
      if (data.status === 'processing') {
        pollingRef.current = setTimeout(fetchTrip, 2000)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [tripId, router])

  useEffect(() => {
    fetchTrip()
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current) }
  }, [fetchTrip])

  const isProcessing = trip?.status === 'processing'

  return (
    <>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#ebdcd5] bg-cream/95 backdrop-blur-sm px-6 py-4 md:px-10">
        <div className="flex items-center gap-3 text-secondary">
          <span className="material-symbols-outlined text-primary !text-[28px]">flight_takeoff</span>
          <h2 className="font-sans text-lg font-bold leading-tight tracking-tight">Travel Capsule AI</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            <a href="/" className="text-secondary hover:text-primary transition-colors text-sm font-medium">Home</a>
            <a href="/trip" className="text-secondary hover:text-primary transition-colors text-sm font-medium">New Trip</a>
          </nav>
          {trip && <PlanBadge plan={trip.plan} />}
          <AuthButton />
        </div>
        <button className="md:hidden text-secondary">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-[1440px] mx-auto">
        {loading && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-sand border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted">Preparing your capsule…</p>
            </div>
          </div>
        )}
        {error && <ErrorView tripId={tripId} />}
        {!loading && !error && trip && isProcessing && <ProcessingView trip={trip} />}
        {!loading && !error && trip && !isProcessing && <GalleryView trip={trip} tripId={tripId} />}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#ebdcd5] py-12 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-primary !text-[20px]">flight_takeoff</span>
            <span className="font-sans font-bold">Travel Capsule AI</span>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <a href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a href="/legal/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="mailto:support@travelscapsule.com" className="hover:text-primary transition-colors">Support</a>
          </div>
          <p className="text-xs text-muted">&copy; {new Date().getFullYear()} Travel Capsule AI</p>
        </div>
      </footer>
    </>
  )
}

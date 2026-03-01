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

// ─── Gallery (Result) View ────────────────────────────────────────────────────

function GalleryView({ trip, tripId }: { trip: Trip; tripId: string }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | undefined>()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Show upgrade modal after 2-second delay if an upgrade token is present
  useEffect(() => {
    if (!trip.upgrade_token) return
    const timer = setTimeout(() => setUpgradeOpen(true), 2000)
    return () => clearTimeout(timer)
  }, [trip.upgrade_token])

  const cityNames = trip.cities.map(c => c.name)
  const primaryCity = cityNames[0] ?? 'Your City'

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

  function openShare(url?: string | null) {
    setSharePreviewUrl(url ?? completedJobs[0]?.image_url ?? undefined)
    setShareOpen(true)
  }

  function scrollCarousel(dir: 'prev' | 'next') {
    const el = carouselRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-outfit-card]')
    const w = card ? card.offsetWidth + 24 : 424
    el.scrollBy({ left: dir === 'next' ? w : -w, behavior: 'smooth' })
  }

  return (
    <div>
      {/* ── Hero / Destination Summary ─────────────────────────────────────────── */}
      <section className="px-6 py-12 md:px-10 lg:py-20 flex flex-col md:flex-row justify-between items-start gap-10 border-b border-[#ebdcd5]">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-xs font-bold">
            <span className="material-symbols-outlined !text-sm">location_on</span>
            {cityNames.join(' · ')}
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-medium text-secondary leading-[1.1]">
            Your {primaryCity}<br />
            <span className="italic text-primary">{trip.month}</span> Capsule
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-xl mt-2 leading-relaxed">
            Curated for your {primaryCity} adventure. AI-selected pieces to handle every moment — from morning exploration to evening dining.
          </p>
        </div>

        {/* Weather Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ebdcd5] w-full md:w-auto min-w-[280px] flex-shrink-0">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-secondary uppercase tracking-wide">{trip.month}</p>
              <p className="text-xs text-muted">{primaryCity}</p>
            </div>
            <span className="material-symbols-outlined text-primary !text-4xl">partly_cloudy_day</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-bold text-secondary">18°</span>
            <span className="text-lg text-muted mb-1">Avg</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">High / Low</span>
              <span className="font-medium text-secondary">22° / 14°</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Condition</span>
              <span className="font-medium text-secondary">Partial Sun</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Wind</span>
              <span className="font-medium text-secondary">Breeze</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Style Logic Cards ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-12 bg-white/50">
        <div className="flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted">AI Style Logic</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: 'texture',
              title: 'Fabric Choice',
              desc: 'Breathable, packable fabrics selected for your destination\'s climate and activities.',
            },
            {
              icon: 'palette',
              title: 'Color Palette',
              desc: 'Neutral bases with accent colors for effortless mix-and-match combinations.',
            },
            {
              icon: 'swap_horiz',
              title: 'Versatility',
              desc: 'Every piece transitions from day to night, maximizing outfits with minimal packing.',
            },
          ].map(card => (
            <div
              key={card.icon}
              className="flex gap-4 p-5 rounded-xl bg-cream border border-[#ebdcd5] hover:border-primary/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <div>
                <h4 className="font-playfair text-lg font-medium text-secondary mb-1">{card.title}</h4>
                <p className="text-sm text-muted leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Daily Style Guide ─────────────────────────────────────────────────── */}
      {outfitCards.length > 0 && (
        <section className="px-6 md:px-10 py-16 border-t border-[#ebdcd5]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl text-secondary mb-3">Daily Style Guide</h2>
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

      {/* ── The N-Item Capsule Grid ────────────────────────────────────────────── */}
      {capsuleItems.length > 0 && (
        <section className="px-6 md:px-10 py-16 bg-white">
          <div className="text-center mb-12">
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

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center border-t border-[#ebdcd5]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-playfair text-3xl text-secondary mb-8">Ready to pack this capsule?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={`/checklist/${tripId}`}
              className="bg-primary text-white font-bold h-12 px-8 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-sm">checklist</span>
              View Packing Checklist
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-transparent border border-secondary text-secondary font-bold h-12 px-8 rounded-full hover:bg-secondary hover:text-white transition-colors"
            >
              Regenerate Options
            </button>
          </div>
        </div>
      </section>

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
      const res = await fetch(`${WORKER_URL}/api/trips/${tripId}`)
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
  }, [tripId])

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

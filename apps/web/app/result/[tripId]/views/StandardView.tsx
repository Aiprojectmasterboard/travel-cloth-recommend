'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  buildProfile,
  generateCityOutfits,
  type CityOutfitSet,
} from '@/lib/outfitGenerator'
import {
  ViewProps,
  DEMO_OUTFIT_IMAGES,
  DEMO_CAPSULE_IMAGES,
  DEMO_WARDROBE_ITEMS,
  getCityFlag,
  getMonthName,
} from '../result-types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ACTIVITY_LABELS = ['Arrival', 'Museums', 'Galleries', 'Shopping', 'Dinner', 'Day Trip', 'Depart']
const DAY_STYLE_SUBTEXTS = [
  'Relaxed Transit Chic', 'Cultural Sophistication', 'Artful Eclecticism',
  'Street Luxe', 'Evening Elegance', 'Scenic Exploration', 'Effortless Exit',
]

const ITINERARY_DETAILS = [
  { temp: '16°C', rain: '15%', steps: '8,400', desc: 'Settle in and explore your neighborhood at a relaxed pace. Afternoon coffee and a gentle stroll along the boulevards.' },
  { temp: '14°C', rain: '25%', steps: '12,600', desc: 'Dive into the local art scene. Take your time among the galleries and iconic cultural institutions the city is known for.' },
  { temp: '18°C', rain: '10%', steps: '11,200', desc: 'A crisp clear morning — perfect for the open-air markets and architectural wandering through historic quarters.' },
  { temp: '15°C', rain: '20%', steps: '9,800', desc: 'Browse boutiques and local designers. Pack light layers for when the evening breeze comes in off the water.' },
  { temp: '12°C', rain: '40%', steps: '7,500', desc: 'An evening to slow down. Dress up and enjoy a long dinner at a neighbourhood restaurant with excellent wine.' },
  { temp: '17°C', rain: '5%', steps: '13,000', desc: 'Venture beyond the city center. Rolling landscapes and stone villages — comfortable footwear is non-negotiable.' },
  { temp: '13°C', rain: '30%', steps: '6,200', desc: 'Final morning for any last errands. Travel-ready outfit that transitions smoothly from café to airport.' },
]

// ─── Outfit Accordion Card ──────────────────────────────────────────────────

interface OutfitAccordionCardProps {
  dayNum: number
  activityLabel: string
  styleSubtext: string
  imageUrl: string
  aiConfidence: number
  items: Array<{ name: string; description: string; imageUrl: string; size?: string }>
  note?: string
  isOpen: boolean
  onToggle: () => void
}

function OutfitAccordionCard({
  dayNum,
  activityLabel,
  styleSubtext,
  imageUrl,
  aiConfidence,
  items,
  note,
  isOpen,
  onToggle,
}: OutfitAccordionCardProps) {
  return (
    <div className="bg-white border border-[#ebdacc] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-6 py-5 bg-transparent border-none cursor-pointer text-left gap-4 transition-colors hover:bg-[#FDF8F3]/50"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C4613A]/10 text-[#C4613A] font-bold text-sm flex items-center justify-center font-mono">
            {dayNum}
          </span>
          <div className="min-w-0">
            <p className="font-playfair text-lg text-[#292524] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {activityLabel}
            </p>
            <p className="text-xs text-[#57534e] font-sans">
              {styleSubtext}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] font-mono font-semibold">
            {aiConfidence}% match
          </span>
          <span
            className="material-symbols-outlined text-[#57534e] transition-transform duration-300"
            style={{ fontSize: 24, transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-[#f0e8e0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
            {/* Outfit image */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#f0e8e0]">
              <Image src={imageUrl} alt={activityLabel} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-lg text-white text-[9px] uppercase tracking-[0.1em] font-mono">
                  <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
                  AI Generated
                </span>
              </div>
            </div>

            {/* Outfit breakdown */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#57534e] mb-4 font-sans">
                Outfit Breakdown · Your Sizes
              </p>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
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
                      <span className="text-xs text-[#57534e] font-sans">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
              {note && (
                <p className="mt-5 text-sm text-[#57534e] italic leading-relaxed font-playfair">
                  &ldquo;{note}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AI Generation Profile Sidebar ──────────────────────────────────────────

function AIProfileSidebar({ profile }: {
  profile: { gender: string; height: number; weight: number; aesthetics: string[] } | null
}) {
  const gender = profile?.gender ?? 'Male'
  const height = profile?.height ?? 180
  const weight = profile?.weight ?? 80
  const aesthetics = profile?.aesthetics?.length ? profile.aesthetics : ['Minimalist', 'Streetwear']
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

      {/* Warning pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7ED] border border-[#FDBA74]/30 text-[#9A3412] text-xs font-medium mb-5">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
        Tailored for {gender} · {height}cm · average build
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0">
        {[
          { icon: genderIcon, label: 'Gender', value: gender },
          { icon: '↕', label: 'Height', value: `${height} cm` },
          { icon: '⚖', label: 'Weight', value: `${weight} kg` },
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

      {/* Style Preferences */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#57534e] mb-2 font-mono">
          Style Preferences
        </p>
        <div className="flex flex-wrap gap-2">
          {aesthetics.map((tag) => (
            <span key={tag} className="inline-flex px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-[#57534e] italic leading-relaxed font-playfair">
        Layered sophistication meets urban practicality. Your capsule adapts to your profile with AI-curated precision.
      </p>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function StandardView({ trip, tripId: _tripId, onShare }: ViewProps) {
  const [openCard, setOpenCard] = useState<number>(0)

  const primaryCity = trip.cities[0]?.name ?? 'Your City'
  const totalDays = trip.cities.reduce((sum, c) => sum + c.days, 0)
  const month = getMonthName(trip.month)

  // Build profile from localStorage
  const [cityOutfitSet, setCityOutfitSet] = useState<CityOutfitSet | null>(null)
  const [userProfile, setUserProfile] = useState<{ gender: string; height: number; weight: number; aesthetics: string[] } | null>(null)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) {
        const profile = buildProfile(raw.gender, raw.height, raw.weight, raw.aesthetics ?? [])
        setUserProfile({ gender: raw.gender, height: raw.height, weight: raw.weight, aesthetics: raw.aesthetics ?? [] })
        const monthNum = typeof trip.month === 'string' ? parseInt(trip.month, 10) : Number(trip.month)
        const set = generateCityOutfits(profile, {
          city: primaryCity,
          country: '',
          month: isNaN(monthNum) ? 10 : monthNum,
          days: totalDays,
        }, 4)
        setCityOutfitSet(set)
      }
    } catch {
      // localStorage unavailable or parse error — use defaults
    }
  }, [primaryCity, trip.month, totalDays])

  // Wardrobe items
  const wardrobeItems =
    trip.wardrobe_items && trip.wardrobe_items.length > 0 ? trip.wardrobe_items : DEMO_WARDROBE_ITEMS

  // Outfit images (real job images first, then demo)
  const jobImages = (trip.generation_jobs ?? []).filter((j) => j.image_url).map((j) => j.image_url!)
  const outfitImages = [...jobImages, ...DEMO_OUTFIT_IMAGES, ...DEMO_OUTFIT_IMAGES]

  // Build day plans
  const dayPlans =
    trip.daily_plan && trip.daily_plan.length > 0
      ? trip.daily_plan
      : Array.from({ length: Math.max(totalDays, 4) }, (_, i) => ({
          day: i + 1,
          city: trip.cities[Math.min(Math.floor(i / Math.max(1, Math.ceil(totalDays / trip.cities.length))), trip.cities.length - 1)]?.name ?? primaryCity,
          outfit: 'Curated Outfit',
          activities: [DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length]],
        }))

  const accordionDays = dayPlans.slice(0, 4)
  const aiConfidenceBase = 93

  const genderLabel = useMemo(() => {
    if (!cityOutfitSet) return 'Menswear'
    const g = userProfile?.gender
    return g === 'male' || g === 'Male' ? 'Menswear' : g === 'female' || g === 'Female' ? 'Womenswear' : 'Unisex'
  }, [cityOutfitSet, userProfile])

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 pb-20 font-sans">

      {/* ── Title Area ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h1 className="font-playfair text-[clamp(28px,5vw,44px)] text-[#292524] leading-tight mb-2">
          Your <span className="font-bold">{primaryCity}</span> Capsule
        </h1>
        <p className="text-base text-[#57534e] max-w-xl leading-relaxed mb-4">
          {totalDays} days of curated style for {primaryCity} — weather-adapted, culture-aware, and tailored to your profile.
        </p>

        {/* Badges row: matches Figma exactly */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Generated badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1410]/80 text-white text-[9px] font-bold tracking-[0.12em] uppercase rounded-sm backdrop-blur-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
            AI Generated
          </span>
          {/* Match confidence */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[#C4613A] text-xs font-semibold font-mono">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
            {aiConfidenceBase}% Match
          </span>
          {/* Profile tailored chip */}
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
            Tailored for {userProfile?.gender ?? 'Male'} · {userProfile?.height ?? 180}cm · average build
          </span>
        </div>
      </section>

      {/* ── Main 2-Column Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

        {/* ── Left Column ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-10">

          {/* AI-Curated Outfits Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair text-2xl text-[#292524]">
                AI-Curated Outfits
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#57534e] font-mono">
                {accordionDays.length} Looks · {genderLabel}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {accordionDays.map((dp, i) => {
                const outfit = cityOutfitSet?.outfits[i]
                const offset = i * 3
                const fallbackItems = wardrobeItems.slice(offset, offset + 4).length >= 1
                  ? wardrobeItems.slice(offset, offset + 4)
                  : wardrobeItems.slice(0, 4)
                const items = outfit
                  ? outfit.items.map((it) => ({
                      name: it.name,
                      description: it.category,
                      imageUrl: it.imageUrl,
                      size: it.size,
                    }))
                  : fallbackItems.map((item) => ({
                      name: item.name,
                      description: item.description ?? item.cities,
                      imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
                      size: undefined,
                    }))
                return (
                  <OutfitAccordionCard
                    key={dp.day}
                    dayNum={dp.day}
                    activityLabel={outfit?.label ?? DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length]}
                    styleSubtext={outfit?.styleTag ?? DAY_STYLE_SUBTEXTS[i % DAY_STYLE_SUBTEXTS.length]}
                    imageUrl={outfit?.imageUrl ?? outfitImages[i % outfitImages.length]}
                    aiConfidence={aiConfidenceBase - i * 2}
                    items={items}
                    note={undefined}
                    isOpen={openCard === i}
                    onToggle={() => setOpenCard(openCard === i ? -1 : i)}
                  />
                )
              })}
            </div>
          </section>
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-5 sticky top-24">
          <AIProfileSidebar profile={userProfile} />
        </div>
      </div>
    </div>
  )
}

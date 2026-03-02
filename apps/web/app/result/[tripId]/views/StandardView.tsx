'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  buildProfile,
  generateCityOutfits,
  type CityOutfitSet,
} from '@/lib/outfitGenerator'
import {
  StyleCodeCard,
  MoodCard,
  UpgradeBanner,
  DayPlanStrip,
  ProfileBadge,
  TagChip,
  SizeChip,
  AiGeneratedBadge,
} from '@/components/travel-capsule'
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

const HERO_IMG = 'https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
const MOOD_IMG = 'https://images.unsplash.com/photo-1577058006248-8289d93b53ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

// ─── Outfit Accordion Card ─────────────────────────────────────────────────────

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
    <div style={{
      background: '#fff',
      border: '1px solid #ebdacc',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.04)',
    }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
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
          transition: 'background 0.18s',
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
            {dayNum}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#292524', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activityLabel}
            </p>
            <p style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>
              {styleSubtext}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 9999,
            background: 'rgba(196,97,58,0.08)',
            color: '#C4613A',
            fontSize: 9,
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
          }}>
            {aiConfidence}% match
          </span>
          <span className="material-symbols-outlined" style={{
            fontSize: 24,
            color: '#57534e',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.25s',
          }}>
            expand_more
          </span>
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid #f0e8e0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
            paddingTop: 20,
          }}>
            {/* Outfit image */}
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', background: '#f0e8e0' }}>
              <Image
                src={imageUrl}
                alt={activityLabel}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
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
                  <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
                  AI Generated
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                <TagChip>Day {dayNum}</TagChip>
              </div>
            </div>

            {/* Outfit breakdown */}
            <div>
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#57534e',
                marginBottom: 16,
                fontFamily: 'var(--font-sans, sans-serif)',
              }}>
                Outfit Breakdown · Your Sizes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
                    <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f5efe8' }}>
                      <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#292524', fontWeight: 500, fontFamily: 'var(--font-sans, sans-serif)' }}>
                          {item.name}
                        </span>
                        {item.size && <SizeChip size={item.size} />}
                      </div>
                      <span style={{ fontSize: 12, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {note && (
                <p style={{ marginTop: 20, fontSize: 14, color: '#57534e', fontStyle: 'italic', lineHeight: 1.65, fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;{note}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .outfit-body-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function StandardView({ trip, tripId: _tripId, onShare }: ViewProps) {
  const [openCard, setOpenCard] = useState<number>(0)
  const [selectedDay, setSelectedDay] = useState(0)
  const [showSignup, setShowSignup] = useState(false)

  const primaryCity = trip.cities[0]?.name ?? 'Your City'
  const totalDays = trip.cities.reduce((sum, c) => sum + c.days, 0)
  const month = getMonthName(trip.month)
  const cityFlag = getCityFlag(primaryCity)
  const moodLabel = trip.generation_jobs?.[0]?.mood ?? 'Travel Chic'
  const styleQuote =
    trip.vibe_description ??
    'Carefully curated looks to help you explore your destination with effortless style and comfort.'

  // 5-second signup prompt trigger
  useEffect(() => {
    const timer = setTimeout(() => setShowSignup(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Build profile from localStorage
  const [cityOutfitSet, setCityOutfitSet] = useState<CityOutfitSet | null>(null)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tc_user_profile') ?? 'null')
      if (raw) {
        const profile = buildProfile(raw.gender, raw.height, raw.weight, raw.aesthetics ?? [])
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

  // Packing list derived from outfit set or demo
  const packing = useMemo(() => {
    if (cityOutfitSet) {
      const allItems = cityOutfitSet.outfits.flatMap(o => o.items)
      const seen = new Map<string, { name: string; count: number; imageUrl: string; category: string }>()
      for (const item of allItems) {
        if (seen.has(item.name)) {
          seen.get(item.name)!.count++
        } else {
          seen.set(item.name, { name: item.name, count: 1, imageUrl: item.imageUrl, category: item.category })
        }
      }
      return Array.from(seen.values()).slice(0, 12)
    }
    return []
  }, [cityOutfitSet])

  // Wardrobe items
  const wardrobeItems =
    trip.wardrobe_items && trip.wardrobe_items.length > 0 ? trip.wardrobe_items : DEMO_WARDROBE_ITEMS

  // Capsule grid items (max 10)
  const capsuleItems = wardrobeItems.slice(0, 10).map((item, i) => ({
    name: item.name,
    imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
  }))

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
  const itineraryDay = ITINERARY_DETAILS[selectedDay % ITINERARY_DETAILS.length]!

  // Mood palette
  const palette = ['#D8C4B6', '#2C3333', '#F5EFE6', '#C4613A', '#1A1410']

  // Day plan strip format
  const dayPlanStripItems = Array.from({ length: Math.max(totalDays, 7) }, (_, i) => ({
    day: i + 1,
    label: DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length],
    city: dayPlans[i]?.city ?? primaryCity,
    outfit: dayPlans[i]?.activities?.join(', ') ?? ITINERARY_DETAILS[i % ITINERARY_DETAILS.length].desc,
  }))

  const bodyFitLabel = cityOutfitSet?.outfits[0] ? 'Fitted' : ''
  const aiConfidenceBase = 88

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '32px clamp(16px, 3vw, 40px) 80px', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* ── Signup Prompt ──────────────────────────────────────────────────────── */}
      {showSignup && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100,
          background: '#1A1410',
          color: '#fff',
          borderRadius: 16,
          padding: '20px 24px',
          maxWidth: 320,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <button
            onClick={() => setShowSignup(false)}
            style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}
            aria-label="Close signup prompt"
          >
            ×
          </button>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4613A', marginBottom: 8 }}>
            Save Your Capsule
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
            Create a free account to access your capsule anytime.
          </p>
          <a href="/auth/login" style={{
            display: 'block',
            background: '#C4613A',
            color: '#fff',
            textAlign: 'center',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}>
            Create Account — Free
          </a>
        </div>
      )}

      {/* ── Title Area ─────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#F5EFE6',
            color: '#9c8c7e',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '4px 14px',
            borderRadius: 9999,
            width: 'fit-content',
          }}>
            Standard Plan
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(32px, 5vw, 56px)',
            color: '#292524',
            lineHeight: 1.1,
          }}>
            Your {primaryCity} Capsule
          </h1>
          <p style={{ fontSize: 16, color: '#57534e', maxWidth: 480, lineHeight: 1.65 }}>
            7 days of curated style for {primaryCity} — weather-adapted, culture-aware, and tailored to your profile.
          </p>
          <div>
            <AiGeneratedBadge />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 9999,
              border: 'none',
              background: 'rgba(196,97,58,0.1)',
              color: '#C4613A',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>picture_as_pdf</span>
            Save PDF
          </button>
          <button
            onClick={() => onShare()}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 9999,
              border: '1.5px solid #C4613A',
              background: 'transparent',
              color: '#C4613A',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.18s, color 0.18s',
            }}
            aria-label="Share your capsule"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
            Share
          </button>
        </div>
      </section>

      {/* ── Hero Banner (21:9) ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', aspectRatio: '21/9', borderRadius: 20, overflow: 'hidden', marginBottom: 48 }}>
        <Image
          src={HERO_IMG}
          alt={`${primaryCity} city hero`}
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,20,16,0.8) 0%, rgba(26,20,16,0.2) 50%, transparent 100%)' }} />
        {/* Glass card overlay */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          background: 'rgba(253,248,243,0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontFamily: 'var(--font-mono, monospace)' }}>
              {month} Collection
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#fff', fontStyle: 'italic' }}>
              {primaryCity} — {moodLabel}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Minimalist', 'Walkable', 'Transitional'].map((tag) => (
              <span key={tag} style={{
                padding: '4px 12px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

        {/* ── Left Column ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* 1. AI-Curated Outfits */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#292524' }}>
                AI-Curated Outfits
              </h2>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#57534e',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                {accordionDays.length} Looks
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          {/* 2. Day-by-Day Itinerary */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#292524' }}>
                Your 7-Day Itinerary
              </h2>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#57534e', fontFamily: 'var(--font-mono, monospace)' }}>
                {Math.max(totalDays, 7)} days
              </span>
            </div>
            <DayPlanStrip days={dayPlanStripItems} />
            <div style={{
              marginTop: 16,
              background: '#fff',
              border: '1px solid #E8DDD4',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,.03)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                {[
                  { icon: 'device_thermostat', val: itineraryDay.temp, label: 'Temperature' },
                  { icon: 'rainy', val: itineraryDay.rain, label: 'Rain Chance' },
                  { icon: 'directions_walk', val: itineraryDay.steps, label: 'Est. Steps' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', background: '#FDF8F3', borderRadius: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#C4613A', display: 'block', marginBottom: 4 }}>{s.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#292524', display: 'block', fontFamily: 'var(--font-mono, monospace)' }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9c8c7e' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: '#57534e', lineHeight: 1.7 }}>
                {itineraryDay.desc}
              </p>
            </div>
          </section>

          {/* 3. Packing List (from outfit generator or wardrobe) */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#292524' }}>
                Your Packing List
              </h2>
              <span style={{
                padding: '4px 12px',
                background: 'rgba(196,97,58,0.1)',
                color: '#C4613A',
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-sans, sans-serif)',
              }}>
                {packing.length > 0 ? packing.length : capsuleItems.length} items · Auto-generated
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {(packing.length > 0
                ? packing.map(p => ({ name: p.name, imageUrl: p.imageUrl ?? DEMO_CAPSULE_IMAGES[0], count: p.count, category: p.category }))
                : capsuleItems.map(c => ({ name: c.name, imageUrl: c.imageUrl, count: 0, category: '' }))
              ).map((item) => (
                <div key={item.name} style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #E8DDD4',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#f0e8e0', padding: 8 }}>
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                    {item.count > 1 && (
                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 6px',
                          borderRadius: 9999,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: 9,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                        }}>
                          x{item.count} looks
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#292524', fontFamily: 'var(--font-sans, sans-serif)' }}>
                      {item.name}
                    </p>
                    {item.category && (
                      <p style={{ fontSize: 10, color: '#57534e', textTransform: 'capitalize', fontFamily: 'var(--font-mono, monospace)' }}>
                        {item.category}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Upgrade Banner */}
          <section style={{ borderRadius: 20, overflow: 'hidden' }}>
            <UpgradeBanner onUpgrade={() => onShare()} />
            <div style={{ background: '#C4613A', padding: '0 24px 20px', marginTop: -1 }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-sans, sans-serif)' }}>
                Upgrade to Pro for multi-city itineraries, hero images, and style regeneration.
              </p>
            </div>
          </section>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>

          {/* Profile Badge */}
          <ProfileBadge plan="Standard" />

          {/* Style Code Card */}
          <StyleCodeCard
            city={primaryCity}
            moodName={moodLabel}
            description={styleQuote}
            tags={['Minimalist', 'Walkable', 'Transitional']}
            weather={{ high: '16°C', low: '9°C', rain: '20%' }}
          />

          {/* City Mood Card */}
          <MoodCard
            city={primaryCity}
            flag={cityFlag}
            month={month}
            description={`The city wears a palette of warm stone, amber light, and deep forest greens.`}
            images={[MOOD_IMG, DEMO_CAPSULE_IMAGES[1]]}
            palette={palette}
          />

          {/* Capsule Summary */}
          <div style={{ background: '#fff', border: '1px solid #E8DDD4', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#C4613A' }}>luggage</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9c8c7e' }}>
                Capsule Summary
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { icon: 'checkroom', label: 'Packing Items', value: `${capsuleItems.length} pieces` },
                { icon: 'style', label: 'AI Outfits', value: `${accordionDays.length} looks` },
                { icon: 'calendar_month', label: 'Trip Duration', value: `${totalDays} days` },
                { icon: 'grid_view', label: 'Combinations', value: '28 outfits' },
                { icon: 'eco', label: 'Sustainability', value: '92% reusable' },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EFE8DF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#C4613A' }}>{stat.icon}</span>
                    <span style={{ fontSize: 13, color: '#57534e', fontFamily: 'var(--font-sans, sans-serif)' }}>{stat.label}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#292524', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unlock Pro dashed box */}
          <div style={{
            border: '2px dashed rgba(196,97,58,0.4)',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            background: 'rgba(196,97,58,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#C4613A' }}>lock</span>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#1A1410' }}>Unlock with Pro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', textAlign: 'left', marginBottom: 8 }}>
              {['Multi-city planning', 'Hero editorial images', 'Ultra High-Res exports', 'Style regeneration'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(87,83,78,0.5)' }}>lock</span>
                  <span style={{ fontSize: 13, color: 'rgba(87,83,78,0.7)', fontFamily: 'var(--font-sans, sans-serif)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onShare()}
              style={{
                width: '100%',
                height: 40,
                background: '#C4613A',
                color: '#fff',
                border: 'none',
                borderRadius: 0,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'background 0.18s',
                fontFamily: 'var(--font-sans, sans-serif)',
              }}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .std-main-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .std-packing-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

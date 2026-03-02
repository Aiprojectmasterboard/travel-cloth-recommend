'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ViewProps,
  DEMO_OUTFIT_IMAGES,
  DEMO_CAPSULE_IMAGES,
  DEMO_WARDROBE_ITEMS,
  getCityFlag,
  getMonthName,
} from '../result-types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ACTIVITY_LABELS = ['Arrival', 'Museums', 'Galleries', 'Shopping', 'Dinner', 'Versailles', 'Depart']
const DAY_STYLE_SUBTEXTS = [
  'Relaxed Transit Chic', 'Cultural Sophistication', 'Artful Eclecticism',
  'Street Luxe', 'Evening Elegance', 'Classic French Countryside', 'Effortless Exit',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OutfitAccordionCardProps {
  dayNum: number
  activityLabel: string
  styleSubtext: string
  imageUrl: string
  items: Array<{ name: string; description: string; imageUrl: string }>
  isOpen: boolean
  onToggle: () => void
}

function OutfitAccordionCard({ dayNum, activityLabel, styleSubtext, imageUrl, items, isOpen, onToggle }: OutfitAccordionCardProps) {
  return (
    <div className="std-outfit-card">
      <button
        className="std-outfit-header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="std-outfit-header-left">
          <span className="std-outfit-day-circle">{dayNum}</span>
          <div className="std-outfit-meta">
            <p className="std-outfit-title">{activityLabel}</p>
            <p className="std-outfit-sub">{styleSubtext}</p>
          </div>
        </div>
        <span className={`std-outfit-chevron material-symbols-outlined${isOpen ? ' std-outfit-chevron--open' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="std-outfit-body">
          <div className="std-outfit-body-grid">
            {/* Outfit image */}
            <div className="std-outfit-img-wrap">
              <Image
                src={imageUrl}
                alt={activityLabel}
                fill
                style={{ objectFit: 'cover', borderRadius: 12 }}
                unoptimized
              />
            </div>
            {/* Outfit breakdown */}
            <div className="std-outfit-breakdown">
              <p className="std-outfit-breakdown-label">Outfit Breakdown</p>
              <div className="std-outfit-items">
                {items.map((item) => (
                  <div key={item.name} className="std-outfit-item">
                    <div className="std-outfit-item-img-wrap">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                    <div className="std-outfit-item-info">
                      <p className="std-outfit-item-name">{item.name}</p>
                      <p className="std-outfit-item-desc">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .std-outfit-card {
          background: #fff;
          border: 1px solid #e8ddd5;
          border-radius: 16px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .std-outfit-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .std-outfit-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 20px 24px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 16px;
        }
        .std-outfit-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .std-outfit-day-circle {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #C4613A;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
        }
        .std-outfit-meta {
          min-width: 0;
        }
        .std-outfit-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #1A1410;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .std-outfit-sub {
          font-size: 12px;
          color: #9c8c7e;
          font-weight: 500;
        }
        .std-outfit-chevron {
          flex-shrink: 0;
          color: #9c8c7e;
          font-size: 22px !important;
          transition: transform 0.25s;
        }
        .std-outfit-chevron--open {
          transform: rotate(180deg);
        }
        .std-outfit-body {
          padding: 0 24px 24px;
          border-top: 1px solid #f0e8e0;
        }
        .std-outfit-body-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding-top: 20px;
        }
        @media (max-width: 640px) {
          .std-outfit-body-grid {
            grid-template-columns: 1fr;
          }
        }
        .std-outfit-img-wrap {
          position: relative;
          aspect-ratio: 3/4;
          border-radius: 12px;
          overflow: hidden;
          background: #f0e8e0;
        }
        .std-outfit-breakdown {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .std-outfit-breakdown-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #C4613A;
        }
        .std-outfit-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .std-outfit-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .std-outfit-item-img-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f5efe8;
        }
        .std-outfit-item-info {
          flex: 1;
          min-width: 0;
        }
        .std-outfit-item-name {
          font-size: 13px;
          font-weight: 600;
          color: #1A1410;
          margin-bottom: 2px;
        }
        .std-outfit-item-desc {
          font-size: 11px;
          color: #9c8c7e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function StandardView({ trip, tripId: _tripId, onShare }: ViewProps) {
  const [openCard, setOpenCard] = useState<number>(0)
  const [selectedDay, setSelectedDay] = useState(0)

  const primaryCity = trip.cities[0]?.name ?? 'Your City'
  const totalDays = trip.cities.reduce((sum, c) => sum + c.days, 0)
  const month = getMonthName(trip.month)
  const cityFlag = getCityFlag(primaryCity)

  // Build day plans from API data or generate demo ones
  const dayPlans =
    trip.daily_plan && trip.daily_plan.length > 0
      ? trip.daily_plan
      : Array.from({ length: Math.max(totalDays, 4) }, (_, i) => ({
          day: i + 1,
          city:
            trip.cities[
              Math.min(
                Math.floor(i / Math.max(1, Math.ceil(totalDays / trip.cities.length))),
                trip.cities.length - 1,
              )
            ]?.name ?? primaryCity,
          outfit: 'Curated Outfit',
          activities: [DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length]],
        }))

  // Outfit images (real job images first, then demo)
  const jobImages = (trip.generation_jobs ?? []).filter((j) => j.image_url).map((j) => j.image_url!)
  const outfitImages = [...jobImages, ...DEMO_OUTFIT_IMAGES, ...DEMO_OUTFIT_IMAGES]

  // Wardrobe items
  const wardrobeItems =
    trip.wardrobe_items && trip.wardrobe_items.length > 0 ? trip.wardrobe_items : DEMO_WARDROBE_ITEMS

  // Style quote
  const styleQuote =
    trip.vibe_description ??
    'Perfect for exploring Le Marais or a casual coffee stop. The trench adds sophistication while keeping you prepared for light showers.'

  // Capsule grid items (max 10)
  const capsuleItems = wardrobeItems.slice(0, 10).map((item, i) => ({
    name: item.name,
    imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
  }))

  // Accordion outfit cards (4 days shown)
  const accordionDays = dayPlans.slice(0, 4)

  // Current itinerary day
  const itineraryDay = ITINERARY_DETAILS[selectedDay % ITINERARY_DETAILS.length]!
  const itineraryPlan = dayPlans[selectedDay]

  // Mood palette
  const palette = ['#D8C4B6', '#2C3333', '#F5EFE6', '#C4613A', '#1A1410']

  return (
    <div className="std-root">
      {/* ── Title area ─────────────────────────────────────────────────────── */}
      <section className="std-hero">
        <div className="std-hero-copy">
          <div className="std-plan-badge">Standard</div>
          <h1 className="std-h1">Your {primaryCity} Capsule</h1>
          <p className="std-hero-p">
            {totalDays} days of curated style, crafted around your destination and travel rhythm.
          </p>
        </div>
        <div className="std-hero-actions">
          <button
            onClick={() => onShare()}
            className="std-share-btn"
            aria-label="Share your capsule"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
            Share
          </button>
        </div>
      </section>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="std-main-grid">
        {/* ── Left column (8/12) ────────────────────────────────────────────── */}
        <div className="std-left">

          {/* 1. AI-Curated Outfits — Accordion */}
          <section className="std-section">
            <div className="std-section-header">
              <h2 className="std-section-title">AI-Curated Outfits</h2>
              <span className="std-section-count">{accordionDays.length} looks</span>
            </div>
            <div className="std-accordion-list">
              {accordionDays.map((dp, i) => {
                const offset = i * 3
                const breakdownItems = wardrobeItems.slice(offset, offset + 4).length >= 1
                  ? wardrobeItems.slice(offset, offset + 4)
                  : wardrobeItems.slice(0, 4)
                const items = breakdownItems.map((item) => ({
                  name: item.name,
                  description: item.description ?? item.cities,
                  imageUrl: item.image_url ?? DEMO_CAPSULE_IMAGES[i % DEMO_CAPSULE_IMAGES.length],
                }))
                return (
                  <OutfitAccordionCard
                    key={dp.day}
                    dayNum={dp.day}
                    activityLabel={DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length]}
                    styleSubtext={DAY_STYLE_SUBTEXTS[i % DAY_STYLE_SUBTEXTS.length]}
                    imageUrl={outfitImages[i % outfitImages.length]}
                    items={items}
                    isOpen={openCard === i}
                    onToggle={() => setOpenCard(openCard === i ? -1 : i)}
                  />
                )
              })}
            </div>
          </section>

          {/* 2. Day-by-Day Itinerary */}
          <section className="std-section">
            <div className="std-section-header">
              <h2 className="std-section-title">Day-by-Day Itinerary</h2>
              <span className="std-section-count">{Math.max(totalDays, 7)} days</span>
            </div>

            {/* Horizontal day strip */}
            <div className="std-day-strip">
              {Array.from({ length: Math.max(totalDays, 7) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`std-day-chip${selectedDay === i ? ' std-day-chip--active' : ''}`}
                >
                  <span className="std-day-chip-num">Day {i + 1}</span>
                  <span className="std-day-chip-label">{DAY_ACTIVITY_LABELS[i % DAY_ACTIVITY_LABELS.length]}</span>
                </button>
              ))}
            </div>

            {/* Day detail */}
            <div className="std-day-detail">
              <div className="std-day-detail-stats">
                <div className="std-day-stat">
                  <span className="material-symbols-outlined std-day-stat-icon">device_thermostat</span>
                  <span className="std-day-stat-val">{itineraryDay.temp}</span>
                  <span className="std-day-stat-label">Temperature</span>
                </div>
                <div className="std-day-stat">
                  <span className="material-symbols-outlined std-day-stat-icon">rainy</span>
                  <span className="std-day-stat-val">{itineraryDay.rain}</span>
                  <span className="std-day-stat-label">Rain chance</span>
                </div>
                <div className="std-day-stat">
                  <span className="material-symbols-outlined std-day-stat-icon">directions_walk</span>
                  <span className="std-day-stat-val">{itineraryDay.steps}</span>
                  <span className="std-day-stat-label">Est. steps</span>
                </div>
              </div>
              <p className="std-day-desc">{itineraryPlan?.activities?.join(', ') || itineraryDay.desc}</p>
            </div>
          </section>

          {/* 3. Capsule Grid */}
          <section className="std-section">
            <div className="std-section-header">
              <h2 className="std-section-title">10-Item Capsule</h2>
              <div className="std-capsule-combo-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>style</span>
                28 Outfit Combinations
              </div>
            </div>
            <div className="std-capsule-grid">
              {capsuleItems.map((item) => (
                <div key={item.name} className="std-capsule-item">
                  <div className="std-capsule-img-wrap">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="std-capsule-img"
                    />
                  </div>
                  <p className="std-capsule-name">{item.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Pro upgrade banner */}
          <section className="std-upgrade-banner">
            <div className="std-upgrade-inner">
              <div className="std-upgrade-copy">
                <p className="std-upgrade-eyebrow">Upgrade Available</p>
                <h3 className="std-upgrade-title">Unlock the Full Pro Experience</h3>
                <p className="std-upgrade-desc">
                  Get high-res outfit images for all your cities, 1 free style regeneration, and multi-city coordination.
                </p>
                <button
                  onClick={() => onShare()}
                  className="std-upgrade-cta"
                >
                  Upgrade to Pro — $7 more
                </button>
              </div>
              <div className="std-upgrade-img-wrap">
                <Image
                  src={DEMO_CAPSULE_IMAGES[0]}
                  alt="Pro preview"
                  fill
                  style={{ objectFit: 'cover', filter: 'blur(3px)', transform: 'scale(1.08)' }}
                  unoptimized
                />
                <div className="std-upgrade-img-overlay" />
              </div>
            </div>
          </section>
        </div>

        {/* ── Right column (4/12) ───────────────────────────────────────────── */}
        <div className="std-right">

          {/* Style Code Card */}
          <div className="std-sidebar-card">
            <div className="std-sidebar-card-header">
              <span className="material-symbols-outlined std-sidebar-icon">psychology</span>
              <span className="std-sidebar-card-eyebrow">Style Code</span>
            </div>
            <h3 className="std-sidebar-title">{primaryCity} — Autumn Chic</h3>
            <p className="std-sidebar-body">{styleQuote}</p>
            <div className="std-style-tags">
              {['Minimalist', 'Walkable', 'Transitional'].map((t) => (
                <span key={t} className="std-style-tag">{t}</span>
              ))}
            </div>
            <div className="std-weather-row">
              <div className="std-weather-cell">
                <span className="std-weather-label">High</span>
                <span className="std-weather-val">16°C</span>
              </div>
              <div className="std-weather-cell">
                <span className="std-weather-label">Low</span>
                <span className="std-weather-val">9°C</span>
              </div>
              <div className="std-weather-cell">
                <span className="std-weather-label">Rain</span>
                <span className="std-weather-val">20%</span>
              </div>
            </div>
          </div>

          {/* Mood Card */}
          <div className="std-sidebar-card std-mood-card">
            <div className="std-mood-img-row">
              <div className="std-mood-img-wrap">
                <Image src={DEMO_CAPSULE_IMAGES[0]} alt="mood 1" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
              <div className="std-mood-img-wrap">
                <Image src={DEMO_CAPSULE_IMAGES[1]} alt="mood 2" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            </div>
            <div className="std-sidebar-card-header" style={{ marginTop: 16 }}>
              <span className="material-symbols-outlined std-sidebar-icon">palette</span>
              <span className="std-sidebar-card-eyebrow">City Mood</span>
            </div>
            <h3 className="std-sidebar-title">{cityFlag} {primaryCity}</h3>
            <p className="std-sidebar-body" style={{ fontSize: 13 }}>
              {month} in {primaryCity} — the city wears a palette of warm stone, amber light, and deep forest greens.
            </p>
            <div className="std-color-swatches">
              {palette.map((c) => (
                <div
                  key={c}
                  className="std-color-swatch"
                  title={c}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Capsule Summary */}
          <div className="std-sidebar-card">
            <div className="std-sidebar-card-header">
              <span className="material-symbols-outlined std-sidebar-icon">luggage</span>
              <span className="std-sidebar-card-eyebrow">Capsule Summary</span>
            </div>
            <div className="std-capsule-stats">
              {[
                { label: 'Total Items', val: `${capsuleItems.length}` },
                { label: 'Combinations', val: '28' },
                { label: 'Days Covered', val: `${totalDays}` },
                { label: 'Style Codes', val: '1' },
              ].map(({ label, val }) => (
                <div key={label} className="std-capsule-stat-row">
                  <span className="std-capsule-stat-label">{label}</span>
                  <span className="std-capsule-stat-val">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unlock Pro dashed box */}
          <div className="std-pro-unlock-box">
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#C4613A', marginBottom: 8 }}>lock</span>
            <p className="std-pro-unlock-title">Pro: Full City Galleries</p>
            <p className="std-pro-unlock-sub">
              High-res outfit images for every city on your itinerary, plus 1 free style regeneration.
            </p>
            <button onClick={() => onShare()} className="std-pro-unlock-cta">
              Unlock with Pro
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .std-root {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px clamp(16px, 3vw, 40px) 80px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Hero ── */
        .std-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .std-hero-copy {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .std-plan-badge {
          display: inline-flex;
          align-items: center;
          background: #F5EFE6;
          color: #9c8c7e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 9999px;
          width: fit-content;
        }
        .std-h1 {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: clamp(32px, 5vw, 56px);
          color: #1A1410;
          line-height: 1.1;
        }
        .std-hero-p {
          font-size: 16px;
          color: #9c8c7e;
          max-width: 480px;
          line-height: 1.65;
        }
        .std-hero-actions {
          display: flex;
          gap: 12px;
        }
        .std-share-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9999px;
          border: 1.5px solid #C4613A;
          background: transparent;
          color: #C4613A;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.18s, color 0.18s;
        }
        .std-share-btn:hover {
          background: #C4613A;
          color: #fff;
        }

        /* ── Main grid ── */
        .std-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .std-main-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Left ── */
        .std-left {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ── Sections ── */
        .std-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .std-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .std-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #1A1410;
        }
        .std-section-count {
          font-size: 12px;
          font-weight: 600;
          color: #9c8c7e;
          background: #F5EFE6;
          padding: 4px 12px;
          border-radius: 9999px;
        }

        /* ── Accordion ── */
        .std-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Itinerary ── */
        .std-day-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .std-day-strip::-webkit-scrollbar { display: none; }
        .std-day-chip {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1.5px solid #e8ddd5;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.18s, background 0.18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .std-day-chip--active {
          border-color: #C4613A;
          background: #C4613A;
        }
        .std-day-chip-num {
          font-size: 11px;
          font-weight: 700;
          color: #9c8c7e;
        }
        .std-day-chip--active .std-day-chip-num { color: rgba(255,255,255,0.8); }
        .std-day-chip-label {
          font-size: 12px;
          font-weight: 600;
          color: #1A1410;
          white-space: nowrap;
        }
        .std-day-chip--active .std-day-chip-label { color: #fff; }
        .std-day-detail {
          background: #fff;
          border: 1px solid #e8ddd5;
          border-radius: 16px;
          padding: 24px;
        }
        .std-day-detail-stats {
          display: flex;
          gap: 32px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .std-day-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .std-day-stat-icon {
          font-size: 18px !important;
          color: #C4613A;
        }
        .std-day-stat-val {
          font-size: 20px;
          font-weight: 700;
          color: #1A1410;
        }
        .std-day-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9c8c7e;
        }
        .std-day-desc {
          font-size: 14px;
          color: #57534e;
          line-height: 1.7;
        }

        /* ── Capsule grid ── */
        .std-capsule-combo-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #C4613A;
          background: rgba(196, 97, 58, 0.08);
          padding: 5px 14px;
          border-radius: 9999px;
        }
        .std-capsule-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        @media (max-width: 640px) {
          .std-capsule-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .std-capsule-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .std-capsule-img-wrap {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e8ddd5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        .std-capsule-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          mix-blend-mode: multiply;
        }
        .std-capsule-name {
          font-size: 11px;
          font-weight: 600;
          color: #1A1410;
          text-align: center;
        }

        /* ── Upgrade banner ── */
        .std-upgrade-banner {
          border-radius: 20px;
          overflow: hidden;
        }
        .std-upgrade-inner {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 0;
          background: #1A1410;
          border-radius: 20px;
          overflow: hidden;
          min-height: 200px;
        }
        @media (max-width: 640px) {
          .std-upgrade-inner {
            grid-template-columns: 1fr;
          }
        }
        .std-upgrade-copy {
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 1;
        }
        .std-upgrade-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C4613A;
        }
        .std-upgrade-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #fff;
          line-height: 1.3;
        }
        .std-upgrade-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
        }
        .std-upgrade-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #C4613A;
          color: #fff;
          border: none;
          padding: 11px 22px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          width: fit-content;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.18s;
          margin-top: 4px;
        }
        .std-upgrade-cta:hover { opacity: 0.88; }
        .std-upgrade-img-wrap {
          position: relative;
          overflow: hidden;
        }
        .std-upgrade-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #1A1410 0%, transparent 60%);
        }

        /* ── Right sidebar ── */
        .std-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 80px;
        }
        .std-sidebar-card {
          background: #fff;
          border: 1px solid #e8ddd5;
          border-radius: 16px;
          padding: 24px;
        }
        .std-sidebar-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .std-sidebar-icon {
          font-size: 18px !important;
          color: #C4613A;
        }
        .std-sidebar-card-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #9c8c7e;
        }
        .std-sidebar-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #1A1410;
          margin-bottom: 8px;
        }
        .std-sidebar-body {
          font-size: 13px;
          color: #57534e;
          line-height: 1.7;
          margin-bottom: 14px;
        }
        .std-style-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .std-style-tag {
          font-size: 11px;
          font-weight: 600;
          color: #9c8c7e;
          background: #F5EFE6;
          padding: 3px 10px;
          border-radius: 9999px;
        }
        .std-weather-row {
          display: flex;
          gap: 0;
          border: 1px solid #e8ddd5;
          border-radius: 10px;
          overflow: hidden;
        }
        .std-weather-cell {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 8px;
          border-right: 1px solid #e8ddd5;
        }
        .std-weather-cell:last-child { border-right: none; }
        .std-weather-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9c8c7e;
          margin-bottom: 4px;
        }
        .std-weather-val {
          font-size: 16px;
          font-weight: 700;
          color: #1A1410;
        }

        /* ── Mood card ── */
        .std-mood-card {
          padding-bottom: 20px;
        }
        .std-mood-img-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 0;
        }
        .std-mood-img-wrap {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          background: #f0e8e0;
        }
        .std-color-swatches {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .std-color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.06);
        }

        /* ── Capsule stats ── */
        .std-capsule-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .std-capsule-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0e8e0;
        }
        .std-capsule-stat-row:last-child { border-bottom: none; padding-bottom: 0; }
        .std-capsule-stat-label {
          font-size: 13px;
          color: #57534e;
        }
        .std-capsule-stat-val {
          font-size: 16px;
          font-weight: 700;
          color: #1A1410;
        }

        /* ── Pro unlock box ── */
        .std-pro-unlock-box {
          border: 2px dashed #C4613A;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          background: rgba(196, 97, 58, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .std-pro-unlock-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          color: #1A1410;
        }
        .std-pro-unlock-sub {
          font-size: 12px;
          color: #9c8c7e;
          line-height: 1.6;
          max-width: 260px;
        }
        .std-pro-unlock-cta {
          margin-top: 8px;
          background: #C4613A;
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: opacity 0.18s;
        }
        .std-pro-unlock-cta:hover { opacity: 0.88; }
      `}</style>
    </div>
  )
}

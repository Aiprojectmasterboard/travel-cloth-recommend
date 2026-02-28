'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import AuthButton from '@/components/AuthButton'
import { useTurnstile } from '@/lib/turnstile'
import { apiPost, uploadPhoto } from '@/lib/api'
import type { CityInput, PreviewResponse } from '../../../../packages/types'
import CITY_DB from '../../../../packages/city-vibes-db/cities.json'

const MAX_CITIES = 5

// ─── Locale-independent date selector ─────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const THIS_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2]

function DateSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (iso: string) => void
  disabled?: boolean
}) {
  const [yr, mo, dy] = value ? value.split('-') : ['', '', '']

  function commit(y: string, m: string, d: string) {
    if (y && m && d) {
      const maxDay = new Date(+y, +m, 0).getDate()
      const safe = Math.min(+d, maxDay).toString().padStart(2, '0')
      onChange(`${y}-${m}-${safe}`)
    } else {
      onChange('')
    }
  }

  const daysCount = yr && mo ? new Date(+yr, +mo, 0).getDate() : 31
  const cls = 'px-2 py-2 rounded-lg border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] text-xs focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors disabled:opacity-40'

  return (
    <div className="flex gap-1">
      <select value={mo} disabled={disabled} onChange={(e) => commit(yr, e.target.value, dy)} className={`${cls} flex-1`}>
        <option value="">Month</option>
        {MONTHS_SHORT.map((label, idx) => {
          const v = String(idx + 1).padStart(2, '0')
          return <option key={v} value={v}>{label}</option>
        })}
      </select>
      <select value={dy} disabled={disabled} onChange={(e) => commit(yr, mo, e.target.value)} className={`${cls} w-16`}>
        <option value="">Day</option>
        {Array.from({ length: daysCount }, (_, i) => {
          const d = String(i + 1).padStart(2, '0')
          return <option key={d} value={d}>{i + 1}</option>
        })}
      </select>
      <select value={yr} disabled={disabled} onChange={(e) => commit(e.target.value, mo, dy)} className={`${cls} w-20`}>
        <option value="">Year</option>
        {YEAR_OPTIONS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

// ─── Local extended type (not in types package) ────────────────────────────────

interface CityWithDates extends CityInput {
  start_date: string
  end_date: string
}

// ─── Style options ─────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: 'casual',      label: 'Casual',     icon: '👕' },
  { id: 'minimalist',  label: 'Minimalist',  icon: '⬜' },
  { id: 'streetwear',  label: 'Streetwear',  icon: '🧢' },
  { id: 'classic',     label: 'Classic',     icon: '🎩' },
  { id: 'sporty',      label: 'Sporty',      icon: '🏃' },
  { id: 'bohemian',    label: 'Bohemian',    icon: '🌸' },
  { id: 'business',    label: 'Business',    icon: '👔' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function getNightCount(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function getMonthFromDate(iso: string): number {
  return new Date(iso + 'T00:00:00').getMonth() + 1
}

const TODAY = new Date().toISOString().split('T')[0]

// ─── Component ────────────────────────────────────────────────────────────────

export default function TripPage() {
  const router = useRouter()
  const { token: turnstileToken, containerRef: turnstileRef, reset: resetTurnstile } = useTurnstile()

  // Now 2 steps instead of 3
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 — Cities with per-city dates
  const [cities, setCities] = useState<CityWithDates[]>([])
  const [cityInput, setCityInput] = useState('')
  const [cityError, setCityError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<typeof CITY_DB>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Step 2 — Profile
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weightLb, setWeightLb] = useState('')
  const [stylePrefs, setStylePrefs] = useState<string[]>([])

  // Step 2 — Photo (optional)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ─── City helpers ────────────────────────────────────────────────────────────

  function onCityInputChange(value: string) {
    setCityInput(value)
    setCityError(null)
    if (value.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const q = value.toLowerCase()
    const filtered = CITY_DB.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 6)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  function buildNewCity(name: string, country: string, lat?: number, lon?: number): CityWithDates {
    // Auto-suggest start_date = previous city's end_date
    const prev = cities.length > 0 ? cities[cities.length - 1] : null
    const suggestedStart = prev?.end_date ?? ''
    return { name, country, lat, lon, start_date: suggestedStart, end_date: '' }
  }

  function addCityFromSuggestion(s: (typeof CITY_DB)[0]) {
    if (cities.length >= MAX_CITIES) return
    if (cities.some((c) => c.name.toLowerCase() === s.city.toLowerCase())) return
    setCities((prev) => [...prev, buildNewCity(s.city, s.country, s.lat, s.lon)])
    setCityInput('')
    setCityError(null)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function addCityFreeText() {
    const name = cityInput.trim()
    if (!name || cities.length >= MAX_CITIES) return

    // Validate against city DB — must match a known city
    const match = CITY_DB.find(
      (c) =>
        c.city.toLowerCase() === name.toLowerCase() ||
        c.city.toLowerCase().startsWith(name.toLowerCase())
    )
    if (!match) {
      setCityError(`"${name}" is not a supported city. Please search and select from the list.`)
      return
    }
    if (cities.some((c) => c.name.toLowerCase() === match.city.toLowerCase())) {
      setCityError(`${match.city} is already added.`)
      return
    }
    setCities((prev) => [...prev, buildNewCity(match.city, match.country, match.lat, match.lon)])
    setCityInput('')
    setCityError(null)
    setSuggestions([])
    setShowSuggestions(false)
  }

  function removeCity(name: string) {
    setCities((prev) => prev.filter((c) => c.name !== name))
  }

  function updateCityDate(index: number, field: 'start_date' | 'end_date', value: string) {
    setCities((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      // If start_date changed and end_date is now before start_date, clear end_date
      if (field === 'start_date' && next[index].end_date && value > next[index].end_date) {
        next[index] = { ...next[index], end_date: '' }
      }
      // Auto-suggest next city's start_date when this city's end_date is set
      if (field === 'end_date' && value && index + 1 < next.length) {
        if (!next[index + 1].start_date) {
          next[index + 1] = { ...next[index + 1], start_date: value }
        }
      }
      return next
    })
  }

  // ─── Photo helper ────────────────────────────────────────────────────────────

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function toggleStyle(id: string) {
    setStylePrefs((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  function allCitiesHaveValidDates(): boolean {
    if (cities.length === 0) return false
    for (const city of cities) {
      if (!city.start_date || !city.end_date) return false
      if (city.end_date <= city.start_date) return false
    }
    return true
  }

  function hasNoOverlaps(): boolean {
    for (let i = 1; i < cities.length; i++) {
      // Each city must start on or after the previous city ends
      if (cities[i].start_date < cities[i - 1].end_date) return false
    }
    return true
  }

  const overallStartDate = cities.length > 0 ? cities[0].start_date : ''
  const overallEndDate = cities.length > 0 ? cities[cities.length - 1].end_date : ''
  const totalNights = getNightCount(overallStartDate, overallEndDate)
  const step1Valid = allCitiesHaveValidDates() && hasNoOverlaps()

  // ─── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!step1Valid || !gender) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let face_url: string | undefined
      if (photo) {
        const result = await uploadPhoto(photo)
        face_url = result.face_url
      }

      const resolvedHeightCm = unitSystem === 'metric'
        ? (heightCm ? parseInt(heightCm) : undefined)
        : (heightFt || heightIn
            ? Math.round((parseInt(heightFt || '0') * 12 + parseInt(heightIn || '0')) * 2.54)
            : undefined)
      const resolvedWeightKg = unitSystem === 'metric'
        ? (weightKg ? parseInt(weightKg) : undefined)
        : (weightLb ? Math.round(parseInt(weightLb) * 0.453592) : undefined)

      // Each city's days = nights for that city
      const citiesWithDays: CityInput[] = cities.map((c) => ({
        name: c.name,
        country: c.country,
        lat: c.lat,
        lon: c.lon,
        days: getNightCount(c.start_date, c.end_date),
      }))

      const startDate = overallStartDate
      const endDate = overallEndDate

      const token = turnstileToken ?? 'dev-bypass'
      const preview = await apiPost<PreviewResponse>('/api/preview', {
        cities: citiesWithDays,
        month: getMonthFromDate(startDate),
        start_date: startDate,
        end_date: endDate,
        gender,
        ...(resolvedHeightCm ? { height_cm: resolvedHeightCm } : {}),
        ...(resolvedWeightKg ? { weight_kg: resolvedWeightKg } : {}),
        ...(stylePrefs.length > 0 ? { style_preferences: stylePrefs } : {}),
        cf_turnstile_token: token,
        ...(face_url ? { face_url } : {}),
      })

      router.push(`/preview/${preview.trip_id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      resetTurnstile()
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FDF8F3]/95 backdrop-blur-sm border-b border-[#F5EFE6] px-6 py-4 flex items-center justify-between">
        <a
          href="/"
          className="font-bold text-[#1A1410] text-lg tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Travel <span className="italic text-[#b8552e]">Capsule</span> AI
        </a>

        {/* Right group: step indicator + auth button */}
        <div className="flex items-center gap-3">
          {/* Step indicator — 2 steps */}
          <div className="flex items-center gap-2" aria-label="Form progress">
            {([1, 2] as const).map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  s < step
                    ? 'bg-[#b8552e] text-white'
                    : s === step
                    ? 'bg-[#1A1410] text-white scale-110'
                    : 'bg-[#1A1410]/10 text-[#1A1410]/40'
                }`}
                aria-current={s === step ? 'step' : undefined}
              >
                {s < step ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
            ))}
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">

          {/* ─── Step 1: Where + Per-city dates ───────────────────── */}
          {step === 1 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-[#b8552e]/70 font-medium mb-2">Step 1 of 2</p>
              <h1 className="text-3xl font-bold text-[#1A1410] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Plan your trip
              </h1>
              <p className="text-[#9c8c7e] mb-7">
                Choose your destinations and travel dates.
              </p>

              {/* ── Where ── */}
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9c8c7e] mb-3">
                Where are you going?
                <span className="ml-1.5 font-normal normal-case text-[#9c8c7e]/60">Up to {MAX_CITIES} destinations</span>
              </p>

              <div className="relative mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search city… (e.g. Paris, Tokyo)"
                    value={cityInput}
                    onChange={(e) => onCityInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        suggestions.length > 0 ? addCityFromSuggestion(suggestions[0]) : addCityFreeText()
                      }
                      if (e.key === 'Escape') setShowSuggestions(false)
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    disabled={cities.length >= MAX_CITIES}
                    className="flex-1 px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e] focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-base disabled:opacity-50"
                  />
                  <button
                    onClick={addCityFreeText}
                    disabled={!cityInput.trim() || cities.length >= MAX_CITIES}
                    className="px-4 py-3 rounded-xl bg-[#b8552e] text-white font-semibold disabled:opacity-40 hover:bg-[#a34828] transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>

                {cityError && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {cityError}
                  </div>
                )}

                {showSuggestions && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-xl border border-[#F5EFE6] shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={`${s.city}-${s.country}`}
                        onMouseDown={() => addCityFromSuggestion(s)}
                        className="w-full text-left px-4 py-3 hover:bg-[#FDF8F3] flex items-start gap-3 border-b border-[#F5EFE6] last:border-0 transition-colors"
                      >
                        <div>
                          <span className="font-medium text-[#1A1410] text-sm">{s.city}</span>
                          <span className="text-[#9c8c7e] text-sm ml-1.5">{s.country}</span>
                          <p className="text-xs text-[#b8552e]/70 italic mt-0.5">{s.mood_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City list with per-city date pickers */}
              {cities.length > 0 && (
                <div className="space-y-3 mb-7">
                  {cities.map((city, i) => {
                    const nights = getNightCount(city.start_date, city.end_date)
                    const prevCityEnd = i > 0 ? cities[i - 1].end_date : ''
                    const minStart = i === 0 ? TODAY : (prevCityEnd || TODAY)

                    return (
                      <div key={city.name} className="bg-white rounded-xl border border-[#F5EFE6] px-4 py-3">
                        {/* City name row */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="w-5 h-5 rounded-full bg-[#b8552e]/10 text-[#b8552e] text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1A1410] text-sm truncate">{city.name}</p>
                            {city.country && <p className="text-xs text-[#9c8c7e]">{city.country}</p>}
                          </div>
                          <button
                            onClick={() => removeCity(city.name)}
                            className="w-6 h-6 rounded-full bg-[#1A1410]/6 text-[#9c8c7e] flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
                            aria-label={`Remove ${city.name}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Date selectors — locale-independent Month/Day/Year */}
                        <div className="pl-8 mt-1 space-y-2">
                          <div>
                            <label className="block text-xs text-[#9c8c7e] mb-1">From</label>
                            <DateSelect value={city.start_date} onChange={(v) => updateCityDate(i, 'start_date', v)} />
                          </div>
                          <div>
                            <label className="block text-xs text-[#9c8c7e] mb-1">To</label>
                            <DateSelect value={city.end_date} onChange={(v) => updateCityDate(i, 'end_date', v)} disabled={!city.start_date} />
                          </div>
                          {nights > 0 && (
                            <p className="text-xs text-[#9c8c7e]">{nights} night{nights !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total trip summary */}
              {step1Valid && cities.length > 0 && (
                <div className="mb-8 px-5 py-4 bg-white rounded-xl border border-[#F5EFE6] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1410]">
                      Total: {formatDateDisplay(overallStartDate)} → {formatDateDisplay(overallEndDate)}
                    </p>
                    <p className="text-xs text-[#9c8c7e] mt-0.5">
                      {totalNights} night{totalNights !== 1 ? 's' : ''}
                      {cities.length > 1 && ` · ${cities.length} destinations`}
                    </p>
                  </div>
                  <span className="text-2xl">✈️</span>
                </div>
              )}

              <Button onClick={() => setStep(2)} disabled={!step1Valid} size="xl" className="w-full">
                Continue →
              </Button>
            </div>
          )}

          {/* ─── Step 2: Profile + Style + Photo ─────────────────── */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-[#9c8c7e] mb-6 hover:text-[#1A1410] transition-colors">
                ← Back
              </button>
              <p className="text-xs uppercase tracking-widest text-[#b8552e]/70 font-medium mb-2">Step 2 of 2</p>
              <h1 className="text-3xl font-bold text-[#1A1410] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Personalize your look
              </h1>
              <p className="text-[#9c8c7e] mb-4">
                Help the AI style your perfect capsule wardrobe.
              </p>

              {/* ── Gender ─── */}
              <section className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9c8c7e] mb-3">
                  Gender <span className="text-[#b8552e]">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['male', 'Male', '👨'],
                    ['female', 'Female', '👩'],
                    ['other', 'Non-binary', '🧑'],
                  ] as const).map(([val, label, icon]) => (
                    <button
                      key={val}
                      onClick={() => setGender(val)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        gender === val
                          ? 'bg-[#1A1410] text-white shadow-md scale-105'
                          : 'bg-white border border-[#F5EFE6] text-[#1A1410] hover:border-[#b8552e]/40 hover:bg-[#FDF8F3]'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Body info ─── */}
              <section className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9c8c7e]">Body Info</p>
                    <p className="text-xs text-[#9c8c7e]/70 mt-0.5">Optional — improves fit & layering recommendations</p>
                  </div>
                  {/* Unit toggle */}
                  <div className="flex items-center bg-[#F5EFE6] rounded-full p-0.5 gap-0.5">
                    {(['metric', 'imperial'] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnitSystem(u)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          unitSystem === u
                            ? 'bg-[#1A1410] text-white shadow-sm'
                            : 'text-[#9c8c7e] hover:text-[#1A1410]'
                        }`}
                      >
                        {u === 'metric' ? 'cm / kg' : 'ft / lb'}
                      </button>
                    ))}
                  </div>
                </div>

                {unitSystem === 'metric' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#9c8c7e] mb-1.5">Height (cm)</label>
                      <input
                        type="number"
                        placeholder="e.g. 170"
                        value={heightCm}
                        min={100} max={250}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#9c8c7e] mb-1.5">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 65"
                        value={weightKg}
                        min={30} max={200}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-[#9c8c7e] mb-1.5">Height</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="5"
                            value={heightFt}
                            min={3} max={8}
                            onChange={(e) => setHeightFt(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">ft</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="7"
                            value={heightIn}
                            min={0} max={11}
                            onChange={(e) => setHeightIn(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm pr-7"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">in</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#9c8c7e] mb-1.5">Weight</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="145"
                          value={weightLb}
                          min={66} max={440}
                          onChange={(e) => setWeightLb(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm pr-7"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">lb</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Style preferences ─── */}
              <section className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9c8c7e] mb-0.5">
                  Your Style
                </p>
                <p className="text-xs text-[#9c8c7e]/70 mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map(({ id, label, icon }) => {
                    const selected = stylePrefs.includes(id)
                    return (
                      <button
                        key={id}
                        onClick={() => toggleStyle(id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          selected
                            ? 'bg-[#b8552e] text-white shadow-sm scale-105'
                            : 'bg-white border border-[#F5EFE6] text-[#1A1410] hover:border-[#b8552e]/40 hover:bg-[#FDF8F3]'
                        }`}
                      >
                        <span>{icon}</span>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* ── Photo (optional) ─── */}
              <section className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9c8c7e] mb-0.5">
                  Face Photo
                  <span className="ml-1.5 text-[#9c8c7e]/60 font-normal normal-case tracking-normal text-xs">(optional)</span>
                </p>
                <p className="text-xs text-[#9c8c7e]/70 mb-3">Upload for AI-personalized outfit images with your face</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPhotoChange}
                  className="hidden"
                  aria-label="Upload face photo"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  className="mb-3 rounded-2xl border-2 border-dashed border-[#F5EFE6] bg-white cursor-pointer hover:border-[#b8552e]/40 hover:bg-[#FDF8F3] transition-colors flex flex-col items-center justify-center py-8 gap-3"
                >
                  {photoPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Selected photo preview" className="w-20 h-20 rounded-full object-cover border-4 border-[#b8552e]/20" />
                      <p className="text-sm text-[#9c8c7e]">Tap to change photo</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[#b8552e]/8 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#b8552e]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-[#1A1410] text-sm">Upload face photo</p>
                        <p className="text-xs text-[#9c8c7e] mt-0.5">JPEG, PNG, WebP · Skip to continue without</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F5EFE6] rounded-xl">
                  <svg className="w-4 h-4 text-[#9c8c7e] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-[#9c8c7e] leading-relaxed">
                    Your photo is used only for image generation and deleted immediately after. Never shared or stored long-term.
                  </p>
                </div>
              </section>

              {/* ── Trip summary ─── */}
              <div className="mb-6 px-4 py-4 bg-white rounded-xl border border-[#F5EFE6]">
                <p className="text-xs uppercase tracking-wider text-[#9c8c7e] font-medium mb-2">Trip Summary</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <span key={c.name} className="px-3 py-1 bg-[#b8552e]/8 text-[#b8552e] rounded-full text-xs font-medium">
                      {c.name}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-[#1A1410]/6 text-[#1A1410] rounded-full text-xs font-medium">
                    {formatDateDisplay(overallStartDate)} → {formatDateDisplay(overallEndDate)}
                  </span>
                  <span className="px-3 py-1 bg-[#1A1410]/6 text-[#1A1410] rounded-full text-xs font-medium">
                    {totalNights} night{totalNights !== 1 ? 's' : ''}
                  </span>
                  {gender && (
                    <span className="px-3 py-1 bg-[#1A1410]/6 text-[#1A1410] rounded-full text-xs font-medium capitalize">
                      {gender === 'other' ? 'Non-binary' : gender}
                    </span>
                  )}
                </div>
              </div>

              {/* Turnstile */}
              <div ref={turnstileRef} className="mb-4" />

              {submitError && (
                <p className="text-sm text-red-500 mb-4 text-center" role="alert">{submitError}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!step1Valid || gender === null || submitting}
                loading={submitting}
                size="xl"
                className="w-full"
              >
                Analyze my trip →
              </Button>
              <p className="text-xs text-center text-[#9c8c7e] mt-3">
                Free preview · No payment required yet
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

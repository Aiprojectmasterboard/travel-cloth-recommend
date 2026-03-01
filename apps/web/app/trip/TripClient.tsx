'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useTurnstile } from '@/lib/turnstile'
import { apiPost, uploadPhoto } from '@/lib/api'
import type { CityInput, PreviewResponse } from '../../../../packages/types'
import CITY_DB from '../../../../packages/city-vibes-db/cities.json'

const MAX_CITIES = 5
const MAX_DATE = new Date(new Date().getFullYear() + 2, 11, 31).toISOString().split('T')[0]
const TODAY = new Date().toISOString().split('T')[0]

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

interface CityWithDates extends CityInput {
  start_date: string
  end_date: string
}

// ─── Style options ────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: 'casual',     label: 'Casual',     sub: 'Relaxed & Easy' },
  { id: 'minimalist', label: 'Minimalist', sub: 'Clean Lines' },
  { id: 'streetwear', label: 'Streetwear', sub: 'Urban Edge' },
  { id: 'classic',    label: 'Classic',    sub: 'Timeless Pieces' },
  { id: 'sporty',     label: 'Sporty',     sub: 'Active' },
  { id: 'bohemian',   label: 'Bohemian',   sub: 'Eclectic' },
  { id: 'business',   label: 'Business',   sub: 'Professional' },
]

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_META: Record<Step, { label: string; subtitle: string; pct: number }> = {
  1: { label: 'Step 1 of 4', subtitle: 'Setting the scene',    pct: 25 },
  2: { label: 'Step 2 of 4', subtitle: 'Personalizing your look', pct: 50 },
  3: { label: 'Step 3 of 4', subtitle: 'Defining your look',   pct: 75 },
  4: { label: 'Final Step',  subtitle: 'Ready for Departure',  pct: 100 },
}

// ─── Right-panel quotes per step ──────────────────────────────────────────────

const QUOTES: Record<Step, { text: string; author: string }> = {
  1: { text: '"The world is a book and those who do not travel read only one page."', author: 'St. Augustine' },
  2: { text: '"Style is a way to say who you are without having to speak."', author: 'Rachel Zoe' },
  3: { text: '"The joy of dressing is an art."', author: 'John Galliano' },
  4: { text: '"The journey of a thousand miles begins with a single step."', author: 'Lao Tzu' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatDateShort(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getNightCount(start: string, end: string): number {
  if (!start || !end) return 0
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function getMonthFromDate(iso: string): number {
  return new Date(iso + 'T00:00:00').getMonth() + 1
}

// ─── DateSelect sub-component ─────────────────────────────────────────────────

function DateSelect({
  value, onChange, disabled, min,
}: {
  value: string; onChange: (iso: string) => void; disabled?: boolean; min?: string
}) {
  return (
    <input
      type="date"
      value={value}
      min={min ?? TODAY}
      max={MAX_DATE}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors disabled:opacity-40 cursor-pointer"
    />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { token: turnstileToken, containerRef: turnstileRef, reset: resetTurnstile } = useTurnstile()

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login')
    }
  }, [authLoading, user, router])

  // ── Step state ──
  const [step, setStep] = useState<Step>(1)

  // ── Step 1: Cities ──
  const [cities, setCities] = useState<CityWithDates[]>([])
  const [cityInput, setCityInput] = useState('')
  const [cityError, setCityError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<typeof CITY_DB>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // ── Step 2: Profile ──
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weightLb, setWeightLb] = useState('')

  // ── Step 3: Style + Photo ──
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoPreviewUrlRef = useRef<string | null>(null)

  // ── Submit ──
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Blob URL cleanup ──
  useEffect(() => {
    return () => {
      if (photoPreviewUrlRef.current) URL.revokeObjectURL(photoPreviewUrlRef.current)
    }
  }, [])

  // ─── City helpers ──────────────────────────────────────────────────────────

  function onCityInputChange(value: string) {
    setCityInput(value)
    if (value.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const q = value.toLowerCase()
    const filtered = CITY_DB.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 6)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  function buildNewCity(name: string, country: string, lat?: number, lon?: number): CityWithDates {
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
      if (field === 'start_date' && next[index].end_date && value > next[index].end_date) {
        next[index] = { ...next[index], end_date: '' }
      }
      if (field === 'end_date' && value && index + 1 < next.length) {
        if (!next[index + 1].start_date) {
          next[index + 1] = { ...next[index + 1], start_date: value }
        }
      }
      return next
    })
  }

  // ─── Photo helper ──────────────────────────────────────────────────────────

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Photo must be under 5MB. Please choose a smaller image.')
      return
    }
    if (photoPreviewUrlRef.current) URL.revokeObjectURL(photoPreviewUrlRef.current)
    const url = URL.createObjectURL(file)
    photoPreviewUrlRef.current = url
    setPhoto(file)
    setPhotoPreview(url)
  }

  function toggleStyle(id: string) {
    setStylePrefs((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  // ─── Validation ────────────────────────────────────────────────────────────

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
      if (cities[i].start_date < cities[i - 1].end_date) return false
    }
    return true
  }

  const overallStartDate = cities.length > 0 ? cities[0].start_date : ''
  const overallEndDate = cities.length > 0 ? cities[cities.length - 1].end_date : ''
  const totalNights = getNightCount(overallStartDate, overallEndDate)
  const step1Valid = allCitiesHaveValidDates() && hasNoOverlaps()

  // ─── Navigation ────────────────────────────────────────────────────────────

  function goTo(s: Step) {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!step1Valid || !gender) return
    setSubmitting(true)
    setSubmitError(null)

    if (!turnstileToken) {
      setSubmitError('Security check failed. Please refresh the page and try again.')
      setSubmitting(false)
      return
    }
    const token = turnstileToken

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

      const citiesWithDays: CityInput[] = cities.map((c) => ({
        name: c.name,
        country: c.country,
        lat: c.lat,
        lon: c.lon,
        days: getNightCount(c.start_date, c.end_date),
      }))

      const SESSION_KEY = 'tc_session_id'
      let sessionId = localStorage.getItem(SESSION_KEY)
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem(SESSION_KEY, sessionId)
      }

      const preview = await apiPost<PreviewResponse>('/api/preview', {
        session_id: sessionId,
        cities: citiesWithDays,
        month: getMonthFromDate(overallStartDate),
        start_date: overallStartDate,
        end_date: overallEndDate,
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

  // ─── Loading / auth guard ──────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8552e]/30 border-t-[#b8552e] rounded-full animate-spin" />
      </div>
    )
  }

  const meta = STEP_META[step]
  const quote = QUOTES[step]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* ═══ LEFT PANEL ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 lg:w-3/5 flex flex-col bg-[#FDF8F3] overflow-y-auto">

        {/* Logo row */}
        <header className="flex items-center justify-between px-8 pt-8 pb-4">
          <a href="/" className="flex items-center gap-2" aria-label="Travel Capsule AI home">
            <span
              className="material-symbols-outlined text-3xl text-[#b8552e]"
              aria-hidden="true"
            >
              luggage
            </span>
            <span
              className="text-xl font-extrabold tracking-tight italic text-[#1A1410]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Travel Capsule AI
            </span>
          </a>
        </header>

        {/* Progress bar */}
        <div className="px-8 mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[#b8552e] font-semibold text-sm uppercase tracking-widest">
              {meta.label}
            </span>
            <span className="text-[#9c8c7e] text-xs font-medium uppercase tracking-wider">
              {meta.pct}% Complete
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#b8552e]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#b8552e] rounded-full transition-all duration-700"
              style={{ width: `${meta.pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[#b8552e]/60 text-xs font-medium uppercase italic">
            {meta.subtitle}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 px-8 pb-8">

          {/* ─── STEP 1: Destinations ──────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1
                className="text-5xl md:text-6xl text-[#1A1410] leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Where are you heading?
              </h1>
              <p className="text-[#1A1410]/60 text-lg max-w-xl leading-relaxed mb-10">
                Our AI will analyze the destination's unique vibe and real-time weather to curate your perfect wardrobe.
              </p>

              {/* City search */}
              <div className="relative mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#b8552e]/40 group-focus-within:text-[#b8552e] transition-colors select-none"
                      aria-hidden="true"
                    >
                      location_on
                    </span>
                    <input
                      type="text"
                      placeholder="Search city... (e.g. Paris, Tokyo)"
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
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#b8552e]/10 rounded-xl text-[#1A1410] placeholder:text-[#9c8c7e] focus:outline-none focus:border-[#b8552e] transition-all text-base disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={addCityFreeText}
                    disabled={!cityInput.trim() || cities.length >= MAX_CITIES}
                    className="px-8 py-4 bg-[#b8552e] text-white font-bold rounded-xl shadow-lg shadow-[#b8552e]/20 hover:bg-[#a34828] transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <span>Add Destination</span>
                    <span
                      className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </button>
                </div>

                {cityError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                    {cityError}
                  </p>
                )}

                {showSuggestions && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-xl border border-[#F5EFE6] shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={`${s.city}-${s.country}`}
                        onMouseDown={() => addCityFromSuggestion(s)}
                        className="w-full text-left px-4 py-3 hover:bg-[#FDF8F3] flex items-start gap-3 border-b border-[#F5EFE6] last:border-0 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[#b8552e]/40 text-base mt-0.5" aria-hidden="true">location_on</span>
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

              {/* City list */}
              {cities.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h3 className="text-[#1A1410] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#b8552e] text-lg" aria-hidden="true">list_alt</span>
                    Current Itinerary
                  </h3>
                  {cities.map((city, i) => {
                    const nights = getNightCount(city.start_date, city.end_date)
                    const prevCityEnd = i > 0 ? cities[i - 1].end_date : ''
                    const minStart = i === 0 ? TODAY : (prevCityEnd || TODAY)

                    return (
                      <div
                        key={city.name}
                        className="bg-white p-5 rounded-xl border border-[#b8552e]/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#b8552e]/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[#b8552e] text-lg" aria-hidden="true">location_city</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1410] text-sm">{city.name}, {city.country}</p>
                            {nights > 0 && (
                              <p className="text-[#9c8c7e] text-xs">{nights} night{nights !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-[#9c8c7e] mb-1">From</label>
                            <DateSelect
                              value={city.start_date}
                              onChange={(v) => updateCityDate(i, 'start_date', v)}
                              min={minStart}
                            />
                          </div>
                          <span className="material-symbols-outlined text-[#9c8c7e]/50 mt-4" aria-hidden="true">arrow_right_alt</span>
                          <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-[#9c8c7e] mb-1">To</label>
                            <DateSelect
                              value={city.end_date}
                              onChange={(v) => updateCityDate(i, 'end_date', v)}
                              disabled={!city.start_date}
                              min={city.start_date ? (() => {
                                const d = new Date(city.start_date + 'T00:00:00')
                                d.setDate(d.getDate() + 1)
                                return d.toISOString().split('T')[0]
                              })() : TODAY}
                            />
                          </div>
                          <button
                            onClick={() => removeCity(city.name)}
                            className="mt-4 p-2 text-[#9c8c7e]/50 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${city.name}`}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total summary */}
              {step1Valid && cities.length > 0 && (
                <div className="mb-8 px-5 py-4 bg-white rounded-xl border border-[#b8552e]/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1410]">
                      {formatDateDisplay(overallStartDate)} → {formatDateDisplay(overallEndDate)}
                    </p>
                    <p className="text-xs text-[#9c8c7e] mt-0.5">
                      {totalNights} night{totalNights !== 1 ? 's' : ''}
                      {cities.length > 1 && ` · ${cities.length} destinations`}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[#b8552e] text-2xl" aria-hidden="true">flight</span>
                </div>
              )}

              {/* Nav footer */}
              <div className="mt-12 flex justify-between items-center border-t border-[#b8552e]/10 pt-8">
                <a
                  href="/"
                  className="text-[#9c8c7e] font-bold hover:text-[#b8552e] transition-colors flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">west</span>
                  Back
                </a>
                <button
                  onClick={() => goTo(2)}
                  disabled={!step1Valid}
                  className="bg-[#b8552e] text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-[#b8552e]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Continue to Style Profile
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Personalize ───────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h1
                className="text-5xl md:text-6xl text-[#1A1410] leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Personalize your look
              </h1>
              <p className="text-[#1A1410]/60 text-lg max-w-xl leading-relaxed mb-12">
                Sharing your preferences helps our AI tailor silhouette suggestions and fit recommendations for your unique profile.
              </p>

              {/* Gender selection */}
              <div className="space-y-6 mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1410]/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">person</span>
                  Gender Selection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { val: 'male' as const, label: 'Male', icon: (
                      <svg fill="none" height="40" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="40">
                        <circle cx="10" cy="14" r="5" />
                        <path d="M19 5L13.5 10.5M19 5V9M19 5H15" />
                      </svg>
                    )},
                    { val: 'female' as const, label: 'Female', icon: (
                      <svg fill="none" height="40" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="40">
                        <circle cx="12" cy="9" r="5" />
                        <path d="M12 14V22M9 19H15" />
                      </svg>
                    )},
                    { val: 'other' as const, label: 'Non-binary', icon: (
                      <svg fill="none" height="40" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="40">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 15v5M15 18h-6M12 4v5M9 7h6" />
                      </svg>
                    )},
                  ]).map(({ val, label, icon }) => (
                    <button
                      key={val}
                      onClick={() => setGender(val)}
                      className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl cursor-pointer transition-all ${
                        gender === val
                          ? 'border-[#b8552e] bg-white shadow-lg shadow-[#b8552e]/10'
                          : 'border-[#F5EFE6] hover:border-[#b8552e]/30'
                      }`}
                    >
                      <span className={`mb-4 transition-colors ${gender === val ? 'text-[#b8552e]' : 'text-[#1A1410]/30'}`}>
                        {icon}
                      </span>
                      <span className="font-medium text-[#1A1410]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Body info */}
              <div className="space-y-6 mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1410]/80 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">info</span>
                  Body Info (Optional)
                </h3>

                {/* Unit toggle */}
                <div className="flex items-center gap-3">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#1A1410]/50 uppercase" htmlFor="height-cm">
                        Height (cm)
                      </label>
                      <input
                        id="height-cm"
                        type="number"
                        placeholder="e.g. 175"
                        value={heightCm}
                        min={100} max={250}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-full bg-white border border-[#F5EFE6] rounded-xl p-4 text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#1A1410]/50 uppercase" htmlFor="weight-kg">
                        Weight (kg)
                      </label>
                      <input
                        id="weight-kg"
                        type="number"
                        placeholder="e.g. 65"
                        value={weightKg}
                        min={30} max={200}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full bg-white border border-[#F5EFE6] rounded-xl p-4 text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold text-[#1A1410]/50 uppercase">Height</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type="number" placeholder="5" value={heightFt} min={3} max={8}
                            onChange={(e) => setHeightFt(e.target.value)}
                            className="w-full bg-white border border-[#F5EFE6] rounded-xl p-4 pr-9 text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">ft</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number" placeholder="7" value={heightIn} min={0} max={11}
                            onChange={(e) => setHeightIn(e.target.value)}
                            className="w-full bg-white border border-[#F5EFE6] rounded-xl p-4 pr-8 text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">in</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-[#1A1410]/50 uppercase">Weight</label>
                      <div className="relative">
                        <input
                          type="number" placeholder="145" value={weightLb} min={66} max={440}
                          onChange={(e) => setWeightLb(e.target.value)}
                          className="w-full bg-white border border-[#F5EFE6] rounded-xl p-4 pr-9 text-[#1A1410] placeholder:text-[#9c8c7e]/50 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9c8c7e]">lb</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Nav footer */}
              <div className="pt-8 border-t border-[#F5EFE6] flex flex-col sm:flex-row items-center justify-between gap-6">
                <button
                  onClick={() => goTo(1)}
                  className="flex items-center gap-2 text-[#9c8c7e] hover:text-[#1A1410] font-medium transition-colors"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                  Back
                </button>
                <button
                  onClick={() => goTo(3)}
                  disabled={!gender}
                  className="w-full sm:w-auto px-10 py-4 bg-[#b8552e] hover:bg-[#a34828] text-white rounded-full font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#b8552e]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue to Style Profile
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Style Profile ─────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h1
                className="text-5xl md:text-6xl text-[#1A1410] leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Your Style Profile
              </h1>
              <p className="text-[#1A1410]/60 text-lg max-w-xl leading-relaxed mb-12">
                Select the aesthetics that define your travel vibe and let our AI personalise your recommendations.
              </p>

              {/* Aesthetic grid */}
              <section className="mb-12">
                <div className="mb-6">
                  <h3
                    className="text-2xl text-[#1A1410] mb-1"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Select Your Aesthetic
                  </h3>
                  <p className="text-[#9c8c7e] text-sm">Choose the looks that best represent your travel personality.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {STYLE_OPTIONS.map(({ id, label, sub }) => {
                    const selected = stylePrefs.includes(id)
                    return (
                      <button
                        key={id}
                        onClick={() => toggleStyle(id)}
                        className="group cursor-pointer text-left"
                      >
                        <div className={`relative aspect-[4/5] mb-2 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                          selected
                            ? 'border-[#b8552e] shadow-lg shadow-[#b8552e]/10'
                            : 'border-transparent group-hover:border-[#b8552e]'
                        } bg-gradient-to-br ${STYLE_BG[id]}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl" aria-hidden="true">{STYLE_EMOJI[id]}</span>
                          </div>
                          {selected && (
                            <div className="absolute top-2 right-2 bg-[#b8552e] text-white rounded-full p-1">
                              <span className="material-symbols-outlined text-xs font-bold block" aria-hidden="true">check</span>
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-sm text-center text-[#1A1410]">{label}</p>
                        <p className="text-[10px] text-[#9c8c7e] text-center uppercase tracking-widest">{sub}</p>
                      </button>
                    )
                  })}

                  {/* Custom card */}
                  <div className="group cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[#9c8c7e]/30 rounded-xl hover:border-[#b8552e] transition-colors aspect-[4/5]">
                    <span className="material-symbols-outlined text-3xl text-[#9c8c7e]/50 group-hover:text-[#b8552e] mb-2" aria-hidden="true">add</span>
                    <p className="text-xs font-bold text-[#9c8c7e] group-hover:text-[#b8552e]">Custom</p>
                  </div>
                </div>
              </section>

              {/* AI personalization / photo upload */}
              <section className="mb-12">
                <div className="bg-white p-8 rounded-2xl border border-[#b8552e]/10 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#b8552e]/10 text-[#b8552e] rounded-full">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Personalization</span>
                      </div>
                      <h3
                        className="text-2xl text-[#1A1410]"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        Personalize with AI
                      </h3>
                      <p className="text-[#9c8c7e] text-sm leading-relaxed">
                        Upload a photo of yourself to help our AI recommend pieces that complement your unique features.
                        <span className="ml-1 italic">(optional)</span>
                      </p>
                    </div>

                    <div>
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
                        className="w-full md:w-48 aspect-square relative border-2 border-dashed border-[#9c8c7e]/30 rounded-xl flex flex-col items-center justify-center bg-[#F5EFE6]/30 hover:bg-[#b8552e]/5 hover:border-[#b8552e] transition-all cursor-pointer group"
                      >
                        {photoPreview ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoPreview}
                              alt="Selected photo preview"
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-3xl text-[#9c8c7e]/40 group-hover:text-[#b8552e] transition-colors" aria-hidden="true">add_a_photo</span>
                            <span className="text-[10px] font-bold text-[#9c8c7e]/60 mt-2 uppercase">Upload Photo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Nav footer */}
              <div className="mt-8 flex justify-between items-center border-t border-[#b8552e]/10 pt-8">
                <button
                  onClick={() => goTo(2)}
                  className="text-[#9c8c7e] font-bold hover:text-[#b8552e] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">west</span>
                  Back
                </button>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => goTo(4)}
                    className="text-[#9c8c7e] hover:text-[#9c8c7e]/60 text-sm font-bold transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={() => goTo(4)}
                    className="bg-[#b8552e] text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-[#b8552e]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Continue to Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Final Summary ─────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <span className="inline-block px-3 py-1 bg-[#b8552e]/10 text-[#b8552e] text-[10px] font-bold rounded-full border border-[#b8552e]/20 uppercase tracking-[0.2em] mb-6">
                Final Step
              </span>
              <h1
                className="text-5xl md:text-6xl text-[#1A1410] leading-tight mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Ready for your getaway?
              </h1>
              <p className="text-[#1A1410]/60 text-lg max-w-xl leading-relaxed mb-10">
                Review your trip details before we generate your custom capsule wardrobe.
              </p>

              {/* Trip summary card */}
              <div className="bg-white rounded-2xl border border-[#b8552e]/10 shadow-sm overflow-hidden mb-10">
                <div className="h-40 relative overflow-hidden bg-gradient-to-br from-[#1A1410] to-[#3a2820]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-8">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/20 uppercase tracking-[0.2em] mb-2 inline-block">
                      Trip Summary
                    </span>
                    <h3
                      className="text-white text-3xl font-bold"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {cities.length > 0
                        ? cities.map((c) => c.name).join(' · ')
                        : 'Your Trip'}
                    </h3>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white">
                  <div>
                    <p className="text-[#9c8c7e] text-[10px] font-bold uppercase tracking-widest mb-1">Dates</p>
                    <p className="text-[#1A1410] font-bold text-base">
                      {overallStartDate && overallEndDate
                        ? `${formatDateShort(overallStartDate)} – ${formatDateShort(overallEndDate)}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9c8c7e] text-[10px] font-bold uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-[#1A1410] font-bold text-base">
                      {totalNights > 0 ? `${totalNights} Night${totalNights !== 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9c8c7e] text-[10px] font-bold uppercase tracking-widest mb-1">Style</p>
                    <p className="text-[#1A1410] font-bold text-base capitalize">
                      {stylePrefs.length > 0 ? stylePrefs[0] : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9c8c7e] text-[10px] font-bold uppercase tracking-widest mb-1">Traveler</p>
                    <p className="text-[#1A1410] font-bold text-base capitalize">
                      {gender === 'other' ? 'Non-binary' : (gender ?? '—')}
                    </p>
                  </div>
                </div>

                <div className="px-8 py-4 bg-[#FDF8F3] border-t border-[#b8552e]/10 flex justify-between items-center">
                  <p className="text-sm text-[#9c8c7e] italic">Everything correct?</p>
                  <button
                    onClick={() => goTo(1)}
                    className="text-[#b8552e] text-sm font-bold uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    Edit Details
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {submitError && (
                <p className="text-sm text-red-500 mb-4 text-center" role="alert">{submitError}</p>
              )}

              {/* Turnstile widget */}
              <div className="flex justify-center mb-4">
                <div ref={turnstileRef} className="overflow-hidden rounded-lg" />
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!step1Valid || gender === null || submitting}
                  className="w-full max-w-md bg-[#b8552e] text-white py-5 rounded-2xl font-bold shadow-2xl shadow-[#b8552e]/30 hover:bg-[#a34828] hover:-translate-y-1 transition-all text-xl tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
                      Analyze My Trip
                    </>
                  )}
                </button>
                <p className="text-[#9c8c7e] text-xs italic flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">verified</span>
                  Free preview · Secure processing
                </p>
                <p className="text-[10px] text-[#9c8c7e]/60 uppercase tracking-widest">
                  Your Closet, Curated
                </p>
              </div>

              {/* What happens next */}
              <div className="mt-12 p-6 bg-white rounded-2xl border border-[#b8552e]/10 flex items-start gap-4">
                <span className="material-symbols-outlined text-[#b8552e]" aria-hidden="true">auto_awesome</span>
                <div>
                  <p className="text-[#1A1410] text-xs font-bold uppercase tracking-widest mb-1">What happens next</p>
                  <p className="text-[#9c8c7e] text-xs leading-relaxed">
                    Our AI curates your perfect wardrobe by analyzing the local style scene, weather, and your aesthetic profile. You'll receive a free preview instantly.
                  </p>
                </div>
              </div>

              {/* Nav footer */}
              <div className="mt-8 pt-6 border-t border-[#b8552e]/10 flex justify-between items-center">
                <button
                  onClick={() => goTo(3)}
                  className="text-[#9c8c7e] font-bold hover:text-[#b8552e] transition-colors flex items-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">west</span>
                  Back
                </button>
                <p className="text-[10px] text-[#9c8c7e]/50 uppercase tracking-widest">
                  Protected by Turnstile
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ RIGHT PANEL (hidden on mobile) ══════════════════════════════════ */}
      <aside className="hidden lg:block lg:w-2/5 relative min-h-screen overflow-hidden bg-[#1A1410]">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a2820] via-[#1A1410] to-[#0d0a08]" />
        {/* Decorative texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, #b8552e 0%, transparent 50%), radial-gradient(circle at 70% 80%, #D4AF37 0%, transparent 40%)',
          }}
        />
        {/* Quote overlay */}
        <div className="absolute bottom-16 left-10 right-10 z-20 text-white">
          <div className="p-8 backdrop-blur-md bg-black/30 rounded-2xl border border-white/10 shadow-2xl">
            <p
              className="italic text-2xl mb-6 leading-relaxed text-white"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {quote.text}
            </p>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#b8552e]/60" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/70">
                {quote.author}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Style card visual helpers ────────────────────────────────────────────────

const STYLE_BG: Record<string, string> = {
  casual:     'from-blue-50 to-sky-100',
  minimalist: 'from-gray-50 to-slate-100',
  streetwear: 'from-zinc-800 to-zinc-900',
  classic:    'from-amber-50 to-yellow-100',
  sporty:     'from-green-50 to-emerald-100',
  bohemian:   'from-purple-50 to-fuchsia-100',
  business:   'from-navy-50 to-slate-200',
}

const STYLE_EMOJI: Record<string, string> = {
  casual:     '👕',
  minimalist: '⬜',
  streetwear: '🧢',
  classic:    '🎩',
  sporty:     '🏃',
  bohemian:   '🌸',
  business:   '👔',
}

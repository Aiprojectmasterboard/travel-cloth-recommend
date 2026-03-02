'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/components/LanguageContext'
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

// ─── City image map ────────────────────────────────────────────────────────────

const CITY_IMAGES: Record<string, string> = {
  Paris:     'https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?q=80&w=200',
  Tokyo:     'https://images.unsplash.com/photo-1583915223588-7d88ebf23414?q=80&w=200',
  Barcelona: 'https://images.unsplash.com/photo-1745516314491-55ba68a55008?q=80&w=200',
  Milan:     'https://images.unsplash.com/photo-1599804932675-f458d37ea3fc?q=80&w=200',
  London:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=200',
  'New York':'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=200',
}

// ─── Style options ────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  {
    id: 'casual',
    label: 'Casual',
    sub: 'Relaxed & Easy',
    img: 'https://images.unsplash.com/photo-1661099508870-5f959f1e151a?q=80&w=300',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    sub: 'Clean Lines',
    img: 'https://images.unsplash.com/photo-1615453590051-9cc24146d6ae?q=80&w=300',
  },
  {
    id: 'streetwear',
    label: 'Streetwear',
    sub: 'Urban Edge',
    img: 'https://images.unsplash.com/photo-1766830423628-b4b636d0d907?q=80&w=300',
  },
  {
    id: 'classic',
    label: 'Classic',
    sub: 'Timeless Pieces',
    img: 'https://images.unsplash.com/photo-1560233144-905d47165782?q=80&w=300',
  },
  {
    id: 'sporty',
    label: 'Sporty',
    sub: 'Active',
    img: 'https://images.unsplash.com/photo-1759476532333-b392aec13318?q=80&w=300',
  },
  {
    id: 'bohemian',
    label: 'Bohemian',
    sub: 'Eclectic',
    img: 'https://images.unsplash.com/photo-1650623206556-fc1a59dd6c96?q=80&w=300',
  },
]

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEP_META: Record<Step, { label: string; subtitle: string; pct: number }> = {
  1: { label: 'Step 1 of 4', subtitle: 'Setting the scene',    pct: 25 },
  2: { label: 'Step 2 of 4', subtitle: 'Defining your style',  pct: 50 },
  3: { label: 'Step 3 of 4', subtitle: 'Adding your photo',    pct: 75 },
  4: { label: 'Step 4 of 4', subtitle: 'Final review',         pct: 100 },
}

// ─── Sidebar images per step ──────────────────────────────────────────────────

const SIDEBAR_IMAGES: Record<Step, string> = {
  1: 'https://images.unsplash.com/photo-1762883691346-0bf3da20c4b7?q=80&w=600',
  2: 'https://images.unsplash.com/photo-1753161025583-06f2a298d622?q=80&w=600',
  3: 'https://images.unsplash.com/photo-1769084701646-eb49280dae4e?q=80&w=600',
  4: 'https://images.unsplash.com/photo-1762883691346-0bf3da20c4b7?q=80&w=600',
}

// ─── Quotes per step ──────────────────────────────────────────────────────────

const QUOTES: Record<Step, { text: string; author: string }> = {
  1: { text: 'The world is a book and those who do not travel read only one page.', author: 'St. Augustine' },
  2: { text: 'Style is a way to say who you are without having to speak.', author: 'Rachel Zoe' },
  3: { text: 'The joy of dressing is an art.', author: 'John Galliano' },
  4: { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
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
      className="w-full px-3 py-2 rounded-lg border border-[#E8DDD4] bg-[#FDF8F3] text-[#292524] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4613A]/30 focus:border-[#C4613A] transition-colors disabled:opacity-40 cursor-pointer"
    />
  )
}

// ─── ProgressBar sub-component ────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const meta = STEP_META[step]
  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[#C4613A] font-semibold text-sm uppercase tracking-widest">
          {meta.label}
        </span>
        <span className="text-[#57534e] text-xs font-medium uppercase tracking-wider">
          {meta.pct}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-[#C4613A]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C4613A] rounded-full transition-all duration-700"
          style={{ width: `${meta.pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[#C4613A]/60 text-xs font-medium uppercase italic tracking-wide">
        {meta.subtitle}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, displayFont } = useLanguage()
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

  // ── Step 2: Aesthetics ──
  const [aesthetics, setAesthetics] = useState<string[]>([])

  // ── Step 3: Photo ──
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoPreviewUrlRef = useRef<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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
      setCityError(t.toast.cityRequired)
      return
    }
    if (cities.some((c) => c.name.toLowerCase() === match.city.toLowerCase())) {
      setCityError(t.toast.cityAdded)
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

  // ─── Aesthetic helper ──────────────────────────────────────────────────────

  function toggleAesthetic(id: string) {
    setAesthetics((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  // ─── Photo helpers ─────────────────────────────────────────────────────────

  function applyPhotoFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(t.toast.imageTooLarge)
      return
    }
    if (photoPreviewUrlRef.current) URL.revokeObjectURL(photoPreviewUrlRef.current)
    const url = URL.createObjectURL(file)
    photoPreviewUrlRef.current = url
    setPhoto(file)
    setPhotoPreview(url)
    setSubmitError(null)
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyPhotoFile(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) applyPhotoFile(file)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
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
    if (!step1Valid) return
    setSubmitting(true)
    setSubmitError(null)

    if (!turnstileToken) {
      setSubmitError('Security check not ready. Please wait a moment and try again.')
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
        ...(aesthetics.length > 0 ? { style_preferences: aesthetics } : {}),
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
        <div className="w-8 h-8 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" />
      </div>
    )
  }

  const quote = QUOTES[step]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDF8F3] grid grid-cols-1 lg:grid-cols-[2fr_3fr]">

      {/* ═══ LEFT SIDEBAR (desktop only) ══════════════════════════════════════ */}
      <div className="relative hidden lg:block bg-[#1A1410]">
        <Image
          src={SIDEBAR_IMAGES[step]}
          alt=""
          fill
          className="object-cover opacity-60 transition-opacity duration-700"
          unoptimized
          priority={step === 1}
          aria-hidden="true"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Quote block */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <p
            className="text-white text-xl leading-relaxed mb-3"
            style={{ fontFamily: displayFont, fontStyle: 'italic' }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <span className="text-white/50 text-xs mt-2 block tracking-widest uppercase">
            &mdash; {quote.author}
          </span>
        </div>
      </div>

      {/* ═══ RIGHT FORM PANEL ═════════════════════════════════════════════════ */}
      <div className="px-8 py-12 lg:px-16 overflow-y-auto">

        {/* Logo row */}
        <header className="flex items-center justify-between mb-10">
          <a href="/" className="flex items-center gap-2" aria-label="Travel Capsule AI home">
            <span
              className="material-symbols-outlined text-3xl text-[#C4613A]"
              aria-hidden="true"
            >
              luggage
            </span>
            <span
              className="text-xl font-extrabold tracking-tight text-[#292524]"
              style={{ fontFamily: displayFont, fontStyle: 'italic' }}
            >
              Travel Capsule AI
            </span>
          </a>
        </header>

        {/* Progress bar */}
        <ProgressBar step={step} />

        {/* ─── STEP 1: Destinations ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1
              className="text-4xl md:text-5xl text-[#292524] leading-tight mb-3"
              style={{ fontFamily: displayFont }}
            >
              Where are you heading?
            </h1>
            <p className="text-[#57534e] text-base max-w-xl leading-relaxed mb-8">
              {t.form.sub}
            </p>

            {/* City search */}
            <div className="relative mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#C4613A]/40 group-focus-within:text-[#C4613A] transition-colors select-none"
                    aria-hidden="true"
                  >
                    location_on
                  </span>
                  <input
                    type="text"
                    placeholder={t.form.cityPlaceholder}
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
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#E8DDD4] rounded-xl text-[#292524] placeholder:text-[#57534e]/60 focus:outline-none focus:border-[#C4613A] transition-all text-base disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={addCityFreeText}
                  disabled={!cityInput.trim() || cities.length >= MAX_CITIES}
                  className="px-7 py-4 bg-[#C4613A] text-white font-semibold rounded-xl hover:bg-[#a34828] transition-colors flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                  <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
                </button>
              </div>

              {cityError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                  {cityError}
                </p>
              )}

              {showSuggestions && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-[#E8DDD4] shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={`${s.city}-${s.country}`}
                      onMouseDown={() => addCityFromSuggestion(s)}
                      className="w-full text-left px-4 py-3 hover:bg-[#FDF8F3] flex items-start gap-3 border-b border-[#E8DDD4] last:border-0 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[#C4613A]/40 text-base mt-0.5" aria-hidden="true">location_on</span>
                      <div>
                        <span className="font-medium text-[#292524] text-sm">{s.city}</span>
                        <span className="text-[#57534e] text-sm ml-1.5">{s.country}</span>
                        <p className="text-xs text-[#C4613A]/70 italic mt-0.5">{s.mood_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City list */}
            {cities.length > 0 && (
              <div className="space-y-3 mb-8">
                {cities.map((city, i) => {
                  const nights = getNightCount(city.start_date, city.end_date)
                  const prevCityEnd = i > 0 ? cities[i - 1].end_date : ''
                  const minStart = i === 0 ? TODAY : (prevCityEnd || TODAY)
                  const cityImg = CITY_IMAGES[city.name]

                  return (
                    <div
                      key={city.name}
                      className="bg-white p-4 rounded-xl border border-[#E8DDD4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* City image or fallback */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#E8DDD4] relative">
                          {cityImg ? (
                            <Image
                              src={cityImg}
                              alt={city.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#C4613A] text-lg" aria-hidden="true">location_city</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#292524] text-sm">{city.name}, {city.country}</p>
                          {nights > 0 && (
                            <p className="text-[#57534e] text-xs">{nights} night{nights !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-[#57534e] mb-1">From</label>
                          <DateSelect
                            value={city.start_date}
                            onChange={(v) => updateCityDate(i, 'start_date', v)}
                            min={minStart}
                          />
                        </div>
                        <span className="material-symbols-outlined text-[#57534e]/50 mt-4" aria-hidden="true">arrow_right_alt</span>
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase font-bold text-[#57534e] mb-1">To</label>
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
                          className="mt-4 p-2 text-[#57534e]/40 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${city.name}`}
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total summary */}
            {step1Valid && cities.length > 0 && (
              <div className="mb-8 px-5 py-4 bg-white rounded-xl border border-[#E8DDD4] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#292524]">
                    {formatDateDisplay(overallStartDate)} &rarr; {formatDateDisplay(overallEndDate)}
                  </p>
                  <p className="text-xs text-[#57534e] mt-0.5">
                    {totalNights} night{totalNights !== 1 ? 's' : ''}
                    {cities.length > 1 && ` · ${cities.length} destinations`}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#C4613A] text-2xl" aria-hidden="true">flight</span>
              </div>
            )}

            {/* Nav footer */}
            <div className="mt-10 flex justify-between items-center border-t border-[#E8DDD4] pt-8">
              <a
                href="/"
                className="text-[#57534e] font-medium hover:text-[#C4613A] transition-colors flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">west</span>
                Back
              </a>
              <button
                onClick={() => goTo(2)}
                disabled={!step1Valid}
                className="bg-[#C4613A] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#a34828] transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Style Profile
                <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Aesthetic ────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h1
              className="text-4xl md:text-5xl text-[#292524] leading-tight mb-3"
              style={{ fontFamily: displayFont }}
            >
              What&apos;s your aesthetic?
            </h1>
            <p className="text-[#57534e] text-base max-w-xl leading-relaxed mb-8">
              Select the styles that define your travel vibe. Choose as many as you like.
            </p>

            {/* Style card grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {STYLE_OPTIONS.map(({ id, label, sub, img }) => {
                const selected = aesthetics.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggleAesthetic(id)}
                    className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C4613A]/50 ${
                      selected
                        ? 'border-[#C4613A] shadow-lg shadow-[#C4613A]/10'
                        : 'border-[#E8DDD4] hover:border-[#C4613A]/50'
                    }`}
                    aria-pressed={selected}
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={img}
                        alt={label}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Check badge */}
                      {selected && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-[#C4613A] rounded-full flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-white text-xs font-bold" aria-hidden="true">check</span>
                        </div>
                      )}

                      {/* Label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-semibold text-white text-sm leading-tight">{label}</p>
                        <p className="text-white/70 text-[10px] uppercase tracking-widest">{sub}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Nav footer */}
            <div className="flex justify-between items-center border-t border-[#E8DDD4] pt-8">
              <button
                onClick={() => goTo(1)}
                className="text-[#57534e] font-medium hover:text-[#C4613A] transition-colors flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">west</span>
                Back
              </button>
              <button
                onClick={() => goTo(3)}
                className="bg-[#C4613A] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#a34828] transition-colors flex items-center gap-2"
              >
                Continue to Photo
                <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Photo upload ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h1
              className="text-4xl md:text-5xl text-[#292524] leading-tight mb-3"
              style={{ fontFamily: displayFont }}
            >
              {t.form.photoLabel}
              <span className="block text-2xl md:text-3xl text-[#57534e] font-normal mt-1">({t.form.photoOptional})</span>
            </h1>
            <p className="text-[#57534e] text-base max-w-xl leading-relaxed mb-8">
              {t.form.photoSub}
            </p>

            {/* Drop zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoChange}
              className="hidden"
              aria-label="Upload photo"
            />

            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Click or drag to upload a photo"
              className="relative w-full max-w-sm mx-auto aspect-square border-2 border-dashed border-[#E8DDD4] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-[#FDF8F3] hover:border-[#C4613A]/50 transition-all cursor-pointer group overflow-hidden mb-6"
            >
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Selected photo preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-3xl mb-1" aria-hidden="true">photo_camera</span>
                    <span className="text-white text-sm font-semibold">{t.form.photoChange}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-[#57534e]/30 group-hover:text-[#C4613A] transition-colors mb-3" aria-hidden="true">add_a_photo</span>
                  <p className="text-sm font-semibold text-[#292524]">{t.form.photoDrop}</p>
                  <p className="text-[10px] text-[#57534e]/50 mt-3 uppercase tracking-widest">{t.form.photoFormats}</p>
                </>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-500 mb-4 text-center flex items-center justify-center gap-1.5" role="alert">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                {submitError}
              </p>
            )}

            {/* Nav footer */}
            <div className="flex justify-between items-center border-t border-[#E8DDD4] pt-8">
              <button
                onClick={() => goTo(2)}
                className="text-[#57534e] font-medium hover:text-[#C4613A] transition-colors flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">west</span>
                Back
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => goTo(4)}
                  className="text-[#57534e] hover:text-[#292524] text-sm font-medium transition-colors"
                >
                  Skip this step
                </button>
                <button
                  onClick={() => goTo(4)}
                  className="bg-[#C4613A] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#a34828] transition-colors flex items-center gap-2"
                >
                  Continue to Review
                  <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Final review + submit ────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h1
              className="text-4xl md:text-5xl text-[#292524] leading-tight mb-3"
              style={{ fontFamily: displayFont }}
            >
              Ready to create your capsule?
            </h1>
            <p className="text-[#57534e] text-base max-w-xl leading-relaxed mb-8">
              Review your trip details before we generate your custom capsule wardrobe.
            </p>

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden mb-8">
              {/* Header strip */}
              <div className="h-32 relative overflow-hidden bg-gradient-to-br from-[#1A1410] to-[#3a2820]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-6">
                  <h3
                    className="text-white text-2xl font-bold"
                    style={{ fontFamily: displayFont }}
                  >
                    {cities.length > 0 ? cities.map((c) => c.name).join(' · ') : 'Your Trip'}
                  </h3>
                </div>
              </div>

              {/* Stats grid */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-[#57534e] text-[10px] font-bold uppercase tracking-widest mb-1">{t.form.totalLabel}</p>
                  <p className="text-[#292524] font-semibold text-sm">
                    {overallStartDate && overallEndDate
                      ? `${formatDateShort(overallStartDate)} – ${formatDateShort(overallEndDate)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#57534e] text-[10px] font-bold uppercase tracking-widest mb-1">{t.form.totalDays}</p>
                  <p className="text-[#292524] font-semibold text-sm">
                    {totalNights > 0 ? `${totalNights}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#57534e] text-[10px] font-bold uppercase tracking-widest mb-1">{t.form.totalCities}</p>
                  <p className="text-[#292524] font-semibold text-sm capitalize">
                    {aesthetics.length > 0 ? aesthetics.slice(0, 2).join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#57534e] text-[10px] font-bold uppercase tracking-widest mb-1">{t.form.photoLabel}</p>
                  <p className="text-[#292524] font-semibold text-sm">
                    {photo ? t.form.photoUploaded : t.form.photoOptional}
                  </p>
                </div>
                <div>
                  <p className="text-[#57534e] text-[10px] font-bold uppercase tracking-widest mb-1">{t.form.cityLabel}</p>
                  <p className="text-[#292524] font-semibold text-sm">
                    {cities.length} {t.form.totalCities}
                  </p>
                </div>
              </div>

              <div className="px-6 py-3 bg-[#FDF8F3] border-t border-[#E8DDD4] flex justify-end">
                <button
                  onClick={() => goTo(1)}
                  className="text-[#C4613A] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5"
                >
                  Edit details
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                </button>
              </div>
            </div>

            {/* Error message */}
            {submitError && (
              <p className="text-sm text-red-500 mb-4 text-center" role="alert">{submitError}</p>
            )}

            {/* Turnstile widget */}
            <div className="flex justify-center mb-6">
              <div ref={turnstileRef} className="overflow-hidden rounded-lg" />
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <button
                onClick={handleSubmit}
                disabled={!step1Valid || submitting}
                className="w-full max-w-md bg-[#C4613A] text-white py-4 rounded-2xl font-bold hover:bg-[#a34828] hover:-translate-y-0.5 transition-all text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-lg shadow-[#C4613A]/20"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t.form.processing}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
                    {t.form.checkoutBtn}
                  </>
                )}
              </button>
              <p className="text-[#57534e] text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">verified</span>
                {t.form.priceNote}
              </p>
            </div>

            {/* What happens next */}
            <div className="p-5 bg-white rounded-xl border border-[#E8DDD4] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#C4613A] text-xl mt-0.5" aria-hidden="true">auto_awesome</span>
              <div>
                <p className="text-[#292524] text-xs font-bold uppercase tracking-widest mb-1">What happens next</p>
                <p className="text-[#57534e] text-xs leading-relaxed">
                  Our AI curates your perfect wardrobe by analyzing the local style scene, weather, and your aesthetic profile. You&apos;ll receive a free preview instantly.
                </p>
              </div>
            </div>

            {/* Nav footer */}
            <div className="mt-8 pt-6 border-t border-[#E8DDD4] flex justify-between items-center">
              <button
                onClick={() => goTo(3)}
                className="text-[#57534e] font-medium hover:text-[#C4613A] transition-colors flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">west</span>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

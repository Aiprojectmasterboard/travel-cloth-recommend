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
import { OnboardingLayout } from '@/components/travel-capsule/OnboardingLayout'
import { ProgressBar } from '@/components/travel-capsule/ProgressBar'
import { BtnPrimary, BtnSecondary } from '@/components/travel-capsule/Buttons'
import { Icon } from '@/components/travel-capsule/Icon'
import { TCInput } from '@/components/travel-capsule/TCInput'
import { AestheticCard } from '@/components/travel-capsule/AestheticCard'

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
  Paris:      'https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?q=80&w=200',
  Tokyo:      'https://images.unsplash.com/photo-1583915223588-7d88ebf23414?q=80&w=200',
  Barcelona:  'https://images.unsplash.com/photo-1745516314491-55ba68a55008?q=80&w=200',
  Milan:      'https://images.unsplash.com/photo-1599804932675-f458d37ea3fc?q=80&w=200',
  London:     'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=200',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=200',
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
  1: { text: 'The world is a book, and those who do not travel read only one page.', author: 'St. Augustine' },
  2: { text: 'Style is a way to say who you are without having to speak.', author: 'Rachel Zoe' },
  3: { text: 'The joy of dressing is an art.', author: 'John Galliano' },
  4: { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
}

// ─── Step sublabels ───────────────────────────────────────────────────────────

const STEP_SUBLABELS: Record<Step, string> = {
  1: 'Setting the scene',
  2: 'Personalize your look',
  3: 'Curating your vibe',
  4: 'About your destination',
}

// ─── Style options ────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: 'casual',     label: 'Casual',     sub: 'Relaxed & Easy',   img: 'https://images.unsplash.com/photo-1661099508870-5f959f1e151a?q=80&w=300' },
  { id: 'minimalist', label: 'Minimalist', sub: 'Clean Lines',       img: 'https://images.unsplash.com/photo-1615453590051-9cc24146d6ae?q=80&w=300' },
  { id: 'streetwear', label: 'Streetwear', sub: 'Urban Edge',        img: 'https://images.unsplash.com/photo-1766830423628-b4b636d0d907?q=80&w=300' },
  { id: 'classic',    label: 'Classic',    sub: 'Timeless Pieces',   img: 'https://images.unsplash.com/photo-1560233144-905d47165782?q=80&w=300' },
  { id: 'sporty',     label: 'Sporty',     sub: 'Active',            img: 'https://images.unsplash.com/photo-1759476532333-b392aec13318?q=80&w=300' },
  { id: 'bohemian',   label: 'Bohemian',   sub: 'Eclectic',          img: 'https://images.unsplash.com/photo-1650623206556-fc1a59dd6c96?q=80&w=300' },
]

// ─── Gender options ───────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { id: 'female',     label: 'Female',     icon: 'woman' },
  { id: 'male',       label: 'Male',       icon: 'man' },
  { id: 'non-binary', label: 'Non-binary', icon: 'person' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

function DateSelect({ value, onChange, disabled, min }: {
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { displayFont, bodyFont } = useLanguage()
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

  // ── Step 2: Gender + body ──
  const [gender, setGender] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')

  // ── Step 3: Aesthetics + photo ──
  const [aesthetics, setAesthetics] = useState<string[]>([])
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
      setCityError('Please select a city from the suggestions.')
      return
    }
    if (cities.some((c) => c.name.toLowerCase() === match.city.toLowerCase())) {
      setCityError('This city has already been added.')
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
      setSubmitError('Image must be smaller than 5 MB.')
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

      // Save user profile for result page personalization
      localStorage.setItem('tc_user_profile', JSON.stringify({
        gender: gender || 'female',
        height: parseFloat(height) || 165,
        weight: parseFloat(weight) || 60,
        aesthetics,
      }))

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
    <OnboardingLayout
      imageUrl={SIDEBAR_IMAGES[step]}
      quote={quote.text}
      quoteAuthor={quote.author}
    >
      {/* Logo row */}
      <header className="flex items-center justify-between mb-10">
        <a href="/" className="flex items-center gap-2" aria-label="Travel Capsule AI home">
          <Icon name="luggage" className="text-3xl text-[#C4613A]" />
          <span
            className="text-xl font-extrabold tracking-tight text-[#292524]"
            style={{ fontFamily: displayFont, fontStyle: 'italic' }}
          >
            Travel Capsule AI
          </span>
        </a>
      </header>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[#C4613A] font-semibold text-sm uppercase tracking-widest">
            Step {step} of 4
          </span>
          <span className="text-[#57534e] text-xs font-medium uppercase tracking-wider">
            {step * 25}%
          </span>
        </div>
        <ProgressBar current={step} total={4} />
        <p className="mt-1.5 text-[#C4613A]/60 text-xs font-medium uppercase italic tracking-wide">
          {STEP_SUBLABELS[step]}
        </p>
      </div>

      {/* ─── STEP 1: Destinations ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h1
            className="text-[#292524] leading-tight mb-4"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Where are you <em>heading?</em>
          </h1>
          <p className="mt-4 text-[16px] text-[#57534e] mb-8" style={{ fontFamily: bodyFont }}>
            Tell us your destinations so we can tailor your capsule wardrobe to each city&apos;s climate and culture.
          </p>

          {/* City search */}
          <div className="relative mb-6">
            <div className="relative">
              <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#57534e]/50" />
              <input
                type="text"
                placeholder="Search cities..."
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
                className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#E8DDD4] rounded-[12px] text-[16px] text-[#292524] placeholder:text-[#57534e]/50 focus:border-[#C4613A] focus:outline-none focus:ring-1 focus:ring-[#C4613A]/20 transition-colors disabled:opacity-50"
                style={{ fontFamily: bodyFont }}
                aria-label="Search cities"
              />
            </div>

            {cityError && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                <Icon name="error" size={14} />
                {cityError}
              </p>
            )}

            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-[#E8DDD4] shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={`${s.city}-${s.country}`}
                    onMouseDown={() => addCityFromSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-[#FDF8F3] flex items-start gap-3 border-b border-[#E8DDD4] last:border-0 transition-colors"
                  >
                    <Icon name="location_on" size={16} className="text-[#C4613A]/40 mt-0.5 shrink-0" />
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
                            <Icon name="location_city" size={18} className="text-[#C4613A]" />
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
                      <Icon name="arrow_right_alt" className="text-[#57534e]/50 mt-4" />
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
                        <Icon name="delete" size={18} />
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
              <Icon name="flight" size={24} className="text-[#C4613A]" />
            </div>
          )}

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between border-t border-[#E8DDD4] pt-8">
            <BtnSecondary size="sm" onClick={() => router.push('/')}>
              Back
            </BtnSecondary>
            <BtnPrimary size="sm" onClick={() => goTo(2)} disabled={!step1Valid}>
              <span className="flex items-center gap-2">
                Continue to Style Profile
                <Icon name="arrow_forward" size={16} className="text-white" />
              </span>
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Gender + Body Info ───────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h1
            className="text-[#292524] leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Personalize <em>your look</em>
          </h1>
          <p className="text-[16px] text-[#57534e] mb-8" style={{ fontFamily: bodyFont }}>
            Help us tailor your capsule wardrobe with a few details about your style.
          </p>

          {/* Gender selection */}
          <div className="mt-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#57534e] mb-3">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {GENDER_OPTIONS.map((g) => {
                const selected = gender === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-2 py-5 px-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#C4613A]/30 ${
                      selected
                        ? 'border-[#C4613A] bg-[#C4613A]/5'
                        : 'border-[#E8DDD4] bg-white hover:border-[#C4613A]/40'
                    }`}
                    style={{ fontFamily: bodyFont }}
                  >
                    <Icon name={g.icon} size={28} className={selected ? 'text-[#C4613A]' : 'text-[#57534e]'} />
                    <span className={`text-sm font-semibold ${selected ? 'text-[#C4613A]' : 'text-[#292524]'}`}>
                      {g.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body info */}
          <div className="mt-10">
            <div className="flex items-baseline gap-3 mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#57534e]">
                Body Info
              </label>
              <span className="text-[12px] text-[#57534e]/60">
                Optional — helps with more accurate sizing recommendations
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TCInput
                label="Height (cm)"
                placeholder="175"
                type="number"
                value={height}
                onChange={setHeight}
              />
              <TCInput
                label="Weight (kg)"
                placeholder="70"
                type="number"
                value={weight}
                onChange={setWeight}
              />
            </div>
          </div>

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between border-t border-[#E8DDD4] pt-8">
            <BtnSecondary size="sm" onClick={() => goTo(1)}>
              Back
            </BtnSecondary>
            <BtnPrimary size="sm" onClick={() => goTo(3)}>
              <span className="flex items-center gap-2">
                Continue to Style Profile
                <Icon name="arrow_forward" size={16} className="text-white" />
              </span>
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Aesthetic + Photo ────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <h1
            className="text-[#292524] leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Your Style <em>Profile</em>
          </h1>
          <p className="text-[16px] text-[#57534e] mb-8" style={{ fontFamily: bodyFont }}>
            Select the aesthetics that define your travel vibe. Choose as many as you like.
          </p>

          {/* Aesthetic grid */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {STYLE_OPTIONS.map(({ id, label, img }) => (
              <AestheticCard
                key={id}
                label={label}
                imageUrl={img}
                selected={aesthetics.includes(id)}
                onClick={() => toggleAesthetic(id)}
              />
            ))}
          </div>

          {/* Photo upload section */}
          <div className="mt-6 p-6 bg-[#C4613A]/5 rounded-xl border border-[#C4613A]/10">
            <div className="flex items-start gap-3">
              <Icon name="auto_awesome" size={24} className="text-[#C4613A] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-[#292524] text-sm mb-1" style={{ fontFamily: displayFont }}>
                  Personalize with AI
                </h4>
                <p className="text-[13px] text-[#57534e] mb-4" style={{ fontFamily: bodyFont }}>
                  Upload a full-body photo so our AI can generate outfits tailored to your proportions.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPhotoChange}
                  className="hidden"
                  aria-label="Upload photo"
                />

                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Selected photo preview"
                      className="w-16 h-16 rounded-lg object-cover border border-[#E8DDD4]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#292524]">Photo uploaded</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-[#C4613A] hover:underline mt-0.5"
                      >
                        Change photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={dropZoneRef}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Click or drag to upload a photo"
                    className="border-2 border-dashed border-[#C4613A]/30 rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer hover:border-[#C4613A]/60 hover:bg-[#C4613A]/5 transition-all"
                  >
                    <Icon name="add_a_photo" size={28} className="text-[#C4613A]/50 mb-2" />
                    <p className="text-sm font-semibold text-[#292524]">Click or drag to upload</p>
                    <p className="text-[11px] text-[#57534e]/50 mt-1 uppercase tracking-widest">JPG · PNG · WEBP · Max 5 MB</p>
                  </div>
                )}

                {submitError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5" role="alert">
                    <Icon name="error" size={14} />
                    {submitError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between border-t border-[#E8DDD4] pt-8">
            <BtnSecondary size="sm" onClick={() => goTo(2)}>
              Back
            </BtnSecondary>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goTo(4)}
                className="text-[14px] text-[#57534e] hover:text-[#C4613A] underline transition-colors"
                style={{ fontFamily: bodyFont }}
              >
                Skip for now
              </button>
              <BtnPrimary size="sm" onClick={() => goTo(4)}>
                <span className="flex items-center gap-2">
                  Continue to Itinerary
                  <Icon name="arrow_forward" size={16} className="text-white" />
                </span>
              </BtnPrimary>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Review + submit ──────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h1
            className="text-[#292524] leading-tight mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Ready for your <em>getaway?</em>
          </h1>
          <p className="text-[16px] text-[#57534e] mb-8" style={{ fontFamily: bodyFont }}>
            Review your trip details before we generate your custom capsule wardrobe.
          </p>

          {/* Summary card */}
          <div className="mt-6 bg-white rounded-2xl overflow-hidden border border-[#E8DDD4]">
            {/* City hero strip */}
            <div className="relative h-32 bg-gradient-to-br from-[#1A1410] to-[#3a2820] overflow-hidden">
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

            {/* Info rows */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#57534e]">
                  <Icon name="calendar_today" size={16} className="text-[#C4613A]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Dates</span>
                </div>
                <span className="text-sm font-semibold text-[#292524]">
                  {overallStartDate && overallEndDate
                    ? `${formatDateShort(overallStartDate)} – ${formatDateShort(overallEndDate)}`
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#57534e]">
                  <Icon name="nights_stay" size={16} className="text-[#C4613A]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Duration</span>
                </div>
                <span className="text-sm font-semibold text-[#292524]">
                  {totalNights > 0 ? `${totalNights} nights` : '—'}
                </span>
              </div>

              {aesthetics.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#57534e]">
                    <Icon name="style" size={16} className="text-[#C4613A]" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Style</span>
                  </div>
                  <span className="text-sm font-semibold text-[#292524] capitalize">
                    {aesthetics.slice(0, 2).join(', ')}
                  </span>
                </div>
              )}

              {gender && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#57534e]">
                    <Icon name="person" size={16} className="text-[#C4613A]" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Gender</span>
                  </div>
                  <span className="text-sm font-semibold text-[#292524] capitalize">{gender}</span>
                </div>
              )}

              {photo && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#57534e]">
                    <Icon name="photo_camera" size={16} className="text-[#C4613A]" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Reference Photo</span>
                  </div>
                  <span className="text-sm font-semibold text-[#292524]">Uploaded</span>
                </div>
              )}
            </div>

            {/* Edit button */}
            <div className="px-6 py-3 bg-[#FDF8F3] border-t border-[#E8DDD4] flex justify-end">
              <button
                onClick={() => goTo(1)}
                className="text-[#C4613A] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5"
              >
                Edit Details
                <Icon name="edit" size={14} />
              </button>
            </div>
          </div>

          {/* Error message */}
          {submitError && (
            <p className="text-sm text-red-500 mt-4 text-center" role="alert">{submitError}</p>
          )}

          {/* Turnstile widget */}
          <div className="flex justify-center mt-6">
            <div ref={turnstileRef} className="overflow-hidden rounded-lg" />
          </div>

          {/* Main CTA */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!step1Valid || submitting}
              className="w-full bg-[#C4613A] text-white py-4 rounded-2xl font-bold hover:bg-[#a34828] hover:-translate-y-0.5 transition-all text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 shadow-lg shadow-[#C4613A]/20"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing your trip...
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" size={20} />
                  Analyze My Trip
                </>
              )}
            </button>
          </div>

          {/* What happens next */}
          <div className="mt-6 p-5 bg-white rounded-xl border border-[#E8DDD4] flex items-start gap-3">
            <Icon name="auto_awesome" size={20} className="text-[#C4613A] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#292524] text-xs font-bold uppercase tracking-widest mb-1">What happens next</p>
              <p className="text-[#57534e] text-xs leading-relaxed">
                Our AI curates your perfect wardrobe by analyzing the local style scene, weather, and your aesthetic profile. You&apos;ll receive a free preview instantly.
              </p>
            </div>
          </div>

          {/* Legal */}
          <div className="mt-10 pt-6 border-t border-[#E8DDD4]">
            <p className="text-[11px] text-[#57534e]/50" style={{ fontFamily: bodyFont }}>
              By clicking &ldquo;Analyze My Trip&rdquo; you agree to our Terms of Service.
            </p>
          </div>

          {/* Back button */}
          <div className="mt-6 flex justify-start">
            <BtnSecondary size="sm" onClick={() => goTo(3)}>
              Back
            </BtnSecondary>
          </div>
        </div>
      )}
    </OnboardingLayout>
  )
}

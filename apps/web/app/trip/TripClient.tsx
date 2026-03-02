'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/components/LanguageContext'
import { useTurnstile } from '@/lib/turnstile'
import { apiPost, uploadPhoto } from '@/lib/api'
import type { CityInput, PreviewResponse } from '../../../../packages/types'
import CITY_DB from '../../../../packages/city-vibes-db/cities.json'
import { OnboardingLayout } from '@/components/travel-capsule/OnboardingLayout'
import { Icon } from '@/components/travel-capsule/Icon'
import { AestheticCard } from '@/components/travel-capsule/AestheticCard'

const MAX_CITIES = 5
const MAX_DATE = new Date(new Date().getFullYear() + 2, 11, 31).toISOString().split('T')[0]
const TODAY = new Date().toISOString().split('T')[0]

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

interface CityWithDates extends CityInput {
  start_date: string
  end_date: string
  imageUrl?: string
}

// ─── City options with Unsplash thumbnails ─────────────────────────────────

const CITY_OPTIONS = [
  { city: 'Paris', country: 'France', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=80&q=60' },
  { city: 'Tokyo', country: 'Japan', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=80&q=60' },
  { city: 'Barcelona', country: 'Spain', imageUrl: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=80&q=60' },
  { city: 'Milan', country: 'Italy', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c4a49f51?w=80&q=60' },
  { city: 'New York', country: 'USA', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=80&q=60' },
  { city: 'London', country: 'UK', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=80&q=60' },
  { city: 'Rome', country: 'Italy', imageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=80&q=60' },
  { city: 'Bali', country: 'Indonesia', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=80&q=60' },
]

function getCityImageUrl(cityName: string): string | undefined {
  const match = CITY_OPTIONS.find((o) => o.city.toLowerCase() === cityName.toLowerCase())
  return match?.imageUrl
}

// ─── Sidebar images per step ──────────────────────────────────────────────────

const SIDEBAR_IMAGES: Record<Step, string> = {
  1: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80',
  2: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
  3: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  4: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
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

const GENDER_OPTIONS: { id: string; label: string; icon: string; symbol: string }[] = [
  { id: 'male',       label: 'Male',       icon: 'man',    symbol: '\u2642' },
  { id: 'female',     label: 'Female',     icon: 'woman',  symbol: '\u2640' },
  { id: 'non-binary', label: 'Non-binary', icon: 'person', symbol: '\u26A7' },
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

function DateSelect({ value, onChange, disabled, min, label }: {
  value: string; onChange: (iso: string) => void; disabled?: boolean; min?: string; label: string
}) {
  return (
    <div className="flex flex-col flex-1 gap-1">
      <label className="text-[10px] uppercase font-bold tracking-[0.1em] text-[#8A7B6E]">{label}</label>
      <input
        type="date"
        value={value}
        min={min ?? TODAY}
        max={MAX_DATE}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-[#E8DDD4] bg-white text-[#1A1410] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4613A]/30 focus:border-[#C4613A] transition-colors disabled:opacity-40 cursor-pointer"
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripClient() {
  const router = useRouter()
  const { displayFont, bodyFont } = useLanguage()
  const { token: turnstileToken, containerRef: turnstileRef, reset: resetTurnstile } = useTurnstile()

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
  const [dragOver, setDragOver] = useState(false)
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
    return {
      name,
      country,
      lat,
      lon,
      start_date: suggestedStart,
      end_date: '',
      imageUrl: getCityImageUrl(name),
    }
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

  function removePhoto() {
    if (photoPreviewUrlRef.current) {
      URL.revokeObjectURL(photoPreviewUrlRef.current)
      photoPreviewUrlRef.current = null
    }
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyPhotoFile(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) applyPhotoFile(file)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDragLeave() {
    setDragOver(false)
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
        gender: gender || 'female',
        ...(parseFloat(height) ? { height_cm: parseFloat(height) } : {}),
        ...(parseFloat(weight) ? { weight_kg: parseFloat(weight) } : {}),
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

  const quote = QUOTES[step]

  // ─── Step 4 summary helpers ────────────────────────────────────────────────

  const primaryCity = cities[0]
  const primaryCityImageUrl = primaryCity?.imageUrl ?? SIDEBAR_IMAGES[4]
  const genderLabel = gender
    ? gender.charAt(0).toUpperCase() + gender.slice(1)
    : 'Not specified'
  const styleLabel = aesthetics.length > 0 ? aesthetics.join(', ') : 'Not selected'
  const step4DayCount = primaryCity
    ? Math.max(1, getNightCount(primaryCity.start_date, primaryCity.end_date))
    : 0

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <OnboardingLayout
      imageUrl={SIDEBAR_IMAGES[step]}
      quote={quote.text}
      quoteAuthor={quote.author}
      step={step}
      totalSteps={4}
    >
      {/* Logo row */}
      <header className="flex items-center justify-between mb-8">
        <a href="/" className="flex items-center gap-2" aria-label="Travel Capsule AI home">
          <Icon name="luggage" className="text-2xl text-[#C4613A]" />
          <span
            className="text-lg font-extrabold tracking-tight text-[#1A1410]"
            style={{ fontFamily: displayFont, fontStyle: 'italic' }}
          >
            Travel Capsule AI
          </span>
        </a>
      </header>

      {/* Step indicator bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A7B6E]"
            style={{ fontFamily: bodyFont }}
          >
            Step {step} of 4 &nbsp;|&nbsp; {step * 25}% complete
          </span>
        </div>
        {/* Segmented progress bar */}
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-[#C4613A]' : 'bg-[#E8DDD4]'
              }`}
            />
          ))}
        </div>
        <p
          className="text-[#C4613A] text-xs italic"
          style={{ fontFamily: displayFont }}
        >
          {STEP_SUBLABELS[step]}
        </p>
      </div>

      {/* ─── STEP 1: Destinations ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h1
            className="text-[#1A1410] mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Where are you{' '}
            <em style={{ fontFamily: displayFont }}>heading?</em>
          </h1>
          <p className="text-[15px] text-[#8A7B6E] mb-8 leading-relaxed" style={{ fontFamily: bodyFont }}>
            Tell us your destinations so we can tailor your capsule wardrobe to each city&apos;s climate and culture.
          </p>

          {/* City search input */}
          <div className="relative mb-4">
            <div className="relative">
              <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7B6E]/50" />
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
                className="w-full h-[48px] pl-12 pr-4 bg-white border border-[#E8DDD4] rounded-xl text-[15px] text-[#1A1410] placeholder:text-[#8A7B6E]/50 focus:border-[#C4613A] focus:outline-none focus:ring-2 focus:ring-[#C4613A]/20 transition-all disabled:opacity-50"
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

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute z-20 w-full mt-1 bg-white border border-[#E8DDD4] rounded-xl overflow-hidden"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}
              >
                {suggestions.map((s) => {
                  const thumbUrl = getCityImageUrl(s.city)
                  return (
                    <button
                      key={`${s.city}-${s.country}`}
                      onMouseDown={() => addCityFromSuggestion(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5EFE6] transition-colors text-left border-b border-[#E8DDD4] last:border-0 cursor-pointer"
                    >
                      {thumbUrl ? (
                        <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                          <Image src={thumbUrl} alt={s.city} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-[#F5EFE6] flex items-center justify-center flex-shrink-0">
                          <Icon name="location_on" size={16} className="text-[#C4613A]/60" />
                        </div>
                      )}
                      <div>
                        <span className="text-[14px] text-[#1A1410] font-medium" style={{ fontFamily: bodyFont }}>
                          {s.city}
                        </span>
                        <span className="text-[12px] text-[#8A7B6E] ml-2" style={{ fontFamily: bodyFont }}>
                          {s.country}
                        </span>
                        {s.mood_name && (
                          <p className="text-[11px] text-[#C4613A]/70 italic mt-0.5">{s.mood_name}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add destination link */}
          {cities.length < MAX_CITIES && cityInput.trim().length > 0 && (
            <button
              onClick={addCityFreeText}
              className="text-[#C4613A] text-sm font-medium flex items-center gap-1 mb-6 hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont }}
            >
              Add Destination <span className="text-base">&rarr;</span>
            </button>
          )}

          {/* Current Itinerary */}
          {cities.length > 0 && (
            <div className="mb-6">
              <label
                className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A7B6E] mb-3"
                style={{ fontFamily: bodyFont }}
              >
                Current Itinerary
              </label>
              <div className="space-y-3">
                {cities.map((city, i) => {
                  const nights = getNightCount(city.start_date, city.end_date)
                  const prevCityEnd = i > 0 ? cities[i - 1].end_date : ''
                  const minStart = i === 0 ? TODAY : (prevCityEnd || TODAY)

                  return (
                    <div
                      key={city.name}
                      className="bg-white rounded-xl border border-[#E8DDD4] overflow-hidden"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}
                    >
                      {/* City header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#F5EFE6]">
                          {city.imageUrl ? (
                            <Image src={city.imageUrl} alt={city.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="location_city" size={18} className="text-[#C4613A]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1A1410] text-sm truncate" style={{ fontFamily: bodyFont }}>
                            {city.name}
                          </p>
                          <p className="text-[#8A7B6E] text-xs" style={{ fontFamily: bodyFont }}>
                            {city.country}
                            {nights > 0 && <> &middot; {nights} night{nights !== 1 ? 's' : ''}</>}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCity(city.name)}
                          className="p-1.5 text-[#8A7B6E]/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`Remove ${city.name}`}
                        >
                          <Icon name="close" size={18} />
                        </button>
                      </div>

                      {/* Date pickers */}
                      <div className="flex items-end gap-3 px-4 pb-4">
                        <DateSelect
                          label="From"
                          value={city.start_date}
                          onChange={(v) => updateCityDate(i, 'start_date', v)}
                          min={minStart}
                        />
                        <Icon name="arrow_right_alt" size={18} className="text-[#8A7B6E]/40 mb-3 flex-shrink-0" />
                        <DateSelect
                          label="To"
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trip total summary */}
          {step1Valid && cities.length > 0 && (
            <div className="mb-6 px-4 py-3.5 bg-white rounded-xl border border-[#E8DDD4] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1410]" style={{ fontFamily: bodyFont }}>
                  {formatDateShort(overallStartDate)} &rarr; {formatDateShort(overallEndDate)}
                </p>
                <p className="text-xs text-[#8A7B6E] mt-0.5" style={{ fontFamily: bodyFont }}>
                  {totalNights} night{totalNights !== 1 ? 's' : ''}
                  {cities.length > 1 && ` \u00B7 ${cities.length} destinations`}
                </p>
              </div>
              <Icon name="flight" size={22} className="text-[#C4613A]" />
            </div>
          )}

          {cities.length >= MAX_CITIES && (
            <p className="mb-4 text-xs text-[#8A7B6E]/60 text-center" style={{ fontFamily: bodyFont }}>
              Maximum {MAX_CITIES} destinations reached.
            </p>
          )}

          {/* Nav footer */}
          <div className="mt-10 flex items-center justify-between border-t border-[#E8DDD4] pt-6">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-[#8A7B6E] hover:text-[#1A1410] transition-colors cursor-pointer flex items-center gap-1"
              style={{ fontFamily: bodyFont }}
            >
              <Icon name="arrow_back" size={16} /> Back
            </button>
            <button
              onClick={() => goTo(2)}
              disabled={!step1Valid}
              className="inline-flex items-center gap-2 bg-[#C4613A] text-white px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#A84A25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: bodyFont }}
            >
              Continue
              <Icon name="arrow_forward" size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Gender + Body Info ───────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h1
            className="text-[#1A1410] mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Personalize <em style={{ fontFamily: displayFont }}>your look</em>
          </h1>
          <p className="text-[15px] text-[#8A7B6E] leading-relaxed" style={{ fontFamily: bodyFont }}>
            Help us understand your preferences to create the perfect capsule wardrobe for your body and style.
          </p>

          {/* Gender Selection */}
          <div className="mt-10">
            <label
              className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A7B6E] mb-4"
              style={{ fontFamily: bodyFont }}
            >
              Gender Selection
            </label>
            <div className="grid grid-cols-3 gap-3">
              {GENDER_OPTIONS.map((g) => {
                const selected = gender === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center gap-2.5 py-6 px-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C4613A]/30 cursor-pointer ${
                      selected
                        ? 'border-[#C4613A] bg-[#FEF3EE]'
                        : 'border-[#E8DDD4] bg-white hover:border-[#C4613A]/30'
                    }`}
                  >
                    <span
                      className={`text-2xl ${selected ? 'text-[#C4613A]' : 'text-[#8A7B6E]'}`}
                      aria-hidden="true"
                    >
                      {g.symbol}
                    </span>
                    <span
                      className={`text-[13px] font-medium ${selected ? 'text-[#C4613A]' : 'text-[#1A1410]'}`}
                      style={{ fontFamily: bodyFont }}
                    >
                      {g.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body Info */}
          <div className="mt-10">
            <label
              className="block text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A7B6E] mb-1"
              style={{ fontFamily: bodyFont }}
            >
              Body Info
            </label>
            <p className="text-[12px] text-[#8A7B6E]/70 mb-4" style={{ fontFamily: bodyFont }}>
              Optional &mdash; helps with more accurate sizing recommendations
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A7B6E]"
                  style={{ fontFamily: bodyFont }}
                >
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-[#E8DDD4] bg-white px-4 py-3 rounded-lg text-sm text-[#1A1410] placeholder-[#8A7B6E]/40 focus:outline-none focus:border-[#C4613A] focus:ring-2 focus:ring-[#C4613A]/20 transition-all"
                  style={{ fontFamily: bodyFont }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A7B6E]"
                  style={{ fontFamily: bodyFont }}
                >
                  Weight (kg)
                </label>
                <input
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full border border-[#E8DDD4] bg-white px-4 py-3 rounded-lg text-sm text-[#1A1410] placeholder-[#8A7B6E]/40 focus:outline-none focus:border-[#C4613A] focus:ring-2 focus:ring-[#C4613A]/20 transition-all"
                  style={{ fontFamily: bodyFont }}
                />
              </div>
            </div>
          </div>

          {/* Nav footer */}
          <div className="mt-12 flex items-center justify-between border-t border-[#E8DDD4] pt-6">
            <button
              onClick={() => goTo(1)}
              className="text-sm text-[#8A7B6E] hover:text-[#1A1410] transition-colors cursor-pointer flex items-center gap-1"
              style={{ fontFamily: bodyFont }}
            >
              <Icon name="arrow_back" size={16} /> Back
            </button>
            <button
              onClick={() => goTo(3)}
              className="inline-flex items-center gap-2 bg-[#C4613A] text-white px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont }}
            >
              Continue
              <Icon name="arrow_forward" size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Aesthetic + Photo ────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <h1
            className="text-[#1A1410] mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Your Style <em style={{ fontFamily: displayFont }}>Profile</em>
          </h1>

          {/* Aesthetic Selection */}
          <div className="mt-8">
            <h4
              className="text-[#1A1410] mb-1 text-base font-semibold"
              style={{ fontFamily: bodyFont }}
            >
              Select Your Aesthetic
            </h4>
            <p className="text-[14px] text-[#8A7B6E] mb-5" style={{ fontFamily: bodyFont }}>
              Choose the looks that best represent your travel personality.
            </p>
            <div className="grid grid-cols-3 gap-3">
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
          </div>

          {/* Photo Upload */}
          <div className="mt-10 p-5 bg-[#C4613A]/5 rounded-xl border border-[#C4613A]/10">
            <div className="flex items-start gap-3">
              <Icon name="auto_awesome" size={22} className="text-[#C4613A] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-[#1A1410] mb-1 text-[15px] font-semibold" style={{ fontFamily: bodyFont }}>
                  Personalize with AI
                </h4>
                <p className="text-[13px] text-[#8A7B6E] mb-4" style={{ fontFamily: bodyFont }}>
                  Upload a full-body photo so our AI can generate outfits tailored to your proportions.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPhotoChange}
                  aria-label="Upload photo"
                />

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#E8DDD4] bg-white">
                    <div className="flex items-center gap-4 p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Your photo"
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#1A1410] block truncate font-medium" style={{ fontFamily: bodyFont }}>
                          {photo?.name ?? 'Photo uploaded'}
                        </span>
                        <span className="text-[12px] text-[#8A7B6E] flex items-center gap-1 mt-1" style={{ fontFamily: bodyFont }}>
                          <Icon name="check_circle" size={14} className="text-green-600" />
                          Ready for AI styling
                        </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#C4613A] hover:underline mt-1 cursor-pointer"
                          style={{ fontFamily: bodyFont }}
                        >
                          Change photo
                        </button>
                      </div>
                      <button
                        onClick={removePhoto}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5EFE6] transition-colors cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <Icon name="close" size={18} className="text-[#8A7B6E]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={dropZoneRef}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Click or drag to upload a photo"
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer bg-white/50 ${
                      dragOver
                        ? 'border-[#C4613A] bg-[#C4613A]/5'
                        : 'border-[#E8DDD4] hover:border-[#C4613A]/30'
                    }`}
                  >
                    <Icon name="cloud_upload" size={28} className="text-[#8A7B6E]/40 mx-auto" />
                    <p className="mt-2 text-[13px] text-[#8A7B6E]/60" style={{ fontFamily: bodyFont }}>
                      Drag & drop or click to upload
                    </p>
                    <p className="mt-1 text-[11px] text-[#8A7B6E]/40" style={{ fontFamily: bodyFont }}>
                      Full-body photo recommended &middot; PNG, JPG up to 5MB
                    </p>
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
          <div className="mt-12 flex items-center justify-between border-t border-[#E8DDD4] pt-6">
            <button
              onClick={() => goTo(2)}
              className="text-sm text-[#8A7B6E] hover:text-[#1A1410] transition-colors cursor-pointer flex items-center gap-1"
              style={{ fontFamily: bodyFont }}
            >
              <Icon name="arrow_back" size={16} /> Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goTo(4)}
                className="text-[13px] text-[#8A7B6E] hover:text-[#C4613A] transition-colors cursor-pointer underline underline-offset-4"
                style={{ fontFamily: bodyFont }}
              >
                Skip photo
              </button>
              <button
                onClick={() => goTo(4)}
                className="inline-flex items-center gap-2 bg-[#C4613A] text-white px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#A84A25] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont }}
              >
                Continue
                <Icon name="arrow_forward" size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Review + submit ──────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h1
            className="text-[#1A1410] mb-4"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontFamily: displayFont, lineHeight: 1.1 }}
          >
            Ready for your <em style={{ fontFamily: displayFont }}>getaway?</em>
          </h1>
          <p className="text-[15px] text-[#8A7B6E] leading-relaxed" style={{ fontFamily: bodyFont }}>
            Review your trip details before we analyze the perfect capsule wardrobe.
          </p>

          {/* Summary Card */}
          <div
            className="mt-8 bg-white rounded-2xl overflow-hidden border border-[#E8DDD4]"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
          >
            {/* City hero image */}
            <div className="relative h-[200px]">
              <Image
                src={primaryCityImageUrl}
                alt={primaryCity?.name ?? 'Your trip'}
                fill
                className="object-cover"
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className="px-3 py-1 bg-[#C4613A] text-white rounded-sm text-[10px] uppercase tracking-[0.12em] font-semibold"
                  style={{ fontFamily: bodyFont }}
                >
                  Trip Summary
                </span>
              </div>
              <div className="absolute bottom-4 left-5">
                <h3
                  className="text-white text-[24px] italic"
                  style={{ fontFamily: displayFont }}
                >
                  {cities.length > 0
                    ? cities.map((c) => `${c.name}, ${c.country}`).join(' \u00B7 ')
                    : 'Your Trip'}
                </h3>
              </div>
            </div>

            {/* Info rows */}
            <div className="p-5">
              <div className="space-y-3.5">
                {[
                  {
                    icon: 'calendar_today',
                    label: 'Dates',
                    value: overallStartDate && overallEndDate
                      ? `${formatDateDisplay(overallStartDate)} \u2014 ${formatDateDisplay(overallEndDate)}`
                      : '\u2014',
                  },
                  {
                    icon: 'schedule',
                    label: 'Duration',
                    value: step4DayCount > 0 ? `${step4DayCount} days` : '\u2014',
                  },
                  {
                    icon: 'palette',
                    label: 'Style',
                    value: styleLabel,
                  },
                  {
                    icon: 'person',
                    label: 'Gender',
                    value: genderLabel,
                  },
                  {
                    icon: 'photo_camera',
                    label: 'Reference Photo',
                    value: photo ? 'Uploaded' : 'Not provided',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <Icon name={row.icon} size={18} className="text-[#C4613A] flex-shrink-0" />
                    <span
                      className="text-[11px] uppercase tracking-[0.08em] text-[#8A7B6E] w-28 flex-shrink-0 font-medium"
                      style={{ fontFamily: bodyFont }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-[14px] text-[#1A1410] truncate capitalize"
                      style={{ fontFamily: bodyFont }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#E8DDD4] flex items-center justify-between">
                <p className="text-[13px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
                  Everything correct?
                </p>
                <button
                  onClick={() => goTo(1)}
                  className="inline-flex items-center gap-1 text-[#C4613A] text-[12px] uppercase tracking-[0.08em] hover:text-[#A84A25] transition-colors cursor-pointer font-semibold"
                  style={{ fontFamily: bodyFont }}
                >
                  Edit Details
                  <Icon name="edit" size={14} className="text-[#C4613A]" />
                </button>
              </div>
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
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!step1Valid || submitting}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[#C4613A] text-white px-8 py-4 text-base font-bold uppercase tracking-wide hover:bg-[#A84A25] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: bodyFont }}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analyzing your trip...
                </>
              ) : (
                <>
                  <Icon name="auto_awesome" size={20} className="text-white" />
                  Analyze My Trip
                </>
              )}
            </button>
          </div>

          {/* The Next Step */}
          <div className="mt-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A]" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#8A7B6E] font-bold" style={{ fontFamily: bodyFont }}>
                The Next Step
              </span>
            </div>
            <p className="text-[13px] text-[#8A7B6E] leading-relaxed" style={{ fontFamily: bodyFont }}>
              Once you click &ldquo;Analyze My Trip,&rdquo; our AI will process weather forecasts, cultural context, and your style preferences to generate a complete capsule wardrobe in under 30 seconds.
            </p>
          </div>

          {/* Footer legal */}
          <div className="mt-8 pt-5 border-t border-[#E8DDD4]">
            <p className="text-[11px] text-[#8A7B6E]/50 leading-relaxed" style={{ fontFamily: bodyFont }}>
              By clicking &ldquo;Analyze My Trip&rdquo; you agree to our Terms of Service and Privacy Policy. Your data is encrypted and never shared with third parties.
            </p>
          </div>

          {/* Back button */}
          <div className="mt-6 flex items-center pb-6">
            <button
              onClick={() => goTo(3)}
              className="text-sm text-[#8A7B6E] hover:text-[#1A1410] transition-colors cursor-pointer flex items-center gap-1"
              style={{ fontFamily: bodyFont }}
            >
              <Icon name="arrow_back" size={16} /> Back
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  )
}

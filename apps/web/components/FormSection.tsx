'use client'

import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '@/components/LanguageContext'

const CITY_OPTIONS = [
  { name: 'Paris', flag: '🇫🇷', country: 'France' },
  { name: 'Tokyo', flag: '🇯🇵', country: 'Japan' },
  { name: 'Rome', flag: '🇮🇹', country: 'Italy' },
  { name: 'Barcelona', flag: '🇪🇸', country: 'Spain' },
  { name: 'Bali', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'London', flag: '🇬🇧', country: 'UK' },
  { name: 'Amsterdam', flag: '🇳🇱', country: 'Netherlands' },
  { name: 'Prague', flag: '🇨🇿', country: 'Czechia' },
  { name: 'Lisbon', flag: '🇵🇹', country: 'Portugal' },
  { name: 'New York', flag: '🇺🇸', country: 'USA' },
  { name: 'Dubai', flag: '🇦🇪', country: 'UAE' },
  { name: 'Singapore', flag: '🇸🇬', country: 'Singapore' },
  { name: 'Sydney', flag: '🇦🇺', country: 'Australia' },
  { name: 'Istanbul', flag: '🇹🇷', country: 'Turkey' },
  { name: 'Berlin', flag: '🇩🇪', country: 'Germany' },
  { name: 'Vienna', flag: '🇦🇹', country: 'Austria' },
  { name: 'Copenhagen', flag: '🇩🇰', country: 'Denmark' },
  { name: 'Budapest', flag: '🇭🇺', country: 'Hungary' },
  { name: 'Krakow', flag: '🇵🇱', country: 'Poland' },
  { name: 'Santorini', flag: '🇬🇷', country: 'Greece' },
]

function getCityFlag(name: string): string {
  return CITY_OPTIONS.find(c => c.name.toLowerCase() === name.toLowerCase())?.flag ?? '📍'
}

interface City {
  id: number
  name: string
  days: number
}

interface CityInputProps {
  city: City
  onUpdate: (id: number, field: 'name' | 'days', value: string | number) => void
  onRemove: (id: number) => void
  canRemove: boolean
  placeholder: string
  nightsLabel: string
}

function CityInput({ city, onUpdate, onRemove, canRemove, placeholder, nightsLabel }: CityInputProps) {
  const [query, setQuery] = useState(city.name)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = query.length === 0
    ? CITY_OPTIONS
    : CITY_OPTIONS.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase())
      )

  // Use useCallback to stabilize the handler
  const handleDocClick = useCallback((e: MouseEvent) => {
    if (!wrapRef.current?.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }, [])

  // We use a ref-based approach instead of useEffect to avoid stale deps
  const listenerRef = useRef(handleDocClick)
  listenerRef.current = handleDocClick

  const addListener = useCallback(() => {
    document.addEventListener('mousedown', listenerRef.current)
  }, [])
  const removeListener = useCallback(() => {
    document.removeEventListener('mousedown', listenerRef.current)
  }, [])

  // On mount/unmount
  const mountedRef = useRef(false)
  if (!mountedRef.current) {
    mountedRef.current = true
  }

  function selectCity(name: string) {
    setQuery(name)
    onUpdate(city.id, 'name', name)
    setShowDropdown(false)
    removeListener()
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onUpdate(city.id, 'name', val)
    setShowDropdown(true)
    addListener()
  }

  function handleFocus() {
    setShowDropdown(true)
    addListener()
  }

  const flag = getCityFlag(query)

  return (
    <div ref={wrapRef} className="city-row-wrap">
      <div className="city-row">
        <span className="city-icon">{flag}</span>
        <input
          className="city-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          autoComplete="off"
        />
        <input
          className="days-input"
          type="number"
          value={city.days}
          min={1}
          max={30}
          onChange={e => onUpdate(city.id, 'days', parseInt(e.target.value) || 1)}
          aria-label={nightsLabel}
        />
        <span className="days-label">{nightsLabel}</span>
        {canRemove && (
          <button
            className="city-remove"
            onClick={() => onRemove(city.id)}
            aria-label="Remove city"
          >
            ×
          </button>
        )}
      </div>
      {showDropdown && filtered.length > 0 && (
        <ul className="city-dropdown" role="listbox">
          {filtered.slice(0, 8).map(opt => (
            <li
              key={opt.name}
              role="option"
              className="city-option"
              onMouseDown={() => selectCity(opt.name)}
            >
              <span className="opt-flag">{opt.flag}</span>
              <span className="opt-name">{opt.name}</span>
              <span className="opt-country">{opt.country}</span>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .city-row-wrap { position: relative; }
        .city-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
          background: #1e1a16;
          border: 1px solid rgba(200,169,110,0.4);
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          list-style: none; margin: 0; padding: 0.3rem;
        }
        .city-option {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.7rem; border-radius: 7px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .city-option:hover { background: rgba(200,169,110,0.15); }
        .opt-flag { font-size: 1rem; line-height: 1; }
        .opt-name { font-size: 0.88rem; color: rgba(255,255,255,0.9); font-weight: 500; flex: 1; }
        .opt-country { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
      `}</style>
    </div>
  )
}

interface FormSectionProps {
  onCheckout: (cities: City[], month: string) => void
  onToast: (msg: string) => void
}

export default function FormSection({ onCheckout, onToast }: FormSectionProps) {
  const { t } = useLanguage()

  const [cities, setCities] = useState<City[]>([
    { id: 1, name: 'Paris', days: 4 },
    { id: 2, name: 'Rome', days: 3 },
  ])
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(4) // May = index 4
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const nextId = useRef(3)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalDays = cities.reduce((sum, c) => sum + (c.days || 0), 0)
  const cityCount = cities.filter(c => c.name.trim()).length
  const selectedMonth = t.form.months[selectedMonthIndex] ?? t.form.months[4] ?? ''

  function addCity() {
    if (cities.length >= 5) {
      onToast(t.toast.cityMax)
      return
    }
    const unused = CITY_OPTIONS.find(opt => !cities.some(c => c.name === opt.name))
    const name = unused?.name ?? 'London'
    setCities(prev => [...prev, { id: nextId.current++, name, days: 3 }])
    onToast(t.toast.cityAdded)
  }

  function removeCity(id: number) {
    if (cities.length <= 1) {
      return
    }
    setCities(prev => prev.filter(c => c.id !== id))
  }

  function updateCity(id: number, field: 'name' | 'days', value: string | number) {
    setCities(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      onToast(t.toast.imageOnly)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast(t.toast.imageTooLarge)
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setPhotoPreview(ev.target?.result as string)
      onToast(t.toast.photoUploaded)
    }
    reader.readAsDataURL(file)
  }, [onToast, t.toast])

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  async function handleCheckout() {
    if (!cities.some(c => c.name.trim())) {
      onToast(t.toast.cityRequired)
      document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 300))
    onCheckout(cities, selectedMonth)
    setIsLoading(false)
  }

  return (
    <section className="form-section" id="formSection">
      <div className="container">
        <p className="section-label">{t.form.label}</p>
        <h2 className="section-title">{t.form.title}</h2>
        <p className="section-sub">{t.form.sub}</p>

        {/* Summary badge */}
        {cityCount > 0 && (
          <div className="summary-badge">
            <span className="summary-icon">✈️</span>
            총 <strong>{totalDays}{t.form.totalDays}</strong> · <strong>{cityCount}{t.form.totalCities}</strong>
            {cityCount < 5 && (
              <span className="summary-more"> · {t.form.moreCities} {5 - cityCount}{t.form.totalCities} 더 추가 가능</span>
            )}
          </div>
        )}

        <div className="form-grid">
          {/* LEFT: inputs */}
          <div>
            {/* Cities */}
            <div className="form-card" style={{ marginBottom: '1.2rem' }}>
              <h3>{t.form.cityLabel}</h3>
              <div className="city-list">
                {cities.map(city => (
                  <CityInput
                    key={city.id}
                    city={city}
                    onUpdate={updateCity}
                    onRemove={removeCity}
                    canRemove={cities.length > 1}
                    placeholder={t.form.cityPlaceholder}
                    nightsLabel={t.form.cityNights}
                  />
                ))}
              </div>
              <button
                className="add-city-btn"
                onClick={addCity}
                disabled={cities.length >= 5}
                aria-label={t.form.cityAdd}
              >
                {t.form.cityAdd} {cities.length >= 5 && <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{t.form.cityMax}</span>}
              </button>
            </div>

            {/* Month */}
            <div className="form-card" style={{ marginBottom: '1.2rem' }}>
              <h3>{t.form.monthLabel}</h3>
              <div className="month-grid">
                {t.form.months.map((m, idx) => (
                  <button
                    key={idx}
                    className={`month-btn${selectedMonthIndex === idx ? ' active' : ''}`}
                    onClick={() => setSelectedMonthIndex(idx)}
                    aria-pressed={selectedMonthIndex === idx}
                    aria-label={`${m}`}
                  >
                    <span className="month-label-text">{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="form-card">
              <h3>{t.form.photoLabel} <span className="optional-tag">{t.form.photoOptional}</span></h3>
              <div
                className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${photoPreview ? 'has-preview' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label={t.form.photoDrop}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  id="photoInput"
                  style={{ display: 'none' }}
                />
                {photoPreview ? (
                  <div className="upload-preview-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="upload-preview"
                      src={photoPreview}
                      alt="Uploaded photo preview"
                    />
                    <div className="upload-text">
                      <strong>{t.form.photoUploaded}</strong>
                      <br />
                      <span className="upload-hint">{t.form.photoChange}</span>
                      <br />
                      <span className="upload-privacy">{t.form.photoPrivacy}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">{isDragOver ? '⬇️' : '🤳'}</div>
                    <div className="upload-text">
                      <strong>{isDragOver ? t.form.photoDragOver : t.form.photoDrop}</strong>
                      <br />
                      {t.form.photoSub}
                      <br />
                      <span className="upload-hint">{t.form.photoFormats}</span>
                      <br />
                      <span className="upload-privacy">{t.form.photoFaceRec}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: preview card */}
          <div>
            <div className="preview-card">
              <h3>{t.form.previewTitle}</h3>
              <div className="preview-images">
                <div className="preview-img-wrap unlocked">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1549144511-f099e773c147?w=300&q=60"
                    alt="paris preview"
                  />
                  <div className="wm">TRAVEL CAPSULE AI · SAMPLE</div>
                </div>
                <div className="preview-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=60"
                    alt="locked preview"
                  />
                  <div className="blur-label">
                    <span>🔒</span>
                    <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>$5로 잠금 해제</span>
                  </div>
                </div>
                <div className="preview-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=60"
                    alt="locked preview"
                  />
                  <div className="blur-label">
                    <span>🔒</span>
                    <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>$5로 잠금 해제</span>
                  </div>
                </div>
                <div className="preview-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=60"
                    alt="locked preview"
                  />
                  <div className="blur-label">
                    <span>🔒</span>
                    <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>$5로 잠금 해제</span>
                  </div>
                </div>
              </div>
              <p className="preview-caption">{t.form.previewCaption}</p>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>{t.form.imageGen}</span>
                  <span>{cityCount}{t.form.totalCities} × 3-4장</span>
                </div>
                <div className="price-row">
                  <span>{t.form.capsuleWardrobe}</span>
                  <span>8–12 아이템</span>
                </div>
                <div className="price-row">
                  <span>{t.form.dailyPlan}</span>
                  <span>{totalDays}{t.form.totalDays}</span>
                </div>
                <div className="price-row">
                  <span>{t.form.shareGallery}</span>
                  <span>{t.form.included}</span>
                </div>
                <div className="price-row total">
                  <span>{t.form.totalLabel}</span>
                  <span>$5</span>
                </div>
                <div className="price-anchor">
                  스타일리스트 평균 <del>$200/hr</del> vs Travel Capsule AI <strong>$5</strong>
                </div>
              </div>

              <div className="checkout-social-proof">
                <span>👥 이번 달 2,400+ 사용</span>
                <span>·</span>
                <span>⚡ 결제 후 4분 내 완성</span>
              </div>

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
                aria-label={t.form.checkoutBtn}
              >
                {isLoading ? (
                  <span className="spinner-wrap">
                    <span className="btn-spinner" />
                    {t.form.processing}
                  </span>
                ) : (
                  t.form.checkoutBtn
                )}
              </button>
              <p className="checkout-note">
                {t.form.checkoutSub}
                <br />
                {t.form.priceNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .summary-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(200,169,110,0.12);
          border: 1px solid rgba(200,169,110,0.3);
          border-radius: 50px;
          padding: 0.45rem 1rem;
          font-size: 0.85rem;
          color: var(--gold);
          margin-top: 1.5rem;
        }
        .summary-badge :global(strong) { color: #e0c47a; }
        .summary-icon { font-size: 0.9rem; }
        .summary-more { opacity: 0.6; }

        .month-label-text { font-size: 0.75rem; }

        .optional-tag {
          font-size: 0.65rem; letter-spacing: 0.06em;
          background: rgba(200,169,110,0.2);
          color: var(--gold);
          padding: 2px 7px; border-radius: 4px;
          vertical-align: middle;
          text-transform: uppercase;
          font-weight: 500;
        }

        .upload-zone.drag-over {
          border-color: var(--gold);
          background: rgba(200,169,110,0.1);
        }
        .upload-preview-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
        }
        .upload-hint {
          font-size: 0.72rem;
          opacity: 0.55;
        }
        .upload-privacy {
          font-size: 0.68rem;
          opacity: 0.45;
        }
        .preview-caption {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
          text-align: center;
          margin-bottom: 1rem;
        }

        .spinner-wrap {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .checkout-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .checkout-social-proof {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.6rem;
        }

        .price-anchor {
          text-align: center;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 0.5rem;
          padding-top: 0.5rem;
        }
        .price-anchor del { color: rgba(255, 255, 255, 0.2); }
        .price-anchor strong { color: rgba(200, 169, 110, 0.8); }
      `}</style>
    </section>
  )
}

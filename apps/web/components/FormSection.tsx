'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const MONTHS = [
  { label: '1월', short: 'Jan' },
  { label: '2월', short: 'Feb' },
  { label: '3월', short: 'Mar' },
  { label: '4월', short: 'Apr' },
  { label: '5월', short: 'May' },
  { label: '6월', short: 'Jun' },
  { label: '7월', short: 'Jul' },
  { label: '8월', short: 'Aug' },
  { label: '9월', short: 'Sep' },
  { label: '10월', short: 'Oct' },
  { label: '11월', short: 'Nov' },
  { label: '12월', short: 'Dec' },
]

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
}

function CityInput({ city, onUpdate, onRemove, canRemove }: CityInputProps) {
  const [query, setQuery] = useState(city.name)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtered = query.length === 0
    ? CITY_OPTIONS
    : CITY_OPTIONS.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selectCity(name: string) {
    setQuery(name)
    onUpdate(city.id, 'name', name)
    setShowDropdown(false)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onUpdate(city.id, 'name', val)
    setShowDropdown(true)
  }

  const flag = getCityFlag(query)

  return (
    <div ref={wrapRef} className="city-row-wrap">
      <div className="city-row">
        <span className="city-icon">{flag}</span>
        <input
          className="city-input"
          type="text"
          placeholder="도시 이름 (예: Paris)"
          value={query}
          onChange={handleInput}
          onFocus={() => setShowDropdown(true)}
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
          aria-label="숙박 일수"
        />
        <span className="days-label">박</span>
        {canRemove && (
          <button
            className="city-remove"
            onClick={() => onRemove(city.id)}
            aria-label="도시 삭제"
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
  const [cities, setCities] = useState<City[]>([
    { id: 1, name: 'Paris', days: 4 },
    { id: 2, name: 'Rome', days: 3 },
  ])
  const [selectedMonth, setSelectedMonth] = useState<string>('5월')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const nextId = useRef(3)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalDays = cities.reduce((sum, c) => sum + (c.days || 0), 0)
  const cityCount = cities.filter(c => c.name.trim()).length

  function addCity() {
    if (cities.length >= 5) {
      onToast('최대 5개 도시까지 추가할 수 있어요')
      return
    }
    const unused = CITY_OPTIONS.find(opt => !cities.some(c => c.name === opt.name))
    const name = unused?.name ?? 'London'
    setCities(prev => [...prev, { id: nextId.current++, name, days: 3 }])
    onToast('도시가 추가됐습니다 ✓')
  }

  function removeCity(id: number) {
    if (cities.length <= 1) {
      onToast('최소 1개 도시가 필요해요')
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
      onToast('이미지 파일만 가능합니다')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast('10MB 이하 파일만 업로드 가능해요')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      setPhotoPreview(ev.target?.result as string)
      onToast('사진 업로드 완료! 내 얼굴로 코디 이미지를 생성합니다 🎉')
    }
    reader.readAsDataURL(file)
  }, [onToast])

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
      onToast('먼저 여행 도시를 입력해주세요')
      document.getElementById('formSection')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setIsLoading(true)
    // Small delay to show spinner before navigation
    await new Promise(r => setTimeout(r, 300))
    onCheckout(cities, selectedMonth)
    setIsLoading(false)
  }

  return (
    <section className="form-section" id="formSection">
      <div className="container">
        <p className="section-label">여행 정보 입력</p>
        <h2 className="section-title">내 여행 스타일링 시작</h2>
        <p className="section-sub">
          도시와 기간을 입력하면 AI가 날씨·분위기·활동에 맞는 캡슐 워드로브를 설계합니다.
        </p>

        {/* Summary badge */}
        {cityCount > 0 && (
          <div className="summary-badge">
            <span className="summary-icon">✈️</span>
            총 <strong>{totalDays}박</strong> 여행 · <strong>{cityCount}개 도시</strong>
            {cityCount < 5 && (
              <span className="summary-more"> · 최대 {5 - cityCount}개 도시 더 추가 가능</span>
            )}
          </div>
        )}

        <div className="form-grid">
          {/* LEFT: inputs */}
          <div>
            {/* Cities */}
            <div className="form-card" style={{ marginBottom: '1.2rem' }}>
              <h3>여행 도시</h3>
              <div className="city-list">
                {cities.map(city => (
                  <CityInput
                    key={city.id}
                    city={city}
                    onUpdate={updateCity}
                    onRemove={removeCity}
                    canRemove={cities.length > 1}
                  />
                ))}
              </div>
              <button
                className="add-city-btn"
                onClick={addCity}
                disabled={cities.length >= 5}
                aria-label="도시 추가"
              >
                + 도시 추가 {cities.length >= 5 && <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(최대 5개)</span>}
              </button>
            </div>

            {/* Month */}
            <div className="form-card" style={{ marginBottom: '1.2rem' }}>
              <h3>여행 월</h3>
              <div className="month-grid">
                {MONTHS.map(m => (
                  <button
                    key={m.label}
                    className={`month-btn${selectedMonth === m.label ? ' active' : ''}`}
                    onClick={() => setSelectedMonth(m.label)}
                    aria-pressed={selectedMonth === m.label}
                    aria-label={`${m.label} 선택`}
                  >
                    <span className="month-label-ko">{m.label}</span>
                    <span className="month-label-en">{m.short}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="form-card">
              <h3>내 사진 업로드 <span className="optional-tag">선택</span></h3>
              <div
                className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${photoPreview ? 'has-preview' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="사진 업로드 영역, 클릭 또는 드래그"
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
                      alt="업로드된 사진 미리보기"
                    />
                    <div className="upload-text">
                      <strong>사진 업로드 완료 ✓</strong>
                      <br />
                      <span className="upload-hint">클릭해서 다른 사진으로 변경</span>
                      <br />
                      <span className="upload-privacy">생성 후 즉시 삭제됩니다</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">{isDragOver ? '⬇️' : '🤳'}</div>
                    <div className="upload-text">
                      <strong>{isDragOver ? '여기에 놓으세요!' : '사진을 드래그하거나 클릭해서 업로드'}</strong>
                      <br />
                      얼굴이 잘 보이는 정면 사진을 권장합니다
                      <br />
                      <span className="upload-hint">JPG, PNG, HEIC · 최대 10MB</span>
                      <br />
                      <span className="upload-privacy">업로드 후 생성 즉시 삭제 · 외부 공유 없음</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: preview card */}
          <div>
            <div className="preview-card">
              <h3>미리보기 (무료)</h3>
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
                    <span>🔒</span>잠금됨
                  </div>
                </div>
                <div className="preview-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=60"
                    alt="locked preview"
                  />
                  <div className="blur-label">
                    <span>🔒</span>잠금됨
                  </div>
                </div>
                <div className="preview-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=60"
                    alt="locked preview"
                  />
                  <div className="blur-label">
                    <span>🔒</span>잠금됨
                  </div>
                </div>
              </div>
              <p className="preview-caption">
                1장은 무료 미리보기 · 나머지 3장 + 전 도시 잠금
              </p>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>이미지 생성</span>
                  <span>도시 {cityCount}개 × 3-4장</span>
                </div>
                <div className="price-row">
                  <span>캡슐 워드로브</span>
                  <span>8–12 아이템</span>
                </div>
                <div className="price-row">
                  <span>데일리 플랜</span>
                  <span>{totalDays}박 플랜</span>
                </div>
                <div className="price-row">
                  <span>공유 갤러리 링크</span>
                  <span>포함</span>
                </div>
                <div className="price-row total">
                  <span>합계</span>
                  <span>$5</span>
                </div>
              </div>

              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isLoading}
                aria-label="전체 스타일링 언락 $5"
              >
                {isLoading ? (
                  <span className="spinner-wrap">
                    <span className="btn-spinner" />
                    처리 중…
                  </span>
                ) : (
                  '🔓 전체 스타일링 언락 — $5'
                )}
              </button>
              <p className="checkout-note">
                Polar로 안전하게 결제 · 자동 갱신 없음
                <br />
                결제 후 약 2–4분 내 결과 전송
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

        .month-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px;
        }
        .month-label-ko { font-size: 0.75rem; }
        .month-label-en { font-size: 0.6rem; opacity: 0.6; }
        .month-btn.active .month-label-en { opacity: 0.8; }

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
      `}</style>
    </section>
  )
}

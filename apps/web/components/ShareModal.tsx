'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  cities: string[]
  month: string
  previewImageUrl?: string
}

// ─── Viral copy templates ─────────────────────────────────────────────────────

function getViralCopy(cities: string[], month: string): string {
  const c = cities.slice(0, 2).join(' + ')
  const templates = [
    `AI가 만들어준 내 ${c} 여행 코디 🤩\n짐 걱정 끝, 스타일은 완성 ✈️\n\n#TravelCapsuleAI #여행코디 #${cities[0] ?? ''}여행`,
    `${month} ${c} 여행 준비 완료 🧳\nAI가 코디부터 캡슐 워드로브까지 다 짜줬어 👗\n\n#AI패션 #TravelCapsuleAI #여행스타일`,
    `Travel Capsule AI로 ${c} 여행 스타일링 완성 ✨\n$5로 이게 가능하다고? 진짜 써봤어\n\n#여행패션 #TravelCapsuleAI #캡슐워드로브`,
  ]
  const idx = Math.abs(cities.join('').length) % templates.length
  return templates[idx] ?? templates[0] ?? ''
}

// ─── UTM link builder ─────────────────────────────────────────────────────────

function buildShareUrl(tripId: string, platform: string): string {
  const base = `https://travelcapsule.ai/result/${tripId}`
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: 'user_share',
  })
  return `${base}?${params.toString()}`
}

function buildReferralUrl(tripId: string, platform: string): string {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'referral',
    utm_campaign: 'shared_result',
    utm_content: tripId,
  })
  return `https://travelcapsule.ai/?${params.toString()}`
}

// ─── Platform share openers ───────────────────────────────────────────────────

function shareToTwitter(text: string, url: string) {
  const params = new URLSearchParams({ text: `${text}\n\n${url}` })
  window.open(`https://twitter.com/intent/tweet?${params}`, '_blank', 'width=600,height=500')
}

function shareToFacebook(url: string) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500')
}

function shareToLine(text: string, url: string) {
  window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
}

function shareToWhatsApp(text: string, url: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank')
}

function shareToKakao(url: string, cities: string[]) {
  // Try KakaoTalk app URL scheme first, fallback to KakaoStory web
  const cityText = cities.slice(0, 2).join(', ')
  const msg = encodeURIComponent(`AI가 만들어준 ${cityText} 여행 코디 👗`)
  // KakaoStory web share
  window.open(`https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${msg}`, '_blank')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareModal({ isOpen, onClose, tripId, cities, month, previewImageUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [shareText, setShareText] = useState('')
  const [visible, setVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShareText(getViralCopy(cities, month))
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen, cities, month])

  const shareUrl = buildShareUrl(tripId, 'direct')
  const referralUrl = buildReferralUrl(tripId, 'result')

  const handleCopy = useCallback(async () => {
    const textToCopy = `${shareText}\n\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(`링크를 복사해주세요:\n${shareUrl}`)
    }
  }, [shareText, shareUrl])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `내 ${cities.slice(0, 2).join(' + ')} 여행 스타일 — Travel Capsule AI`,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // cancelled
      }
    }
  }, [shareText, shareUrl, cities])

  const handleDownload = useCallback(async () => {
    if (!previewImageUrl) return
    setDownloading(true)
    try {
      const res = await fetch(previewImageUrl)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `travel-capsule-${cities[0] ?? 'outfit'}.jpg`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(previewImageUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }, [previewImageUrl, cities])

  if (!visible) return null

  const panels: Array<{ label: string; icon: string; bg: string; color: string; onClick: () => void }> = [
    {
      label: 'Twitter / X',
      icon: '𝕏',
      bg: '#000',
      color: '#fff',
      onClick: () => shareToTwitter(shareText, buildShareUrl(tripId, 'twitter')),
    },
    {
      label: 'KakaoTalk',
      icon: '💬',
      bg: '#FEE500',
      color: '#391B1B',
      onClick: () => shareToKakao(buildShareUrl(tripId, 'kakaotalk'), cities),
    },
    {
      label: 'Facebook',
      icon: 'f',
      bg: '#1877F2',
      color: '#fff',
      onClick: () => shareToFacebook(buildShareUrl(tripId, 'facebook')),
    },
    {
      label: 'LINE',
      icon: 'L',
      bg: '#06C755',
      color: '#fff',
      onClick: () => shareToLine(shareText, buildShareUrl(tripId, 'line')),
    },
    {
      label: 'WhatsApp',
      icon: '✆',
      bg: '#25D366',
      color: '#fff',
      onClick: () => shareToWhatsApp(shareText, buildShareUrl(tripId, 'whatsapp')),
    },
    {
      label: copied ? '복사됨 ✓' : '링크 복사',
      icon: copied ? '✓' : '🔗',
      bg: copied ? '#5B8C5A' : 'var(--sand)',
      color: copied ? '#fff' : 'var(--ink)',
      onClick: handleCopy,
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,20,16,0.6)',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'var(--cream)',
          borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                Share
              </p>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--ink)' }}>
                내 여행 스타일 공유하기
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'none', cursor: 'pointer',
                fontSize: '1.1rem', color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Preview */}
          {previewImageUrl && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 72, height: 96, borderRadius: 10, overflow: 'hidden',
                flexShrink: 0, background: 'var(--sand)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImageUrl} alt="outfit preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                  {cities.slice(0, 3).join(' · ')} · {month}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                  AI가 생성한 나만의 여행 코디를 친구들과 공유해보세요 ✨
                </p>
              </div>
            </div>
          )}

          {/* Editable viral text */}
          <div style={{ marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              공유 문구 (수정 가능)
            </p>
            <textarea
              value={shareText}
              onChange={e => setShareText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--warm-white)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '0.8rem',
                fontSize: '0.88rem',
                color: 'var(--ink)',
                lineHeight: 1.6,
                resize: 'none',
                fontFamily: 'DM Sans, sans-serif',
                outline: 'none',
              }}
            />
          </div>

          {/* Platform buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            marginBottom: '1rem',
          }}>
            {panels.map(p => (
              <button
                key={p.label}
                onClick={p.onClick}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.8rem 0.4rem',
                  background: p.bg,
                  color: p.color,
                  border: p.bg === 'var(--sand)' ? '1px solid var(--border)' : 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.15s',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = '' }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Native share + download row */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem' }}>
            {'share' in navigator && (
              <button
                onClick={handleNativeShare}
                style={{
                  flex: 1, padding: '0.8rem',
                  background: 'var(--ink)', color: 'white',
                  border: 'none', borderRadius: 10,
                  fontSize: '0.88rem', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                📲 더 많은 앱으로 공유
              </button>
            )}
            {previewImageUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  flex: 1, padding: '0.8rem',
                  background: 'var(--warm-white)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: '0.88rem', fontWeight: 500,
                  cursor: downloading ? 'wait' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? '저장 중...' : '🖼 이미지 저장'}
              </button>
            )}
          </div>

          {/* Viral referral CTA */}
          <div style={{
            background: 'linear-gradient(135deg, var(--terracotta) 0%, #a84f2f 100%)',
            borderRadius: 12,
            padding: '1rem 1.2rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
          }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                친구도 여행 스타일링 받게 해주세요 ✈️
              </p>
              <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                이 링크로 가입하면 같은 가격에 더 많은 도시 지원
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralUrl).catch(() => {})
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Travel Capsule AI 써봤는데 진짜 대박 🤩 $5로 AI 여행 코디 추천받아봐\n\n${referralUrl}`)}`, '_blank')
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                borderRadius: 8,
                padding: '0.5rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              공유하기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/components/LanguageContext'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  cities: string[]
  month: string
  previewImageUrl?: string
}

// ─── UTM link builder ─────────────────────────────────────────────────────────

function buildShareUrl(tripId: string, platform: string): string {
  const base = `https://travelscapsule.com/result/${tripId}`
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
  return `https://travelscapsule.com/?${params.toString()}`
}

// ─── Viral copy generator (inlined from legacy i18n) ─────────────────────────

function getViralCopies(citiesStr: string, month: string, city0: string): string[] {
  return [
    `Just got my AI travel capsule for ${citiesStr} in ${month} ✈️`,
    `${city0} in ${month} — Travel Capsule AI styled my whole trip 🌍`,
    `Weather-perfect outfits for ${citiesStr} — powered by AI 👗`,
    `No more packing anxiety! AI planned my ${citiesStr} wardrobe for ${month} 🧳`,
  ]
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
  const cityText = cities.slice(0, 2).join(', ')
  const msg = encodeURIComponent(`AI가 만들어준 ${cityText} 여행 코디 👗`)
  window.open(`https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${msg}`, '_blank')
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareModal({ isOpen, onClose, tripId, cities, month, previewImageUrl }: ShareModalProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [shareText, setShareText] = useState('')
  const [visible, setVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const citiesStr = cities.slice(0, 2).join(' + ')
      const city0 = cities[0] ?? ''
      const copies = getViralCopies(citiesStr, month, city0)
      const idx = Math.abs(cities.join('').length) % copies.length
      setShareText(copies[idx] ?? copies[0] ?? '')
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timer)
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
      alert(`${t('share.copyLink')}:\n${shareUrl}`)
    }
  }, [shareText, shareUrl, t])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        const citiesStr = cities.slice(0, 2).join(' + ')
        await navigator.share({
          title: `${t('share.nativeShareTitle')}: ${citiesStr}`,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // cancelled
      }
    }
  }, [shareText, shareUrl, cities, t])

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
      label: copied ? t('share.copied') : t('share.copyLink'),
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
                {t('share.sub')}
              </p>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--ink)' }}>
                {t('share.title')}
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
                  {t('share.previewText')}
                </p>
              </div>
            </div>
          )}

          {/* Editable viral text */}
          <div style={{ marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
              {t('share.editableLabel')}
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
                fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {t('share.nativeShare')}
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
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? t('share.saving') : t('share.saveImage')}
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
                {t('share.referralTitle')}
              </p>
              <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                {t('share.referralSub')}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralUrl).catch(() => {})
                const citiesStr = cities.slice(0, 2).join(' + ')
                const copies = getViralCopies(citiesStr, month, cities[0] ?? '')
                const tweetText = copies[0] ?? ''
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${tweetText}\n\n${referralUrl}`)}`, '_blank')
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
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {t('share.referralBtn')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

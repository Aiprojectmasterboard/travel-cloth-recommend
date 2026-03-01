'use client'

import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { upgradeTrip } from '@/lib/api'

export interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  upgradeToken: string
}

const TIMER_MS = 3 * 60 * 1000 // 3 minutes

function formatMmSs(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSecs = Math.ceil(ms / 1000)
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function UpgradeModal({
  isOpen,
  onClose,
  tripId,
  upgradeToken,
}: UpgradeModalProps) {
  const [remaining, setRemaining] = useState(TIMER_MS)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setRemaining(TIMER_MS)
    setStatus('idle')
    setError(null)

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(id)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(id)
  }, [isOpen])

  if (!isOpen) return null

  const expired = remaining === 0

  async function handleUpgrade() {
    setStatus('loading')
    setError(null)
    try {
      const { checkout_url } = await upgradeTrip(tripId, upgradeToken)
      setStatus('success')
      // Redirect to Polar checkout for Pro upgrade
      setTimeout(() => {
        window.location.href = checkout_url
      }, 500)
    } catch {
      setStatus('error')
      setError('Upgrade failed. The offer may have expired.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Pro"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-[#1A1410] text-white rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-8 pb-6">
          {/* Timer */}
          <div className="flex items-baseline gap-2 mb-5">
            <span
              className={`font-mono text-3xl font-bold tabular-nums ${
                expired ? 'text-red-400' : remaining < 60_000 ? 'text-[#b8552e]' : 'text-[#D4AF37]'
              }`}
            >
              {formatMmSs(remaining)}
            </span>
            <span className="text-sm text-white/50">
              {expired ? 'Offer expired' : 'left for this offer'}
            </span>
          </div>

          <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 font-medium mb-2">
            One-time offer
          </p>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Upgrade to Pro
          </h2>
          <p className="text-sm text-white/60 mb-5">
            Add $7 now to unlock 4–6 full images per city, high-res quality, and 1 free regeneration.
          </p>

          {/* Pro features */}
          <ul className="space-y-2 mb-6">
            {[
              '4–6 real outfit images per city',
              'High-resolution output',
              '1 free regeneration included',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                <svg
                  className="w-4 h-4 text-[#D4AF37] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {status === 'success' ? (
            <div className="text-center py-2">
              <p className="text-[#D4AF37] font-semibold">Upgraded! Refreshing...</p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleUpgrade}
                loading={status === 'loading'}
                disabled={expired || status === 'loading'}
                className="w-full"
              >
                Upgrade to Pro — +$7
              </Button>
              {error && (
                <p className="text-xs text-red-400 mt-2 text-center" role="alert">
                  {error}
                </p>
              )}
              {expired && (
                <p className="text-xs text-white/40 mt-2 text-center">Offer has expired.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

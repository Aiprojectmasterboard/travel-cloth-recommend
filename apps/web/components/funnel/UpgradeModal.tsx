'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const PRO_FEATURES = [
  '4–6 real outfit images per city',
  'High-resolution output',
  '1 free regeneration included',
]

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

  const expired = remaining === 0
  const isUrgent = remaining < 60_000 && !expired

  async function handleUpgrade() {
    setStatus('loading')
    setError(null)
    try {
      const { checkout_url } = await upgradeTrip(tripId, upgradeToken)
      setStatus('success')
      setTimeout(() => {
        window.location.href = checkout_url
      }, 500)
    } catch {
      setStatus('error')
      setError('Upgrade failed. The offer may have expired.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade to Pro"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-sm bg-[#1A1410] text-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Urgency gradient stripe at top */}
            <div
              className="h-1 w-full"
              style={{
                background: expired
                  ? '#ef4444'
                  : `linear-gradient(90deg, #b8552e ${Math.round((1 - remaining / TIMER_MS) * 100)}%, rgba(255,255,255,0.1) ${Math.round((1 - remaining / TIMER_MS) * 100)}%)`,
              }}
              aria-hidden="true"
            />

            <div className="px-6 pt-6 pb-6">
              {/* Timer */}
              <div className="flex items-baseline gap-2 mb-5">
                <motion.span
                  key={Math.ceil(remaining / 1000)}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`font-mono text-3xl font-bold tabular-nums ${
                    expired ? 'text-red-400' : isUrgent ? 'text-[#b8552e]' : 'text-[#D4AF37]'
                  }`}
                >
                  {formatMmSs(remaining)}
                </motion.span>
                <span className="text-sm text-white/50">
                  {expired ? 'Offer expired' : 'left for this offer'}
                </span>
              </div>

              <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 font-medium mb-2">
                One-time offer
              </p>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Upgrade to Pro
              </h2>
              <p className="text-sm text-white/60 mb-5">
                Add <strong className="text-white">$7</strong> now to unlock 4–6 full images per city, high-res quality, and 1 free regeneration.
              </p>

              {/* Price comparison */}
              <div className="flex items-center gap-3 mb-5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">You paid</p>
                  <p className="text-white font-bold">$5</p>
                </div>
                <div className="text-white/20 text-lg">+</div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Upgrade</p>
                  <p className="text-[#D4AF37] font-bold">$7</p>
                </div>
                <div className="text-white/20 text-lg">=</div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Pro Total</p>
                  <p className="text-white font-bold">$12</p>
                </div>
              </div>

              {/* Pro features */}
              <ul className="space-y-2 mb-6">
                {PRO_FEATURES.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex items-center gap-2.5 text-sm text-white/80"
                  >
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
                  </motion.li>
                ))}
              </ul>

              {status === 'success' ? (
                <div className="text-center py-2">
                  <p className="text-[#D4AF37] font-semibold">Upgraded! Redirecting...</p>
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

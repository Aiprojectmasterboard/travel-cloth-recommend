'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

export interface TeaserGridProps {
  teaserUrl: string
  expiresAt: string
  onUnlock: () => void
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
}

export default function TeaserGrid({ teaserUrl, expiresAt, onUnlock }: TeaserGridProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  )

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = remaining === 0
  const isUrgent = remaining < 3_600_000 && !isExpired

  return (
    <div className="flex flex-col gap-4">
      {/* Countdown bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1A1410]/70">
          {isExpired ? 'Preview expired' : 'Preview expires in'}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={isUrgent ? 'urgent' : 'normal'}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-sm font-bold tabular-nums px-3 py-1 rounded-full ${
              isExpired
                ? 'bg-red-50 text-red-500'
                : isUrgent
                ? 'bg-[#b8552e]/10 text-[#b8552e]'
                : 'bg-[#1A1410]/[0.06] text-[#1A1410]'
            }`}
          >
            {formatTimeRemaining(remaining)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-2" aria-label="Preview outfit images">
        {/* Slot 0 — sharp */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EFE6]"
        >
          <Image
            src={teaserUrl}
            alt="Teaser outfit preview"
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute top-2 left-2 bg-[#1A1410]/70 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            Preview
          </div>
          {/* Subtle shimmer on the free card */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 pointer-events-none" />
        </motion.div>

        {/* Slots 1–3 — blurred + locked */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EFE6] cursor-pointer group"
            onClick={onUnlock}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
            aria-label="Locked outfit — click to unlock"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Blurred base */}
            <Image
              src={teaserUrl}
              alt=""
              aria-hidden="true"
              fill
              className="object-cover"
              style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
              unoptimized
            />
            {/* Dark tint */}
            <div className="absolute inset-0 bg-[#1A1410]/50" />
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <motion.div
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </motion.div>
              <span className="text-xs text-white/80 font-medium">Unlock</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sub-CTA hint */}
      <p className="text-center text-xs text-[#1A1410]/40">
        3 more looks waiting behind the lock
      </p>

      {/* CTA */}
      <motion.button
        onClick={onUnlock}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full py-3.5 rounded-2xl bg-[#b8552e] hover:bg-[#a34828] text-white font-semibold text-sm shadow-[0_4px_20px_rgba(184,85,46,0.35)] flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
        Unlock full capsule — from $5
      </motion.button>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

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

  return (
    <div className="flex flex-col gap-4">
      {/* Countdown bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#1A1410]/70">
          {isExpired ? 'Preview expired' : 'Preview expires in'}
        </p>
        <div
          className={`font-mono text-sm font-bold tabular-nums px-3 py-1 rounded-full ${
            isExpired
              ? 'bg-red-50 text-red-500'
              : remaining < 3_600_000
              ? 'bg-[#b8552e]/10 text-[#b8552e]'
              : 'bg-[#1A1410]/6 text-[#1A1410]'
          }`}
        >
          {formatTimeRemaining(remaining)}
        </div>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-2" aria-label="Preview outfit images">
        {/* Slot 0 — sharp */}
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EFE6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teaserUrl}
            alt="Teaser outfit preview"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 bg-[#1A1410]/70 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            Preview
          </div>
        </div>

        {/* Slots 1–3 — blurred + locked */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F5EFE6] cursor-pointer group"
            onClick={onUnlock}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
            aria-label="Locked outfit — click to unlock"
          >
            {/* Blurred base */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={teaserUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              style={{ filter: 'blur(10px)', transform: 'scale(1.08)' }}
            />
            {/* Dark tint */}
            <div className="absolute inset-0 bg-[#1A1410]/40" />
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
              </div>
              <span className="text-xs text-white/80 font-medium">Unlock</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onUnlock}
        className="w-full py-3.5 rounded-2xl bg-[#b8552e] hover:bg-[#a34828] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
        3 more looks waiting — Unlock now
      </button>
    </div>
  )
}

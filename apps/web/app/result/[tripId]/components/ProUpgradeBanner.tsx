'use client'

import { useState, useEffect } from 'react'

interface ProUpgradeBannerProps {
  onUpgrade: () => void
  backgroundImageUrl?: string
}

export default function ProUpgradeBanner({ onUpgrade, backgroundImageUrl }: ProUpgradeBannerProps) {
  const [seconds, setSeconds] = useState(180) // 3 minutes

  useEffect(() => {
    if (seconds <= 0) return
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(interval)
  }, [seconds])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div className="mt-8 rounded-2xl overflow-hidden relative bg-stone-900 text-white shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900 to-transparent z-10" />
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
          style={{ backgroundImage: `url("${backgroundImageUrl}")` }}
        />
      )}
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-between p-8 md:p-10 gap-8">
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C4613A] text-white text-xs font-bold uppercase tracking-wider">
            Pro Upgrade
          </div>
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-white">Unlock Multi-City Itineraries</h3>
          <p className="text-stone-300 text-lg">
            Planning a bigger trip? Upgrade to Pro to generate capsules for multiple destinations and get unlimited regenerations.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 w-full md:w-auto min-w-[300px]">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Offer Ends In</span>
            <div className="font-mono text-4xl font-bold text-white tracking-wider tabular-nums">
              {mins}:{secs}
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="w-full bg-[#C4613A] hover:bg-[#a04d2b] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Upgrade to Pro</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <p className="text-xs text-stone-400 text-center">30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  )
}

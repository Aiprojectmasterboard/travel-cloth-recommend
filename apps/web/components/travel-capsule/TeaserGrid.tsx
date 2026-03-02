'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface TeaserGridProps {
  imageUrl: string
  expiresAt?: Date
  onUnlock?: () => void
}

function Countdown({ target }: { target: Date }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setTimeLeft(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return <span>{timeLeft}</span>
}

export function TeaserGrid({ imageUrl, expiresAt, onUnlock }: TeaserGridProps) {
  const expires = expiresAt ?? new Date(Date.now() + 24 * 3600000)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {/* Unlocked image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image src={imageUrl} alt="Your style" fill style={{ objectFit: 'cover' }} unoptimized />
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 text-[#C4613A] text-[9px] font-bold uppercase tracking-widest px-2 py-1">Unlocked</span>
          </div>
        </div>
        {/* Blurred images x3 */}
        {[1, 2, 3].map(i => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden">
            <Image src={imageUrl} alt="Locked look" fill style={{ objectFit: 'cover', filter: 'blur(8px)', transform: 'scale(1.1)' }} unoptimized />
            <div className="absolute inset-0 bg-[#1A1410]/40 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 28 }}>lock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Expires bar */}
      <div className="flex items-center justify-between bg-[#F5EFE6] px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9c8c7e]">
          Expires in <Countdown target={expires} />
        </span>
        <button
          onClick={onUnlock}
          className="text-[10px] font-bold uppercase tracking-widest text-[#C4613A] hover:underline"
        >
          Unlock now &rarr;
        </button>
      </div>
      <p className="text-center text-xs text-[#9c8c7e]">3 more looks waiting &mdash; Unlock now</p>
    </div>
  )
}

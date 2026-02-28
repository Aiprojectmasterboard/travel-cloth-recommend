'use client'

import type { ClimateBand } from '../../../../packages/types'

export interface WeatherCardProps {
  city: string
  climateband: ClimateBand
  tempDay: number
  tempNight: number
  rainPct: number
}

const CLIMATE_CONFIG: Record<
  ClimateBand,
  { emoji: string; label: string; bg: string; accent: string }
> = {
  cold: { emoji: '❄️', label: 'Cold', bg: '#E0F2FE', accent: '#0369A1' },
  mild: { emoji: '🌤️', label: 'Mild', bg: '#F0FDF4', accent: '#15803D' },
  warm: { emoji: '☀️', label: 'Warm', bg: '#FFFBEB', accent: '#B45309' },
  hot: { emoji: '🌊', label: 'Hot', bg: '#FFF7ED', accent: '#C2410C' },
  rainy: { emoji: '🌧️', label: 'Rainy', bg: '#EFF6FF', accent: '#1D4ED8' },
}

export default function WeatherCard({
  city,
  climateband,
  tempDay,
  tempNight,
  rainPct,
}: WeatherCardProps) {
  const config = CLIMATE_CONFIG[climateband] ?? CLIMATE_CONFIG.mild
  const clampedRain = Math.max(0, Math.min(100, rainPct))

  return (
    <div
      className="rounded-2xl overflow-hidden border border-[#F5EFE6] shadow-sm"
      style={{ background: config.bg }}
      aria-label={`Weather for ${city}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p
            className="font-serif italic font-bold text-xl leading-tight"
            style={{ color: config.accent, fontFamily: 'Playfair Display, serif' }}
          >
            {city}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: `${config.accent}15`,
              color: config.accent,
            }}
          >
            <span aria-hidden="true">{config.emoji}</span>
            {config.label}
          </div>
        </div>
        <span className="text-4xl" aria-hidden="true">{config.emoji}</span>
      </div>

      {/* Temperature */}
      <div className="px-5 py-3 flex items-end gap-4">
        <div>
          <p className="text-xs text-[#9c8c7e] mb-0.5">Day</p>
          <p
            className="text-4xl font-bold leading-none"
            style={{ color: '#1A1410', fontFamily: 'Playfair Display, serif' }}
          >
            {Math.round(tempDay)}°
          </p>
        </div>
        <div className="mb-1">
          <p className="text-xs text-[#9c8c7e] mb-0.5">Night</p>
          <p className="text-2xl font-semibold text-[#9c8c7e]">{Math.round(tempNight)}°</p>
        </div>
        <span className="mb-1 text-sm text-[#9c8c7e]">C</span>
      </div>

      {/* Rain probability */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#9c8c7e] flex items-center gap-1">
            <span aria-hidden="true">💧</span> Rain probability
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: clampedRain > 50 ? config.accent : '#9c8c7e' }}
          >
            {clampedRain}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: `${config.accent}20` }}
          role="progressbar"
          aria-valuenow={clampedRain}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Rain probability: ${clampedRain}%`}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${clampedRain}%`, background: config.accent }}
          />
        </div>
      </div>
    </div>
  )
}

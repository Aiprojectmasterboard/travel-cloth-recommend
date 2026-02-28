export interface WeatherWidgetProps {
  city: string
  temp: number
  climateband: string
  rainPct: number
}

const CLIMATE_ICONS: Record<string, string> = {
  cold: '❄️',
  mild: '🌤️',
  warm: '☀️',
  hot: '🌊',
  rainy: '🌧️',
}

export default function WeatherWidget({
  city,
  temp,
  climateband,
  rainPct,
}: WeatherWidgetProps) {
  const icon = CLIMATE_ICONS[climateband] ?? '🌤️'
  const clampedRain = Math.max(0, Math.min(100, rainPct))

  return (
    <div className="flex items-center gap-3 bg-[#E0F2FE] rounded-lg px-4 py-3">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-[#1A1410] text-base">{city}</span>
          <span className="text-xs text-[#9c8c7e] capitalize">{climateband}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold text-[#1A1410]">{Math.round(temp)}°C</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-[#9c8c7e]">Rain</span>
              <span className="text-xs text-[#9c8c7e]">{clampedRain}%</span>
            </div>
            <div
              className="h-1.5 rounded-full bg-white/60 overflow-hidden"
              role="progressbar"
              aria-valuenow={clampedRain}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Rain probability ${clampedRain}%`}
            >
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                style={{ width: `${clampedRain}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

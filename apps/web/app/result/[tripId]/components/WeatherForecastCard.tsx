'use client'

interface WeatherForecastCardProps {
  city: string
  dateRange?: string
  high: string
  low: string
  rainPct: string
}

export default function WeatherForecastCard({ city, dateRange, high, low, rainPct }: WeatherForecastCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#ebdacc]">
      <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-[#57534e] mb-4">Weather Forecast</h3>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-3xl font-serif font-bold text-[#292524]">{city}</h4>
          {dateRange && <p className="text-sm text-[#57534e]">{dateRange}</p>}
        </div>
        <span className="material-symbols-outlined text-4xl text-[#C4613A]">partly_cloudy_day</span>
      </div>
      <div className="flex justify-between items-center bg-[#FDF8F3] rounded-xl p-4">
        <div className="text-center">
          <span className="block text-xs font-bold uppercase text-[#57534e] mb-1">Avg High</span>
          <span className="text-xl font-bold">{high}</span>
        </div>
        <div className="h-8 w-px bg-stone-300" />
        <div className="text-center">
          <span className="block text-xs font-bold uppercase text-[#57534e] mb-1">Avg Low</span>
          <span className="text-xl font-bold">{low}</span>
        </div>
        <div className="h-8 w-px bg-stone-300" />
        <div className="text-center">
          <span className="block text-xs font-bold uppercase text-[#57534e] mb-1">Rain</span>
          <span className="text-xl font-bold">{rainPct}</span>
        </div>
      </div>
    </div>
  )
}

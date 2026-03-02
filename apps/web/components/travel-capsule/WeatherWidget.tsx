'use client'
interface WeatherWidgetProps {
  city: string
  temp: string
  condition: string
  high: string
  low: string
  rain?: string
  wind?: string
}
export function WeatherWidget({ city, temp, condition, high, low, rain, wind }: WeatherWidgetProps) {
  return (
    <div className="bg-[#E0F2FE] border border-[#BAE6FD] p-5 space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0369A1] mb-1">{city}</p>
          <p className="font-playfair text-4xl font-bold text-[#1A1410]">{temp}</p>
          <p className="text-xs text-[#0369A1] mt-1">{condition}</p>
        </div>
        <div className="text-right text-xs text-[#0369A1]">
          <p>H: {high}</p>
          <p>L: {low}</p>
        </div>
      </div>
      {(rain || wind) && (
        <div className="flex gap-4 pt-2 border-t border-[#BAE6FD]">
          {rain && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0369A1]" style={{ fontSize: 14 }}>umbrella</span>
              <span className="text-xs text-[#0369A1]">{rain}</span>
            </div>
          )}
          {wind && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#0369A1]" style={{ fontSize: 14 }}>air</span>
              <span className="text-xs text-[#0369A1]">{wind}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

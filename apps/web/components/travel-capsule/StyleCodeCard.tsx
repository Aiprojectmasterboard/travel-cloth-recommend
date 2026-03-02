'use client'
interface StyleCodeCardProps {
  city: string
  moodName: string
  description: string
  tags?: string[]
  weather?: { high: string; low: string; rain: string }
}
export function StyleCodeCard({ city, moodName, description, tags = [], weather }: StyleCodeCardProps) {
  return (
    <div className="bg-white border border-[#E8DDD4] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 18 }}>psychology</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9c8c7e]">Style Code</span>
      </div>
      <h3 className="font-playfair text-lg font-bold text-[#1A1410]">{city} &mdash; {moodName}</h3>
      <p className="text-sm text-[#57534e] leading-relaxed">{description}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(t => (
            <span key={t} className="px-3 py-1 bg-[#F5EFE6] text-[#9c8c7e] text-xs font-medium rounded-full">{t}</span>
          ))}
        </div>
      )}
      {weather && (
        <div className="flex border border-[#E8DDD4] divide-x divide-[#E8DDD4]">
          {([['High', weather.high], ['Low', weather.low], ['Rain', weather.rain]] as [string, string][]).map(([label, val]) => (
            <div key={label} className="flex-1 flex flex-col items-center py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9c8c7e] mb-1">{label}</span>
              <span className="text-base font-bold text-[#1A1410]">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
interface TripUsageBarProps {
  used: number
  total: number
  renewalDate?: string
}
export function TripUsageBar({ used, total, renewalDate }: TripUsageBarProps) {
  const remaining = total - used
  const pct = Math.round((used / total) * 100)
  return (
    <div className="bg-white border border-[#E8DDD4] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9c8c7e]">Annual Trips</p>
          <p className="font-playfair text-2xl font-bold text-[#1A1410]">
            {remaining} <span className="text-[#9c8c7e] text-sm font-normal">remaining</span>
          </p>
        </div>
        <p className="text-xs text-[#9c8c7e]">{used}/{total} used</p>
      </div>
      <div className="h-2 bg-[#F5EFE6] rounded-full overflow-hidden">
        <div className="h-full bg-[#C4613A] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      {renewalDate && <p className="text-[10px] text-[#9c8c7e]">Renews {renewalDate}</p>}
    </div>
  )
}

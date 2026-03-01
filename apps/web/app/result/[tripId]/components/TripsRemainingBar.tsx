'use client'

interface TripsRemainingBarProps {
  remaining: number
  total: number
  renewalDate?: string
}

export default function TripsRemainingBar({
  remaining,
  total,
  renewalDate,
}: TripsRemainingBarProps) {
  const used = total - remaining
  const pct = total > 0 ? Math.round((used / total) * 100) : 0

  return (
    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
      <div className="flex items-center justify-between w-full md:w-64 mb-1">
        <span className="text-sm font-bold text-[#1A1410]">
          {remaining} of {total} trips remaining
        </span>
        {renewalDate && (
          <span className="text-xs text-[#8C8680]">Renews {renewalDate}</span>
        )}
      </div>
      <div className="w-full md:w-64 h-1.5 bg-[#F5EFE6] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C8A96E] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

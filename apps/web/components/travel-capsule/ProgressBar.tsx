'use client'
interface ProgressBarProps {
  current: number
  total: number
  className?: string
}
export function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-1 bg-[#E8DDD4] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#C4613A] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#9c8c7e] shrink-0">{current}/{total}</span>
    </div>
  )
}

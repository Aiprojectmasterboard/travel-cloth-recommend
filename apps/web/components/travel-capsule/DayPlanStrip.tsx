'use client'
import { useState } from 'react'

interface DayPlan {
  day: number
  label: string
  city?: string
  outfit?: string
}
interface DayPlanStripProps {
  days: DayPlan[]
}
export function DayPlanStrip({ days }: DayPlanStripProps) {
  const [selected, setSelected] = useState(0)
  const active = days[selected]
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {days.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setSelected(i)}
            className={`shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 border transition-colors ${i === selected ? 'border-[#C4613A] bg-[#C4613A] text-white' : 'border-[#E8DDD4] bg-white text-[#1A1410] hover:border-[#C4613A]/50'}`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${i === selected ? 'text-white/70' : 'text-[#9c8c7e]'}`}>Day {d.day}</span>
            <span className={`text-xs font-semibold whitespace-nowrap ${i === selected ? 'text-white' : 'text-[#1A1410]'}`}>{d.label}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="bg-white border border-[#E8DDD4] p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C4613A] mb-1">{active.city}</p>
          <p className="text-sm text-[#57534e] leading-relaxed">{active.outfit ?? active.label}</p>
        </div>
      )}
    </div>
  )
}

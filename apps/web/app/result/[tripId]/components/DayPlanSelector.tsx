'use client'

interface DayPlanSelectorProps {
  days: Array<{ label: string; subLabel: string }>
  activeDay: number
  onChange: (index: number) => void
  dateRange?: string
}

export default function DayPlanSelector({ days, activeDay, onChange, dateRange }: DayPlanSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#ebdacc]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-bold text-[#292524]">Your {days.length}-Day Plan</h3>
        {dateRange && <span className="text-sm text-[#57534e]">{dateRange}</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`rounded-lg p-3 text-center cursor-pointer transition-all ${
              i === activeDay
                ? 'bg-[#C4613A]/5 border border-[#C4613A]/20 ring-2 ring-[#C4613A] ring-offset-2 ring-offset-[#FDF8F3]'
                : 'bg-stone-50 border border-stone-100 hover:bg-stone-100'
            }`}
          >
            <span className={`block text-xs font-bold uppercase mb-1 ${i === activeDay ? 'text-[#C4613A]' : 'text-[#57534e]'}`}>
              {day.label}
            </span>
            <span className="block text-sm font-bold">{day.subLabel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

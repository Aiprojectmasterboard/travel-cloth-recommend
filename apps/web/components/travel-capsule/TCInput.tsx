'use client'
interface TCInputProps {
  label: string
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  type?: string
  unit?: string
  className?: string
}
export function TCInput({ label, placeholder, value, onChange, type = 'text', unit, className = '' }: TCInputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-widest text-[#57534e]">{label}</label>
      <div className="relative flex items-center">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full border border-[#E8DDD4] bg-white px-4 py-3 text-sm text-[#1A1410] placeholder-[#9c8c7e] focus:outline-none focus:border-[#C4613A] transition-colors"
        />
        {unit && <span className="absolute right-4 text-xs text-[#9c8c7e] pointer-events-none">{unit}</span>}
      </div>
    </div>
  )
}

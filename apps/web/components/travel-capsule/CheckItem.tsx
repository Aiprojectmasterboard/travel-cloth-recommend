'use client'
interface CheckItemProps {
  children: React.ReactNode
  checked?: boolean
  className?: string
}
export function CheckItem({ children, checked = true, className = '' }: CheckItemProps) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <span className={`mt-0.5 material-symbols-outlined shrink-0 ${checked ? 'text-[#C4613A]' : 'text-[#9c8c7e]'}`} style={{ fontSize: 16 }}>
        {checked ? 'check_circle' : 'radio_button_unchecked'}
      </span>
      <span className={`text-sm leading-relaxed ${checked ? 'text-[#1A1410]' : 'text-[#9c8c7e]'}`}>{children}</span>
    </div>
  )
}

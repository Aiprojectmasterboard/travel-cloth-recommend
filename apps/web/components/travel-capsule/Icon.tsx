'use client'
interface IconProps {
  name: string
  className?: string
  size?: number
}
export function Icon({ name, className = '', size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

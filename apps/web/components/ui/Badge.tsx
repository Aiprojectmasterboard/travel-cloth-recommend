import React from 'react'

export type BadgeVariant = 'default' | 'primary' | 'gold'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-[#F5EFE6] text-[#1A1410]',
  primary: 'bg-[#b8552e]/10 text-[#b8552e]',
  gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

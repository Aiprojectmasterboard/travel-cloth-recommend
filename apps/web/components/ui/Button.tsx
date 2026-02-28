'use client'

import React from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'secondary'
export type ButtonSize = 'sm' | 'md' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#b8552e] hover:bg-[#a34828] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-[#b8552e]',
  ghost:
    'bg-transparent border border-white/30 hover:border-white text-white focus-visible:ring-white',
  secondary:
    'bg-[#F5EFE6] hover:bg-[#ece5d8] text-[#1A1410] border border-[#F5EFE6] focus-visible:ring-[#1A1410]',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      aria-busy={loading}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

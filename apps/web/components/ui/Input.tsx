import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#1A1410] tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`
          border rounded-lg px-4 py-3 bg-white text-[#1A1410] text-base
          focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e]
          placeholder:text-[#9c8c7e] disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : 'border-[#F5EFE6]'}
          ${className}
        `}
        aria-describedby={
          error
            ? `${inputId}-error`
            : hint
            ? `${inputId}-hint`
            : undefined
        }
        aria-invalid={error ? 'true' : undefined}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[#9c8c7e]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

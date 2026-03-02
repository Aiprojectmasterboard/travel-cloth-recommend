'use client'
import Link from 'next/link'
import { type ReactNode } from 'react'

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

interface BtnProps {
  children: ReactNode
  size?: Size
  onClick?: () => void
  href?: string
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

export function BtnPrimary({ children, size = 'md', onClick, href, disabled, className = '', type = 'button' }: BtnProps) {
  const cls = `inline-flex items-center justify-center gap-2 bg-[#C4613A] text-white font-bold tracking-wide uppercase hover:bg-[#A84A25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

export function BtnSecondary({ children, size = 'md', onClick, href, disabled, className = '', type = 'button' }: BtnProps) {
  const cls = `inline-flex items-center justify-center gap-2 border border-[#C4613A] text-[#C4613A] font-bold tracking-wide uppercase hover:bg-[#C4613A] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

export function BtnDark({ children, size = 'md', onClick, href, disabled, className = '', type = 'button' }: BtnProps) {
  const cls = `inline-flex items-center justify-center gap-2 bg-[#1A1410] text-[#FDF8F3] font-bold tracking-wide rounded-lg hover:bg-[#2c221c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>
}

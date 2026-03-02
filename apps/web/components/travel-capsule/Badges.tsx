'use client'
import { type ReactNode } from 'react'

export function PlanBadge({ plan }: { plan: 'Standard' | 'Pro' | 'Annual' }) {
  const styles: Record<string, string> = {
    Standard: 'bg-[#F5EFE6] text-[#9c8c7e]',
    Pro: 'bg-[#C4613A] text-white',
    Annual: 'bg-gradient-to-r from-[#D4AF37] to-[#C8A96E] text-[#1A1410]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${styles[plan] ?? styles.Standard}`}>
      {plan === 'Annual' && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>workspace_premium</span>}
      {plan}
    </span>
  )
}

export function AnnualBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#C8A96E] text-[#1A1410] text-[10px] font-bold tracking-widest uppercase rounded-full">
      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>workspace_premium</span>
      Annual Member
    </span>
  )
}

export function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex px-3 py-1 bg-[#F5EFE6] text-[#57534e] text-xs font-medium rounded-full border border-[#E8DDD4]">
      {children}
    </span>
  )
}

export function SizeChip({ size }: { size: string }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-white border border-[#E8DDD4] text-[#1A1410] text-xs font-bold rounded-full">
      {size}
    </span>
  )
}

export function AiGeneratedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1410]/80 text-white text-[9px] font-bold tracking-widest uppercase rounded-sm backdrop-blur-sm">
      <span className="material-symbols-outlined" style={{ fontSize: 10 }}>auto_awesome</span>
      AI
    </span>
  )
}

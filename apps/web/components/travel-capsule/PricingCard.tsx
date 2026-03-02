'use client'
import { type ReactNode } from 'react'

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingCardProps {
  plan: 'Standard' | 'Pro' | 'Annual'
  price: string
  period?: string
  description?: string
  features: PricingFeature[]
  ctaLabel: string
  onSelect?: () => void
  highlighted?: boolean
  badge?: string
}

export function PricingCard({
  plan,
  price,
  period,
  description,
  features,
  ctaLabel,
  onSelect,
  highlighted = false,
  badge,
}: PricingCardProps) {
  const isPro = plan === 'Pro'
  const isAnnual = plan === 'Annual'

  return (
    <div
      className={`relative flex flex-col border p-6 transition-shadow ${
        highlighted
          ? 'border-[#C4613A] shadow-lg'
          : 'border-[#E8DDD4] hover:shadow-md'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#C4613A] text-white text-[10px] font-bold tracking-widest uppercase">
            {badge}
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="flex items-center gap-2 mb-4">
        {isAnnual && (
          <span className="material-symbols-outlined text-[#D4AF37]" style={{ fontSize: 18 }}>
            workspace_premium
          </span>
        )}
        <span
          className={`text-[10px] font-bold tracking-widest uppercase ${
            isPro || highlighted ? 'text-[#C4613A]' : isAnnual ? 'text-[#D4AF37]' : 'text-[#9c8c7e]'
          }`}
        >
          {plan}
        </span>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-end gap-1">
          <span className="font-playfair text-4xl font-bold text-[#1A1410]">{price}</span>
          {period && (
            <span className="text-sm text-[#9c8c7e] mb-1">{period}</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-[#9c8c7e] mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className={`mt-0.5 material-symbols-outlined shrink-0 ${
                f.included ? 'text-[#C4613A]' : 'text-[#E8DDD4]'
              }`}
              style={{ fontSize: 16 }}
            >
              {f.included ? 'check_circle' : 'cancel'}
            </span>
            <span
              className={`text-sm leading-relaxed ${
                f.included ? 'text-[#1A1410]' : 'text-[#9c8c7e] line-through'
              }`}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={`w-full py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
          highlighted
            ? 'bg-[#C4613A] text-white hover:bg-[#A84A25]'
            : isAnnual
            ? 'bg-gradient-to-r from-[#D4AF37] to-[#C8A96E] text-[#1A1410] hover:opacity-90'
            : 'border border-[#C4613A] text-[#C4613A] hover:bg-[#C4613A] hover:text-white'
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  )
}

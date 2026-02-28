'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { createCheckout } from '@/lib/api'
import type { PlanType } from '../../../../packages/types'

const PLANS: Array<{
  id: PlanType
  name: string
  price: string
  period: string
  badge: string | null
  features: string[]
  cta: string
  highlight: boolean
}> = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$5',
    period: 'one-time',
    badge: null,
    features: [
      '1 sharp image + 3 blurred unlocked',
      'Capsule wardrobe list',
      'Day-by-day outfit plan',
    ],
    cta: 'Get Started — $5',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: 'one-time',
    badge: 'Most Popular',
    features: [
      '4–6 real images per city',
      'High-resolution output',
      '1 free regeneration',
      'Capsule wardrobe list',
      'Day-by-day outfit plan',
    ],
    cta: 'Go Pro — $12',
    highlight: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$29',
    period: '/ year',
    badge: 'Best Value',
    features: [
      'All Pro features included',
      '12 trips per year',
      'Priority generation queue',
      'Early city access',
    ],
    cta: 'Go Annual — $29/yr',
    highlight: false,
  },
]

export interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
}

export default function PaywallModal({ isOpen, onClose, tripId }: PaywallModalProps) {
  const [loading, setLoading] = useState<PlanType | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSelect(plan: PlanType) {
    setLoading(plan)
    setError(null)
    try {
      const { checkout_url } = await createCheckout(tripId, plan)
      window.location.href = checkout_url
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your plan"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[#FDF8F3] rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1410]/8 flex items-center justify-center text-[#1A1410]/50 hover:bg-[#1A1410]/15 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center border-b border-[#F5EFE6]">
          <p className="text-xs uppercase tracking-widest text-[#b8552e]/70 font-medium mb-2">
            Unlock Your Style
          </p>
          <h2
            className="text-2xl font-bold text-[#1A1410] mb-1"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Choose your plan
          </h2>
          <p className="text-sm text-[#9c8c7e]">One-time payment. No subscription required.</p>
        </div>

        {/* Plan cards */}
        <div className="p-5 grid sm:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-4 flex flex-col ${
                plan.highlight
                  ? 'bg-[#1A1410] text-white border-2 border-[#1A1410]'
                  : 'bg-white border border-[#F5EFE6]'
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                    plan.highlight ? 'bg-[#D4AF37] text-[#1A1410]' : 'bg-[#b8552e]/10 text-[#b8552e]'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-3">
                <p
                  className={`text-xs uppercase tracking-wider font-medium mb-1 ${
                    plan.highlight ? 'text-white/60' : 'text-[#9c8c7e]'
                  }`}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-[#1A1410]'}`}
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {plan.price}
                  </span>
                  <span className={`text-xs ${plan.highlight ? 'text-white/50' : 'text-[#9c8c7e]'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="flex-1 space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? 'text-[#D4AF37]' : 'text-[#b8552e]'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span
                      className={`text-xs leading-relaxed ${
                        plan.highlight ? 'text-white/80' : 'text-[#1A1410]/70'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? 'primary' : 'secondary'}
                size="sm"
                loading={loading === plan.id}
                disabled={!!loading}
                onClick={() => handleSelect(plan.id)}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center pb-3 px-5" role="alert">
            {error}
          </p>
        )}

        {/* Trust signals */}
        <div className="px-6 pb-5 pt-1 flex items-center justify-center gap-3 flex-wrap text-xs text-[#9c8c7e]">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure checkout
          </span>
          <span aria-hidden="true">·</span>
          <span>24h refund guarantee</span>
          <span aria-hidden="true">·</span>
          <span>No subscription</span>
        </div>
      </div>
    </div>
  )
}

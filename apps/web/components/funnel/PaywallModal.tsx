'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { createCheckout } from '@/lib/api'
import type { PlanType } from '../../../../packages/types'

const PLANS: Array<{
  id: PlanType
  name: string
  price: string
  period: string
  badge: string | null
  savingLabel: string | null
  features: Array<{ icon: string; text: string; strong?: boolean }>
  cta: string
  highlight: boolean
}> = [
  {
    id: 'standard',
    name: 'Standard',
    price: '$5',
    period: '/trip',
    badge: null,
    savingLabel: null,
    features: [
      { icon: 'check_circle', text: 'Weather & Vibe Analysis' },
      { icon: 'check_circle', text: 'City Vibe Card' },
      { icon: 'check_circle', text: '4 AI-Generated Outfits' },
      { icon: 'check_circle', text: '10-Item Capsule List' },
      { icon: 'check_circle', text: 'Day-by-Day Itinerary' },
    ],
    cta: 'Select Standard',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/trip',
    badge: 'Most Popular',
    savingLabel: null,
    features: [
      { icon: 'auto_awesome', text: 'Everything in Standard', strong: true },
      { icon: 'check_circle', text: 'Hero images for ALL cities' },
      { icon: 'check_circle', text: 'Ultra High-Res Visuals' },
      { icon: 'check_circle', text: '1 Free Style Regeneration' },
      { icon: 'check_circle', text: 'Multi-city coordination' },
    ],
    cta: 'Unlock Pro Results',
    highlight: true,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: '$29',
    period: '/year',
    badge: null,
    savingLabel: 'SAVE $115/YEAR',
    features: [
      { icon: 'stars', text: 'Full Pro Experience', strong: true },
      { icon: 'check_circle', text: 'Up to 12 trips per year' },
      { icon: 'check_circle', text: 'Priority AI processing' },
      { icon: 'check_circle', text: 'VIP concierge support' },
    ],
    cta: 'Go Annual',
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
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose your plan"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-2xl bg-[#FDF8F3] rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1A1410]/[0.08] flex items-center justify-center text-[#1A1410]/50 hover:bg-[#1A1410]/[0.15] transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Price anchor bar — the most important conversion element */}
            <div className="bg-[#1A1410] px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-[#9c8c7e] text-xs line-through">Personal stylist: $200+</span>
              <span className="text-white/30 text-xs">→</span>
              <span className="text-[#D4AF37] text-xs font-bold tracking-wide">
                Travel Capsule AI: from <strong>$5</strong>
              </span>
            </div>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-[#F5EFE6]">
              <p className="text-xs uppercase tracking-widest text-[#b8552e]/70 font-medium mb-2">
                Unlock Your Style
              </p>
              <h2
                className="text-2xl font-bold text-[#1A1410] mb-1"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Choose your plan
              </h2>
              <p className="text-sm text-[#9c8c7e]">Select the plan that best fits your travel style.</p>
            </div>

            {/* Plan cards */}
            <div className="p-5 grid sm:grid-cols-3 gap-3">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
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
                    {plan.savingLabel && (
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#b8552e]">
                        {plan.savingLabel}
                      </div>
                    )}
                  </div>

                  <ul className="flex-1 space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2">
                        <span
                          className={`material-symbols-outlined text-sm mt-0.5 flex-shrink-0 ${
                            plan.highlight ? 'text-white' : 'text-[#b8552e]'
                          }`}
                        >
                          {f.icon}
                        </span>
                        {f.strong ? (
                          <strong
                            className={`text-xs leading-relaxed ${
                              plan.highlight ? 'text-white' : 'text-[#1A1410]'
                            }`}
                          >
                            {f.text}
                          </strong>
                        ) : (
                          <span
                            className={`text-xs leading-relaxed ${
                              plan.highlight ? 'text-white/80' : 'text-[#1A1410]/70'
                            }`}
                          >
                            {f.text}
                          </span>
                        )}
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
                </motion.div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center pb-3 px-5" role="alert">
                {error}
              </p>
            )}

            {/* Trust signals */}
            <div className="px-6 pb-2 pt-1 flex items-center justify-center gap-3 flex-wrap text-xs text-[#9c8c7e]">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 0 00-8 0v4h8z" />
                </svg>
                Secure checkout via Polar
              </span>
              <span aria-hidden="true">·</span>
              <span>24h refund guarantee</span>
              <span aria-hidden="true">·</span>
              <span>Standard &amp; Pro: one-time charge</span>
            </div>
            {/* Annual auto-renewal disclosure — required by Polar ToS */}
            <p className="px-6 pb-5 text-center text-[10px] text-[#9c8c7e]/60 leading-relaxed">
              Annual plan automatically renews at $29/year. Cancel at any time before renewal through your account settings. Standard and Pro plans are one-time payments with no auto-renewal.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

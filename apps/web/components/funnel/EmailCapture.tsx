'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { submitEmail } from '@/lib/api'

export interface EmailCaptureProps {
  tripId: string
}

export default function EmailCapture({ tripId }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | undefined>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('loading')
    setErrorMsg(undefined)

    try {
      await submitEmail(tripId, trimmed)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Could not send. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-[#FDF8F3] border border-[#F5EFE6] px-6 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#b8552e]/10 flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-[#b8552e]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-[#1A1410] mb-1">Mood card sent!</p>
        <p className="text-sm text-[#9c8c7e]">Check your inbox for your personalized vibe card.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[#1A1410] text-white overflow-hidden">
      <div className="px-5 pt-6 pb-5">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-2 font-medium">
          Free Mood Card
        </p>
        <h3
          className="text-lg font-bold mb-1.5"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Get your vibe card by email
        </h3>
        <p className="text-sm text-white/55 mb-5">
          We&apos;ll send you a beautiful mood card for your trip — free, no spam.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/35 text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-colors"
          />
          {errorMsg && (
            <p className="text-xs text-red-400" role="alert">
              {errorMsg}
            </p>
          )}
          <Button type="submit" loading={status === 'loading'} className="w-full">
            Send my mood card
          </Button>
        </form>

        <p className="text-xs text-white/25 mt-3 text-center">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}

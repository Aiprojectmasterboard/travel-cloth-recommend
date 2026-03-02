'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/travel-capsule'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'verifying' | 'confirmed' | 'failed'
type PlanKey = 'standard' | 'pro' | 'annual'

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ??
  'https://travel-capsule-worker.netson94.workers.dev'

const POLL_INTERVAL_MS = 500
const POLL_TIMEOUT_MS = 30_000

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function CheckoutSuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('verifying')

  const plan = (searchParams.get('plan') ?? 'standard') as PlanKey
  const tripId = searchParams.get('tripId') ?? ''

  // Keep interval/timeout refs so we can clear them on unmount
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Guard: no tripId — nothing to poll, fail immediately
    if (!tripId) {
      setStatus('failed')
      return
    }

    let done = false

    async function checkResult(): Promise<void> {
      try {
        const res = await fetch(`${WORKER_URL}/api/result/${tripId}`)
        if (!res.ok) {
          // 402 = not paid yet, 404 = unknown trip — keep polling
          // Other errors are terminal
          if (res.status !== 402 && res.status !== 404) {
            stopPolling()
            setStatus('failed')
          }
          return
        }
        const data = (await res.json()) as { status?: string }
        if (data.status === 'completed') {
          stopPolling()
          if (!done) {
            done = true
            setStatus('confirmed')
            redirectRef.current = setTimeout(() => {
              router.replace(`/result/${tripId}?plan=${plan}`)
            }, 2500)
          }
        } else if (data.status === 'failed') {
          stopPolling()
          setStatus('failed')
        }
        // pending / processing: keep polling
      } catch {
        // Network error — keep polling until timeout
      }
    }

    function stopPolling(): void {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Start polling
    intervalRef.current = setInterval(checkResult, POLL_INTERVAL_MS)

    // Hard timeout — give up after 30 seconds
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      if (!done) {
        setStatus('failed')
      }
    }, POLL_TIMEOUT_MS)

    // Run one check immediately so we don't wait 500ms for the first result
    checkResult()

    return () => {
      stopPolling()
      if (redirectRef.current) clearTimeout(redirectRef.current)
    }
  }, [tripId, plan, router])

  const planLabel =
    plan === 'annual'
      ? 'Annual membership'
      : plan === 'pro'
        ? 'Pro capsule'
        : 'Standard capsule'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: '#FDF8F3' }}
    >
      <div className="text-center max-w-[480px] w-full">

        {/* ── VERIFYING ── */}
        {status === 'verifying' && (
          <>
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: 'rgba(196,97,58,0.10)' }}
            >
              <Icon name="hourglass_top" size={28} className="text-[#C4613A]" />
            </div>
            <h1
              className="mt-6 text-[28px] text-[#292524]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Verifying Payment...
            </h1>
            <p
              className="mt-3 text-[15px] text-[#57534e]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 300, lineHeight: 1.6 }}
            >
              Confirming your checkout. We&apos;ll redirect you as soon as your
              capsule is ready — this only takes a moment.
            </p>
            {/* Indeterminate progress bar */}
            <div
              className="mt-8 w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#EFE8DF' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: '#C4613A',
                  animation: 'indeterminate 1.4s ease-in-out infinite',
                  width: '40%',
                }}
              />
            </div>
          </>
        )}

        {/* ── CONFIRMED ── */}
        {status === 'confirmed' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="check_circle" size={32} className="text-green-600" />
            </div>
            <h1
              className="mt-6 text-[28px] text-[#292524]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Payment Confirmed!
            </h1>
            <p
              className="mt-3 text-[15px] text-[#57534e]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 300, lineHeight: 1.6 }}
            >
              Your {planLabel} is ready. Redirecting to your capsule&hellip;
            </p>
            {/* Determinate fill bar */}
            <div
              className="mt-8 w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: '#EFE8DF' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: '#C4613A',
                  animation: 'fillBar 2.5s ease-in-out forwards',
                }}
              />
            </div>
          </>
        )}

        {/* ── FAILED ── */}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="error" size={32} className="text-red-500" />
            </div>
            <h1
              className="mt-6 text-[28px] text-[#292524]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Something went wrong
            </h1>
            <p
              className="mt-3 text-[15px] text-[#57534e]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 300, lineHeight: 1.6 }}
            >
              We couldn&apos;t verify your payment. Please try again or contact
              support if the issue persists.
            </p>
            <button
              onClick={() => router.push('/#pricing')}
              className="mt-8 h-[48px] px-8 text-white text-[13px] uppercase tracking-[0.08em] cursor-pointer transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                backgroundColor: '#C4613A',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A84A25' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C4613A' }}
            >
              Back to Pricing
            </button>
          </>
        )}

      </div>

      <style>{`
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}

// ─── Page export — wraps inner in Suspense (required for useSearchParams) ─────

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: '#FDF8F3' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: 'rgba(196,97,58,0.10)' }}
          >
            <span
              className="material-symbols-outlined text-[#C4613A]"
              style={{ fontSize: 28 }}
              aria-hidden="true"
            >
              hourglass_top
            </span>
          </div>
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  )
}

'use client'

export const runtime = 'edge'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// ─── Google SVG ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Apple SVG ────────────────────────────────────────────────────────────────

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" aria-hidden="true" focusable="false">
      <path
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-164-39.3c-76 0-103.7 40.8-165.9 40.8s-105.3-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 65 0 120 43.1 161.9 43.1 40 0 101.8-46.4 176.3-46.4 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
        fill="#ffffff"
      />
    </svg>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#9c8c7e] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] placeholder:text-[#9c8c7e]/60 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm disabled:opacity-50"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingApple, setLoadingApple] = useState(false)

  function clearMessages() {
    setError(null)
    setMessage(null)
  }

  // ─── OAuth helpers ────────────────────────────────────────────────────────

  async function signInWithGoogle() {
    setLoadingGoogle(true)
    clearMessages()
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) setError(oauthError.message)
    } catch {
      setError('Could not connect to Google. Please try again.')
    } finally {
      setLoadingGoogle(false)
    }
  }

  async function signInWithApple() {
    setLoadingApple(true)
    clearMessages()
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) setError(oauthError.message)
    } catch {
      setError('Could not connect to Apple. Please try again.')
    } finally {
      setLoadingApple(false)
    }
  }

  // ─── Email auth ───────────────────────────────────────────────────────────

  async function signInWithEmail() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoadingEmail(true)
    clearMessages()
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/')
      }
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setLoadingEmail(false)
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoadingEmail(true)
    clearMessages()
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() || undefined },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } catch {
      setError('Sign up failed. Please try again.')
    } finally {
      setLoadingEmail(false)
    }
  }

  function handleSubmit() {
    if (mode === 'signin') {
      signInWithEmail()
    } else {
      signUpWithEmail()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  const anyLoading = loadingEmail || loadingGoogle || loadingApple

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FDF8F3]/95 backdrop-blur-sm border-b border-[#F5EFE6] px-6 py-4 flex items-center justify-between">
        <a
          href="/"
          className="font-bold text-[#1A1410] text-lg tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Travel <span className="italic text-[#b8552e]">Capsule</span> AI
        </a>
        <a
          href="/"
          className="text-xs text-[#9c8c7e] hover:text-[#1A1410] transition-colors"
        >
          ← Back to home
        </a>
      </header>

      {/* ─── Main ───────────────────────────────────────────────────────────── */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-sm mx-auto mt-8">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#F5EFE6] p-8 shadow-sm">
            {/* Heading */}
            <h1
              className="text-3xl font-bold italic text-[#1A1410] mb-1"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p className="text-sm text-[#9c8c7e] mb-7">
              {mode === 'signin'
                ? 'Sign in to access your travel capsule'
                : 'Join to start planning your travel wardrobe'}
            </p>

            {/* ─── Social buttons ─────────────────────────────────────────── */}
            <div className="space-y-3 mb-6">
              {/* Google */}
              <button
                onClick={signInWithGoogle}
                disabled={anyLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#b8552e] text-white text-sm font-semibold hover:bg-[#a34828] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Continue with Google"
              >
                {loadingGoogle ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              {/* Apple */}
              <button
                onClick={signInWithApple}
                disabled={anyLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1A1410] text-white text-sm font-semibold hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Continue with Apple"
              >
                {loadingApple ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <AppleIcon />
                )}
                Continue with Apple
              </button>
            </div>

            {/* ─── Divider ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#F5EFE6]" />
              <span className="text-xs text-[#9c8c7e] whitespace-nowrap">— or continue with email —</span>
              <div className="flex-1 h-px bg-[#F5EFE6]" />
            </div>

            {/* ─── Email form ──────────────────────────────────────────────── */}
            <div className="space-y-4" onKeyDown={handleKeyDown}>
              {/* Name (sign-up only) */}
              {mode === 'signup' && (
                <Field
                  label="Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={loadingEmail}
                />
              )}

              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loadingEmail}
              />

              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                disabled={loadingEmail}
              />
            </div>

            {/* ─── Error / success messages ────────────────────────────────── */}
            {error && (
              <p className="mt-4 text-sm text-red-500 leading-snug" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="mt-4 text-sm text-[#9c8c7e] leading-snug" role="status">
                {message}
              </p>
            )}

            {/* ─── Submit button ───────────────────────────────────────────── */}
            <button
              onClick={handleSubmit}
              disabled={anyLoading}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#b8552e] text-white text-sm font-semibold hover:bg-[#a34828] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={mode === 'signin' ? 'Sign in' : 'Sign up'}
            >
              {loadingEmail ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>

            {/* ─── Mode toggle ─────────────────────────────────────────────── */}
            <p className="mt-5 text-center text-sm text-[#9c8c7e]">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); clearMessages() }}
                    className="font-semibold text-[#b8552e] hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('signin'); clearMessages() }}
                    className="font-semibold text-[#b8552e] hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* ─── Trust badges ───────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-xs text-[#9c8c7e]">
            By signing in, you agree to our{' '}
            <a href="#" className="underline underline-offset-2 hover:text-[#1A1410]">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-2 hover:text-[#1A1410]">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  )
}

'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// ─── In-app browser detection ─────────────────────────────────────────────────

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // Known in-app browsers
  if (/FBAN|FBAV|Instagram|Twitter|Snapchat|Line|NAVER|Kakao|WeChat|MicroMessenger/.test(ua)) return true
  // iOS WebView: has AppleWebKit but NOT Safari in UA
  if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true
  // Android WebView
  if (/Android/.test(ua) && /wv/.test(ua)) return true
  return false
}

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

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)

  useEffect(() => {
    setInAppBrowser(isInAppBrowser())
  }, [])

  function clearMessages() {
    setError(null)
    setMessage(null)
  }

  // ─── OAuth helpers ────────────────────────────────────────────────────────

  async function signInWithGoogle() {
    setLoadingGoogle(true)
    clearMessages()
    try {
      // Use the current origin so the callback stays on the same domain,
      // which is critical for cookie-based session persistence on mobile.
      const redirectTo = `${window.location.origin}/auth/callback`
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
      } else if (data?.url) {
        // Explicitly navigate to the OAuth URL for better mobile compatibility
        window.location.href = data.url
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect to Google. Please try again.')
    } finally {
      setLoadingGoogle(false)
    }
  }

  // ─── Forgot password ────────────────────────────────────────────────────

  async function resetPassword() {
    if (!email) { setError('Please enter your email address.'); return }
    setLoadingEmail(true)
    clearMessages()
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (resetError) {
        setError(resetError.message)
      } else {
        setMessage('reset-sent')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email. Please try again.')
    } finally {
      setLoadingEmail(false)
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
        router.push('/trip')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed. Please try again.')
    } finally {
      setLoadingEmail(false)
    }
  }

  async function signUpWithEmail() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoadingEmail(true)
    clearMessages()
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() || undefined },
        },
      })
      if (signUpError) {
        const msg = signUpError.message.toLowerCase()
        // 422: email already registered (Supabase uses this for duplicate signups)
        if (
          signUpError.status === 422 ||
          msg.includes('already registered') ||
          msg.includes('already in use') ||
          msg.includes('already been registered')
        ) {
          setError('__already_exists__')
        } else {
          setError(signUpError.message)
        }
      } else if (data.user && (data.user.confirmed_at || data.user.email_confirmed_at)) {
        // Email confirmations disabled — user is immediately active
        router.push('/trip')
      } else {
        setMessage('check-email')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.')
    } finally {
      setLoadingEmail(false)
    }
  }

  function handleSubmit() {
    if (mode === 'forgot') {
      resetPassword()
    } else if (mode === 'signin') {
      signInWithEmail()
    } else {
      signUpWithEmail()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  const anyLoading = loadingEmail || loadingGoogle

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FDF8F3]/95 backdrop-blur-sm border-b border-[#F5EFE6] px-4 sm:px-6 py-4 flex items-center justify-between">
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
              {mode === 'forgot' ? 'Reset password.' : mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p className="text-sm text-[#9c8c7e] mb-7">
              {mode === 'forgot'
                ? 'Enter your email to receive a reset link'
                : mode === 'signin'
                  ? 'Sign in to access your travel capsule'
                  : 'Join to start planning your travel wardrobe'}
            </p>

            {/* ─── Social buttons (hidden in forgot mode) ────────────────── */}
            {mode !== 'forgot' && (
              <>
                <div className="space-y-3 mb-6">
                  {/* Google — hidden in in-app browsers */}
                  {inAppBrowser ? (
                    <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        Google sign-in unavailable in this browser
                      </p>
                      <p className="text-xs text-amber-700 mb-3">
                        For Google sign-in, please open this page in Safari or Chrome.
                      </p>
                      <button
                        onClick={() => {
                          const url = window.location.href
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(url).then(() => {
                              alert('URL copied! Please paste it in Safari or Chrome.')
                            })
                          } else {
                            // iOS deep link to open in Safari
                            window.location.href = `x-safari-${url}`
                          }
                        }}
                        className="w-full text-center text-xs font-semibold text-amber-800 border border-amber-300 rounded-lg py-2 hover:bg-amber-100 transition-colors"
                      >
                        Copy URL to open in Safari / Chrome
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* ─── Divider ──────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-px bg-[#F5EFE6]" />
                  <span className="text-xs text-[#9c8c7e] whitespace-nowrap">— or continue with email —</span>
                  <div className="flex-1 h-px bg-[#F5EFE6]" />
                </div>
                {inAppBrowser && (
                  <p className="text-xs text-center text-[#9c8c7e] mb-4">
                    Or sign in with email above — works in all browsers.
                  </p>
                )}
              </>
            )}

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

              {mode !== 'forgot' && (
                <div>
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    disabled={loadingEmail}
                  />
                  {mode === 'signup' && password.length > 0 && password.length < 6 && (
                    <p className="mt-1 text-xs text-red-400">Password must be at least 6 characters</p>
                  )}
                </div>
              )}

              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    onClick={() => { setMode('forgot'); clearMessages() }}
                    className="text-xs text-[#9c8c7e] hover:text-[#b8552e] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* ─── Error / success messages ────────────────────────────────── */}
            {error === '__already_exists__' ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4" role="alert">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Email already registered
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  An account with <strong>{email}</strong> already exists. Sign in instead, or reset your password if you forgot it.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setMode('signin'); setError(null) }}
                    className="text-xs font-semibold text-[#b8552e] hover:underline"
                  >
                    Sign in →
                  </button>
                  <button
                    onClick={() => { setMode('forgot'); setError(null) }}
                    className="text-xs text-[#9c8c7e] hover:text-[#1A1410] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            ) : error ? (
              <p className="mt-4 text-sm text-red-500 leading-snug" role="alert">
                {error}
              </p>
            ) : null}
            {(message === 'check-email' || message === 'reset-sent') && (
              <div className="mt-4 rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] p-4" role="status">
                <p className="text-sm font-semibold text-[#1A1410] mb-1">Check your email</p>
                <p className="text-sm text-[#9c8c7e] leading-snug">
                  {message === 'reset-sent'
                    ? <>We sent a password reset link to <strong>{email}</strong>. Click the link in your email to set a new password.</>
                    : <>We sent a confirmation link to <strong>{email}</strong>. You can close this tab and click the link in your email to complete signup.</>
                  }
                </p>
                <button
                  onClick={() => { setMode('signin'); setMessage(null) }}
                  className="mt-3 text-xs font-semibold text-[#b8552e] hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
            {message && message !== 'check-email' && message !== 'reset-sent' && (
              <p className="mt-4 text-sm text-[#9c8c7e] leading-snug" role="status">
                {message}
              </p>
            )}

            {/* ─── Submit button ───────────────────────────────────────────── */}
            <button
              onClick={handleSubmit}
              disabled={anyLoading}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#b8552e] text-white text-sm font-semibold hover:bg-[#a34828] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={mode === 'forgot' ? 'Send reset link' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            >
              {loadingEmail ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  {mode === 'forgot' ? 'Sending…' : mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'forgot' ? (
                'Send Reset Link'
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>

            {/* ─── Mode toggle ─────────────────────────────────────────────── */}
            <p className="mt-5 text-center text-sm text-[#9c8c7e]">
              {mode === 'forgot' ? (
                <>
                  Remember your password?{' '}
                  <button
                    onClick={() => { setMode('signin'); clearMessages() }}
                    className="font-semibold text-[#b8552e] hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : mode === 'signin' ? (
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
            <a href="/legal/terms" className="underline underline-offset-2 hover:text-[#1A1410]">Terms</a>
            {' '}and{' '}
            <a href="/legal/privacy" className="underline underline-offset-2 hover:text-[#1A1410]">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  )
}

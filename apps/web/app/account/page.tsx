'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'

export default function AccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, signOut } = useAuth()
  // deploy.yml injects NEXT_PUBLIC_* at build time; non-null assertion is safe
  const supabase = createClient()!

  // Password recovery redirect — auto-open password section
  const isRecovery = searchParams.get('reset') === 'true'

  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')

  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user signed in via OAuth (no password to change)
  const isOAuth = user?.app_metadata?.provider !== 'email'

  useEffect(() => {
    if (user) {
      setFullName((user.user_metadata?.full_name as string) ?? '')
    }
  }, [user])

  // Show password section prominently if recovery redirect
  useEffect(() => {
    if (isRecovery && !loading && user) {
      setMessage('You can now set a new password below.')
    }
  }, [isRecovery, loading, user])

  // Redirect if not logged in
  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8552e]/30 border-t-[#b8552e] rounded-full animate-spin" />
      </div>
    )
  }

  function clearMessages() {
    setMessage(null)
    setError(null)
  }

  async function handleUpdateName() {
    clearMessages()
    setSavingName(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })
      if (updateError) setError(updateError.message)
      else setMessage('Name updated successfully.')
    } catch {
      setError('Failed to update name.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleUpdatePassword() {
    clearMessages()
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) {
        setError(updateError.message)
      } else {
        setMessage('Password updated successfully.')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    clearMessages()
    if (deleteConfirmEmail !== user?.email) {
      setError('Email does not match. Please enter your account email to confirm.')
      return
    }
    setDeleting(true)
    try {
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL ?? ''
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const res = await fetch(`${workerUrl}/api/account/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ user_id: user?.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError((data as { error?: string }).error ?? 'Failed to delete account.')
        return
      }

      await signOut()
      router.push('/')
    } catch {
      setError('Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || ''
  const initial = displayName[0]?.toUpperCase() ?? '?'

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
        <div className="max-w-md mx-auto mt-8 space-y-6">

          {/* ─── Profile Card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#F5EFE6] p-8 shadow-sm">
            <h1
              className="text-2xl font-bold italic text-[#1A1410] mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              My Account
            </h1>

            {/* Avatar + Email */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F5EFE6]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1A1410] text-white text-xl font-bold flex items-center justify-center">
                  {initial}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#1A1410]">{displayName}</p>
                <p className="text-xs text-[#9c8c7e]">{user?.email}</p>
                <p className="text-xs text-[#9c8c7e] mt-0.5">
                  {isOAuth ? `Signed in with ${user?.app_metadata?.provider ?? 'OAuth'}` : 'Email & Password'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#9c8c7e] uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={savingName}
                className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] placeholder:text-[#9c8c7e]/60 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm disabled:opacity-50"
                placeholder="Your name"
              />
              <button
                onClick={handleUpdateName}
                disabled={savingName}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#b8552e] text-white text-sm font-semibold hover:bg-[#a34828] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingName ? 'Saving…' : 'Update Name'}
              </button>
            </div>
          </div>

          {/* ─── Password Card (email users only) ──────────────────────────── */}
          {!isOAuth && (
            <div className={`bg-white rounded-2xl border p-8 shadow-sm ${isRecovery ? 'border-[#b8552e]/30 ring-2 ring-[#b8552e]/10' : 'border-[#F5EFE6]'}`}>
              <h2
                className="text-lg font-bold text-[#1A1410] mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {isRecovery ? 'Set New Password' : 'Change Password'}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9c8c7e] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] placeholder:text-[#9c8c7e]/60 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9c8c7e] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] text-[#1A1410] placeholder:text-[#9c8c7e]/60 focus:outline-none focus:ring-2 focus:ring-[#b8552e]/30 focus:border-[#b8552e] transition-colors text-sm disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleUpdatePassword}
                  disabled={savingPassword}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#b8552e] text-white text-sm font-semibold hover:bg-[#a34828] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Messages ──────────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-[#F5EFE6] bg-[#FDF8F3] p-4" role="status">
              <p className="text-sm text-[#1A1410]">{message}</p>
            </div>
          )}

          {/* ─── Danger Zone ───────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#F5EFE6] p-8 shadow-sm">
            <h2
              className="text-lg font-bold text-[#1A1410] mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Danger Zone
            </h2>
            <p className="text-xs text-[#9c8c7e] mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 active:scale-[0.99] transition-all"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-xl border border-red-200 bg-red-50/50">
                <p className="text-sm text-red-700 font-medium">
                  Type your email to confirm deletion:
                </p>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  disabled={deleting}
                  placeholder={user?.email ?? ''}
                  className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-[#1A1410] placeholder:text-[#9c8c7e]/60 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors text-sm disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmEmail !== user?.email}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting…' : 'Permanently Delete'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail('') }}
                    disabled={deleting}
                    className="px-5 py-2.5 rounded-xl border border-[#F5EFE6] text-[#9c8c7e] text-sm font-semibold hover:bg-[#F5EFE6] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

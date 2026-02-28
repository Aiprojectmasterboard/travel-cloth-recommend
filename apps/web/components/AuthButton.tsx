'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-[#F5EFE6] animate-pulse" aria-label="Loading auth state" />
  }

  if (!user) {
    return (
      <a
        href="/auth/login"
        className="text-xs font-semibold text-[#b8552e] border border-[#b8552e]/30 px-3 py-1.5 rounded-full hover:bg-[#b8552e] hover:text-white transition-colors"
      >
        Sign In
      </a>
    )
  }

  const initial =
    (user.user_metadata?.full_name as string | undefined)?.[0] ??
    user.email?.[0]?.toUpperCase() ??
    '?'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#9c8c7e] hidden md:block">{user.email}</span>
      <button
        onClick={async () => {
          await signOut()
          router.push('/')
        }}
        className="w-8 h-8 rounded-full bg-[#1A1410] text-white text-sm font-bold flex items-center justify-center hover:bg-[#b8552e] transition-colors"
        title="Sign out"
        aria-label="Sign out"
      >
        {initial}
      </button>
    </div>
  )
}

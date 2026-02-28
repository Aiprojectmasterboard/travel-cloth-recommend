'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

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

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initial =
    (user.user_metadata?.full_name as string | undefined)?.[0] ??
    user.email?.[0]?.toUpperCase() ??
    '?'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <span className="text-xs text-[#9c8c7e] hidden md:block group-hover:text-[#1A1410] transition-colors">
          {user.email}
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#b8552e]/30 transition-all"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1A1410] text-white text-sm font-bold flex items-center justify-center group-hover:bg-[#b8552e] transition-colors">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#F5EFE6] shadow-lg py-1 z-50">
          <a
            href="/account"
            className="block px-4 py-2.5 text-sm text-[#1A1410] hover:bg-[#FDF8F3] transition-colors"
            onClick={() => setOpen(false)}
          >
            My Account
          </a>
          <div className="h-px bg-[#F5EFE6] mx-2" />
          <button
            onClick={async () => {
              setOpen(false)
              await signOut()
              router.push('/')
            }}
            className="block w-full text-left px-4 py-2.5 text-sm text-[#9c8c7e] hover:bg-[#FDF8F3] hover:text-[#1A1410] transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState } from 'react'
import { LanguageSelector } from './LanguageSelector'

interface HeaderProps {
  onLoginClick?: () => void
  userInitials?: string
  onSignOut?: () => void
  showAuth?: boolean
}

export function Header({ onLoginClick, userInitials, onSignOut, showAuth = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#FDF8F3]/95 backdrop-blur-sm border-b border-[#F5EFE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 22 }}>
              all_inclusive
            </span>
            <span className="font-playfair text-base font-bold text-[#1A1410] uppercase tracking-widest">
              TravelCapsule
            </span>
          </Link>

          {/* Right group */}
          <div className="flex items-center gap-4 shrink-0">
            <LanguageSelector />

            {showAuth && (
              <>
                {userInitials ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C4613A] flex items-center justify-center text-white text-xs font-bold">
                      {userInitials}
                    </div>
                    <button
                      onClick={onSignOut}
                      className="hidden sm:block text-xs text-[#9c8c7e] hover:text-[#1A1410] transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLoginClick}
                    className="text-xs font-semibold text-[#C4613A] hover:underline transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="sm:hidden text-[#57534e]"
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

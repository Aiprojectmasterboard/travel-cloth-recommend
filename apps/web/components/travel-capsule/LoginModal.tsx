'use client'
import { useEffect } from 'react'
import { BtnDark } from './Buttons'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onGoogleLogin?: () => void
}
export function LoginModal({ open, onClose, onGoogleLogin }: LoginModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-[#E8DDD4] shadow-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 32 }}>luggage</span>
          <h2 className="font-playfair text-2xl font-bold text-[#1A1410]">Welcome Back</h2>
          <p className="text-sm text-[#9c8c7e]">Sign in to access your travel capsule</p>
        </div>
        <BtnDark onClick={onGoogleLogin} className="w-full">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
          Continue with Google
        </BtnDark>
        <button onClick={onClose} className="w-full text-xs text-[#9c8c7e] hover:text-[#1A1410] transition-colors">Cancel</button>
      </div>
    </div>
  )
}

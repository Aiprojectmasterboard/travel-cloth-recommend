'use client'
import { BtnPrimary } from './Buttons'

interface SignupPromptProps {
  show: boolean
  onClose: () => void
  onSignup?: () => void
  message?: string
}
export function SignupPrompt({ show, onClose, onSignup, message }: SignupPromptProps) {
  if (!show) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#E8DDD4] shadow-2xl p-6 w-80 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="font-playfair text-lg font-bold text-[#1A1410]">Save Your Results</h3>
        <button onClick={onClose} className="text-[#9c8c7e] hover:text-[#1A1410]">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
      <p className="text-sm text-[#57534e] leading-relaxed">
        {message ?? 'Create a free account to save your travel capsule and access it anytime.'}
      </p>
      <BtnPrimary onClick={onSignup} size="sm" className="w-full">Create Free Account</BtnPrimary>
    </div>
  )
}

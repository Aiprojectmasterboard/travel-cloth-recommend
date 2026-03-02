'use client'
import { useState } from 'react'
interface SocialShareProps {
  url: string
  title?: string
  className?: string
}
export function SocialShare({ url, title, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: title ?? 'Travel Capsule AI', url })
    } else {
      await handleCopy()
    }
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-4 py-2 border border-[#E8DDD4] text-xs font-semibold text-[#57534e] hover:border-[#C4613A] hover:text-[#C4613A] transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{copied ? 'check' : 'link'}</span>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1410] text-white text-xs font-semibold hover:bg-[#2c221c] transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
        Share
      </button>
    </div>
  )
}

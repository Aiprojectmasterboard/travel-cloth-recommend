'use client'
import { type ReactNode } from 'react'
import Image from 'next/image'
import { QuoteCard } from './QuoteCard'

interface OnboardingLayoutProps {
  children: ReactNode
  imageUrl: string
  quote?: string
  quoteAuthor?: string
  step?: number
  totalSteps?: number
}

export function OnboardingLayout({ children, imageUrl, quote, quoteAuthor, step, totalSteps }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col overflow-y-auto">
        {step !== undefined && totalSteps && (
          <div className="px-8 pt-6">
            <div className="flex gap-1.5 mb-8">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-[#C4613A]' : 'bg-[#E8DDD4]'}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 px-8 py-6 max-w-lg mx-auto w-full">
          {children}
        </div>
      </div>
      {/* Right: Editorial image */}
      <div className="hidden lg:block relative sticky top-0 h-screen">
        <Image src={imageUrl} alt="Travel inspiration" fill style={{ objectFit: 'cover' }} unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1410]/80 via-transparent to-transparent" />
        {quote && (
          <div className="absolute bottom-8 left-8 right-8">
            <QuoteCard quote={quote} author={quoteAuthor} />
          </div>
        )}
      </div>
    </div>
  )
}

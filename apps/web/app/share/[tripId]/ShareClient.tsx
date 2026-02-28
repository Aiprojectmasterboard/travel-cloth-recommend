'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiGet } from '@/lib/api'
import type { ShareResult } from '../../../../../packages/types'

export default function ShareClient({ tripId }: { tripId: string }) {
  const [data, setData] = useState<ShareResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    apiGet<ShareResult>(`/api/share/${tripId}`)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tripId])

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1410] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#1A1410] flex items-center justify-center text-white text-center px-6">
        <div>
          <p className="text-5xl mb-4">&#128533;</p>
          <h1
            className="text-xl font-bold mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Style card not found
          </h1>
          <p className="text-white/50 text-sm mb-6">
            This link may have expired. Create your own travel capsule below.
          </p>
          <a
            href="/trip"
            className="inline-block bg-[#b8552e] hover:bg-[#a34828] text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
          >
            Create yours →
          </a>
        </div>
      </div>
    )
  }

  // ─── Share page ───────────────────────────────────────────────────────────

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(data!.share_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }, [data])

  return (
    <div className="min-h-screen bg-[#1A1410] text-white flex flex-col">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
        {/* Background blur */}
        {data.teaser_url && (
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.teaser_url}
              alt=""
              className="w-full h-full object-cover scale-110"
              style={{ filter: 'blur(24px)' }}
            />
          </div>
        )}

        <div className="relative z-10 w-full max-w-sm mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 font-medium mb-4">
            Travel Capsule AI
          </p>

          <h1
            className="text-4xl font-bold italic mb-3 leading-tight"
            style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37' }}
          >
            {data.mood_name}
          </h1>

          <p className="text-white/55 text-sm mb-8 leading-relaxed">{data.og_description}</p>

          {/* Teaser image */}
          {data.teaser_url && (
            <div className="mx-auto w-56 h-72 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.teaser_url}
                alt={`${data.mood_name} travel outfit preview`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* CTA */}
          <a
            href="/trip"
            className="inline-flex items-center gap-2 bg-[#b8552e] hover:bg-[#a34828] text-white px-8 py-4 rounded-full font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Create my travel capsule →
          </a>
          <p className="text-xs text-white/30 mt-3">Free preview · from $5 to unlock</p>

          {/* Share actions */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-full border border-white/20 text-white/60 text-xs hover:border-white/50 hover:text-white transition-colors flex items-center gap-1.5"
              aria-label="Copy share link"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `${data.og_title} — Travel Capsule AI\n#TravelCapsuleAI`
              )}&url=${encodeURIComponent(data.share_url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border border-white/20 text-white/60 text-xs hover:border-white/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              Share on X
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-5 text-center">
        <p className="text-white/30 text-xs">
          Powered by Travel Capsule AI &nbsp;·&nbsp; AI-generated outfit styling for every trip
        </p>
      </div>
    </div>
  )
}

'use client'

export interface CapsuleEstimatorProps {
  count: number
  principles: string[]
}

export default function CapsuleEstimator({ count, principles }: CapsuleEstimatorProps) {
  return (
    <div className="rounded-2xl bg-[#FDF8F3] border border-[#F5EFE6] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F5EFE6] flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#b8552e]/70 mb-1.5 font-medium">
            Capsule Estimate
          </p>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-5xl font-bold text-[#1A1410]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {count}
            </span>
            <span className="text-sm text-[#9c8c7e]">essential items</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-[#b8552e]/8 flex items-center justify-center flex-shrink-0 text-2xl">
          &#128247;
        </div>
      </div>

      {/* Principles */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs uppercase tracking-wider text-[#9c8c7e] font-medium">
          3 Packing Principles
        </p>
        {principles.map((principle, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#b8552e]/10 text-[#b8552e] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
              {i + 1}
            </div>
            <p className="text-sm text-[#1A1410]/80 leading-relaxed">{principle}</p>
          </div>
        ))}
      </div>

      {/* Locked notice */}
      <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-[#1A1410]/4 border border-[#1A1410]/8 flex items-center gap-3">
        <svg
          className="w-4 h-4 text-[#9c8c7e] flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p className="text-xs text-[#9c8c7e]">
          Full list of {count} items unlocks after payment
        </p>
      </div>
    </div>
  )
}

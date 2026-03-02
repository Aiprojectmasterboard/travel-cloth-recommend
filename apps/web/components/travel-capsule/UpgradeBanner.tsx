'use client'
interface UpgradeBannerProps {
  onUpgrade?: () => void
  className?: string
}
export function UpgradeBanner({ onUpgrade, className = '' }: UpgradeBannerProps) {
  return (
    <div className={`bg-[#1A1410] p-8 space-y-4 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4613A]">Upgrade Available</p>
      <h3 className="font-playfair text-xl text-white">Unlock the Full Pro Experience</h3>
      <p className="text-sm text-white/60 leading-relaxed">
        High-res outfit images for all cities, 1 free regeneration, and multi-city coordination.
      </p>
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-2 bg-[#C4613A] hover:bg-[#A84A25] text-white text-sm font-bold uppercase tracking-wide px-6 py-3 transition-colors"
      >
        Upgrade to Pro &mdash; $7 more
      </button>
    </div>
  )
}

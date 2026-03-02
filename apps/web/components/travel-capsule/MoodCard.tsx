'use client'
import Image from 'next/image'
interface MoodCardProps {
  city: string
  flag?: string
  month?: string
  description: string
  images?: string[]
  palette?: string[]
}
export function MoodCard({ city, flag, month, description, images = [], palette = [] }: MoodCardProps) {
  return (
    <div className="bg-white border border-[#E8DDD4] overflow-hidden">
      {images.length >= 2 && (
        <div className="grid grid-cols-2 gap-1">
          {images.slice(0, 2).map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden bg-[#F5EFE6]">
              <Image src={src} alt={`mood ${i + 1}`} fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          ))}
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 18 }}>palette</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#9c8c7e]">City Mood</span>
        </div>
        <h3 className="font-playfair text-lg font-bold text-[#1A1410]">{flag} {city}</h3>
        <p className="text-xs text-[#57534e] leading-relaxed">{month && `${month} in ${city} \u2014 `}{description}</p>
        {palette.length > 0 && (
          <div className="flex gap-2 mt-1">
            {palette.map(c => (
              <div key={c} className="w-7 h-7 rounded border border-black/5" style={{ background: c }} title={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

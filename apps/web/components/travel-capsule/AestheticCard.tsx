'use client'
import Image from 'next/image'
interface AestheticCardProps {
  label: string
  imageUrl: string
  selected?: boolean
  onClick?: () => void
}
export function AestheticCard({ label, imageUrl, selected, onClick }: AestheticCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer aspect-square border-2 transition-all ${selected ? 'border-[#C4613A]' : 'border-transparent hover:border-[#C4613A]/40'}`}
    >
      <Image src={imageUrl} alt={label} fill style={{ objectFit: 'cover' }} unoptimized />
      <div className={`absolute inset-0 transition-colors ${selected ? 'bg-[#C4613A]/20' : 'bg-black/10 hover:bg-black/5'}`} />
      {selected && (
        <div className="absolute top-2 right-2 bg-[#C4613A] rounded-full p-0.5">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-white text-xs font-bold uppercase tracking-widest">{label}</p>
      </div>
    </div>
  )
}

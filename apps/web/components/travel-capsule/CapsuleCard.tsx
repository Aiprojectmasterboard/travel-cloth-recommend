'use client'
import Image from 'next/image'
interface CapsuleCardProps {
  name: string
  imageUrl: string
  count?: number
}
export function CapsuleCard({ name, imageUrl, count }: CapsuleCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square border border-[#E8DDD4] bg-white overflow-hidden">
        <Image src={imageUrl} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
        {count !== undefined && (
          <div className="absolute bottom-1 right-1 bg-[#C4613A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            &times;{count}
          </div>
        )}
      </div>
      <p className="text-[11px] font-semibold text-[#1A1410] text-center leading-tight">{name}</p>
    </div>
  )
}

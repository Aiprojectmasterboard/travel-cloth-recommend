'use client'
import Image from 'next/image'
import { SizeChip } from './Badges'

interface OutfitItemProps {
  name: string
  description?: string
  imageUrl: string
  size?: string
}
export function OutfitItem({ name, description, imageUrl, size }: OutfitItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden border border-[#E8DDD4] bg-[#F5EFE6]">
        <Image src={imageUrl} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1410] truncate">{name}</p>
        {description && <p className="text-xs text-[#9c8c7e] truncate">{description}</p>}
      </div>
      {size && <SizeChip size={size} />}
    </div>
  )
}

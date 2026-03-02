'use client'
import Image from 'next/image'
interface CityRowProps {
  city: string
  country: string
  imageUrl: string
  fromDate?: string
  toDate?: string
  onClick?: () => void
  selected?: boolean
}
export function CityRow({ city, country, imageUrl, fromDate, toDate, onClick, selected }: CityRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-3 border cursor-pointer transition-all ${selected ? 'border-[#C4613A] bg-[#FDF8F3]' : 'border-[#E8DDD4] bg-white hover:border-[#C4613A]/50'}`}
    >
      <div className="relative w-14 h-14 shrink-0 overflow-hidden">
        <Image src={imageUrl} alt={city} fill style={{ objectFit: 'cover' }} unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#1A1410] truncate">{city}</p>
        <p className="text-xs text-[#9c8c7e]">{country}</p>
        {(fromDate || toDate) && (
          <p className="text-xs text-[#C4613A] mt-0.5">{fromDate} &rarr; {toDate}</p>
        )}
      </div>
      {selected && (
        <span className="material-symbols-outlined text-[#C4613A] shrink-0" style={{ fontSize: 18 }}>check_circle</span>
      )}
    </div>
  )
}

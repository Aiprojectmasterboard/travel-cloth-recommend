'use client'

import Image from 'next/image'

interface CityGalleryProps {
  images: string[]
  cityIndex: number
  filter?: string
  labels?: string[]
}

const DEFAULT_LABELS = ['Detail', 'Venue', 'Look 2', 'Basic']

export default function CityGallery({ images, cityIndex, filter, labels }: CityGalleryProps) {
  const resolvedLabels = labels ?? DEFAULT_LABELS
  // Even cities: hero on left (col-span-2), smaller on right
  // Odd cities: smaller on left, hero on right
  const isEven = cityIndex % 2 === 0

  const heroImage = images[0] ?? ''
  const smallImages = images.slice(1, 4)
  // Fill with first image if not enough
  const filledSmall = Array.from({ length: 3 }, (_, i) => smallImages[i] ?? images[0] ?? '')

  const heroCaption =
    cityIndex === 0
      ? 'Morning Coffee Run'
      : cityIndex === 1
        ? 'Afternoon Stroll'
        : 'Evening Out'

  const heroBlock = (
    <div className="md:col-span-2 md:row-span-2 relative w-full h-96 md:h-full rounded-xl overflow-hidden group shadow-md">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url("${heroImage}")`,
          filter: filter,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
        <span className="text-white font-serif text-2xl italic">{heroCaption}</span>
      </div>
    </div>
  )

  const smallBlock = (
    <div className={`flex flex-col gap-4 h-96 md:h-full${isEven ? '' : ' order-first md:order-none'}`}>
      {filledSmall.map((src, i) => (
        <div
          key={i}
          className={`relative flex-1 w-full rounded-xl overflow-hidden group shadow-sm${i === 2 ? ' hidden md:block' : ''}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url("${src}")`,
              filter: filter,
            }}
          />
          <div className="absolute top-3 right-3 bg-[#FDF8F3]/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold shadow-sm text-stone-800 uppercase tracking-widest">
            {resolvedLabels[i] ?? 'Look'}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[600px]">
      {isEven ? (
        <>
          {heroBlock}
          {smallBlock}
        </>
      ) : (
        <>
          {smallBlock}
          {heroBlock}
        </>
      )}
    </div>
  )
}

'use client'

interface CityTimelineEntry {
  name: string
  style: string
}

interface MultiCityTimelineProps {
  cities: CityTimelineEntry[]
  activeIndex: number
  itemThumbnails: string[][]
}

export default function MultiCityTimeline({
  cities,
  activeIndex,
  itemThumbnails,
}: MultiCityTimelineProps) {
  return (
    <div className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-[#C4613A]/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#C4613A] text-white p-1 rounded">
          <span className="material-symbols-outlined text-sm">hub</span>
        </span>
        <h3 className="font-bold text-stone-900 font-serif">Multi-City Logic</h3>
      </div>
      <p className="text-sm text-stone-600 mb-6">
        See how your core items adapt from city to city.
      </p>

      <div className="relative pl-4 border-l-2 border-dashed border-stone-200 space-y-8">
        {cities.map((city, idx) => {
          const isActive = idx === activeIndex
          const thumbnails = itemThumbnails[idx] ?? []
          const dotColor = isActive ? 'bg-[#C4613A]' : 'bg-stone-300'

          return (
            <div key={city.name}>
              {/* Arrow between cities */}
              {idx > 0 && (
                <div className="absolute left-[-10px] bg-[#F5EFE6] p-1 rounded-full text-stone-400 -mt-6 mb-2">
                  <span className="material-symbols-outlined text-sm rotate-180">arrow_downward</span>
                </div>
              )}

              <div className={`relative${isActive ? '' : ' opacity-80'}`}>
                {/* Timeline dot */}
                <div
                  className={`absolute -left-[21px] top-1 size-3 rounded-full ring-4 ring-white ${dotColor}`}
                />

                <h4 className="font-bold text-stone-900 text-sm mb-1">{city.name}</h4>
                <p className="text-xs text-stone-500 mb-2">{city.style}</p>

                {thumbnails.length > 0 && (
                  <div className={`flex -space-x-2${isActive ? '' : ' grayscale-[0.5]'}`}>
                    {thumbnails.slice(0, 3).map((src, tIdx) => (
                      <div
                        key={tIdx}
                        className="size-8 rounded-full border border-white bg-cover bg-center"
                        style={{ backgroundImage: `url("${src}")` }}
                        aria-label={`${city.name} item ${tIdx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

interface CityMoodCardProps {
  city: string
  month: string
  description?: string
  moodImages: string[]
  palette: string[]
}

export default function CityMoodCard({ city, month, description, moodImages, palette }: CityMoodCardProps) {
  const defaultDesc = `${city} in ${month} requires layers. Think neutral palettes—camel, black, cream—mixed with rich textures. It's sophisticated but walkable.`

  return (
    <div className="aspect-[4/5] bg-white rounded-xl p-6 shadow-sm border border-[#ebdacc] flex flex-col justify-between relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C4613A]/10 rounded-bl-full -mr-4 -mt-4" />
      <div>
        <h4 className="text-2xl font-serif font-bold mb-2">City Mood</h4>
        <div className="h-1 w-12 bg-[#C4613A] mb-4" />
        <p className="text-sm text-[#57534e] leading-relaxed mb-6">
          {description || defaultDesc}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {moodImages.slice(0, 2).map((src, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url("${src}")` }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
        {palette.map((color, i) => (
          <span key={i} className="w-8 h-8 rounded-full border border-stone-200" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  )
}

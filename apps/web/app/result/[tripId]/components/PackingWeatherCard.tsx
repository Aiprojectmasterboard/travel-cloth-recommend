'use client'

interface CityWeather {
  name: string
  temp: string
  emoji: string
}

interface PackingWeatherCardProps {
  cities: CityWeather[]
}

export default function PackingWeatherCard({ cities }: PackingWeatherCardProps) {
  return (
    <div className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-[#E8DEC9]">
      <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 font-serif">
        <span className="material-symbols-outlined text-[#C4613A]">cloud</span>
        Packing Weather
      </h3>
      <div className="space-y-3">
        {cities.map((city) => (
          <div key={city.name} className="flex justify-between items-center text-sm">
            <span className="text-stone-600">{city.name}</span>
            <span className="font-bold text-stone-900">
              {city.temp} {city.emoji}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

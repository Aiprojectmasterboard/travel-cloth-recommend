'use client'

import Image from 'next/image'

interface StyleSegment {
  label: string
  pct: number
  color: string
}

interface TrendingItem {
  name: string
  imageUrl: string
}

interface StyleDNACardProps {
  segments: StyleSegment[]
  dominantLabel: string
  trendingItems: TrendingItem[]
}

function buildConicGradient(segments: StyleSegment[]): string {
  let cursor = 0
  const stops: string[] = []
  for (const seg of segments) {
    const end = cursor + seg.pct
    stops.push(`${seg.color} ${cursor}% ${end}%`)
    cursor = end
  }
  return `conic-gradient(${stops.join(', ')})`
}

export default function StyleDNACard({
  segments,
  dominantLabel,
  trendingItems,
}: StyleDNACardProps) {
  const conicGradient = buildConicGradient(segments)

  // Split dominant label into lines at spaces for center display
  const labelLines = dominantLabel.split(' ')
  const midpoint = Math.ceil(labelLines.length / 2)
  const line1 = labelLines.slice(0, midpoint).join(' ')
  const line2 = labelLines.slice(midpoint).join(' ')

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#1A1410]/5 shadow-sm sticky top-24">
      <h3 className="font-serif text-2xl text-[#1A1410] mb-2">Style DNA</h3>
      <p className="text-[#8C8680] text-sm mb-8 leading-relaxed">
        Analyzing your unique style patterns across 4 continents to refine future recommendations.
      </p>

      {/* Donut Chart */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: conicGradient }}
          />
          <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center z-10 shadow-inner">
            <span className="text-[#8C8680] text-[10px] uppercase tracking-widest font-bold mb-1">
              Dominant
            </span>
            <span className="text-[#1A1410] text-2xl font-serif font-medium text-center leading-none">
              {line1}
              {line2 && (
                <>
                  <br />
                  {line2}
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6">
        {segments.map((seg) => (
          <div key={seg.label}>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[#1A1410] font-medium text-sm">{seg.label}</span>
              <span className="font-bold text-sm" style={{ color: seg.color }}>
                {seg.pct}%
              </span>
            </div>
            <div className="h-2 w-full bg-[#F5EFE6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Trending For You */}
      <div className="mt-10 pt-8 border-t border-[#1A1410]/10">
        <h4 className="text-[#1A1410] text-xs font-bold uppercase tracking-widest mb-4">
          Trending for You
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {trendingItems.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="bg-[#F5EFE6] rounded overflow-hidden aspect-square mb-2 relative">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
              <span className="block text-center text-[10px] font-bold text-[#8C8680] group-hover:text-[#C4613A] transition-colors">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

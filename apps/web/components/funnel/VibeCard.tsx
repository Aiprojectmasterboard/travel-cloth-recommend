'use client'

import Badge from '@/components/ui/Badge'

export interface VibeCardProps {
  city: string
  moodName: string
  vibeTags: string[]
  colorPalette: string[]
  avoidNote: string
}

export default function VibeCard({
  city,
  moodName,
  vibeTags,
  colorPalette,
  avoidNote,
}: VibeCardProps) {
  return (
    <div
      className="rounded-2xl bg-[#1A1410] text-white overflow-hidden shadow-lg"
      aria-label={`Vibe for ${city}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-[#D4AF37]/70 mb-2 font-medium">
          City Vibe
        </p>
        <h3
          className="text-xl font-bold italic leading-tight"
          style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37' }}
        >
          {moodName}
        </h3>
      </div>

      {/* Color palette */}
      {colorPalette.length > 0 && (
        <div className="px-5 py-4 flex items-center gap-3">
          <span className="text-xs text-white/50 uppercase tracking-wider flex-shrink-0">
            Palette
          </span>
          <div className="flex gap-2">
            {colorPalette.map((hex, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white/10 shadow-sm flex-shrink-0"
                style={{ background: hex }}
                title={hex}
                aria-label={`Color ${hex}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vibe tags */}
      {vibeTags.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {vibeTags.map((tag) => (
            <Badge key={tag} variant="gold">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Avoid note */}
      {avoidNote && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1 font-medium">
            Avoid
          </p>
          <p className="text-sm text-white/80 leading-relaxed">{avoidNote}</p>
        </div>
      )}
    </div>
  )
}

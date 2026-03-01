'use client'

interface StyleLogicCardProps {
  description: string
  tags: string[]
}

export default function StyleLogicCard({ description, tags }: StyleLogicCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#ebdacc]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#C4613A]">psychology</span>
        <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-[#57534e]">Style Logic</h3>
      </div>
      <h4 className="text-xl font-serif font-bold text-[#292524] mb-3">Why this outfit?</h4>
      <p className="text-sm text-[#57534e] leading-relaxed mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-1 bg-stone-100 text-xs font-medium rounded text-stone-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

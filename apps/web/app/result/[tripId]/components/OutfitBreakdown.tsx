'use client'

interface OutfitBreakdownProps {
  items: Array<{ name: string; description: string; imageUrl?: string }>
  styleQuote?: string
}

export default function OutfitBreakdown({ items, styleQuote }: OutfitBreakdownProps) {
  return (
    <div className="flex flex-col justify-center space-y-6">
      <h4 className="text-lg font-bold font-sans uppercase tracking-wide text-[#57534e] border-b border-stone-200 pb-2">
        Outfit Breakdown
      </h4>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-4 group cursor-pointer">
            <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform"
                  src={item.imageUrl}
                />
              ) : (
                <div className="w-full h-full bg-stone-200" />
              )}
            </div>
            <div>
              <p className="font-serif font-bold text-lg">{item.name}</p>
              <p className="text-sm text-[#57534e]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      {styleQuote && (
        <div className="pt-4 mt-4 border-t border-stone-200">
          <p className="text-sm text-[#57534e] italic">&ldquo;{styleQuote}&rdquo;</p>
        </div>
      )}
    </div>
  )
}

'use client'
interface QuoteCardProps {
  quote: string
  author?: string
  className?: string
}
export function QuoteCard({ quote, author, className = '' }: QuoteCardProps) {
  return (
    <div className={`bg-[#1A1410]/80 backdrop-blur-sm text-white p-5 space-y-2 ${className}`}>
      <p className="font-playfair text-base italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
      {author && <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{author}</p>}
    </div>
  )
}

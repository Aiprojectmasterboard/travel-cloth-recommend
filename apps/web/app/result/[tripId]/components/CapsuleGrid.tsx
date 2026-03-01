'use client'

interface CapsuleGridProps {
  items: Array<{ name: string; imageUrl: string }>
  columns?: number
  totalLabel?: string
}

export default function CapsuleGrid({ items, columns = 5, totalLabel }: CapsuleGridProps) {
  const gridCols =
    columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
      : columns === 4
        ? 'grid-cols-2 md:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-serif font-bold text-[#292524]">Capsule Essentials</h3>
        {totalLabel && <span className="text-sm text-[#57534e]">{totalLabel}</span>}
      </div>
      <div className={`grid ${gridCols} gap-4`}>
        {items.map((item) => (
          <div key={item.name} className="group flex flex-col gap-2">
            <div className="aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center p-3 border border-[#ebdacc] shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
              <img
                alt={item.name}
                className="w-full h-full object-cover mix-blend-multiply"
                src={item.imageUrl}
              />
            </div>
            <p className="text-xs font-bold text-center font-sans text-[#292524]">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

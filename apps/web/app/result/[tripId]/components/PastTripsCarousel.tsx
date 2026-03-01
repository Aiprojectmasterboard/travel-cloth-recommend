'use client'

interface PastTrip {
  title: string
  year: string
  description: string
  days: number
  outfits: number
  imageUrl: string
}

interface PastTripsCarouselProps {
  trips: PastTrip[]
}

export default function PastTripsCarousel({ trips }: PastTripsCarouselProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#C4613A] text-2xl">history_edu</span>
          <h3 className="font-serif text-2xl text-[#1A1410]">Past Trips</h3>
        </div>
        <a
          href="#"
          className="text-sm font-bold text-[#C4613A] hover:underline"
        >
          View All Archive
        </a>
      </div>

      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-6 min-w-max">
          {trips.map((trip) => (
            <div
              key={`${trip.title}-${trip.year}`}
              className="w-80 bg-white rounded-xl overflow-hidden border border-[#1A1410]/5 hover:shadow-lg transition-shadow group flex flex-col"
            >
              <div
                className="h-40 bg-cover bg-center relative"
                style={{ backgroundImage: `url('${trip.imageUrl}')` }}
              >
                <div className="absolute inset-0 bg-[#1A1410]/10 group-hover:bg-[#1A1410]/0 transition-colors" />
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif text-xl font-bold text-[#1A1410]">
                    {trip.title}
                  </h4>
                  <span className="text-xs font-bold text-[#8C8680] bg-[#F5EFE6] px-2 py-1 rounded shrink-0 ml-2">
                    {trip.year}
                  </span>
                </div>
                <p className="text-[#8C8680] text-sm mb-4">{trip.description}</p>
                <div className="mt-auto pt-4 border-t border-[#1A1410]/5 flex justify-between items-center">
                  <span className="text-xs text-[#8C8680] font-medium">
                    {trip.days} Days &bull; {trip.outfits} Outfits
                  </span>
                  <button
                    className="text-[#C4613A] hover:bg-[#C4613A]/10 p-2 rounded-full transition-colors"
                    title="Download PDF"
                    aria-label={`Download PDF for ${trip.title}`}
                  >
                    <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

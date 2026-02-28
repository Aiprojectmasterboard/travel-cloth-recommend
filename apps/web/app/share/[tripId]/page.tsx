import type { Metadata } from 'next'
import ShareClient from './ShareClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL ?? 'https://travel-capsule-worker.netson94.workers.dev'
  try {
    const res = await fetch(`${workerUrl}/api/share/${tripId}`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('not found')
    const data = await res.json() as {
      teaser?: { mood?: string; image_url?: string }
      trip?: { cities?: Array<{ name: string }> }
    }
    const mood = data.teaser?.mood ?? 'Travel Style'
    const city = data.trip?.cities?.[0]?.name ?? 'Your City'
    return {
      title: `${city} — ${mood} | Travel Capsule AI`,
      description: `AI-generated travel outfit inspiration for ${city}. Create your own travel capsule wardrobe.`,
      openGraph: {
        title: `${city} — ${mood}`,
        description: `AI travel outfit styling for ${city}. See my capsule wardrobe look.`,
        images: data.teaser?.image_url
          ? [{ url: data.teaser.image_url, width: 1200, height: 630 }]
          : [],
        type: 'website',
      },
      twitter: { card: 'summary_large_image' },
    }
  } catch {
    return { title: 'Travel Style | Travel Capsule AI' }
  }
}

export default async function SharePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return <ShareClient tripId={tripId} />
}

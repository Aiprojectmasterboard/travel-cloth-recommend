import type { Metadata } from 'next'
import ShareClient from './ShareClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL ?? ''
  try {
    const res = await fetch(`${workerUrl}/api/share/${tripId}`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('not found')
    const data = await res.json() as {
      mood_name?: string
      og_title?: string
      og_description?: string
      teaser_url?: string
    }
    const mood = data.mood_name ?? 'Travel Style'
    const ogTitle = data.og_title ?? mood
    const ogDesc = data.og_description ?? `AI travel outfit styling. See the capsule wardrobe look.`
    return {
      title: `${ogTitle} | Travel Capsule AI`,
      description: `AI-generated travel outfit inspiration. Create your own travel capsule wardrobe.`,
      openGraph: {
        title: ogTitle,
        description: ogDesc,
        images: data.teaser_url
          ? [{ url: data.teaser_url, width: 1200, height: 630 }]
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

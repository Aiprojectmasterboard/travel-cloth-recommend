import type { Metadata } from 'next'
import ShareClient from './ShareClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  return {
    title: 'My AI Travel Style — Travel Capsule AI',
    description: 'See my AI-curated travel outfit style. Create your own travel capsule wardrobe.',
    openGraph: {
      title: 'My Travel Capsule Style',
      description: 'AI-generated outfit styling for my trip. Create yours free.',
      url: `https://travelcapsule.ai/share/${tripId}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return <ShareClient tripId={tripId} />
}

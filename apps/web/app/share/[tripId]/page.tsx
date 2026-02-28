import type { Metadata } from 'next'
import ShareClient from './ShareClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: { tripId: string } }
): Promise<Metadata> {
  return {
    title: 'My AI Travel Style — Travel Capsule AI',
    description: 'See my AI-curated travel outfit style. Create your own travel capsule wardrobe.',
    openGraph: {
      title: 'My Travel Capsule Style',
      description: 'AI-generated outfit styling for my trip. Create yours free.',
      url: `https://travelcapsule.ai/share/${params.tripId}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default function SharePage({ params }: { params: { tripId: string } }) {
  return <ShareClient tripId={params.tripId} />
}

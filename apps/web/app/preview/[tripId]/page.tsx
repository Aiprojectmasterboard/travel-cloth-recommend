import type { Metadata } from 'next'
import PreviewClient from './PreviewClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: { tripId: string } }
): Promise<Metadata> {
  return {
    title: 'Your Travel Style Preview',
    description: 'AI-analyzed weather, city vibes, and a teaser of your travel capsule wardrobe.',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Travel Capsule AI — Your Style Preview',
      description: 'See your AI-curated travel vibe and unlock the full outfit gallery.',
      url: `https://travelcapsule.ai/preview/${params.tripId}`,
      type: 'website',
    },
  }
}

export default function PreviewPage({ params }: { params: { tripId: string } }) {
  return <PreviewClient tripId={params.tripId} />
}

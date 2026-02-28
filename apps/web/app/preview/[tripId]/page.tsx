import type { Metadata } from 'next'
import PreviewClient from './PreviewClient'

export const runtime = 'edge'

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  return {
    title: 'Your Travel Style Preview',
    description: 'AI-analyzed weather, city vibes, and a teaser of your travel capsule wardrobe.',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Travel Capsule AI — Your Style Preview',
      description: 'See your AI-curated travel vibe and unlock the full outfit gallery.',
      url: `https://travelscapsule.com/preview/${tripId}`,
      type: 'website',
    },
  }
}

export default async function PreviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return <PreviewClient tripId={tripId} />
}

import type { Metadata } from 'next'
import ResultClient from './ResultClient'

export const runtime = 'edge'

// ─── Metadata ─────────────────────────────────────────────────────────────────
// Result pages are personalized galleries — exclude from search index.

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  return {
    title: 'My Travel Style Gallery',
    description: 'My AI-generated travel outfit gallery. Travel Capsule AI.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Travel Capsule AI — My Travel Style Gallery',
      description: 'View my AI-generated travel outfit images.',
      url: `https://travelcapsule.ai/result/${tripId}`,
      type: 'website',
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return <ResultClient tripId={tripId} />
}

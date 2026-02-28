import type { Metadata } from 'next'
import ChecklistClient from './ChecklistClient'

export const runtime = 'edge'

// ─── Metadata ─────────────────────────────────────────────────────────────────
// Checklist pages are personalized — exclude from search index.

export async function generateMetadata(
  { params }: { params: Promise<{ tripId: string }> }
): Promise<Metadata> {
  const { tripId } = await params
  return {
    title: 'AI Smart Packing Checklist',
    description: 'Your AI-generated smart packing checklist for your trip. Travel Capsule AI.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Travel Capsule AI — Smart Packing Checklist',
      description: 'My AI-curated packing checklist for my upcoming trip.',
      url: `https://travelcapsule.ai/checklist/${tripId}`,
      type: 'website',
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ChecklistPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  return <ChecklistClient tripId={tripId} />
}

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
    title: '여행 스타일 갤러리',
    description: 'AI가 생성한 나만의 여행 코디 갤러리. Travel Capsule AI.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: 'Travel Capsule AI — 여행 스타일 갤러리',
      description: 'AI가 생성한 나만의 여행 코디 이미지를 확인해보세요.',
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

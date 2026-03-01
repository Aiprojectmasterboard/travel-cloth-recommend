import type { Metadata } from 'next'
import TripClient from './TripClient'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Plan Your Trip — AI Outfit Styling',
  description:
    'Enter your travel destinations and dates. Our AI analyzes weather, city vibes, and your style to create a personalized capsule wardrobe with outfit images.',
  openGraph: {
    title: 'Plan Your Trip — Travel Capsule AI',
    description:
      'Choose up to 5 cities, set your travel dates, and let AI style your perfect travel wardrobe. Weather-matched, vibe-curated outfit images from $5.',
    url: 'https://travelscapsule.com/trip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plan Your Trip — Travel Capsule AI',
    description: 'AI-powered outfit styling for your next trip. Enter cities + dates, get a capsule wardrobe.',
  },
  alternates: {
    canonical: 'https://travelscapsule.com/trip',
  },
}

export default function TripPage() {
  return <TripClient />
}

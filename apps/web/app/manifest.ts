import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Travel Capsule AI',
    short_name: 'TravelCapsule',
    description: 'AI-powered travel outfit styling. Weather analysis + city vibe matching for your perfect capsule wardrobe.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDF8F3',
    theme_color: '#C4714C',
    orientation: 'portrait',
    categories: ['lifestyle', 'travel', 'fashion'],
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}

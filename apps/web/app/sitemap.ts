import type { MetadataRoute } from 'next'

const SITE_URL = 'https://travelcapsule.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      // hreflang alternates for international SEO (GEO)
      alternates: {
        languages: {
          'ko-KR': SITE_URL,
          'x-default': SITE_URL,
        },
      },
    },
    // Note: /result/[tripId] pages are excluded — private, noindex, user-specific
  ]
}

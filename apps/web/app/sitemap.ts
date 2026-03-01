import type { MetadataRoute } from 'next'

export const runtime = 'edge'

const SITE_URL = 'https://travelscapsule.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // Homepage — highest priority
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'en': SITE_URL,
          'x-default': SITE_URL,
        },
      },
    },
    // Trip form — core conversion page
    {
      url: `${SITE_URL}/trip`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Legal pages
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Note: /share/[tripId] pages are dynamic and crawled via internal links
    // Note: /result/[tripId], /preview/[tripId], /checklist/[tripId] are noindex (private)
  ]
}

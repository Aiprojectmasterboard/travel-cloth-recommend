import type { MetadataRoute } from 'next'

export const runtime = 'edge'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/trip', '/share/', '/legal/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
      // AI crawlers (GEO: Generative Engine Optimization)
      {
        userAgent: 'GPTBot',
        allow: ['/', '/trip', '/share/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/trip', '/share/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/trip', '/share/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/trip', '/share/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/share/'],
        disallow: ['/api/', '/result/', '/preview/', '/checklist/', '/account/', '/auth/'],
      },
    ],
    sitemap: 'https://travelscapsule.com/sitemap.xml',
    host: 'https://travelscapsule.com',
  }
}

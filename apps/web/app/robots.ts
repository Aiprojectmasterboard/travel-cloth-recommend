import type { MetadataRoute } from 'next'

export const runtime = 'edge'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block API routes and private result pages from indexing
        disallow: ['/api/', '/result/'],
      },
      {
        // Allow AI crawlers that respect robots.txt (GEO: Generative Engine Optimization)
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
    ],
    sitemap: 'https://travelcapsule.ai/sitemap.xml',
    host: 'https://travelcapsule.ai',
  }
}

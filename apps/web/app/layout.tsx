import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import { LanguageProvider } from '@/components/LanguageContext'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

export const runtime = 'edge'

// ─── Fonts ────────────────────────────────────────────────────────────────────

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_URL = 'https://travelcapsule.ai'
const SITE_NAME = 'Travel Capsule AI'

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Travel Capsule AI — AI Travel Outfit Styling | Capsule Wardrobe',
    template: '%s | Travel Capsule AI',
  },

  description:
    'AI analyzes your destination\'s weather and city vibe to generate personalized outfit images. Capsule wardrobe (8–12 items) + daily outfit plan for Paris, Tokyo, Rome, Barcelona and more. Just $5, no subscription.',

  keywords: [
    'AI travel outfit',
    'travel capsule wardrobe',
    'AI fashion styling',
    'trip outfit generator',
    'travel style AI',
    'Paris outfit ideas',
    'Tokyo travel fashion',
    'Rome outfit guide',
    'Barcelona travel style',
    'city outfit planner',
    'AI outfit generator',
    'travel wardrobe planner',
    'packing list AI',
    'what to wear traveling',
    'travel fashion AI',
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // ─── Robots ─────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // ─── Canonical + hreflang (GEO) ─────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en': SITE_URL,
      'ko-KR': `${SITE_URL}/ko`,
      'x-default': SITE_URL,
    },
  },

  // ─── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Travel Capsule AI — AI Travel Outfit Styling',
    description:
      'Generate AI outfit images for Paris, Tokyo, Rome and more. Capsule wardrobe + daily outfit plan. $5/trip.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Travel Capsule AI — AI Travel Outfit Styling',
      },
    ],
  },

  // ─── Twitter Card ────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@travelcapsuleai',
    creator: '@travelcapsuleai',
    title: 'Travel Capsule AI — AI Travel Outfit Styling',
    description: 'AI outfit images for Paris, Tokyo, Rome and more. $5/trip, no subscription.',
    images: ['/og-image.png'],
  },

  // ─── Icons ───────────────────────────────────────────────────────────────────
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },

  // ─── Additional meta (GEO geographic signals) ────────────────────────────────
  other: {
    // Language / content signals
    'DC.language': 'en',
    'DC.title': 'Travel Capsule AI — AI Travel Outfit Styling',
    'DC.description':
      'AI analyzes city weather and vibes to generate outfit images. Capsule wardrobe + daily plan. $5/trip.',
    // AI search engine (GEO: Generative Engine Optimization) signals
    'content-language': 'en',
    'revisit-after': '7 days',
    rating: 'general',
  },
}

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description:
    'AI travel styling service. Generate outfit images for Paris, Tokyo, Rome and more. Capsule wardrobe + daily outfit plan. $5 per trip.',
  inLanguage: ['ko-KR', 'en-US'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    'AI-powered travel outfit styling service. Analyzes city climate and vibes to generate personalized outfit images.',
  foundingDate: '2025',
  areaServed: 'Worldwide',
  serviceType: 'AI Travel Styling',
}

const jsonLdProduct = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Travel Capsule AI — AI Travel Outfit Styling',
  description:
    'AI weather & vibe analysis → 3–4 outfit images per city. Capsule wardrobe (8–12 items) + daily outfit plan. Supports Paris, Tokyo, Rome, Barcelona and more worldwide.',
  brand: {
    '@type': 'Brand',
    name: SITE_NAME,
  },
  offers: {
    '@type': 'Offer',
    price: '5.00',
    priceCurrency: 'USD',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
    url: SITE_URL,
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  },
  category: 'Travel & Fashion AI Service',
  audience: {
    '@type': 'Audience',
    audienceType: 'Travelers',
  },
}

const jsonLdService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AI Travel Outfit Styling',
  serviceType: 'AI Fashion Styling for Travelers',
  provider: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
  description:
    'Generate AI outfit images tailored to each city\'s climate and vibe. Covers cities like Paris, Tokyo, Rome, Barcelona, Bali, London, Prague, Amsterdam and more.',
  areaServed: {
    '@type': 'Country',
    name: 'Worldwide',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Travel Capsule AI Plans',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Single Trip Package',
          description:
            'AI outfit images for up to 5 cities + capsule wardrobe 8–12 items + daily outfit plan',
        },
        price: '5.00',
        priceCurrency: 'USD',
      },
    ],
  },
}

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I have to upload a photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. We can generate outfit images using an AI model without your photo. If you want outfit images featuring your own face, uploading a photo is recommended.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to my photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your photo is used only for image generation and deleted from our servers immediately after. It is never shared externally or used for AI training.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Typically 2–4 minutes after payment. The more cities you include, the slightly longer it may take.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many cities can I add?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Up to 5 cities per trip. Support for more cities is coming soon.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I get a refund?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If the generated images are clearly incorrect, we offer a 100% refund within 24 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work for any type of trip?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — worldwide city coverage with seasonal climate and city vibe analysis. Works for business trips, honeymoons, backpacking, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Travel Capsule AI support cities worldwide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Travel Capsule AI supports major cities worldwide including Paris, Tokyo, Rome, Barcelona, Bali, London, Amsterdam, Prague and more. The AI analyzes local climate, season, and city vibes for each destination.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AI generate outfit images for my trip?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI fetches real-time climate data for your travel dates, analyzes the city\'s cultural vibe and style trends, then generates 3–4 outfit images per city using NanoBanana API with optional face preservation from your uploaded photo.',
      },
    },
  ],
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
        {/* Theme color */}
        <meta name="theme-color" content="#C4714C" />
        {/* Google Search Console — add verification code when ready */}
        {/* <meta name="google-site-verification" content="YOUR_CODE_HERE" /> */}
        {/* Material Symbols Outlined — used for icons throughout the UI */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
        {/* Userback — user feedback widget */}
        <Script
          id="userback-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.Userback = window.Userback || {};
              Userback.access_token = "A-4I76V4OTeft0kQmHdKsMhSZZT";
              (function(d) {
                var s = d.createElement('script');
                s.async = true;
                s.src = 'https://static.userback.io/widget/v1.js';
                (d.head || d.body).appendChild(s);
              })(document);
            `,
          }}
        />
      </body>
    </html>
  )
}

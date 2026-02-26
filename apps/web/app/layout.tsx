import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

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
    default: 'Travel Capsule AI — AI 여행 코디 이미지 생성 | 캡슐 워드로브',
    template: '%s | Travel Capsule AI',
  },

  description:
    '여행지 날씨·분위기 분석으로 내 얼굴이 담긴 코디 이미지를 생성합니다. 파리·도쿄·로마·바르셀로나 등 전 세계 도시별 캡슐 워드로브 8–12개 + 데일리 아웃핏 플랜. 단 $5, 구독 없음.',

  keywords: [
    // Korean keywords
    'AI 여행 스타일링',
    '여행 코디 이미지',
    '캡슐 워드로브',
    '여행 패션 AI',
    '코디 추천',
    '여행 옷 추천',
    '파리 코디',
    '도쿄 여행 패션',
    // English keywords (GEO: global reach)
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
      'ko-KR': SITE_URL,
      'x-default': SITE_URL,
    },
  },

  // ─── Open Graph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    alternateLocale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Travel Capsule AI — AI 여행 코디 이미지 생성',
    description:
      '내 사진으로 파리·도쿄·로마 등 여행지별 AI 코디 이미지를 생성하세요. 캡슐 워드로브 + 데일리 아웃핏 플랜 포함. $5/trip.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Travel Capsule AI — AI 여행 코디 이미지 생성',
      },
    ],
  },

  // ─── Twitter Card ────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@travelcapsuleai',
    creator: '@travelcapsuleai',
    title: 'Travel Capsule AI — AI 여행 코디 이미지 생성',
    description: '내 사진으로 파리·도쿄·로마 AI 코디 이미지 생성. $5/trip, 구독 없음.',
    images: ['/og-image.png'],
  },

  // ─── Icons ───────────────────────────────────────────────────────────────────
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },

  // ─── Additional meta (GEO geographic signals) ────────────────────────────────
  other: {
    // Geographic meta tags — service origin is Korea, global target
    'geo.region': 'KR',
    'geo.placename': 'Seoul, South Korea',
    'geo.position': '37.5665;126.9780',
    ICBM: '37.5665, 126.9780',
    // Language / content signals
    'DC.language': 'ko',
    'DC.title': 'Travel Capsule AI — AI 여행 코디 이미지 생성',
    'DC.description':
      '여행지별 날씨·바이브 분석 AI 코디 이미지 생성. 캡슐 워드로브 + 데일리 플랜. $5/trip.',
    // AI search engine (GEO: Generative Engine Optimization) signals
    'content-language': 'ko',
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
  name: 'Travel Capsule AI 여행 스타일링',
  description:
    '여행지별 날씨·바이브 분석 → AI 코디 이미지 3–4장/도시 생성. 캡슐 워드로브 8–12개 + 데일리 아웃핏 플랜 포함. 파리·도쿄·로마·바르셀로나 등 전 세계 지원.',
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
      name: '사진을 꼭 올려야 하나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '아니요. 사진 없이도 AI 모델 기반으로 생성합니다. 단, 내 얼굴이 담긴 코디 이미지를 원하신다면 업로드를 추천해요.',
      },
    },
    {
      '@type': 'Question',
      name: '사진은 어떻게 처리되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '이미지 생성에만 사용되며 생성 완료 후 서버에서 즉시 삭제됩니다. 외부 공유, 학습 활용 없습니다.',
      },
    },
    {
      '@type': 'Question',
      name: '얼마나 걸리나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '결제 후 보통 2–4분 내에 완성됩니다. 도시 수가 많을수록 조금 더 걸릴 수 있어요.',
      },
    },
    {
      '@type': 'Question',
      name: '도시 수에 제한이 있나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'MVP 기준 최대 5개 도시까지 가능합니다. 이 이상은 곧 지원 예정이에요.',
      },
    },
    {
      '@type': 'Question',
      name: '환불이 되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '생성된 이미지가 명백히 잘못된 경우 24시간 내 100% 환불해드립니다.',
      },
    },
    {
      '@type': 'Question',
      name: '어떤 여행에도 맞나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '전 세계 도시 지원, 계절·기후·도시 바이브를 분석해 제안합니다. 비즈니스 트립, 허니문, 배낭여행 모두 OK.',
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
    <html lang="ko" className={`${playfair.variable} ${dmSans.variable}`}>
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
      </head>
      <body>{children}</body>
    </html>
  )
}

import { defineConfig, Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/* ─── SEO Pre-render Plugin ──────────────────────────────────────────────────
 * Generates per-route HTML files with unique <title>, <meta>, <link canonical>,
 * and Open Graph tags so that Googlebot sees page-specific content without JS.
 * Cloudflare Pages serves e.g. dist/examples/pro/index.html for /examples/pro
 * BEFORE falling back to the SPA _redirects rule.
 * ───────────────────────────────────────────────────────────────────────────── */
interface PageSEO {
  path: string
  title: string
  description: string
  ogImage?: string
  robots?: string
}

const SITE_URL = 'https://travelscapsule.com'
const DEFAULT_OG = `${SITE_URL}/og-image.png`

const SEO_PAGES: PageSEO[] = [
  {
    path: 'onboarding/1',
    title: 'Start Planning Your Trip — AI Travel Stylist | Travel Capsule AI',
    description:
      'Choose your destination city and travel dates. Our AI analyzes real-time weather, local fashion culture, and your body profile to create a personalized capsule wardrobe. 100+ cities supported.',
  },
  {
    path: 'examples/pro',
    title: 'Pro Plan Example — 4 AI Outfit Images per City | Travel Capsule AI',
    description:
      'See how Travel Capsule AI generates 4 personalized outfit images per city. Weather-adaptive styling, capsule wardrobe packing list, and day-by-day outfit plan. Pro plan from $3.99.',
  },
  {
    path: 'examples/annual',
    title: 'Annual Plan Example — Premium AI Travel Styling | Travel Capsule AI',
    description:
      'Explore the Annual plan: 12 trips per year, priority AI generation, VIP concierge, and Style DNA analysis. Multi-city outfit planning with AI-generated images. $9.99/year.',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy — Data Protection & Photo Security | Travel Capsule AI',
    description:
      'How Travel Capsule AI protects your data. Photos are deleted immediately after AI processing. No tracking cookies beyond analytics. GDPR-compliant data handling.',
  },
  {
    path: 'terms',
    title: 'Terms of Service | Travel Capsule AI',
    description:
      'Terms and conditions for using Travel Capsule AI. AI-powered travel outfit planning service. One-time and subscription pricing. Refund policy and usage limits.',
  },
  {
    path: 'contact',
    title: 'Contact Us — Support & Partnerships | Travel Capsule AI',
    description:
      'Get in touch with the Travel Capsule AI team. Customer support, partnership inquiries, press requests, and feedback. Email: netson94@gmail.com.',
  },
  {
    path: 'sitemap',
    title: 'Sitemap — All Pages | Travel Capsule AI',
    description:
      'Browse all pages of Travel Capsule AI. AI-powered travel outfit planner for 100+ cities worldwide. Plan your capsule wardrobe today.',
  },
]

function seoPrerender(): Plugin {
  return {
    name: 'vite-plugin-seo-prerender',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const templatePath = path.join(distDir, 'index.html')
      if (!fs.existsSync(templatePath)) return

      const template = fs.readFileSync(templatePath, 'utf-8')

      for (const page of SEO_PAGES) {
        const fullTitle = page.title
        const fullUrl = `${SITE_URL}/${page.path}`
        const ogImage = page.ogImage || DEFAULT_OG
        const robots = page.robots || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'

        let html = template
          // <title>
          .replace(
            /<title>[^<]*<\/title>/,
            `<title>${fullTitle}</title>`
          )
          // <meta name="title">
          .replace(
            /<meta name="title" content="[^"]*"/,
            `<meta name="title" content="${fullTitle}"`
          )
          // <meta name="description">
          .replace(
            /<meta name="description" content="[^"]*"/,
            `<meta name="description" content="${page.description}"`
          )
          // <link rel="canonical">
          .replace(
            /<link rel="canonical" href="[^"]*"/,
            `<link rel="canonical" href="${fullUrl}"`
          )
          // <meta name="robots">
          .replace(
            /<meta name="robots" content="[^"]*"/,
            `<meta name="robots" content="${robots}"`
          )
          // <meta name="googlebot">
          .replace(
            /<meta name="googlebot" content="[^"]*"/,
            `<meta name="googlebot" content="${robots}"`
          )
          // Open Graph
          .replace(
            /<meta property="og:title" content="[^"]*"/,
            `<meta property="og:title" content="${fullTitle}"`
          )
          .replace(
            /<meta property="og:description" content="[^"]*"/,
            `<meta property="og:description" content="${page.description}"`
          )
          .replace(
            /<meta property="og:url" content="[^"]*"/,
            `<meta property="og:url" content="${fullUrl}"`
          )
          .replace(
            /<meta property="og:image" content="[^"]*"/,
            `<meta property="og:image" content="${ogImage}"`
          )
          // Twitter
          .replace(
            /<meta name="twitter:title" content="[^"]*"/,
            `<meta name="twitter:title" content="${fullTitle}"`
          )
          .replace(
            /<meta name="twitter:description" content="[^"]*"/,
            `<meta name="twitter:description" content="${page.description}"`
          )
          .replace(
            /<meta name="twitter:url" content="[^"]*"/,
            `<meta name="twitter:url" content="${fullUrl}"`
          )
          .replace(
            /<meta name="twitter:image" content="[^"]*"/,
            `<meta name="twitter:image" content="${ogImage}"`
          )

        // Hreflang: update to page-specific URLs
        const langs = ['en', 'ko', 'ja', 'zh', 'fr', 'es']
        for (const lang of langs) {
          const langUrl = lang === 'en'
            ? fullUrl
            : `${fullUrl}?lang=${lang}`
          html = html.replace(
            new RegExp(`<link rel="alternate" hreflang="${lang}" href="[^"]*"`),
            `<link rel="alternate" hreflang="${lang}" href="${langUrl}"`
          )
        }
        html = html.replace(
          /<link rel="alternate" hreflang="x-default" href="[^"]*"/,
          `<link rel="alternate" hreflang="x-default" href="${fullUrl}"`
        )

        // Write to dist/<path>/index.html
        const outDir = path.join(distDir, page.path)
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8')
        console.log(`  ✅ SEO pre-rendered: /${page.path}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    seoPrerender(),
  ],
  base: '/',
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

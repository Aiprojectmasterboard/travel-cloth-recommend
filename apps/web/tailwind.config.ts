import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b8552e',
        secondary: '#1A1410',
        sand: '#F5EFE6',
        ink: '#1A1410',
        terracotta: '#C4613A',
        muted: '#8A7B6E',
        cream: '#FDF8F3',
        'warm-white': '#FAF6F0',
        gold: '#D4AF37',
        weatherBlue: '#E0F2FE',
      },
      fontFamily: {
        // Latin headings → Korean → Japanese → Chinese serif fallback chain
        playfair: [
          'var(--font-playfair)',
          'Playfair Display',
          'var(--font-korean-serif)',
          'Noto Serif KR',
          'var(--font-japanese-serif)',
          'Noto Serif JP',
          'var(--font-chinese-serif)',
          'Noto Serif SC',
          'serif',
        ],
        // UI / body → Korean → Japanese → Chinese sans fallback chain
        sans: [
          'var(--font-sans)',
          'Plus Jakarta Sans',
          'var(--font-korean-sans)',
          'Noto Sans KR',
          'var(--font-japanese-sans)',
          'Noto Sans JP',
          'var(--font-chinese-sans)',
          'Noto Sans SC',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config

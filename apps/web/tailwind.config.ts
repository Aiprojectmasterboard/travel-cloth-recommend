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
        // Latin headings → Korean serif fallback (replaces ugly system brush font)
        playfair: ['var(--font-playfair)', 'Playfair Display', 'var(--font-korean-serif)', 'Noto Serif KR', 'serif'],
        // UI / body → Korean sans fallback
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'var(--font-korean-sans)', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

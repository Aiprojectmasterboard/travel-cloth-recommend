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
        sand: '#F5EFE6',
        ink: '#1A1410',
        terracotta: '#C4613A',
        muted: '#8A7B6E',
        cream: '#FDFAF6',
        'warm-white': '#FAF6F0',
        gold: '#C8A96E',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

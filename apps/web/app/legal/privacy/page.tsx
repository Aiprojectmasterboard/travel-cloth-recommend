import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <header className="border-b border-[#F5EFE6] px-6 py-4">
        <Link
          href="/"
          className="font-bold text-[#1A1410] text-lg tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Travel <span className="italic text-[#b8552e]">Capsule</span> AI
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1
          className="text-4xl font-bold italic text-[#1A1410] mb-4"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Privacy Policy
        </h1>
        <p className="text-[#9c8c7e] mb-8 text-sm">Coming soon.</p>
        <p className="text-[#1A1410]/70 text-sm leading-relaxed">
          Our full Privacy Policy will be published here shortly. For any questions, please contact us at{' '}
          <a href="mailto:hello@travelcapsule.ai" className="text-[#b8552e] hover:underline">
            hello@travelcapsule.ai
          </a>
          .
        </p>
        <Link
          href="/"
          className="inline-block mt-8 text-sm text-[#b8552e] hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  )
}

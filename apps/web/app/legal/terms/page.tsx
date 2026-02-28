import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Travel Capsule AI',
}

export default function TermsPage() {
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
        <p className="text-xs font-semibold uppercase tracking-widest text-[#b8552e] mb-3">Legal</p>
        <h1
          className="text-4xl font-bold italic text-[#1A1410] mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Terms of Service
        </h1>
        <p className="text-sm text-[#9c8c7e] mb-10">Last updated: February 2026</p>

        <div className="space-y-10 text-[#1A1410]/80 text-sm leading-relaxed">

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              1. Service Description
            </h2>
            <p>
              Travel Capsule AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;) is an AI-powered
              travel styling tool operated by Travel Capsule AI. By using this Service you agree to
              these Terms. If you do not agree, please do not use the Service.
            </p>
            <p className="mt-3">
              The Service generates AI-created travel wardrobe recommendations, outfit images, and
              packing plans based on information you provide (destination, travel month, and an
              optional photo). Results are AI-generated suggestions only and do not constitute
              professional styling or fashion advice.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              2. User Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must be at least 16 years old to use this Service.</li>
              <li>You are responsible for any content you upload, including photos.</li>
              <li>
                You agree not to misuse the Service, attempt to reverse-engineer its AI models, or
                use it for any unlawful purpose.
              </li>
              <li>
                Free tier usage is limited to 5 requests per day per session. Excessive or
                automated usage may be restricted.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              3. Payment Terms
            </h2>
            <p>
              We offer one-time purchases (Standard at $5, Pro at $12) and an annual subscription
              (Annual at $29/year, limited to 12 trips per year). Payments are processed securely
              by Polar.
            </p>
            <p className="mt-3">
              <strong>Refund policy:</strong> Due to the immediate delivery of AI-generated digital
              content, all sales are final. We will consider refund requests made within 24 hours of
              purchase if the Service failed to deliver results due to a technical error on our part.
              Contact us at{' '}
              <a href="mailto:hello@travelscapsule.com" className="text-[#b8552e] hover:underline">
                hello@travelscapsule.com
              </a>{' '}
              to request a refund.
            </p>
            <p className="mt-3">
              Annual subscriptions auto-renew each year. You may cancel at any time from your account
              settings; cancellation takes effect at the end of the current billing period.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              4. Content Ownership &amp; Limitations
            </h2>
            <p>
              AI-generated images and recommendations delivered to you are for your personal,
              non-commercial use. We do not claim ownership of images you upload. You retain all
              rights to your original photos.
            </p>
            <p className="mt-3">
              The Service is provided &ldquo;as is.&rdquo; We make no warranties regarding accuracy,
              fitness for a particular purpose, or uninterrupted availability. We are not liable for
              indirect or consequential damages arising from use of the Service.
            </p>
            <p className="mt-3">
              We reserve the right to modify or discontinue the Service at any time with reasonable
              notice to users.
            </p>
          </section>

        </div>

        <p className="mt-12 text-sm text-[#9c8c7e]">
          Questions? Email us at{' '}
          <a href="mailto:hello@travelscapsule.com" className="text-[#b8552e] hover:underline">
            hello@travelscapsule.com
          </a>
          .
        </p>

        <Link
          href="/"
          className="inline-block mt-6 text-sm text-[#b8552e] hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  )
}

import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Travel Capsule AI',
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
        <p className="text-xs font-semibold uppercase tracking-widest text-[#b8552e] mb-3">Legal</p>
        <h1
          className="text-4xl font-bold italic text-[#1A1410] mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-[#9c8c7e] mb-10">Last updated: February 2026</p>

        <div className="space-y-10 text-[#1A1410]/80 text-sm leading-relaxed">

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              1. What We Collect
            </h2>
            <p>We collect only what is necessary to provide the Service:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                <strong>Email address</strong> — if you choose to receive your mood card by email or
                create an account.
              </li>
              <li>
                <strong>Travel preferences</strong> — destination cities, travel month, and any
                travel context you provide.
              </li>
              <li>
                <strong>Optional photo</strong> — a face photo you upload for personalized AI image
                generation. This is strictly optional.
              </li>
              <li>
                <strong>Usage data</strong> — anonymous request counts and session identifiers used
                to enforce rate limits and prevent abuse. No personal identifiers are stored in these
                records.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              2. How We Use Your Data
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To generate your personalized travel wardrobe and outfit images.</li>
              <li>To send your mood card or result link to your email address (if requested).</li>
              <li>To process payment and manage your subscription or one-time purchase.</li>
              <li>
                <strong>Uploaded photos</strong> are used solely to generate your requested AI images
                and are permanently deleted from our storage immediately after generation completes.
                We do not retain, share, or use photos for model training.
              </li>
            </ul>
            <p className="mt-3">
              We do not use your data for advertising, and we do not sell your personal information
              to any third party.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              3. Data Processors
            </h2>
            <p>We use the following sub-processors to operate the Service:</p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                <strong>Supabase</strong> — database storage for trip data and email captures (EU
                region available).
              </li>
              <li>
                <strong>Cloudflare</strong> — edge computing, image storage (R2), and bot protection
                (Turnstile).
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery.
              </li>
              <li>
                <strong>Polar</strong> — payment processing (acts as Merchant of Record).
              </li>
              <li>
                <strong>Anthropic</strong> — AI text generation for style and wardrobe
                recommendations.
              </li>
            </ul>
            <p className="mt-3">
              Each processor is contractually bound to handle your data only as directed by us and in
              compliance with applicable data protection law.
            </p>
          </section>

          <section>
            <h2
              className="text-xl font-bold text-[#1A1410] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              4. Your Rights
            </h2>
            <p>
              If you are located in the EU/EEA or UK, you have rights under GDPR including the right
              to access, correct, or delete your personal data. You may request deletion of your
              account and associated data at any time from your account settings or by emailing us.
            </p>
            <p className="mt-3">
              To exercise any of your rights, contact us at{' '}
              <a href="mailto:hello@travelscapsule.com" className="text-[#b8552e] hover:underline">
                hello@travelscapsule.com
              </a>
              . We will respond within 30 days.
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

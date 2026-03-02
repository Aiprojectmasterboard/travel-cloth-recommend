import React from "react";
import { useNavigate } from "react-router";
import { Icon } from "../components/travel-capsule";

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "privacy@travelscapsule.com";

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50 bg-[#FDF8F3]/90 backdrop-blur-sm">
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "1200px" }}>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[16px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Travel Capsule
            </span>
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
            <Icon name="arrow_back" size={16} /> Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto px-6 py-16 pb-24" style={{ maxWidth: "720px" }}>
        <div className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            Legal
          </span>
          <h1 className="mt-3 text-[#1A1410]" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p className="mt-3 text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
            Effective: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose-custom space-y-10">
          <Section title="Overview">
            <p>
              Travel Capsule AI ("we," "us," or "our") operates TravelsCapsule.com, an AI-powered travel styling service. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
            </p>
            <p>
              We are committed to minimizing data collection. Most of our service works without a user account. We never sell your personal data.
            </p>
          </Section>

          <Section title="Information We Collect">
            <SubSection label="Information you provide">
              <ul>
                <li><strong>Destination & travel month</strong> — Required to generate weather and style analysis. Up to 5 cities per trip.</li>
                <li><strong>Style preferences</strong> — Gender, aesthetics, height, and weight (all optional). Used only to personalize outfit suggestions.</li>
                <li><strong>Reference photo</strong> — Entirely optional. If provided, used solely to inform AI-generated outfit imagery.</li>
                <li><strong>Email address</strong> — Only if you choose to receive your mood card by email. We do not create accounts or require sign-in.</li>
              </ul>
            </SubSection>
            <SubSection label="Automatically collected">
              <ul>
                <li><strong>Session identifier</strong> — A temporary ID stored in your browser to associate your trip with results. Not linked to your identity.</li>
                <li><strong>IP address</strong> — Used only for rate limiting (max 5 free generations per day) and security. Not stored long-term.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="Your Reference Photo — Critical Note">
            <p>
              If you upload a photo, it is stored temporarily in our secure cloud storage (Cloudflare R2) during AI image generation only.
            </p>
            <p className="font-semibold text-[#C4613A]">
              Your photo is permanently deleted immediately after AI image generation completes — typically within 60 seconds. We do not retain, analyze, or use your photo for any other purpose.
            </p>
            <p>
              Generated outfit images may reflect stylistic elements inspired by your photo, but the original photo file is irrecoverably deleted and never shared.
            </p>
          </Section>

          <Section title="How We Use Your Information">
            <ul>
              <li>Generate personalized weather analysis and outfit recommendations for your trip</li>
              <li>Send your mood card to your email address (only if you explicitly request it)</li>
              <li>Enforce usage limits (free: 5 trips/day; Annual plan: 12 trips/year)</li>
              <li>Prevent abuse and bot activity via Cloudflare Turnstile</li>
              <li>Process payments securely via Polar (our payment provider)</li>
            </ul>
          </Section>

          <Section title="Third-Party Services">
            <p>We use the following third-party services, each with their own privacy policies:</p>
            <ul>
              <li><strong>Polar (polar.sh)</strong> — Payment processing. Acts as Merchant of Record. Handles billing, tax, and receipts. We do not store your card details.</li>
              <li><strong>Cloudflare</strong> — Infrastructure (Workers, R2 storage, Turnstile bot protection, Pages hosting).</li>
              <li><strong>Supabase</strong> — Database for trip data and generation results.</li>
              <li><strong>Resend</strong> — Transactional email delivery (mood cards, receipts).</li>
              <li><strong>Google Places API</strong> — City name autocomplete in the trip form.</li>
              <li><strong>Google Gemini API</strong> — AI image generation for outfit visuals.</li>
              <li><strong>Anthropic Claude API</strong> — AI text generation for style analysis and capsule wardrobe curation.</li>
              <li><strong>Open-Meteo</strong> — Weather data. No API key or account required; no personal data sent.</li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <ul>
              <li><strong>Reference photos:</strong> Deleted immediately after generation (≤ 60 seconds)</li>
              <li><strong>Generated outfit images:</strong> Stored in Cloudflare R2 for 48 hours, then automatically deleted</li>
              <li><strong>Trip data:</strong> Retained for 30 days to allow result retrieval, then deleted</li>
              <li><strong>Email addresses:</strong> Retained until you unsubscribe or request deletion</li>
              <li><strong>Order records:</strong> Retained for 7 years for accounting compliance (handled by Polar)</li>
            </ul>
          </Section>

          <Section title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Request access to the personal data we hold about you</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing emails at any time (unsubscribe link in every email)</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#C4613A] underline underline-offset-2">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="Cookies & Tracking">
            <p>
              We do not use advertising trackers or third-party analytics cookies. We use a single session cookie to associate your browser with your trip results. This cookie contains no personal information and expires when you close your browser.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify registered email subscribers of material changes. The effective date at the top of this page will always reflect the most recent version.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#C4613A] underline underline-offset-2">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

/* ── Shared subcomponents ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[20px] text-[#1A1410] mb-3" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
        {title}
      </h2>
      <div className="text-[15px] text-[#57534e] leading-relaxed space-y-3" style={{ fontFamily: "var(--font-body)" }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] uppercase tracking-[0.08em] text-[#292524] mb-2" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{label}</p>
      <div className="text-[15px] text-[#57534e] leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function LegalFooter() {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-[#EFE8DF] py-8 px-6 bg-white">
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" style={{ maxWidth: "720px" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
          <Icon name="luggage" size={18} className="text-[#C4613A]" />
          <span className="text-[14px] text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule</span>
        </button>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate("/privacy")} className="text-[11px] uppercase tracking-[0.08em] text-[#C4613A] cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>Privacy</button>
          <button onClick={() => navigate("/terms")} className="text-[11px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Terms</button>
          <button onClick={() => navigate("/contact")} className="text-[11px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Contact</button>
        </div>
      </div>
    </footer>
  );
}

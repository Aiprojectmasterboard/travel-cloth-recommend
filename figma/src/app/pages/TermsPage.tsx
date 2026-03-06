import React from "react";
import { useNavigate } from "react-router";
import { Icon } from "../components/travel-capsule";

const EFFECTIVE_DATE = "March 1, 2026";
const CONTACT_EMAIL = "netson94@gmail.com";

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50 bg-[#FDF8F3]/90 backdrop-blur-sm">
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "1200px" }}>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[16px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Travel Capsule AI
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
            Terms of Service
          </h1>
          <p className="mt-3 text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
            Effective: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="space-y-10">
          <Section title="Acceptance of Terms">
            <p>
              By accessing or using TravelsCapsule.com ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </Section>

          <Section title="What the Service Provides">
            <p>
              Travel Capsule AI is a digital styling service that generates personalized travel capsule wardrobes using AI. Given a destination city, travel month, and optional style preferences, the Service produces:
            </p>
            <ul>
              <li>Weather analysis for your destination</li>
              <li>A city "vibe" mood and style profile</li>
              <li>AI-generated outfit imagery</li>
              <li>A capsule wardrobe item list</li>
              <li>A day-by-day outfit plan</li>
            </ul>
            <p>
              Results are generated using AI and are intended as creative style inspiration, not professional fashion advice.
            </p>
          </Section>

          <Section title="Plans & Pricing">
            <div className="space-y-4">
              <PlanBox
                name="Standard — Free"
                type="One-time purchase"
                items={[
                  "1 AI outfit image (full resolution) + 3 unlocked previews",
                  "Full capsule wardrobe item list",
                  "Day-by-day outfit plan",
                  "No expiry on results",
                ]}
              />
              <PlanBox
                name="Pro — $3.99"
                type="One-time purchase"
                items={[
                  "4–6 AI outfit images per city (ultra hi-res)",
                  "Multi-city capsule wardrobe",
                  "1 free regeneration",
                  "Hi-res export",
                  "No expiry on results",
                ]}
              />
              <PlanBox
                name="Annual — $9.99/year"
                type="Annual subscription — auto-renews yearly"
                items={[
                  "All Pro benefits included",
                  "Up to 12 trips per year (server-enforced)",
                  "Exceeding 12 trips returns a 429 error — additional trips require upgrade",
                  "Subscription renews automatically on your anniversary date",
                  "Cancel anytime before renewal to avoid being charged",
                ]}
              />
            </div>
            <p className="mt-4 text-[13px] text-[#57534e]/70 italic" style={{ fontFamily: "var(--font-body)" }}>
              All prices are in USD. Taxes may apply depending on your location and are handled by our payment processor.
            </p>
          </Section>

          <Section title="Payment & Billing">
            <p>
              All payments are processed by <strong>Polar (polar.sh)</strong>, our Merchant of Record. Polar handles billing, tax calculation, and compliance on our behalf. By purchasing, you also agree to{" "}
              <a href="https://polar.sh/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[#C4613A] underline underline-offset-2">Polar's Terms of Service</a>.
            </p>
            <p>
              We do not store or have access to your payment card information. All payment data is handled exclusively by Polar and their payment infrastructure.
            </p>
            <p>
              For the Annual plan, your subscription will automatically renew each year unless you cancel before the renewal date. You will receive a reminder email before renewal.
            </p>
          </Section>

          <Section title="Refund Policy">
            <p>
              Because our Service delivers AI-generated digital content immediately upon purchase, <strong>all sales are final</strong>. We do not offer refunds once image generation has begun or completed.
            </p>
            <p>
              Exceptions: If a technical error on our end prevents delivery of results, or if you are charged but the Service fails entirely, please contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#C4613A] underline underline-offset-2">{CONTACT_EMAIL}</a>{" "}
              and we will make it right.
            </p>
            <p>
              For Annual subscription refunds, Polar's standard refund policy applies within the first 14 days of initial purchase if no trips have been generated.
            </p>
          </Section>

          <Section title="AI-Generated Content">
            <p>
              All outfit images, wardrobe suggestions, and style recommendations are generated by AI (Google Gemini and Anthropic Claude). By using the Service, you acknowledge:
            </p>
            <ul>
              <li>AI outputs are creative suggestions, not professional fashion or travel advice</li>
              <li>Images may not perfectly represent real clothing items or brands</li>
              <li>Results may vary between generations even with identical inputs</li>
              <li>You may use generated images for personal, non-commercial purposes</li>
              <li>You may not resell or redistribute AI-generated images as your own work</li>
            </ul>
          </Section>

          <Section title="Your Reference Photo">
            <p>
              If you upload a photo, you grant us a temporary, limited license to use it solely for generating your outfit images. <strong>Your photo is permanently deleted within 60 seconds of generation completing.</strong> We make no claim of ownership over photos you upload.
            </p>
            <p>
              By uploading a photo, you confirm that you own the rights to the image and that its use complies with these Terms.
            </p>
          </Section>

          <Section title="Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to bypass rate limits, payment gates, or the Annual trip counter</li>
              <li>Upload photos of individuals without their consent</li>
              <li>Reverse-engineer, scrape, or automate requests to our API</li>
              <li>Resell access to the Service</li>
            </ul>
          </Section>

          <Section title="Intellectual Property">
            <p>
              The Travel Capsule AI brand, interface, and underlying technology are our intellectual property. You retain ownership of any content you upload (photos). Generated outfit images are provided to you under a personal, non-exclusive license for your own use.
            </p>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              The Service is provided "as is." We make no warranties about the accuracy, completeness, or suitability of AI-generated content for any purpose. To the fullest extent permitted by law, our liability for any claim arising from the Service is limited to the amount you paid for the specific transaction in question.
            </p>
            <p>
              We are not liable for indirect, incidental, or consequential damages.
            </p>
          </Section>

          <Section title="Service Availability">
            <p>
              We aim for high availability but do not guarantee uninterrupted access. Generated results are stored for 48 hours (images) and 30 days (trip data). We recommend downloading your results promptly after generation.
            </p>
          </Section>

          <Section title="Changes to These Terms">
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. Material changes will be communicated via email to registered users.
            </p>
          </Section>

          <Section title="Governing Law">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#C4613A] underline underline-offset-2">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </main>

      <LegalFooter active="terms" />
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

function PlanBox({ name, type, items }: { name: string; type: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8DDD4] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[16px] text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{name}</span>
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#57534e] bg-[#EFE8DF] px-2 py-0.5 rounded-full shrink-0" style={{ fontFamily: "var(--font-mono)" }}>{type}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
            <span className="text-[#C4613A] mt-0.5 shrink-0">·</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalFooter({ active }: { active?: string }) {
  const navigate = useNavigate();
  const link = (label: string, path: string) => (
    <button
      onClick={() => navigate(path)}
      className={`text-[11px] uppercase tracking-[0.08em] transition-colors cursor-pointer ${active === path.slice(1) ? "text-[#C4613A]" : "text-[#57534e] hover:text-[#C4613A]"}`}
      style={{ fontFamily: "var(--font-body)", fontWeight: active === path.slice(1) ? 600 : 500 }}
    >
      {label}
    </button>
  );
  return (
    <footer className="border-t border-[#EFE8DF] py-8 px-6 bg-white">
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" style={{ maxWidth: "720px" }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
          <Icon name="luggage" size={18} className="text-[#C4613A]" />
          <span className="text-[14px] text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
        </button>
        <div className="flex items-center gap-5">
          {link("Privacy", "/privacy")}
          {link("Terms", "/terms")}
          {link("Contact", "/contact")}
        </div>
      </div>
    </footer>
  );
}

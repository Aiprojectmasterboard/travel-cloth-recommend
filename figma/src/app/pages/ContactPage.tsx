import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnPrimary } from "../components/travel-capsule";
import { SEO } from "../components/SEO";

const SUPPORT_EMAIL = "netson94@gmail.com";

export function ContactPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Contact Us" description="Contact Travel Capsule AI for support, feedback, or business inquiries. We're here to help with your AI travel styling experience." />
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

      {/* Hero */}
      <main className="mx-auto px-6 py-16 pb-24" style={{ maxWidth: "720px" }}>
        <div className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            Support
          </span>
          <h1 className="mt-3 text-[#1A1410]" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
            Get in Touch
          </h1>
          <p className="mt-4 text-[16px] text-[#57534e] max-w-[500px] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            We're a small team and we read every message. Typical response time is under 24 hours.
          </p>
        </div>

        {/* Email card */}
        <div className="bg-white rounded-2xl border border-[#E8DDD4] p-8 mb-8" style={{ boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
              <Icon name="mail" size={20} className="text-[#C4613A]" />
            </div>
            <span className="text-[13px] uppercase tracking-[0.1em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              Email Support
            </span>
          </div>
          <p className="text-[18px] sm:text-[24px] text-[#1A1410] mt-4 mb-6 italic break-all" style={{ fontFamily: "var(--font-display)" }}>
            {SUPPORT_EMAIL}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C4613A] text-white rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#b8552e] transition-colors"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              <Icon name="open_in_new" size={14} className="text-white" />
              Open Email App
            </a>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C4613A]/30 text-[#C4613A] rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/5 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              <Icon name={copied ? "check" : "content_copy"} size={14} className="text-[#C4613A]" />
              {copied ? "Copied!" : "Copy Address"}
            </button>
          </div>
        </div>

        {/* FAQ Cards */}
        <h2 className="text-[20px] text-[#1A1410] mb-5" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
          Common Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {/* CTA back */}
        <div className="mt-14 pt-8 border-t border-[#EFE8DF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
            Ready to plan your next trip?
          </p>
          <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>
            <span className="flex items-center gap-2">
              Start Planning
              <Icon name="arrow_forward" size={14} className="text-white" />
            </span>
          </BtnPrimary>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

/* ── FAQ data ── */

const FAQ = [
  {
    q: "I paid but didn't receive my results. What should I do?",
    a: `Email us at ${SUPPORT_EMAIL} with your order confirmation or the email address used at checkout. We'll locate your trip and re-deliver your results within a few hours.`,
  },
  {
    q: "How do I cancel my Annual subscription?",
    a: "You can cancel anytime via the confirmation email from Polar — it includes a link to manage your subscription. Cancellation stops future renewals; you keep access until the end of your billing period.",
  },
  {
    q: "My AI-generated images didn't come out as expected. Can I regenerate?",
    a: "Pro and Annual plans include 1 free regeneration per trip. If you believe a technical error caused poor results, contact us and we'll review your case.",
  },
  {
    q: "I uploaded a photo — is it stored anywhere?",
    a: "No. Your photo is deleted immediately after AI image generation completes (within 60 seconds). We do not retain, share, or analyze your photo for any other purpose.",
  },
  {
    q: "Can I use the generated outfit images on social media?",
    a: "Yes, for personal use. You're welcome to share your AI-generated looks on social media. Commercial resale or redistribution of generated images is not permitted.",
  },
  {
    q: "I'm an Annual member and hit the 12-trip limit. What now?",
    a: "You'll see a 429 error when you try to generate a 13th trip. You can wait for your annual period to reset, or upgrade to a separate Pro purchase for that trip.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-[#E8DDD4] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FDF8F3]/60 transition-colors cursor-pointer"
      >
        <span className="text-[15px] text-[#292524] pr-4" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{q}</span>
        <Icon name={open ? "expand_less" : "expand_more"} size={22} className="text-[#57534e] shrink-0" />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-[14px] text-[#57534e] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{a}</p>
        </div>
      )}
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
          <span className="text-[14px] text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
        </button>
        <div className="flex items-center gap-5">
          <button onClick={() => navigate("/privacy")} className="text-[11px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Privacy</button>
          <button onClick={() => navigate("/terms")} className="text-[11px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Terms</button>
          <button onClick={() => navigate("/contact")} className="text-[11px] uppercase tracking-[0.08em] text-[#C4613A] cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>Contact</button>
        </div>
      </div>
    </footer>
  );
}

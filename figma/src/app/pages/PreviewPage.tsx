import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnSecondary, BtnDark, CheckItem, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useOnboarding } from "../context/OnboardingContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { createCheckoutSession, type PlanKey } from "../services/polarCheckout";

const IMG = {
  paris: "https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMEZyYW5jZSUyMEVpZmZlbCUyMHRvd2VyJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MjQyNjYwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  /* Full-body outfit preview photos */
  outfit1: "https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZ1bGwlMjBsZW5ndGglMjB0cmVuY2glMjBjb2F0JTIwYmVpZ2UlMjBwYXJpcyUyMHN0cmVldCUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzA2MDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  outfit2: "https://images.unsplash.com/photo-1746730921292-bd6be2c256d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWxsJTIwYm9keSUyMHdvbWFuJTIwZWxlZ2FudCUyMGJsYXplciUyMHN0cmVldCUyMHN0eWxlJTIwbWluaW1hbCUyMG91dGZpdHxlbnwxfHx8fDE3NzI0MzA2MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  outfit3: "https://images.unsplash.com/photo-1570298529069-2ca77646dd89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWxsJTIwYm9keSUyMHdvbWFuJTIwY296eSUyMHN3ZWF0ZXIlMjBqZWFucyUyMGF1dHVtbiUyMHdhcm0lMjB0b25lcyUyMG91dGZpdHxlbnwxfHx8fDE3NzI0MzA2MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  outfit4: "https://images.unsplash.com/photo-1587137276455-d0e42050e533?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdWxsJTIwYm9keSUyMHdvbWFuJTIwYmxhY2slMjBldmVuaW5nJTIwb3V0Zml0JTIwZWxlZ2FudCUyMGRpbm5lciUyMG5pZ2h0fGVufDF8fHx8MTc3MjQzMDYwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

const OUTFIT_PREVIEWS = [
  { label: "Day 1 · Arrival", img: IMG.outfit1, style: "Classic Layering" },
  { label: "Day 2 · Galleries", img: IMG.outfit2, style: "Smart Casual" },
  { label: "Day 3 · Museums", img: IMG.outfit3, style: "Cozy Intellectual" },
  { label: "Day 4 · Dinner", img: IMG.outfit4, style: "Evening Elegance" },
];

export function PreviewPage() {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { t, displayFont, bodyFont } = useLang();
  const { isLoggedIn, user, setShowLoginModal } = useAuth();

  const city = data.cities[0]?.city || "Paris";
  const country = data.cities[0]?.country || "France";
  const aestheticLabel = data.aesthetics.length > 0 ? data.aesthetics.join(", ") : "Classic, Minimalist";

  /**
   * Polar Checkout Flow (Compliance: POST /v1/checkouts/ via backend)
   *
   * 1. Client calls createCheckoutSession → your backend
   * 2. Backend creates Polar Checkout Session with OAT (server-side only)
   * 3. Client receives checkout URL & redirects user
   * 4. After payment, Polar redirects to /checkout/success?plan=xxx
   * 5. Success page verifies via GET /v1/checkouts/client/{secret} (no auth needed)
   *
   * Demo mode: Mock checkout → navigate to success → then dashboard
   */
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);

  const handleCheckout = async (plan: PlanKey) => {
    setCheckoutLoading(plan);
    try {
      const session = await createCheckoutSession({
        plan,
        customerEmail: user?.email,
        successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
      });

      if (session.url) {
        // Redirect to Polar's hosted checkout page
        window.location.href = session.url;
      } else {
        // Fallback: demo mode (no Polar URL available)
        navigate(`/checkout/success?plan=${plan}&session_id=${session.clientSecret}`);
      }
    } catch {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={28} className="text-[#C4613A]" />
            <span className="text-[20px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Travel Capsule
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="dark" />
            {isLoggedIn ? (
              <div className="w-8 h-8 rounded-full bg-[#C4613A] flex items-center justify-center">
                <span className="text-white text-[12px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{user?.initials}</span>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer">
                <Icon name="person" size={22} className="text-[#57534e]" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-12" style={{ maxWidth: 1200 }}>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {t("preview.step")}
        </span>

        <h1 className="mt-4 text-[#292524] italic whitespace-pre-line" style={{ fontSize: "clamp(40px, 5vw, 72px)", fontFamily: displayFont, lineHeight: 1.05 }}>
          {t("preview.title")}
        </h1>
        <p className="mt-4 text-[18px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
          {t("preview.body")}
        </p>

        {/* Preview Card */}
        <div className="mt-10 relative rounded-2xl overflow-hidden" style={{ aspectRatio: "21/9" }}>
          <ImageWithFallback src={IMG.paris} alt="Trip preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] p-4 sm:p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <span className="text-[20px] text-white italic" style={{ fontFamily: displayFont }}>Lookbook Preview</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-[75%] bg-[#C4613A] rounded-full" />
            </div>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
              75% AI Analysis Complete
            </span>
          </div>
        </div>

        {/* AI Outfit Preview — Teaser Grid (all 4 locked) */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: displayFont }}>
              AI Outfit Preview
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1410] rounded-full">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>lock</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                Preview locked — unlock after purchase
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OUTFIT_PREVIEWS.map((outfit) => (
              <div key={outfit.label} className="group">
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  <ImageWithFallback
                    src={outfit.img}
                    alt={outfit.label}
                    className="w-full h-full object-cover transition-transform duration-500"
                    style={{ filter: "blur(12px) brightness(0.7)", transform: "scale(1.1)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Lock overlay for all images */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>lock</span>
                    </div>
                    <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                      Unlock
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-white/70 text-[10px] uppercase tracking-[0.1em] block" style={{ fontFamily: "var(--font-mono)" }}>
                      {outfit.label}
                    </span>
                    <span className="text-[15px] italic blur-[3px]" style={{ fontFamily: displayFont, color: "white" }}>
                      {outfit.style}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA below teaser grid */}
          <div className="mt-5 flex items-center justify-between px-1">
            <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              4 personalized looks waiting for you
            </span>
            <button
              onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              Unlock all
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
            </button>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(28px, 3vw, 40px)", fontFamily: displayFont }}>
              {t("preview.tripSummary")}
            </h2>
            <button onClick={() => navigate("/onboarding/1")} className="text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
              {t("preview.editDetails")}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { labelKey: "preview.destination", value: `${city}, ${country}` },
              { labelKey: "preview.duration", value: `7 ${t("general.days")}` },
              { labelKey: "preview.aesthetic", value: aestheticLabel },
              { labelKey: "preview.weather", value: "9°C, 30% rain" },
            ].map((item) => (
              <div key={item.labelKey}>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t(item.labelKey)}
                </span>
                <span className="text-[20px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Choose Your Experience */}
        <div id="pricing-section" className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(28px, 3vw, 40px)", fontFamily: displayFont }}>
              {t("pricing.title")}
            </h2>
            <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              {t("preview.selectPlan")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {/* Standard — one-time */}
            <div className="flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Standard</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[48px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 700 }}>$5</span>
                <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t("pricing.oneTime")}</span>
              </div>
              <span className="mt-1 text-[11px] text-[#57534e]/60" style={{ fontFamily: "var(--font-mono)" }}>
                {t("pricing.noAccountNeeded")}
              </span>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4,5].map((n) => (
                  <CheckItem key={n} label={t(`pricing.standard.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnSecondary onClick={() => handleCheckout("standard")} className="w-full">
                  {checkoutLoading === "standard" ? "Processing..." : t("pricing.standard.cta")}
                </BtnSecondary>
                <button onClick={() => navigate("/dashboard/standard")} className="mt-3 w-full flex items-center justify-center gap-2 h-[40px] text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer border border-dashed border-[#E8DDD4] hover:border-[#C4613A]/40 rounded-xl" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  <Icon name="visibility" size={16} />
                  {t("preview.seeSample")}
                </button>
              </div>
            </div>

            {/* Pro — one-time */}
            <div className="relative flex flex-col p-8 bg-[#C4613A] text-white rounded-2xl" style={{ boxShadow: "0 4px 16px rgba(196,97,58,.25)" }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1A1410] text-white text-[10px] uppercase tracking-[0.12em] rounded-full" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.pro.badge")}
              </span>
              <h3 className="text-white not-italic text-[28px]" style={{ fontFamily: displayFont }}>Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[48px] text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>$12</span>
                <span className="text-[14px] text-white/70" style={{ fontFamily: bodyFont }}>{t("pricing.oneTime")}</span>
              </div>
              <span className="mt-1 text-[11px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                {t("pricing.noAccountNeeded")}
              </span>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[14px] text-white/90" style={{ fontFamily: bodyFont }}>{t(`pricing.pro.features.${n}`)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => handleCheckout("pro")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {checkoutLoading === "pro" ? "Processing..." : t("pricing.pro.cta")}
              </button>
              <button onClick={() => navigate("/dashboard/pro")} className="mt-3 w-full flex items-center justify-center gap-2 h-[40px] text-[12px] uppercase tracking-[0.08em] text-white/70 hover:text-white transition-colors cursor-pointer border border-dashed border-white/30 hover:border-white/50 rounded-xl" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                <Icon name="visibility" size={16} />
                {t("preview.seeSample")}
              </button>
            </div>

            {/* Annual — subscription */}
            <div className="relative flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gold-gradient text-white text-[10px] uppercase tracking-[0.12em] rounded-full whitespace-nowrap" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.annual.badge")}
              </span>
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Annual</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[48px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 700 }}>$29</span>
                <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t("pricing.perYear")}</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4].map((n) => (
                  <CheckItem key={n} label={t(`pricing.annual.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnDark onClick={() => handleCheckout("annual")} className="w-full">
                  {checkoutLoading === "annual" ? "Processing..." : t("pricing.annual.cta")}
                </BtnDark>
                <button onClick={() => navigate("/dashboard/annual")} className="mt-3 w-full flex items-center justify-center gap-2 h-[40px] text-[12px] uppercase tracking-[0.08em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer border border-dashed border-[#E8DDD4] hover:border-[#C4613A]/40 rounded-xl" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  <Icon name="visibility" size={16} />
                  {t("preview.seeSample")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="mt-24 text-center">
          <p className="text-[18px] text-[#57534e] italic" style={{ fontFamily: displayFont }}>
            "{t("footer.quote")}"
          </p>
          <span className="mt-2 block text-[11px] uppercase tracking-[0.15em] text-[#57534e]/60" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
            — {t("footer.quoteAuthor")}
          </span>
        </div>

        <div className="mt-12 pt-8 border-t border-[#EFE8DF] flex items-center justify-center gap-6 flex-wrap">
          {["footer.privacy", "footer.terms", "footer.contact"].map((key) => (
            <a key={key} href="#" className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              {t(key)}
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
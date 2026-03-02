import React from "react";
import { useNavigate } from "react-router";
import { BtnPrimary, Icon, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { IMAGES } from "../constants/images";
import { useLang, getHeroSize } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { t, lang, displayFont, bodyFont } = useLang();
  const { isLoggedIn, user, setShowLoginModal } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* ==================== HERO ==================== */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback src={IMAGES.hero} alt="Fashion editorial" className="w-full h-full object-cover" style={{ filter: "brightness(0.60)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,20,16,0.4) 0%, transparent 40%, rgba(26,20,16,0.6) 100%)" }} />
          <div className="absolute inset-0 grain-overlay" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: `linear-gradient(rgba(196,97,58,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(196,97,58,0.1) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        </div>

        {/* Header */}
        <div className="relative z-20">
          <header className="w-full px-6 py-5">
            <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "var(--max-w)" }}>
              <div className="flex items-center gap-2">
                <Icon name="luggage" size={28} className="text-white" />
                <span className="text-[20px] tracking-tight text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>
                  Travel Capsule
                </span>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                {[
                  { key: "nav.howItWorks", href: "#how-it-works" },
                  { key: "nav.pricing", href: "#pricing" },
                  { key: "nav.examples", href: "#examples" },
                ].map((item) => (
                  <a key={item.key} href={item.href}
                    className="text-[12px] tracking-[0.08em] uppercase text-white/70 hover:text-white transition-colors"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                    {t(item.key)}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <LanguageSelector variant="light" />
                {isLoggedIn ? (
                  <div className="w-8 h-8 rounded-full bg-[#C4613A] flex items-center justify-center cursor-pointer">
                    <span className="text-white text-[12px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{user?.initials}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-[12px] tracking-[0.08em] uppercase text-white/70 hover:text-white transition-colors cursor-pointer"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    {t("nav.login")}
                  </button>
                )}
                <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>{t("nav.startPlanning")}</BtnPrimary>
              </div>
            </div>
          </header>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-[800px]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>
                {t("hero.pill")}
              </span>
            </div>

            <h1 className="text-white italic whitespace-pre-line" style={{ fontSize: getHeroSize(lang), lineHeight: 1.02, fontFamily: displayFont }}>
              {t("hero.tagline")}
            </h1>

            <div className="w-16 h-0.5 bg-[#C4613A] mx-auto my-8" />

            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mb-4" style={{ fontFamily: "var(--font-mono)" }}>
              {t("hero.subtitle")}
            </p>

            <p className="text-[18px] text-white/70 max-w-[520px] mx-auto mb-10" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
              {t("hero.body")}
            </p>

            <BtnPrimary size="lg" onClick={() => navigate("/onboarding/1")}>
              <span className="flex items-center gap-2">
                {t("hero.cta")}
                <Icon name="arrow_forward" size={18} className="text-white" />
              </span>
            </BtnPrimary>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
            {["Sys.Ver 2.4", "Initialize Style Synthesis", "Dynamic Weather Mapping"].map((text, i) => (
              <span key={i} className="text-[10px] uppercase tracking-[0.12em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== INTELLIGENCE ==================== */}
      <section id="how-it-works" className="bg-[#FDF8F3] py-32 px-6">
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" style={{ maxWidth: "var(--max-w)" }}>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C4613A]" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                {t("section.intelligence.label")}
              </span>
            </div>
            <h2 className="text-[#292524] whitespace-pre-line" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("section.intelligence.title")}
            </h2>
            <div className="w-12 h-0.5 bg-[#C4613A] my-8" />
            <p className="text-[18px] text-[#57534e] mb-4" style={{ fontFamily: bodyFont, fontWeight: 300, lineHeight: 1.7 }}>
              {t("section.intelligence.body1")}
            </p>
            <p className="text-[18px] text-[#57534e] mb-10" style={{ fontFamily: bodyFont, fontWeight: 300, lineHeight: 1.7 }}>
              {t("section.intelligence.body2")}
            </p>
            <div className="flex gap-12">
              <div>
                <span className="text-[36px] text-[#C4613A]" style={{ fontFamily: displayFont, fontWeight: 700 }}>12+</span>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>{t("section.intelligence.stat1")}</p>
              </div>
              <div>
                <span className="text-[36px] text-[#C4613A]" style={{ fontFamily: displayFont, fontWeight: 700 }}>100%</span>
                <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>{t("section.intelligence.stat2")}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <ImageWithFallback src={IMAGES.clothingRack} alt="Curated wardrobe" className="w-full h-[500px] object-cover" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl px-5 py-3 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center gap-3">
                <Icon name="auto_awesome" size={20} className="text-[#C4613A]" filled />
                <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>AI-curated selections</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CAPSULES IN MOTION ==================== */}
      <section className="bg-[#FDF8F3] py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-16">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("section.capsules.title").split(" ").slice(0, -1).join(" ")} <em>{t("section.capsules.title").split(" ").pop()}</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { img: IMAGES.earthTone, tag: "Warm & Earthy", titleKey: "capsule.mediterranean", subKey: "capsule.mediterraneanSub" },
              { img: IMAGES.streetwear, tag: "Urban Edge", titleKey: "capsule.tokyo", subKey: "capsule.tokyoSub" },
              { img: IMAGES.resort, tag: "Relaxed Luxe", titleKey: "capsule.island", subKey: "capsule.islandSub" },
            ].map((card) => (
              <div key={card.titleKey} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                  <ImageWithFallback src={card.img} alt={t(card.titleKey)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-[0.1em] text-white border border-white/20" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                      {card.tag}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-[24px] text-[#292524] not-italic" style={{ fontFamily: displayFont, fontWeight: 600 }}>
                    {t(card.titleKey)}
                  </h3>
                  <p className="text-[14px] text-[#57534e] mt-1" style={{ fontFamily: bodyFont }}>{t(card.subKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== EXAMPLES ==================== */}
      <section id="examples" className="bg-[#FDF8F3] py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-16">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("section.examples.title")}
            </h2>
            <p className="mt-4 text-[18px] text-[#57534e] max-w-[600px] mx-auto" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
              {t("section.examples.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            {/* Pro Example */}
            <div
              onClick={() => navigate("/dashboard/pro")}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#C4613A]/30 transition-all"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}
            >
              <div className="relative h-[280px] overflow-hidden">
                <ImageWithFallback
                  src={IMAGES.earthTone}
                  alt="Pro Example"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#C4613A] text-white rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                    Pro
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-white text-[24px] italic block" style={{ fontFamily: displayFont }}>
                    Multi-City Style Guide
                  </span>
                  <span className="text-white/70 text-[13px]" style={{ fontFamily: bodyFont }}>
                    Paris · Rome · Barcelona
                  </span>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex gap-2">
                  {["3 Cities", "12 Items", "42 Looks"].map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                      {s}
                    </span>
                  ))}
                </div>
                <span className="text-[12px] uppercase tracking-[0.08em] text-[#C4613A]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t("section.examples.viewPro")} →
                </span>
              </div>
            </div>

            {/* Annual Example */}
            <div
              onClick={() => navigate("/dashboard/annual")}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#D4AF37]/30 transition-all"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}
            >
              <div className="relative h-[280px] overflow-hidden">
                <ImageWithFallback
                  src={IMAGES.streetwear}
                  alt="Annual Example"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 gold-gradient text-white rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                    Annual
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-white text-[24px] italic block" style={{ fontFamily: displayFont }}>
                    Annual Member Dashboard
                  </span>
                  <span className="text-white/70 text-[13px]" style={{ fontFamily: bodyFont }}>
                    Tokyo · Style DNA · Past Trips
                  </span>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="flex gap-2">
                  {["12 Trips/yr", "Style DNA", "VIP"].map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                      {s}
                    </span>
                  ))}
                </div>
                <span className="text-[12px] uppercase tracking-[0.08em] text-[#D4AF37]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t("section.examples.viewAnnual")} →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DARK CTA ==================== */}
      <section className="relative bg-[#1A1410] py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 grain-overlay" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(rgba(196,97,58,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(196,97,58,0.15) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
        <div className="relative z-10 mx-auto text-center" style={{ maxWidth: "var(--max-w)" }}>
          <h2 className="text-white italic whitespace-pre-line" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontFamily: displayFont, lineHeight: 1.1 }}>
            {t("section.darkCta.title")}
          </h2>
          <div className="mt-10">
            <BtnPrimary size="lg" onClick={() => navigate("/onboarding/1")}>
              <span className="flex items-center gap-2">
                {t("section.darkCta.cta")}
                <Icon name="arrow_forward" size={18} className="text-white" />
              </span>
            </BtnPrimary>
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section id="pricing" className="bg-[#FDF8F3] py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-16">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("pricing.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {/* Standard */}
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
                  <div key={n} className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t(`pricing.standard.features.${n}`)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-white border-2 border-[#C4613A] text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-[#C4613A] hover:text-white transition-all cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.standard.cta")}
              </button>
            </div>

            {/* Pro */}
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
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.pro.cta")}
              </button>
            </div>

            {/* Annual */}
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
                {[1,2,3,4,5].map((n) => {
                  const key = `pricing.annual.features.${n}`;
                  const val = n <= 4 ? key : null;
                  if (!val) return null;
                  return (
                    <div key={n} className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t(val)}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-[#1A1410] text-white text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-[#C4613A] transition-all cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.annual.cta")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white border-t border-[#EFE8DF] py-10 px-6">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-6" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2">
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[16px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Travel Capsule
            </span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {["footer.privacy", "footer.terms", "footer.sustainability", "footer.contact"].map((key) => (
              <a key={key} href="#" className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors"
                style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                {t(key)}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { BtnPrimary, Icon, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { IMAGES } from "../constants/images";
import { useLang, getHeroSize } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import {
  SEO,
  buildWebsiteSchema,
  buildOrganizationSchema,
  buildWebAppSchema,
  buildFAQSchema,
  buildHowToSchema,
} from "../components/SEO";

export function LandingPage() {
  const navigate = useNavigate();
  const { t, lang, displayFont, bodyFont } = useLang();
  const { isLoggedIn, user, setShowLoginModal } = useAuth();

  // If returning from an examples page, scroll to the examples section
  useEffect(() => {
    const target = sessionStorage.getItem("tc_scroll_target");
    if (target === "examples") {
      sessionStorage.removeItem("tc_scroll_target");
      // Wait for the page to render before scrolling
      requestAnimationFrame(() => {
        const el = document.getElementById("examples");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  const faqItems = [
    {
      question: "What is a travel capsule wardrobe?",
      answer:
        "A travel capsule wardrobe is a curated set of versatile clothing items that mix and match for every day of your trip. Travel Capsule AI uses weather data, city culture, and your body profile to build the perfect capsule for your destination.",
    },
    {
      question: "How does AI travel styling work?",
      answer:
        "Our AI analyzes real-time weather forecasts, local fashion culture, and your personal style preferences to generate outfit recommendations and a packing list tailored to your specific trip.",
    },
    {
      question: "How many cities can I plan outfits for?",
      answer:
        "You can plan outfits for up to 5 cities in a single trip. The AI adapts recommendations for each destination's weather and vibe.",
    },
    {
      question: "Is Travel Capsule AI free to use?",
      answer:
        "Yes! You get free weather analysis, city vibe matching, and a teaser outfit image. Full capsule wardrobe lists and additional AI-generated outfits are available with paid plans starting at $5.",
    },
    {
      question: "What do I get with the Standard plan?",
      answer:
        "The $5 Standard plan includes 1 clear AI-generated outfit image, 3 additional unlocked images, a complete capsule wardrobe packing list, and a day-by-day outfit plan.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SEO
        title="AI Travel Stylist — Pack Less, Look Better"
        description="AI-powered travel outfit planner. Enter your destination — we analyze weather, city vibe, and your body profile to create personalized capsule wardrobes. Plan outfits for Paris, Tokyo, Barcelona & 100+ cities."
        jsonLd={[
          buildWebsiteSchema(),
          buildOrganizationSchema(),
          buildWebAppSchema(),
          buildHowToSchema(),
          buildFAQSchema(faqItems),
        ]}
      />
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
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Icon name="luggage" size={24} className="text-white" />
                <span className="text-[16px] sm:text-[20px] tracking-tight text-white whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>
                  Travel Capsule AI
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
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSelector variant="light" />
                {isLoggedIn ? (
                  <div className="w-8 h-8 rounded-full bg-[#C4613A] flex items-center justify-center cursor-pointer" onClick={() => navigate("/mypage")}>
                    <span className="text-white text-[12px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{user?.initials}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="hidden sm:inline text-[12px] tracking-[0.08em] uppercase text-white/70 hover:text-white transition-colors cursor-pointer"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    {t("nav.login")}
                  </button>
                )}
                {!isLoggedIn && (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="sm:hidden w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 cursor-pointer"
                  >
                    <Icon name="person" size={18} className="text-white" />
                  </button>
                )}
                <span className="hidden sm:inline">
                  <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>{t("nav.startPlanning")}</BtnPrimary>
                </span>
              </div>
            </div>
          </header>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-[800px]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A] animate-pulse" />
              <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] text-white/80" style={{ fontFamily: "var(--font-mono)" }}>
                {t("hero.pill")}
              </span>
            </div>

            <h1 className="text-white italic whitespace-pre-line" style={{ fontSize: getHeroSize(lang), lineHeight: 1.02, fontFamily: displayFont }}>
              {t("hero.tagline")}
            </h1>

            <div className="w-16 h-0.5 bg-[#C4613A] mx-auto mt-8 mb-6" />

            <p className="text-[16px] sm:text-[20px] tracking-[0.04em] text-white/90 mb-4" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              {t("hero.subtitle")}
            </p>

            <p className="text-[16px] sm:text-[18px] text-white/60 max-w-[560px] mx-auto mb-10" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
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
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>Sys.Ver 2.4</span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.12em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>Initialize Style Synthesis</span>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.12em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>Dynamic Weather Mapping</span>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="bg-[#FDF8F3] py-16 lg:py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C4613A]" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                {t("section.intelligence.label")}
              </span>
            </div>
            <h2 className="text-[#292524] whitespace-pre-line" style={{ fontSize: "clamp(28px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("section.intelligence.title")}
            </h2>
            <div className="w-12 h-0.5 bg-[#C4613A] mx-auto my-6 lg:my-8" />
            <p className="text-[15px] sm:text-[18px] text-[#57534e] max-w-[640px] mx-auto" style={{ fontFamily: bodyFont, fontWeight: 300, lineHeight: 1.7 }}>
              {t("section.intelligence.body1")}
            </p>
          </div>

          {/* 3 Steps — with visual previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-12 lg:mb-16">
            {[
              { num: "01", icon: "flight_takeoff", titleKey: "section.intelligence.step1.title", bodyKey: "section.intelligence.step1.body", img: IMAGES.paris, imgAlt: "Paris destination", overlay: "Paris, 7 days" },
              { num: "02", icon: "auto_awesome", titleKey: "section.intelligence.step2.title", bodyKey: "section.intelligence.step2.body", img: IMAGES.tokyo, imgAlt: "AI city analysis", overlay: null },
              { num: "03", icon: "checkroom", titleKey: "section.intelligence.step3.title", bodyKey: "section.intelligence.step3.body", img: "/examples/pro-outfit-2.png", imgAlt: "AI-generated outfit", overlay: null },
            ].map((step, i) => (
              <div key={step.num} className="relative bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] group hover:border-[#C4613A]/30 transition-all" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                {/* Step image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback src={step.img} alt={step.imgAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Step number badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <Icon name={step.icon} size={16} className="text-[#C4613A]" filled={i === 1} />
                    </span>
                    <span className="text-[20px] text-white/80" style={{ fontFamily: displayFont, fontWeight: 700 }}>{step.num}</span>
                  </div>
                  {/* Mini UI overlay for step 1 — destination chip */}
                  {i === 0 && (
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <Icon name="location_on" size={12} className="text-[#C4613A]" />
                        <span className="text-[10px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>Paris</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <Icon name="calendar_month" size={12} className="text-[#C4613A]" />
                        <span className="text-[10px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>May 12-18</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <Icon name="height" size={12} className="text-[#C4613A]" />
                        <span className="text-[10px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>170cm · 58kg</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <Icon name="face" size={12} className="text-[#C4613A]" />
                        <span className="text-[10px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>Photo</span>
                      </div>
                    </div>
                  )}
                  {/* Mini UI overlay for step 2 — analysis badges */}
                  {i === 1 && (
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                      {["15°C Avg", "40% Rain", "Mild · Layered"].map((tag) => (
                        <span key={tag} className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* Mini UI overlay for step 3 — result stats */}
                  {i === 2 && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-3">
                        <span className="text-[10px] text-[#C4613A]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>4 {t("section.intelligence.step3.looks")}</span>
                        <span className="w-px h-3 bg-[#E8DDD4]" />
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>12 {t("section.intelligence.step3.items")}</span>
                        <span className="w-px h-3 bg-[#E8DDD4]" />
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>1 {t("section.intelligence.step3.bag")}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Text content */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-[18px] sm:text-[22px] text-[#292524] mb-2" style={{ fontFamily: displayFont }}>{t(step.titleKey)}</h3>
                  <p className="text-[13px] sm:text-[15px] text-[#57534e] leading-relaxed" style={{ fontFamily: bodyFont }}>{t(step.bodyKey)}</p>
                </div>
                {/* Arrow between cards */}
                {i < 2 && (
                  <div className="hidden md:block absolute -right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-10">
                    <Icon name="arrow_forward" size={20} className="text-[#C4613A]/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Value Proposition Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: "cloud", title: t("section.intelligence.valueProp1"), sub: t("section.intelligence.valueProp1Sub") },
              { icon: "straighten", title: t("section.intelligence.valueProp2"), sub: t("section.intelligence.valueProp2Sub") },
              { icon: "luggage", title: t("section.intelligence.valueProp3"), sub: t("section.intelligence.valueProp3Sub") },
              { icon: "public", title: t("section.intelligence.valueProp4"), sub: t("section.intelligence.valueProp4Sub") },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-[#E8DDD4] p-5 sm:p-6 hover:border-[#C4613A]/30 transition-colors" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div className="w-10 h-10 rounded-full bg-[#C4613A]/10 flex items-center justify-center mb-4">
                  <Icon name={card.icon} size={20} className="text-[#C4613A]" />
                </div>
                <h4 className="text-[16px] sm:text-[18px] text-[#292524] mb-2" style={{ fontFamily: displayFont }}>{card.title}</h4>
                <p className="text-[12px] sm:text-[13px] text-[#57534e] leading-relaxed" style={{ fontFamily: bodyFont }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Scenario text */}
          <div className="mt-10 lg:mt-12 text-center max-w-[700px] mx-auto">
            <p className="text-[15px] sm:text-[18px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: displayFont }}>
              {t("section.intelligence.body2")}
            </p>
          </div>
        </div>
      </section>

      {/* ==================== AI STYLED DESTINATIONS ==================== */}
      <section className="bg-[#FDF8F3] py-16 lg:py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {t("section.capsules.label")}
            </span>
            <h2 className="mt-3 text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("section.capsules.title")}
            </h2>
            <p className="mt-3 text-[17px] text-[#57534e] max-w-[560px] mx-auto" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
              {t("section.capsules.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              { img: IMAGES.earthTone, city: "Santorini", temp: "26°C", climate: "sunny", tag: "Warm & Earthy", titleKey: "capsule.mediterranean", subKey: "capsule.mediterraneanSub" },
              { img: IMAGES.streetwear, city: "Tokyo", temp: "14°C", climate: "cloudy", tag: "Urban Edge", titleKey: "capsule.tokyo", subKey: "capsule.tokyoSub" },
              { img: IMAGES.resort, city: "Maldives", temp: "30°C", climate: "tropical", tag: "Relaxed Luxe", titleKey: "capsule.island", subKey: "capsule.islandSub" },
            ].map((card) => (
              <div key={card.titleKey} className="group cursor-pointer" onClick={() => navigate("/onboarding/1")}>
                <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
                  <ImageWithFallback src={card.img} alt={t(card.titleKey)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {/* AI badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#C4613A]/90 backdrop-blur-sm rounded-full text-[9px] uppercase tracking-[0.1em] text-white" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      <Icon name="auto_awesome" size={10} className="text-white" filled /> AI Styled
                    </span>
                  </div>
                  {/* Weather chip */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[10px] text-white border border-white/20" style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                      <Icon name="thermostat" size={12} className="text-white" /> {card.temp}
                    </span>
                  </div>
                  {/* Bottom info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-sm rounded-full text-[9px] uppercase tracking-[0.1em] text-white/80 border border-white/15" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                      {card.tag}
                    </span>
                    <h3 className="mt-2.5 text-[22px] text-white not-italic" style={{ fontFamily: displayFont, fontWeight: 600 }}>
                      {t(card.titleKey)}
                    </h3>
                    <p className="text-[13px] text-white/70 mt-0.5" style={{ fontFamily: bodyFont }}>{t(card.subKey)}</p>
                    {/* Inline CTA */}
                    <div className="mt-3 flex items-center gap-1.5 text-white/90 group-hover:text-white transition-colors">
                      <span className="text-[11px] uppercase tracking-[0.08em]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("section.capsules.tryCity")}</span>
                      <Icon name="arrow_forward" size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Section CTA */}
          <div className="mt-12 text-center">
            <BtnPrimary onClick={() => navigate("/onboarding/1")} className="px-10">
              {t("section.capsules.cta")}
            </BtnPrimary>
          </div>
        </div>
      </section>

      {/* ==================== PACK LESS, LOOK BETTER ==================== */}
      <section className="bg-[#1A1410] py-16 lg:py-28 px-6 overflow-hidden">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-10 lg:mb-14">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {t("section.packless.label")}
            </span>
            <h2 className="mt-3 text-white" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontFamily: displayFont }}>
              {t("section.packless.title")}
            </h2>
            <p className="mt-3 text-[16px] text-white/60 max-w-[520px] mx-auto" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
              {t("section.packless.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-[900px] mx-auto items-start">
            {/* BEFORE — without AI */}
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
                  <Icon name="close" size={16} className="text-red-400" />
                </div>
                <span className="text-[13px] uppercase tracking-[0.1em] text-white/60" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t("section.packless.before")}
                </span>
              </div>
              {/* Suitcase visual */}
              <div className="relative mb-5">
                <div className="flex items-center justify-center gap-1 py-8 bg-white/5 rounded-xl border border-white/10">
                  <Icon name="luggage" size={48} className="text-white/20" />
                  <Icon name="luggage" size={48} className="text-white/20" />
                  <Icon name="add" size={20} className="text-white/15 mx-1" />
                  <Icon name="backpack" size={40} className="text-white/20" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "checkroom", text: t("section.packless.before1"), val: "20+" },
                  { icon: "style", text: t("section.packless.before2"), val: "3-4" },
                  { icon: "luggage", text: t("section.packless.before3"), val: "23kg" },
                  { icon: "sentiment_dissatisfied", text: t("section.packless.before4"), val: "" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon name={item.icon} size={16} className="text-white/30" />
                      <span className="text-[13px] text-white/50" style={{ fontFamily: bodyFont }}>{item.text}</span>
                    </div>
                    {item.val && <span className="text-[13px] text-red-400/80" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{item.val}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER — with Travel Capsule AI */}
            <div className="relative bg-[#C4613A]/10 border border-[#C4613A]/30 rounded-2xl p-6 sm:p-8">
              {/* Glow effect */}
              <div className="absolute -top-px -left-px -right-px h-px bg-gradient-to-r from-transparent via-[#C4613A] to-transparent" />
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#C4613A]/20 flex items-center justify-center">
                  <Icon name="auto_awesome" size={16} className="text-[#C4613A]" filled />
                </div>
                <span className="text-[13px] uppercase tracking-[0.1em] text-[#C4613A]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t("section.packless.after")}
                </span>
              </div>
              {/* Compact suitcase visual */}
              <div className="relative mb-5">
                <div className="flex items-center justify-center gap-3 py-8 bg-[#C4613A]/5 rounded-xl border border-[#C4613A]/20">
                  <Icon name="luggage" size={48} className="text-[#C4613A]/50" />
                  <div className="flex flex-col items-center">
                    <Icon name="check_circle" size={20} className="text-green-400" />
                    <span className="text-[9px] text-white/40 mt-1" style={{ fontFamily: "var(--font-mono)" }}>carry-on</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "checkroom", text: t("section.packless.after1"), val: "12" },
                  { icon: "style", text: t("section.packless.after2"), val: "7+" },
                  { icon: "luggage", text: t("section.packless.after3"), val: "8kg" },
                  { icon: "auto_awesome", text: t("section.packless.after4"), val: "" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon name={item.icon} size={16} className="text-[#C4613A]/70" />
                      <span className="text-[13px] text-white/70" style={{ fontFamily: bodyFont }}>{item.text}</span>
                    </div>
                    {item.val && <span className="text-[13px] text-green-400" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{item.val}</span>}
                  </div>
                ))}
              </div>
              {/* Savings highlight */}
              <div className="mt-5 pt-4 border-t border-[#C4613A]/20 text-center">
                <span className="text-[28px] text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>
                  -65%
                </span>
                <span className="block text-[11px] text-white/50 mt-0.5" style={{ fontFamily: bodyFont }}>
                  {t("section.packless.savings")}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 lg:mt-14 text-center">
            <BtnPrimary onClick={() => navigate("/onboarding/1")} className="px-10">
              {t("section.packless.cta")}
            </BtnPrimary>
          </div>
        </div>
      </section>

      {/* ==================== EXAMPLES ==================== */}
      <section id="examples" className="bg-[#F5EFE6] py-16 sm:py-28 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          {/* Section header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[10px] uppercase tracking-[0.12em] mb-4" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              <Icon name="auto_awesome" size={12} className="text-[#C4613A]" filled />
              Real AI Output
            </span>
            <h2 className="text-[#1A1410]" style={{ fontSize: "clamp(32px, 4vw, 54px)", fontFamily: displayFont, lineHeight: 1.1 }}>
              {t("section.examples.title")}
            </h2>
            <p className="mt-4 text-[16px] sm:text-[18px] text-[#57534e] max-w-[520px] mx-auto leading-relaxed" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
              {t("section.examples.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-[960px] mx-auto">

            {/* ── Pro Example Card ── */}
            <div
              onClick={() => navigate("/examples/pro")}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#C4613A]/40 hover:shadow-xl transition-all duration-300"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}
            >
              {/* Image hero */}
              <div className="relative overflow-hidden" style={{ height: "clamp(260px, 30vw, 340px)" }}>
                <ImageWithFallback
                  src="/examples/pro-outfit-1.png"
                  alt="Pro Example — Paris Style Guide"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#C4613A] text-white rounded-full text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    Pro Plan
                  </span>
                  <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                    <Icon name="auto_awesome" size={9} className="text-white inline-block mr-0.5" filled />AI Generated
                  </span>
                </div>

                {/* Confidence badge — top right */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/90 rounded-full text-[9px]" style={{ fontFamily: "var(--font-mono)" }}>
                    93% match
                  </span>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-white/60 text-[10px] uppercase tracking-[0.12em] block mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                        Paris · May 2026 · Classic
                      </span>
                      <span className="text-white block leading-tight" style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontFamily: displayFont }}>
                        {t("section.examples.pro.title")}
                      </span>
                      <span className="text-white/75 text-[12px] mt-1 block" style={{ fontFamily: bodyFont }}>
                        Female · 170cm · Slim build
                      </span>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#C4613A] transition-colors duration-300">
                      <Icon name="arrow_forward" size={18} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="p-4 sm:p-5">
                {/* Feature chips */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { icon: "location_city", text: t("section.examples.pro.tag1") },
                    { icon: "style", text: t("section.examples.pro.tag2") },
                    { icon: "checklist", text: t("section.examples.pro.tag3") },
                  ].map(({ icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                      <Icon name={icon} size={10} className="text-[#C4613A]" />
                      {text}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFE8DF]">
                  <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
                    4 AI outfit images · Packing list · Day plan
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-[#C4613A] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200" style={{ fontFamily: bodyFont }}>
                    {t("section.examples.viewPro")} <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ── Annual Example Card ── */}
            <div
              onClick={() => navigate("/examples/annual")}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}
            >
              {/* Image hero */}
              <div className="relative overflow-hidden" style={{ height: "clamp(260px, 30vw, 340px)" }}>
                <ImageWithFallback
                  src="/examples/annual-hero.png"
                  alt="Annual Example — European Journey"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 gold-gradient text-white rounded-full text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    Annual Plan
                  </span>
                  <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                    <Icon name="auto_awesome" size={9} className="text-white inline-block mr-0.5" filled />AI Generated
                  </span>
                </div>

                {/* Trip count badge — top right */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/90 rounded-full text-[9px]" style={{ fontFamily: "var(--font-mono)" }}>
                    3 cities
                  </span>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-white/60 text-[10px] uppercase tracking-[0.12em] block mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>
                        Paris · Rome · Barcelona
                      </span>
                      <span className="text-white block leading-tight" style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontFamily: displayFont }}>
                        {t("section.examples.annual.title")}
                      </span>
                      <span className="text-white/75 text-[12px] mt-1 block" style={{ fontFamily: bodyFont }}>
                        Male · 185cm · Regular build
                      </span>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors duration-300">
                      <Icon name="arrow_forward" size={18} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="p-4 sm:p-5">
                {/* Feature chips */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {[
                    { icon: "public", text: t("section.examples.annual.tag1") },
                    { icon: "style", text: t("section.examples.annual.tag2") },
                    { icon: "psychology", text: t("section.examples.annual.tag3") },
                  ].map(({ icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                      <Icon name={icon} size={10} className="text-[#D4AF37]" />
                      {text}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#EFE8DF]">
                  <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>
                    12 trips/yr · Style DNA · VIP concierge
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-[#D4AF37] font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200" style={{ fontFamily: bodyFont }}>
                    {t("section.examples.viewAnnual")} <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== DARK CTA ==================== */}
      <section className="relative bg-[#1A1410] py-16 sm:py-32 px-6 overflow-hidden">
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
      <section id="pricing" className="bg-[#FDF8F3] py-16 sm:py-32 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-16">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: displayFont }}>
              {t("pricing.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {/* Standard */}
            <div className="relative flex flex-col p-8 bg-white border border-[#C4613A]/10 rounded-2xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#C4613A] to-[#e0734a] text-white text-[10px] uppercase tracking-[0.12em] rounded-full animate-pulse" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("pricing.promoBadge")}</span>
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Standard</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[24px] text-[#57534e] line-through opacity-60" style={{ fontFamily: displayFont, fontWeight: 500 }}>{t("pricing.originalPrice")}</span>
                <span className="text-[48px] text-[#C4613A]" style={{ fontFamily: displayFont, fontWeight: 700 }}>{t("pricing.promoFree")}</span>
              </div>
              <span className="text-[12px] text-[#C4613A] mt-1 block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{t("pricing.promoNote")}</span>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#C4613A]" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t(`pricing.standard.features.${n}`)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-white border-2 border-[#C4613A] text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#C4613A] hover:text-white transition-all cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
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
                <span className="text-[48px] text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>$3.99</span>
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
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-xl hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
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
                <span className="text-[48px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 700 }}>$9.99</span>
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
              <button onClick={() => navigate("/onboarding/1")} className="mt-8 h-[56px] w-full bg-[#1A1410] text-white text-[14px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#C4613A] transition-all cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.annual.cta")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="bg-[#FDF8F3] py-16 lg:py-24 px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C4613A]" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>FAQ</span>
            </div>
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontFamily: displayFont }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="max-w-[720px] mx-auto space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-white border border-[#E8DDD4] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[15px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{item.question}</h3>
                  <Icon name="expand_more" size={20} className="text-[#57534e] group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-[14px] text-[#57534e] leading-relaxed" style={{ fontFamily: bodyFont }}>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white border-t border-[#EFE8DF] py-10 px-6">
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-6" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2">
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[16px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Travel Capsule AI
            </span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[
              { key: "footer.privacy", path: "/privacy" },
              { key: "footer.terms",   path: "/terms" },
              { key: "footer.contact", path: "/contact" },
            ].map(({ key, path }) => (
              <button key={key} onClick={() => navigate(path)}
                className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                {t(key)}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 pt-6 border-t border-[#EFE8DF] text-center" style={{ maxWidth: "var(--max-w)" }}>
          <span className="text-[11px] text-[#57534e]/60 tracking-[0.05em]" style={{ fontFamily: bodyFont }}>
            &copy; {new Date().getFullYear()} Travel Capsule AI &mdash; All Rights Reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
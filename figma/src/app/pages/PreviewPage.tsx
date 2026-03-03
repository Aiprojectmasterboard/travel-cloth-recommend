import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnSecondary, BtnDark, CheckItem, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useOnboarding } from "../context/OnboardingContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { createCheckoutSession, type PlanKey } from "../services/polarCheckout";

/* Fallback images when AI teaser is not available */
const FALLBACK_IMG = "https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMEZyYW5jZSUyMEVpZmZlbCUyMHRvd2VyJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MjQyNjYwM3ww&ixlib=rb-4.1.0&q=80&w=1080";

export function PreviewPage() {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { preview, tripId, loading: tripLoading, error: tripError } = useTrip();
  const { t, displayFont, bodyFont } = useLang();
  const { isLoggedIn, user, setShowLoginModal } = useAuth();

  const city = data.cities[0]?.city || "Paris";
  const country = data.cities[0]?.country || "France";
  const aestheticLabel = data.aesthetics.length > 0 ? data.aesthetics.join(", ") : "Classic, Minimalist";

  // Real data from AI preview
  const teaserUrl = preview?.teaser_url || FALLBACK_IMG;
  const moodLabel = preview?.mood_label || `${city} \u2014 Style Analysis`;
  const vibes = preview?.vibes || [];
  const weatherData = preview?.weather || [];
  const capsuleCount = preview?.capsule?.count || 9;
  const capsulePrinciples = preview?.capsule?.principles || [];

  // Weather display from real data
  const primaryWeather = weatherData[0];
  const weatherDisplay = primaryWeather
    ? `${Math.round(primaryWeather.temperature_day_avg)}\u00B0C, ${Math.round(primaryWeather.precipitation_prob * 100)}% rain`
    : "Analyzing...";

  // Vibe color palette
  const vibeColors = vibes[0]?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"];
  const vibeTags = vibes[0]?.vibe_tags || [];

  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);

  const handleCheckout = async (plan: PlanKey) => {
    setCheckoutLoading(plan);
    try {
      const session = await createCheckoutSession({
        plan,
        customerEmail: user?.email,
        tripId: tripId || undefined,
        successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
      });

      // Save checkout info so success page can work independently of Polar redirect
      sessionStorage.setItem("tc_pending_checkout", JSON.stringify({
        plan, tripId, checkoutId: session.id, ts: Date.now(),
      }));

      if (session.url) {
        // Open Polar checkout in new tab — avoids Polar's Customer Portal redirect issue
        window.open(session.url, "_blank");
        // Navigate to our own success/waiting page immediately
        navigate(`/checkout/success?plan=${plan}&tripId=${tripId || ""}&checkout_id=${session.id}`);
      } else {
        navigate(`/checkout/success?plan=${plan}&session_id=${session.clientSecret}`);
      }
    } catch {
      setCheckoutLoading(null);
    }
  };

  // If no preview data and not loading, redirect to onboarding
  if (!preview && !tripLoading && !tripError) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
        <div className="text-center max-w-[400px]">
          <Icon name="auto_awesome" size={40} className="text-[#C4613A] mx-auto mb-4" />
          <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: displayFont }}>
            No preview available
          </h2>
          <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
            Start by entering your trip details to get AI-powered style recommendations.
          </p>
          <button
            onClick={() => navigate("/onboarding/1")}
            className="mt-6 h-[48px] px-8 bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-none hover:bg-[#A84A25] transition-colors cursor-pointer"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            Start Your Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={28} className="text-[#C4613A]" />
            <span className="text-[20px] tracking-tight text-[#1A1410]" style={{ fontFamily: displayFont, fontWeight: 700 }}>
              Travel Capsule AI
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
          {moodLabel}
        </h1>
        <p className="mt-4 text-[18px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
          {t("preview.body")}
        </p>

        {/* Preview Card — Real AI Teaser */}
        <div className="mt-10 relative rounded-2xl overflow-hidden" style={{ aspectRatio: "21/9" }}>
          <ImageWithFallback src={teaserUrl} alt="Trip preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] p-4 sm:p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <span className="text-[20px] text-white italic" style={{ fontFamily: displayFont }}>
                {preview ? "AI Analysis Complete" : "Generating..."}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full bg-[#C4613A] rounded-full transition-all duration-1000 ${preview ? "w-full" : "w-[40%]"}`} />
            </div>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
              {preview ? "100% AI Analysis Complete" : "Processing..."}
            </span>
          </div>
        </div>

        {/* AI-Generated Vibe Tags & Color Palette */}
        {vibes.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {vibeTags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white border border-[#E8DDD4] rounded-full text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                {tag}
              </span>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              {vibeColors.map((color) => (
                <div key={color} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        )}

        {/* AI Outfit Preview — Teaser Grid (1 real + 3 blurred) */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: displayFont }}>
              AI Outfit Preview
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1410] rounded-full">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>lock</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                Preview locked \u2014 unlock after purchase
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const isUnlocked = idx === 0 && preview?.teaser_url;
              return (
                <div key={idx} className="group">
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <ImageWithFallback
                      src={teaserUrl}
                      alt={`Outfit ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={isUnlocked ? { transform: "scale(1)" } : { filter: "blur(12px) brightness(0.7)", transform: "scale(1.1)" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Lock overlay for blurred images */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>lock</span>
                        </div>
                        <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                          Unlock
                        </span>
                      </div>
                    )}
                    {isUnlocked && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/90 text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                          <Icon name="auto_awesome" size={10} className="text-white" filled /> AI Generated
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white/70 text-[10px] uppercase tracking-[0.1em] block" style={{ fontFamily: "var(--font-mono)" }}>
                        Day {idx + 1} Look
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

        {/* Trip Summary — Real AI data */}
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
              { labelKey: "preview.duration", value: `${data.cities[0] ? Math.max(1, Math.round((new Date(data.cities[0].toDate).getTime() - new Date(data.cities[0].fromDate).getTime()) / 86400000)) : 7} ${t("general.days")}` },
              { labelKey: "preview.aesthetic", value: aestheticLabel },
              { labelKey: "preview.weather", value: weatherDisplay },
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

        {/* Capsule Estimate (from AI) */}
        {capsulePrinciples.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl border border-[#E8DDD4] p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <div className="flex items-center gap-3 mb-6">
              <Icon name="checkroom" size={24} className="text-[#C4613A]" />
              <h3 className="text-[22px] text-[#292524]" style={{ fontFamily: displayFont }}>
                AI Capsule Estimate: {capsuleCount} pieces
              </h3>
            </div>
            <div className="space-y-3">
              {capsulePrinciples.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#C4613A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{i + 1}</span>
                  </span>
                  <p className="text-[15px] text-[#57534e] leading-relaxed" style={{ fontFamily: bodyFont }}>{p}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#EFE8DF]">
              <p className="text-[13px] text-[#57534e]/70 italic" style={{ fontFamily: displayFont }}>
                Full item list, daily plans, and AI-generated outfit images unlock after purchase.
              </p>
            </div>
          </div>
        )}

        {/* Avoid Note from Vibe */}
        {vibes[0]?.avoid_note && (
          <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FCD34D]/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="info" size={16} className="text-[#D97706]" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#D97706]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>Style Tip</span>
            </div>
            <p className="text-[14px] text-[#92400E]" style={{ fontFamily: bodyFont }}>{vibes[0].avoid_note}</p>
          </div>
        )}

        {/* Choose Your Experience — Pricing */}
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
                  <CheckItem key={n} label={t(`pricing.standard.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnSecondary onClick={() => handleCheckout("standard")} className="w-full">
                  {checkoutLoading === "standard" ? "Processing..." : t("pricing.standard.cta")}
                </BtnSecondary>
              </div>
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
              <button onClick={() => handleCheckout("pro")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {checkoutLoading === "pro" ? "Processing..." : t("pricing.pro.cta")}
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
                {[1,2,3,4].map((n) => (
                  <CheckItem key={n} label={t(`pricing.annual.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnDark onClick={() => handleCheckout("annual")} className="w-full">
                  {checkoutLoading === "annual" ? "Processing..." : t("pricing.annual.cta")}
                </BtnDark>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center">
          <p className="text-[18px] text-[#57534e] italic" style={{ fontFamily: displayFont }}>
            "{t("footer.quote")}"
          </p>
          <span className="mt-2 block text-[11px] uppercase tracking-[0.15em] text-[#57534e]/60" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
            \u2014 {t("footer.quoteAuthor")}
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

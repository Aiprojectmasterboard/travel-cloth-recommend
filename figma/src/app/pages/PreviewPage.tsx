import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Icon, BtnDark, CheckItem, LanguageSelector } from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useOnboarding } from "../context/OnboardingContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { createCheckoutSession, type PlanKey } from "../services/polarCheckout";
import { getOutfitImages } from "../services/outfitGenerator";
import { GA } from "../lib/analytics";
import { SEO } from "../components/SEO";

const GENERIC_FALLBACK = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

/** Format a date string as "Mon DD" using locale-aware short month */
function fmtShort(dateStr: string, locale: string): string {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function PreviewPage() {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { preview, tripId, loading: tripLoading, error: tripError } = useTrip();
  const { t, displayFont, bodyFont, lang } = useLang();
  const { isLoggedIn, user, setShowLoginModal, setLoginModalContext } = useAuth();

  // ─── Multi-city tab state ────────────────────────────────────────────────
  const [activeCityIdx, setActiveCityIdx] = useState(0);
  const cityCount = data.cities.length;
  const hasMultipleCities = cityCount > 1;

  // Derive per-city data based on active tab
  const activeCity = data.cities[activeCityIdx] || data.cities[0];
  const city = activeCity?.city || "Paris";
  const country = activeCity?.country || "";
  const aestheticLabel = data.aesthetics.length > 0
    ? data.aesthetics.map((a) => t(`aesthetic.${a}`) || a).join(", ")
    : t("preview.defaultAesthetic");

  // Match vibe/weather data to active city (API returns arrays with city field)
  const allVibes = preview?.vibes || [];
  const allWeather = preview?.weather || [];

  const activeVibe = allVibes.find((v) => v.city?.toLowerCase() === city.toLowerCase()) || allVibes[activeCityIdx] || allVibes[0];
  const activeWeather = allWeather.find((w) => w.city?.toLowerCase() === city.toLowerCase()) || allWeather[activeCityIdx] || allWeather[0];

  const moodLabel = activeVibe?.mood_label || preview?.mood_label || t("preview.defaultMood").replace("{city}", city);

  // Sample images: use pre-curated city-specific outfit photos (no AI generation cost)
  const gender = data.gender || "female";
  const sampleImages = getOutfitImages(gender, city);
            setTeaserReady(true);
            return;
  // Hero image: first sample image for the active city
  const heroImage = sampleImages[0] || GENERIC_FALLBACK;

  const capsuleCount = preview?.capsule?.count || 9;
  const capsulePrinciples = preview?.capsule?.principles || [];

  // Weather display from real data — per active city
  const weatherDisplay = activeWeather
    ? `${Math.round(activeWeather.temperature_day_avg)}\u00B0C, ${t("preview.rainPercent").replace("{pct}", String(Math.round(activeWeather.precipitation_prob * 100)))}`
    : t("preview.processing");

  // Vibe color palette — per active city
  const vibeColors = activeVibe?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"];
  const vibeTags = activeVibe?.vibe_tags || [];

  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Duration display: "Aug 15 - Aug 20 (5 nights)" — per active city
  const fromDate = activeCity?.fromDate || "";
  const toDate = activeCity?.toDate || "";
  const nightCount = fromDate && toDate
    ? Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
    : 7;
  const durationValue = fromDate && toDate
    ? `${fmtShort(fromDate, lang)} - ${fmtShort(toDate, lang)} (${nightCount} ${t("general.nights")})`
    : `${nightCount} ${t("general.nights")}`;

  const doCheckout = async (plan: PlanKey) => {
    GA.checkoutStart(plan);
    setCheckoutLoading(plan);
    setCheckoutError(null);
    try {
      const session = await createCheckoutSession({
        plan,
        customerEmail: user?.email,
        tripId: tripId || undefined,
        successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
      });

      if (!session.url) {
        throw new Error(t("preview.checkoutErrorNoUrl"));
      }

      // Save checkout context before redirecting to Polar
      sessionStorage.setItem("tc_pending_checkout", JSON.stringify({
        plan, tripId, checkoutId: session.id, ts: Date.now(),
      }));
      sessionStorage.setItem("tc_pending_plan", plan);

      // Redirect directly to Polar checkout (same tab).
      // After payment, Polar redirects back to /checkout/success with params.
      // sessionStorage persists across same-tab navigations.
      window.location.href = session.url;
    } catch (err) {
      setCheckoutLoading(null);
      setCheckoutError(err instanceof Error ? err.message : t("preview.checkoutErrorGeneric"));
    }
  };

  const handleCheckout = (plan: PlanKey) => {
    doCheckout(plan);
  };

  // If no preview data and not loading, redirect to onboarding
  if (!preview && !tripLoading && !tripError) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center px-6">
        <div className="text-center max-w-[400px]">
          <Icon name="auto_awesome" size={40} className="text-[#C4613A] mx-auto mb-4" />
          <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: displayFont }}>
            {t("preview.noPreview")}
          </h2>
          <p className="mt-3 text-[15px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
            {t("preview.noPreviewBody")}
          </p>
          <button
            onClick={() => navigate("/onboarding/1")}
            className="mt-6 h-[48px] px-8 bg-[#C4613A] text-white text-[13px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#A84A25] transition-colors cursor-pointer"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            {t("preview.startTrip")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SEO title={t("preview.seoTitle")} description={t("preview.seoDescription")} noindex={true} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-1.5 cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[20px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>
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

      {/* ─── Multi-city tabs ─────────────────────────────────────────────── */}
      {hasMultipleCities && (
        <div className="border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.6)" }}>
          <div className="mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide" style={{ maxWidth: 1200 }}>
            <div className="flex items-center gap-1 py-3 min-w-max">
              {data.cities.map((c, idx) => {
                const isActive = idx === activeCityIdx;
                const cityVibe = allVibes.find((v) => v.city?.toLowerCase() === c.city.toLowerCase()) || allVibes[idx];
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCityIdx(idx)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#1A1410] text-white shadow-md"
                        : "bg-white/80 text-[#57534e] hover:bg-white hover:text-[#292524] border border-[#E8DDD4]"
                    }`}
                  >
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt={c.city}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <span className="text-[13px]" style={{ fontFamily: bodyFont, fontWeight: isActive ? 600 : 500 }}>
                      {c.city}
                    </span>
                    {cityVibe && (
                      <span
                        className={`text-[10px] hidden sm:inline ${isActive ? "text-white/50" : "text-[#57534e]/40"}`}
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {cityVibe.mood_name || ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ maxWidth: 1200 }}>
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
          {hasMultipleCities ? `${city} \u2014 ${t("preview.step")}` : t("preview.step")}
        </span>

        <h1 className="mt-4 text-[#292524] italic whitespace-pre-line break-words" style={{ fontSize: "clamp(28px, 5vw, 72px)", fontFamily: displayFont, lineHeight: 1.05 }}>
          {moodLabel}
        </h1>
        <p className="mt-4 text-[18px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont, fontWeight: 300 }}>
          {t("preview.body")}
        </p>

        {/* Preview Card — Hero image (blurred sample) */}
        <div className="mt-10 relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9]">
          <ImageWithFallback
            src={heroImage}
            alt="Trip preview"
            className="w-full h-full object-cover"
            style={{ filter: "blur(18px) brightness(0.7) saturate(1.3)", transform: "scale(1.15)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] p-4 sm:p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C4613A] flex items-center justify-center">
                <Icon name="auto_awesome" size={20} className="text-white" filled />
              </div>
              <span className="text-[20px] text-white italic" style={{ fontFamily: displayFont }}>
                {preview ? t("preview.analysisComplete") : t("preview.generating")}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full bg-[#C4613A] rounded-full transition-all duration-1000 ${preview ? "w-full" : "w-[40%]"}`} />
            </div>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
              {preview ? t("preview.analysisPercent") : t("preview.processing")}
            </span>
          </div>
        </div>

        {/* AI-Generated Vibe Tags & Color Palette */}
        {vibeTags.length > 0 && (
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

        {/* AI Outfit Preview — All blurred sample images */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[#292524]" style={{ fontSize: "clamp(24px, 3vw, 36px)", fontFamily: displayFont }}>
              {t("preview.outfitPreview")}
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1410] rounded-full">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>lock</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {t("preview.previewLocked")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => {
              const imgSrc = sampleImages[idx % sampleImages.length] || GENERIC_FALLBACK;
              // Each slot gets unique blur/color treatment so they look like different images
              const blurStyles: React.CSSProperties[] = [
                { filter: "blur(16px) brightness(0.6) saturate(1.3)", transform: "scale(1.3)" },
                { filter: "blur(14px) brightness(0.55) hue-rotate(40deg) saturate(1.4) contrast(1.1)", transform: "scale(1.4) scaleX(-1) translateY(-8%)" },
                { filter: "blur(16px) brightness(0.5) sepia(0.4) saturate(1.6) hue-rotate(-15deg)", transform: "scale(1.5) rotate(5deg) translateX(10%)" },
                { filter: "blur(13px) brightness(0.45) hue-rotate(-50deg) contrast(1.2) saturate(1.3)", transform: "scale(1.45) scaleX(-1) rotate(-4deg) translateY(10%)" },
              ];
              return (
                <div key={idx}>
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <ImageWithFallback
                      src={imgSrc}
                      alt={`Outfit preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      style={blurStyles[idx]}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>lock</span>
                      </div>
                      <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                        {t("preview.unlock")}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white/70 text-[10px] uppercase tracking-[0.1em] block" style={{ fontFamily: "var(--font-mono)" }}>
                        {t("preview.dayLook").replace("{n}", String(idx + 1))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between px-1">
            <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
              {t("preview.sampleNote")}
            </span>
            <button
              onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              {t("preview.unlockAll")}
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
              { labelKey: "preview.destination", value: hasMultipleCities ? t("preview.andMore").replace("{city}", city).replace("{n}", String(cityCount - 1)) : (country ? `${city}, ${country}` : city) },
              { labelKey: "preview.duration", value: durationValue },
              { labelKey: "preview.aesthetic", value: aestheticLabel },
              { labelKey: "preview.weather", value: weatherDisplay },
            ].map((item) => (
              <div key={item.labelKey}>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {t(item.labelKey)}
                </span>
                <span className="text-[14px] sm:text-[20px] text-[#292524] break-words block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.value}</span>
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
                {t("preview.capsuleEstimate")}: {capsuleCount} {t("preview.capsulePieces")}
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
                {t("preview.capsuleNote")}
              </p>
            </div>
          </div>
        )}

        {/* Avoid Note from Vibe — per active city */}
        {activeVibe?.avoid_note && (
          <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FCD34D]/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="info" size={16} className="text-[#D97706]" />
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#D97706]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("preview.styleTip")}</span>
            </div>
            <p className="text-[14px] text-[#92400E]" style={{ fontFamily: bodyFont }}>{activeVibe.avoid_note}</p>
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

          {checkoutError && (
            <div className="mb-6 max-w-[1000px] mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <Icon name="error" size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-[14px] text-red-700" style={{ fontFamily: bodyFont }}>{checkoutError}</p>
              <button onClick={() => setCheckoutError(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">
                <Icon name="close" size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
            {/* Pro */}
            <div className="relative flex flex-col p-5 sm:p-8 bg-[#C4613A] text-white rounded-2xl mt-4" style={{ boxShadow: "0 4px 16px rgba(196,97,58,.25)" }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1A1410] text-white text-[10px] uppercase tracking-[0.12em] rounded-full" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.pro.badge")}
              </span>
              <h3 className="text-white not-italic text-[28px]" style={{ fontFamily: displayFont }}>Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[36px] sm:text-[48px] text-white" style={{ fontFamily: displayFont, fontWeight: 700 }}>$3.99</span>
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
              <button onClick={() => handleCheckout("pro")} className="mt-8 h-[56px] w-full bg-white text-[#C4613A] text-[14px] uppercase tracking-[0.08em] rounded-xl hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {checkoutLoading === "pro" ? t("preview.processing") : t("pricing.pro.cta")}
              </button>
            </div>

            {/* Annual */}
            <div className="relative flex flex-col p-5 sm:p-8 bg-white border border-[#C4613A]/10 rounded-2xl mt-4">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gold-gradient text-white text-[10px] uppercase tracking-[0.12em] rounded-full whitespace-nowrap" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                {t("pricing.annual.badge")}
              </span>
              <h3 className="not-italic text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>Annual</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[36px] sm:text-[48px] text-[#292524]" style={{ fontFamily: displayFont, fontWeight: 700 }}>$9.99</span>
                <span className="text-[14px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t("pricing.perYear")}</span>
              </div>
              <div className="mt-6 flex flex-col gap-3 flex-1">
                {[1,2,3,4].map((n) => (
                  <CheckItem key={n} label={t(`pricing.annual.features.${n}`)} />
                ))}
              </div>
              <div className="mt-8">
                <BtnDark onClick={() => handleCheckout("annual")} className="w-full">
                  {checkoutLoading === "annual" ? t("preview.processing") : t("pricing.annual.cta")}
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
          {[
            { key: "footer.privacy", path: "/privacy" },
            { key: "footer.terms", path: "/terms" },
            { key: "footer.contact", path: "/contact" },
          ].map((item) => (
            <button key={item.key} onClick={() => navigate(item.path)} className="text-[11px] uppercase tracking-[0.1em] text-[#57534e] hover:text-[#C4613A] transition-colors cursor-pointer py-3 px-1" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              {t(item.key)}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

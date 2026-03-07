import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  BtnSecondary,
  PlanBadge,
  TagChip,
  DayPlanStrip,
  StyleCodeCard,
  MoodCard,
  UpgradeBanner,
  ProUpsellCard,
  FloatingUpgradeBar,
  SocialShareButton,
  SignupPrompt,
  ProfileBadge,
  AiGeneratedBadge,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type PackingItem,
} from "../services/outfitGenerator";
import type { CapsuleItem, DayPlan, WeatherData, VibeData } from "../lib/api";
import { exportDashboardPdf } from "../services/exportDashboardPdf";
import { createCheckoutSession } from "../services/polarCheckout";
import { GA } from "../lib/analytics";
import { SEO } from "../components/SEO";

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

// Generic travel-themed fallbacks (not city-specific)
const FALLBACK_HERO = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
const FALLBACK_MOOD = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

export function StandardDashboard() {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(1);
  const [expandedOutfit, setExpandedOutfit] = useState(0);
  const { isLoggedIn, setShowSignupPrompt, authLoading, setShowLoginModal, setLoginModalContext } = useAuth();
  const { data: onboarding } = useOnboarding();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const { t } = useLang();
  const [pdfExporting, setPdfExporting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = useCallback(async () => {
    if (!mainRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      const citySlug = cityName?.toLowerCase().replace(/\s+/g, "-") || "trip";
      await exportDashboardPdf(mainRef.current, `travel-capsule-standard-${citySlug}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting]);

  const handleUpgradeToPro = useCallback(async () => {
    GA.planSelected("pro");
    GA.checkoutStart("pro");
    try {
      const successUrl = `${window.location.origin}/checkout/success?plan=pro`;
      const session = await createCheckoutSession({
        plan: "pro",
        successUrl,
        tripId: tripId || undefined,
      });
      if (session.url) {
        window.location.href = session.url;
      } else {
        navigate("/preview");
      }
    } catch {
      navigate("/preview");
    }
  }, [tripId, navigate]);

  // Login gate — Standard is free but requires sign-up
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLoginModalContext("onboarding_gate");
      setShowLoginModal(true);
      navigate("/preview", { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate, setShowLoginModal, setLoginModalContext]);

  // Load result if not yet loaded
  useEffect(() => {
    if (tripId && !result && !tripLoading) {
      loadResult(tripId);
    }
  }, [tripId, result, tripLoading, loadResult]);

  // Re-poll for capsule data if result loaded but has no AI capsule items yet
  // (webhook pipeline may still be generating capsule wardrobe)
  useEffect(() => {
    if (!tripId || !result || tripLoading) return;
    const hasCapsule = (result.capsule?.items?.length ?? 0) > 0;
    if (hasCapsule) return;
    const timer = setTimeout(() => loadResult(tripId), 10000);
    return () => clearTimeout(timer);
  }, [tripId, result, tripLoading, loadResult]);

  // ─── Extract real API data ───────────────────────────────────────────────
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiDailyPlan: DayPlan[] = result?.capsule?.daily_plan || [];
  const apiImages = result?.images || [];
  const teaserUrl = result?.teaser_url || preview?.teaser_url || "";

  const hasRealData = apiCapsuleItems.length > 0;

  // ─── Fallback to mock data when API not ready ────────────────────────────
  // Use onboarding data first; fall back to API result profile (survives page refresh)
  const profile = useMemo(() => {
    const hasOnboardingProfile = onboarding.gender || onboarding.height || onboarding.weight;
    if (hasOnboardingProfile) return buildProfile(onboarding);
    return buildProfile({
      gender: result?.gender || onboarding.gender || "female",
      height: result?.height_cm ? String(result.height_cm) : onboarding.height,
      weight: result?.weight_kg ? String(result.weight_kg) : onboarding.weight,
      aesthetics: result?.aesthetics?.length ? result.aesthetics : onboarding.aesthetics,
      photo: onboarding.photo,
    });
  }, [onboarding, result]);
  const primaryCity = onboarding.cities[0];
  const cityName = result?.cities?.[0]?.name || primaryCity?.city || "Paris";
  const countryName = result?.cities?.[0]?.country || primaryCity?.country || "France";

  const cityInput = useMemo(() => ({
    city: cityName,
    country: countryName,
    fromDate: primaryCity?.fromDate || "2026-04-12",
    toDate: primaryCity?.toDate || "2026-04-18",
  }), [cityName, countryName, primaryCity]);

  const mockOutfits: GeneratedOutfit[] = useMemo(
    () => generateCityOutfits(profile, cityInput, 4),
    [profile, cityInput],
  );
  const mockPacking: PackingItem[] = useMemo(() => derivePacking(mockOutfits), [mockOutfits]);

  // ─── Merge: prefer real data, fall back to mock ──────────────────────────
  const primaryWeather = apiWeather[0];
  const primaryVibe = apiVibes[0];
  const moodLabel = primaryVibe?.mood_label || preview?.mood_label || `${cityName} Style`;
  const moodName = primaryVibe?.mood_name || "Curated Style";
  const vibeColors = primaryVibe?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"];

  // Day plans — use API data if available
  const dayPlanData = apiDailyPlan.length > 0
    ? apiDailyPlan.map((d) => ({ day: d.day, activity: d.note?.split(" ").slice(0, 2).join(" ") || `Day ${d.day}` }))
    : [
        { day: 1, activity: "Arrival" }, { day: 2, activity: "Explore" },
        { day: 3, activity: "Museums" }, { day: 4, activity: "Shopping" },
        { day: 5, activity: "Local Life" }, { day: 6, activity: "Day Trip" },
        { day: 7, activity: "Departure" },
      ];

  // Which outfit image to show — API images > teaser (personalized) > mock
  // Standard plan: 1 AI teaser + 3 CSS variants = all 4 slots use teaser after signup
  const getOutfitImage = (idx: number): string => {
    if (apiImages.length > idx) return apiImages[idx].url;
    // Use teaser image (personalized from preview) as better fallback than mock
    if (teaserUrl) return teaserUrl;
    return mockOutfits[idx]?.image || FALLBACK_HERO;
  };

  // CSS variations so teaser-based outfit images look distinct per slot
  const outfitImageStyles: React.CSSProperties[] = [
    {},
    { transform: "scaleX(-1)", filter: "hue-rotate(15deg) brightness(0.95)" },
    { objectPosition: "top", filter: "saturate(1.2) brightness(0.92)" },
    { transform: "scaleX(-1)", objectPosition: "bottom", filter: "hue-rotate(-15deg) brightness(0.95)" },
  ];
  const usesTeaserVariant = (idx: number) => apiImages.length <= idx && !!teaserUrl;

  // Capsule items to display
  const displayItems = hasRealData
    ? apiCapsuleItems
    : mockPacking.map((p) => ({ name: p.name, category: p.category, why: "", versatility_score: p.usageCount }));

  const bodyFitLabel = mockOutfits[0]?.bodyFitLabel || "";
  // Derive simple size letter for SizeChip (bodyFitLabel is a full sentence)
  const sizeLabel = (() => {
    const h = parseFloat(profile.height) || 0;
    const w = parseFloat(profile.weight) || 0;
    if (!h || !w) return "M";
    const bmi = w / ((h / 100) ** 2);
    if (bmi < 19) return "S";
    if (bmi < 23) return "M";
    if (bmi < 27) return "L";
    return "XL";
  })();

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your Travel Capsule — Standard" description="Your AI-generated travel outfit and capsule wardrobe packing list." noindex={true} />
      <SignupPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block"><PlanBadge label={`Standard · ${t("pricing.promoFree")}`} /></span>
            <SocialShareButton />
            <button onClick={() => window.open(`mailto:?subject=My Travel Capsule AI Style Guide&body=Check out my travel capsule wardrobe: ${window.location.href}`)} className="no-print w-9 h-9 rounded-full bg-white border border-[#E8DDD4] flex items-center justify-center hover:border-[#C4613A]/30 transition-colors cursor-pointer">
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button onClick={handleExportPdf} disabled={pdfExporting} className="no-print h-[36px] px-3 sm:px-4 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              {pdfExporting ? <span className="w-4 h-4 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="picture_as_pdf" size={16} className="text-[#C4613A]" />} <span className="hidden sm:inline">{pdfExporting ? "Exporting..." : "Save PDF"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-6" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {moodLabel}
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          {t("dashboard.standardSubtitle")}
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 85} bodyFitLabel={bodyFitLabel} />
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-10">

            {/* AI Outfit Cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  {hasRealData ? t("dashboard.aiCuratedOutfits") : t("dashboard.yourStylePreview")}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  {hasRealData ? `${Math.min(apiCapsuleItems.length, 4)} Looks` : "4 Looks"}
                </span>
              </div>

              <div className="space-y-6">
                {(hasRealData ? apiDailyPlan.slice(0, 4) : mockOutfits).map((item, idx) => {
                  const outfit = hasRealData ? null : (item as GeneratedOutfit);
                  const dayPlan = hasRealData ? (item as DayPlan) : null;
                  const title = outfit?.title || `Day ${dayPlan?.day || idx + 1} Outfit`;
                  const subtitle = outfit?.subtitle || dayPlan?.note || "";
                  const confidence = outfit?.aiConfidence || 90;

                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                      <button
                        onClick={() => setExpandedOutfit(expandedOutfit === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[#FDF8F3]/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-10 h-10 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[14px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {dayPlan?.day || outfit?.day || idx + 1}
                          </span>
                          <div className="text-left">
                            <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{title}</span>
                            <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{subtitle}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            {confidence}% match
                          </span>
                          <Icon name={expandedOutfit === idx ? "expand_less" : "expand_more"} size={24} className="text-[#57534e]" />
                        </div>
                      </button>

                      {expandedOutfit === idx && (
                        <div className="px-5 pb-6">
                          <div className="space-y-6">
                            {/* Outfit image */}
                            <div className="relative rounded-xl overflow-hidden w-full max-w-[400px]" style={{ aspectRatio: "3/4" }}>
                              <ImageWithFallback src={getOutfitImage(idx)} alt={title} className="w-full h-full object-cover" style={usesTeaserVariant(idx) ? outfitImageStyles[idx] : undefined} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                              <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                                  <Icon name="auto_awesome" size={10} className="text-white" filled /> {apiImages.length > idx ? "AI Generated" : "Style Preview"}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); downloadImage(getOutfitImage(idx), `capsule-outfit-${idx + 1}.jpg`); }}
                                  className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                                  title={t("dashboard.downloadImage")}
                                >
                                  <Icon name="download" size={16} className="text-white" />
                                </button>
                              </div>
                            </div>

                            {/* Items breakdown */}
                            <div>
                              <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-4" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                                {hasRealData ? "AI-Recommended Items" : "Outfit Breakdown"}
                              </span>
                              <div className="space-y-2">
                                {hasRealData ? (
                                  // Real capsule items
                                  (dayPlan?.outfit || apiCapsuleItems.slice(idx * 3, idx * 3 + 5)).map((name, i) => {
                                    const capsuleItem = typeof name === "string"
                                      ? apiCapsuleItems.find((c) => c.name === name) || { name, category: "", why: "", versatility_score: 0 }
                                      : name;
                                    const catIcon: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", shoes: "footprint", accessory: "watch" };
                                    const itemCat = typeof capsuleItem !== "string" ? capsuleItem.category?.toLowerCase() : "";
                                    const iconName = catIcon[itemCat] ?? "checkroom";
                                    return (
                                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                        <div className="w-12 h-12 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                                          <Icon name={iconName} size={20} className="text-[#57534e]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                                              {typeof capsuleItem === "string" ? capsuleItem : capsuleItem.name}
                                            </span>
                                            <SizeChip size={sizeLabel} />
                                          </div>
                                          {typeof capsuleItem !== "string" && capsuleItem.why && (
                                            <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{capsuleItem.why}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  // Mock items
                                  outfit?.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                      <ImageWithFallback src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                                          <SizeChip size={item.recommendedSize} />
                                        </div>
                                        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.desc}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day-by-Day Itinerary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.yourItinerary")}</h2>
              </div>
              <DayPlanStrip days={dayPlanData} activeDay={activeDay} onDaySelect={setActiveDay} />
              <div className="mt-4 bg-white rounded-xl border border-[#E8DDD4] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="event" size={18} className="text-[#C4613A]" />
                  <span className="text-[16px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                    Day {activeDay}: {dayPlanData.find((d) => d.day === activeDay)?.activity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  {primaryWeather ? (
                    [
                      { icon: "thermostat", val: `${Math.round(primaryWeather.temperature_day_avg)}°C`, label: "Avg Temp" },
                      { icon: "water_drop", val: `${Math.round(primaryWeather.precipitation_prob * 100)}%`, label: "Rain" },
                      { icon: "explore", val: primaryWeather.climate_band, label: "Climate" },
                    ].map((s) => (
                      <div key={s.label} className="py-3 bg-[#FDF8F3] rounded-lg">
                        <Icon name={s.icon} size={18} className="text-[#C4613A] mx-auto mb-1" />
                        <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-mono)" }}>{s.val}</span>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</span>
                      </div>
                    ))
                  ) : (
                    [
                      { icon: "thermostat", val: "—", label: "Avg Temp" },
                      { icon: "water_drop", val: "—", label: "Rain" },
                      { icon: "explore", val: "Loading…", label: "Climate" },
                    ].map((s) => (
                      <div key={s.label} className="py-3 bg-[#FDF8F3] rounded-lg">
                        <Icon name={s.icon} size={18} className="text-[#C4613A] mx-auto mb-1" />
                        <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-mono)" }}>{s.val}</span>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Packing Checklist */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.yourPackingList")}</h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {displayItems.length} items {hasRealData && "· AI curated"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayItems.map((item, i) => {
                  const CAT_ICON: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", shoes: "footprint", accessory: "watch" };
                  const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                  return (
                  <div key={i} className="group bg-white rounded-xl border border-[#E8DDD4] overflow-hidden hover:border-[#C4613A]/30 transition-colors">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name={iconName} size={16} className="text-[#C4613A]" />
                        <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                      </div>
                      <span className="text-[10px] text-[#57534e] capitalize block" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                      {hasRealData && item.why && (
                        <p className="mt-2 text-[11px] text-[#57534e] leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{item.why}</p>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Pro Upgrade Card */}
            <ProUpsellCard onUpgrade={handleUpgradeToPro} />

            {/* Timer banner */}
            <UpgradeBanner initialMinutes={14} initialSeconds={59} onUpgrade={handleUpgradeToPro} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6">
            <ProfileBadge
              gender={profile.gender}
              height={profile.height}
              weight={profile.weight}
              aesthetics={profile.aesthetics}
              photo={profile.photo}
              faceUrl={onboarding.faceUrl}
              bodyFitLabel={bodyFitLabel}
            />

            <StyleCodeCard
              description={primaryVibe
                ? `${moodName} \u2014 ${primaryVibe.vibe_tags?.join(", ") || "Curated style adapted to local weather and culture."}`
                : `AI-curated travel style for ${cityName}.`}
              city={`${cityName}, ${countryName.slice(0, 2).toUpperCase()}`}
              temp={primaryWeather ? Math.round(primaryWeather.temperature_day_avg) : 0}
              rain={primaryWeather ? Math.round(primaryWeather.precipitation_prob * 100) : 0}
              uv={3}
            />

            <MoodCard
              imageUrl={teaserUrl || FALLBACK_MOOD}
              city={`${cityName} Mood`}
              description={primaryVibe?.avoid_note || "Style insights powered by AI weather and culture analysis."}
              swatches={vibeColors}
            />

            {/* Capsule Summary */}
            <div className="bg-white rounded-xl border border-[#E8DDD4] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.capsuleSummary")}</h3>
              <div className="space-y-3">
                {[
                  { icon: "checkroom", label: "Packing Items", value: `${displayItems.length} pieces` },
                  { icon: "style", label: "AI Outfits", value: `${Math.min(apiDailyPlan.length || 4, 4)} looks` },
                  { icon: "thermostat", label: "Climate", value: primaryWeather?.climate_band || "mild" },
                  { icon: "auto_awesome", label: "Mood", value: moodName },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon name={stat.icon} size={16} className="text-[#C4613A]" />
                      <span className="text-[13px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{stat.label}</span>
                    </div>
                    <span className="text-[13px] text-[#292524] capitalize" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating bottom upgrade bar */}
      <FloatingUpgradeBar onUpgrade={handleUpgradeToPro} />
    </div>
  );
}

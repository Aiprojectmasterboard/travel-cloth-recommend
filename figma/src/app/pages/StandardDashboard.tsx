// IMPORTANT: TDZ 방지 — const 파생 변수는 그것을 참조하는 모든 useEffect/useCallback 위에 선언해야 함.
// BUG-001 참고: https://github.com/Aiprojectmasterboard/travel-cloth-recommend/blob/main/CLAUDE.md
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
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
  derivePacking,
  generateCityOutfits,
  type PackingItem,
} from "../services/outfitGenerator";
import { pollTeaser, type CapsuleItem, type DayPlan, type WeatherData, type VibeData, type DailyForecast } from "../lib/api";
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

// Generic travel-themed fallback (not city-specific)
const FALLBACK_HERO = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
const FALLBACK_MOOD = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

const CAT_ICON: Record<string, string> = {
  top: "checkroom",
  bottom: "layers",
  outerwear: "dry_cleaning",
  footwear: "footprint",
  shoes: "footprint",
  accessory: "watch",
  bag: "shopping_bag",
  dress: "checkroom",
  "dress/jumpsuit": "checkroom",
  skirt: "checkroom",
  hat: "face_retouching_natural",
  jewelry: "diamond",
};

export function StandardDashboard() {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(1);
  const { isLoggedIn, authLoading, setShowLoginModal, setLoginModalContext } = useAuth();
  const { data: onboarding } = useOnboarding();
  const { result, preview, tripId, loading: tripLoading } = useTrip();
  const { t } = useLang();
  const [pdfExporting, setPdfExporting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Login gate — Standard is free but requires sign-up
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLoginModalContext("onboarding_gate");
      setShowLoginModal(true);
      navigate("/preview", { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate, setShowLoginModal, setLoginModalContext]);

  // ─── Extract real API data (MUST be before useEffect/useCallback that reference them) ───
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiDailyPlan: DayPlan[] = result?.capsule?.daily_plan || [];

  // ─── Teaser URL: single AI outfit image (Standard plan) ────────────────
  const [polledTeaserUrl, setPolledTeaserUrl] = useState<string>("");
  const teaserUrl = polledTeaserUrl || result?.teaser_url || preview?.teaser_url || "";

  // ─── Profile & city ────────────────────────────────────────────────────
  const profile = useMemo(() => {
    const hasOnboardingProfile = onboarding.gender || onboarding.silhouette || onboarding.height || onboarding.weight;
    if (hasOnboardingProfile) return buildProfile(onboarding);
    return buildProfile({
      gender: result?.gender || onboarding.gender || "female",
      height: result?.height_cm ? String(result.height_cm) : onboarding.height,
      weight: result?.weight_kg ? String(result.weight_kg) : onboarding.weight,
      silhouette: onboarding.silhouette || undefined,
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

  const mockOutfits = useMemo(() => generateCityOutfits(profile, cityInput, 4), [profile, cityInput]);
  const mockPacking: PackingItem[] = useMemo(() => derivePacking(mockOutfits), [mockOutfits]);

  // ─── Derived display values ─────────────────────────────────────────────
  const hasRealData = apiCapsuleItems.length > 0;

  const bodyFitLabel = mockOutfits[0]?.bodyFitLabel || "";
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

  const primaryWeather = apiWeather[0];
  const dailyForecast: DailyForecast[] | undefined = primaryWeather?.daily_forecast;

  const getWeatherForDay = (dayNum: number) => {
    if (dailyForecast && dailyForecast.length > 0) {
      const dayIdx = Math.min(dayNum - 1, dailyForecast.length - 1);
      const day = dailyForecast[dayIdx];
      return {
        tempMax: Math.round(day.temperature_max),
        tempMin: Math.round(day.temperature_min),
        precipMm: day.precipitation_mm,
        band: day.climate_band,
      };
    }
    if (primaryWeather) {
      return {
        tempMax: Math.round(primaryWeather.temperature_day_avg),
        tempMin: Math.round(primaryWeather.temperature_night_avg),
        precipMm: 0,
        band: primaryWeather.climate_band,
      };
    }
    return { tempMax: 0, tempMin: 0, precipMm: 0, band: "—" };
  };

  const primaryVibe = apiVibes[0];
  const moodLabel = primaryVibe?.mood_label || preview?.mood_label || `${cityName} Style`;
  const moodName = primaryVibe?.mood_name || "Curated Style";
  const vibeColors = primaryVibe?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"];

  const dayPlanData = apiDailyPlan.length > 0
    ? apiDailyPlan.map((d) => ({ day: d.day, activity: d.note?.split(" ").slice(0, 2).join(" ") || `${t("preview.dayLook").replace("{n}", String(d.day))}` }))
    : [
        { day: 1, activity: t("dashboard.activity.arrival") }, { day: 2, activity: t("dashboard.activity.explore") },
        { day: 3, activity: t("dashboard.activity.museums") }, { day: 4, activity: t("dashboard.activity.shopping") },
        { day: 5, activity: t("dashboard.activity.localLife") }, { day: 6, activity: t("dashboard.activity.dayTrip") },
        { day: 7, activity: t("dashboard.activity.departure") },
      ];

  const displayItems = hasRealData
    ? apiCapsuleItems
    : mockPacking.map((p) => ({ name: p.name, category: p.category, why: "", versatility_score: p.usageCount }));

  // Image loading state: still waiting for AI teaser?
  const teaserLoading = !teaserUrl && !!tripId && !tripLoading;

  // ─── IMPORTANT: Callbacks declared AFTER all derived variables above (TDZ prevention) ───

  const handleExportPdf = useCallback(async () => {
    if (!mainRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      const citySlug = cityName?.toLowerCase().replace(/\s+/g, "-") || "trip";
      await exportDashboardPdf(mainRef.current, `travel-capsule-standard-${citySlug}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting, cityName]);

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

  // ─── Poll for AI teaser image (1 image for Standard plan) ────────────
  useEffect(() => {
    if (polledTeaserUrl || !tripId) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 25;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const res = await pollTeaser(tripId);
          if (cancelled) return;
          if (res.teaser_url) {
            setPolledTeaserUrl(res.teaser_url);
            return;
          }
          if (res.teaser_urls && res.teaser_urls.length > 0) {
            setPolledTeaserUrl(res.teaser_urls[0]);
            return;
          }
          if (res.status === "ready" || res.status === "fallback") {
            return;
          }
        } catch { /* ignore poll errors */ }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [tripId, polledTeaserUrl]);

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your Travel Capsule — Standard" description="Your AI-generated travel outfit and capsule wardrobe packing list." noindex={true} />
      <SignupPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block"><PlanBadge label={`Standard · ${t("pricing.promoFree")}`} /></span>
            <SocialShareButton />
            <button
              onClick={() => window.open(`mailto:?subject=My Travel Capsule AI Style Guide&body=Check out my travel capsule wardrobe: ${window.location.href}`)}
              className="no-print hidden sm:flex w-11 h-11 rounded-full bg-white border border-[#E8DDD4] items-center justify-center hover:border-[#C4613A]/30 transition-colors cursor-pointer"
            >
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="no-print h-[36px] px-3 sm:px-4 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              {pdfExporting
                ? <span className="w-4 h-4 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" />
                : <Icon name="picture_as_pdf" size={16} className="text-[#C4613A]" />}
              <span className="hidden sm:inline">{pdfExporting ? t("dashboard.exporting") : t("dashboard.savePdf")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-4 sm:px-6 pt-10 pb-6" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
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
      <div className="mx-auto px-4 sm:px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-10 order-last lg:order-none">

            {/* ─── Single AI Outfit Image ─── */}
            <div>
              <h2 className="text-[24px] text-[#292524] mb-6" style={{ fontFamily: "var(--font-display)" }}>
                {t("dashboard.yourAiOutfit")}
              </h2>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Outfit image */}
                <div className="relative rounded-2xl overflow-hidden w-full sm:w-auto sm:max-w-[320px] flex-shrink-0" style={{ aspectRatio: "3/4" }}>
                  {teaserLoading ? (
                    <>
                      <div
                        className="w-full h-full bg-gradient-to-br from-[#EFE8DF] via-[#F5EFE6] to-[#EFE8DF]"
                        style={{ animation: "shimmer 2s ease-in-out infinite" }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                        <div className="w-10 h-10 border-[3px] border-[#E8DDD4] border-t-[#C4613A] rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
                        <span className="text-[13px] text-[#57534e]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                          {t("dashboard.generatingOutfits")}
                        </span>
                        <p className="text-[11px] text-[#a8a29e] mt-1" style={{ fontFamily: "var(--font-mono)" }}>{t("dashboard.generatingTime")}</p>
                        <p className="text-[10px] text-[#a8a29e]/70 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>{t("dashboard.generatingSubtext")}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageWithFallback
                        src={teaserUrl || FALLBACK_HERO}
                        alt={`${cityName} AI outfit`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                          <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("dashboard.aiGenerated")}
                        </span>
                        {teaserUrl && (
                          <button
                            onClick={() => downloadImage(teaserUrl, `capsule-outfit-${cityName.toLowerCase()}.jpg`)}
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                            title={t("dashboard.downloadImage")}
                          >
                            <Icon name="download" size={16} className="text-white" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Right panel: weather + vibe + capsule items */}
                <div className="flex-1 min-w-0 space-y-5">
                  {/* City vibe */}
                  <div className="bg-white rounded-xl border border-[#E8DDD4] p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="location_on" size={16} className="text-[#C4613A]" />
                      <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                        {cityName}, {countryName}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#57534e] italic" style={{ fontFamily: "var(--font-display)" }}>
                      {moodName}
                    </p>
                    {primaryVibe?.vibe_tags && primaryVibe.vibe_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {primaryVibe.vibe_tags.slice(0, 4).map((tag) => (
                          <TagChip key={tag} label={tag} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weather */}
                  {primaryWeather && (
                    <div className="bg-[#E0F2FE]/60 rounded-xl border border-[#BAE6FD] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="thermostat" size={16} className="text-[#0369A1]" />
                        <span className="text-[12px] text-[#0369A1] uppercase tracking-[0.08em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          {t("dashboard.weatherOutlook")}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { icon: "thermostat", val: `${Math.round(primaryWeather.temperature_day_avg)}°C`, label: t("dashboard.dayAvg") },
                          { icon: "water_drop", val: `${Math.round(primaryWeather.precipitation_prob * 100)}%`, label: t("dashboard.rain") },
                          { icon: "explore", val: primaryWeather.climate_band, label: t("dashboard.climate") },
                        ].map((s) => (
                          <div key={s.label} className="py-2 bg-white/60 rounded-lg">
                            <Icon name={s.icon} size={16} className="text-[#0369A1] mx-auto mb-1" />
                            <span className="text-[13px] text-[#292524] block capitalize" style={{ fontFamily: "var(--font-mono)" }}>{s.val}</span>
                            <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capsule items list */}
                  <div className="bg-white rounded-xl border border-[#E8DDD4] p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-3" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                      {hasRealData ? t("dashboard.aiRecommendedItems") : t("dashboard.yourStylePreview")}
                    </span>
                    <div className="space-y-2">
                      {displayItems.slice(0, 5).map((item, i) => {
                        const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                              <Icon name={iconName} size={16} className="text-[#57534e]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                                  {item.name}
                                </span>
                                <SizeChip size={sizeLabel} />
                              </div>
                              {item.why && (
                                <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.why}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {displayItems.length > 5 && (
                        <p className="text-[11px] text-[#a8a29e] pt-1" style={{ fontFamily: "var(--font-mono)" }}>
                          +{displayItems.length - 5} {t("dashboard.moreItemsBelow")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                  {primaryWeather ? (() => {
                    const dayW = getWeatherForDay(activeDay);
                    return [
                      { icon: "thermostat", val: `${dayW.tempMax}°/${dayW.tempMin}°`, label: dailyForecast ? t("dashboard.highLow") : t("dashboard.avgTemp") },
                      { icon: "water_drop", val: dailyForecast ? `${dayW.precipMm}mm` : `${Math.round(primaryWeather.precipitation_prob * 100)}%`, label: dailyForecast ? t("dashboard.precip") : t("dashboard.rain") },
                      { icon: "explore", val: dayW.band, label: t("dashboard.climate") },
                    ].map((s) => (
                      <div key={s.label} className="py-3 bg-[#FDF8F3] rounded-lg">
                        <Icon name={s.icon} size={18} className="text-[#C4613A] mx-auto mb-1" />
                        <span className="text-[14px] text-[#292524] block capitalize" style={{ fontFamily: "var(--font-mono)" }}>{s.val}</span>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</span>
                      </div>
                    ));
                  })() : (
                    [
                      { icon: "thermostat", val: "—", label: t("dashboard.highLow") },
                      { icon: "water_drop", val: "—", label: t("dashboard.precip") },
                      { icon: "explore", val: t("dashboard.loadingEllipsis"), label: t("dashboard.climate") },
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
                  {displayItems.length} {t("dashboard.items")} {hasRealData && `· ${t("dashboard.aiCurated")}`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayItems.map((item, i) => {
                  const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                  return (
                    <div key={i} className="bg-white rounded-xl border border-[#E8DDD4] overflow-hidden hover:border-[#C4613A]/30 transition-colors">
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

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-br from-[#1A1410] to-[#2D1F17] rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#C4613A]/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" size={24} className="text-[#C4613A]" filled />
                </div>
                <div className="flex-1">
                  <h3 className="text-[20px] italic mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    {t("dashboard.upgradeProTitle")}
                  </h3>
                  <p className="text-[14px] text-white/70 mb-4" style={{ fontFamily: "var(--font-body)" }}>
                    {t("dashboard.upgradeProDescription")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <BtnPrimary
                      onClick={handleUpgradeToPro}
                      className="bg-[#C4613A] hover:bg-[#b5572f] text-white px-6 h-[44px] rounded-xl text-[13px] uppercase tracking-[0.08em]"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                    >
                      {t("upgrade.cta")}
                    </BtnPrimary>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {[
                      t("upgrade.feature1"),
                      t("upgrade.feature2"),
                      t("upgrade.feature3"),
                      t("upgrade.feature4"),
                    ].map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-[13px] text-white/80" style={{ fontFamily: "var(--font-body)" }}>
                        <Icon name="check_circle" size={14} className="text-[#C4613A] flex-shrink-0" filled />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro Upsell Card & Timer banner */}
            <ProUpsellCard onUpgrade={handleUpgradeToPro} />
            <UpgradeBanner initialMinutes={14} initialSeconds={59} onUpgrade={handleUpgradeToPro} />
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6 order-first lg:order-none">
            <ProfileBadge
              gender={profile.gender}
              height={profile.height}
              weight={profile.weight}
              silhouette={profile.silhouette}
              aesthetics={profile.aesthetics}
              photo={profile.photo}
              faceUrl={onboarding.faceUrl}
              bodyFitLabel={bodyFitLabel}
            />

            <StyleCodeCard
              description={primaryVibe
                ? `${moodName} — ${primaryVibe.vibe_tags?.join(", ") || "Curated style adapted to local weather and culture."}`
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
                  { icon: "checkroom", label: t("dashboard.packingItems"), value: `${displayItems.length} ${t("dashboard.pieces")}` },
                  { icon: "style", label: t("dashboard.aiOutfits"), value: `1 ${t("dashboard.look")}` },
                  { icon: "thermostat", label: t("dashboard.climate"), value: primaryWeather?.climate_band || t("dashboard.mild") },
                  { icon: "auto_awesome", label: t("dashboard.mood"), value: moodName },
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

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

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
import { exportDashboardPdf, shareAsImage } from "../services/exportDashboardPdf";
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

// Blur overlay placeholder images — fashion-themed neutral images (not city-specific)
const BLUR_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
  "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
];

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
  const [expandedOutfit, setExpandedOutfit] = useState<number | null>(0);
  const { isLoggedIn, authLoading, setShowLoginModal, setLoginModalContext } = useAuth();
  const { data: onboarding } = useOnboarding();
  const { result, preview, tripId, loading: tripLoading } = useTrip();
  const { t, displayFont, bodyFont } = useLang();
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

  // ─── 4-slot outfit data for the 2x2 grid ────────────────────────────────
  // Slot 0 = clear (teaser). Slots 1-3 = blurred placeholders with upgrade prompt.
  const outfitSlots = useMemo(() => {
    const dayLabels = [
      t("dashboard.activity.arrival"),
      t("dashboard.activity.explore"),
      t("dashboard.activity.museums"),
      t("dashboard.activity.shopping"),
    ];
    const planDays = apiDailyPlan.length > 0
      ? apiDailyPlan.slice(0, 4).map((d, i) => ({
          day: d.day,
          activity: d.note?.split(" ").slice(0, 3).join(" ") || dayLabels[i] || `Day ${d.day}`,
        }))
      : dayLabels.map((label, i) => ({ day: i + 1, activity: label }));

    return [0, 1, 2, 3].map((i) => ({
      slotIndex: i,
      day: planDays[i]?.day ?? i + 1,
      activity: planDays[i]?.activity ?? dayLabels[i] ?? `Day ${i + 1}`,
      isUnlocked: i === 0,
      image: i === 0 ? (teaserUrl || FALLBACK_HERO) : BLUR_PLACEHOLDERS[(i - 1) % BLUR_PLACEHOLDERS.length],
    }));
  }, [apiDailyPlan, teaserUrl, t]);

  // ─── Items for the expanded first outfit card ────────────────────────────
  // Uses daily_plan[].outfit[] matching (CLAUDE.md rule — no arbitrary slicing)
  const slot0Items = useMemo(() => {
    if (!hasRealData) {
      return (mockOutfits[0]?.items || []).slice(0, 5).map((it) => ({
        name: it.name,
        category: it.category,
        size: sizeLabel,
        why: "",
      }));
    }
    const dayPlan = apiDailyPlan.find((d) => d.city?.toLowerCase() === cityName.toLowerCase() && d.day === 1)
      ?? apiDailyPlan[0];
    if (!dayPlan?.outfit?.length) return apiCapsuleItems.slice(0, 5).map((c) => ({ name: c.name, category: c.category, size: sizeLabel, why: c.why }));
    const lookup = new Map<string, CapsuleItem>();
    apiCapsuleItems.forEach((c) => lookup.set(c.name.toLowerCase(), c));
    return dayPlan.outfit
      .map((name) => {
        const matched = lookup.get(name.toLowerCase());
        return matched ? { name: matched.name, category: matched.category, size: sizeLabel, why: matched.why } : null;
      })
      .filter((x): x is { name: string; category: string; size: string; why: string } => x !== null)
      .slice(0, 5);
  }, [hasRealData, apiDailyPlan, apiCapsuleItems, cityName, mockOutfits, sizeLabel]);

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

  const [sharing, setSharing] = useState(false);
  const handleShareAsImage = useCallback(async () => {
    if (!mainRef.current || sharing) return;
    setSharing(true);
    try {
      await shareAsImage(mainRef.current, t("dashboard.multiCityStyleGuide"));
    } finally {
      setSharing(false);
    }
  }, [sharing, t]);

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
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block"><PlanBadge label={`Standard · ${t("pricing.promoFree")}`} /></span>
            <button
              onClick={handleShareAsImage}
              disabled={sharing}
              className="no-print h-[44px] px-3 sm:px-4 border border-[#E8DDD4] bg-white text-[#57534e] rounded-full text-[11px] uppercase tracking-[0.08em] hover:border-[#C4613A]/30 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
              aria-label={t("dashboard.share")}
            >
              {sharing ? <span className="w-4 h-4 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="share" size={16} className="text-[#57534e]" />}
              <span className="hidden sm:inline">{t("dashboard.share")}</span>
            </button>
            <button
              onClick={() => {
                const subject = encodeURIComponent(t("dashboard.emailSubject"));
                const body = encodeURIComponent(`${t("dashboard.emailBody")}\n\n${window.location.href}`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }}
              className="no-print hidden sm:flex w-11 h-11 rounded-full bg-white border border-[#E8DDD4] items-center justify-center hover:border-[#C4613A]/30 transition-colors cursor-pointer"
              aria-label={t("dashboard.sendEmail")}
            >
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="no-print h-[44px] px-3 sm:px-4 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
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
      <div className="mx-auto px-4 sm:px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="auto_awesome" size={10} className="text-[#C4613A]" filled /> {t("dashboard.aiGenerated")}
          </span>
        </div>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontFamily: displayFont, lineHeight: 1.1 }}>
          {moodLabel}
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont }}>
          {t("dashboard.standardSubtitle")}
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 85} bodyFitLabel={bodyFitLabel} />
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto px-4 sm:px-6 pt-8 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-10 order-last lg:order-none">

            {/* ─── 2×2 Outfit Grid ─── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[22px] sm:text-[26px] text-[#292524]" style={{ fontFamily: displayFont }}>
                  {cityName} {t("dashboard.outfits")}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>
                  1 {t("dashboard.look")} · 3 {t("dashboard.locked") || "locked"}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-[#1A1410]">
                <div className="grid grid-cols-2 gap-[2px]">
                  {outfitSlots.map((slot) => (
                    <div
                      key={slot.slotIndex}
                      className={`relative overflow-hidden ${slot.isUnlocked ? "cursor-pointer" : "cursor-default"}`}
                      style={{ aspectRatio: "3/4" }}
                      onClick={() => slot.isUnlocked && setExpandedOutfit(expandedOutfit === 0 ? null : 0)}
                    >
                      {/* Loading skeleton for slot 0 while teaser is generating */}
                      {slot.isUnlocked && teaserLoading ? (
                        <>
                          <div
                            className="w-full h-full bg-gradient-to-br from-[#EFE8DF] via-[#F5EFE6] to-[#EFE8DF]"
                            style={{ animation: "shimmer 2s ease-in-out infinite" }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                            <div className="w-8 h-8 border-[3px] border-[#E8DDD4] border-t-[#C4613A] rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
                            <span className="text-[11px] text-[#57534e]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                              {t("dashboard.generatingOutfits")}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageWithFallback
                            src={slot.image}
                            alt={slot.isUnlocked ? `${cityName} AI outfit` : "Locked outfit"}
                            className={`w-full h-full object-cover transition-transform duration-500 ${slot.isUnlocked ? "hover:scale-105" : ""}`}
                            style={slot.isUnlocked ? {} : { filter: "blur(12px)", transform: "scale(1.1)" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          {/* Blurred slot overlay */}
                          {!slot.isUnlocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="lock" size={18} className="text-white" />
                              </div>
                              <span className="text-white text-[10px] uppercase tracking-[0.1em] text-center px-3" style={{ fontFamily: "var(--font-mono)" }}>
                                Pro
                              </span>
                            </div>
                          )}

                          {/* Day label */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <span className="text-white/55 text-[8px] sm:text-[9px] uppercase tracking-[0.14em] block" style={{ fontFamily: "var(--font-mono)" }}>
                              {t("dashboard.day")} {slot.day}
                            </span>
                            <span className="text-white text-[12px] sm:text-[14px] leading-tight block" style={{ fontFamily: displayFont }}>
                              {slot.activity}
                            </span>
                          </div>

                          {/* AI badge on unlocked slot */}
                          {slot.isUnlocked && (
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                                <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("dashboard.aiGenerated")}
                              </span>
                            </div>
                          )}

                          {/* Download button on unlocked slot */}
                          {slot.isUnlocked && teaserUrl && (
                            <div className="absolute top-3 right-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(teaserUrl, `capsule-outfit-${cityName.toLowerCase()}.jpg`); }}
                                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                                title={t("dashboard.downloadImage")}
                              >
                                <Icon name="download" size={14} className="text-white" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overlay badges */}
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap" style={{ pointerEvents: "none" }}>
                  {/* badges rendered per-slot above, so just city tag here */}
                </div>
                <div className="absolute bottom-3 right-3" style={{ pointerEvents: "none" }}>
                  <span className="px-3 py-1 rounded-full bg-[#C4613A]/90 text-white text-[10px]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                    {cityName}, {countryName} · 4 {t("dashboard.looks")}
                  </span>
                </div>
              </div>

              {/* Unlock 3 more prompt */}
              <div className="mt-3 flex items-center gap-2 justify-center">
                <Icon name="lock" size={14} className="text-[#8A7B6E]" />
                <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                  3 {t("dashboard.looks")} locked —{" "}
                  <button
                    onClick={handleUpgradeToPro}
                    className="text-[#C4613A] underline underline-offset-2 cursor-pointer hover:text-[#a84d2e] transition-colors"
                    style={{ fontFamily: bodyFont, fontWeight: 600 }}
                  >
                    {t("upgrade.cta")}
                  </button>
                </span>
              </div>
            </div>

            {/* ─── Outfit Accordion (slot 0 only, expandable) ─── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[22px] sm:text-[26px] text-[#292524]" style={{ fontFamily: displayFont }}>
                  {cityName} {t("dashboard.outfitBreakdown")}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Slot 0 — unlocked, expandable */}
                <div
                  className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden transition-shadow"
                  style={{ boxShadow: expandedOutfit === 0 ? "0 4px 24px rgba(196,97,58,.10)" : "0 2px 12px rgba(0,0,0,.04)" }}
                >
                  <button
                    onClick={() => setExpandedOutfit(expandedOutfit === 0 ? null : 0)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#FDF8F3]/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 text-left">
                      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C4613A]/10 flex-shrink-0 flex items-center justify-center text-[13px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {outfitSlots[0].day}
                      </span>
                      <div>
                        <span className="text-[16px] sm:text-[18px] text-[#292524] block leading-snug" style={{ fontFamily: displayFont }}>
                          {outfitSlots[0].activity}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>{moodName}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            {t("dashboard.aiGenerated")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Icon name={expandedOutfit === 0 ? "expand_less" : "expand_more"} size={22} className="text-[#8A7B6E] flex-shrink-0 ml-2" />
                  </button>

                  {expandedOutfit === 0 && (
                    <div className="px-4 sm:px-5 pb-6 border-t border-[#EFE8DF]">
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-5 sm:gap-6">
                        {/* Outfit image */}
                        <div className="relative rounded-xl overflow-hidden self-start" style={{ aspectRatio: "3/4" }}>
                          {teaserLoading ? (
                            <div
                              className="w-full h-full bg-gradient-to-br from-[#EFE8DF] via-[#F5EFE6] to-[#EFE8DF]"
                              style={{ animation: "shimmer 2s ease-in-out infinite" }}
                            />
                          ) : (
                            <>
                              <ImageWithFallback src={teaserUrl || FALLBACK_HERO} alt={`${cityName} AI outfit`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                              <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                                  <Icon name="auto_awesome" size={9} className="text-white" filled /> AI
                                </span>
                              </div>
                              <div className="absolute bottom-3 left-3">
                                <div className="flex gap-1.5">
                                  {vibeColors.slice(0, 4).map((color) => (
                                    <div key={color} className="w-4 h-4 rounded-full border-2 border-white/60" style={{ backgroundColor: color }} />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Right: stylist note + items */}
                        <div className="min-w-0">
                          {/* City vibe note */}
                          {primaryVibe?.avoid_note && (
                            <div className="bg-[#FDF8F3] rounded-xl p-4 mb-4 border-l-[3px] border-[#C4613A]">
                              <span className="text-[9px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1.5" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                                {t("examples.pro.stylistNote") || "Stylist Note"}
                              </span>
                              <p className="text-[13px] sm:text-[14px] text-[#292524] leading-relaxed" style={{ fontFamily: displayFont, fontStyle: "italic" }}>
                                "{primaryVibe.avoid_note}"
                              </p>
                            </div>
                          )}

                          {/* Outfit items */}
                          <span className="text-[9px] uppercase tracking-[0.12em] text-[#8A7B6E] block mb-3" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                            {t("dashboard.outfitBreakdown")}
                          </span>
                          <div className="space-y-2">
                            {slot0Items.map((item, i) => {
                              const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                              return (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                  <div className="w-10 h-10 rounded-lg bg-[#EFE8DF] flex-shrink-0 flex items-center justify-center">
                                    <Icon name={iconName} size={16} className="text-[#57534e]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[13px] text-[#292524] leading-tight" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                                      <SizeChip size={item.size} />
                                    </div>
                                    {item.why && (
                                      <span className="text-[11px] text-[#8A7B6E] block mt-0.5 leading-snug" style={{ fontFamily: bodyFont }}>{item.why}</span>
                                    )}
                                  </div>
                                  <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.08em] text-[#8A7B6E] hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>
                                    {item.category}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Vibe tags */}
                          {primaryVibe?.vibe_tags && primaryVibe.vibe_tags.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                              <span className="text-[9px] uppercase tracking-[0.12em] text-[#8A7B6E] block mb-2" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                                {t("dashboard.mood")}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {primaryVibe.vibe_tags.slice(0, 5).map((tag) => (
                                  <span key={tag} className="px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slots 1-3 — locked, upgrade prompt */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                    <div className="w-full flex items-center justify-between p-4 sm:p-5">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8DDD4] flex-shrink-0 flex items-center justify-center text-[13px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {outfitSlots[i].day}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] sm:text-[18px] text-[#a8a29e] block leading-snug" style={{ fontFamily: displayFont }}>
                              {outfitSlots[i].activity}
                            </span>
                            <Icon name="lock" size={14} className="text-[#a8a29e]" />
                          </div>
                          <span className="text-[12px] text-[#c4b5a5]" style={{ fontFamily: bodyFont }}>
                            {t("upgrade.cta").replace("→", "").trim()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleUpgradeToPro}
                        className="flex-shrink-0 px-3 py-1.5 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/20 transition-colors cursor-pointer"
                        style={{ fontFamily: bodyFont, fontWeight: 600 }}
                      >
                        Pro
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-by-Day Itinerary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: displayFont }}>{t("dashboard.yourItinerary")}</h2>
              </div>
              <DayPlanStrip days={dayPlanData} activeDay={activeDay} onDaySelect={setActiveDay} />
              <div className="mt-4 bg-white rounded-xl border border-[#E8DDD4] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="event" size={18} className="text-[#C4613A]" />
                  <span className="text-[16px] text-[#292524]" style={{ fontFamily: displayFont }}>
                    {t("dashboard.day")} {activeDay}: {dayPlanData.find((d) => d.day === activeDay)?.activity}
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
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{s.label}</span>
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
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{s.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade CTA — matching ExampleProPage gradient style */}
            <div className="rounded-xl p-5 sm:p-6 text-white" style={{ background: "linear-gradient(135deg, #C4613A 0%, #a84d2e 100%)" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="auto_awesome" size={20} className="text-white" filled />
                </div>
                <div className="flex-1">
                  <h3 className="text-[19px] italic mb-2" style={{ fontFamily: displayFont }}>
                    {t("dashboard.upgradeProTitle")}
                  </h3>
                  <p className="text-[13px] text-white/80 mb-4 leading-relaxed" style={{ fontFamily: bodyFont }}>
                    {t("dashboard.upgradeProDescription")}
                  </p>
                  <button
                    onClick={handleUpgradeToPro}
                    className="h-10 px-6 bg-white text-[#C4613A] rounded-lg text-[12px] uppercase tracking-[0.08em] hover:bg-white/90 active:bg-white/80 transition-colors cursor-pointer"
                    style={{ fontFamily: bodyFont, fontWeight: 700 }}
                  >
                    {t("upgrade.cta")} &rarr;
                  </button>
                  <ul className="mt-4 space-y-1.5">
                    {[t("upgrade.feature1"), t("upgrade.feature2"), t("upgrade.feature3"), t("upgrade.feature4")].map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-[13px] text-white/80" style={{ fontFamily: bodyFont }}>
                        <Icon name="check_circle" size={14} className="text-white/70 flex-shrink-0" filled />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-white/60 mt-3" style={{ fontFamily: "var(--font-mono)" }}>
                    {t("examples.pro.freePreview") || "Free preview included"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pro Upsell Card & Timer banner */}
            <ProUpsellCard onUpgrade={handleUpgradeToPro} />
            <UpgradeBanner initialMinutes={14} initialSeconds={59} onUpgrade={handleUpgradeToPro} />
          </div>

          {/* Right sidebar — order: profile → packing list → weather → stats → upgrade CTA */}
          <aside className="lg:col-span-4 order-first lg:order-none">
            <div className="lg:sticky lg:top-[88px] space-y-5">

              {/* 1. Profile */}
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

              {/* 2. Packing List (sidebar, scrollable) */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[17px] text-[#292524]" style={{ fontFamily: displayFont }}>{t("dashboard.yourPackingList")}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {hasRealData ? t("dashboard.aiCurated") : t("dashboard.autoDerived")}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A7B6E] mb-3" style={{ fontFamily: bodyFont }}>
                  {displayItems.length} {t("dashboard.items")} · {t("dashboard.look")}
                </p>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {displayItems.map((item, i) => {
                    const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                        <div className="w-9 h-9 rounded-md bg-[#EFE8DF] flex-shrink-0 flex items-center justify-center">
                          <Icon name={iconName} size={15} className="text-[#57534e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[12px] text-[#292524] truncate" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                            <SizeChip size={sizeLabel} />
                          </div>
                          <span className="text-[10px] text-[#8A7B6E] truncate block capitalize" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Weather */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[17px] text-[#292524] mb-4" style={{ fontFamily: displayFont }}>{t("dashboard.weatherForecast")}</h3>
                {primaryWeather ? (
                  <div className="rounded-lg bg-[#FDF8F3] p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{cityName}</span>
                        <span className="text-[11px] text-[#8A7B6E] block" style={{ fontFamily: bodyFont }}>
                          {primaryCity?.fromDate || ""} – {primaryCity?.toDate || ""}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#57534e] text-right max-w-[100px] leading-tight" style={{ fontFamily: bodyFont }}>
                        {primaryWeather.climate_band}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
                      <span className="flex items-center gap-0.5 text-[#292524] font-semibold">
                        <Icon name="thermostat" size={13} className="text-[#C4613A]" />{Math.round(primaryWeather.temperature_day_avg)}°C
                      </span>
                      <span className="flex items-center gap-0.5 text-[#57534e]">
                        <Icon name="water_drop" size={13} />{Math.round(primaryWeather.precipitation_prob * 100)}%
                      </span>
                      <span className="flex items-center gap-0.5 text-[#57534e]">
                        <Icon name="air" size={13} />{primaryWeather.climate_band}
                      </span>
                    </div>
                    {/* Daily forecast strip */}
                    {dailyForecast && dailyForecast.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#EFE8DF]">
                        <span className="text-[9px] uppercase tracking-[0.1em] text-[#8A7B6E] block mb-2" style={{ fontFamily: "var(--font-mono)" }}>
                          {t("dashboard.dailyBreakdown")}
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {dailyForecast.slice(0, 7).map((df, idx) => (
                            <div key={idx} className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-white rounded-lg px-2 py-1.5 min-w-[40px]">
                              <span className="text-[9px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>{t("dashboard.day")} {idx + 1}</span>
                              <span className="text-[11px] text-[#292524] font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(df.temperature_max)}°</span>
                              <span className="text-[9px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(df.temperature_min)}°</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-[#FDF8F3] p-4 text-center">
                    <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>{t("dashboard.loadingEllipsis")}</span>
                  </div>
                )}
              </div>

              {/* 4. Style + Mood */}
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

              {/* 5. Capsule Stats */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[17px] text-[#292524] mb-3" style={{ fontFamily: displayFont }}>{t("dashboard.capsuleSummary")}</h3>
                <div className="space-y-2">
                  {[
                    { icon: "public", label: t("dashboard.cities"), value: "1" },
                    { icon: "style", label: t("dashboard.aiOutfits"), value: `1 ${t("dashboard.look")}` },
                    { icon: "checkroom", label: t("dashboard.packingItems"), value: `${displayItems.length} ${t("dashboard.pieces")}` },
                    { icon: "thermostat", label: t("dashboard.climate"), value: primaryWeather?.climate_band || t("dashboard.mild") },
                    { icon: "auto_awesome", label: t("dashboard.mood"), value: moodName },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon name={stat.icon} size={15} className="text-[#C4613A]" />
                        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{stat.label}</span>
                      </div>
                      <span className="text-[12px] text-[#292524] capitalize" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Upgrade CTA (sidebar) */}
              <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, #C4613A 0%, #a84d2e 100%)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="auto_awesome" size={16} className="text-white/70" filled />
                  <h3 className="text-[17px] text-white" style={{ fontFamily: displayFont }}>{t("upgrade.title")}</h3>
                </div>
                <p className="text-[12px] text-white/80 mb-4 leading-relaxed" style={{ fontFamily: bodyFont }}>
                  {t("upgrade.subtitle")}
                </p>
                <button
                  onClick={handleUpgradeToPro}
                  className="w-full h-10 bg-white text-[#C4613A] rounded-lg text-[12px] uppercase tracking-[0.08em] hover:bg-white/90 active:bg-white/80 transition-colors cursor-pointer"
                  style={{ fontFamily: bodyFont, fontWeight: 700 }}
                >
                  {t("upgrade.cta")} &rarr;
                </button>
                <p className="text-[10px] text-white/60 text-center mt-3" style={{ fontFamily: "var(--font-mono)" }}>
                  {t("examples.pro.freePreview") || "Free preview included"}
                </p>
              </div>
            </div>
          </aside>
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

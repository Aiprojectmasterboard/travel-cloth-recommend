// IMPORTANT: TDZ 방지 — const 파생 변수는 그것을 참조하는 모든 useEffect/useCallback 위에 선언해야 함.
// BUG-001 참고: https://github.com/Aiprojectmasterboard/travel-cloth-recommend/blob/main/CLAUDE.md
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  PlanBadge,
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
  type CityOutfitSet,
  type PackingItem,
} from "../services/outfitGenerator";
import { WORKER_URL, regenerateOutfit, type CapsuleItem, type DayPlan, type WeatherData, type DailyForecast, type VibeData, type ResultImage, type GridImage } from "../lib/api";
import { exportDashboardPdf, shareAsImage, downloadQuadrantImage } from "../services/exportDashboardPdf";
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

/* ─── City hero fallback images ─── */
const CITY_HEROES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1577056922428-a511301a562d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  rome: "https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  barcelona: "https://images.unsplash.com/photo-1633378532456-103a55a27261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  tokyo: "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  milan: "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  seoul: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
};

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

/**
 * Shows one quadrant of a 2x2 grid image using CSS object-position.
 * quadrant: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
 */
function GridQuadrant({
  imageUrl,
  quadrant,
  className,
  alt,
}: {
  imageUrl: string;
  quadrant: 0 | 1 | 2 | 3;
  className?: string;
  alt?: string;
}) {
  // Map quadrant to background-position for precise 50%/50% crop without distortion
  const positions: Record<number, string> = {
    0: "0% 0%",
    1: "100% 0%",
    2: "0% 100%",
    3: "100% 100%",
  };
  return (
    <div
      className={`overflow-hidden ${className ?? ""}`}
      role="img"
      aria-label={alt ?? `Outfit ${quadrant + 1}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "200% 200%",
        backgroundPosition: positions[quadrant],
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function ProDashboard() {
  const navigate = useNavigate();
  const [activeCity, setActiveCity] = useState(0);
  const [regenUsed, setRegenUsed] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const { isLoggedIn, setShowSignupPrompt, purchasedPlan } = useAuth();
  const { data: onboarding } = useOnboarding();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const { t, lang } = useLang();
  const [pdfExporting, setPdfExporting] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!purchasedPlan) navigate("/preview", { replace: true });
  }, [purchasedPlan, navigate]);

  // ─── AI Pipeline Trigger state (declared BEFORE useEffects that reference it — TDZ prevention) ───
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const pipelineTriggered = useRef(false);

  // State for regenerated images (regenerate replaces a single city grid image)
  const [aiImages, setAiImages] = useState<Map<string, string>>(new Map());
  interface AiItem { name: string; category: string; desc: string; essential: boolean; }
  const [aiOutfitItems] = useState<Record<string, AiItem[]>>({});

  // Load result only if already completed (page refresh case) — pipeline trigger handles initial load
  useEffect(() => {
    if (tripId && !result && !tripLoading && genStatus === "idle") loadResult(tripId);
  }, [tripId, result, tripLoading, genStatus, loadResult]);

  // ─── IMPORTANT: Declare apiResultImages BEFORE any useEffect that references it (TDZ prevention).
  const apiResultImages: ResultImage[] = result?.images || [];
  const apiGridImages: GridImage[] = result?.grid_images || [];
  const hasApiImages = apiResultImages.length > 0 || apiGridImages.length > 0;

  // Re-poll for images if pipeline done but images not yet in result
  useEffect(() => {
    if (!tripId || !result || hasApiImages || tripLoading || genStatus === "generating") return;
    const timer = setTimeout(() => loadResult(tripId), 10000);
    return () => clearTimeout(timer);
  }, [tripId, result, hasApiImages, tripLoading, genStatus, loadResult]);

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowSignupPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, setShowSignupPrompt]);

  useEffect(() => {
    if (hasApiImages) {
      setGenStatus("done");
      return;
    }
    if (pipelineTriggered.current || !tripId) return;
    pipelineTriggered.current = true;

    let cancelled = false;
    async function triggerPipeline() {
      try {
        setGenStatus("generating");
        console.log("[ProDashboard] Triggering server pipeline for trip", tripId);

        // Pipeline takes 60-90s — use a 3-minute timeout to keep the connection alive
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180_000);

        const res = await fetch(`${WORKER_URL}/api/trigger-pipeline/${tripId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (cancelled) return;

        const data = await res.json() as { ok: boolean; already_completed?: boolean; error?: string };

        if (!res.ok) {
          console.error("[ProDashboard] Pipeline failed:", data.error);
          setGenStatus("error");
          return;
        }

        // Pipeline completed — small delay to let DB writes commit, then reload
        console.log("[ProDashboard] Pipeline completed, reloading result...");
        if (!cancelled) {
          await new Promise((r) => setTimeout(r, 2000)); // wait for DB writes to commit
          await loadResult(tripId);
          setGenStatus("done");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ProDashboard] Pipeline trigger error:", err);
          setGenStatus("error");
        }
      }
    }
    triggerPipeline();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiImages, tripId]);

  // ─── Data sources ───
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiDailyPlan: DayPlan[] = result?.capsule?.daily_plan || [];
  const hasRealData = apiCapsuleItems.length > 0;

  // Use onboarding data first; fall back to API result profile (survives page refresh)
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

  const cities = useMemo(() => {
    if (result?.cities?.length) {
      return result.cities.map((c) => ({
        city: c.name, country: c.country,
        fromDate: onboarding.cities.find((oc) => oc.city === c.name)?.fromDate || "2026-03-15",
        toDate: onboarding.cities.find((oc) => oc.city === c.name)?.toDate || "2026-03-21",
      }));
    }
    if (onboarding.cities.length > 0) {
      return onboarding.cities.map((c) => ({ city: c.city, country: c.country, fromDate: c.fromDate || "2026-03-15", toDate: c.toDate || "2026-03-21" }));
    }
    return [{ city: "Paris", country: "France", fromDate: "2026-03-15", toDate: "2026-03-21" }];
  }, [result, onboarding.cities]);

  // IMPORTANT: teaserUrl must be declared BEFORE citySets useMemo (TDZ prevention)
  const teaserUrl = result?.teaser_url || preview?.teaser_url || "";

  const dateLocale = lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : lang === "zh" ? "zh-CN" : lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US";

  const citySets = useMemo<(CityOutfitSet & { dailyForecast: DailyForecast[] })[]>(() => {
    return cities.slice(0, 5).map((c, ci) => {
      const key = c.city.toLowerCase();
      const outfits = generateCityOutfits(profile, c, 4);
      const vibeData = apiVibes[ci] || apiVibes[0];
      const weatherInfo = apiWeather.find((w) => w.city?.toLowerCase() === key) || apiWeather[ci] || apiWeather[0];
      return {
        city: c.city,
        country: c.country,
        dates: `${new Date(c.fromDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })} \u2013 ${new Date(c.toDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`,
        heroImg: CITY_HEROES[key] || (teaserUrl ? teaserUrl : CITY_HEROES.paris),
        weather: {
          temp: weatherInfo ? Math.round(weatherInfo.temperature_day_avg) : 15,
          rain: weatherInfo ? Math.round(weatherInfo.precipitation_prob * 100) : 20,
          wind: 12,
          condition: weatherInfo?.climate_band || "mild",
        },
        dailyForecast: weatherInfo?.daily_forecast || [],
        outfits,
        colorPalette: vibeData?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"],
        activities: vibeData?.vibe_tags || ["City Walk", "Cultural Visit", "Dining"],
      };
    });
  }, [cities, profile, apiVibes, apiWeather, teaserUrl, dateLocale]);

  const allOutfits = useMemo(() => citySets.flatMap((cs) => cs.outfits), [citySets]);
  const packing: PackingItem[] = useMemo(() => derivePacking(allOutfits), [allOutfits]);
  const bodyFitLabel = allOutfits[0]?.bodyFitLabel || "";
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

  // ─── Regenerate handler — AFTER citySets declaration (TDZ prevention) ───
  const handleRegenerate = useCallback(async () => {
    const activeSet = citySets[activeCity] || citySets[0];
    if (regenUsed || regenLoading || !activeSet) return;
    setRegenLoading(true);
    setRegenError(null);
    try {
      const res = await regenerateOutfit(tripId || "", activeSet.city);
      if (res.ok && res.image_url) {
        setAiImages((prev) => {
          const next = new Map(prev);
          next.set(`${res.city}::grid`, res.image_url);
          return next;
        });
        setRegenUsed(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("regen_limit")) {
        setRegenUsed(true);
      }
      setRegenError(msg.includes("regen_limit") ? t("dashboard.regenLimitReached") : msg.includes("no_order") ? t("dashboard.regenNoOrder") : t("dashboard.regenFailed"));
      setTimeout(() => setRegenError(null), 5000);
    } finally {
      setRegenLoading(false);
    }
  }, [regenUsed, regenLoading, tripId, citySets, activeCity, t]);

  const handleExportPdf = useCallback(async () => {
    if (!mainRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      const citySlug = cities?.[0]?.city?.toLowerCase().replace(/\s+/g, "-") || "trip";
      await exportDashboardPdf(mainRef.current, `travel-capsule-pro-${citySlug}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting, cities]);

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

  // AI packing list
  const aiPackingList = useMemo<Array<{ name: string; category: string; desc: string; essential: boolean; cities: string[] }>>(() => {
    if (hasRealData) {
      return apiCapsuleItems.map((item) => ({
        name: item.name,
        category: item.category,
        desc: item.why,
        essential: item.versatility_score > 3,
        cities: cities.map((c) => c.city),
      }));
    }
    if (Object.keys(aiOutfitItems).length === 0) return [];
    const map = new Map<string, { name: string; category: string; desc: string; essential: boolean; cities: string[] }>();
    for (const [key, items] of Object.entries(aiOutfitItems)) {
      const city = key.split("::")[0] ?? "";
      for (const item of items) {
        const k = item.name.toLowerCase().replace(/\s+/g, "-");
        const existing = map.get(k);
        if (existing) {
          if (!existing.cities.includes(city)) existing.cities.push(city);
          if (item.essential) existing.essential = true;
        } else {
          map.set(k, { ...item, cities: [city] });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.essential !== b.essential) return a.essential ? -1 : 1;
      return b.cities.length - a.cities.length;
    });
  }, [hasRealData, apiCapsuleItems, aiOutfitItems, cities]);

  const currentSet = citySets[activeCity] || citySets[0];
  if (!currentSet) return null;

  /**
   * Get the 2x2 grid image URL for a city.
   * Priority: API grid_images → API result_images (type=grid) → AI generated → city hero fallback
   */
  const getGridImageUrl = (cityName: string): string | null => {
    // 1. Webhook pipeline grid images
    const gridImg = apiGridImages.find((g) => g.city.toLowerCase() === cityName.toLowerCase());
    if (gridImg) return gridImg.image_url;
    // 2. Legacy: result images with type=grid (if backend sends that format)
    const legacyGrid = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && (img as ResultImage & { type?: string }).type === "grid"
    );
    if (legacyGrid) return legacyGrid.url;
    // 3. Client-side AI generated grid image
    const aiGrid = aiImages.get(`${cityName}::grid`);
    if (aiGrid) return aiGrid;
    // 4. No grid image available yet
    return null;
  };

  /**
   * Get individual outfit image (index 0-3) for a city.
   * Used when no grid image is available (fallback path).
   * Priority: API result images → AI generated map → mock outfit image
   */
  const getSingleOutfitImage = (cityName: string, idx: number, fallback: string): string => {
    const apiImg = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && img.index === idx
        && (img as ResultImage & { type?: string }).type !== "grid"
    );
    if (apiImg) return apiImg.url;
    const aiKey = `${cityName}::outfit-${idx + 1}`;
    const aiUrl = aiImages.get(aiKey);
    if (aiUrl) return aiUrl;
    return fallback;
  };

  // quadrant index cycles every 4 days: day 5 → quadrant 0, day 6 → quadrant 1, etc.
  const dayToQuadrant = (dayIndex: number): 0 | 1 | 2 | 3 => (dayIndex % 4) as 0 | 1 | 2 | 3;

  // Get daily plans for the active city
  const activeCityDays: DayPlan[] = hasRealData
    ? apiDailyPlan.filter((d) => d.city?.toLowerCase() === currentSet.city.toLowerCase())
    : [];

  // Resolve outfit items for a given day plan entry (case-insensitive)
  const resolveOutfitItems = (dayPlan: DayPlan | undefined): CapsuleItem[] => {
    if (!dayPlan) return [];
    return dayPlan.outfit
      .map((name) => apiCapsuleItems.find((c) => c.name.toLowerCase() === name.toLowerCase()))
      .filter((c): c is CapsuleItem => !!c);
  };

  const gridImageUrl = getGridImageUrl(currentSet.city);
  const isGeneratingImages = genStatus === "generating";
  const imagesReady = genStatus === "done" || hasApiImages;

  // ─── Expanded accordion state for outfit cards ───
  const [expandedOutfit, setExpandedOutfit] = useState(0);

  // Reset expanded outfit when city tab changes
  useEffect(() => {
    setExpandedOutfit(0);
  }, [activeCity]);

  // Shimmer keyframe for skeleton animation
  const shimmerStyle = `@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`;

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <style>{shimmerStyle}</style>
      <SEO title="Your Travel Capsule — Pro" description="Your premium AI-generated travel outfits with full gallery and capsule wardrobe." noindex={true} />
      <SignupPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block"><PlanBadge label={t("upgrade.proPlan")} className="bg-[#C4613A]/10 text-[#C4613A]" /></span>
            <button
              onClick={handleShareAsImage}
              disabled={sharing}
              className="no-print h-[44px] px-3 sm:px-4 border border-[#E8DDD4] bg-white text-[#57534e] rounded-full text-[11px] uppercase tracking-[0.08em] hover:border-[#C4613A]/30 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
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
              className="no-print h-[44px] px-2 sm:px-4 border border-[#C4613A]/30 bg-[#C4613A]/5 text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/15 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              {pdfExporting ? <span className="w-4 h-4 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="download" size={14} className="text-[#C4613A]" />}
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
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {t("dashboard.multiCityStyleGuide")}
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: "var(--font-body)" }}>
          {t("dashboard.capsuleSubtitle").replace("{n}", String(cities.length))}
        </p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 90} bodyFitLabel={bodyFitLabel} />
          {isGeneratingImages && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <span className="w-2 h-2 rounded-full bg-[#C4613A] animate-ping" /> {t("dashboard.generatingOutfits")}
            </span>
          )}
          {imagesReady && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <Icon name="check_circle" size={14} className="text-green-600" /> {t("dashboard.aiImagesReady").replace("{n}", String(apiGridImages.length || apiResultImages.length || aiImages.size))}
            </span>
          )}
          {genStatus === "error" && !hasApiImages && (
            <div className="w-full mt-2 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Icon name="error" size={18} className="text-red-500 flex-shrink-0" />
              <span className="text-[13px] text-red-700 flex-1" style={{ fontFamily: "var(--font-body)" }}>
                {t("dashboard.generationError")}
              </span>
              <button
                onClick={() => { pipelineTriggered.current = false; setGenStatus("idle"); }}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[11px] uppercase tracking-[0.08em] hover:bg-red-200 transition-colors cursor-pointer flex-shrink-0"
                style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
              >
                {t("dashboard.retry")}
              </button>
            </div>
          )}
        </div>

        {/* City tabs */}
        <div className="mt-5 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            {citySets.map((cs, i) => (
              <button
                key={cs.city}
                onClick={() => setActiveCity(i)}
                className={`px-4 py-2 rounded-full text-[12px] uppercase tracking-[0.08em] transition-colors cursor-pointer border whitespace-nowrap ${activeCity === i ? "bg-[#C4613A] text-white border-[#C4613A]" : "bg-white text-[#57534e] border-[#E8DDD4] hover:border-[#C4613A]/40"}`}
                style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
              >
                {cs.city} · {cs.dates}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-4 sm:px-6 pt-8 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left — main content */}
          <div className="lg:col-span-8 space-y-10">

            {/* ─── 2×2 Outfit Image Grid Hero ─── */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1A1410]">
              {isGeneratingImages && !hasApiImages ? (
                /* Generating state: polished shimmer skeleton 2x2 */
                <div className="relative">
                  <div className="grid grid-cols-2 gap-[2px]">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="relative bg-gradient-to-br from-[#EFE8DF] to-[#F5EFE6] flex flex-col items-center justify-center gap-3 overflow-hidden"
                        style={{ aspectRatio: "3/4" }}
                      >
                        {/* Shimmer sweep overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                            animation: "shimmer 1.8s ease-in-out infinite",
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <span
                            className="w-10 h-10 border-[2.5px] border-[#C4613A]/15 border-t-[#C4613A] rounded-full animate-spin"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                          <span
                            className="text-[9px] text-[#a8a29e] uppercase tracking-[0.12em]"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {t("dashboard.day")} {i + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Center info overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 text-center shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="auto_awesome" size={16} className="text-[#C4613A]" filled />
                        <p className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                          {t("dashboard.generatingOutfits")}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#a8a29e]" style={{ fontFamily: "var(--font-mono)" }}>
                        {t("dashboard.generatingTime")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : gridImageUrl ? (
                /* API grid image: show full 1:1 image split into 4 quadrants */
                <>
                  <div className="grid grid-cols-2 gap-[2px]">
                    {[0, 1, 2, 3].map((q) => (
                      <div key={q} className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                        <GridQuadrant
                          imageUrl={gridImageUrl}
                          quadrant={q as 0 | 1 | 2 | 3}
                          className="w-full h-full hover:scale-105 transition-transform duration-500"
                          alt={`${currentSet.city} Day ${q + 1} outfit`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="text-white/55 text-[8px] sm:text-[9px] uppercase tracking-[0.14em] block" style={{ fontFamily: "var(--font-mono)" }}>{t("dashboard.day")} {q + 1}</span>
                          {(hasRealData ? activeCityDays[q] : currentSet.outfits[q]) && (
                            <span className="text-white text-[12px] sm:text-[14px] leading-tight block" style={{ fontFamily: "var(--font-display)" }}>
                              {hasRealData
                                ? activeCityDays[q]?.note?.split(" ").slice(0, 3).join(" ") || currentSet.outfits[q]?.subtitle
                                : currentSet.outfits[q]?.subtitle}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => downloadQuadrantImage(gridImageUrl, q as 0 | 1 | 2 | 3, `capsule-${currentSet.city.toLowerCase()}-day${q + 1}.jpg`)}
                          className="no-print absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                          title={t("dashboard.downloadImage")}
                        >
                          <Icon name="download" size={13} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                      <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("dashboard.aiGenerated")}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                      {currentSet.city}, {currentSet.country}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-[#C4613A]/90 text-white text-[10px]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                      {currentSet.dates} · {currentSet.outfits.length} {t("dashboard.looks")}
                    </span>
                  </div>
                </>
              ) : (
                /* Primary display: 2×2 individual outfit images (API or mock fallback) */
                <>
                  <div className="grid grid-cols-2 gap-[2px]">
                    {currentSet.outfits.slice(0, 4).map((outfit, i) => {
                      const imgSrc = getSingleOutfitImage(currentSet.city, i, outfit.image);
                      const isApiImage = !!apiResultImages.find(
                        (img) => img.city.toLowerCase() === currentSet.city.toLowerCase() && img.index === i
                          && (img as ResultImage & { type?: string }).type !== "grid"
                      ) || !!aiImages.get(`${currentSet.city}::outfit-${i + 1}`);
                      const dayLabel = hasRealData
                        ? (activeCityDays[i]?.note?.split(" ").slice(0, 3).join(" ") || outfit.subtitle)
                        : outfit.subtitle;
                      return (
                        <div key={outfit.id} className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                          <ImageWithFallback
                            src={imgSrc}
                            alt={outfit.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <span className="text-white/55 text-[8px] sm:text-[9px] uppercase tracking-[0.14em] block" style={{ fontFamily: "var(--font-mono)" }}>
                              {t("dashboard.day")} {outfit.day}
                            </span>
                            <span className="text-white text-[12px] sm:text-[15px] leading-tight block" style={{ fontFamily: "var(--font-display)" }}>
                              {dayLabel}
                            </span>
                          </div>
                          {/* Per-image download button — only for real (API/AI) images */}
                          {isApiImage && (
                            <button
                              onClick={() => downloadImage(imgSrc, `capsule-${currentSet.city.toLowerCase()}-day${i + 1}.jpg`)}
                              className="no-print absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                              title={t("dashboard.downloadImage")}
                            >
                              <Icon name="download" size={13} className="text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    {hasApiImages && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                        <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("dashboard.aiGenerated")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                      {currentSet.city}, {currentSet.country}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1 rounded-full bg-[#C4613A]/90 text-white text-[10px]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                      {currentSet.dates} · {currentSet.outfits.length} {t("dashboard.looks")}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ─── Outfit Accordion Cards ─── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[22px] sm:text-[26px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  {currentSet.city} {t("examples.pro.outfitsLabel")}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>
                    {currentSet.outfits.length} {t("dashboard.looks")}
                  </span>
                  {!regenUsed && (
                    <button
                      onClick={handleRegenerate}
                      disabled={regenLoading}
                      className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full border border-[#C4613A]/30 text-[#C4613A] text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/5 transition-colors cursor-pointer disabled:opacity-50"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                      aria-label={t("dashboard.regenerate")}
                    >
                      {regenLoading ? <span className="w-4 h-4 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="refresh" size={16} />}
                      <span className="hidden sm:inline">{regenLoading ? t("dashboard.generating") : `${t("dashboard.regenerate")} (1 ${t("dashboard.left")})`}</span>
                    </button>
                  )}
                </div>
              </div>
              {regenError && (
                <p className="mb-3 text-[12px] text-red-500" style={{ fontFamily: "var(--font-body)" }}>{regenError}</p>
              )}

              <div className="space-y-4">
                {(hasRealData ? activeCityDays : currentSet.outfits.slice(0, 4).map((o, _i) => ({
                  day: o.day,
                  city: currentSet.city,
                  outfit: o.items.map((it) => it.name),
                  note: o.note || "",
                }))).map((dayPlan, dayIdx) => {
                  const quadrant = dayToQuadrant(dayIdx);
                  const outfitItems = hasRealData ? resolveOutfitItems(dayPlan as DayPlan) : [];
                  const mockOutfit = currentSet.outfits[dayIdx];
                  const isExpanded = expandedOutfit === dayIdx;

                  // Image to show in the accordion detail view
                  const detailImgSrc = gridImageUrl
                    ? null // will use GridQuadrant
                    : getSingleOutfitImage(currentSet.city, dayIdx, mockOutfit?.image || currentSet.heroImg);

                  return (
                    <div
                      key={dayPlan.day}
                      className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden transition-shadow"
                      style={{ boxShadow: isExpanded ? "0 4px 24px rgba(196,97,58,.10)" : "0 2px 12px rgba(0,0,0,.04)" }}
                    >
                      {/* Accordion header */}
                      <button
                        onClick={() => setExpandedOutfit(isExpanded ? -1 : dayIdx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[#FDF8F3]/60 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 text-left">
                          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C4613A]/10 flex-shrink-0 flex items-center justify-center text-[13px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                            {dayPlan.day}
                          </span>
                          <div>
                            <span className="text-[16px] sm:text-[18px] text-[#292524] block leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                              {hasRealData
                                ? dayPlan.note?.split(" ").slice(0, 5).join(" ") || `${t("dashboard.day")} ${dayPlan.day} ${t("dashboard.outfit")}`
                                : mockOutfit?.title || `${t("dashboard.day")} ${dayPlan.day}`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-body)" }}>
                                {hasRealData ? currentSet.outfits[dayIdx]?.subtitle || currentSet.activities[dayIdx % currentSet.activities.length] || "" : mockOutfit?.subtitle || ""}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                {hasRealData ? 95 : mockOutfit?.aiConfidence || 92}{t("examples.pro.match")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Icon name={isExpanded ? "expand_less" : "expand_more"} size={22} className="text-[#8A7B6E] flex-shrink-0 ml-2" />
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-6 border-t border-[#EFE8DF]">
                          <div className="mt-5 grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-5 sm:gap-6">
                            {/* Outfit image (left) */}
                            <div className="relative rounded-xl overflow-hidden self-start" style={{ aspectRatio: "3/4" }}>
                              {gridImageUrl ? (
                                <GridQuadrant
                                  imageUrl={gridImageUrl}
                                  quadrant={quadrant}
                                  className="w-full h-full"
                                  alt={`Day ${dayPlan.day} outfit`}
                                />
                              ) : (
                                <ImageWithFallback
                                  src={detailImgSrc || currentSet.heroImg}
                                  alt={hasRealData ? `${t("dashboard.day")} ${dayPlan.day}` : mockOutfit?.title || `Day ${dayPlan.day}`}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                              <div className="absolute top-3 left-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                                  <Icon name="auto_awesome" size={9} className="text-white" filled /> AI
                                </span>
                              </div>
                              <div className="absolute bottom-3 left-3">
                                <div className="flex gap-1.5">
                                  {currentSet.colorPalette.map((color) => (
                                    <div key={color} className="w-5 h-5 rounded-full border-2 border-white/60" style={{ backgroundColor: color }} />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Right: stylist note + breakdown + activities */}
                            <div className="min-w-0">
                              {/* Stylist note */}
                              {(hasRealData ? dayPlan.note : mockOutfit?.note) && (
                                <div className="bg-[#FDF8F3] rounded-xl p-4 mb-4 border-l-[3px] border-[#C4613A]">
                                  <span className="text-[9px] uppercase tracking-[0.12em] text-[#C4613A] block mb-1.5" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                                    {t("examples.pro.stylistNote")}
                                  </span>
                                  <p className="text-[13px] sm:text-[14px] text-[#292524] leading-relaxed" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                                    "{hasRealData ? dayPlan.note : mockOutfit?.note}"
                                  </p>
                                </div>
                              )}

                              {/* Outfit breakdown */}
                              <span className="text-[9px] uppercase tracking-[0.12em] text-[#8A7B6E] block mb-3" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                                {t("examples.pro.outfitBreakdown")}
                              </span>
                              <div className="space-y-2">
                                {hasRealData ? (
                                  outfitItems.length > 0 ? outfitItems.map((item, ii) => {
                                    const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                                    return (
                                      <div key={ii} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                        <div className="w-11 h-11 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                                          <Icon name={iconName} size={18} className="text-[#57534e]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] text-[#292524] leading-tight" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                                            <SizeChip size={sizeLabel} />
                                          </div>
                                          {item.why && <span className="text-[11px] text-[#8A7B6E] block mt-0.5 leading-snug" style={{ fontFamily: "var(--font-body)" }}>{item.why}</span>}
                                        </div>
                                        <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.08em] text-[#8A7B6E] hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                                      </div>
                                    );
                                  }) : (
                                    <p className="text-[13px] text-[#a8a29e] py-2" style={{ fontFamily: "var(--font-body)" }}>
                                      {t("dashboard.outfitDetailsLoading")}
                                    </p>
                                  )
                                ) : (
                                  mockOutfit?.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                      <ImageWithFallback src={item.img} alt={item.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-[13px] text-[#292524] leading-tight" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                                          <SizeChip size={item.recommendedSize} />
                                        </div>
                                        <span className="text-[11px] text-[#8A7B6E] block mt-0.5 leading-snug" style={{ fontFamily: "var(--font-body)" }}>{item.desc}</span>
                                      </div>
                                      <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.08em] text-[#8A7B6E] hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Activities */}
                              <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                                <span className="text-[9px] uppercase tracking-[0.12em] text-[#8A7B6E] block mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                                  {t("examples.pro.activities")}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {currentSet.activities.map((a) => (
                                    <span key={a} className="px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{a}</span>
                                  ))}
                                </div>
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
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4 order-first lg:order-none">
            <div className="lg:sticky lg:top-[120px] space-y-5">

              {/* Profile card */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {onboarding.faceUrl ? (
                      <ImageWithFallback src={onboarding.faceUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="person" size={22} className="text-[#C4613A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.yourProfile")}</span>
                    <span className="text-[11px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>
                      {profile.gender ? `${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} · ` : ""}{profile.silhouette ? `${t(`onboarding2.silhouette${profile.silhouette.charAt(0).toUpperCase() + profile.silhouette.slice(1)}`)}` : ""}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    { label: t("dashboard.silhouette"), value: profile.silhouette ? t(`onboarding2.silhouette${profile.silhouette.charAt(0).toUpperCase() + profile.silhouette.slice(1)}`) : "—" },
                    { label: t("examples.pro.profileSize"), value: sizeLabel },
                    { label: t("examples.pro.profileAesthetic"), value: profile.aesthetics?.[0] || "Classic" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#FDF8F3] rounded-lg p-2.5">
                      <span className="text-[10px] text-[#8A7B6E] block" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
                      <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
                {profile.aesthetics && profile.aesthetics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.aesthetics.slice(0, 3).map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-[#C4613A]/8 border border-[#C4613A]/20 text-[10px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-City Packing */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[17px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.multiCityPacking")}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.1em] ${hasRealData ? "bg-[#C4613A]/10 text-[#C4613A]" : "bg-[#EFE8DF] text-[#57534e]"}`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {hasRealData ? t("dashboard.aiCurated") : t("dashboard.autoDerived")}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A7B6E] mb-3" style={{ fontFamily: "var(--font-body)" }}>
                  {(aiPackingList.length || packing.length)} {t("examples.pro.uniqueItems")} · {citySets.length * 4} {t("dashboard.looks")}
                </p>
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {(aiPackingList.length > 0 ? aiPackingList : packing).slice(0, 18).map((item, i) => {
                    const isAi = aiPackingList.length > 0;
                    const CAT_ICN: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", accessory: "watch" };
                    if (isAi) {
                      const ai = item as typeof aiPackingList[number];
                      return (
                        <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${ai.essential ? "bg-[#C4613A]/10" : "bg-[#EFE8DF]"}`}>
                            <Icon name={CAT_ICN[ai.category] ?? "checkroom"} size={16} className={ai.essential ? "text-[#C4613A]" : "text-[#57534e]"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[12px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{ai.name}</span>
                            </div>
                            <span className="text-[10px] text-[#8A7B6E] truncate block" style={{ fontFamily: "var(--font-mono)" }}>
                              ×{ai.cities.length} {ai.cities.length > 1 ? t("dashboard.looks") : t("dashboard.looks")} · {ai.cities.length > 1 ? t("dashboard.nCities").replace("{n}", String(ai.cities.length)) : ai.cities[0]}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    const mock = item as PackingItem;
                    return (
                      <div key={mock.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                        <ImageWithFallback src={mock.img} alt={mock.name} className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[12px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{mock.name}</span>
                            <SizeChip size={sizeLabel} />
                          </div>
                          <span className="text-[10px] text-[#8A7B6E] truncate block" style={{ fontFamily: "var(--font-mono)" }}>
                            ×{mock.usageCount} {mock.usageCount > 1 ? t("dashboard.looks") : t("dashboard.looks")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weather per city */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[17px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.weatherForecast")}</h3>
                <div className="space-y-3">
                  {citySets.map((cs) => (
                    <div key={cs.city} className="rounded-lg bg-[#FDF8F3] p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{cs.city}</span>
                          <span className="text-[11px] text-[#8A7B6E] block" style={{ fontFamily: "var(--font-body)" }}>{cs.dates}</span>
                        </div>
                        <span className="text-[11px] text-[#57534e] text-right max-w-[100px] leading-tight" style={{ fontFamily: "var(--font-body)" }}>{cs.weather.condition}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
                        <span className="flex items-center gap-0.5 text-[#292524] font-semibold"><Icon name="thermostat" size={13} className="text-[#C4613A]" />{cs.weather.temp}°C</span>
                        <span className="flex items-center gap-0.5 text-[#57534e]"><Icon name="water_drop" size={13} />{cs.weather.rain}%</span>
                        <span className="flex items-center gap-0.5 text-[#57534e]"><Icon name="air" size={13} />{cs.weather.wind}km/h</span>
                      </div>
                      {/* Daily forecast breakdown */}
                      {cs.dailyForecast.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] uppercase tracking-[0.1em] text-[#C4613A] block mb-1" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{t("dashboard.dailyBreakdown")}</span>
                          {cs.dailyForecast.map((df) => {
                            const d = new Date(df.date + "T00:00:00");
                            d.setFullYear(d.getFullYear() + 1);
                            const dayLabel = d.toLocaleDateString(dateLocale, { month: "short", day: "numeric", weekday: "short" });
                            return (
                              <div key={df.date} className="flex items-center justify-between text-[11px] py-1 border-b border-[#EFE8DF]/50 last:border-0" style={{ fontFamily: "var(--font-mono)" }}>
                                <span className="text-[#57534e] min-w-[80px]">{dayLabel}</span>
                                <span className="flex items-center gap-1 text-[#292524]">
                                  <Icon name="thermostat" size={12} className="text-[#C4613A]" />
                                  {Math.round(df.temperature_max)}° / {Math.round(df.temperature_min)}°
                                </span>
                                <span className="flex items-center gap-1 text-[#57534e]">
                                  <Icon name="water_drop" size={12} />
                                  {df.precipitation_mm > 0 ? `${df.precipitation_mm.toFixed(1)}mm` : "0mm"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[17px] text-[#292524] mb-3" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.capsuleStats")}</h3>
                <div className="space-y-2">
                  {[
                    { icon: "public", label: t("dashboard.cities"), value: `${citySets.length}` },
                    { icon: "style", label: t("examples.pro.statOutfits"), value: `${citySets.length * 4} ${t("dashboard.looks")}` },
                    { icon: "checkroom", label: t("dashboard.packingItems"), value: `${aiPackingList.length || packing.length} ${t("examples.pro.pieces")}` },
                    { icon: "hd", label: t("examples.pro.statQuality"), value: t("examples.pro.statQualityVal") },
                    { icon: "refresh", label: t("dashboard.regenerations"), value: regenUsed ? `0 ${t("dashboard.left")}` : `1 ${t("dashboard.left")}` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon name={stat.icon} size={15} className="text-[#C4613A]" />
                        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{stat.label}</span>
                      </div>
                      <span className="text-[12px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA gradient box */}
              <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, #C4613A 0%, #a84d2e 100%)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="auto_awesome" size={16} className="text-white/70" filled />
                  <h3 className="text-[17px] text-white" style={{ fontFamily: "var(--font-display)" }}>{t("examples.pro.ctaTitle")}</h3>
                </div>
                <p className="text-[12px] text-white/80 mb-4 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  {t("examples.pro.ctaBody")}
                </p>
                <SocialShareButton shareUrl={tripId ? `https://travelscapsule.com/share/${tripId}?utm_source=share&utm_medium=social&utm_campaign=capsule` : undefined} shareTitle={t("dashboard.multiCityStyleGuide")} />
                <p className="text-[10px] text-white/60 text-center mt-3" style={{ fontFamily: "var(--font-mono)" }}>
                  {t("examples.pro.freePreview")}
                </p>
              </div>

            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

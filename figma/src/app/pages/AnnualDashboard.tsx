// IMPORTANT: TDZ 방지 — const 파생 변수는 그것을 참조하는 모든 useEffect/useCallback 위에 선언해야 함.
// BUG-001 참고: https://github.com/Aiprojectmasterboard/travel-cloth-recommend/blob/main/CLAUDE.md
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  AnnualBadge,
  TagChip,
  WeatherWidget,
  TripUsageBar,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useOnboarding } from "../context/OnboardingContext";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import { useLang } from "../context/LanguageContext";
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type PackingItem,
} from "../services/outfitGenerator";
import {
  WORKER_URL,
  regenerateOutfit,
  type CapsuleItem,
  type DayPlan,
  type WeatherData,
  type VibeData,
  type ResultImage,
  type GridImage,
} from "../lib/api";
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

/* ─── Static fallback images ─── */
const IMG = {
  tokyoMap: "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  milan: "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  seoul: "https://images.unsplash.com/photo-1670735411734-c9725326de3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  tuscany: "https://images.unsplash.com/photo-1655925244593-b648805087d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
};

const PAST_TRIPS = [
  { name: "Milan Fashion Week", date: "Sep 2025", mood: "Avant-Garde", img: IMG.milan, items: 14, outfits: 8, rating: 4.9 },
  { name: "Seoul Exploration", date: "Jul 2025", mood: "Urban Minimal", img: IMG.seoul, items: 10, outfits: 6, rating: 4.7 },
  { name: "Tuscany Rest", date: "May 2025", mood: "Rustic Elegance", img: IMG.tuscany, items: 8, outfits: 5, rating: 4.8 },
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

/* ─── DonutChart ─── */
function DonutChart({ percent, size = 100, stroke = 10 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFE8DF" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C4613A" strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#292524" fontSize={20} fontFamily="var(--font-display)" fontWeight={700}>{percent}%</text>
    </svg>
  );
}

/* ─── BarStat ─── */
function BarStat({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{label}</span>
        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{percent}%</span>
      </div>
      <div className="w-full h-[5px] bg-[#EFE8DF] rounded-full overflow-hidden">
        <div className="h-full bg-[#C4613A] rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

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

export function AnnualDashboard() {
  const navigate = useNavigate();
  const { data: onboarding } = useOnboarding();
  const { t, lang, displayFont, bodyFont } = useLang();
  const dateLocale = lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : lang === "zh" ? "zh-CN" : lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US";
  const { purchasedPlan } = useAuth();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const [pdfExporting, setPdfExporting] = useState(false);
  const [regenUsed, setRegenUsed] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [sharing, setSharing] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Derive city names early — needed by handleRegenerate deps (avoid TDZ)
  const primaryCity = onboarding.cities[0];
  const cityName = result?.cities?.[0]?.name || primaryCity?.city || "Tokyo";
  const countryName = result?.cities?.[0]?.country || primaryCity?.country || "Japan";

  // All city names for route display
  const allCityNames = result?.cities?.map((c) => c.name) || onboarding.cities.map((c) => c.city) || [cityName];

  const handleExportPdf = useCallback(async () => {
    if (!mainRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      await exportDashboardPdf(mainRef.current, `travel-capsule-annual-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting]);

  const handleShareAsImage = useCallback(async () => {
    if (!mainRef.current || sharing) return;
    setSharing(true);
    try {
      await shareAsImage(mainRef.current, t("dashboard.multiCityStyleGuide"));
    } finally {
      setSharing(false);
    }
  }, [sharing, t]);

  const handleRegenerate = useCallback(async () => {
    if (regenUsed || regenLoading) return;
    setRegenLoading(true);
    setRegenError(null);
    try {
      const res = await regenerateOutfit(tripId || "", cityName);
      if (res.ok && res.image_url) {
        setRegenUsed(true);
        if (tripId) loadResult(tripId);
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
  }, [regenUsed, regenLoading, tripId, cityName, t, loadResult]);

  useEffect(() => {
    if (!purchasedPlan) navigate("/preview", { replace: true });
  }, [purchasedPlan, navigate]);

  // ─── AI Pipeline Trigger state (declared BEFORE useEffects that reference it — TDZ prevention) ───
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const pipelineTriggered = useRef(false);

  // Dummy state kept for compatibility with rendering logic below
  const aiImages = new Map<string, string>();

  // Load result only if already completed (page refresh case)
  useEffect(() => {
    if (tripId && !result && !tripLoading && genStatus === "idle") loadResult(tripId);
  }, [tripId, result, tripLoading, genStatus, loadResult]);

  // ─── IMPORTANT: Declare apiResultImages BEFORE useEffect that references it (TDZ prevention).
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
    if (hasApiImages) { setGenStatus("done"); return; }
    if (pipelineTriggered.current || !tripId) return;
    pipelineTriggered.current = true;

    let cancelled = false;
    async function triggerPipeline() {
      try {
        setGenStatus("generating");

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
          setGenStatus("error");
          return;
        }

        if (!cancelled) {
          await new Promise((r) => setTimeout(r, 2000));
          await loadResult(tripId);
          setGenStatus("done");
        }
      } catch (err) {
        if (!cancelled) { console.error("[AnnualDashboard] Pipeline trigger error:", err); setGenStatus("error"); }
      }
    }
    triggerPipeline();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiImages, tripId]);

  // ─── Extract real API data ───
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

  const cityInput = useMemo(() => ({
    city: cityName, country: countryName,
    fromDate: primaryCity?.fromDate || "2026-10-10",
    toDate: primaryCity?.toDate || "2026-10-31",
  }), [cityName, countryName, primaryCity]);

  const outfits: GeneratedOutfit[] = useMemo(() => generateCityOutfits(profile, cityInput, 4), [profile, cityInput]);
  const packingFallback: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);

  const bodyFitLabel = outfits[0]?.bodyFitLabel || "";

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
  const primaryVibe = apiVibes[0];
  const moodLabel = primaryVibe?.mood_label || preview?.mood_label || `${cityName} Style`;

  // Style DNA
  const styleDNA = useMemo(() => {
    const aesthetics = profile.aesthetics;
    const all = ["Minimalist", "Classic", "Streetwear", "Casual", "Sporty", "Business"];
    const scores = all.map((a) => ({
      label: a,
      percent: aesthetics.includes(a) ? 70 + Math.floor(Math.random() * 25) : 20 + Math.floor(Math.random() * 25),
    }));
    scores.sort((a, b) => b.percent - a.percent);
    return scores;
  }, [profile.aesthetics]);

  const primaryStyle = styleDNA[0]?.label || "Minimalist";
  const primaryPercent = styleDNA[0]?.percent || 88;

  // Packing items: prefer real API data with usageCount derived from daily_plan
  const packingWithUsage = useMemo(() => {
    if (!hasRealData) return packingFallback;
    const usageMap = new Map<string, number>();
    apiDailyPlan.forEach((day) => {
      day.outfit.forEach((name) => {
        const key = name.toLowerCase();
        usageMap.set(key, (usageMap.get(key) || 0) + 1);
      });
    });
    return apiCapsuleItems.map((item) => ({
      name: item.name,
      category: item.category,
      why: item.why,
      versatility_score: item.versatility_score,
      usageCount: usageMap.get(item.name.toLowerCase()) || 1,
    })).sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
  }, [hasRealData, apiCapsuleItems, apiDailyPlan, packingFallback]);

  // Get the 2x2 grid image URL for the primary city
  const getGridImageUrl = (): string | null => {
    const gridImg = apiGridImages.find((g) => g.city.toLowerCase() === cityName.toLowerCase());
    if (gridImg) return gridImg.image_url;
    const legacyGrid = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && (img as ResultImage & { type?: string }).type === "grid"
    );
    if (legacyGrid) return legacyGrid.url;
    const aiGrid = aiImages.get(`${cityName}::grid`);
    if (aiGrid) return aiGrid;
    return null;
  };

  const getSingleOutfitImage = (idx: number): string => {
    const apiImg = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && img.index === idx
        && (img as ResultImage & { type?: string }).type !== "grid"
    );
    if (apiImg) return apiImg.url;
    const aiKey = `${cityName}::outfit-${idx + 1}`;
    const aiUrl = aiImages.get(aiKey);
    if (aiUrl) return aiUrl;
    return outfits[idx]?.image || IMG.tokyoMap;
  };

  const dayToQuadrant = (dayIndex: number): 0 | 1 | 2 | 3 => (dayIndex % 4) as 0 | 1 | 2 | 3;

  // Get daily plans for the primary city
  const cityDays: DayPlan[] = hasRealData
    ? apiDailyPlan.filter((d) => d.city?.toLowerCase() === cityName.toLowerCase())
    : [];

  // Resolve outfit items for a day plan entry (case-insensitive — BUG-010 prevention)
  const resolveOutfitItems = (dayPlan: DayPlan | undefined): CapsuleItem[] => {
    if (!dayPlan) return [];
    return dayPlan.outfit
      .map((name) => apiCapsuleItems.find((c) => c.name.toLowerCase() === name.toLowerCase()))
      .filter((c): c is CapsuleItem => !!c);
  };

  const gridImageUrl = getGridImageUrl();
  const isGeneratingImages = genStatus === "generating";
  const imagesReady = genStatus === "done" || hasApiImages;

  // Build display day list: real API or fallback from outfits
  const displayDays = hasRealData
    ? cityDays
    : outfits.slice(0, 4).map((o, i) => ({
        day: o.day,
        city: cityName,
        outfit: o.items.map((it) => it.name),
        note: o.note || "",
        _mockOutfit: o,
        _mockIdx: i,
      }));

  // Date range label
  const dateRangeLabel = primaryCity?.fromDate && primaryCity?.toDate
    ? `${new Date(primaryCity.fromDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })} – ${new Date(primaryCity.toDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`
    : "";

  const totalDays = displayDays.length || 4;
  const uniqueItems = hasRealData ? apiCapsuleItems.length : packingFallback.length;

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your Travel Capsule — Annual" description="Your annual travel styling dashboard with unlimited outfit generation." noindex={true} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[t("nav.dashboard"), t("nav.myTrips"), t("nav.styleDna"), t("nav.account")].map((item) => (
              <span key={item} className="text-[11px] tracking-[0.1em] uppercase text-[#57534e]/50 cursor-default" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item}</span>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <AnnualBadge />
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
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="no-print hidden sm:inline-flex items-center gap-1.5 h-[44px] px-3 bg-white border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e] hover:border-[#C4613A]/30 transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              {pdfExporting ? <span className="w-3.5 h-3.5 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="picture_as_pdf" size={14} className="text-[#C4613A]" />}
              {pdfExporting ? t("dashboard.exporting") : t("dashboard.savePdf")}
            </button>
            <button
              onClick={() => navigate("/onboarding/1")}
              className="inline-flex items-center justify-center whitespace-nowrap h-[36px] sm:h-[44px] px-3 sm:px-5 bg-[#1A1410] text-white text-[11px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#C4613A] transition-all cursor-pointer"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              <span className="hidden sm:inline">{t("dashboard.planTrip")}</span>
              <span className="sm:hidden">{t("dashboard.new")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title section */}
      <div className="mx-auto px-4 sm:px-6 pt-10 pb-4" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="bolt" size={10} className="text-green-600" /> {t("examples.annual.priorityAi")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="support_agent" size={10} /> {t("examples.annual.vipConcierge")}
          </span>
          {isGeneratingImages && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4613A] animate-ping" /> {t("dashboard.generatingOutfits")}
            </span>
          )}
          {imagesReady && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
              <Icon name="check_circle" size={10} className="text-green-600" /> {t("dashboard.aiImagesReady").replace("{n}", String(apiGridImages.length || apiResultImages.length || 4))}
            </span>
          )}
        </div>

        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: displayFont, lineHeight: 1.1 }}>
          {moodLabel}
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
          {t("dashboard.annualActive")} {hasRealData ? t("dashboard.aiResultsReady") : t("dashboard.resultsGenerating")}
        </p>

        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            <Icon name="auto_awesome" size={12} className="text-[#C4613A]" />
            {bodyFitLabel ? `${hasRealData ? "95" : "92"}% AI Confidence · ${bodyFitLabel}` : `${hasRealData ? "95" : "92"}% AI Confidence`}
          </span>
        </div>

        {genStatus === "error" && !hasApiImages && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl max-w-[500px]">
            <Icon name="error" size={18} className="text-red-500 flex-shrink-0" />
            <span className="text-[13px] text-red-700 flex-1" style={{ fontFamily: bodyFont }}>
              {t("dashboard.generationError")}
            </span>
            <button
              onClick={() => { pipelineTriggered.current = false; setGenStatus("idle"); }}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[11px] uppercase tracking-[0.08em] hover:bg-red-200 transition-colors cursor-pointer flex-shrink-0"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        )}

        <div className="mt-5 max-w-[400px]">
          <TripUsageBar used={4} total={12} renewMonth="Jan 2027" />
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-4 sm:px-6 pt-6 pb-8" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-8 space-y-8 order-2 lg:order-none">

            {/* ─── 2x2 Grid Hero ─── */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1410]">
              <div className="relative">
                {isGeneratingImages && !gridImageUrl ? (
                  /* Generating state: animated shimmer 2x2 */
                  <div className="grid grid-cols-2 gap-1" style={{ aspectRatio: "1/1" }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="bg-[#2A2017] flex flex-col items-center justify-center gap-2" style={{ aspectRatio: "3/4" }}>
                        <span className="w-8 h-8 border-2 border-[#C4613A]/20 border-t-[#C4613A] rounded-full animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>{t("dashboard.day")} {i + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : gridImageUrl ? (
                  /* API grid image: show as single image */
                  <div className="relative" style={{ aspectRatio: "1/1" }}>
                    <img
                      src={gridImageUrl}
                      alt={`${cityName} 4-outfit grid`}
                      className="w-full h-full object-contain bg-[#1A1410]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                        <Icon name="auto_awesome" size={10} className="text-white" /> {t("examples.aiGenerated")}
                      </span>
                      <button
                        onClick={() => downloadImage(gridImageUrl, `capsule-${cityName.toLowerCase()}-grid.jpg`)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                        title={t("dashboard.downloadImage")}
                        aria-label={t("dashboard.downloadImage")}
                      >
                        <Icon name="download" size={16} className="text-white" />
                      </button>
                    </div>
                    {/* Quadrant day labels */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                      {[1, 2, 3, 4].map((day, di) => {
                        const positions = [
                          "items-end justify-start pb-3 pl-3",
                          "items-end justify-end pb-3 pr-3",
                          "items-end justify-start pb-3 pl-3",
                          "items-end justify-end pb-3 pr-3",
                        ];
                        return (
                          <div key={day} className={`flex ${positions[di]}`}>
                            <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)", textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
                              {t("examples.annual.day")} {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Fallback: 2x2 grid of individual outfit images */
                  <div className="grid grid-cols-2 gap-1">
                    {outfits.slice(0, 4).map((outfit, i) => (
                      <div key={outfit.id} className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                        <ImageWithFallback src={getSingleOutfitImage(i)} alt={outfit.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-white/60 text-[9px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-mono)" }}>{t("examples.annual.day")} {outfit.day}</span>
                          <span className="text-white text-[13px] sm:text-[15px]" style={{ fontFamily: displayFont }}>{outfit.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top-left badges when no grid URL */}
                {!gridImageUrl && !isGeneratingImages && (
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                      <Icon name="auto_awesome" size={10} className="text-white" /> {t("examples.aiGenerated")}
                    </span>
                    <div className="px-3 py-1 bg-white/90 rounded-full flex items-center gap-1.5" style={{ backdropFilter: "blur(8px)" }}>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("examples.annual.currentItinerary")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Route info dark band */}
              <div className="px-4 py-3 bg-[#1A1410]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-white text-[22px] sm:text-[26px] italic block" style={{ fontFamily: displayFont }}>
                      {allCityNames.length > 1 ? allCityNames.join(" → ") : `${cityName}, ${countryName}`}
                    </span>
                    <span className="text-white/70 text-[13px] block mt-0.5" style={{ fontFamily: bodyFont }}>
                      {dateRangeLabel && `${dateRangeLabel} · `}{totalDays} {t("examples.annual.day")}s · {outfits.length} Looks · {uniqueItems} {t("examples.annual.items")}
                    </span>
                  </div>
                  {!regenUsed && (
                    <button
                      onClick={handleRegenerate}
                      disabled={regenLoading}
                      className="flex-shrink-0 flex items-center gap-1.5 h-[40px] px-3 bg-white/10 backdrop-blur-sm text-white/80 rounded-xl text-[10px] uppercase tracking-[0.08em] hover:bg-white/20 transition-colors cursor-pointer border border-white/20 disabled:opacity-50"
                      style={{ fontFamily: bodyFont, fontWeight: 600 }}
                      aria-label={t("dashboard.regenerate")}
                    >
                      {regenLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="refresh" size={14} />}
                      <span className="hidden sm:inline">{regenLoading ? t("dashboard.generating") : `${t("dashboard.regenerate")} (1 ${t("dashboard.left")})`}</span>
                    </button>
                  )}
                </div>
                {regenError && (
                  <span className="text-[11px] text-red-300 block mt-1" style={{ fontFamily: bodyFont }}>{regenError}</span>
                )}
              </div>
            </div>

            {/* ─── Outfit Day Navigator + Detail ─── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: displayFont }}>
                  {t("examples.annual.journeyTitle")}
                </h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                  {outfits.length} {t("examples.annual.outfitLooks")}
                </span>
              </div>
              <p className="text-[16px] text-[#57534e] mb-6" style={{ fontFamily: bodyFont }}>
                {t("examples.annual.journeySubtitle")}
              </p>

              {/* Horizontal scrollable day cards */}
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2" style={{ scrollSnapType: "x mandatory" }}>
                {(hasRealData ? cityDays : outfits.slice(0, 4)).map((item, i) => {
                  const day = hasRealData ? (item as DayPlan).day : (item as GeneratedOutfit).day;
                  const subtitle = hasRealData ? ((item as DayPlan).note?.split(" ").slice(0, 3).join(" ") || `${t("dashboard.day")} ${day}`) : (item as GeneratedOutfit).title;
                  const imgSrc = gridImageUrl ? null : getSingleOutfitImage(i);
                  const isActive = activeDayIdx === i;

                  return (
                    <button
                      key={`day-${day}-${i}`}
                      onClick={() => setActiveDayIdx(i)}
                      className={`flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${isActive ? "border-[#C4613A] shadow-lg" : "border-transparent hover:border-[#E8DDD4] opacity-80 hover:opacity-100"}`}
                      style={{ width: "clamp(155px, 20vw, 195px)", scrollSnapAlign: "start" }}
                      aria-pressed={isActive}
                    >
                      <div className="relative" style={{ aspectRatio: "3/4" }}>
                        {gridImageUrl ? (
                          <GridQuadrant
                            imageUrl={gridImageUrl}
                            quadrant={dayToQuadrant(i)}
                            className="w-full h-full"
                            alt={`${t("dashboard.day")} ${day}`}
                          />
                        ) : imgSrc ? (
                          <ImageWithFallback src={imgSrc} alt={`${t("dashboard.day")} ${day}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#EFE8DF] flex items-center justify-center">
                            <span className="w-6 h-6 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[8px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                            <Icon name="auto_awesome" size={8} className="text-white" /> AI
                          </span>
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-[#C4613A] flex items-center justify-center flex-shrink-0">
                              <Icon name="check" size={11} className="text-white" />
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <span className="text-white/60 text-[8px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-mono)" }}>{t("examples.annual.day")} {day}</span>
                          <span className="text-white text-[12px] italic block leading-snug" style={{ fontFamily: displayFont }}>{subtitle}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected day detail card */}
              {displayDays[activeDayIdx] && (() => {
                const activeDayPlan = hasRealData ? (displayDays[activeDayIdx] as DayPlan) : undefined;
                const activeMockOutfit = hasRealData ? undefined : outfits[activeDayIdx];
                const activeOutfitItems = hasRealData ? resolveOutfitItems(activeDayPlan) : [];
                const activeDay = hasRealData ? activeDayPlan!.day : activeMockOutfit!.day;
                const activeTitle = hasRealData
                  ? (activeDayPlan!.note?.split(" ").slice(0, 5).join(" ") || `${t("dashboard.day")} ${activeDay} ${t("dashboard.outfit")}`)
                  : activeMockOutfit!.title;
                const activeNote = hasRealData ? activeDayPlan!.note : activeMockOutfit!.note;
                const activeSubtitle = hasRealData ? cityName : (activeMockOutfit?.subtitle || cityName);

                return (
                  <div className="mt-4 bg-white rounded-xl border border-[#E8DDD4] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                    {/* Detail header */}
                    <div className="flex items-center gap-3 p-5 border-b border-[#EFE8DF]">
                      <span className="w-9 h-9 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[13px] text-[#C4613A] flex-shrink-0" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {activeDay}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[16px] text-[#292524] block" style={{ fontFamily: displayFont }}>
                          {activeTitle}
                        </span>
                        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{activeSubtitle}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] flex-shrink-0" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {hasRealData ? "95" : "92"}{t("examples.annual.match")}
                      </span>
                    </div>

                    <div className="p-5">
                      {/* Two-col: image left, breakdown right */}
                      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
                        {/* Outfit image */}
                        <div className="relative rounded-xl overflow-hidden self-start" style={{ aspectRatio: "3/4" }}>
                          {gridImageUrl ? (
                            <GridQuadrant
                              imageUrl={gridImageUrl}
                              quadrant={dayToQuadrant(activeDayIdx)}
                              className="w-full h-full"
                              alt={`${t("dashboard.day")} ${activeDay} outfit`}
                            />
                          ) : (
                            <ImageWithFallback
                              src={getSingleOutfitImage(activeDayIdx)}
                              alt={`${t("dashboard.day")} ${activeDay} outfit`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[8px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                              <Icon name="auto_awesome" size={8} className="text-white" /> AI
                            </span>
                          </div>
                          {gridImageUrl && (
                            <button
                              onClick={() => downloadQuadrantImage(gridImageUrl, dayToQuadrant(activeDayIdx), `capsule-${cityName.toLowerCase()}-day${activeDay}.jpg`)}
                              className="no-print absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                              title={t("dashboard.downloadImage")}
                              aria-label={t("dashboard.downloadImage")}
                            >
                              <Icon name="download" size={14} className="text-white" />
                            </button>
                          )}
                        </div>

                        {/* Right side breakdown */}
                        <div className="min-w-0">
                          {/* Stylist note */}
                          {activeNote && (
                            <div className="bg-[#FDF8F3] rounded-xl p-4 mb-4 border-l-[3px] border-[#D4AF37]">
                              <span className="text-[9px] uppercase tracking-[0.12em] text-[#D4AF37] block mb-1.5" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{t("examples.pro.stylistNote")}</span>
                              <p className="text-[13px] text-[#292524] leading-relaxed" style={{ fontFamily: displayFont, fontStyle: "italic" }}>
                                "{activeNote}"
                              </p>
                            </div>
                          )}

                          {/* Items */}
                          <span className="text-[9px] uppercase tracking-[0.12em] text-[#8A7B6E] block mb-3" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                            {t("examples.annual.outfitBreakdown")}
                          </span>
                          <div className="space-y-2">
                            {hasRealData ? (
                              activeOutfitItems.length > 0 ? (
                                activeOutfitItems.map((item, i) => {
                                  const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                                  return (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                      <div className="w-11 h-11 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                                        <Icon name={iconName} size={18} className="text-[#57534e]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-[13px] text-[#292524] leading-tight" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                                          <SizeChip size={sizeLabel} />
                                        </div>
                                        {item.why && <span className="text-[11px] text-[#8A7B6E] block mt-0.5" style={{ fontFamily: bodyFont }}>{item.why}</span>}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-[13px] text-[#a8a29e] py-2" style={{ fontFamily: bodyFont }}>
                                  {t("dashboard.outfitDetailsLoading")}
                                </p>
                              )
                            ) : (
                              activeMockOutfit?.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                  <ImageWithFallback src={item.img} alt={item.name} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] text-[#292524] leading-tight" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                                      <SizeChip size={item.recommendedSize} />
                                    </div>
                                    <span className="text-[11px] text-[#8A7B6E] block mt-0.5" style={{ fontFamily: bodyFont }}>{item.desc}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/onboarding/1")}
                  className="inline-flex items-center justify-center h-[44px] px-5 bg-[#C4613A] text-white text-[12px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#A84A25] transition-all cursor-pointer"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  {t("examples.annual.getOwnCapsule")}
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={pdfExporting}
                  className="inline-flex items-center gap-2 h-[44px] px-5 bg-white text-[#C4613A] border border-[#C4613A]/30 text-[12px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#C4613A]/5 transition-all cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  <Icon name="download" size={16} className="text-[#C4613A]" />
                  {t("examples.annual.hiResExport")}
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-5 order-1 lg:order-none">
            <div className="lg:sticky lg:top-24">
              <div className="space-y-5">

                {/* Profile card */}
                <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="person" size={22} className="text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[16px] text-[#292524] block" style={{ fontFamily: displayFont }}>{t("dashboard.yourProfile")}</span>
                      <span className="text-[11px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>
                        {profile.gender ? `${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)} · ` : ""}{profile.silhouette ? `${t(`onboarding2.silhouette${profile.silhouette.charAt(0).toUpperCase() + profile.silhouette.slice(1)}`)}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    {[
                      { label: t("dashboard.silhouette"), value: profile.silhouette ? t(`onboarding2.silhouette${profile.silhouette.charAt(0).toUpperCase() + profile.silhouette.slice(1)}`) : "—" },
                      { label: t("examples.pro.profileSize"), value: `${sizeLabel}` },
                      { label: t("examples.pro.profileAesthetic"), value: profile.aesthetics[0] || "Casual" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#FDF8F3] rounded-lg p-2.5">
                        <span className="text-[10px] text-[#8A7B6E] block" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
                        <span className="text-[13px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {profile.aesthetics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.aesthetics.slice(0, 4).map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded-full bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weather widget */}
                <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: displayFont }}>{cityName} {t("dashboard.weather")}</h3>
                    {dateRangeLabel && <TagChip label={dateRangeLabel} />}
                  </div>
                  <WeatherWidget
                    temp={primaryWeather ? Math.round(primaryWeather.temperature_day_avg) : 18}
                    rain={primaryWeather ? Math.round(primaryWeather.precipitation_prob * 100) : 38}
                    wind={13}
                    heatIndex={primaryWeather ? Math.round(primaryWeather.temperature_night_avg) : 16}
                  />
                </div>

                {/* Packing list */}
                <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: displayFont }}>{t("examples.annual.packingTitle")}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {hasRealData ? t("dashboard.aiCurated") : t("examples.annual.packingAuto")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534e] mb-4" style={{ fontFamily: bodyFont }}>
                    {t("examples.annual.packingFrom")} {totalDays} {t("examples.annual.packingOutfits")} {packingWithUsage.length} {t("examples.annual.packingUnique")}
                  </p>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#E8DDD4 transparent" }}>
                    {packingWithUsage.slice(0, 12).map((item, i) => {
                      const iconName = CAT_ICON[(item as { category?: string }).category?.toLowerCase() ?? ""] ?? "checkroom";
                      const usageCount = (item as { usageCount?: number }).usageCount || 1;
                      return (
                        <div key={`${item.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                            <Icon name={iconName} size={18} className="text-[#57534e]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                              <SizeChip size={sizeLabel} />
                            </div>
                            <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                              {usageCount > 1 ? `x${usageCount} ${t("examples.annual.looks")}` : `1 ${t("examples.annual.look")}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Style DNA */}
                <div className="bg-white rounded-xl p-5 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-[17px] text-[#292524]" style={{ fontFamily: displayFont }}>{t("examples.annual.styleDnaTitle")}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{t("examples.annual.annualOnly")}</span>
                  </div>
                  <p className="text-[12px] text-[#8A7B6E] mb-4 leading-relaxed" style={{ fontFamily: bodyFont }}>
                    {t("examples.annual.styleDnaBody")}
                  </p>
                  {/* Donut + primary label */}
                  <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#EFE8DF]">
                    <DonutChart percent={primaryPercent} size={80} stroke={8} />
                    <div>
                      <span className="text-[20px] text-[#292524] block leading-tight" style={{ fontFamily: displayFont }}>{primaryStyle}</span>
                      <span className="text-[11px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>{t("examples.annual.primaryAesthetic")}</span>
                      <div className="mt-1.5 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-[#D4AF37] text-[11px]">★</span>
                        ))}
                        <span className="text-[10px] text-[#8A7B6E] ml-1" style={{ fontFamily: "var(--font-mono)" }}>{t("examples.annual.dominant")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {styleDNA.map((s) => (
                      <BarStat key={s.label} label={s.label} percent={s.percent} />
                    ))}
                  </div>
                </div>

                {/* VIP Concierge */}
                <div className="gold-gradient rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="support_agent" size={18} className="text-white" />
                    <h3 className="text-[17px] text-white" style={{ fontFamily: displayFont }}>{t("examples.annual.vipTitle")}</h3>
                  </div>
                  <p className="text-[12px] text-white/80 mb-4 leading-relaxed" style={{ fontFamily: bodyFont }}>
                    {t("examples.annual.vipBody")}
                  </p>
                  <button
                    onClick={() => navigate("/onboarding/1")}
                    className="w-full h-10 bg-white text-[#C8A055] rounded-lg text-[12px] uppercase tracking-[0.08em] hover:bg-white/90 active:bg-white/80 transition-colors cursor-pointer"
                    style={{ fontFamily: bodyFont, fontWeight: 700 }}
                  >
                    {t("examples.annual.vipBtn")}
                  </button>
                  <p className="text-[10px] text-white/55 text-center mt-2.5" style={{ fontFamily: "var(--font-mono)" }}>
                    {t("examples.annual.pricingNote")}
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Past Trips section */}
      <div className="bg-[#F5EFE6] py-12 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[24px] sm:text-[28px] text-[#1A1410]" style={{ fontFamily: displayFont }}>{t("examples.annual.pastTrips")}</h2>
              <p className="text-[13px] text-[#8A7B6E] mt-1" style={{ fontFamily: bodyFont }}>{t("examples.annual.pastTripsSubtitle")}</p>
            </div>
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#D4AF37] cursor-pointer" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("examples.annual.viewAll")} &rarr;</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAST_TRIPS.map((trip) => (
              <div key={trip.name} className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] group hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                <div className="relative overflow-hidden" style={{ height: "clamp(180px, 18vw, 220px)" }}>
                  <ImageWithFallback src={trip.img} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/90 backdrop-blur-sm rounded-full">
                    <span className="text-white text-[10px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{trip.rating}</span>
                    <span className="text-white text-[9px]">★</span>
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <span className="text-white/65 text-[9px] uppercase tracking-[0.1em] block" style={{ fontFamily: "var(--font-mono)" }}>{t("examples.annual.mood")}</span>
                    <span className="text-white text-[14px] italic" style={{ fontFamily: displayFont }}>{trip.mood}</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-[16px] sm:text-[18px] text-[#292524] leading-snug" style={{ fontFamily: displayFont }}>{trip.name}</h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Icon name="calendar_today" size={12} className="text-[#8A7B6E]" />
                    <span className="text-[12px] text-[#8A7B6E]" style={{ fontFamily: bodyFont }}>{trip.date}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#EFE8DF] flex items-center gap-4 text-[10px] text-[#8A7B6E]" style={{ fontFamily: "var(--font-mono)" }}>
                    <span className="flex items-center gap-1"><Icon name="checkroom" size={12} className="text-[#C4613A]" />{trip.items} {t("examples.annual.items")}</span>
                    <span className="flex items-center gap-1"><Icon name="style" size={12} className="text-[#C4613A]" />{trip.outfits} {t("examples.annual.outfits")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

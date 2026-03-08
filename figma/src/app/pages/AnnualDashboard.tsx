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
  SocialShareButton,
  ProfileBadge,
  AiGeneratedBadge,
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
import { WORKER_URL, regenerateOutfit, type CapsuleItem, type DayPlan, type WeatherData, type VibeData, type ResultImage, type GridImage } from "../lib/api";
import { exportDashboardPdf } from "../services/exportDashboardPdf";
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

/* ─── Static images ─── */
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
    <div className={`overflow-hidden ${className ?? ""}`}>
      <img
        src={imageUrl}
        alt={alt ?? `Outfit ${quadrant + 1}`}
        className="w-[200%] h-[200%] object-cover"
        style={{ objectPosition: positions[quadrant] }}
      />
    </div>
  );
}

export function AnnualDashboard() {
  const navigate = useNavigate();
  const { data: onboarding } = useOnboarding();
  const { t } = useLang();
  const { purchasedPlan } = useAuth();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const [pdfExporting, setPdfExporting] = useState(false);
  const [regenUsed, setRegenUsed] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Derive city names early — needed by handleRegenerate deps (avoid TDZ)
  const primaryCity = onboarding.cities[0];
  const cityName = result?.cities?.[0]?.name || primaryCity?.city || "Tokyo";
  const countryName = result?.cities?.[0]?.country || primaryCity?.country || "Japan";

  const handleExportPdf = useCallback(async () => {
    if (!mainRef.current || pdfExporting) return;
    setPdfExporting(true);
    try {
      await exportDashboardPdf(mainRef.current, `travel-capsule-annual-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfExporting(false);
    }
  }, [pdfExporting]);

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

  useEffect(() => {
    if (tripId && !result && !tripLoading) loadResult(tripId);
  }, [tripId, result, tripLoading, loadResult]);

  // ─── IMPORTANT: Declare apiResultImages BEFORE useEffect that references it (TDZ prevention).
  const apiResultImages: ResultImage[] = result?.images || [];
  const apiGridImages: GridImage[] = result?.grid_images || [];
  const hasApiImages = apiResultImages.length > 0 || apiGridImages.length > 0;

  // Re-poll for images if result loaded but has no full images yet
  useEffect(() => {
    if (!tripId || !result || hasApiImages || tripLoading) return;
    const timer = setTimeout(() => loadResult(tripId), 15000);
    return () => clearTimeout(timer);
  }, [tripId, result, hasApiImages, tripLoading, loadResult]);

  // ─── AI Image Generation (client-side fallback) ───
  const [aiImages, setAiImages] = useState<Map<string, string>>(new Map());
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const generationStarted = useRef(false);

  useEffect(() => {
    if (hasApiImages) { setGenStatus("done"); return; }
    if (generationStarted.current) return;
    generationStarted.current = true;

    let cancelled = false;
    async function generateImages() {
      try {
        setGenStatus("generating");
        const face_url = onboarding.faceUrl || undefined;
        const resolvedCities =
          onboarding.cities.length > 0
            ? onboarding.cities.map((c) => ({ city: c.city, country: c.country }))
            : result?.cities?.length
            ? result.cities.map((c: { name: string; country: string }) => ({ city: c.name, country: c.country }))
            : [{ city: "Tokyo", country: "Japan" }];

        const ht = parseFloat(onboarding.height) || result?.height_cm || 0;
        const wt = parseFloat(onboarding.weight) || result?.weight_kg || 0;

        const res = await fetch(`${WORKER_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cities: resolvedCities,
            gender: onboarding.gender || result?.gender || "female",
            height_cm: ht > 0 ? ht : undefined,
            weight_kg: wt > 0 ? wt : undefined,
            aesthetics: onboarding.aesthetics?.length ? onboarding.aesthetics : result?.aesthetics ?? [],
            face_url,
            count_per_city: 4,
          }),
        });
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
          images: Array<{ city: string; mood: string; image_url?: string; success: boolean }>;
        };
        const newMap = new Map<string, string>();
        for (const img of data.images) {
          if (img.success && img.image_url) newMap.set(`${img.city}::${img.mood}`, img.image_url);
        }
        if (!cancelled) { setAiImages(newMap); setGenStatus("done"); }
      } catch (err) {
        if (!cancelled) { console.error("[AnnualDashboard] Generation error:", err); setGenStatus("error"); }
      }
    }
    generateImages();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiImages]);

  // ─── Extract real API data ───
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiDailyPlan: DayPlan[] = result?.capsule?.daily_plan || [];
  const hasRealData = apiCapsuleItems.length > 0;

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

  const cityInput = useMemo(() => ({
    city: cityName, country: countryName,
    fromDate: primaryCity?.fromDate || "2026-10-10",
    toDate: primaryCity?.toDate || "2026-10-31",
  }), [cityName, countryName, primaryCity]);

  const outfits: GeneratedOutfit[] = useMemo(() => generateCityOutfits(profile, cityInput, 4), [profile, cityInput]);
  const packing: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);
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

  // Teaser URL from API result (personalized AI image from preview)
  const teaserUrl = result?.teaser_url || preview?.teaser_url || "";

  // Display items: prefer real API data
  const displayPackingItems = hasRealData
    ? apiCapsuleItems.map((item) => ({ name: item.name, category: item.category, why: item.why, versatility_score: item.versatility_score }))
    : packing.map((p) => ({ name: p.name, category: p.category, why: "", versatility_score: p.usageCount }));

  /**
   * Get the 2x2 grid image URL for the primary city.
   */
  const getGridImageUrl = (): string | null => {
    // 1. Webhook pipeline grid images
    const gridImg = apiGridImages.find((g) => g.city.toLowerCase() === cityName.toLowerCase());
    if (gridImg) return gridImg.image_url;
    // 2. Legacy: result image with type=grid
    const legacyGrid = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && (img as ResultImage & { type?: string }).type === "grid"
    );
    if (legacyGrid) return legacyGrid.url;
    // 3. Client-side AI generated grid
    const aiGrid = aiImages.get(`${cityName}::grid`);
    if (aiGrid) return aiGrid;
    return null;
  };

  const getSingleOutfitImage = (idx: number): string => {
    // Webhook pipeline per-outfit images
    const apiImg = apiResultImages.find(
      (img) => img.city.toLowerCase() === cityName.toLowerCase() && img.index === idx
        && (img as ResultImage & { type?: string }).type !== "grid"
    );
    if (apiImg) return apiImg.url;
    // Client-side AI generated
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

  // Resolve outfit items for a day plan entry (case-insensitive)
  const resolveOutfitItems = (dayPlan: DayPlan | undefined): CapsuleItem[] => {
    if (!dayPlan) return [];
    return dayPlan.outfit
      .map((name) => apiCapsuleItems.find((c) => c.name.toLowerCase() === name.toLowerCase()))
      .filter((c): c is CapsuleItem => !!c);
  };

  const gridImageUrl = getGridImageUrl();
  const isGeneratingImages = genStatus === "generating";
  const imagesReady = (genStatus === "done" && aiImages.size > 0) || hasApiImages;

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your Travel Capsule — Annual" description="Your annual travel styling dashboard with unlimited outfit generation." noindex={true} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-4 sm:px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="hidden sm:inline text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block"><AnnualBadge /></span>
            <SocialShareButton />
            <button
              onClick={handleExportPdf}
              disabled={pdfExporting}
              className="no-print hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e] hover:border-[#C4613A]/30 transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              {pdfExporting ? <span className="w-3.5 h-3.5 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="picture_as_pdf" size={14} className="text-[#C4613A]" />}
              {pdfExporting ? "Exporting..." : "Save PDF"}
            </button>
            <button
              onClick={() => window.open(`mailto:?subject=My Travel Capsule AI Style Guide&body=Check out my travel capsule wardrobe: ${window.location.href}`)}
              className="no-print hidden sm:flex w-11 h-11 rounded-full bg-white border border-[#E8DDD4] items-center justify-center hover:border-[#D4AF37]/30 transition-colors cursor-pointer"
            >
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button
              onClick={() => navigate("/onboarding/1")}
              className="inline-flex items-center justify-center whitespace-nowrap h-[36px] sm:h-[44px] px-3 sm:px-5 bg-[#1A1410] text-white text-[11px] uppercase tracking-[0.08em] rounded-xl hover:bg-[#C4613A] transition-all cursor-pointer"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              <span className="hidden sm:inline">Plan Your Next Trip</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-4 sm:px-6 pt-10 pb-4" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {moodLabel}
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Your annual membership is active. {hasRealData ? "AI-curated results ready." : "Results generating..."}
        </p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 92} bodyFitLabel={bodyFitLabel} />
          {isGeneratingImages && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <span className="w-2 h-2 rounded-full bg-[#C4613A] animate-ping" /> Generating AI outfits...
            </span>
          )}
          {imagesReady && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <Icon name="check_circle" size={14} className="text-green-600" /> {apiGridImages.length || apiResultImages.length || aiImages.size} AI images ready
            </span>
          )}
        </div>
        <div className="mt-5 max-w-[400px]">
          <TripUsageBar used={4} total={12} renewMonth="Jan 2027" />
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-4 sm:px-6 pt-6 pb-8" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8 order-last lg:order-none">

            {/* Hero banner with city + regen button */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/9]">
              <ImageWithFallback
                src={teaserUrl || apiResultImages[0]?.url || IMG.tokyoMap}
                alt={`${cityName} map`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                <div>
                  <span className="text-white italic block" style={{ fontSize: "clamp(18px, 4vw, 28px)", fontFamily: "var(--font-display)" }}>
                    {cityName}, {countryName}
                  </span>
                  <span className="text-white/80 text-[14px]" style={{ fontFamily: "var(--font-body)" }}>
                    {primaryCity?.fromDate && primaryCity?.toDate
                      ? `${new Date(primaryCity.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(primaryCity.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "Oct 10 \u2013 31, 2026"}
                  </span>
                </div>
                {!regenUsed && (
                  <button
                    onClick={handleRegenerate}
                    disabled={regenLoading}
                    className="flex items-center gap-1.5 h-[44px] px-3 sm:px-4 bg-white/20 backdrop-blur-sm text-white rounded-xl text-[10px] sm:text-[12px] uppercase tracking-[0.08em] hover:bg-white/30 transition-colors cursor-pointer border border-white/30 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                  >
                    {regenLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="refresh" size={14} />}
                    <span className="hidden sm:inline">{regenLoading ? t("dashboard.generating") : `${t("dashboard.regenerate")} (1 ${t("dashboard.left")})`}</span>
                    <span className="sm:hidden">{regenLoading ? "..." : t("dashboard.regenerate")}</span>
                  </button>
                )}
                {regenError && (
                  <span className="text-[11px] text-red-300" style={{ fontFamily: "var(--font-body)" }}>{regenError}</span>
                )}
              </div>
            </div>

            {/* ─── 2x2 Grid Image Section ─── */}
            <div>
              <h2 className="text-[28px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Your <em>{cityName} Capsule</em>
              </h2>

              {/* Full 2x2 grid image */}
              <div className="relative rounded-2xl overflow-hidden w-full mb-8" style={{ aspectRatio: "1/1", boxShadow: "0 4px 24px rgba(0,0,0,.10)" }}>
                {isGeneratingImages && !gridImageUrl ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#EFE8DF] via-[#F5EFE6] to-[#EFE8DF]" style={{ animation: "shimmer 2s ease-in-out infinite" }}>
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#EFE8DF]/80 rounded-lg flex flex-col items-center justify-center gap-2">
                          <span className="w-8 h-8 border-2 border-[#C4613A]/20 border-t-[#C4613A] rounded-full animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                          <span className="text-[10px] text-[#a8a29e] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>Day {i + 1}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                        <p className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>{t("dashboard.generatingOutfits")}</p>
                        <p className="text-[11px] text-[#a8a29e] mt-1" style={{ fontFamily: "var(--font-mono)" }}>{t("dashboard.generatingTime")}</p>
                        <p className="text-[10px] text-[#a8a29e]/70 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>{t("dashboard.generatingSubtext")}</p>
                      </div>
                    </div>
                  </div>
                ) : gridImageUrl ? (
                  <>
                    <img
                      src={gridImageUrl}
                      alt={`${cityName} 4-outfit grid`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                        <Icon name="auto_awesome" size={10} className="text-white" filled /> 4 AI Outfits · {cityName}
                      </span>
                      <button
                        onClick={() => downloadImage(gridImageUrl, `capsule-${cityName.toLowerCase()}-grid.jpg`)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                        title={t("dashboard.downloadImage")}
                      >
                        <Icon name="download" size={16} className="text-white" />
                      </button>
                    </div>
                    {/* Quadrant day labels */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                      {[1, 2, 3, 4].map((day) => {
                        const positions = [
                          "items-end justify-start pb-3 pl-3",
                          "items-end justify-end pb-3 pr-3",
                          "items-end justify-start pb-3 pl-3",
                          "items-end justify-end pb-3 pr-3",
                        ];
                        return (
                          <div key={day} className={`flex ${positions[day - 1]}`}>
                            <span className="text-white/80 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)", textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
                              {t("dashboard.day")} {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Fallback: 2x2 mock thumbnails */
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 bg-[#EFE8DF]">
                    {outfits.slice(0, 4).map((outfit, i) => {
                      const imgSrc = getSingleOutfitImage(i);
                      return (
                        <div key={outfit.id} className="relative overflow-hidden">
                          <ImageWithFallback src={imgSrc} alt={outfit.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-2 left-2">
                            <span className="text-white/80 text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
                              {t("dashboard.day")} {outfit.day}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── Daily Breakdown (quadrant cropping) ─── */}
              <h3 className="text-[20px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Daily Breakdown
              </h3>
              <div className="space-y-4">
                {(hasRealData ? cityDays : outfits.slice(0, 4).map((o, i) => ({
                  day: o.day,
                  city: cityName,
                  outfit: o.items.map((it) => it.name),
                  note: o.note || "",
                }))).map((dayPlan, dayIdx) => {
                  const quadrant = dayToQuadrant(dayIdx);
                  const outfitItems = hasRealData ? resolveOutfitItems(dayPlan as DayPlan) : [];
                  const mockOutfit = outfits[dayIdx];

                  return (
                    <div
                      key={dayPlan.day}
                      className="bg-white rounded-2xl border border-[#E8DDD4] overflow-hidden"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Quadrant cropped image */}
                        <div className="relative w-full sm:w-[160px] lg:w-[200px] flex-shrink-0" style={{ aspectRatio: "3/4" }}>
                          {gridImageUrl ? (
                            <GridQuadrant
                              imageUrl={gridImageUrl}
                              quadrant={quadrant}
                              className="w-full h-full rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                              alt={`Day ${dayPlan.day} outfit`}
                            />
                          ) : (
                            <ImageWithFallback
                              src={getSingleOutfitImage(dayIdx)}
                              alt={`Day ${dayPlan.day} outfit`}
                              className="w-full h-full object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none" />
                          <div className="absolute bottom-3 left-3">
                            <span className="text-white/70 text-[10px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-mono)" }}>
                              {t("dashboard.day")} {dayPlan.day}
                            </span>
                            {gridImageUrl && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[8px] uppercase tracking-[0.08em] mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                                <Icon name="crop" size={8} className="text-white" /> Quadrant {quadrant + 1}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Outfit items breakdown */}
                        <div className="flex-1 p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="w-8 h-8 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[12px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                              {dayPlan.day}
                            </span>
                            <div>
                              <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>
                                {hasRealData ? dayPlan.note?.split(" ").slice(0, 4).join(" ") || `Day ${dayPlan.day} Outfit` : mockOutfit?.title || `Day ${dayPlan.day}`}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Outfit Breakdown</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {hasRealData ? (
                              outfitItems.length > 0 ? outfitItems.map((item, i) => {
                                const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                                return (
                                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                                      <Icon name={iconName} size={18} className="text-[#57534e]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                                        <SizeChip size={sizeLabel} />
                                      </div>
                                      {item.why && <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.why}</span>}
                                    </div>
                                  </div>
                                );
                              }) : (
                                <p className="text-[13px] text-[#a8a29e] py-2" style={{ fontFamily: "var(--font-body)" }}>
                                  Outfit details loading...
                                </p>
                              )
                            ) : (
                              mockOutfit?.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                  <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                                      <SizeChip size={item.recommendedSize} />
                                    </div>
                                    <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.desc}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {hasRealData && dayPlan.note && (
                            <p className="mt-4 text-[13px] text-[#57534e] italic leading-relaxed pl-3 border-l-2 border-[#C4613A]/30" style={{ fontFamily: "var(--font-display)" }}>
                              {dayPlan.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-6 order-first lg:order-none">
            <ProfileBadge
              gender={profile.gender}
              height={profile.height}
              weight={profile.weight}
              aesthetics={profile.aesthetics}
              photo={profile.photo}
              faceUrl={onboarding.faceUrl}
              bodyFitLabel={bodyFitLabel}
            />

            {/* Weather */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>{cityName} Weather</h3>
              <WeatherWidget
                temp={primaryWeather ? Math.round(primaryWeather.temperature_day_avg) : 18}
                rain={primaryWeather ? Math.round(primaryWeather.precipitation_prob * 100) : 38}
                wind={13}
                heatIndex={primaryWeather ? Math.round(primaryWeather.temperature_night_avg) : 16}
              />
            </div>

            {/* Packing */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.packingList")}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.1em] ${hasRealData ? "bg-[#C4613A]/10 text-[#C4613A]" : "bg-[#EFE8DF] text-[#57534e]"}`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {hasRealData ? "AI curated" : "Auto-derived"}
                </span>
              </div>
              <div className="space-y-2">
                {displayPackingItems.slice(0, 10).map((item, i) => {
                  const iconName = CAT_ICON[item.category?.toLowerCase()] ?? "checkroom";
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                        <Icon name={iconName} size={18} className="text-[#57534e]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#292524] truncate block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                        <span className="text-[10px] text-[#57534e] capitalize" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Style DNA */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-5" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.styleDna")}</h3>
              <div className="flex items-center gap-5 mb-6">
                <DonutChart percent={primaryPercent} />
                <div>
                  <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{primaryStyle}</span>
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>Primary aesthetic</span>
                </div>
              </div>
              <div className="space-y-4">
                {styleDNA.slice(0, 4).map((s) => <BarStat key={s.label} label={s.label} percent={s.percent} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Trips */}
      <div className="mx-auto px-4 sm:px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <h2 className="text-[28px] text-[#292524] mb-8" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.pastTrips")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAST_TRIPS.map((trip) => (
            <div key={trip.name} className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#C4613A]/20 transition-all cursor-pointer group" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div className="relative h-[200px] overflow-hidden">
                <ImageWithFallback src={trip.img} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>{trip.rating} \u2605</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{trip.name}</h3>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[13px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{trip.date}</span>
                  <TagChip label={trip.mood} />
                </div>
                <div className="mt-3 pt-3 border-t border-[#EFE8DF] flex items-center gap-4 text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  <span>{trip.items} items</span>
                  <span>{trip.outfits} outfits</span>
                </div>
              </div>
            </div>
          ))}
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

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  BtnSecondary,
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
import { regenerateOutfit, type CapsuleItem, type WeatherData, type VibeData } from "../lib/api";
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

export function AnnualDashboard() {
  const navigate = useNavigate();
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const { data: onboarding } = useOnboarding();
  const { t } = useLang();
  const { purchasedPlan } = useAuth();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const [pdfExporting, setPdfExporting] = useState(false);
  const [regenUsed, setRegenUsed] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

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
        // Reload result to get updated images
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

  // ─── Extract real API data ───
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiImages = result?.images || [];
  const hasRealData = apiCapsuleItems.length > 0;

  const profile = useMemo(() => buildProfile(onboarding), [onboarding]);
  const primaryCity = onboarding.cities[0];
  const cityName = result?.cities?.[0]?.name || primaryCity?.city || "Tokyo";
  const countryName = result?.cities?.[0]?.country || primaryCity?.country || "Japan";

  const cityInput = useMemo(() => ({
    city: cityName, country: countryName,
    fromDate: primaryCity?.fromDate || "2026-10-10",
    toDate: primaryCity?.toDate || "2026-10-31",
  }), [cityName, countryName, primaryCity]);

  const outfits: GeneratedOutfit[] = useMemo(() => generateCityOutfits(profile, cityInput, 4), [profile, cityInput]);
  const packing: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);
  const bodyFitLabel = outfits[0]?.bodyFitLabel || "";

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

  const getOutfitImage = (idx: number): string => {
    if (apiImages.length > idx) return apiImages[idx].url;
    return outfits[idx]?.image || IMG.tokyoMap;
  };

  // Display items: prefer real API data
  const displayPackingItems = hasRealData
    ? apiCapsuleItems.map((item) => ({ name: item.name, category: item.category, why: item.why, versatility_score: item.versatility_score }))
    : packing.map((p) => ({ name: p.name, category: p.category, why: "", versatility_score: p.usageCount }));

  return (
    <div ref={mainRef} data-pdf-root className="min-h-screen bg-[#FDF8F3]">
      <SEO title="Your Travel Capsule — Annual" description="Your annual travel styling dashboard with unlimited outfit generation." noindex={true} />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block"><AnnualBadge /></span>
            <SocialShareButton />
            <button onClick={handleExportPdf} disabled={pdfExporting} className="no-print hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e] hover:border-[#C4613A]/30 transition-colors cursor-pointer disabled:opacity-50" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              {pdfExporting ? <span className="w-3.5 h-3.5 border-2 border-[#C4613A]/30 border-t-[#C4613A] rounded-full animate-spin" /> : <Icon name="picture_as_pdf" size={14} className="text-[#C4613A]" />} {pdfExporting ? "Exporting..." : "Save PDF"}
            </button>
            <button onClick={() => window.open(`mailto:?subject=My Travel Capsule AI Style Guide&body=Check out my travel capsule wardrobe: ${window.location.href}`)} className="no-print w-9 h-9 rounded-full bg-white border border-[#E8DDD4] flex items-center justify-center hover:border-[#D4AF37]/30 transition-colors cursor-pointer">
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button onClick={() => navigate("/onboarding/1")} className="inline-flex items-center justify-center whitespace-nowrap h-[36px] px-3 sm:px-5 bg-[#1A1410] text-white text-[11px] uppercase tracking-[0.08em] rounded-none hover:bg-[#C4613A] transition-all cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              <span className="hidden sm:inline">Plan Your Next Trip</span>
              <span className="sm:hidden">New Trip</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-4" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {moodLabel}
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Your annual membership is active. {hasRealData ? "AI-curated results ready." : "Results generating..."}
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 92} bodyFitLabel={bodyFitLabel} />
        </div>
        <div className="mt-5 max-w-[400px]">
          <TripUsageBar used={4} total={12} renewMonth="Jan 2027" />
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-6 pt-6 pb-8" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <ImageWithFallback src={IMG.tokyoMap} alt={`${cityName} map`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-white italic block" style={{ fontSize: "clamp(18px, 4vw, 28px)", fontFamily: "var(--font-display)" }}>{cityName}, {countryName}</span>
                  <span className="text-white/80 text-[14px]" style={{ fontFamily: "var(--font-body)" }}>
                    {primaryCity?.fromDate && primaryCity?.toDate
                      ? `${new Date(primaryCity.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(primaryCity.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "Oct 10 \u2013 31, 2026"}
                  </span>
                </div>
                {!regenUsed && (
                  <button onClick={handleRegenerate} disabled={regenLoading} className="hidden sm:flex items-center gap-1.5 h-[36px] px-4 bg-white/20 backdrop-blur-sm text-white rounded-none text-[12px] uppercase tracking-[0.08em] hover:bg-white/30 transition-colors cursor-pointer border border-white/30 disabled:opacity-50" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    {regenLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="refresh" size={14} />}
                    {regenLoading ? t("dashboard.generating") : `${t("dashboard.regenerate")} (1 ${t("dashboard.left")})`}
                  </button>
                )}
                {regenError && (
                  <span className="text-[11px] text-red-300 ml-2" style={{ fontFamily: "var(--font-body)" }}>{regenError}</span>
                )}
              </div>
            </div>

            {/* AI Outfits */}
            <div>
              <h2 className="text-[28px] text-[#292524] mb-6" style={{ fontFamily: "var(--font-display)" }}>
                Your <em>{cityName} Capsule</em>
              </h2>

              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {outfits.map((outfit, i) => (
                  <button key={outfit.id} onClick={() => setActiveDayIdx(i)}
                    className={`flex-shrink-0 w-[200px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeDayIdx === i ? "border-[#C4613A] ring-1 ring-[#C4613A]/30" : "border-transparent hover:border-[#E8DDD4]"}`}>
                    <div className="relative h-[240px]">
                      <ImageWithFallback src={getOutfitImage(i)} alt={outfit.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                        {apiImages.length > i ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#C4613A]/90 text-white text-[8px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                            <Icon name="auto_awesome" size={8} className="text-white" filled /> AI
                          </span>
                        ) : <span />}
                        <button
                          onClick={(e) => { e.stopPropagation(); downloadImage(getOutfitImage(i), `capsule-${cityName.toLowerCase()}-outfit-${i + 1}.jpg`); }}
                          className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                          title={t("dashboard.downloadImage")}
                        >
                          <Icon name="download" size={14} className="text-white" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white/70 text-[10px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Day {outfit.day}</span>
                        <span className="text-white text-[18px] italic block" style={{ fontFamily: "var(--font-display)" }}>{outfit.title.split(" ")[0]}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected day detail */}
              <div className="mt-4 bg-white rounded-xl border border-[#E8DDD4] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[13px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {outfits[activeDayIdx].day}
                  </span>
                  <span className="text-[16px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                    {outfits[activeDayIdx].title}
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  {hasRealData ? (
                    apiCapsuleItems.slice(activeDayIdx * 3, activeDayIdx * 3 + 5).map((item, i) => {
                      const catIcon: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", shoes: "footprint", accessory: "watch" };
                      const iconName = catIcon[item.category?.toLowerCase()] ?? "checkroom";
                      return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-[#EFE8DF] flex items-center justify-center flex-shrink-0">
                          <Icon name={iconName} size={20} className="text-[#57534e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                            <SizeChip size={bodyFitLabel || "M"} />
                          </div>
                          <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.why}</span>
                        </div>
                      </div>
                      );
                    })
                  ) : (
                    outfits[activeDayIdx].items.map((item) => (
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

          {/* Right */}
          <div className="lg:col-span-4 space-y-6">
            <ProfileBadge gender={profile.gender} height={profile.height} weight={profile.weight} aesthetics={profile.aesthetics} photo={profile.photo} faceUrl={onboarding.faceUrl} bodyFitLabel={bodyFitLabel} />

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
                  const CAT_ICON: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", shoes: "footprint", accessory: "watch" };
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
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
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
    </div>
  );
}

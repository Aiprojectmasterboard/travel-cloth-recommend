import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  BtnSecondary,
  TagChip,
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
  type GeneratedOutfit,
  type CityOutfitSet,
  type PackingItem,
} from "../services/outfitGenerator";
import { WORKER_URL, type CapsuleItem, type DayPlan, type WeatherData, type VibeData, type ResultImage } from "../lib/api";

/* ─── City hero images (fallback) ─── */
const CITY_HEROES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1577056922428-a511301a562d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  rome: "https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  barcelona: "https://images.unsplash.com/photo-1633378532456-103a55a27261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  tokyo: "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  milan: "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
};

export function ProDashboard() {
  const navigate = useNavigate();
  const [activeCity, setActiveCity] = useState(0);
  const [expandedOutfit, setExpandedOutfit] = useState(0);
  const [regenUsed, setRegenUsed] = useState(false);
  const { isLoggedIn, setShowSignupPrompt, purchasedPlan } = useAuth();
  const { data: onboarding } = useOnboarding();
  const { result, preview, tripId, loadResult, loading: tripLoading } = useTrip();
  const { t } = useLang();

  useEffect(() => {
    if (!purchasedPlan) navigate("/preview", { replace: true });
  }, [purchasedPlan, navigate]);

  useEffect(() => {
    if (tripId && !result && !tripLoading) loadResult(tripId);
  }, [tripId, result, tripLoading, loadResult]);

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowSignupPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, setShowSignupPrompt]);

  // ─── AI Image Generation (existing pattern) ───
  const [aiImages, setAiImages] = useState<Map<string, string>>(new Map());
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const generationStarted = useRef(false);

  interface AiItem { name: string; category: string; desc: string; essential: boolean; }
  const [aiOutfitItems, setAiOutfitItems] = useState<Record<string, AiItem[]>>({});

  // Skip client-side generation if API result already has images (webhook pipeline)
  const apiResultImages: ResultImage[] = result?.images || [];
  const hasApiImages = apiResultImages.length > 0;

  useEffect(() => {
    // If the webhook pipeline already produced images, skip /api/generate
    if (hasApiImages) {
      setGenStatus("done");
      return;
    }
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
            : [{ city: "Paris", country: "France" }];

        const ht = parseFloat(onboarding.height);
        const wt = parseFloat(onboarding.weight);

        const res = await fetch(`${WORKER_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cities: resolvedCities,
            gender: onboarding.gender || "female",
            height_cm: !isNaN(ht) && ht > 0 ? ht : undefined,
            weight_kg: !isNaN(wt) && wt > 0 ? wt : undefined,
            aesthetics: onboarding.aesthetics ?? [],
            face_url,
            count_per_city: 4,
          }),
        });
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
          images: Array<{ city: string; mood: string; image_url?: string; success: boolean }>;
          outfitItems?: Record<string, AiItem[]>;
        };
        const newMap = new Map<string, string>();
        for (const img of data.images) {
          if (img.success && img.image_url) newMap.set(`${img.city}::${img.mood}`, img.image_url);
        }
        if (!cancelled) {
          setAiImages(newMap);
          if (data.outfitItems) setAiOutfitItems(data.outfitItems);
          setGenStatus("done");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ProDashboard] Generation error:", err);
          setGenStatus("error");
        }
      }
    }
    generateImages();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiImages]);

  // ─── Data sources ───
  const apiWeather: WeatherData[] = result?.weather || preview?.weather || [];
  const apiVibes: VibeData[] = result?.vibes || preview?.vibes || [];
  const apiCapsuleItems: CapsuleItem[] = result?.capsule?.items || [];
  const apiDailyPlan: DayPlan[] = result?.capsule?.daily_plan || [];
  const hasRealData = apiCapsuleItems.length > 0;

  const profile = useMemo(() => buildProfile(onboarding), [onboarding]);

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

  const citySets = useMemo<CityOutfitSet[]>(() => {
    return cities.slice(0, 5).map((c, ci) => {
      const key = c.city.toLowerCase();
      const outfits = generateCityOutfits(profile, c, 4);
      const vibeData = apiVibes[ci] || apiVibes[0];
      const weatherInfo = apiWeather.find((w) => w.city?.toLowerCase() === key) || apiWeather[ci] || apiWeather[0];

      return {
        city: c.city,
        country: c.country,
        dates: `${new Date(c.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(c.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        heroImg: CITY_HEROES[key] || CITY_HEROES.paris,
        weather: {
          temp: weatherInfo ? Math.round(weatherInfo.temperature_day_avg) : 15,
          rain: weatherInfo ? Math.round(weatherInfo.precipitation_prob * 100) : 20,
          wind: 12,
          condition: weatherInfo?.climate_band || "mild",
        },
        outfits,
        colorPalette: vibeData?.color_palette || ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"],
        activities: vibeData?.vibe_tags || ["City Walk", "Cultural Visit", "Dining"],
      };
    });
  }, [cities, profile, apiVibes, apiWeather]);

  const allOutfits = useMemo(() => citySets.flatMap((cs) => cs.outfits), [citySets]);
  const packing: PackingItem[] = useMemo(() => derivePacking(allOutfits), [allOutfits]);
  const bodyFitLabel = allOutfits[0]?.bodyFitLabel || "";

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

  // Get image for outfit: check API images first, then AI generated, then mock
  const getOutfitImage = (cityName: string, idx: number, fallback: string): string => {
    const apiImg = apiResultImages.find((img) => img.city.toLowerCase() === cityName.toLowerCase() && img.index === idx);
    if (apiImg) return apiImg.url;
    const aiKey = `${cityName}::outfit-${idx + 1}`;
    const aiUrl = aiImages.get(aiKey);
    if (aiUrl) return aiUrl;
    return fallback;
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SignupPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block"><PlanBadge label="Pro Plan" className="bg-[#C4613A]/10 text-[#C4613A]" /></span>
            <SocialShareButton />
            <button onClick={() => window.open(`mailto:?subject=My Travel Capsule AI Style Guide&body=Check out my travel capsule wardrobe: ${window.location.href}`)} className="no-print w-9 h-9 rounded-full bg-white border border-[#E8DDD4] flex items-center justify-center hover:border-[#C4613A]/30 transition-colors cursor-pointer">
              <Icon name="mail" size={16} className="text-[#57534e]" />
            </button>
            <button onClick={() => window.print()} className="no-print h-[36px] px-2 sm:px-4 border border-[#C4613A]/30 bg-[#C4613A]/5 text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/15 transition-colors cursor-pointer flex items-center gap-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              <Icon name="download" size={14} className="text-[#C4613A]" /> <span className="hidden sm:inline">Hi-Res Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          {t("dashboard.multiCityStyleGuide")}
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: "var(--font-body)" }}>
          {cities.length} cities, one seamlessly curated capsule wardrobe.
        </p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <AiGeneratedBadge confidence={hasRealData ? 95 : 90} bodyFitLabel={bodyFitLabel} />
          {genStatus === "generating" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <span className="w-2 h-2 rounded-full bg-[#C4613A] animate-ping" /> Generating AI outfits…
            </span>
          )}
          {genStatus === "done" && aiImages.size > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[11px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              <Icon name="check_circle" size={14} className="text-green-600" /> {aiImages.size} AI images ready
            </span>
          )}
        </div>

        {/* City tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {citySets.map((cs, i) => (
            <button key={cs.city} onClick={() => { setActiveCity(i); setExpandedOutfit(0); }}
              className={`px-4 py-1.5 rounded-full text-[12px] uppercase tracking-[0.08em] transition-colors cursor-pointer border ${activeCity === i ? "bg-[#C4613A] text-white border-[#C4613A]" : "bg-white text-[#57534e] border-[#E8DDD4] hover:border-[#C4613A]/40"}`}
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
              {cs.city} · {cs.dates}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-6 pt-8 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-10">
            {/* City hero */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <ImageWithFallback src={currentSet.heroImg} alt={currentSet.city} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 flex gap-2">
                <TagChip label={`${currentSet.city}, ${currentSet.country}`} className="bg-white/20 text-white backdrop-blur-sm" />
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-white/70 block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{currentSet.dates}</span>
                  <span className="text-[28px] text-white italic" style={{ fontFamily: "var(--font-display)" }}>{currentSet.outfits.length} AI Outfits</span>
                </div>
                {!regenUsed && (
                  <button onClick={() => setRegenUsed(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 text-white text-[12px] uppercase tracking-[0.08em] hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    <Icon name="refresh" size={16} /> Regenerate (1 left)
                  </button>
                )}
              </div>
            </div>

            {/* 2x2 outfit grid */}
            <div>
              <h2 className="text-[28px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Your <em>{currentSet.city} Capsule</em>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                {currentSet.outfits.slice(0, 4).map((outfit, i) => {
                  const imgSrc = getOutfitImage(currentSet.city, i, outfit.image);
                  const isLoading = genStatus === "generating" && !aiImages.has(`${currentSet.city}::outfit-${i + 1}`);
                  return (
                    <button key={outfit.id} onClick={() => setExpandedOutfit(i)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${expandedOutfit === i ? "border-[#C4613A] ring-2 ring-[#C4613A]/30" : "border-transparent hover:border-[#E8DDD4]"}`}
                      style={{ aspectRatio: "4/5" }}>
                      {isLoading ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-[#EFE8DF] to-[#d6cfc7] flex flex-col items-center justify-center gap-3">
                          <span className="w-10 h-10 border-3 border-[#C4613A]/20 border-t-[#C4613A] rounded-full animate-spin" />
                          <span className="text-[11px] text-[#57534e] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>Generating...</span>
                        </div>
                      ) : (
                        <img src={imgSrc} alt={outfit.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = outfit.image; }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      {aiImages.has(`${currentSet.city}::outfit-${i + 1}`) && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/90 text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                            <Icon name="auto_awesome" size={10} className="text-white" filled /> AI
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white/70 text-[10px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-mono)" }}>Day {outfit.day}</span>
                        <span className="text-white text-[16px] italic block leading-tight" style={{ fontFamily: "var(--font-display)" }}>{outfit.title.split(" ")[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Expanded outfit detail */}
              {expandedOutfit >= 0 && expandedOutfit < currentSet.outfits.length && (
                <div className="bg-white rounded-2xl border border-[#ebdacc] p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                      <ImageWithFallback
                        src={getOutfitImage(currentSet.city, expandedOutfit, currentSet.outfits[expandedOutfit].image)}
                        alt={currentSet.outfits[expandedOutfit].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex gap-1.5">
                          {currentSet.colorPalette.map((color) => (
                            <div key={color} className="w-6 h-6 rounded-full border-2 border-white/50" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[20px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                        {currentSet.outfits[expandedOutfit].title}
                      </h3>
                      <div className="space-y-2">
                        {hasRealData ? (
                          apiCapsuleItems.slice(expandedOutfit * 3, expandedOutfit * 3 + 5).map((item, i) => {
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
                          currentSet.outfits[expandedOutfit].items.map((item) => (
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
                      <p className="mt-5 text-[14px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                        "{currentSet.outfits[expandedOutfit].note}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[88px] space-y-6">
              <ProfileBadge gender={profile.gender} height={profile.height} weight={profile.weight} aesthetics={profile.aesthetics} photo={profile.photo} faceUrl={onboarding.faceUrl} bodyFitLabel={bodyFitLabel} />

              {/* Multi-City Packing */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.multiCityPacking")}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.1em] ${hasRealData ? "bg-[#C4613A]/10 text-[#C4613A]" : "bg-[#EFE8DF] text-[#57534e]"}`} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {hasRealData ? "AI curated" : "Auto-derived"}
                  </span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {(aiPackingList.length > 0 ? aiPackingList : packing).slice(0, 15).map((item, i) => {
                    const isAi = aiPackingList.length > 0;
                    const CAT_ICON: Record<string, string> = { top: "checkroom", bottom: "layers", outerwear: "dry_cleaning", footwear: "footprint", accessory: "watch" };
                    if (isAi) {
                      const ai = item as typeof aiPackingList[number];
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ai.essential ? "bg-[#C4613A]/10" : "bg-[#EFE8DF]"}`}>
                            <Icon name={CAT_ICON[ai.category] ?? "checkroom"} size={18} className={ai.essential ? "text-[#C4613A]" : "text-[#57534e]"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] text-[#292524] truncate block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{ai.name}</span>
                            <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                              {ai.cities.length > 1 ? `${ai.cities.length} cities` : ai.cities[0]}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    const mock = item as PackingItem;
                    return (
                      <div key={mock.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                        <ImageWithFallback src={mock.img} alt={mock.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[13px] text-[#292524] truncate block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{mock.name}</span>
                          <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Used in {mock.usageCount} looks</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weather */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-5" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.weatherForecast")}</h3>
                <div className="space-y-4">
                  {citySets.map((cs) => (
                    <div key={cs.city} className="py-3 border-b border-[#EFE8DF] last:border-0">
                      <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{cs.city}</span>
                      <span className="text-[11px] text-[#57534e] block mb-2" style={{ fontFamily: "var(--font-body)" }}>{cs.dates} · {cs.weather.condition}</span>
                      <div className="flex items-center gap-4 text-[12px]" style={{ fontFamily: "var(--font-mono)" }}>
                        <span className="flex items-center gap-1 text-[#292524]"><Icon name="thermostat" size={14} className="text-[#C4613A]" />{cs.weather.temp}°C</span>
                        <span className="flex items-center gap-1 text-[#57534e]"><Icon name="water_drop" size={14} />{cs.weather.rain}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>{t("dashboard.capsuleStats")}</h3>
                <div className="space-y-3">
                  {[
                    { icon: "public", label: "Cities", value: `${citySets.length}` },
                    { icon: "style", label: "AI Outfits", value: `${allOutfits.length} looks` },
                    { icon: "checkroom", label: "Packing Items", value: `${aiPackingList.length || packing.length} pieces` },
                    { icon: "refresh", label: "Regenerations", value: regenUsed ? "0 left" : "1 left" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon name={stat.icon} size={16} className="text-[#C4613A]" />
                        <span className="text-[13px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{stat.label}</span>
                      </div>
                      <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

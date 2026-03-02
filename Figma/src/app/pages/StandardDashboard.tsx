import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  BtnSecondary,
  PlanBadge,
  TagChip,
  DayPlanStrip,
  CapsuleCard,
  StyleCodeCard,
  MoodCard,
  UpgradeBanner,
  SocialShareButton,
  SignupPrompt,
  ProfileBadge,
  AiGeneratedBadge,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type PackingItem,
} from "../services/outfitGenerator";

/* ─── Fallback city image ─── */
const HERO_IMG = "https://images.unsplash.com/photo-1659003505996-d5d7ca66bb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMEZyYW5jZSUyMEVpZmZlbCUyMHRvd2VyJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MjQyNjYwM3ww&ixlib=rb-4.1.0&q=80&w=1080";
const MOOD_IMG = "https://images.unsplash.com/photo-1577058006248-8289d93b53ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMHN0cmVldCUyMGNhZmUlMjBhdXR1bW4lMjB0cmF2ZWwlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI2NjA4fDA&ixlib=rb-4.1.0&q=80&w=1080";

const DAY_PLANS = [
  { day: 1, activity: "Arrival" },
  { day: 2, activity: "Le Marais" },
  { day: 3, activity: "Museums" },
  { day: 4, activity: "Shopping" },
  { day: 5, activity: "Montmartre" },
  { day: 6, activity: "Day Trip" },
  { day: 7, activity: "Departure" },
];

export function StandardDashboard() {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(1);
  const [expandedOutfit, setExpandedOutfit] = useState(0);
  const { isLoggedIn, setShowSignupPrompt } = useAuth();
  const { data: onboarding } = useOnboarding();

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowSignupPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, setShowSignupPrompt]);

  /* ── Build profile & generate outfits from onboarding data ── */
  const profile = useMemo(() => buildProfile(onboarding), [onboarding]);

  const primaryCity = onboarding.cities[0];
  const cityName = primaryCity?.city || "Paris";
  const countryName = primaryCity?.country || "France";

  const cityInput = useMemo(() => ({
    city: cityName,
    country: countryName,
    fromDate: primaryCity?.fromDate || "2026-04-12",
    toDate: primaryCity?.toDate || "2026-04-18",
  }), [cityName, countryName, primaryCity]);

  /** Standard plan: 4 AI outfits for 1 city */
  const outfits: GeneratedOutfit[] = useMemo(
    () => generateCityOutfits(profile, cityInput, 4),
    [profile, cityInput],
  );

  /** Packing list auto-derived from outfit items */
  const packing: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);

  const bodyFitLabel = outfits[0]?.bodyFitLabel || "";

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SignupPrompt />
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50"
        style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}
      >
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[18px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Travel Capsule
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["My Capsules", "Shop", "Account"].map((item) => (
              <a key={item} href="#" className="text-[11px] tracking-[0.1em] uppercase text-[#57534e] hover:text-[#C4613A] transition-colors" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <PlanBadge label="Standard Plan" />
            <SocialShareButton />
            <button className="h-[36px] px-4 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[12px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/20 transition-colors cursor-pointer flex items-center gap-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              <Icon name="picture_as_pdf" size={16} className="text-[#C4613A]" /> Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-6" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(36px, 4vw, 56px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Your {cityName} Capsule
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          7 days of curated style for {cityName} — weather-adapted, culture-aware, and tailored to your profile.
        </p>
        {/* AI personalization indicator */}
        <div className="mt-3">
          <AiGeneratedBadge confidence={outfits[0]?.aiConfidence || 90} bodyFitLabel={bodyFitLabel} />
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-8 space-y-10">

            {/* ━━━ 4 AI Outfit Cards ━━━ */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  AI-Curated Outfits
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  4 Looks · {profile.gender === "male" ? "Menswear" : profile.gender === "non-binary" ? "Unisex" : "Womenswear"}
                </span>
              </div>

              <div className="space-y-6">
                {outfits.map((outfit, idx) => (
                  <div key={outfit.id} className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                    {/* Header */}
                    <button
                      onClick={() => setExpandedOutfit(expandedOutfit === idx ? -1 : idx)}
                      className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[#FDF8F3]/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[14px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {outfit.day}
                        </span>
                        <div className="text-left">
                          <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>
                            {outfit.title}
                          </span>
                          <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                            {outfit.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          {outfit.aiConfidence}% match
                        </span>
                        <Icon name={expandedOutfit === idx ? "expand_less" : "expand_more"} size={24} className="text-[#57534e]" />
                      </div>
                    </button>

                    {/* Expanded */}
                    {expandedOutfit === idx && (
                      <div className="px-5 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Full-body outfit image */}
                          <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                            <ImageWithFallback src={outfit.image} alt={outfit.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                                <Icon name="auto_awesome" size={10} className="text-white" filled /> AI Generated
                              </span>
                            </div>
                            <div className="absolute bottom-4 left-4">
                              <TagChip label={`Day ${outfit.day}`} className="bg-white/20 text-white backdrop-blur-sm" />
                            </div>
                          </div>

                          {/* Outfit breakdown with sizes */}
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-4" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                              Outfit Breakdown · Your Sizes
                            </span>
                            <div className="space-y-2">
                              {outfit.items.map((item) => (
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
                              ))}
                            </div>
                            <p className="mt-6 text-[14px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                              "{outfit.note}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ━━━ Day-by-Day Itinerary ━━━ */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Your 7-Day Itinerary</h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Apr 12 – 18, 2026</span>
              </div>
              <DayPlanStrip days={DAY_PLANS} activeDay={activeDay} onDaySelect={setActiveDay} />
              <div className="mt-4 bg-white rounded-xl border border-[#E8DDD4] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="event" size={18} className="text-[#C4613A]" />
                  <span className="text-[16px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                    Day {activeDay}: {DAY_PLANS.find(d => d.day === activeDay)?.activity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { icon: "thermostat", val: [9, 11, 8, 12, 10, 14, 9][activeDay - 1] + "°C", label: "Avg Temp" },
                    { icon: "water_drop", val: [30, 20, 45, 15, 25, 10, 35][activeDay - 1] + "%", label: "Rain" },
                    { icon: "explore", val: ["8K", "12K", "10K", "15K", "11K", "6K", "5K"][activeDay - 1], label: "Steps Est." },
                  ].map((s) => (
                    <div key={s.label} className="py-3 bg-[#FDF8F3] rounded-lg">
                      <Icon name={s.icon} size={18} className="text-[#C4613A] mx-auto mb-1" />
                      <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-mono)" }}>{s.val}</span>
                      <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ━━━ Packing Checklist (auto-derived) ━━━ */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  Your Packing List
                </h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {packing.length} items · Auto-generated
                </span>
              </div>
              <p className="text-[14px] text-[#57534e] mb-5" style={{ fontFamily: "var(--font-body)" }}>
                Consolidated from your {outfits.length} outfit coordinates. Items used across multiple looks are listed once with usage count.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {packing.map((item) => (
                  <div key={item.id} className="group bg-white rounded-xl border border-[#E8DDD4] overflow-hidden hover:border-[#C4613A]/30 transition-colors">
                    <div className="relative aspect-square">
                      <ImageWithFallback src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <SizeChip size={item.recommendedSize} />
                      </div>
                      {item.usageCount > 1 && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                            x{item.usageCount} looks
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <span className="text-[13px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                      <span className="text-[10px] text-[#57534e] capitalize" style={{ fontFamily: "var(--font-mono)" }}>{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ━━━ Upgrade Banner ━━━ */}
            <div className="rounded-2xl overflow-hidden">
              <UpgradeBanner initialMinutes={3} initialSeconds={0} onUpgrade={() => navigate("/preview")} />
              <div className="bg-[#C4613A] px-6 pb-4 -mt-1">
                <p className="text-[14px] text-white/80" style={{ fontFamily: "var(--font-body)" }}>
                  Upgrade to Pro for multi-city itineraries, hero images, and style regeneration.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Generation Profile */}
            <ProfileBadge
              gender={profile.gender}
              height={profile.height}
              weight={profile.weight}
              aesthetics={profile.aesthetics}
              photo={profile.photo}
              bodyFitLabel={bodyFitLabel}
            />

            {/* Weather & Vibe */}
            <StyleCodeCard
              description={`Layered sophistication meets urban practicality. Your ${cityName} capsule emphasizes transitional pieces that adapt to the city's weather while maintaining a polished aesthetic.`}
              city={`${cityName}, ${countryName.slice(0, 2).toUpperCase()}`}
              temp={9}
              rain={30}
              uv={3}
            />

            {/* City Vibe */}
            <MoodCard
              imageUrl={MOOD_IMG}
              city={`${cityName} Mood`}
              description="Cool-toned elegance with warm textural accents. Think stone facades, cafe terraces, and soft afternoon light."
              swatches={["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"]}
            />

            {/* Capsule Summary */}
            <div className="bg-white rounded-xl border border-[#E8DDD4] p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>Capsule Summary</h3>
              <div className="space-y-3">
                {[
                  { icon: "checkroom", label: "Packing Items", value: `${packing.length} pieces` },
                  { icon: "style", label: "AI Outfits", value: `${outfits.length} looks` },
                  { icon: "calendar_month", label: "Trip Duration", value: "7 days" },
                  { icon: "grid_view", label: "Combinations", value: `${packing.length * 3} outfits` },
                  { icon: "eco", label: "Sustainability", value: "92% reusable" },
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

            {/* Unlock with Pro */}
            <div className="bg-[#EFE8DF]/40 rounded-xl border border-[#E8DDD4] border-dashed p-6">
              <h3 className="text-[16px] text-[#292524] mb-3" style={{ fontFamily: "var(--font-display)" }}>Unlock with Pro</h3>
              <div className="space-y-2">
                {["Multi-city planning", "Hero editorial images", "Ultra High-Res exports", "Style regeneration"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Icon name="lock" size={14} className="text-[#57534e]/50" />
                    <span className="text-[13px] text-[#57534e]/70" style={{ fontFamily: "var(--font-body)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/preview")} className="mt-4 w-full h-[40px] bg-[#C4613A] text-white text-[12px] uppercase tracking-[0.08em] rounded-none hover:bg-[#A84A25] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
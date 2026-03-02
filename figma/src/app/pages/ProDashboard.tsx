import React, { useState, useEffect, useMemo } from "react";
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
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type CityOutfitSet,
  type PackingItem,
} from "../services/outfitGenerator";

/* ─── City hero images ─── */
const CITY_HEROES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1577056922428-a511301a562d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMGNhZmUlMjBnb2xkZW4lMjBob3VyJTIwd29tYW4lMjBlbGVnYW50JTIwY29hdHxlbnwxfHx8fDE3NzI0Mjc1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  rome: "https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSb21lJTIwY29sb3NzZXVtJTIwZ29sZGVuJTIwaG91ciUyMHdhcm0lMjBzdW5zZXQlMjBhbmNpZW50JTIwcnVpbnN8ZW58MXx8fHwxNzcyNDI5NDkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  barcelona: "https://images.unsplash.com/photo-1633378532456-103a55a27261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYXJjZWxvbmElMjBiZWFjaCUyMHN1bnNldCUyMHdvbWFuJTIwc3VuZHJlc3MlMjBjb2FzdGFsJTIwc3VtbWVyfGVufDF8fHx8MTc3MjQyOTQ5NXww&ixlib=rb-4.1.0&q=80&w=1080",
  tokyo: "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMGFlcmlhbCUyMHZpZXclMjBzdW5zZXQlMjB3YXJtJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI0Mjc1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  milan: "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNaWxhbiUyMEdhbGxlcmlhJTIwZ29sZGVuJTIwbGlnaHQlMjBsdXh0cnklMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcyNDI3NTk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

const CITY_WEATHER: Record<string, { temp: number; rain: number; wind: number; condition: string }> = {
  paris: { temp: 9, rain: 30, wind: 12, condition: "Partly Cloudy" },
  rome: { temp: 16, rain: 15, wind: 8, condition: "Sunny" },
  barcelona: { temp: 20, rain: 10, wind: 14, condition: "Clear" },
  tokyo: { temp: 18, rain: 38, wind: 13, condition: "Partly Cloudy" },
  milan: { temp: 12, rain: 25, wind: 10, condition: "Overcast" },
};

const CITY_PALETTES: Record<string, string[]> = {
  paris: ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"],
  rome: ["#C2956B", "#E8C9A0", "#8B6E4E", "#F0E0C8"],
  barcelona: ["#E2A76F", "#5BA3C2", "#F5DEB3", "#4A7C59"],
  tokyo: ["#4A5568", "#8B7355", "#2D3748", "#D4C5B2"],
  milan: ["#1A1A2E", "#6B6E70", "#C4A882", "#E8DDD4"],
};

const CITY_ACTIVITIES: Record<string, string[]> = {
  paris: ["Cafe Culture", "Gallery Walk", "Bistro Dinner", "Seine Stroll", "Vintage Shopping"],
  rome: ["Colosseum Visit", "Trastevere Dining", "Vatican Morning", "Piazza Exploring", "Gelato Tour"],
  barcelona: ["Sagrada Familia", "Beach Morning", "El Born Markets", "Tapas Crawl", "Park Guell Sunset"],
  tokyo: ["Shibuya Crossing", "Temple Visits", "Ramen Crawl", "Harajuku Walk", "Tsukiji Market"],
  milan: ["Duomo Visit", "Fashion District", "Aperitivo Hour", "Canal Walk", "Gallery Tour"],
};

const DEFAULT_CITIES = [
  { city: "Paris", country: "France", fromDate: "2026-03-15", toDate: "2026-03-21" },
  { city: "Rome", country: "Italy", fromDate: "2026-03-22", toDate: "2026-03-26" },
  { city: "Barcelona", country: "Spain", fromDate: "2026-03-27", toDate: "2026-04-02" },
];

export function ProDashboard() {
  const navigate = useNavigate();
  const [activeCity, setActiveCity] = useState(0);
  const [expandedOutfit, setExpandedOutfit] = useState(0);
  const [regenUsed, setRegenUsed] = useState(false);
  const { isLoggedIn, setShowSignupPrompt } = useAuth();
  const { data: onboarding } = useOnboarding();

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowSignupPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, setShowSignupPrompt]);

  /* ── Build profile from onboarding ── */
  const profile = useMemo(() => buildProfile(onboarding), [onboarding]);

  /* ── Resolve cities: use onboarding cities if available, else defaults ── */
  const cities = useMemo(() => {
    if (onboarding.cities.length > 0) {
      return onboarding.cities.map((c) => ({
        city: c.city,
        country: c.country,
        fromDate: c.fromDate || "2026-03-15",
        toDate: c.toDate || "2026-03-21",
      }));
    }
    return DEFAULT_CITIES;
  }, [onboarding.cities]);

  /* ── Generate 4 outfits per city (Pro: max 5 cities × 4 = 20 looks) ── */
  const citySets = useMemo<CityOutfitSet[]>(() => {
    return cities.slice(0, 5).map((c) => {
      const key = c.city.toLowerCase();
      const outfits = generateCityOutfits(profile, c, 4);
      return {
        city: c.city,
        country: c.country,
        dates: `${new Date(c.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(c.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        heroImg: CITY_HEROES[key] || CITY_HEROES.paris,
        weather: CITY_WEATHER[key] || CITY_WEATHER.paris,
        outfits,
        colorPalette: CITY_PALETTES[key] || CITY_PALETTES.paris,
        activities: CITY_ACTIVITIES[key] || CITY_ACTIVITIES.paris,
      };
    });
  }, [cities, profile]);

  /* ── Consolidated packing from ALL city outfits ── */
  const allOutfits = useMemo(() => citySets.flatMap((cs) => cs.outfits), [citySets]);
  const packing: PackingItem[] = useMemo(() => derivePacking(allOutfits), [allOutfits]);
  const packedCount = packing.filter((p) => p.packed).length;
  const bodyFitLabel = allOutfits[0]?.bodyFitLabel || "";

  const currentSet = citySets[activeCity] || citySets[0];

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <SignupPrompt />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[18px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Dashboard", "My Capsules", "Shop", "Account"].map((item) => (
              <a key={item} href="#" className="text-[11px] tracking-[0.1em] uppercase text-[#57534e] hover:text-[#C4613A] transition-colors" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <PlanBadge label="Pro Plan" className="bg-[#C4613A]/10 text-[#C4613A]" />
            <SocialShareButton />
            <button className="h-[34px] px-4 border border-[#C4613A]/30 bg-[#C4613A]/5 text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/15 transition-colors cursor-pointer flex items-center gap-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              <Icon name="download" size={14} className="text-[#C4613A]" /> Hi-Res Export
            </button>
          </div>
        </div>
      </header>

      {/* Title + AI badge */}
      <div className="mx-auto px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Your Multi-City Style Guide
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: "var(--font-body)" }}>
          {cities.length} cities, one seamlessly curated capsule wardrobe. Every piece earns its place across your entire journey.
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={allOutfits[0]?.aiConfidence || 90} bodyFitLabel={bodyFitLabel} />
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
          {/* Left — city content */}
          <div className="lg:col-span-8 space-y-10">
            {/* City hero */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <ImageWithFallback src={currentSet.heroImg} alt={currentSet.city} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 flex gap-2">
                <TagChip label={`${currentSet.city}, ${currentSet.country}`} className="bg-white/20 text-white backdrop-blur-sm" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                  <Icon name="hd" size={12} className="text-white" /> Ultra Hi-Res
                </span>
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

            {/* Outfit cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  {currentSet.city} Outfits
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  {currentSet.outfits.length} Looks · {profile.gender === "male" ? "Menswear" : profile.gender === "non-binary" ? "Unisex" : "Womenswear"}
                </span>
              </div>

              <div className="space-y-6">
                {currentSet.outfits.map((outfit, idx) => (
                  <div key={outfit.id} className="bg-white rounded-2xl border border-[#ebdacc] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                    <button
                      onClick={() => setExpandedOutfit(expandedOutfit === idx ? -1 : idx)}
                      className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[#FDF8F3]/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-10 h-10 rounded-full bg-[#C4613A]/10 flex items-center justify-center text-[14px] text-[#C4613A]" style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{outfit.day}</span>
                        <div className="text-left">
                          <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{outfit.title}</span>
                          <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{outfit.subtitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{outfit.aiConfidence}% match</span>
                        <Icon name={expandedOutfit === idx ? "expand_less" : "expand_more"} size={24} className="text-[#57534e]" />
                      </div>
                    </button>

                    {expandedOutfit === idx && (
                      <div className="px-5 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
                            <ImageWithFallback src={outfit.image} alt={outfit.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                                <Icon name="auto_awesome" size={10} className="text-white" filled /> AI Generated
                              </span>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex gap-1.5">
                                {currentSet.colorPalette.map((color) => (
                                  <div key={color} className="w-6 h-6 rounded-full border-2 border-white/50" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>
                          </div>

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
                            <p className="mt-5 text-[14px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                              "{outfit.note}"
                            </p>
                            <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                              <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>Activities</span>
                              <div className="flex flex-wrap gap-2">
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
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[88px] space-y-6">

              {/* AI Profile */}
              <ProfileBadge
                gender={profile.gender}
                height={profile.height}
                weight={profile.weight}
                aesthetics={profile.aesthetics}
                photo={profile.photo}
                bodyFitLabel={bodyFitLabel}
              />

              {/* Multi-City Packing (auto-derived) */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Multi-City Packing</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    Auto-derived
                  </span>
                </div>
                <p className="text-[12px] text-[#57534e] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                  Consolidated from {allOutfits.length} outfits across {citySets.length} cities
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {packing.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                      <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                          <SizeChip size={item.recommendedSize} />
                        </div>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                          Used in {item.usageCount} look{item.usageCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                    {packing.length} unique items for {allOutfits.length} looks
                  </span>
                </div>
              </div>

              {/* Weather */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-5" style={{ fontFamily: "var(--font-display)" }}>Weather Forecast</h3>
                <div className="space-y-4">
                  {citySets.map((cs) => (
                    <div key={cs.city} className="py-3 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[14px] text-[#292524] block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{cs.city}</span>
                          <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{cs.dates} · {cs.weather.condition}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[12px]" style={{ fontFamily: "var(--font-mono)" }}>
                        <span className="flex items-center gap-1 text-[#292524]"><Icon name="thermostat" size={14} className="text-[#C4613A]" />{cs.weather.temp}°C</span>
                        <span className="flex items-center gap-1 text-[#57534e]"><Icon name="water_drop" size={14} />{cs.weather.rain}%</span>
                        <span className="flex items-center gap-1 text-[#57534e]"><Icon name="air" size={14} />{cs.weather.wind}km/h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: "var(--font-display)" }}>Capsule Stats</h3>
                <div className="space-y-3">
                  {[
                    { icon: "public", label: "Cities", value: `${citySets.length}` },
                    { icon: "style", label: "AI Outfits", value: `${allOutfits.length} looks` },
                    { icon: "checkroom", label: "Packing Items", value: `${packing.length} pieces` },
                    { icon: "hd", label: "Export Quality", value: "Ultra Hi-Res" },
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
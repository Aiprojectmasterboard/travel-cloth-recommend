import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  PlanBadge,
  SocialShareButton,
  ProfileBadge,
  AiGeneratedBadge,
  SizeChip,
  TagChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type PackingItem,
} from "../services/outfitGenerator";

/* ================================================================ */
/*  DEMO PRO PAGE — Busan, South Korea                              */
/*  Hardcoded demo showcasing Pro plan output.                      */
/*  No auth, no payment check, no API calls.                        */
/* ================================================================ */

/* ─── Busan hero image ─── */
const BUSAN_HERO =
  "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

/* ─── Hardcoded profile & city ─── */
const DEMO_PROFILE_DATA = {
  gender: "male",
  height: "180",
  weight: "75",
  aesthetics: ["Casual"],
  photo: "",
};

const DEMO_CITY = {
  city: "Busan",
  country: "South Korea",
  fromDate: "2026-08-10",
  toDate: "2026-08-15",
};

/* ─── Hardcoded weather ─── */
const DEMO_WEATHER = {
  temp: 28,
  rain: 40,
  wind: 14,
  condition: "Hot & Humid",
};

/* ─── Mood ─── */
const DEMO_MOOD = "Coastal Summer";

/* ─── Color palette for Busan coastal vibe ─── */
const DEMO_PALETTE = ["#1B6B93", "#E8DDD4", "#C4613A", "#F0E6D8"];

/* ─── Activities ─── */
const DEMO_ACTIVITIES = [
  "Haeundae Beach",
  "Gamcheon Village",
  "Jagalchi Market",
  "Taejongdae Park",
  "Temple Stay",
  "Street Food Tour",
];

export function DemoProPage() {
  const navigate = useNavigate();
  const [expandedOutfit, setExpandedOutfit] = useState(0);

  /* ─── Generate outfits & packing from outfitGenerator ─── */
  const profile = useMemo(() => buildProfile(DEMO_PROFILE_DATA), []);

  const outfits: GeneratedOutfit[] = useMemo(
    () => generateCityOutfits(profile, DEMO_CITY, 4),
    [profile],
  );

  const packing: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);

  const bodyFitLabel = outfits[0]?.bodyFitLabel || "";

  const dates = `${new Date(DEMO_CITY.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(DEMO_CITY.toDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Demo Banner */}
      <div className="bg-[#C4613A] text-white text-center py-2">
        <span
          className="text-[12px] uppercase tracking-[0.1em]"
          style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
        >
          Demo Preview — Busan, South Korea &middot; Pro Plan ($3.99)
        </span>
        <button
          onClick={() => navigate("/onboarding/1")}
          className="ml-4 inline-flex items-center gap-1 px-3 py-0.5 bg-white text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] cursor-pointer hover:bg-white/90 transition-colors"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
        >
          Get Started <span className="text-[13px]">&rarr;</span>
        </button>
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50"
        style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}
      >
        <div
          className="mx-auto flex items-center justify-between px-6 py-4"
          style={{ maxWidth: "var(--max-w)" }}
        >
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={22} className="text-[#C4613A]" />
            <span
              className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Travel Capsule AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block">
              <PlanBadge label="Demo \u2014 Pro Plan" className="bg-[#C4613A]/10 text-[#C4613A]" />
            </span>
            <SocialShareButton />
            <button
              onClick={() => window.print()}
              className="no-print h-[36px] px-2 sm:px-4 border border-[#C4613A]/30 bg-[#C4613A]/5 text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] hover:bg-[#C4613A]/15 transition-colors cursor-pointer flex items-center gap-2"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              <Icon name="download" size={14} className="text-[#C4613A]" />
              <span className="hidden sm:inline">Hi-Res Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            <Icon name="auto_awesome" size={10} className="text-[#C4613A]" filled /> Demo
          </span>
        </div>
        <h1
          className="text-[#292524] italic"
          style={{
            fontSize: "clamp(32px, 3.5vw, 48px)",
            fontFamily: "var(--font-display)",
            lineHeight: 1.1,
          }}
        >
          Busan &mdash; <em>{DEMO_MOOD}</em>
        </h1>
        <p
          className="mt-2 text-[15px] text-[#57534e] max-w-[600px]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          6 days in Busan, one seamlessly curated capsule wardrobe for the hot & humid Korean summer coast.
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={92} bodyFitLabel={bodyFitLabel} />
        </div>

        {/* Single city tab (active) */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            className="px-4 py-1.5 rounded-full text-[12px] uppercase tracking-[0.08em] transition-colors cursor-pointer border bg-[#C4613A] text-white border-[#C4613A]"
            style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
          >
            Busan &middot; {dates}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-6 pt-8 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-10">
            {/* City hero */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <ImageWithFallback
                src={BUSAN_HERO}
                alt="Busan, South Korea"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 flex gap-2">
                <TagChip
                  label="Busan, South Korea"
                  className="bg-white/20 text-white backdrop-blur-sm"
                />
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <span
                    className="text-[10px] uppercase tracking-[0.15em] text-white/70 block"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    {dates}
                  </span>
                  <span
                    className="text-[28px] text-white italic"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {outfits.length} AI Outfits
                  </span>
                </div>
                <span
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px]"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  {DEMO_MOOD}
                </span>
              </div>
            </div>

            {/* 2x2 outfit grid */}
            <div>
              <h2
                className="text-[28px] text-[#292524] mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your <em>Busan Capsule</em>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                {outfits.slice(0, 4).map((outfit, i) => (
                  <button
                    key={outfit.id}
                    onClick={() => setExpandedOutfit(i)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      expandedOutfit === i
                        ? "border-[#C4613A] ring-2 ring-[#C4613A]/30"
                        : "border-transparent hover:border-[#E8DDD4]"
                    }`}
                    style={{ aspectRatio: "4/5" }}
                  >
                    <img
                      src={outfit.image}
                      alt={outfit.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/90 text-white text-[9px] uppercase tracking-[0.1em]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        <Icon name="auto_awesome" size={10} className="text-white" filled /> AI
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span
                        className="text-white/70 text-[10px] uppercase tracking-[0.12em] block"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Day {outfit.day}
                      </span>
                      <span
                        className="text-white text-[16px] italic block leading-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {outfit.title.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Expanded outfit detail */}
              {expandedOutfit >= 0 && expandedOutfit < outfits.length && (
                <div
                  className="bg-white rounded-2xl border border-[#ebdacc] p-5"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}
                >
                  <div className="space-y-6">
                    <div
                      className="relative rounded-xl overflow-hidden w-full max-w-[400px]"
                      style={{ aspectRatio: "3/4" }}
                    >
                      <ImageWithFallback
                        src={outfits[expandedOutfit].image}
                        alt={outfits[expandedOutfit].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.1em]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          <Icon name="auto_awesome" size={10} className="text-white" filled /> AI
                          Generated
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex gap-1.5">
                          {DEMO_PALETTE.map((color) => (
                            <div
                              key={color}
                              className="w-6 h-6 rounded-full border-2 border-white/50"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3
                        className="text-[20px] text-[#292524] mb-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {outfits[expandedOutfit].title}
                      </h3>
                      <span
                        className="text-[12px] text-[#57534e] block mb-4"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {outfits[expandedOutfit].subtitle}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-4"
                        style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                      >
                        Outfit Breakdown &middot; Your Sizes
                      </span>
                      <div className="space-y-2">
                        {outfits[expandedOutfit].items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors"
                          >
                            <ImageWithFallback
                              src={item.img}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[14px] text-[#292524]"
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 500,
                                  }}
                                >
                                  {item.name}
                                </span>
                                <SizeChip size={item.recommendedSize} />
                              </div>
                              <span
                                className="text-[12px] text-[#57534e]"
                                style={{ fontFamily: "var(--font-body)" }}
                              >
                                {item.desc}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p
                        className="mt-5 text-[14px] text-[#57534e] italic leading-relaxed"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        &ldquo;{outfits[expandedOutfit].note}&rdquo;
                      </p>
                      <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                        <span
                          className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-2"
                          style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
                        >
                          Activities
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {DEMO_ACTIVITIES.map((a) => (
                            <span
                              key={a}
                              className="px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e]"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-[88px] space-y-6">
              {/* Profile Badge (with photo) */}
              <ProfileBadge
                gender={profile.gender}
                height={profile.height}
                weight={profile.weight}
                aesthetics={profile.aesthetics}
                photo={profile.photo}
                bodyFitLabel={bodyFitLabel}
              />

              {/* Mood Card */}
              <div
                className="bg-white rounded-xl p-6 border border-[#E8DDD4]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="palette" size={18} className="text-[#C4613A]" />
                  <h3
                    className="text-[18px] text-[#292524]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    City Mood
                  </h3>
                </div>
                <div className="px-4 py-3 bg-[#C4613A]/5 rounded-lg mb-3">
                  <span
                    className="text-[20px] text-[#C4613A] italic block"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    &ldquo;{DEMO_MOOD}&rdquo;
                  </span>
                  <span
                    className="text-[11px] text-[#57534e] mt-1 block"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Busan, South Korea &middot; August 2026
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {DEMO_PALETTE.map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-lg border border-[#E8DDD4]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Packing List */}
              <div
                className="bg-white rounded-xl p-6 border border-[#E8DDD4]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="text-[18px] text-[#292524]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Packing List
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full bg-[#EFE8DF] text-[#57534e] text-[9px] uppercase tracking-[0.1em]"
                    style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                  >
                    Auto-derived
                  </span>
                </div>
                <p
                  className="text-[12px] text-[#57534e] mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Consolidated from {outfits.length} outfits
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {packing.slice(0, 15).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors"
                    >
                      <ImageWithFallback
                        src={item.img}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[13px] text-[#292524] truncate"
                            style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                          >
                            {item.name}
                          </span>
                          <SizeChip size={item.recommendedSize} />
                        </div>
                        <span
                          className="text-[10px] text-[#57534e]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          Used in {item.usageCount} look{item.usageCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                  <span
                    className="text-[12px] text-[#57534e]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {packing.length} unique items for {outfits.length} looks
                  </span>
                </div>
              </div>

              {/* Weather */}
              <div
                className="bg-white rounded-xl p-6 border border-[#E8DDD4]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                <h3
                  className="text-[18px] text-[#292524] mb-5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Weather Forecast
                </h3>
                <div className="py-3">
                  <span
                    className="text-[14px] text-[#292524] block"
                    style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                  >
                    Busan
                  </span>
                  <span
                    className="text-[11px] text-[#57534e] block mb-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {dates} &middot; {DEMO_WEATHER.condition}
                  </span>
                  <div
                    className="flex items-center gap-4 text-[12px]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <span className="flex items-center gap-1 text-[#292524]">
                      <Icon name="thermostat" size={14} className="text-[#C4613A]" />
                      {DEMO_WEATHER.temp}&deg;C
                    </span>
                    <span className="flex items-center gap-1 text-[#57534e]">
                      <Icon name="water_drop" size={14} />
                      {DEMO_WEATHER.rain}%
                    </span>
                    <span className="flex items-center gap-1 text-[#57534e]">
                      <Icon name="air" size={14} />
                      {DEMO_WEATHER.wind}km/h
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] text-amber-700"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Humidity 75%
                    </span>
                    <span
                      className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[10px] text-blue-600"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Avg 28&deg;C
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div
                className="bg-white rounded-xl p-6 border border-[#E8DDD4]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}
              >
                <h3
                  className="text-[18px] text-[#292524] mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Capsule Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: "public", label: "City", value: "Busan" },
                    { icon: "calendar_month", label: "Duration", value: "6 days" },
                    { icon: "style", label: "AI Outfits", value: `${outfits.length} looks` },
                    {
                      icon: "checkroom",
                      label: "Packing Items",
                      value: `${packing.length} pieces`,
                    },
                    { icon: "hd", label: "Export Quality", value: "Ultra Hi-Res" },
                    { icon: "refresh", label: "Regenerations", value: "1 included" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name={stat.icon} size={16} className="text-[#C4613A]" />
                        <span
                          className="text-[13px] text-[#57534e]"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {stat.label}
                        </span>
                      </div>
                      <span
                        className="text-[13px] text-[#292524]"
                        style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                      >
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-[#C4613A] rounded-xl p-6 text-white">
                <h3
                  className="text-[18px] text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Start Your Own Capsule
                </h3>
                <p
                  className="text-[13px] text-white/80 mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Create your personalized style guide with AI-generated outfits tailored to your
                  body, style preferences, and travel itinerary.
                </p>
                <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>
                  <span className="flex items-center gap-2 text-[#C4613A]">
                    Start Planning
                    <Icon name="arrow_forward" size={16} className="text-[#C4613A]" />
                  </span>
                </BtnPrimary>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className="no-print border-t border-[#E8DDD4] bg-white">
        <div
          className="mx-auto flex items-center justify-between px-6 py-5"
          style={{ maxWidth: "var(--max-w)" }}
        >
          <div>
            <span
              className="text-[14px] text-[#292524] block"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to pack for your trip?
            </span>
            <span
              className="text-[12px] text-[#57534e]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Get your own AI-curated capsule wardrobe for free
            </span>
          </div>
          <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>
            <span className="flex items-center gap-2 text-[#C4613A]">
              Start Your Own Capsule
              <Icon name="arrow_forward" size={16} className="text-[#C4613A]" />
            </span>
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

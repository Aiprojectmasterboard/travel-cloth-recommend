import React, { useState, useMemo, useEffect } from "react";
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
import {
  buildProfile,
  generateCityOutfits,
  derivePacking,
  type GeneratedOutfit,
  type PackingItem,
} from "../services/outfitGenerator";

/* ─── Static images ─── */
const IMG = {
  tokyoMap: "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMGFlcmlhbCUyMHZpZXclMjBzdW5zZXQlMjB3YXJtJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI0Mjc1OTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  milan: "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNaWxhbiUyMEdhbGxlcmlhJTIwZ29sZGVuJTIwbGlnaHQlMjBsdXh0cnklMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcyNDI3NTk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  seoul: "https://images.unsplash.com/photo-1670735411734-c9725326de3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW91bCUyMEJ1a2Nob24lMjBoYW5vayUyMHZpbGxhZ2UlMjB3YXJtJTIwYXV0dW1ufGVufDF8fHx8MTc3MjQyNzU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
  tuscany: "https://images.unsplash.com/photo-1655925244593-b648805087d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUdXNjYW55JTIwcm9sbGluZyUyMGhpbGxzJTIwZ29sZGVuJTIwaG91ciUyMHZpbmV5YXJkJTIwZHJlYW15fGVufDF8fHx8MTc3MjQyNzU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
};

const PAST_TRIPS = [
  { name: "Milan Fashion Week", date: "Sep 2025", mood: "Avant-Garde", img: IMG.milan, items: 14, outfits: 8, rating: 4.9 },
  { name: "Seoul Exploration", date: "Jul 2025", mood: "Urban Minimal", img: IMG.seoul, items: 10, outfits: 6, rating: 4.7 },
  { name: "Tuscany Rest", date: "May 2025", mood: "Rustic Elegance", img: IMG.tuscany, items: 8, outfits: 5, rating: 4.8 },
];

/* ─── Helpers ─── */
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
  const { purchasedPlan } = useAuth();

  // Payment gate — redirect to /preview if not purchased
  useEffect(() => {
    if (!purchasedPlan) {
      navigate("/preview", { replace: true });
    }
  }, [purchasedPlan, navigate]);

  /* ── Build profile & generate outfits ── */
  const profile = useMemo(() => buildProfile(onboarding), [onboarding]);

  const primaryCity = onboarding.cities[0];
  const cityName = primaryCity?.city || "Tokyo";
  const countryName = primaryCity?.country || "Japan";

  const cityInput = useMemo(() => ({
    city: cityName,
    country: countryName,
    fromDate: primaryCity?.fromDate || "2026-10-10",
    toDate: primaryCity?.toDate || "2026-10-31",
  }), [cityName, countryName, primaryCity]);

  /** Annual: 4 outfits per city */
  const outfits: GeneratedOutfit[] = useMemo(
    () => generateCityOutfits(profile, cityInput, 4),
    [profile, cityInput],
  );

  const packing: PackingItem[] = useMemo(() => derivePacking(outfits), [outfits]);
  const bodyFitLabel = outfits[0]?.bodyFitLabel || "";

  /* ── Style DNA computed from user aesthetics ── */
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

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[18px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Dashboard", "My Trips", "Style DNA", "Account"].map((item) => (
              <a key={item} href="#" className="text-[11px] tracking-[0.1em] uppercase text-[#57534e] hover:text-[#C4613A] transition-colors" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <AnnualBadge />
            <SocialShareButton />
            <button onClick={() => navigate("/onboarding/1")} className="inline-flex items-center justify-center whitespace-nowrap h-[34px] px-5 bg-[#1A1410] text-white text-[11px] uppercase tracking-[0.08em] rounded-none hover:bg-[#C4613A] transition-all cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
              Plan Your Next Trip
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#EFE8DF] transition-colors cursor-pointer">
              <Icon name="notifications" size={18} className="text-[#57534e]" />
            </button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="mx-auto px-6 pt-10 pb-4" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="bolt" size={10} className="text-green-600" /> Priority AI
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/8 text-[#D4AF37] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="support_agent" size={10} /> VIP Concierge
          </span>
        </div>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Welcome Back, Alex
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Your annual membership is active. Ready for your next adventure?
        </p>
        <div className="mt-3">
          <AiGeneratedBadge confidence={outfits[0]?.aiConfidence || 92} bodyFitLabel={bodyFitLabel} />
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
            {/* Map / Hero */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <ImageWithFallback src={IMG.tokyoMap} alt={`${cityName} map`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 flex gap-2">
                <div className="px-3 py-1 bg-white/90 rounded-full flex items-center gap-1.5" style={{ backdropFilter: "blur(8px)" }}>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>Current Itinerary</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                  <Icon name="hd" size={12} className="text-white" /> Ultra Hi-Res
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div>
                  <span className="text-white text-[28px] italic block" style={{ fontFamily: "var(--font-display)" }}>{cityName}, {countryName}</span>
                  <span className="text-white/80 text-[14px] block" style={{ fontFamily: "var(--font-body)" }}>Oct 10 – 31, 2026 · 21 days</span>
                </div>
                <button className="h-[36px] px-4 bg-white/20 backdrop-blur-sm text-white rounded-none text-[12px] uppercase tracking-[0.08em] hover:bg-white/30 transition-colors cursor-pointer border border-white/30" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  Regenerate Itinerary
                </button>
              </div>
            </div>

            {/* AI Outfits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  Your <em>{cityName} Capsule</em>
                </h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {outfits.length} Outfit Looks
                </span>
              </div>
              <p className="text-[16px] text-[#57534e] mb-6" style={{ fontFamily: "var(--font-body)" }}>
                AI-generated outfits based on your profile, {cityName}'s autumn weather, and your {primaryStyle.toLowerCase()} aesthetic preference.
              </p>

              {/* Outfit day cards */}
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {outfits.map((outfit, i) => (
                  <button key={outfit.id} onClick={() => setActiveDayIdx(i)}
                    className={`flex-shrink-0 w-[200px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeDayIdx === i ? "border-[#C4613A] ring-1 ring-[#C4613A]/30" : "border-transparent hover:border-[#E8DDD4]"}`}>
                    <div className="relative h-[240px]">
                      <ImageWithFallback src={outfit.image} alt={outfit.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[8px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                          <Icon name="auto_awesome" size={8} className="text-white" filled /> AI
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white/70 text-[10px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>Day {outfit.day}</span>
                        <span className="text-white text-[18px] italic block" style={{ fontFamily: "var(--font-display)" }}>{outfit.title.split(" ")[0]}</span>
                        <span className="text-white/60 text-[11px] block mt-0.5" style={{ fontFamily: "var(--font-body)" }}>{outfit.subtitle}</span>
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
                  <div className="flex-1">
                    <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>
                      {outfits[activeDayIdx].title}: {outfits[activeDayIdx].subtitle}
                    </span>
                    <AiGeneratedBadge confidence={outfits[activeDayIdx].aiConfidence} bodyFitLabel={bodyFitLabel} />
                  </div>
                </div>

                {/* Items with sizes */}
                <div className="space-y-2 mt-4">
                  {outfits[activeDayIdx].items.map((item) => (
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

                <p className="mt-4 text-[13px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                  "{outfits[activeDayIdx].note}"
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <BtnPrimary size="sm">View Full Itinerary</BtnPrimary>
                <BtnSecondary size="sm">
                  <span className="flex items-center gap-2"><Icon name="shopping_bag" size={16} className="text-[#C4613A]" /> Shop Missing Items ({packing.filter(p => !p.packed).length})</span>
                </BtnSecondary>
                <BtnSecondary size="sm">
                  <span className="flex items-center gap-2"><Icon name="download" size={16} className="text-[#C4613A]" /> Hi-Res Export</span>
                </BtnSecondary>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Profile */}
            <ProfileBadge
              gender={profile.gender}
              height={profile.height}
              weight={profile.weight}
              aesthetics={profile.aesthetics}
              photo={profile.photo}
              bodyFitLabel={bodyFitLabel}
            />

            {/* Weather */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>{cityName} Weather</h3>
                <TagChip label="Oct 10–31" />
              </div>
              <WeatherWidget temp={18} rain={38} wind={13} heatIndex={16} />
            </div>

            {/* Packing List (auto-derived) */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Packing List</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  Auto-derived
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                From {outfits.length} AI outfits · {packing.length} unique items
              </p>
              <div className="space-y-2">
                {packing.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                    <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                        <SizeChip size={item.recommendedSize} />
                      </div>
                      <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                        {item.usageCount > 1 ? `x${item.usageCount} looks` : "1 look"} · {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Style DNA — computed from user aesthetics */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-2" style={{ fontFamily: "var(--font-display)" }}>Style DNA</h3>
              <p className="text-[14px] text-[#57534e] mb-5" style={{ fontFamily: "var(--font-body)" }}>
                Your AI-analyzed fashion profile based on your preferences and past trips.
              </p>
              <div className="flex items-center gap-5 mb-6">
                <DonutChart percent={primaryPercent} />
                <div>
                  <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{primaryStyle}</span>
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>Primary aesthetic</span>
                </div>
              </div>
              <div className="space-y-4">
                {styleDNA.slice(0, 4).map((s) => (
                  <BarStat key={s.label} label={s.label} percent={s.percent} />
                ))}
              </div>
            </div>

            {/* VIP Concierge */}
            <div className="gold-gradient rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="support_agent" size={20} className="text-white" />
                <h3 className="text-[18px] text-white" style={{ fontFamily: "var(--font-display)" }}>VIP Concierge</h3>
              </div>
              <p className="text-[13px] text-white/80 mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Your dedicated style concierge is available for personalized recommendations, last-minute trip changes, and exclusive shopping assistance.
              </p>
              <button className="w-full h-[40px] bg-white text-[#D4AF37] text-[12px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                Contact Concierge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Past Trips */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Past Trips</h2>
          <button className="text-[12px] uppercase tracking-[0.08em] text-[#C4613A] hover:text-[#A84A25] transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>View All Archive</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAST_TRIPS.map((trip) => (
            <div key={trip.name} className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] hover:border-[#C4613A]/20 transition-all cursor-pointer group" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div className="relative h-[200px] overflow-hidden">
                <ImageWithFallback src={trip.img} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px]" style={{ fontFamily: "var(--font-mono)" }}>{trip.rating} ★</span>
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
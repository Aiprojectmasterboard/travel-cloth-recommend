import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  BtnSecondary,
  AnnualBadge,
  TagChip,
  WeatherWidget,
  TripUsageBar,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/* ═══════════════════════════════════════════════════════════ */
/*  EXAMPLE ANNUAL PAGE                                        */
/*  Showcases what a 185cm / 75kg male would receive           */
/*  as an Annual member ($29/yr). Standalone page.            */
/* ═══════════════════════════════════════════════════════════ */

/* ─── Static images ─── */
const IMG = {
  parisHero:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMEVpZmZlbCUyMFRvd2VyJTIwc3VucmlzZSUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzcyNDQ4NjYyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  barcelona:
    "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYXJjZWxvbmElMjBHb3RoaWMlMjBRdWFydGVyJTIwc3RyZWV0JTIwc3VubHl8ZW58MXx8fHwxNzcyNDI3NTk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  rome:
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSb21lJTIwQ29sb3NzZXVtJTIwZ29sZGVuJTIwaG91ciUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzI0Mjc1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  london:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMb25kb24lMjBUb3dlciUyMEJyaWRnZSUyMGNsb3VkeXxlbnwxfHx8fDE3NzI0Mjc1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  amsterdam:
    "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBbXN0ZXJkYW0lMjBjYW5hbCUyMHNwcmluZyUyMGNvbG9yZnVsJTIwaG91c2VzfGVufDF8fHx8MTc3MjQyNzU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ─── Item images ─── */
const ITEMS = {
  denimJacket:
    "https://images.unsplash.com/photo-1544441893-675973e31985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBkZW5pbSUyMGphY2tldCUyMGJsdWUlMjBmYXNoaW9uJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzI0Mjc1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  chinos:
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBjaGlubyUyMHRyb3VzZXJzJTIwYmVpZ2UlMjBmYXNoaW9uJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzI0Mjk0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  tshirt:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjB3aGl0ZSUyMHQtc2hpcnQlMjBjbGVhbiUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3MjQyOTQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  linen:
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBsaW5lbiUyMHNoaXJ0JTIwc3VtbWVyJTIwbGlnaHQlMjBibHVlJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0Mjk0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  denim:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBqZWFucyUyMGRhcmslMjBibHVlJTIwZm9sZGVkJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0Mjk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  chino2:
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBjaGlubyUyMHBhbnRzJTIwb2xpdmUlMjBncmVlbiUyMGZhc2hpb24lMjBwcm9kdWN0fGVufDF8fHx8MTc3MjQyNjYxMXww&ixlib=rb-4.1.0&q=80&w=1080",
  sneakers:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBzbmVha2VycyUyMHdoaXRlJTIwY2xlYW4lMjBtaW5pbWFsJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0Mjk0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  loafers:
    "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBsb2FmZXJzJTIwYnJvd24lMjBsZWF0aGVyJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  bag:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBiYWNrcGFjayUyMGNhbnZhcyUyMHRyYXZlbCUyMHN0aWxsJTIwbGlmZXxlbnwxfHx8fDE3NzI0Mjc2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  watch:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjB3YXRjaCUyMGNsYXNzaWMlMjBsZWF0aGVyJTIwc3RyYXAlMjBtaW5pbWFsfGVufDF8fHx8MTc3MjQyOTUwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ─── Outfit images — unique AI-generated asset per outfit ─── */
const ANNUAL_OUTFIT_IMGS = [
  "/examples/annual-outfit-1.png",
  "/examples/annual-outfit-2.png",
  "/examples/annual-outfit-3.png",
  "/examples/annual-outfit-4.png",
];

/* ─── Persona: 185cm / 75kg male → BMI 21.9 (regular build) → L, EU 43 ─── */

interface ExItem {
  id: string;
  name: string;
  desc: string;
  img: string;
  size: string;
}

interface ExOutfit {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  image: string;
  items: ExItem[];
  note: string;
  confidence: number;
}

const TOKYO_OUTFITS: ExOutfit[] = [
  {
    id: "ea-paris-1",
    day: 1,
    title: "Eiffel Tower & Café Walk",
    subtitle: "Casual Chic",
    image: ANNUAL_OUTFIT_IMGS[0],
    confidence: 95,
    note: "Paris in March calls for effortless layering. A classic denim jacket over a clean white t-shirt pairs with slim chinos and white sneakers — comfortable enough for long walks along the Seine, stylish enough for any café terrace.",
    items: [
      { id: "ep1-1", name: "Denim Jacket", desc: "Classic blue, relaxed fit", img: ITEMS.denimJacket, size: "L" },
      { id: "ep1-2", name: "White Crew T-Shirt", desc: "100% cotton, clean cut", img: ITEMS.tshirt, size: "L" },
      { id: "ep1-3", name: "Slim Beige Chinos", desc: "Stretch cotton, tapered", img: ITEMS.chinos, size: "L" },
      { id: "ep1-4", name: "White Leather Sneakers", desc: "Low-top, minimal", img: ITEMS.sneakers, size: "EU 43" },
    ],
  },
  {
    id: "ea-paris-2",
    day: 2,
    title: "Le Marais Exploration",
    subtitle: "Smart Casual",
    image: ANNUAL_OUTFIT_IMGS[1],
    confidence: 93,
    note: "Le Marais blends galleries, boutiques and bistros seamlessly. A light linen shirt with dark denim and brown loafers strikes the ideal balance between relaxed and polished for a full day of neighbourhood discovery.",
    items: [
      { id: "ep2-1", name: "Sage Green Linen Shirt", desc: "Relaxed fit, rolled sleeves", img: ITEMS.linen, size: "L" },
      { id: "ep2-2", name: "Dark Slim Denim", desc: "Indigo wash, tapered leg", img: ITEMS.denim, size: "L" },
      { id: "ep2-3", name: "Brown Leather Loafers", desc: "Penny loafer, leather sole", img: ITEMS.loafers, size: "EU 43" },
      { id: "ep2-4", name: "Canvas Tote Bag", desc: "Natural fabric, shoulder carry", img: ITEMS.bag, size: "One Size" },
    ],
  },
  {
    id: "ea-rome-3",
    day: 3,
    title: "Colosseum & Forum Visit",
    subtitle: "Mediterranean Casual",
    image: ANNUAL_OUTFIT_IMGS[2],
    confidence: 94,
    note: "Rome rewards those who dress with intention. Olive chinos and a white t-shirt keep you cool as temperatures climb toward the afternoon. Swap sneakers for loafers when heading to dinner in Trastevere.",
    items: [
      { id: "er3-1", name: "White Linen Polo", desc: "Relaxed collar, breathable", img: ITEMS.tshirt, size: "L" },
      { id: "er3-2", name: "Olive Casual Chinos", desc: "Lightweight, slim fit", img: ITEMS.chino2, size: "L" },
      { id: "er3-3", name: "Brown Leather Sandals", desc: "Woven straps, cushioned", img: ITEMS.loafers, size: "EU 43" },
      { id: "er3-4", name: "Aviator Sunglasses", desc: "Gold frame, brown lens", img: ITEMS.watch, size: "One Size" },
    ],
  },
  {
    id: "ea-barcelona-4",
    day: 4,
    title: "Gothic Quarter & Beach",
    subtitle: "Coastal Casual",
    image: ANNUAL_OUTFIT_IMGS[3],
    confidence: 92,
    note: "Barcelona demands versatility — morning in the Gothic Quarter, afternoon on Barceloneta beach. Light linen and denim keep things breezy while the canvas bag handles beach essentials. Roll the chinos for the sand.",
    items: [
      { id: "eb4-1", name: "Navy Bomber Jacket", desc: "Zip-up, ribbed collar", img: ITEMS.denimJacket, size: "L" },
      { id: "eb4-2", name: "Grey Henley T-Shirt", desc: "Button placket, soft cotton", img: ITEMS.tshirt, size: "L" },
      { id: "eb4-3", name: "Dark Wash Slim Jeans", desc: "Slim straight, deep indigo", img: ITEMS.denim, size: "L" },
      { id: "eb4-4", name: "White Minimal Sneakers", desc: "Leather, low-top", img: ITEMS.sneakers, size: "EU 43" },
    ],
  },
];

/* ─── Packing list (derived from multi-city outfits) ─── */
interface PackEntry {
  name: string;
  img: string;
  size: string;
  category: string;
  usageCount: number;
}

function derivePacking(outfits: ExOutfit[]): PackEntry[] {
  const map = new Map<string, PackEntry>();
  outfits.forEach((o) => {
    o.items.forEach((item) => {
      const existing = map.get(item.name);
      if (existing) {
        existing.usageCount++;
      } else {
        map.set(item.name, {
          name: item.name,
          img: item.img,
          size: item.size,
          category: "item",
          usageCount: 1,
        });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
}

const PACKING = derivePacking(TOKYO_OUTFITS);

/* ─── Past Trips (for Annual member showcase) ─── */
const PAST_TRIPS = [
  { name: "Barcelona Summer Escape", date: "Aug 2025", mood: "Coastal Casual", img: IMG.barcelona, items: 11, outfits: 6, rating: 4.8 },
  { name: "London City Break", date: "Jun 2025", mood: "Urban Smart", img: IMG.london, items: 9, outfits: 5, rating: 4.7 },
  { name: "Amsterdam Weekend", date: "Apr 2025", mood: "Relaxed Modern", img: IMG.amsterdam, items: 8, outfits: 4, rating: 4.6 },
];

/* ─── Style DNA (hardcoded for showcase) ─── */
const STYLE_DNA = [
  { label: "Casual", percent: 95 },
  { label: "Classic", percent: 60 },
  { label: "Minimalist", percent: 48 },
  { label: "Streetwear", percent: 42 },
  { label: "Sporty", percent: 35 },
  { label: "Business", percent: 18 },
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

export function ExampleAnnualPage() {
  const navigate = useNavigate();
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Banner */}
      <div className="gold-gradient text-white text-center py-2">
        <span className="text-[12px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
          Example Preview — This is what you receive with the Annual Plan ($29/yr)
        </span>
        <button onClick={() => navigate("/onboarding/1")} className="ml-4 inline-flex items-center gap-1 px-3 py-0.5 bg-white text-[#D4AF37] rounded-full text-[11px] uppercase tracking-[0.08em] cursor-pointer hover:bg-white/90 transition-colors" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
          Get Started <span className="text-[13px]">&rarr;</span>
        </button>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Dashboard", "My Trips", "Style DNA", "Account"].map((item) => (
              <span key={item} className="text-[11px] tracking-[0.1em] uppercase text-[#57534e]/50 cursor-default" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item}</span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <AnnualBadge />
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e]/60 hidden sm:inline" style={{ fontFamily: "var(--font-mono)" }}>
              Example Mode
            </span>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            <Icon name="auto_awesome" size={12} className="text-[#C4613A]" filled />
            94% AI Confidence · Tailored for Male · 185cm · regular build
          </span>
        </div>
        <div className="mt-5 max-w-[400px]">
          <TripUsageBar used={3} total={12} renewMonth="Jan 2027" />
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto px-6 pt-6 pb-8" style={{ maxWidth: "var(--max-w)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            {/* 2x2 AI Outfit Grid Hero */}
            <div className="rounded-2xl overflow-hidden bg-[#1A1410]">
              <div className="relative">
                <div className="grid grid-cols-2 gap-1">
                  {TOKYO_OUTFITS.map((outfit) => (
                    <div key={outfit.id} className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                      <ImageWithFallback src={outfit.image} alt={outfit.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-white/60 text-[9px] uppercase tracking-[0.12em] block" style={{ fontFamily: "var(--font-mono)" }}>Day {outfit.day}</span>
                        <span className="text-white text-[13px] sm:text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{outfit.subtitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                    <Icon name="auto_awesome" size={10} className="text-white" filled /> AI Generated
                  </span>
                  <div className="px-3 py-1 bg-white/90 rounded-full flex items-center gap-1.5" style={{ backdropFilter: "blur(8px)" }}>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[#C4613A]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>Current Itinerary</span>
                  </div>
                </div>
              </div>
              {/* Route info — separated below the grid to prevent overlap */}
              <div className="px-4 py-3 bg-[#1A1410]">
                <span className="text-white text-[22px] sm:text-[26px] italic block" style={{ fontFamily: "var(--font-display)" }}>Paris → Rome → Barcelona</span>
                <span className="text-white/70 text-[13px] block mt-0.5" style={{ fontFamily: "var(--font-body)" }}>Mar 15 – Apr 2, 2026 · 19 days · 4 Looks</span>
              </div>
            </div>

            {/* AI Outfits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  Your <em>European Journey</em>
                </h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {TOKYO_OUTFITS.length} Outfit Looks
                </span>
              </div>
              <p className="text-[16px] text-[#57534e] mb-6" style={{ fontFamily: "var(--font-body)" }}>
                AI-generated outfits based on your profile, Paris/Rome/Barcelona spring weather, and your casual aesthetic preference.
              </p>

              {/* Outfit day cards */}
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {TOKYO_OUTFITS.map((outfit, i) => (
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
                    {TOKYO_OUTFITS[activeDayIdx].day}
                  </span>
                  <div className="flex-1">
                    <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>
                      {TOKYO_OUTFITS[activeDayIdx].title}: {TOKYO_OUTFITS[activeDayIdx].subtitle}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] mt-1" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {TOKYO_OUTFITS[activeDayIdx].confidence}% match
                    </span>
                  </div>
                </div>

                {/* Items with sizes */}
                <div className="space-y-2 mt-4">
                  {TOKYO_OUTFITS[activeDayIdx].items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                      <ImageWithFallback src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-[#292524]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                          <SizeChip size={item.size} />
                        </div>
                        <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[13px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                  "{TOKYO_OUTFITS[activeDayIdx].note}"
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>Get Your Own Capsule</BtnPrimary>
                <BtnSecondary size="sm">
                  <span className="flex items-center gap-2"><Icon name="download" size={16} className="text-[#C4613A]" /> Hi-Res Export</span>
                </BtnSecondary>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
                  <Icon name="person" size={24} className="text-[#C4613A]" />
                </div>
                <div>
                  <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>Alex (Example)</span>
                  <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Male · 185cm · 75kg</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Casual"].map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Paris Weather</h3>
                <TagChip label="Mar 15–21" />
              </div>
              <WeatherWidget temp={11} rain={35} wind={15} heatIndex={9} />
            </div>

            {/* Packing List */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Packing List</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  Auto-derived
                </span>
              </div>
              <p className="text-[11px] text-[#57534e] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                From {TOKYO_OUTFITS.length} AI outfits · {PACKING.length} unique items
              </p>
              <div className="space-y-2">
                {PACKING.map((item, i) => (
                  <div key={`${item.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                    <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                        <SizeChip size={item.size} />
                      </div>
                      <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                        {item.usageCount > 1 ? `x${item.usageCount} looks` : "1 look"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Style DNA */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <h3 className="text-[18px] text-[#292524] mb-2" style={{ fontFamily: "var(--font-display)" }}>Style DNA</h3>
              <p className="text-[14px] text-[#57534e] mb-5" style={{ fontFamily: "var(--font-body)" }}>
                Your AI-analyzed fashion profile based on your preferences and past trips.
              </p>
              <div className="flex items-center gap-5 mb-6">
                <DonutChart percent={STYLE_DNA[0].percent} />
                <div>
                  <span className="text-[18px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>{STYLE_DNA[0].label}</span>
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>Primary aesthetic</span>
                </div>
              </div>
              <div className="space-y-4">
                {STYLE_DNA.slice(0, 4).map((s) => (
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
              <button onClick={() => navigate("/onboarding/1")} className="w-full h-[40px] bg-white text-[#D4AF37] text-[12px] uppercase tracking-[0.08em] rounded-none hover:bg-white/90 transition-colors cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                Start Your Annual Membership
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Past Trips */}
      <div className="mx-auto px-6 pb-16" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Past Trips</h2>
          <span className="text-[12px] uppercase tracking-[0.08em] text-[#57534e]/50" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>View All Archive</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAST_TRIPS.map((trip) => (
            <div key={trip.name} className="bg-white rounded-2xl overflow-hidden border border-[#E8DDD4] group" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
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

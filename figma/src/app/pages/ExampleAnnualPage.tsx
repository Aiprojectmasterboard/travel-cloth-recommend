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
/*  Showcases what a 170cm / 50kg female supermodel would      */
/*  receive as an Annual member ($29/yr). Standalone page.     */
/* ═══════════════════════════════════════════════════════════ */

/* ─── Static images ─── */
const IMG = {
  tokyoHero:
    "https://images.unsplash.com/photo-1717084023989-20a9eef69fc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMFNoaWJ1eWElMjBhZXJpYWwlMjBzdW5zZXQlMjBza3lsaW5lJTIwd2FybXxlbnwxfHx8fDE3NzI0NDg2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  milan:
    "https://images.unsplash.com/photo-1771535641653-686927c8cda8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNaWxhbiUyMEdhbGxlcmlhJTIwZ29sZGVuJTIwbGlnaHQlMjBsdXh0cnklMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcyNDI3NTk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  seoul:
    "https://images.unsplash.com/photo-1670735411734-c9725326de3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW91bCUyMEJ1a2Nob24lMjBoYW5vayUyMHZpbGxhZ2UlMjB3YXJtJTIwYXV0dW1ufGVufDF8fHx8MTc3MjQyNzU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
  tuscany:
    "https://images.unsplash.com/photo-1655925244593-b648805087d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUdXNjYW55JTIwcm9sbGluZyUyMGhpbGxzJTIwZ29sZGVuJTIwaG91ciUyMHZpbmV5YXJkJTIwZHJlYW15fGVufDF8fHx8MTc3MjQyNzU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ─── Item images ─── */
const ITEMS = {
  trench:
    "https://images.unsplash.com/photo-1621912911625-c3b08f187953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBoYW5naW5nJTIwbWluaW1hbGlzdCUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NzI0Mjc1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  blazer:
    "https://images.unsplash.com/photo-1770294758942-7ce9ca052986?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW5lbiUyMGJsYXplciUyMGJlaWdlJTIwc3VtbWVyJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI5NDk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  cashmere:
    "https://images.unsplash.com/photo-1642761589121-ec47d4c425ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb2xkZWQlMjBjYXNobWVyZSUyMHN3ZWF0ZXIlMjBjcmVhbSUyMG5ldXRyYWwlMjBtaW5pbWFsJTIwZmxhdGxheXxlbnwxfHx8fDE3NzI0Mjk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  silkBlouse:
    "https://images.unsplash.com/photo-1606603049788-24284ce70986?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWxrJTIwYmxvdXNlJTIwY3JlYW0lMjBpdm9yeSUyMGhhbmdlciUyMGVsZWdhbnR8ZW58MXx8fHwxNzcyNDI5NDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  trousers:
    "https://images.unsplash.com/photo-1738520420640-5818ce094b4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWlsb3JlZCUyMHdvb2wlMjB0cm91c2VycyUyMGdyZXklMjBmYXNoaW9uJTIwZWRpdG9yaWFsJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzI0Mjk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  denim:
    "https://images.unsplash.com/photo-1768851511869-b26ab0bbb5fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwZGVuaW0lMjBqZWFucyUyMGZvbGRlZCUyMGZhc2hpb258ZW58MXx8fHwxNzcyNDI2NjExfDA&ixlib=rb-4.1.0&q=80&w=1080",
  boots:
    "https://images.unsplash.com/photo-1737877398292-8762dd7b0907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYW5rbGUlMjBib290cyUyMGJyb3duJTIwZmFzaGlvbiUyMHByb2R1Y3QlMjBzdGlsbCUyMGxpZmV8ZW58MXx8fHwxNzcyNDI5NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  sneakers:
    "https://images.unsplash.com/photo-1663151860122-4890a08dc22b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwY2xlYW4lMjBtaW5pbWFsJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI5NTAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  loafers:
    "https://images.unsplash.com/photo-1771965056079-92b0ce6d4601?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwbG9hZmVycyUyMHdhcm0lMjB3b29kJTIwZmxvb3IlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  bag: "https://images.unsplash.com/photo-1574274560399-d242e212c916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWRkbGUlMjBsZWF0aGVyJTIwYmFnJTIwc3RpbGwlMjBsaWZlJTIwd2FybSUyMHRvbmV8ZW58MXx8fHwxNzcyNDI3NjAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  scarf:
    "https://images.unsplash.com/photo-1638256049278-0899dbe29aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXNobWVyZSUyMHNjYXJmJTIwZm9sZGVkJTIwd2FybSUyMG5ldXRyYWwlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  earrings:
    "https://images.unsplash.com/photo-1704637397679-f37e5e0dc429?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwaG9vcCUyMGVhcnJpbmdzJTIwamV3ZWxyeSUyMG1pbmltYWwlMjBlbGVnYW50fGVufDF8fHx8MTc3MjQyOTQ4OXww&ixlib=rb-4.1.0&q=80&w=1080",
  watch:
    "https://images.unsplash.com/photo-1758887953059-ca6f8e454207?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRjaCUyMG1pbmltYWwlMjBsZWF0aGVyJTIwc3RyYXAlMjB3cmlzdCUyMGZhc2hpb24lMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzcyNDI5NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ─── Outfit images (3:4 ratio, full body) ─── */
const OUTFIT_IMGS = [
  "https://images.unsplash.com/photo-1717167172685-374de9c948dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRva3lvJTIwaGFyYWp1a3UlMjBmYXNoaW9uJTIwbWluaW1hbGlzdCUyMG5ldXRyYWwlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1635431544454-21f9980954bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGtpbW9ubyUyMGluc3BpcmVkJTIwb3V0Zml0JTIwbW9kZXJuJTIwdG9reW8lMjBzdHJlZXR8ZW58MXx8fHwxNzcyNDQ4NjU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1738773733452-b02b079a77af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdvb2wlMjBjb2F0JTIwd2ludGVyJTIwZWxlZ2FudCUyMHNjYXJmJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0NDg2NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1734314019865-6c1486b9c5f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRhaWxvcmVkJTIwc3VpdCUyMHNtYXJ0JTIwY2FzdWFsJTIwc29waGlzdGljYXRlZHxlbnwxfHx8fDE3NzI0NDg2NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

/* ─── Persona: 170cm / 50kg female → XS, EU 39 ─── */

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
    id: "ea-tokyo-1",
    day: 1,
    title: "Shibuya Arrival",
    subtitle: "Jet-Set Minimal",
    image: OUTFIT_IMGS[0],
    confidence: 95,
    note: "Clean lines and neutral tones navigate Tokyo's neon-lit streets. The structured overcoat layers effortlessly over a merino crew, with white sneakers for all-day comfort through Shibuya's bustling crossings.",
    items: [
      { id: "eat1-1", name: "Structured Wool Overcoat", desc: "Black, mid-length, tailored", img: ITEMS.trench, size: "XS" },
      { id: "eat1-2", name: "Merino Crew Knit", desc: "Charcoal, fine gauge", img: ITEMS.cashmere, size: "XS" },
      { id: "eat1-3", name: "Slim Tailored Trousers", desc: "Black, tapered leg", img: ITEMS.trousers, size: "XS" },
      { id: "eat1-4", name: "White Leather Sneakers", desc: "Clean, minimal", img: ITEMS.sneakers, size: "EU 39" },
    ],
  },
  {
    id: "ea-tokyo-2",
    day: 2,
    title: "Harajuku Discovery",
    subtitle: "Creative Layer",
    image: OUTFIT_IMGS[1],
    confidence: 92,
    note: "Harajuku rewards individuality. An oversized oatmeal knit paired with wide cropped olive pants creates an effortlessly cool silhouette. The black nylon crossbody keeps essentials secure during street explorations.",
    items: [
      { id: "eat2-1", name: "Oversized Oatmeal Knit", desc: "Chunky, dropped shoulders", img: ITEMS.cashmere, size: "S" },
      { id: "eat2-2", name: "Wide Cropped Pants", desc: "Olive, high-waist", img: ITEMS.trousers, size: "XS" },
      { id: "eat2-3", name: "White Leather Sneakers", desc: "Platform, gum sole", img: ITEMS.sneakers, size: "EU 39" },
      { id: "eat2-4", name: "Nylon Crossbody Bag", desc: "Black, compact", img: ITEMS.bag, size: "One Size" },
    ],
  },
  {
    id: "ea-tokyo-3",
    day: 3,
    title: "Temple & Garden Visit",
    subtitle: "Refined Tradition",
    image: OUTFIT_IMGS[2],
    confidence: 94,
    note: "A respectful yet stylish look for temple visits. The camel wool coat over a cream silk shirt creates warmth and elegance, while the cashmere scarf adds texture. Ankle boots handle gravel paths with grace.",
    items: [
      { id: "eat3-1", name: "Camel Wool Coat", desc: "Belted, knee-length", img: ITEMS.trench, size: "XS" },
      { id: "eat3-2", name: "Cream Silk Shirt", desc: "Ivory, classic collar", img: ITEMS.silkBlouse, size: "XS" },
      { id: "eat3-3", name: "Slim Tailored Trousers", desc: "Charcoal, tapered", img: ITEMS.trousers, size: "XS" },
      { id: "eat3-4", name: "Leather Ankle Boots", desc: "Black, 4cm heel", img: ITEMS.boots, size: "EU 39" },
    ],
  },
  {
    id: "ea-tokyo-4",
    day: 4,
    title: "Omotesando Evening",
    subtitle: "Polished Minimal",
    image: OUTFIT_IMGS[3],
    confidence: 96,
    note: "Omotesando's architectural elegance demands equally refined dressing. An unstructured camel blazer over an ivory silk shirt with pleated trousers. Gold hoop earrings are the perfect finishing touch for dinner at a Michelin-starred restaurant.",
    items: [
      { id: "eat4-1", name: "Unstructured Camel Blazer", desc: "Relaxed fit, rolled cuffs", img: ITEMS.blazer, size: "XS" },
      { id: "eat4-2", name: "Cream Silk Shirt", desc: "Ivory, tucked", img: ITEMS.silkBlouse, size: "XS" },
      { id: "eat4-3", name: "Pleated Wide Trousers", desc: "Light grey, flowing", img: ITEMS.trousers, size: "XS" },
      { id: "eat4-4", name: "Gold Hoop Earrings", desc: "14K, minimal", img: ITEMS.earrings, size: "One Size" },
    ],
  },
];

/* ─── Packing list (derived from Tokyo outfits) ─── */
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
  { name: "Milan Fashion Week", date: "Sep 2025", mood: "Avant-Garde", img: IMG.milan, items: 14, outfits: 8, rating: 4.9 },
  { name: "Seoul Exploration", date: "Jul 2025", mood: "Urban Minimal", img: IMG.seoul, items: 10, outfits: 6, rating: 4.7 },
  { name: "Tuscany Retreat", date: "May 2025", mood: "Rustic Elegance", img: IMG.tuscany, items: 8, outfits: 5, rating: 4.8 },
];

/* ─── Style DNA (hardcoded for showcase) ─── */
const STYLE_DNA = [
  { label: "Minimalist", percent: 92 },
  { label: "Classic", percent: 78 },
  { label: "Casual", percent: 55 },
  { label: "Business", percent: 42 },
  { label: "Streetwear", percent: 35 },
  { label: "Sporty", percent: 22 },
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
            <span className="text-[18px] tracking-tight text-[#1A1410]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Travel Capsule</span>
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
          Welcome Back, Sofia
        </h1>
        <p className="mt-2 text-[16px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
          Your annual membership is active. Ready for your next adventure?
        </p>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            <Icon name="auto_awesome" size={12} className="text-[#C4613A]" filled />
            94% AI Confidence · Tailored for Female · 170cm · petite build
          </span>
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
              <ImageWithFallback src={IMG.tokyoHero} alt="Tokyo skyline" className="w-full h-full object-cover" />
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
                  <span className="text-white text-[28px] italic block" style={{ fontFamily: "var(--font-display)" }}>Tokyo, Japan</span>
                  <span className="text-white/80 text-[14px] block" style={{ fontFamily: "var(--font-body)" }}>Oct 10 – 31, 2026 · 21 days</span>
                </div>
              </div>
            </div>

            {/* AI Outfits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[28px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  Your <em>Tokyo Capsule</em>
                </h2>
                <span className="px-3 py-1 bg-[#C4613A]/10 text-[#C4613A] rounded-full text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
                  {TOKYO_OUTFITS.length} Outfit Looks
                </span>
              </div>
              <p className="text-[16px] text-[#57534e] mb-6" style={{ fontFamily: "var(--font-body)" }}>
                AI-generated outfits based on your profile, Tokyo's autumn weather, and your minimalist aesthetic preference.
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
                  <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>Sofia (Example)</span>
                  <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Female · 170cm · 50kg</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Minimalist", "Classic"].map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Tokyo Weather</h3>
                <TagChip label="Oct 10–31" />
              </div>
              <WeatherWidget temp={18} rain={38} wind={13} heatIndex={16} />
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

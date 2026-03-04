import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  TagChip,
  PlanBadge,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLang } from "../context/LanguageContext";

/* ═══════════════════════════════════════════════════════════ */
/*  EXAMPLE PRO PAGE                                          */
/*  Showcases what a 170cm / 45kg female traveler would         */
/*  receive after purchasing the Pro plan ($12 one-time).      */
/*  This is a STANDALONE page — not the actual dashboard.     */
/* ═══════════════════════════════════════════════════════════ */

/* ─── City hero images ─── */
const CITY_HEROES: Record<string, string> = {
  paris:
    "https://images.unsplash.com/photo-1629624123501-7595e0193fe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMGNhZmUlMjBnb2xkZW4lMjBob3VyJTIwd2FybSUyMGV1cm9wZWFuJTIwYXRtb3NwaGVyZXxlbnwxfHx8fDE3NzI0NDg2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
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
  loafers:
    "https://images.unsplash.com/photo-1771965056079-92b0ce6d4601?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwbG9hZmVycyUyMHdhcm0lMjB3b29kJTIwZmxvb3IlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  sneakers:
    "https://images.unsplash.com/photo-1663151860122-4890a08dc22b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwY2xlYW4lMjBtaW5pbWFsJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI5NTAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  espadrilles:
    "https://images.unsplash.com/photo-1594520770886-6910adf052c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BhZHJpbGxlJTIwc2hvZXMlMjBzdW1tZXIlMjB3b3ZlbiUyMG5hdHVyYWx8ZW58MXx8fHwxNzcyNDI5NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  breton:
    "https://images.unsplash.com/photo-1681473691223-985c6e1f16a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJpcGVkJTIwYnJldG9uJTIwdG9wJTIwbmF2eSUyMHdoaXRlJTIwZnJlbmNoJTIwc3R5bGV8ZW58MXx8fHwxNzcyNDI5NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  scarf:
    "https://images.unsplash.com/photo-1638256049278-0899dbe29aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXNobWVyZSUyMHNjYXJmJTIwZm9sZGVkJTIwd2FybSUyMG5ldXRyYWwlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  bag: "https://images.unsplash.com/photo-1574274560399-d242e212c916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWRkbGUlMjBsZWF0aGVyJTIwYmFnJTIwc3RpbGwlMjBsaWZlJTIwd2FybSUyMHRvbmV8ZW58MXx8fHwxNzcyNDI3NjAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  tote: "https://images.unsplash.com/photo-1757863971866-0b4e2f2ab6ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjB0b3RlJTIwYmFnJTIwYmVhY2glMjBzdW1tZXIlMjBuYXR1cmFsJTIwZmFicmljfGVufDF8fHx8MTc3MjQyOTQ5NXww&ixlib=rb-4.1.0&q=80&w=1080",
  earrings:
    "https://images.unsplash.com/photo-1704637397679-f37e5e0dc429?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwaG9vcCUyMGVhcnJpbmdzJTIwamV3ZWxyeSUyMG1pbmltYWwlMjBlbGVnYW50fGVufDF8fHx8MTc3MjQyOTQ4OXww&ixlib=rb-4.1.0&q=80&w=1080",
  sunglasses:
    "https://images.unsplash.com/photo-1768324969832-006528e23d0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwc3VuZ2xhc3NlcyUyMGdvbGRlbiUyMGxpZ2h0JTIwZmlsbSUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NzI0Mjc1OTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  watch:
    "https://images.unsplash.com/photo-1758887953059-ca6f8e454207?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRjaCUyMG1pbmltYWwlMjBsZWF0aGVyJTIwc3RyYXAlMjB3cmlzdCUyMGZhc2hpb24lMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzcyNDI5NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  hat: "https://images.unsplash.com/photo-1752014364743-e80acc2c9b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5hbWElMjBzdHJhdyUyMGhhdCUyMGZhc2hpb24lMjBzdW1tZXIlMjBlbGVnYW50fGVufDF8fHx8MTc3MjQyOTQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ─── Outfit images (AI-generated, local assets) ─── */
const PRO_OUTFIT_IMGS = [
  "/examples/pro-outfit-1.png",
  "/examples/pro-outfit-2.png",
  "/examples/pro-outfit-3.png",
  "/examples/pro-outfit-4.png",
];

/* ─── Persona: 170cm / 45kg female traveler ─── */
/* BMI = 15.6 → S clothing, EU 41 shoes */

interface ExampleItem {
  id: string;
  name: string;
  desc: string;
  img: string;
  size: string;
  category: string;
}

interface ExampleOutfit {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  image: string;
  items: ExampleItem[];
  note: string;
  confidence: number;
}

interface CityData {
  city: string;
  country: string;
  dates: string;
  heroImg: string;
  weather: { temp: number; rain: number; wind: number; condition: string };
  outfits: ExampleOutfit[];
  colorPalette: string[];
  activities: string[];
}

const EXAMPLE_CITIES: CityData[] = [
  {
    city: "Paris",
    country: "France",
    dates: "May 20 – May 24",
    heroImg: CITY_HEROES.paris,
    weather: { temp: 19, rain: 20, wind: 10, condition: "Partly Cloudy" },
    colorPalette: ["#2C3E50", "#C9B99A", "#8B6F4E", "#E8DDD4"],
    activities: ["Champs-Élysées Walk", "Museum Visit", "Café Terrasse", "River Cruise", "Vintage Shopping"],
    outfits: [
      {
        id: "ex-paris-1",
        day: 1,
        title: "Arrival & Café Rendezvous",
        subtitle: "Parisian Power Casual",
        image: PRO_OUTFIT_IMGS[0],
        confidence: 94,
        note: "A sophisticated yet relaxed arrival look — the charcoal blazer draped over an ivory silk blouse creates instant Parisian elegance. A delicate gold chain necklace adds the perfect finishing touch for café hopping along Saint-Germain.",
        items: [
          { id: "ep1-1", name: "Charcoal Blazer", desc: "Oversized fit, dark grey wool", img: ITEMS.blazer, size: "S", category: "Outerwear" },
          { id: "ep1-2", name: "Ivory Silk Blouse", desc: "V-neck, relaxed drape", img: ITEMS.silkBlouse, size: "S", category: "Top" },
          { id: "ep1-3", name: "High-Waist Trousers", desc: "Black, tailored slim", img: ITEMS.trousers, size: "S", category: "Bottom" },
          { id: "ep1-4", name: "Gold Chain Necklace", desc: "Layered, delicate pendant", img: ITEMS.earrings, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-paris-2",
        day: 2,
        title: "Louvre & Musée d'Orsay",
        subtitle: "Museum Elegance",
        image: PRO_OUTFIT_IMGS[1],
        confidence: 92,
        note: "Gallery-ready and effortlessly chic. The cream cashmere sweater paired with a flowing charcoal midi skirt is perfect for hours of art appreciation, while cognac ankle boots handle marble floors with grace. The leather crossbody keeps your hands free for photos.",
        items: [
          { id: "ep2-1", name: "Cream Cashmere Sweater", desc: "Round neck, fine knit", img: ITEMS.cashmere, size: "S", category: "Top" },
          { id: "ep2-2", name: "Charcoal Midi Skirt", desc: "A-line, pleated wool blend", img: ITEMS.trousers, size: "S", category: "Bottom" },
          { id: "ep2-3", name: "Cognac Ankle Boots", desc: "Leather, block heel, 5cm", img: ITEMS.boots, size: "EU 37", category: "Shoes" },
          { id: "ep2-4", name: "Leather Crossbody Bag", desc: "Tan saddle bag, compact", img: ITEMS.bag, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-paris-3",
        day: 3,
        title: "Montmartre & Café Culture",
        subtitle: "French Effortless Chic",
        image: PRO_OUTFIT_IMGS[2],
        confidence: 95,
        note: "The quintessential Parisian café look at Le Consulat. A classic navy-and-white Breton striped top paired with cream wide-leg linen pants and white sneakers is timelessly French. The navy silk scarf tied at the neck adds the perfect finishing detail.",
        items: [
          { id: "ep3-1", name: "Breton Striped Top", desc: "Navy & white, boat neck, long sleeve", img: ITEMS.breton, size: "S", category: "Top" },
          { id: "ep3-2", name: "Cream Wide-Leg Linen Pants", desc: "High-waist, breathable", img: ITEMS.trousers, size: "S", category: "Bottom" },
          { id: "ep3-3", name: "White Leather Sneakers", desc: "Clean minimal, low-top", img: ITEMS.sneakers, size: "EU 37", category: "Shoes" },
          { id: "ep3-4", name: "Navy Silk Neck Scarf", desc: "Printed, tied at collar", img: ITEMS.scarf, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-paris-4",
        day: 4,
        title: "Seine Sunset Stroll",
        subtitle: "Evening Sophistication",
        image: PRO_OUTFIT_IMGS[3],
        confidence: 96,
        note: "The Seine at golden hour demands understated drama. A flowing black silk blouse with tailored grey trousers and pointed-toe black heels creates a striking silhouette against the Eiffel Tower backdrop. The structured leather bag completes this evening-ready look.",
        items: [
          { id: "ep4-1", name: "Black Silk Blouse", desc: "V-neck, flowing sleeves", img: ITEMS.silkBlouse, size: "S", category: "Top" },
          { id: "ep4-2", name: "Grey Tailored Trousers", desc: "Slim, pressed crease", img: ITEMS.trousers, size: "S", category: "Bottom" },
          { id: "ep4-3", name: "Black Pointed Heels", desc: "Stiletto, 7cm, patent", img: ITEMS.boots, size: "EU 37", category: "Shoes" },
          { id: "ep4-4", name: "Structured Leather Bag", desc: "Black, top handle", img: ITEMS.bag, size: "One Size", category: "Accessory" },
        ],
      },
    ],
  },
];

/* ─── Derive packing list (deduplicated, with usage count) ─── */
interface PackingEntry {
  name: string;
  img: string;
  size: string;
  category: string;
  usageCount: number;
  cities: string[];
}

function derivePackingList(cities: CityData[]): PackingEntry[] {
  const map = new Map<string, PackingEntry>();
  cities.forEach((c) => {
    c.outfits.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.name);
        if (existing) {
          existing.usageCount++;
          if (!existing.cities.includes(c.city)) existing.cities.push(c.city);
        } else {
          map.set(item.name, {
            name: item.name,
            img: item.img,
            size: item.size,
            category: item.category,
            usageCount: 1,
            cities: [c.city],
          });
        }
      });
    });
  });
  return Array.from(map.values()).sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
}

const PACKING = derivePackingList(EXAMPLE_CITIES);
const ALL_OUTFITS = EXAMPLE_CITIES.flatMap((c) => c.outfits);

export function ExampleProPage() {
  const navigate = useNavigate();
  const { t, displayFont, bodyFont } = useLang();
  const [activeCity, setActiveCity] = useState(0);
  const [expandedOutfit, setExpandedOutfit] = useState(0);

  const currentSet = EXAMPLE_CITIES[activeCity];

  // Set scroll target so browser back returns to the examples section
  useEffect(() => {
    sessionStorage.setItem("tc_scroll_target", "examples");
    return () => {
      // On explicit forward navigation (e.g. to onboarding), clear the flag
      // so ScrollToTop works normally for non-back navigations
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Banner */}
      <div className="bg-[#C4613A] text-white text-center py-2">
        <span className="text-[12px] uppercase tracking-[0.1em]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
          {t("examples.banner.pro")}
        </span>
        <button onClick={() => navigate("/onboarding/1")} className="ml-4 inline-flex items-center gap-1 px-3 py-0.5 bg-white text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] cursor-pointer hover:bg-white/90 transition-colors" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
          {t("examples.banner.getStarted")} <span className="text-[13px]">&rarr;</span>
        </button>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E8DDD4]/50" style={{ backgroundColor: "rgba(253,248,243,0.8)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: "var(--max-w)" }}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Icon name="luggage" size={24} className="text-[#C4613A]" />
            <span className="text-[15px] sm:text-[18px] tracking-tight text-[#1A1410] whitespace-nowrap" style={{ fontFamily: displayFont, fontWeight: 700 }}>Travel Capsule AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[t("nav.dashboard"), t("nav.myCapsules"), t("nav.shop"), t("nav.account")].map((item) => (
              <span key={item} className="text-[11px] tracking-[0.1em] uppercase text-[#57534e]/50 cursor-default" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item}</span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <PlanBadge label="Pro Plan" className="bg-[#C4613A]/10 text-[#C4613A]" />
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e]/60 hidden sm:inline" style={{ fontFamily: "var(--font-mono)" }}>
              {t("examples.mode")}
            </span>
          </div>
        </div>
      </header>

      {/* Title + AI badge */}
      <div className="mx-auto px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="auto_awesome" size={10} className="text-[#C4613A]" filled /> {t("examples.aiGenerated")}
          </span>
        </div>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: displayFont, lineHeight: 1.1 }}>
          {t("examples.pro.pageTitle")}
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: bodyFont }}>
          {t("examples.pro.pageSubtitle")}
        </p>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            <Icon name="auto_awesome" size={12} className="text-[#C4613A]" filled />
            {t("examples.pro.confidence")}
          </span>
        </div>

        {/* City tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {EXAMPLE_CITIES.map((cs, i) => (
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
            {/* 2x2 AI Outfit Grid Hero */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1A1410]" style={{ aspectRatio: "1/1" }}>
              <div className="grid grid-cols-2 gap-2 h-full">
                {currentSet.outfits.map((outfit) => (
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
              {/* Overlay badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.12em]" style={{ fontFamily: "var(--font-mono)" }}>
                  <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("examples.aiGenerated")}
                </span>
                <TagChip label={`${currentSet.city}, ${currentSet.country}`} className="bg-white/20 text-white backdrop-blur-sm" />
              </div>
              <div className="absolute bottom-3 right-3">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>
                  {currentSet.dates} · {currentSet.outfits.length} {t("examples.pro.looks")}
                </span>
              </div>
            </div>

            {/* Outfit cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: displayFont }}>
                  {currentSet.city} {t("examples.pro.outfitsLabel")}
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  {currentSet.outfits.length} {t("examples.pro.looks")} · {t("examples.pro.womenswear")}
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
                          <span className="text-[18px] text-[#292524] block" style={{ fontFamily: displayFont }}>{outfit.title}</span>
                          <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{outfit.subtitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{outfit.confidence}{t("examples.pro.match")}</span>
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
                                <Icon name="auto_awesome" size={10} className="text-white" filled /> {t("examples.aiGenerated")}
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
                            <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-4" style={{ fontFamily: bodyFont, fontWeight: 600 }}>
                              {t("examples.pro.outfitBreakdown")}
                            </span>
                            <div className="space-y-2">
                              {outfit.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                                  <ImageWithFallback src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[14px] text-[#292524]" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                                      <SizeChip size={item.size} />
                                    </div>
                                    <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="mt-5 text-[14px] text-[#57534e] italic leading-relaxed" style={{ fontFamily: displayFont }}>
                              "{outfit.note}"
                            </p>
                            <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                              <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e] block mb-2" style={{ fontFamily: bodyFont, fontWeight: 600 }}>{t("examples.pro.activities")}</span>
                              <div className="flex flex-wrap gap-2">
                                {currentSet.activities.map((a) => (
                                  <span key={a} className="px-2.5 py-1 bg-[#FDF8F3] border border-[#E8DDD4] rounded-full text-[11px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{a}</span>
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
            <div className="lg:sticky lg:top-[120px] space-y-6">
              {/* Profile */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
                    <Icon name="person" size={24} className="text-[#C4613A]" />
                  </div>
                  <div>
                    <span className="text-[16px] text-[#292524] block" style={{ fontFamily: displayFont }}>{t("examples.pro.profile")}</span>
                    <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{t("examples.pro.persona")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Classic"].map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                  ))}
                </div>
              </div>

              {/* Multi-City Packing */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: displayFont }}>{t("examples.pro.packingTitle")}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {t("examples.pro.packingAuto")}
                  </span>
                </div>
                <p className="text-[12px] text-[#57534e] mb-4" style={{ fontFamily: bodyFont }}>
                  {t("examples.pro.packingFrom")} {ALL_OUTFITS.length} {t("examples.pro.packingOutfits")} {EXAMPLE_CITIES.length} {t("examples.pro.packingCities")}
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {PACKING.map((item, i) => (
                    <div key={`${item.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                      <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{item.name}</span>
                          <SizeChip size={item.size} />
                        </div>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                          {t("examples.pro.usedIn")} {item.usageCount} {t("examples.pro.look")}{item.usageCount > 1 ? "s" : ""} · {item.cities.join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: bodyFont }}>
                    {PACKING.length} {t("examples.pro.packingUnique")} {ALL_OUTFITS.length} {t("examples.pro.packingLooks")}
                  </span>
                </div>
              </div>

              {/* Weather */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-5" style={{ fontFamily: displayFont }}>{t("examples.pro.weatherTitle")}</h3>
                <div className="space-y-4">
                  {EXAMPLE_CITIES.map((cs) => (
                    <div key={cs.city} className="py-3 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[14px] text-[#292524] block" style={{ fontFamily: bodyFont, fontWeight: 500 }}>{cs.city}</span>
                          <span className="text-[11px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{cs.dates} · {cs.weather.condition}</span>
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
                <h3 className="text-[18px] text-[#292524] mb-4" style={{ fontFamily: displayFont }}>{t("examples.pro.statsTitle")}</h3>
                <div className="space-y-3">
                  {[
                    { icon: "public", labelKey: "examples.pro.statCities", value: `${EXAMPLE_CITIES.length}` },
                    { icon: "style", labelKey: "examples.pro.statOutfits", value: `${ALL_OUTFITS.length} ${t("examples.pro.looks")}` },
                    { icon: "checkroom", labelKey: "examples.pro.statPacking", value: `${PACKING.length} pieces` },
                    { icon: "hd", labelKey: "examples.pro.statQuality", value: t("examples.pro.statQualityVal") },
                    { icon: "refresh", labelKey: "examples.pro.statRegen", value: t("examples.pro.statRegenVal") },
                  ].map((stat) => (
                    <div key={stat.labelKey} className="flex items-center justify-between py-2 border-b border-[#EFE8DF] last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon name={stat.icon} size={16} className="text-[#C4613A]" />
                        <span className="text-[13px] text-[#57534e]" style={{ fontFamily: bodyFont }}>{t(stat.labelKey)}</span>
                      </div>
                      <span className="text-[13px] text-[#292524]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-[#C4613A] rounded-xl p-6 text-white">
                <h3 className="text-[18px] text-white mb-2" style={{ fontFamily: displayFont }}>{t("examples.pro.ctaTitle")}</h3>
                <p className="text-[13px] text-white/80 mb-4" style={{ fontFamily: bodyFont }}>
                  {t("examples.pro.ctaBody")}
                </p>
                <BtnPrimary size="sm" onClick={() => navigate("/onboarding/1")}>
                  <span className="flex items-center gap-2 text-[#C4613A]">
                    {t("examples.pro.ctaBtn")}
                    <Icon name="arrow_forward" size={16} className="text-[#C4613A]" />
                  </span>
                </BtnPrimary>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

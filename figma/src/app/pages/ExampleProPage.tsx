import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Icon,
  BtnPrimary,
  TagChip,
  PlanBadge,
  SizeChip,
} from "../components/travel-capsule";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/* ═══════════════════════════════════════════════════════════ */
/*  EXAMPLE PRO PAGE                                          */
/*  Showcases what a 170cm / 50kg female supermodel would     */
/*  receive after purchasing the Pro plan ($12 one-time).      */
/*  This is a STANDALONE page — not the actual dashboard.     */
/* ═══════════════════════════════════════════════════════════ */

/* ─── City hero images ─── */
const CITY_HEROES: Record<string, string> = {
  paris:
    "https://images.unsplash.com/photo-1629624123501-7595e0193fe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMGNhZmUlMjBnb2xkZW4lMjBob3VyJTIwd2FybSUyMGV1cm9wZWFuJTIwYXRtb3NwaGVyZXxlbnwxfHx8fDE3NzI0NDg2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  rome: "https://images.unsplash.com/photo-1753901150571-6da7c0ba03e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSb21lJTIwY29sb3NzZXVtJTIwZ29sZGVuJTIwc3Vuc2V0JTIwYW5jaWVudCUyMHJ1aW5zJTIwd2FybXxlbnwxfHx8fDE3NzI0NDg2NjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  barcelona:
    "https://images.unsplash.com/photo-1750589218004-3323a162fec3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYXJjZWxvbmElMjBiZWFjaCUyMHN1bnNldCUyMGNvYXN0YWwlMjBzdW1tZXIlMjB2aWV3fGVufDF8fHx8MTc3MjQ0ODY2MXww&ixlib=rb-4.1.0&q=80&w=1080",
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

/* ─── Outfit images (full-body, 3:4 ratio) ─── */
const OUTFIT_IMGS = {
  paris: [
    "https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGVsZWdhbnQlMjB0cmVuY2glMjBjb2F0JTIwd2Fsa2luZyUyMHBhcmlzJTIwZ29sZGVuJTIwaG91ciUyMGVkaXRvcmlhbCUyMGZhc2hpb258ZW58MXx8fHwxNzcyNDQ4NjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1770294758942-7ce9ca052986?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNpbGslMjBibG91c2UlMjB0dWNrZWQlMjBlbGVnYW50JTIwcGFyaXNpYW4lMjBiaXN0cm98ZW58MXx8fHwxNzcyNDQ4NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1738773733452-b02b079a77af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdvb2wlMjBjb2F0JTIwd2ludGVyJTIwZWxlZ2FudCUyMHNjYXJmJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0NDg2NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1653152987833-1c1aa09ab3dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGJsYWNrJTIwZXZlbmluZyUyMGRyZXNzJTIwZWxlZ2FudCUyMGRpbm5lciUyMHBhcnR5fGVufDF8fHx8MTc3MjQ0ODY0OXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  rome: [
    "https://images.unsplash.com/photo-1536967674045-00c29460c1a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGxpbmVuJTIwb3V0Zml0JTIwcm9tZSUyMHRlcnJhY290dGElMjB3YXJtJTIwdG9uZXMlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1533026795897-5bb93fa969d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGxpbmVuJTIwZHJlc3MlMjByb21lJTIwZ29sZGVuJTIwbGlnaHQlMjBzdW1tZXJ8ZW58MXx8fHwxNzcyNDQ4NjU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1755059703487-8551d6875f54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMG92ZXJzaXplZCUyMGJsYXplciUyMHdpZGUlMjB0cm91c2VycyUyMHN0cmVldCUyMHN0eWxlJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQ0ODY1NHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1734314019865-6c1486b9c5f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRhaWxvcmVkJTIwc3VpdCUyMHNtYXJ0JTIwY2FzdWFsJTIwc29waGlzdGljYXRlZHxlbnwxfHx8fDE3NzI0NDg2NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  barcelona: [
    "https://images.unsplash.com/photo-1590493298956-fbfef69619ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGRlbmltJTIwamFja2V0JTIwY2FzdWFsJTIwc3ByaW5nJTIwb3V0Zml0JTIwd2Fsa2luZ3xlbnwxfHx8fDE3NzI0Mjk1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1760377031122-6b20ef978277?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmF3JTIwaGF0JTIwc3VuZHJlc3MlMjBjb2FzdGFsJTIwYmVhY2glMjByZXNvcnR8ZW58MXx8fHwxNzcyNDQ4NjU2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1572030712991-5d489429598a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN1bW1lciUyMGRyZXNzJTIwd2Fsa2luZyUyMGJhcmNlbG9uYSUyMGJlYWNoJTIwYnJlZXplfGVufDF8fHx8MTc3MjQ0ODY1MHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1759229874709-a8d0de083b91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMG1pbmltYWxpc3QlMjBvdXRmaXQlMjBhdXR1bW4lMjBjb2F0JTIwbmV1dHJhbCUyMHRvbmVzfGVufDF8fHx8MTc3MjQ0ODY1NXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
};

/* ─── Persona: 170cm / 50kg female supermodel ─── */
/* BMI = 17.3 → XS clothing, EU 39 shoes */

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
    dates: "Mar 15 – Mar 21",
    heroImg: CITY_HEROES.paris,
    weather: { temp: 9, rain: 30, wind: 12, condition: "Partly Cloudy" },
    colorPalette: ["#8B7355", "#C4A882", "#4A5568", "#D4C5B2"],
    activities: ["Cafe Culture", "Gallery Walk", "Bistro Dinner", "Seine Stroll", "Vintage Shopping"],
    outfits: [
      {
        id: "ex-paris-1",
        day: 1,
        title: "Arrival & Cafe Culture",
        subtitle: "Classic Parisian Layering",
        image: OUTFIT_IMGS.paris[0],
        confidence: 94,
        note: "A refined layering approach for Paris's unpredictable spring weather — the beige trench over a Breton top is effortlessly Parisian, while ankle boots handle cobblestones with ease.",
        items: [
          { id: "ep1-1", name: "Classic Trench Coat", desc: "Beige, water-resistant, belted", img: ITEMS.trench, size: "XS", category: "Outerwear" },
          { id: "ep1-2", name: "Breton Striped Top", desc: "Navy & white, boat neck", img: ITEMS.breton, size: "XS", category: "Top" },
          { id: "ep1-3", name: "High-Waist Straight Jeans", desc: "Medium wash, cropped", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "ep1-4", name: "Leather Ankle Boots", desc: "Brown, 5cm heel", img: ITEMS.boots, size: "EU 39", category: "Shoes" },
        ],
      },
      {
        id: "ex-paris-2",
        day: 2,
        title: "Le Marais Gallery Walk",
        subtitle: "Smart Casual Elegance",
        image: OUTFIT_IMGS.paris[1],
        confidence: 92,
        note: "Gallery-ready sophistication. The ivory silk blouse tucked into tailored trousers bridges art openings and afternoon espressos, while gold hoops add a delicate finishing touch.",
        items: [
          { id: "ep2-1", name: "Silk Blouse", desc: "Ivory, relaxed fit", img: ITEMS.silkBlouse, size: "XS", category: "Top" },
          { id: "ep2-2", name: "Tailored Wool Trousers", desc: "Charcoal, high-waist, tapered", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "ep2-3", name: "Leather Loafers", desc: "Cognac, hand-stitched", img: ITEMS.loafers, size: "EU 39", category: "Shoes" },
          { id: "ep2-4", name: "Gold Hoop Earrings", desc: "14K gold, minimal", img: ITEMS.earrings, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-paris-3",
        day: 3,
        title: "Musee & Montmartre",
        subtitle: "Cozy Intellectual",
        image: OUTFIT_IMGS.paris[2],
        confidence: 91,
        note: "Warm camel tones for hours in temperature-controlled museums, transitioning seamlessly to Montmartre's cobblestone streets. The terracotta scarf adds a pop of warmth.",
        items: [
          { id: "ep3-1", name: "Cashmere Crew Knit", desc: "Camel, soft-hand feel", img: ITEMS.cashmere, size: "XS", category: "Top" },
          { id: "ep3-2", name: "High-Waist Straight Jeans", desc: "Medium wash, cropped", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "ep3-3", name: "Wool Blend Scarf", desc: "Terracotta, oversized knit", img: ITEMS.scarf, size: "One Size", category: "Accessory" },
          { id: "ep3-4", name: "Leather Ankle Boots", desc: "Brown, 5cm heel", img: ITEMS.boots, size: "EU 39", category: "Shoes" },
        ],
      },
      {
        id: "ex-paris-4",
        day: 4,
        title: "Bistro Evening",
        subtitle: "Parisian Elegance",
        image: OUTFIT_IMGS.paris[3],
        confidence: 96,
        note: "A refined evening look for a candlelit bistro — the silk blouse paired with tailored trousers and the trench draped over shoulders adds a distinctly Parisian finishing touch.",
        items: [
          { id: "ep4-1", name: "Silk Blouse", desc: "Ivory, tucked styling", img: ITEMS.silkBlouse, size: "XS", category: "Top" },
          { id: "ep4-2", name: "Tailored Wool Trousers", desc: "Charcoal, high-waist", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "ep4-3", name: "Leather Loafers", desc: "Black, polished", img: ITEMS.loafers, size: "EU 39", category: "Shoes" },
          { id: "ep4-4", name: "Classic Trench Coat", desc: "Draped over shoulders", img: ITEMS.trench, size: "XS", category: "Outerwear" },
        ],
      },
    ],
  },
  {
    city: "Rome",
    country: "Italy",
    dates: "Mar 22 – Mar 26",
    heroImg: CITY_HEROES.rome,
    weather: { temp: 16, rain: 15, wind: 8, condition: "Sunny" },
    colorPalette: ["#C2956B", "#E8C9A0", "#8B6E4E", "#F0E0C8"],
    activities: ["Colosseum Visit", "Trastevere Dining", "Vatican Morning", "Rooftop Aperitivo"],
    outfits: [
      {
        id: "ex-rome-1",
        day: 1,
        title: "Colosseum Morning",
        subtitle: "Mediterranean Ease",
        image: OUTFIT_IMGS.rome[0],
        confidence: 93,
        note: "Sun-kissed terracotta hues meet relaxed Mediterranean tailoring. The unstructured linen blazer paired with a classic stripe top transitions from sightseeing to trattoria lunch.",
        items: [
          { id: "er1-1", name: "Linen Blazer", desc: "Sand, unstructured, rolled cuffs", img: ITEMS.blazer, size: "XS", category: "Outerwear" },
          { id: "er1-2", name: "Breton Striped Top", desc: "Navy & white, boat neck", img: ITEMS.breton, size: "XS", category: "Top" },
          { id: "er1-3", name: "Wide-Leg Linen Pants", desc: "Ecru, high-waist, breathable", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "er1-4", name: "Leather Espadrilles", desc: "Woven jute, tan", img: ITEMS.espadrilles, size: "EU 39", category: "Shoes" },
        ],
      },
      {
        id: "ex-rome-2",
        day: 2,
        title: "Trastevere Stroll",
        subtitle: "Rustic Elegance",
        image: OUTFIT_IMGS.rome[1],
        confidence: 90,
        note: "Navigate cobblestones in effortless Italian style. The saddle leather crossbody keeps hands free for gelato while the oversized linen shirt provides a relaxed silhouette.",
        items: [
          { id: "er2-1", name: "Linen Shirt Dress", desc: "White, oversized, belted", img: ITEMS.silkBlouse, size: "XS", category: "Top" },
          { id: "er2-2", name: "High-Waist Straight Jeans", desc: "Light wash, relaxed", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "er2-3", name: "Leather Espadrilles", desc: "Woven jute, tan", img: ITEMS.espadrilles, size: "EU 39", category: "Shoes" },
          { id: "er2-4", name: "Saddle Crossbody Bag", desc: "Cognac leather, compact", img: ITEMS.bag, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-rome-3",
        day: 3,
        title: "Vatican & Culture",
        subtitle: "Smart Layering",
        image: OUTFIT_IMGS.rome[2],
        confidence: 95,
        note: "Modest yet fashionable coverage for religious sites. The structured blazer commands respect, while tailored trousers and loafers maintain polished sophistication all day.",
        items: [
          { id: "er3-1", name: "Linen Blazer", desc: "Sand, unstructured", img: ITEMS.blazer, size: "XS", category: "Outerwear" },
          { id: "er3-2", name: "Silk Blouse", desc: "Cream, long sleeve", img: ITEMS.silkBlouse, size: "XS", category: "Top" },
          { id: "er3-3", name: "Tailored Wool Trousers", desc: "Navy, tapered", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "er3-4", name: "Leather Loafers", desc: "Cognac, hand-stitched", img: ITEMS.loafers, size: "EU 39", category: "Shoes" },
        ],
      },
      {
        id: "ex-rome-4",
        day: 4,
        title: "Rooftop Aperitivo",
        subtitle: "Sunset Glamour",
        image: OUTFIT_IMGS.rome[3],
        confidence: 93,
        note: "Golden hour demands golden accessories. The linen blazer with rolled cuffs over a silk camisole creates a refined yet relaxed look for Roman rooftop bars.",
        items: [
          { id: "er4-1", name: "Linen Blazer", desc: "Camel, rolled cuffs", img: ITEMS.blazer, size: "XS", category: "Outerwear" },
          { id: "er4-2", name: "Silk Blouse", desc: "Champagne, camisole styling", img: ITEMS.silkBlouse, size: "XS", category: "Top" },
          { id: "er4-3", name: "High-Waist Straight Jeans", desc: "Dark indigo, slim", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "er4-4", name: "Tortoise Sunglasses", desc: "Aviator, UV protection", img: ITEMS.sunglasses, size: "One Size", category: "Accessory" },
        ],
      },
    ],
  },
  {
    city: "Barcelona",
    country: "Spain",
    dates: "Mar 27 – Apr 2",
    heroImg: CITY_HEROES.barcelona,
    weather: { temp: 20, rain: 10, wind: 14, condition: "Clear" },
    colorPalette: ["#E2A76F", "#5BA3C2", "#F5DEB3", "#4A7C59"],
    activities: ["Sagrada Familia", "Beach Morning", "El Born Markets", "Tapas Crawl", "Park Guell Sunset"],
    outfits: [
      {
        id: "ex-bcn-1",
        day: 1,
        title: "Gothic Quarter Wander",
        subtitle: "Urban Coastal Cool",
        image: OUTFIT_IMGS.barcelona[0],
        confidence: 91,
        note: "Effortless coastal cool with structure. The light denim jacket adds just enough warmth for shaded alleys while white sneakers handle hours of exploring the Gothic Quarter.",
        items: [
          { id: "eb1-1", name: "Light Denim Jacket", desc: "Cropped, light wash", img: ITEMS.blazer, size: "XS", category: "Outerwear" },
          { id: "eb1-2", name: "Breton Striped Top", desc: "Red & white, crew neck", img: ITEMS.breton, size: "XS", category: "Top" },
          { id: "eb1-3", name: "High-Waist Straight Jeans", desc: "White, cropped", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "eb1-4", name: "White Sneakers", desc: "Clean, minimal leather", img: ITEMS.sneakers, size: "EU 39", category: "Shoes" },
        ],
      },
      {
        id: "ex-bcn-2",
        day: 2,
        title: "Sagrada Familia Visit",
        subtitle: "Art Nouveau Chic",
        image: OUTFIT_IMGS.barcelona[1],
        confidence: 93,
        note: "Gaudi's masterpiece calls for equally creative dressing. The terracotta cotton knit with wide-leg linen pants and a panama hat create an artful, comfortable look for outdoor exploration.",
        items: [
          { id: "eb2-1", name: "Cotton Knit Top", desc: "Terracotta, relaxed fit", img: ITEMS.cashmere, size: "XS", category: "Top" },
          { id: "eb2-2", name: "Wide-Leg Linen Pants", desc: "Cream, high-waist", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "eb2-3", name: "Leather Espadrilles", desc: "Natural canvas, jute sole", img: ITEMS.espadrilles, size: "EU 39", category: "Shoes" },
          { id: "eb2-4", name: "Panama Hat", desc: "Straw, wide brim", img: ITEMS.hat, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-bcn-3",
        day: 3,
        title: "Barceloneta Beach",
        subtitle: "Sandy Minimalism",
        image: OUTFIT_IMGS.barcelona[2],
        confidence: 89,
        note: "Beach to brunch transition made effortless. The oversized white linen shirt doubles as a cover-up, while the canvas tote carries everything from sunscreen to a change of shoes.",
        items: [
          { id: "eb3-1", name: "Oversized Linen Shirt", desc: "White, roll-up sleeves", img: ITEMS.silkBlouse, size: "S", category: "Top" },
          { id: "eb3-2", name: "High-Waist Straight Jeans", desc: "Light wash, wide-leg", img: ITEMS.denim, size: "24", category: "Bottom" },
          { id: "eb3-3", name: "White Sneakers", desc: "Leather slides, tan", img: ITEMS.sneakers, size: "EU 39", category: "Shoes" },
          { id: "eb3-4", name: "Canvas Tote Bag", desc: "Natural fabric, oversized", img: ITEMS.tote, size: "One Size", category: "Accessory" },
        ],
      },
      {
        id: "ex-bcn-4",
        day: 4,
        title: "El Born Tapas Crawl",
        subtitle: "Evening Glow",
        image: OUTFIT_IMGS.barcelona[3],
        confidence: 95,
        note: "Tapas bars demand effortless style that transitions from bar to bar. The olive cotton blazer with a cream top and slim chinos is polished without trying too hard.",
        items: [
          { id: "eb4-1", name: "Cotton Blazer", desc: "Olive green, unstructured", img: ITEMS.blazer, size: "XS", category: "Outerwear" },
          { id: "eb4-2", name: "Cashmere Crew Knit", desc: "Cream, lightweight", img: ITEMS.cashmere, size: "XS", category: "Top" },
          { id: "eb4-3", name: "Slim Chinos", desc: "Charcoal, tapered", img: ITEMS.trousers, size: "XS", category: "Bottom" },
          { id: "eb4-4", name: "Leather Watch", desc: "Brown strap, gold face", img: ITEMS.watch, size: "One Size", category: "Accessory" },
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
  const [activeCity, setActiveCity] = useState(0);
  const [expandedOutfit, setExpandedOutfit] = useState(0);

  const currentSet = EXAMPLE_CITIES[activeCity];

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* Banner */}
      <div className="bg-[#C4613A] text-white text-center py-2">
        <span className="text-[12px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
          Example Preview — This is what you receive with the Pro Plan ($12)
        </span>
        <button onClick={() => navigate("/onboarding/1")} className="ml-4 inline-flex items-center gap-1 px-3 py-0.5 bg-white text-[#C4613A] rounded-full text-[11px] uppercase tracking-[0.08em] cursor-pointer hover:bg-white/90 transition-colors" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
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
            {["Dashboard", "My Capsules", "Shop", "Account"].map((item) => (
              <span key={item} className="text-[11px] tracking-[0.1em] uppercase text-[#57534e]/50 cursor-default" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item}</span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <PlanBadge label="Pro Plan" className="bg-[#C4613A]/10 text-[#C4613A]" />
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#57534e]/60 hidden sm:inline" style={{ fontFamily: "var(--font-mono)" }}>
              Example Mode
            </span>
          </div>
        </div>
      </header>

      {/* Title + AI badge */}
      <div className="mx-auto px-6 pt-10 pb-2" style={{ maxWidth: "var(--max-w)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            <Icon name="auto_awesome" size={10} className="text-[#C4613A]" filled /> AI Generated
          </span>
        </div>
        <h1 className="text-[#292524] italic" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
          Multi-City Style Guide
        </h1>
        <p className="mt-2 text-[15px] text-[#57534e] max-w-[600px]" style={{ fontFamily: "var(--font-body)" }}>
          3 cities, one seamlessly curated capsule wardrobe. Every piece earns its place across your entire European journey.
        </p>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
            <Icon name="auto_awesome" size={12} className="text-[#C4613A]" filled />
            93% AI Confidence · Tailored for Female · 170cm · petite build
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
              </div>
            </div>

            {/* Outfit cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>
                  {currentSet.city} Outfits
                </h2>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                  {currentSet.outfits.length} Looks · Womenswear · XS
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
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C4613A]/8 text-[#C4613A] text-[9px]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{outfit.confidence}% match</span>
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
                                      <SizeChip size={item.size} />
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
            <div className="lg:sticky lg:top-[120px] space-y-6">
              {/* Profile */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#C4613A]/10 flex items-center justify-center">
                    <Icon name="person" size={24} className="text-[#C4613A]" />
                  </div>
                  <div>
                    <span className="text-[16px] text-[#292524] block" style={{ fontFamily: "var(--font-display)" }}>Example User</span>
                    <span className="text-[11px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>Female · 170cm · 50kg</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Minimalist", "Classic", "Casual"].map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-full bg-[#FDF8F3] border border-[#E8DDD4] text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>{a}</span>
                  ))}
                </div>
              </div>

              {/* Multi-City Packing */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] text-[#292524]" style={{ fontFamily: "var(--font-display)" }}>Multi-City Packing</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#C4613A]/10 text-[#C4613A] text-[9px] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    Auto-derived
                  </span>
                </div>
                <p className="text-[12px] text-[#57534e] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                  Consolidated from {ALL_OUTFITS.length} outfits across {EXAMPLE_CITIES.length} cities
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {PACKING.map((item, i) => (
                    <div key={`${item.name}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFE8DF]/50 transition-colors">
                      <ImageWithFallback src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-[#292524] truncate" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>{item.name}</span>
                          <SizeChip size={item.size} />
                        </div>
                        <span className="text-[10px] text-[#57534e]" style={{ fontFamily: "var(--font-mono)" }}>
                          Used in {item.usageCount} look{item.usageCount > 1 ? "s" : ""} · {item.cities.join(", ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFE8DF]">
                  <span className="text-[12px] text-[#57534e]" style={{ fontFamily: "var(--font-body)" }}>
                    {PACKING.length} unique items for {ALL_OUTFITS.length} looks
                  </span>
                </div>
              </div>

              {/* Weather */}
              <div className="bg-white rounded-xl p-6 border border-[#E8DDD4]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <h3 className="text-[18px] text-[#292524] mb-5" style={{ fontFamily: "var(--font-display)" }}>Weather Forecast</h3>
                <div className="space-y-4">
                  {EXAMPLE_CITIES.map((cs) => (
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
                    { icon: "public", label: "Cities", value: `${EXAMPLE_CITIES.length}` },
                    { icon: "style", label: "AI Outfits", value: `${ALL_OUTFITS.length} looks` },
                    { icon: "checkroom", label: "Packing Items", value: `${PACKING.length} pieces` },
                    { icon: "hd", label: "Export Quality", value: "Ultra Hi-Res" },
                    { icon: "refresh", label: "Regenerations", value: "1 included" },
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

              {/* CTA */}
              <div className="bg-[#C4613A] rounded-xl p-6 text-white">
                <h3 className="text-[18px] text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Get Your Own Capsule</h3>
                <p className="text-[13px] text-white/80 mb-4" style={{ fontFamily: "var(--font-body)" }}>
                  Create your personalized multi-city style guide with AI-generated outfits tailored to your body, style preferences, and travel itinerary.
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
    </div>
  );
}

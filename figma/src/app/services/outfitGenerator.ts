/**
 * ─────────────────────────────────────────────────────────────
 *  Travel Capsule AI — Outfit Generation Service
 * ─────────────────────────────────────────────────────────────
 *  This module is the single integration point for AI-powered
 *  outfit generation. In production, each `generate*` function
 *  would POST to the backend API with the user's profile and
 *  receive generated images + metadata.
 *
 *  Current implementation: deterministic mock that selects
 *  pre-curated image sets based on gender, aesthetics, and city.
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════ */
/*  TYPES                                                      */
/* ═══════════════════════════════════════════════════════════ */

export interface UserProfile {
  gender: string;        // "male" | "female" | "non-binary"
  height: string;        // cm
  weight: string;        // kg
  aesthetics: string[];  // ["Casual","Minimalist", ...]
  photo: string;         // base64 data-URL or ""
}

export interface CityInput {
  city: string;
  country: string;
  fromDate: string;
  toDate: string;
}

export interface GeneratedItem {
  id: string;
  name: string;
  desc: string;
  img: string;
  category: "outerwear" | "top" | "bottom" | "shoes" | "accessory";
  recommendedSize: string;
}

export interface GeneratedOutfit {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  /** Full-body outfit photo — in production, AI-generated from user's photo + items */
  image: string;
  items: GeneratedItem[];
  note: string;
  /** 0-100 confidence that this outfit fits the user's profile */
  aiConfidence: number;
  /** Human-readable fit description */
  bodyFitLabel: string;
}

export interface CityOutfitSet {
  city: string;
  country: string;
  dates: string;
  heroImg: string;
  weather: { temp: number; rain: number; wind: number; condition: string };
  outfits: GeneratedOutfit[];
  colorPalette: string[];
  activities: string[];
}

export interface PackingItem {
  id: string;
  name: string;
  img: string;
  category: GeneratedItem["category"];
  recommendedSize: string;
  /** Which outfit IDs use this item */
  usedInOutfits: string[];
  /** How many outfits use this item */
  usageCount: number;
  packed: boolean;
}

/* ═══════════════════════════════════════════════════════════ */
/*  IMAGE POOLS — separated by gender                         */
/* ═══════════════════════════════════════════════════════════ */

const FEMALE_OUTFITS = {
  paris: [
    "https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGVsZWdhbnQlMjBjb2F0JTIwd2Fsa2luZyUyMHBhcmlzJTIwZ29sZGVuJTIwaG91ciUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzM0MTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1667544417110-403b89341112?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdoaXRlJTIwYmxvdXNlJTIwdHVja2VkJTIwbmF2eSUyMHRyb3VzZXJzJTIwZWxlZ2FudCUyMG9mZmljZXxlbnwxfHx8fDE3NzI0Mjk0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1603045720683-5c6840a8eeca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNhbWVsJTIwdHVydGxlbmVjayUyMHN3ZWF0ZXIlMjBjb3p5JTIwYXV0dW1uJTIwd2FybSUyMHRvbmVzfGVufDF8fHx8MTc3MjQyOTQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1653152987833-1c1aa09ab3dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGV2ZW5pbmclMjBkcmVzcyUyMGJsYWNrJTIwZWxlZ2FudCUyMGRpbm5lciUyMHBhcnR5fGVufDF8fHx8MTc3MjQyOTQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  rome: [
    "https://images.unsplash.com/photo-1536967674045-00c29460c1a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGxpbmVuJTIwb3V0Zml0JTIwcm9tZSUyMHRlcnJhY290dGElMjB3YXJtJTIwdG9uZXMlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1551374332-2c48196ae690?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMG92ZXJzaXplZCUyMGJsYXplciUyMHdpZGUlMjBsZWclMjBwYW50cyUyMHN0cmVldCUyMHN0eWxlJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQyOTUwMXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1572030712991-5d489429598a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN1bW1lciUyMGRyZXNzJTIwd2Fsa2luZyUyMGJhcmNlbG9uYSUyMGJlYWNoJTIwYnJlZXplfGVufDF8fHx8MTc3MjQzMzQxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1590493298956-fbfef69619ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGRlbmltJTIwamFja2V0JTIwY2FzdWFsJTIwc3ByaW5nJTIwb3V0Zml0JTIwd2Fsa2luZ3xlbnwxfHx8fDE3NzI0Mjk1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  barcelona: [
    "https://images.unsplash.com/photo-1572030712991-5d489429598a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN1bW1lciUyMGRyZXNzJTIwd2Fsa2luZyUyMGJhcmNlbG9uYSUyMGJlYWNoJTIwYnJlZXplfGVufDF8fHx8MTc3MjQzMzQxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1590493298956-fbfef69619ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGRlbmltJTIwamFja2V0JTIwY2FzdWFsJTIwc3ByaW5nJTIwb3V0Zml0JTIwd2Fsa2luZ3xlbnwxfHx8fDE3NzI0Mjk1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1536967674045-00c29460c1a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGxpbmVuJTIwb3V0Zml0JTIwcm9tZSUyMHRlcnJhY290dGElMjB3YXJtJTIwdG9uZXMlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1653152987833-1c1aa09ab3dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGV2ZW5pbmclMjBkcmVzcyUyMGJsYWNrJTIwZWxlZ2FudCUyMGRpbm5lciUyMHBhcnR5fGVufDF8fHx8MTc3MjQyOTQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  tokyo: [
    "https://images.unsplash.com/photo-1717167172685-374de9c948dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRva3lvJTIwaGFyYWp1a3UlMjBmYXNoaW9uJTIwbWluaW1hbGlzdCUyMG5ldXRyYWwlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGVsZWdhbnQlMjBjb2F0JTIwd2Fsa2luZyUyMHBhcmlzJTIwZ29sZGVuJTIwaG91ciUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzM0MTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1603045720683-5c6840a8eeca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNhbWVsJTIwdHVydGxlbmVjayUyMHN3ZWF0ZXIlMjBjb3p5JTIwYXV0dW1uJTIwd2FybSUyMHRvbmVzfGVufDF8fHx8MTc3MjQyOTQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1667544417110-403b89341112?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdoaXRlJTIwYmxvdXNlJTIwdHVja2VkJTIwbmF2eSUyMHRyb3VzZXJzJTIwZWxlZ2FudCUyMG9mZmljZXxlbnwxfHx8fDE3NzI0Mjk0ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  _default: [
    "https://images.unsplash.com/photo-1677592737288-5ffcf72770d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGVsZWdhbnQlMjBjb2F0JTIwd2Fsa2luZyUyMHBhcmlzJTIwZ29sZGVuJTIwaG91ciUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzM0MTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1536967674045-00c29460c1a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGxpbmVuJTIwb3V0Zml0JTIwcm9tZSUyMHRlcnJhY290dGElMjB3YXJtJTIwdG9uZXMlMjBlZGl0b3JpYWx8ZW58MXx8fHwxNzcyNDMzNDE5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1572030712991-5d489429598a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN1bW1lciUyMGRyZXNzJTIwd2Fsa2luZyUyMGJhcmNlbG9uYSUyMGJlYWNoJTIwYnJlZXplfGVufDF8fHx8MTc3MjQzMzQxNnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1653152987833-1c1aa09ab3dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGV2ZW5pbmclMjBkcmVzcyUyMGJsYWNrJTIwZWxlZ2FudCUyMGRpbm5lciUyMHBhcnR5fGVufDF8fHx8MTc3MjQyOTQ4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
};

const MALE_OUTFITS = {
  paris: [
    "https://images.unsplash.com/photo-1767871893110-f9afbac26294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBjaXR5JTIwc3RyZWV0JTIwZWRpdG9yaWFsJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0MzMzNjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1730338022783-0c1410a6989c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBuYXZ5JTIwYmxhemVyJTIwd2hpdGUlMjBzaGlydCUyMHNtYXJ0JTIwY2FzdWFsJTIwZnVsbCUyMGJvZHl8ZW58MXx8fHwxNzcyNDMzMzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1673173044501-0d75c4f8de62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjYW1lbCUyMHN3ZWF0ZXIlMjBqZWFucyUyMGF1dHVtbiUyMHN0cmVldCUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzMzNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1761335633357-04fab36b333f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkYXJrJTIwc3VpdCUyMGV2ZW5pbmclMjBlbGVnYW50JTIwZGlubmVyJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQzMzM4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  rome: [
    "https://images.unsplash.com/photo-1643574546768-05ef9943b25e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBsaW5lbiUyMHNoaXJ0JTIwcmVsYXhlZCUyMG1lZGl0ZXJyYW5lYW4lMjBzdW1tZXIlMjB3YWxraW5nfGVufDF8fHx8MTc3MjQzMzM4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1589258603808-5381eeb16b94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBsYXllcmVkJTIwb3V0Zml0JTIwZWFydGglMjB0b25lcyUyMHdhbGtpbmclMjBjb2JibGVzdG9uZXxlbnwxfHx8fDE3NzI0MzM0MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1767978185345-93559df463cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjaGlub3MlMjBwb2xvJTIwc2hpcnQlMjBzdW1tZXIlMjBjb2FzdGFsJTIwcmVzb3J0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0MzMzOTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1761335633357-04fab36b333f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkYXJrJTIwc3VpdCUyMGV2ZW5pbmclMjBlbGVnYW50JTIwZGlubmVyJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQzMzM4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  barcelona: [
    "https://images.unsplash.com/photo-1624353656309-8be1a6c457be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkZW5pbSUyMGphY2tldCUyMGNhc3VhbCUyMHNwcmluZyUyMHdhbGtpbmclMjB1cmJhbnxlbnwxfHx8fDE3NzI0MzMzOTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1627361673902-c80df14aecdd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3aGl0ZSUyMHRzaGlydCUyMGNoaW5vcyUyMHNuZWFrZXJzJTIwbWluaW1hbCUyMGNsZWFuJTIwbG9va3xlbnwxfHx8fDE3NzI0MzM0MDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1767978185345-93559df463cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjaGlub3MlMjBwb2xvJTIwc2hpcnQlMjBzdW1tZXIlMjBjb2FzdGFsJTIwcmVzb3J0JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0MzMzOTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1643574546768-05ef9943b25e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBsaW5lbiUyMHNoaXJ0JTIwcmVsYXhlZCUyMG1lZGl0ZXJyYW5lYW4lMjBzdW1tZXIlMjB3YWxraW5nfGVufDF8fHx8MTc3MjQzMzM4NXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  tokyo: [
    "https://images.unsplash.com/photo-1609561812031-24e3312230f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBtaW5pbWFsJTIwb3V0Zml0JTIwdG9reW8lMjBzdHJlZXQlMjBmYXNoaW9uJTIwbmV1dHJhbCUyMHRvbmVzfGVufDF8fHx8MTc3MjQzMzM4OXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1765816839382-1cc1486398d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBib21iZXIlMjBqYWNrZXQlMjB1cmJhbiUyMG5pZ2h0JTIwY2l0eSUyMGxpZ2h0cyUyMGZhc2hpb258ZW58MXx8fHwxNzcyNDMzNDAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1660686935418-22edff8f0625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjB3b29sJTIwb3ZlcmNvYXQlMjB3aW50ZXIlMjBzY2FyZiUyMHN0cmVldCUyMHN0eWxlJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQzMzM5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1730338022783-0c1410a6989c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBuYXZ5JTIwYmxhemVyJTIwd2hpdGUlMjBzaGlydCUyMHNtYXJ0JTIwY2FzdWFsJTIwZnVsbCUyMGJvZHl8ZW58MXx8fHwxNzcyNDMzMzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  ],
  _default: [
    "https://images.unsplash.com/photo-1767871893110-f9afbac26294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBjaXR5JTIwc3RyZWV0JTIwZWRpdG9yaWFsJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0MzMzNjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1730338022783-0c1410a6989c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBuYXZ5JTIwYmxhemVyJTIwd2hpdGUlMjBzaGlydCUyMHNtYXJ0JTIwY2FzdWFsJTIwZnVsbCUyMGJvZHl8ZW58MXx8fHwxNzcyNDMzMzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1673173044501-0d75c4f8de62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjYW1lbCUyMHN3ZWF0ZXIlMjBqZWFucyUyMGF1dHVtbiUyMHN0cmVldCUyMGVkaXRvcmlhbHxlbnwxfHx8fDE3NzI0MzMzNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1761335633357-04fab36b333f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkYXJrJTIwc3VpdCUyMGV2ZW5pbmclMjBlbGVnYW50JTIwZGlubmVyJTIwZWRpdG9yaWFsfGVufDF8fHx8MTc3MjQzMzM4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  ],
};

/* ── Gender-neutral item image pool ── */
const ITEM_IMAGES = {
  trench: "https://images.unsplash.com/photo-1621912911625-c3b08f187953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyZW5jaCUyMGNvYXQlMjBoYW5naW5nJTIwbWluaW1hbGlzdCUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NzI0Mjc1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  blazer: "https://images.unsplash.com/photo-1770294758942-7ce9ca052986?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW5lbiUyMGJsYXplciUyMGJlaWdlJTIwc3VtbWVyJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI5NDk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  cashmere: "https://images.unsplash.com/photo-1642761589121-ec47d4c425ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb2xkZWQlMjBjYXNobWVyZSUyMHN3ZWF0ZXIlMjBjcmVhbSUyMG5ldXRyYWwlMjBtaW5pbWFsJTIwZmxhdGxheXxlbnwxfHx8fDE3NzI0Mjk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  silkBlouse: "https://images.unsplash.com/photo-1606603049788-24284ce70986?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWxrJTIwYmxvdXNlJTIwY3JlYW0lMjBpdm9yeSUyMGhhbmdlciUyMGVsZWdhbnR8ZW58MXx8fHwxNzcyNDI5NDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  trousers: "https://images.unsplash.com/photo-1738520420640-5818ce094b4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWlsb3JlZCUyMHdvb2wlMjB0cm91c2VycyUyMGdyZXklMjBmYXNoaW9uJTIwZWRpdG9yaWFsJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzI0Mjk0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  denim: "https://images.unsplash.com/photo-1768851511869-b26ab0bbb5fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwZGVuaW0lMjBqZWFucyUyMGZvbGRlZCUyMGZhc2hpb258ZW58MXx8fHwxNzcyNDI2NjExfDA&ixlib=rb-4.1.0&q=80&w=1080",
  boots: "https://images.unsplash.com/photo-1737877398292-8762dd7b0907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYW5rbGUlMjBib290cyUyMGJyb3duJTIwZmFzaGlvbiUyMHByb2R1Y3QlMjBzdGlsbCUyMGxpZmV8ZW58MXx8fHwxNzcyNDI5NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  loafers: "https://images.unsplash.com/photo-1771965056079-92b0ce6d4601?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwbG9hZmVycyUyMHdhcm0lMjB3b29kJTIwZmxvb3IlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  sneakers: "https://images.unsplash.com/photo-1663151860122-4890a08dc22b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwY2xlYW4lMjBtaW5pbWFsJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI5NTAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  espadrilles: "https://images.unsplash.com/photo-1594520770886-6910adf052c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3BhZHJpbGxlJTIwc2hvZXMlMjBzdW1tZXIlMjB3b3ZlbiUyMG5hdHVyYWx8ZW58MXx8fHwxNzcyNDI5NDk3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  breton: "https://images.unsplash.com/photo-1681473691223-985c6e1f16a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJpcGVkJTIwYnJldG9uJTIwdG9wJTIwbmF2eSUyMHdoaXRlJTIwZnJlbmNoJTIwc3R5bGV8ZW58MXx8fHwxNzcyNDI5NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  scarf: "https://images.unsplash.com/photo-1638256049278-0899dbe29aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXNobWVyZSUyMHNjYXJmJTIwZm9sZGVkJTIwd2FybSUyMG5ldXRyYWwlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDI3NTg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  bag: "https://images.unsplash.com/photo-1574274560399-d242e212c916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWRkbGUlMjBsZWF0aGVyJTIwYmFnJTIwc3RpbGwlMjBsaWZlJTIwd2FybSUyMHRvbmV8ZW58MXx8fHwxNzcyNDI3NjAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  tote: "https://images.unsplash.com/photo-1757863971866-0b4e2f2ab6ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW52YXMlMjB0b3RlJTIwYmFnJTIwYmVhY2glMjBzdW1tZXIlMjBuYXR1cmFsJTIwZmFicmljfGVufDF8fHx8MTc3MjQyOTQ5NXww&ixlib=rb-4.1.0&q=80&w=1080",
  earrings: "https://images.unsplash.com/photo-1704637397679-f37e5e0dc429?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwaG9vcCUyMGVhcnJpbmdzJTIwamV3ZWxyeSUyMG1pbmltYWwlMjBlbGVnYW50fGVufDF8fHx8MTc3MjQyOTQ4OXww&ixlib=rb-4.1.0&q=80&w=1080",
  sunglasses: "https://images.unsplash.com/photo-1768324969832-006528e23d0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwc3VuZ2xhc3NlcyUyMGdvbGRlbiUyMGxpZ2h0JTIwZmlsbSUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NzI0Mjc1OTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  watch: "https://images.unsplash.com/photo-1758887953059-ca6f8e454207?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRjaCUyMG1pbmltYWwlMjBsZWF0aGVyJTIwc3RyYXAlMjB3cmlzdCUyMGZhc2hpb24lMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzcyNDI5NTAzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  hat: "https://images.unsplash.com/photo-1752014364743-e80acc2c9b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5hbWElMjBzdHJhdyUyMGhhdCUyMGZhc2hpb24lMjBzdW1tZXIlMjBlbGVnYW50fGVufDF8fHx8MTc3MjQyOTQ5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  belt: "https://images.unsplash.com/photo-1764737719221-1776b8077d79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjBiZWx0JTIwc2lsdmVyJTIwYnVja2xlJTIwZmFzaGlvbiUyMGFjY2Vzc29yeSUyMG1pbmltYWx8ZW58MXx8fHwxNzcyNDI5NTAyfDA&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ═══════════════════════════════════════════════════════════ */
/*  OUTFIT TEMPLATES — per city, per "vibe"                    */
/* ═══════════════════════════════════════════════════════════ */

interface OutfitTemplate {
  title: string;
  subtitle: string;
  note: string;
  items: { key: keyof typeof ITEM_IMAGES; name: string; desc: string; category: GeneratedItem["category"] }[];
}

const TEMPLATES: Record<string, OutfitTemplate[]> = {
  paris: [
    { title: "Arrival & Exploration", subtitle: "Classic Layering", note: "A polished layering approach for navigating Paris's unpredictable spring weather — protective yet effortlessly Parisian.", items: [
      { key: "trench", name: "Classic Trench", desc: "Water-resistant, beige", category: "outerwear" },
      { key: "breton", name: "Breton Top", desc: "Navy/white stripe", category: "top" },
      { key: "denim", name: "Straight Denim", desc: "Medium wash", category: "bottom" },
      { key: "boots", name: "Ankle Boots", desc: "Brown leather", category: "shoes" },
    ]},
    { title: "Le Marais Gallery Walk", subtitle: "Smart Casual", note: "Gallery-ready sophistication. The silk-wool pairing bridges art openings and afternoon espressos in the Marais.", items: [
      { key: "silkBlouse", name: "Silk Blouse", desc: "Ivory, relaxed fit", category: "top" },
      { key: "trousers", name: "Wool Trousers", desc: "Charcoal, tapered", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Cognac, hand-stitched", category: "shoes" },
      { key: "earrings", name: "Gold Earrings", desc: "Minimal hoops", category: "accessory" },
    ]},
    { title: "Musee & Montmartre", subtitle: "Cozy Intellectual", note: "Warm tones for hours in temperature-controlled museums, transitioning seamlessly to Montmartre's cobblestone streets.", items: [
      { key: "cashmere", name: "Cashmere Knit", desc: "Camel, crew neck", category: "top" },
      { key: "denim", name: "Straight Denim", desc: "Medium wash", category: "bottom" },
      { key: "scarf", name: "Wool Scarf", desc: "Terracotta knit", category: "accessory" },
      { key: "boots", name: "Ankle Boots", desc: "Brown leather", category: "shoes" },
    ]},
    { title: "Evening Dinner", subtitle: "Parisian Elegance", note: "Refined evening look for a bistro dinner — the trench worn cape-style adds a distinctly Parisian finishing touch.", items: [
      { key: "silkBlouse", name: "Silk Blouse", desc: "Tucked, sleek styling", category: "top" },
      { key: "trousers", name: "Wool Trousers", desc: "High-waist, charcoal", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Black, polished", category: "shoes" },
      { key: "trench", name: "Classic Trench", desc: "Draped over shoulders", category: "outerwear" },
    ]},
  ],
  rome: [
    { title: "Colosseum Morning", subtitle: "Mediterranean Ease", note: "Sun-kissed terracotta hues meet relaxed Mediterranean tailoring. Light layers for warm Roman mornings.", items: [
      { key: "blazer", name: "Linen Blazer", desc: "Sand, unstructured", category: "outerwear" },
      { key: "breton", name: "Breton Top", desc: "Classic stripe", category: "top" },
      { key: "denim", name: "Slim Chinos", desc: "Stone wash", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Cognac", category: "shoes" },
    ]},
    { title: "Trastevere Stroll", subtitle: "Rustic Elegance", note: "Navigate cobblestones in effortless Italian style. The crossbody keeps hands free for gelato.", items: [
      { key: "cashmere", name: "Linen Tee", desc: "Olive, relaxed", category: "top" },
      { key: "trousers", name: "Wide-leg Trousers", desc: "Ecru, linen blend", category: "bottom" },
      { key: "espadrilles", name: "Espadrilles", desc: "Woven jute", category: "shoes" },
      { key: "bag", name: "Crossbody Bag", desc: "Saddle leather", category: "accessory" },
    ]},
    { title: "Vatican & Culture", subtitle: "Smart Layering", note: "Modest yet fashionable coverage for religious sites. Structured pieces command respect.", items: [
      { key: "trench", name: "Light Overcoat", desc: "Draped, khaki", category: "outerwear" },
      { key: "silkBlouse", name: "Cotton Blouse", desc: "Cream, long sleeve", category: "top" },
      { key: "trousers", name: "Tailored Trousers", desc: "Navy", category: "bottom" },
      { key: "loafers", name: "Loafers", desc: "Dark brown", category: "shoes" },
    ]},
    { title: "Rooftop Aperitivo", subtitle: "Sunset Glamour", note: "Golden hour demands golden accessories. A refined yet relaxed evening look for Roman rooftop bars.", items: [
      { key: "blazer", name: "Linen Blazer", desc: "Camel, rolled cuffs", category: "outerwear" },
      { key: "silkBlouse", name: "Silk Camisole", desc: "Champagne", category: "top" },
      { key: "denim", name: "Dark Jeans", desc: "Slim, indigo", category: "bottom" },
      { key: "sunglasses", name: "Sunglasses", desc: "Tortoise aviator", category: "accessory" },
    ]},
  ],
  barcelona: [
    { title: "Gothic Quarter Wander", subtitle: "Urban Coastal", note: "Effortless coastal cool with structure. Breathable fabrics in sandy neutrals and warm terracotta.", items: [
      { key: "blazer", name: "Denim Jacket", desc: "Light wash", category: "outerwear" },
      { key: "breton", name: "Striped Tee", desc: "Red/white", category: "top" },
      { key: "denim", name: "Chino Shorts", desc: "Beige", category: "bottom" },
      { key: "sneakers", name: "White Sneakers", desc: "Clean, minimal", category: "shoes" },
    ]},
    { title: "Sagrada Familia Visit", subtitle: "Art Nouveau Chic", note: "Gaudi's masterpiece calls for equally creative dressing — structured pieces with artistic flair.", items: [
      { key: "cashmere", name: "Cotton Knit", desc: "Terracotta", category: "top" },
      { key: "trousers", name: "Wide-leg Pants", desc: "Cream linen", category: "bottom" },
      { key: "espadrilles", name: "Espadrilles", desc: "Natural canvas", category: "shoes" },
      { key: "hat", name: "Panama Hat", desc: "Straw, wide brim", category: "accessory" },
    ]},
    { title: "Barceloneta Beach", subtitle: "Sandy Minimalism", note: "Beach to brunch transition. The tote carries everything from towels to tapas-worthy accessories.", items: [
      { key: "silkBlouse", name: "Linen Shirt", desc: "White, oversized", category: "top" },
      { key: "denim", name: "Swim Shorts", desc: "Navy", category: "bottom" },
      { key: "sneakers", name: "Slides", desc: "Leather, tan", category: "shoes" },
      { key: "tote", name: "Canvas Tote", desc: "Natural", category: "accessory" },
    ]},
    { title: "El Born Tapas Crawl", subtitle: "Evening Glow", note: "Tapas bars demand effortless style. A watch and sunglasses are the only accessories needed.", items: [
      { key: "blazer", name: "Cotton Blazer", desc: "Olive green", category: "outerwear" },
      { key: "cashmere", name: "Henley Tee", desc: "Cream", category: "top" },
      { key: "trousers", name: "Slim Chinos", desc: "Charcoal", category: "bottom" },
      { key: "watch", name: "Leather Watch", desc: "Brown strap, gold", category: "accessory" },
    ]},
  ],
  tokyo: [
    { title: "Shinjuku Arrival", subtitle: "Jet-Set Minimal", note: "Clean lines and neutral tones navigate Tokyo's neon-lit streets. Layer-ready for shifting temperatures.", items: [
      { key: "trench", name: "Light Overcoat", desc: "Black, structured", category: "outerwear" },
      { key: "cashmere", name: "Merino Crew", desc: "Charcoal", category: "top" },
      { key: "trousers", name: "Slim Trousers", desc: "Black, tapered", category: "bottom" },
      { key: "sneakers", name: "White Sneakers", desc: "Clean, minimal", category: "shoes" },
    ]},
    { title: "Shibuya Exploration", subtitle: "Urban Edge", note: "Shibuya's energy calls for bold confidence. The bomber bridges streetwear and sophistication.", items: [
      { key: "blazer", name: "Bomber Jacket", desc: "Navy, lightweight", category: "outerwear" },
      { key: "breton", name: "Graphic Tee", desc: "Vintage, cream", category: "top" },
      { key: "denim", name: "Straight Denim", desc: "Dark wash", category: "bottom" },
      { key: "boots", name: "Chelsea Boots", desc: "Black leather", category: "shoes" },
    ]},
    { title: "Harajuku Street Fashion", subtitle: "Creative Layer", note: "Harajuku rewards individuality. Mix textures and proportions for this fashion-forward neighborhood.", items: [
      { key: "cashmere", name: "Oversized Knit", desc: "Oatmeal", category: "top" },
      { key: "trousers", name: "Wide Cropped Pants", desc: "Olive", category: "bottom" },
      { key: "sneakers", name: "Platform Sneakers", desc: "White/gum", category: "shoes" },
      { key: "bag", name: "Crossbody Bag", desc: "Black nylon", category: "accessory" },
    ]},
    { title: "Omotesando Cafes", subtitle: "Polished Minimal", note: "Omotesando's architectural elegance demands equally refined dressing. Less is more.", items: [
      { key: "blazer", name: "Unstructured Blazer", desc: "Camel", category: "outerwear" },
      { key: "silkBlouse", name: "Silk Shirt", desc: "Ivory", category: "top" },
      { key: "trousers", name: "Pleated Trousers", desc: "Light grey", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Cognac", category: "shoes" },
    ]},
  ],
};

/* ═══════════════════════════════════════════════════════════ */
/*  SIZE RECOMMENDATION ENGINE                                 */
/* ═══════════════════════════════════════════════════════════ */

function recommendSize(
  category: GeneratedItem["category"],
  gender: string,
  height: string,
  weight: string,
): string {
  const h = parseInt(height) || 170;
  const w = parseInt(weight) || 65;
  const bmi = w / ((h / 100) ** 2);

  /**
   * PRODUCTION NOTE:
   * Replace this heuristic with the ML sizing model endpoint:
   *   POST /api/v1/sizing/recommend
   *   { gender, heightCm, weightKg, category, photoAnalysis }
   */

  const g = gender === "male" ? "m" : "f";

  if (category === "shoes") {
    if (g === "m") return h < 175 ? "EU 41" : h < 185 ? "EU 43" : "EU 45";
    return h < 165 ? "EU 37" : h < 175 ? "EU 39" : "EU 41";
  }

  // Clothing sizes
  if (g === "m") {
    if (bmi < 20) return "S";
    if (bmi < 24) return h > 180 ? "L" : "M";
    if (bmi < 28) return "L";
    return "XL";
  }
  // female / non-binary
  if (bmi < 19) return "XS";
  if (bmi < 22) return "S";
  if (bmi < 26) return "M";
  if (bmi < 30) return "L";
  return "XL";
}

function buildBodyFitLabel(profile: UserProfile): string {
  const h = parseInt(profile.height) || 0;
  const w = parseInt(profile.weight) || 0;
  const gender = profile.gender || "female";
  const gLabel = gender === "male" ? "Male" : gender === "non-binary" ? "Non-binary" : "Female";

  if (!h && !w) return `Styled for ${gLabel} · ${profile.aesthetics[0] || "Classic"} preference`;

  const bmi = w / ((h / 100) ** 2);
  let build = "average";
  if (gender === "male") {
    if (bmi < 20) build = "lean";
    else if (bmi > 25) build = "athletic";
  } else {
    if (bmi < 19) build = "petite";
    else if (bmi > 25) build = "curvy";
  }

  return `Tailored for ${gLabel} · ${h}cm · ${build} build`;
}

/* ═══════════════════════════════════════════════════════════ */
/*  PUBLIC API                                                 */
/* ═══════════════════════════════════════════════════════════ */

function getOutfitImages(gender: string, cityKey: string): string[] {
  const pool = gender === "male" ? MALE_OUTFITS : FEMALE_OUTFITS;
  const key = cityKey.toLowerCase() as keyof typeof pool;
  return pool[key] || pool._default;
}

function getTemplates(cityKey: string): OutfitTemplate[] {
  const key = cityKey.toLowerCase();
  return TEMPLATES[key] || TEMPLATES.paris;
}

/**
 * Generate outfits for a single city.
 *
 * PRODUCTION:
 *   POST /api/v1/outfits/generate
 *   Body: { profile: UserProfile, city: CityInput, count: number }
 *   Returns: GeneratedOutfit[] with AI-synthesized full-body images
 */
export function generateCityOutfits(
  profile: UserProfile,
  city: CityInput,
  count: number = 4,
): GeneratedOutfit[] {
  const gender = profile.gender || "female";
  const cityKey = city.city.toLowerCase();
  const images = getOutfitImages(gender, cityKey);
  const templates = getTemplates(cityKey);
  const bodyFitLabel = buildBodyFitLabel(profile);

  return templates.slice(0, count).map((tpl, i) => ({
    id: `${cityKey}-outfit-${i + 1}`,
    day: i + 1,
    title: tpl.title,
    subtitle: tpl.subtitle,
    image: images[i % images.length],
    items: tpl.items.map((item, j) => ({
      id: `${cityKey}-item-${i}-${j}`,
      name: item.name,
      desc: item.desc,
      img: ITEM_IMAGES[item.key],
      category: item.category,
      recommendedSize: recommendSize(item.category, gender, profile.height, profile.weight),
    })),
    note: tpl.note,
    aiConfidence: 85 + Math.floor(Math.random() * 12),
    bodyFitLabel,
  }));
}

/**
 * Generate outfits by calling the real Worker API, with deterministic fallback.
 */
export async function generateOutfitsFromAPI(
  profile: UserProfile,
  cities: CityInput[],
  plan: 'standard' | 'pro',
  tripId?: string
): Promise<GeneratedOutfit[]> {
  const { apiPost } = await import('../lib/api')
  try {
    const result = await apiPost<{ outfits: GeneratedOutfit[] }>('/api/result/' + (tripId || 'demo'), {})
    return result.outfits || generateCityOutfits(profile, cities[0], 4)
  } catch {
    // Fall back to deterministic mock if API unavailable
    return generateCityOutfits(profile, cities[0], 4)
  }
}

/**
 * Derive a consolidated packing list from multiple outfit sets.
 * Items used across outfits are deduplicated and tagged with usage count.
 */
export function derivePacking(allOutfits: GeneratedOutfit[]): PackingItem[] {
  const map = new Map<string, PackingItem>();

  allOutfits.forEach((outfit) => {
    outfit.items.forEach((item) => {
      const existing = map.get(item.name);
      if (existing) {
        if (!existing.usedInOutfits.includes(outfit.id)) {
          existing.usedInOutfits.push(outfit.id);
          existing.usageCount++;
        }
      } else {
        map.set(item.name, {
          id: item.id,
          name: item.name,
          img: item.img,
          category: item.category,
          recommendedSize: item.recommendedSize,
          usedInOutfits: [outfit.id],
          usageCount: 1,
          packed: false,
        });
      }
    });
  });

  // Sort: most-used items first, then alphabetically
  return Array.from(map.values()).sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));
}

/**
 * Build the user profile object from onboarding data.
 */
export function buildProfile(data: {
  gender: string;
  height: string;
  weight: string;
  aesthetics: string[];
  photo: string;
}): UserProfile {
  return {
    gender: data.gender || "female",
    height: data.height,
    weight: data.weight,
    aesthetics: data.aesthetics,
    photo: data.photo,
  };
}

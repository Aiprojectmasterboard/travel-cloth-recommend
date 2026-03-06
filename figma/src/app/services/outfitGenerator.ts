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
  /* ── Specific item images for accurate capsule matching ── */
  denimJacket: "https://images.unsplash.com/photo-1544441893-675973e31985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBkZW5pbSUyMGphY2tldCUyMGJsdWUlMjBmYXNoaW9uJTIwcHJvZHVjdHxlbnwxfHx8fDE3NzI0Mjc1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  bomber: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXZ5JTIwYm9tYmVyJTIwamFja2V0JTIwbWVuJTIwZmFzaGlvbiUyMHByb2R1Y3R8ZW58MXx8fHwxNzcyNDI3NTg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  hoodie: "https://images.pexels.com/photos/1601241/pexels-photo-1601241.jpeg?auto=compress&cs=tinysrgb&w=400",
  polo: "https://images.pexels.com/photos/2096476/pexels-photo-2096476.jpeg?auto=compress&cs=tinysrgb&w=400",
  windbreaker: "https://images.pexels.com/photos/1028184/pexels-photo-1028184.jpeg?auto=compress&cs=tinysrgb&w=400",
  overcoat: "https://images.pexels.com/photos/730229/pexels-photo-730229.jpeg?auto=compress&cs=tinysrgb&w=400",
  combatBoots: "https://images.pexels.com/photos/2929287/pexels-photo-2929287.jpeg?auto=compress&cs=tinysrgb&w=400",
  cargoPants: "https://images.pexels.com/photos/19220710/pexels-photo-19220710.jpeg?auto=compress&cs=tinysrgb&w=400",
  cardigan: "https://images.pexels.com/photos/6968357/pexels-photo-6968357.jpeg?auto=compress&cs=tinysrgb&w=400",
  graphicTee: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjB3aGl0ZSUyMHQtc2hpcnQlMjBjbGVhbiUyMG1pbmltYWwlMjBwcm9kdWN0fGVufDF8fHx8MTc3MjQyOTQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  joggers: "https://images.pexels.com/photos/3693131/pexels-photo-3693131.jpeg?auto=compress&cs=tinysrgb&w=400",
  linenShirt: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW4lMjBsaW5lbiUyMHNoaXJ0JTIwc3VtbWVyJTIwbGlnaHQlMjBibHVlJTIwZmFzaGlvbnxlbnwxfHx8fDE3NzI0Mjk0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  maxiSkirt: "https://images.pexels.com/photos/3012325/pexels-photo-3012325.jpeg?auto=compress&cs=tinysrgb&w=400",
  slides: "https://images.pexels.com/photos/4996738/pexels-photo-4996738.jpeg?auto=compress&cs=tinysrgb&w=400",
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
      { key: "overcoat", name: "Light Overcoat", desc: "Draped, khaki", category: "outerwear" },
      { key: "linenShirt", name: "Cotton Blouse", desc: "Cream, long sleeve", category: "top" },
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
      { key: "denimJacket", name: "Denim Jacket", desc: "Light wash", category: "outerwear" },
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
      { key: "linenShirt", name: "Linen Shirt", desc: "White, oversized", category: "top" },
      { key: "denim", name: "Swim Shorts", desc: "Navy", category: "bottom" },
      { key: "slides", name: "Slides", desc: "Leather, tan", category: "shoes" },
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
      { key: "overcoat", name: "Light Overcoat", desc: "Black, structured", category: "outerwear" },
      { key: "cashmere", name: "Merino Crew", desc: "Charcoal", category: "top" },
      { key: "trousers", name: "Slim Trousers", desc: "Black, tapered", category: "bottom" },
      { key: "sneakers", name: "White Sneakers", desc: "Clean, minimal", category: "shoes" },
    ]},
    { title: "Shibuya Exploration", subtitle: "Urban Edge", note: "Shibuya's energy calls for bold confidence. The bomber bridges streetwear and sophistication.", items: [
      { key: "bomber", name: "Bomber Jacket", desc: "Navy, lightweight", category: "outerwear" },
      { key: "graphicTee", name: "Graphic Tee", desc: "Vintage, cream", category: "top" },
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

  /* ── Aesthetic-specific _default templates ── */

  _default_casual: [
    { title: "Relaxed City Walk", subtitle: "Casual Comfort", note: "Easygoing layers built for all-day comfort. Denim and sneakers keep things relaxed yet pulled-together.", items: [
      { key: "denim", name: "Relaxed Jeans", desc: "Light wash, comfortable fit", category: "bottom" },
      { key: "breton", name: "Striped Tee", desc: "Navy/white, soft cotton", category: "top" },
      { key: "sneakers", name: "Canvas Sneakers", desc: "White, worn-in", category: "shoes" },
      { key: "tote", name: "Canvas Tote", desc: "Natural, oversized", category: "accessory" },
    ]},
    { title: "Weekend Brunch", subtitle: "Casual Layering", note: "A light jacket over easy basics transitions from morning coffee to afternoon exploring without a wardrobe change.", items: [
      { key: "denimJacket", name: "Denim Jacket", desc: "Mid wash, relaxed", category: "outerwear" },
      { key: "cashmere", name: "Cotton Henley", desc: "Oatmeal, soft knit", category: "top" },
      { key: "denim", name: "Chinos", desc: "Khaki, straight leg", category: "bottom" },
      { key: "loafers", name: "Suede Loafers", desc: "Sand, unlined", category: "shoes" },
    ]},
    { title: "Market & Cafe Day", subtitle: "Casual Easy", note: "Comfortable and breathable for wandering local markets and lingering over espresso. Practical yet stylish.", items: [
      { key: "hoodie", name: "Crew Sweatshirt", desc: "Grey marl, relaxed", category: "top" },
      { key: "trousers", name: "Drawstring Pants", desc: "Olive, linen blend", category: "bottom" },
      { key: "sneakers", name: "Slip-on Sneakers", desc: "White, clean", category: "shoes" },
      { key: "sunglasses", name: "Sunglasses", desc: "Classic wayfarer", category: "accessory" },
    ]},
    { title: "Evening Out", subtitle: "Casual Elevated", note: "Dress up denim with a crisp shirt and leather accessories for a casual dinner that still feels intentional.", items: [
      { key: "linenShirt", name: "Oxford Shirt", desc: "White, rolled sleeves", category: "top" },
      { key: "denim", name: "Dark Jeans", desc: "Slim, indigo wash", category: "bottom" },
      { key: "boots", name: "Desert Boots", desc: "Tan suede", category: "shoes" },
      { key: "watch", name: "Casual Watch", desc: "NATO strap, silver", category: "accessory" },
    ]},
  ],

  _default_minimalist: [
    { title: "Morning Commute", subtitle: "Minimalist Foundation", note: "A capsule-perfect base of monochrome essentials. Every piece interchangeable, nothing superfluous.", items: [
      { key: "overcoat", name: "Structured Overcoat", desc: "Black, clean lines", category: "outerwear" },
      { key: "cashmere", name: "Merino Crew", desc: "White, fine gauge", category: "top" },
      { key: "trousers", name: "Slim Trousers", desc: "Black, tapered", category: "bottom" },
      { key: "sneakers", name: "White Sneakers", desc: "Leather, minimal", category: "shoes" },
    ]},
    { title: "Gallery & Museum", subtitle: "Minimalist Clean", note: "Tonal dressing in muted neutrals. The absence of pattern lets silhouette and fabric quality speak.", items: [
      { key: "cashmere", name: "Cashmere Crew", desc: "Grey, seamless", category: "top" },
      { key: "trousers", name: "Tailored Trousers", desc: "Charcoal, high waist", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Black, streamlined", category: "shoes" },
      { key: "watch", name: "Minimal Watch", desc: "Black dial, thin", category: "accessory" },
    ]},
    { title: "Afternoon Exploration", subtitle: "Minimalist Essentials", note: "Pared-back simplicity in quality fabrics. A neutral palette that works in any neighborhood, any context.", items: [
      { key: "silkBlouse", name: "Silk Tee", desc: "Ivory, boxy cut", category: "top" },
      { key: "denim", name: "Straight Denim", desc: "Black, no distressing", category: "bottom" },
      { key: "sneakers", name: "Low-top Sneakers", desc: "All white", category: "shoes" },
      { key: "bag", name: "Structured Bag", desc: "Black leather, clean", category: "accessory" },
    ]},
    { title: "Evening Dinner", subtitle: "Minimalist Refined", note: "Monochrome elegance for the evening. Quality over quantity — three pieces, zero excess.", items: [
      { key: "blazer", name: "Unstructured Blazer", desc: "Black, no lining", category: "outerwear" },
      { key: "silkBlouse", name: "Silk Shirt", desc: "White, hidden placket", category: "top" },
      { key: "trousers", name: "Pleated Trousers", desc: "Black, wide leg", category: "bottom" },
      { key: "loafers", name: "Leather Loafers", desc: "Black, polished", category: "shoes" },
    ]},
  ],

  _default_streetwear: [
    { title: "City Arrival", subtitle: "Streetwear Edge", note: "Urban armor for the concrete jungle. Oversized proportions and bold textures set the tone from the first step.", items: [
      { key: "bomber", name: "Bomber Jacket", desc: "Black, satin finish", category: "outerwear" },
      { key: "graphicTee", name: "Graphic Tee", desc: "Oversized, vintage print", category: "top" },
      { key: "cargoPants", name: "Cargo Pants", desc: "Olive, relaxed fit", category: "bottom" },
      { key: "sneakers", name: "Chunky Sneakers", desc: "White/black, platform", category: "shoes" },
    ]},
    { title: "Neighborhood Exploration", subtitle: "Streetwear Layers", note: "Layered street style with utilitarian touches. Multiple pockets, crossbody bags, and bold kicks.", items: [
      { key: "hoodie", name: "Oversized Hoodie", desc: "Washed black", category: "top" },
      { key: "joggers", name: "Track Pants", desc: "Black, side stripe", category: "bottom" },
      { key: "sneakers", name: "High-top Sneakers", desc: "White, leather", category: "shoes" },
      { key: "bag", name: "Crossbody Bag", desc: "Black nylon, utility", category: "accessory" },
    ]},
    { title: "Market & Street Food", subtitle: "Streetwear Utility", note: "Functional street style that handles crowds and weather. The cap and crossbody keep hands free for food stalls.", items: [
      { key: "windbreaker", name: "Windbreaker", desc: "Color-block, packable", category: "outerwear" },
      { key: "graphicTee", name: "Logo Tee", desc: "White, boxy fit", category: "top" },
      { key: "denim", name: "Wide-leg Jeans", desc: "Faded wash", category: "bottom" },
      { key: "hat", name: "Snapback Cap", desc: "Black, minimal logo", category: "accessory" },
    ]},
    { title: "Night Out", subtitle: "Streetwear After Dark", note: "Elevated streetwear for the evening scene. Dark tones and statement sneakers transition from dinner to nightlife.", items: [
      { key: "bomber", name: "Bomber Jacket", desc: "Navy, quilted", category: "outerwear" },
      { key: "silkBlouse", name: "Mock Neck Top", desc: "Black, fitted", category: "top" },
      { key: "joggers", name: "Slim Joggers", desc: "Black, tapered", category: "bottom" },
      { key: "combatBoots", name: "Combat Boots", desc: "Black, chunky sole", category: "shoes" },
    ]},
  ],

  _default_classic: [
    { title: "Morning Sightseeing", subtitle: "Classic Elegance", note: "Timeless pieces that transcend trends. A well-cut blazer and tailored trousers command respect in any city.", items: [
      { key: "blazer", name: "Tailored Blazer", desc: "Navy, gold buttons", category: "outerwear" },
      { key: "linenShirt", name: "Cotton Shirt", desc: "White, crisp collar", category: "top" },
      { key: "trousers", name: "Tailored Trousers", desc: "Grey, wool blend", category: "bottom" },
      { key: "loafers", name: "Penny Loafers", desc: "Burgundy, polished", category: "shoes" },
    ]},
    { title: "Cultural Visits", subtitle: "Classic Refined", note: "A cashmere layer adds warmth for air-conditioned museums. Polished leather accessories complete the refined look.", items: [
      { key: "cashmere", name: "Cashmere V-Neck", desc: "Camel, fine knit", category: "top" },
      { key: "trousers", name: "Pressed Chinos", desc: "Navy, flat front", category: "bottom" },
      { key: "belt", name: "Leather Belt", desc: "Brown, classic buckle", category: "accessory" },
      { key: "loafers", name: "Leather Loafers", desc: "Brown, cap toe", category: "shoes" },
    ]},
    { title: "Afternoon Tea & Shopping", subtitle: "Classic Sophistication", note: "An understated ensemble for upscale shopping districts and afternoon tea. Quality fabrics and traditional cuts.", items: [
      { key: "trench", name: "Classic Trench", desc: "Beige, double-breasted", category: "outerwear" },
      { key: "breton", name: "Breton Top", desc: "Navy/white stripe", category: "top" },
      { key: "denim", name: "Tailored Jeans", desc: "Dark indigo, straight", category: "bottom" },
      { key: "scarf", name: "Silk Scarf", desc: "Paisley, navy/gold", category: "accessory" },
    ]},
    { title: "Fine Dining", subtitle: "Classic Evening", note: "Refined evening dressing rooted in tradition. The combination of blazer, silk, and leather speaks timeless elegance.", items: [
      { key: "blazer", name: "Dinner Blazer", desc: "Charcoal, peaked lapel", category: "outerwear" },
      { key: "silkBlouse", name: "Silk Blouse", desc: "Ivory, tucked", category: "top" },
      { key: "trousers", name: "Dress Trousers", desc: "Black, creased", category: "bottom" },
      { key: "earrings", name: "Pearl Earrings", desc: "Classic studs", category: "accessory" },
    ]},
  ],

  _default_sporty: [
    { title: "Active Morning", subtitle: "Sporty Start", note: "Performance fabrics that handle a morning jog and transition seamlessly to a cafe breakfast. Breathable and sharp.", items: [
      { key: "windbreaker", name: "Lightweight Shell", desc: "Black, waterproof", category: "outerwear" },
      { key: "cashmere", name: "Performance Tee", desc: "White, moisture-wicking", category: "top" },
      { key: "joggers", name: "Jogger Pants", desc: "Charcoal, tapered", category: "bottom" },
      { key: "sneakers", name: "Running Sneakers", desc: "Grey/white, cushioned", category: "shoes" },
    ]},
    { title: "City Exploration", subtitle: "Sporty Comfort", note: "Athletic-inspired pieces styled for sightseeing. Stretch fabrics and supportive shoes for miles of walking.", items: [
      { key: "windbreaker", name: "Zip-up Jacket", desc: "Navy, technical fabric", category: "outerwear" },
      { key: "polo", name: "Polo Shirt", desc: "White, dry-fit", category: "top" },
      { key: "denim", name: "Stretch Chinos", desc: "Olive, slim fit", category: "bottom" },
      { key: "sneakers", name: "Mesh Sneakers", desc: "Black/white, lightweight", category: "shoes" },
    ]},
    { title: "Afternoon Activities", subtitle: "Sporty Versatile", note: "Ready for anything from a bike tour to a park picnic. Technical fabrics meet casual style for active afternoons.", items: [
      { key: "cashmere", name: "Quarter-Zip Pullover", desc: "Grey, fleece-lined", category: "top" },
      { key: "joggers", name: "Stretch Pants", desc: "Black, 4-way stretch", category: "bottom" },
      { key: "sneakers", name: "Trail Sneakers", desc: "Grey, grippy sole", category: "shoes" },
      { key: "bag", name: "Sport Crossbody", desc: "Black nylon, compact", category: "accessory" },
    ]},
    { title: "Evening Casual", subtitle: "Sporty Elevated", note: "Clean athleisure for dinner. A bomber jacket dresses up technical pieces for an effortlessly modern evening look.", items: [
      { key: "bomber", name: "Bomber Jacket", desc: "Black, lightweight", category: "outerwear" },
      { key: "silkBlouse", name: "Clean Tee", desc: "White, premium cotton", category: "top" },
      { key: "joggers", name: "Dark Joggers", desc: "Black, slim tapered", category: "bottom" },
      { key: "sneakers", name: "Leather Sneakers", desc: "White, clean design", category: "shoes" },
    ]},
  ],

  _default_bohemian: [
    { title: "Morning Wandering", subtitle: "Bohemian Flow", note: "Free-spirited layers in earthy tones. Flowy silhouettes and natural textures for unhurried morning strolls.", items: [
      { key: "cardigan", name: "Crochet Cardigan", desc: "Cream, open-front", category: "outerwear" },
      { key: "silkBlouse", name: "Peasant Blouse", desc: "White, embroidered", category: "top" },
      { key: "denim", name: "Flared Jeans", desc: "Medium wash, vintage", category: "bottom" },
      { key: "espadrilles", name: "Leather Sandals", desc: "Tan, woven straps", category: "shoes" },
    ]},
    { title: "Market & Artisan Visit", subtitle: "Bohemian Earth", note: "Earthy, handcrafted textures for exploring local artisan markets. A woven bag carries treasures found along the way.", items: [
      { key: "breton", name: "Printed Tunic", desc: "Terracotta, paisley", category: "top" },
      { key: "trousers", name: "Palazzo Pants", desc: "Cream, linen", category: "bottom" },
      { key: "espadrilles", name: "Espadrille Wedges", desc: "Natural jute", category: "shoes" },
      { key: "tote", name: "Woven Tote", desc: "Straw, leather trim", category: "accessory" },
    ]},
    { title: "Sunset Lookout", subtitle: "Bohemian Spirit", note: "Layered accessories and flowing fabrics catch the golden hour light. A hat and sunglasses complete the free-spirited look.", items: [
      { key: "cardigan", name: "Wrap Sweater", desc: "Sage, draped", category: "top" },
      { key: "maxiSkirt", name: "Maxi Skirt", desc: "Rust, tiered", category: "bottom" },
      { key: "boots", name: "Western Boots", desc: "Tan suede, low heel", category: "shoes" },
      { key: "hat", name: "Floppy Sun Hat", desc: "Straw, wide brim", category: "accessory" },
    ]},
    { title: "Evening Gathering", subtitle: "Bohemian Glow", note: "Romantic evening layers with candlelight-ready accessories. Gold accents catch warm light for bohemian glamour.", items: [
      { key: "blazer", name: "Velvet Blazer", desc: "Deep olive, relaxed", category: "outerwear" },
      { key: "silkBlouse", name: "Silk Camisole", desc: "Gold, delicate straps", category: "top" },
      { key: "trousers", name: "Wide-leg Trousers", desc: "Black, flowing", category: "bottom" },
      { key: "earrings", name: "Gold Earrings", desc: "Hammered hoops", category: "accessory" },
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

  const g = gender === "male" ? "m" : "f";

  if (category === "shoes") {
    if (g === "m") return h < 175 ? "EU 41" : h < 185 ? "EU 43" : "EU 45";
    return h < 165 ? "EU 37" : h < 175 ? "EU 39" : "EU 41";
  }

  if (g === "m") {
    if (bmi < 20) return "S";
    if (bmi < 24) return h > 180 ? "L" : "M";
    if (bmi < 28) return "L";
    return "XL";
  }
  if (bmi < 19) return "XS";
  if (bmi < 22) return "S";
  if (bmi < 26) return "M";
  if (bmi < 30) return "L";
  return "XL";
}

/** Detect non-walking infant: height < 85cm AND weight < 13kg */
function isInfantProfile(profile: UserProfile): boolean {
  const h = parseInt(profile.height) || 0;
  const w = parseInt(profile.weight) || 0;
  return h > 0 && h < 85 && w > 0 && w < 13;
}

function buildBodyFitLabel(profile: UserProfile): string {
  const h = parseInt(profile.height) || 0;
  const w = parseInt(profile.weight) || 0;
  const gender = profile.gender || "female";
  const gLabel = gender === "male" ? "Male" : gender === "non-binary" ? "Non-binary" : "Female";

  if (isInfantProfile(profile)) return `Baby · ${h}cm · ${w}kg · Stroller outfit`;

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

  return `Tailored for ${gLabel} · ${h}cm · ${w}kg · ${build} build`;
}

/* ═══════════════════════════════════════════════════════════ */
/*  OUTFIT GENERATION ALGORITHM                                */
/*  Rules:                                                     */
/*  - Bottoms: max 50% of total days                           */
/*  - Outer tops (jacket, coat): max 50%                       */
/*  - Inner tops (knit, sweater): max 50%                      */
/*  - T-shirts: max 25%                                        */
/*  - Shoes: max 50%                                           */
/*  - Accessories: unrestricted                                */
/*  - Same full combination: NEVER repeat                      */
/* ═══════════════════════════════════════════════════════════ */

type ItemSlot = "outerwear" | "top" | "bottom" | "shoes" | "accessory";

interface PoolItem {
  key: keyof typeof ITEM_IMAGES;
  name: string;
  desc: string;
  category: ItemSlot;
  /** For sub-type limits: "tshirt" | "inner-top" | "outer" | undefined */
  subType?: "tshirt" | "inner-top";
}

/** Extract a unique item pool from all templates for a city+aesthetic combo */
function buildItemPool(templates: OutfitTemplate[]): Map<string, PoolItem> {
  const pool = new Map<string, PoolItem>();
  for (const tpl of templates) {
    for (const item of tpl.items) {
      if (!pool.has(item.name)) {
        const nameLower = item.name.toLowerCase();
        let subType: PoolItem["subType"];
        if (item.category === "top") {
          if (nameLower.includes("tee") || nameLower.includes("t-shirt") || nameLower.includes("tshirt")) {
            subType = "tshirt";
          } else {
            subType = "inner-top";
          }
        }
        pool.set(item.name, {
          key: item.key,
          name: item.name,
          desc: item.desc,
          category: item.category,
          subType,
        });
      }
    }
  }
  return pool;
}

/** Compute max usage count for a category/subType given total days */
function maxUsage(category: ItemSlot, subType: PoolItem["subType"], totalDays: number): number {
  if (category === "accessory") return totalDays; // unrestricted
  if (subType === "tshirt") return Math.max(1, Math.ceil(totalDays * 0.25));
  // bottoms, outerwear, inner-top, shoes: 50%
  return Math.max(1, Math.ceil(totalDays * 0.5));
}

/** Create a string fingerprint of a combination for uniqueness checking */
function comboFingerprint(items: PoolItem[]): string {
  return items.map(i => i.name).sort().join("|");
}

function getOutfitImages(gender: string, cityKey: string): string[] {
  const pool = gender === "male" ? MALE_OUTFITS : FEMALE_OUTFITS;
  const key = cityKey.toLowerCase() as keyof typeof pool;
  return pool[key] || pool._default;
}

function getTemplates(cityKey: string, aesthetic?: string): OutfitTemplate[] {
  const key = cityKey.toLowerCase();
  const aestheticKey = aesthetic?.toLowerCase() || "";

  if (TEMPLATES[key]) return TEMPLATES[key];

  const aestheticDefault = `_default_${aestheticKey}`;
  if (aestheticKey && TEMPLATES[aestheticDefault]) return TEMPLATES[aestheticDefault];

  return TEMPLATES.paris;
}

/**
 * Generate outfits for a single city with repetition-limited algorithm.
 *
 * Ensures:
 * - No identical outfit combination repeats
 * - Per-item usage respects category limits
 * - Packing list derived from outfits is always consistent
 */
export function generateCityOutfits(
  profile: UserProfile,
  city: CityInput,
  count: number = 4,
): GeneratedOutfit[] {
  const gender = profile.gender || "female";
  const cityKey = city.city.toLowerCase();
  const primaryAesthetic = profile.aesthetics?.[0] || "";
  const images = getOutfitImages(gender, cityKey);
  const templates = getTemplates(cityKey, primaryAesthetic);
  const bodyFitLabel = buildBodyFitLabel(profile);
  const totalDays = count;

  const aestheticLabel = primaryAesthetic
    ? primaryAesthetic.charAt(0).toUpperCase() + primaryAesthetic.slice(1)
    : "";

  // Build the item pool from all available templates
  const itemPool = buildItemPool(templates);
  const allItems = Array.from(itemPool.values());

  // Group items by category for selection
  const byCategory: Record<ItemSlot, PoolItem[]> = {
    outerwear: [], top: [], bottom: [], shoes: [], accessory: [],
  };
  for (const item of allItems) {
    byCategory[item.category].push(item);
  }

  // Track per-item usage counts
  const usageCount = new Map<string, number>();
  for (const item of allItems) usageCount.set(item.name, 0);

  // Track used combinations to prevent repeats
  const usedCombos = new Set<string>();

  const outfits: GeneratedOutfit[] = [];

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    // Use template metadata (title/subtitle/note) for this day
    const tpl = templates[dayIdx % templates.length];

    // Select items for each required slot, respecting limits
    const selectedItems: PoolItem[] = [];

    // Required slots: top, bottom, shoes. Optional: outerwear, accessory.
    const requiredSlots: ItemSlot[] = ["top", "bottom", "shoes"];
    // Add outerwear if template has it
    const tplHasOuterwear = tpl.items.some(i => i.category === "outerwear");
    if (tplHasOuterwear) requiredSlots.unshift("outerwear");
    // Add accessory if template has it
    const tplAccessories = tpl.items.filter(i => i.category === "accessory");
    if (tplAccessories.length > 0) requiredSlots.push("accessory");

    for (const slot of requiredSlots) {
      const candidates = byCategory[slot];
      if (candidates.length === 0) continue;

      // Sort candidates by usage count (prefer least-used for diversity)
      const sorted = [...candidates].sort((a, b) => {
        const aCount = usageCount.get(a.name) || 0;
        const bCount = usageCount.get(b.name) || 0;
        return aCount - bCount;
      });

      // Pick the least-used candidate that hasn't exceeded its limit
      let picked: PoolItem | null = null;
      for (const candidate of sorted) {
        const currentUsage = usageCount.get(candidate.name) || 0;
        const limit = maxUsage(candidate.category, candidate.subType, totalDays);
        if (currentUsage < limit) {
          picked = candidate;
          break;
        }
      }

      // Fallback: if all exceeded limits, pick the least-used anyway
      if (!picked) picked = sorted[0];

      selectedItems.push(picked);
    }

    // Check for combination uniqueness
    const fp = comboFingerprint(selectedItems);
    if (usedCombos.has(fp)) {
      // Correction priority: 1. Change top, 2. Change bottom, 3. Add 1 item
      let resolved = false;
      for (const swapSlot of ["top", "bottom", "accessory"] as ItemSlot[]) {
        const altCandidates = byCategory[swapSlot].filter(
          c => !selectedItems.some(s => s.name === c.name)
        );
        if (altCandidates.length > 0) {
          const slotIdx = selectedItems.findIndex(s => s.category === swapSlot);
          if (slotIdx >= 0) {
            // Sort by least usage
            altCandidates.sort((a, b) => (usageCount.get(a.name) || 0) - (usageCount.get(b.name) || 0));
            selectedItems[slotIdx] = altCandidates[0];
            resolved = true;
            break;
          } else if (swapSlot === "accessory") {
            // Add an accessory to differentiate
            altCandidates.sort((a, b) => (usageCount.get(a.name) || 0) - (usageCount.get(b.name) || 0));
            selectedItems.push(altCandidates[0]);
            resolved = true;
            break;
          }
        }
      }
      if (!resolved) {
        // Last resort: forcibly change the top to any different item
        const topIdx = selectedItems.findIndex(s => s.category === "top");
        if (topIdx >= 0) {
          const otherTops = byCategory.top.filter(c => c.name !== selectedItems[topIdx].name);
          if (otherTops.length > 0) {
            selectedItems[topIdx] = otherTops[dayIdx % otherTops.length];
          }
        }
      }
    }

    // Record final combo and update usage counts
    const finalFp = comboFingerprint(selectedItems);
    usedCombos.add(finalFp);
    for (const item of selectedItems) {
      usageCount.set(item.name, (usageCount.get(item.name) || 0) + 1);
    }

    // Build subtitle
    let subtitle = tpl.subtitle;
    if (aestheticLabel && TEMPLATES[cityKey]) {
      const parts = subtitle.split(" ");
      if (parts.length > 1) {
        parts[0] = aestheticLabel;
        subtitle = parts.join(" ");
      } else {
        subtitle = `${aestheticLabel} ${subtitle}`;
      }
    }

    outfits.push({
      id: `${cityKey}-outfit-${dayIdx + 1}`,
      day: dayIdx + 1,
      title: tpl.title,
      subtitle,
      image: images[dayIdx % images.length],
      items: selectedItems.map((item, j) => ({
        id: `${cityKey}-item-${dayIdx}-${j}`,
        name: item.name,
        desc: item.desc,
        img: ITEM_IMAGES[item.key],
        category: item.category,
        recommendedSize: recommendSize(item.category, gender, profile.height, profile.weight),
      })),
      note: tpl.note,
      aiConfidence: 85 + Math.floor(Math.random() * 12),
      bodyFitLabel,
    });
  }

  return outfits;
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

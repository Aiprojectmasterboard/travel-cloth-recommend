/**
 * capsuleAgent.ts
 *
 * Generates a travel capsule wardrobe via OpenAI GPT-5.4 (Responses API).
 *
 * Two modes:
 *   free  → Returns only item count + 3 layering principles (shown on preview page)
 *   paid  → Returns full items (8–12) + daily outfit plan
 *
 * Model: gpt-5.4
 */

import type { Bindings, PlanType } from '../index';
import type { VibeResult } from './vibeAgent';
import type { WeatherResult } from './weatherAgent';
import { chatCompletionJSON } from './openaiChat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CapsuleItem {
  name: string;
  category: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'dress/jumpsuit' | 'accessory' | string;
  why: string;
  versatility_score: number; // 1–10
}

export interface DailyOutfit {
  day: number;
  city: string;
  outfit: string[]; // item names from items list
  note: string;
}

/** Free-tier teaser output */
export interface FreeCapsuleResult {
  plan: 'free';
  count: number;
  principles: string[];
}

/** Paid full output */
export interface PaidCapsuleResult {
  plan: PlanType;
  items: CapsuleItem[];
  daily_plan: DailyOutfit[];
}

export type CapsuleResult = FreeCapsuleResult | PaidCapsuleResult;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Shared Context Builder ───────────────────────────────────────────────────

function buildCityContext(
  cities: Array<{ name: string; days: number }>,
  vibeResults: VibeResult[],
  weatherResults: WeatherResult[],
  month: number
): string {
  const monthName = MONTH_NAMES[month - 1] ?? 'Unknown';
  const lines = cities.map((c, i) => {
    const vibe = vibeResults[i];
    const weather = weatherResults[i];
    const vibeStr = vibe ? `mood: ${vibe.mood_name}, avoid: ${vibe.avoid_note}` : '';
    const wxStr = weather
      ? `${weather.climate_band}, ${weather.temperature_day_avg}°C days / ${weather.temperature_night_avg}°C nights, rain ${Math.round(weather.precipitation_prob * 100)}%`
      : '';
    return `- ${c.name} (${c.days} days) | ${monthName} | ${wxStr} | ${vibeStr}`;
  });
  return lines.join('\n');
}

// ─── Free Mode ────────────────────────────────────────────────────────────────

async function generateFree(
  apiKey: string,
  cities: Array<{ name: string; days: number }>,
  vibeResults: VibeResult[],
  weatherResults: WeatherResult[],
  month: number
): Promise<FreeCapsuleResult> {
  const cityContext = buildCityContext(cities, vibeResults, weatherResults, month);
  const totalDays = cities.reduce((s, c) => s + c.days, 0);

  const systemPrompt =
    'You are a minimalist travel packing expert. Your role is to give a precise item count ' +
    'and three actionable layering principles for a multi-city trip. ' +
    'Always respond with valid JSON only — no markdown, no explanations.';

  const userPrompt = `Based on this trip, calculate the ideal capsule wardrobe size and give layering principles.

Trip details:
${cityContext}
Total days: ${totalDays}

Respond ONLY with this JSON:
{
  "count": <integer 9-11>,
  "principles": [
    "Principle 1 (one actionable sentence)",
    "Principle 2 (one actionable sentence)",
    "Principle 3 (one actionable sentence)"
  ]
}`;

  const parsed = await chatCompletionJSON<{ count: number; principles: string[] }>(
    apiKey,
    systemPrompt,
    userPrompt,
    { maxTokens: 1024, reasoningEffort: 'low' },
  );

  return {
    plan: 'free',
    count: Math.min(11, Math.max(9, Number(parsed.count ?? 10))),
    principles: Array.isArray(parsed.principles)
      ? parsed.principles.slice(0, 3).map(String)
      : ['Layer for temperature swings', 'Choose neutral base colors', 'Pack one versatile outerwear piece'],
  };
}

// ─── Paid Mode ────────────────────────────────────────────────────────────────

/** Optional user profile for personalised capsule wardrobe */
export interface CapsuleUserProfile {
  gender: 'male' | 'female' | 'non-binary';
  height_cm?: number;
  weight_kg?: number;
  aesthetics: string[];
}

function buildUserProfileBlock(profile?: CapsuleUserProfile): string {
  if (!profile) return '';
  const genderLabel = profile.gender === 'male' ? "men's" : profile.gender === 'non-binary' ? 'gender-neutral' : "women's";
  const lines = [
    `\nTraveller Profile:`,
    `- Gender: ${genderLabel} clothing`,
  ];
  if (profile.height_cm) lines.push(`- Height: ${profile.height_cm} cm`);
  if (profile.height_cm && profile.weight_kg) {
    const bmi = profile.weight_kg / ((profile.height_cm / 100) ** 2);
    const build = bmi < 18.5 ? 'slender' : bmi < 25 ? 'slim' : bmi < 30 ? 'regular' : 'full-figured';
    lines.push(`- Build: ${build}`);
  }
  if (profile.aesthetics.length > 0) {
    lines.push(`- Style preferences: ${profile.aesthetics.join(', ')}`);
  }
  return lines.join('\n');
}

async function generatePaid(
  apiKey: string,
  plan: PlanType,
  cities: Array<{ name: string; days: number }>,
  vibeResults: VibeResult[],
  weatherResults: WeatherResult[],
  month: number,
  tripDays?: number,
  userProfile?: CapsuleUserProfile
): Promise<PaidCapsuleResult> {
  const cityContext = buildCityContext(cities, vibeResults, weatherResults, month);
  const totalDays = tripDays ?? cities.reduce((s, c) => s + c.days, 0);
  const profileBlock = buildUserProfileBlock(userProfile);

  const genderNote = userProfile
    ? `All items must be ${userProfile.gender === 'male' ? "men's" : userProfile.gender === 'non-binary' ? 'gender-neutral' : "women's"} clothing. `
    : '';
  const aestheticNote = userProfile?.aesthetics?.length
    ? `Style preferences: ${userProfile.aesthetics.join(', ')} — reflect these in clothing choices. `
    : '';

  const systemPrompt =
    'You are an expert travel fashion consultant and capsule wardrobe specialist. ' +
    'Philosophy: maximum outfit combinations from minimum pieces — strictly carry-on only. ' +
    genderNote + aestheticNote +
    'Always respond with valid JSON only — no markdown fences, no explanations.';

  const userPrompt = `Design a capsule wardrobe and daily outfit plan for this trip:

${cityContext}${profileBlock}
Total duration: ${totalDays} days

CONSTRAINTS:
- 8–12 items total (shoes count as 1 pair; accessories excluded from count)
- Every item must pair with at least 3 others
- Account for climate transitions between cities
- No dry-clean-only or delicate fabrics
${userProfile ? `- All clothing items must be appropriate for ${userProfile.gender === 'male' ? 'men' : userProfile.gender === 'non-binary' ? 'any gender' : 'women'}` : ''}

REPETITION RULES (MUST follow strictly):
- Bottoms: each bottom worn at most 50% of total days (e.g. 4-day trip = max 2 wears per bottom)
- Outerwear (jacket, coat): each piece worn at most 50% of total days
- Inner tops (knit, sweater): each piece worn at most 50% of total days
- T-shirts: each t-shirt worn at most 25% of total days
- Shoes: each pair worn at most 50% of total days
- Accessories (scarf, earrings, hat): unrestricted
- Same full combination of items: NEVER repeat across any two days
- Even when repeating a bottom, you MUST vary the look by changing the top, shoes, or layering
- Correction priority if a combination would repeat: 1. Change top, 2. Change bottom, 3. Add 1 accessory

OPTIMIZATION:
- Minimize total items (packing weight) while maximizing look diversity
- All days must be covered with a complete outfit
- If rain is likely for a city day, include a waterproof layer + umbrella in that day's outfit

Item fields:
- name: specific item (e.g. "White linen button-down shirt")
- category: one of [top, bottom, outerwear, shoes, dress/jumpsuit, accessory]
- why: one sentence on its role in the capsule
- versatility_score: 1–10

Daily plan: assign each day to a city, list 3–5 item names as the outfit, add a short activity note.
IMPORTANT: Every item name in daily_plan.outfit[] MUST exactly match an item name from the items[] array. No outfit may reference an item not in the capsule list.

Respond ONLY with:
{
  "items": [
    { "name": "...", "category": "...", "why": "...", "versatility_score": 8 }
  ],
  "daily_plan": [
    { "day": 1, "city": "...", "outfit": ["...", "..."], "note": "..." }
  ]
}`;

  const parsed = await chatCompletionJSON<{
    items: Array<{ name: string; category: string; why: string; versatility_score: number }>;
    daily_plan: Array<{ day: number; city: string; outfit: string[]; note: string }>;
  }>(apiKey, systemPrompt, userPrompt, { maxTokens: 4096, reasoningEffort: 'medium' });

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('[capsuleAgent] GPT-5.4 returned no items');
  }
  if (!Array.isArray(parsed.daily_plan) || parsed.daily_plan.length === 0) {
    throw new Error('[capsuleAgent] GPT-5.4 returned no daily_plan');
  }

  const items: CapsuleItem[] = parsed.items.slice(0, 12).map((item) => ({
    name: String(item.name ?? ''),
    category: String(item.category ?? 'other'),
    why: String(item.why ?? ''),
    versatility_score: Math.min(10, Math.max(1, Number(item.versatility_score ?? 5))),
  }));

  // Build a case-insensitive lookup map for item name consistency validation
  const itemNameMap = new Map<string, string>(); // lowercase → canonical name
  for (const item of items) {
    itemNameMap.set(item.name.toLowerCase(), item.name);
  }

  const daily_plan: DailyOutfit[] = parsed.daily_plan.map((p) => ({
    day: Number(p.day ?? 1),
    city: String(p.city ?? ''),
    // Match outfit items case-insensitively, map to canonical capsule item names
    outfit: Array.isArray(p.outfit)
      ? p.outfit.map(String)
          .map((name) => itemNameMap.get(name.toLowerCase()) ?? name)
          .filter((name) => itemNameMap.has(name.toLowerCase()))
      : [],
    note: String(p.note ?? ''),
  }));

  // Validate: check for duplicate full combinations
  const combos = new Set<string>();
  for (const day of daily_plan) {
    const combo = [...day.outfit].sort().join('|');
    if (combos.has(combo)) {
      console.warn(`[capsuleAgent] Duplicate outfit combination on day ${day.day}`);
    }
    combos.add(combo);
  }

  return { plan, items, daily_plan };
}

// ─── Main Exported Function ───────────────────────────────────────────────────

export async function capsuleAgent(
  input: {
    vibeResults: VibeResult[];
    weather: WeatherResult[];
    plan: PlanType | 'free';
    cities: Array<{ name: string; days: number }>;
    month: number;
    tripDays?: number;
    userProfile?: CapsuleUserProfile;
  },
  env: Bindings
): Promise<CapsuleResult> {
  const { vibeResults, weather, plan, cities, month, tripDays, userProfile } = input;

  if (plan === 'free') {
    return generateFree(env.OPENAI_API_KEY, cities, vibeResults, weather, month);
  }

  return generatePaid(env.OPENAI_API_KEY, plan, cities, vibeResults, weather, month, tripDays, userProfile);
}

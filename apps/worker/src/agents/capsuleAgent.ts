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
  color: string;           // primary color (e.g. "navy", "cream", "olive")
  material?: string;       // fabric type (e.g. "linen", "wool blend", "cotton")
  fit?: string;            // fit style (e.g. "relaxed", "tailored", "oversized")
  formality?: 'casual' | 'smart-casual' | 'dressy' | string;
  water_resistant?: boolean;
  why: string;
  versatility_score: number; // 1–10
}

export interface DailyOutfit {
  day: number;
  city: string;
  outfit: string[]; // item names from items list
  styling_directions?: string[]; // e.g. ["French-tuck the shirt", "blazer open, sleeves rolled"]
  color_story?: string;          // e.g. "Navy dominant, cream secondary, terracotta accent via scarf"
  note: string;
}

/** Free-tier teaser output */
export interface FreeCapsuleResult {
  plan: 'free';
  count: number;
  principles: string[];
}

/** Trip Styling Brief — cohesive palette + silhouette direction */
export interface TripStylingBrief {
  base_neutrals: string[];    // 2–3 neutral colors (e.g. ["black", "cream", "navy"])
  accent_color: string;       // 1 pop color (e.g. "terracotta", "emerald")
  jewelry_tone: 'gold' | 'silver' | 'rose-gold' | string;
  silhouette_goal: string;    // e.g. "elongated", "relaxed-chic", "structured"
}

/** Paid full output */
export interface PaidCapsuleResult {
  plan: PlanType;
  styling_brief: TripStylingBrief;
  items: CapsuleItem[];
  daily_plan: DailyOutfit[];
}

export type CapsuleResult = FreeCapsuleResult | PaidCapsuleResult;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Minimum daily_plan entries per city in paid mode.
 * The Pro/Annual dashboard always shows a 2×2 outfit grid (4 slots), so
 * every city must have at least 4 daily_plan entries even when the trip is
 * shorter than 4 days.  For longer trips this value has no effect.
 */
const MIN_DAILY_PLAN_PER_CITY = 4;

// ─── Bonus Look Labels ────────────────────────────────────────────────────────

const BONUS_LOOK_STYLES = [
  'Morning casual look',
  'Evening dressy look',
  'Casual alternative look',
  'Smart evening look',
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

// ─── Daily Plan Padding ───────────────────────────────────────────────────────

/**
 * Ensures every city has at least MIN_DAILY_PLAN_PER_CITY entries in daily_plan.
 *
 * When Claude returns fewer entries than required (despite prompt instructions),
 * this function pads the plan with "bonus look" entries derived from existing
 * outfits for the same city.  Each padded entry reuses items from the city's
 * existing entries but rotates to the next outfit combination to maximise variety.
 *
 * Uses fractional day numbers (e.g. 1.5, 2.5) for bonus look entries so the
 * dashboard can distinguish them from actual trip days.
 */
function padDailyPlanToMinimum(
  dailyPlan: DailyOutfit[],
  cities: Array<{ name: string; days: number }>,
  items: CapsuleItem[],
  itemNameMap: Map<string, string>
): DailyOutfit[] {
  const result: DailyOutfit[] = [...dailyPlan];

  for (const city of cities) {
    const cityName = city.name;
    const cityEntries = result.filter(
      (d) => d.city.toLowerCase() === cityName.toLowerCase()
    );

    const needed = MIN_DAILY_PLAN_PER_CITY - cityEntries.length;
    if (needed <= 0) continue;

    console.log(
      `[capsuleAgent] Padding city "${cityName}": has ${cityEntries.length}, need ${MIN_DAILY_PLAN_PER_CITY} — adding ${needed} bonus look(s)`
    );

    // Collect all canonical item names for variety rotation
    const allItemNames = items.map((i) => i.name);

    // Existing outfit combos to avoid exact duplicates
    const existingCombos = new Set<string>(
      cityEntries.map((d) => [...d.outfit].sort().join('|'))
    );

    let bonusIdx = 0;
    let lastDayNumber = cityEntries.length > 0
      ? Math.max(...cityEntries.map((d) => d.day))
      : 0;

    for (let i = 0; i < needed; i++) {
      const label = BONUS_LOOK_STYLES[bonusIdx % BONUS_LOOK_STYLES.length] ?? 'Bonus look';
      bonusIdx++;

      // Build a varied outfit: start from an existing outfit and rotate one item
      const baseEntry = cityEntries[i % Math.max(cityEntries.length, 1)];
      let bonusOutfit: string[] = baseEntry?.outfit
        ? [...baseEntry.outfit]
        : allItemNames.slice(0, 3);

      // Rotate one item to create variety — replace the first top or bottom found
      // with the next available item of a different category
      const usedLower = new Set(bonusOutfit.map((n) => n.toLowerCase()));
      for (const candidate of allItemNames) {
        if (!usedLower.has(candidate.toLowerCase())) {
          // Replace last item in outfit with this candidate
          bonusOutfit = [...bonusOutfit.slice(0, -1), candidate];
          break;
        }
      }

      // Validate all names are in the capsule
      const validatedOutfit = bonusOutfit
        .map((name) => itemNameMap.get(name.toLowerCase()) ?? name)
        .filter((name) => itemNameMap.has(name.toLowerCase()));

      // Skip if this would still duplicate an existing combo
      const comboKey = [...validatedOutfit].sort().join('|');
      if (existingCombos.has(comboKey)) {
        // Try a different rotation: use items from position offset
        const offset = (i + 1) * 2;
        const altOutfit = allItemNames
          .slice(offset % Math.max(allItemNames.length - 3, 1))
          .slice(0, 3)
          .map((name) => itemNameMap.get(name.toLowerCase()) ?? name)
          .filter((name) => itemNameMap.has(name.toLowerCase()));
        if (altOutfit.length >= 2 && !existingCombos.has([...altOutfit].sort().join('|'))) {
          bonusOutfit = altOutfit;
        }
      }

      const finalOutfit = bonusOutfit
        .map((name) => itemNameMap.get(name.toLowerCase()) ?? name)
        .filter((name) => itemNameMap.has(name.toLowerCase()));

      // Use a fractional day number so the frontend can tell this is a bonus look
      lastDayNumber = lastDayNumber + 0.5;

      const bonusEntry: DailyOutfit = {
        day: lastDayNumber,
        city: cityName,
        outfit: finalOutfit.length >= 2 ? finalOutfit : allItemNames.slice(0, 3),
        note: `${label}: alternate styling for ${cityName}`,
      };

      result.push(bonusEntry);
      existingCombos.add([...bonusEntry.outfit].sort().join('|'));
      cityEntries.push(bonusEntry);
    }
  }

  // Sort by city order then by day number so the output is predictable
  const cityOrder = new Map(cities.map((c, idx) => [c.name.toLowerCase(), idx]));
  result.sort((a, b) => {
    const cityDiff =
      (cityOrder.get(a.city.toLowerCase()) ?? 999) -
      (cityOrder.get(b.city.toLowerCase()) ?? 999);
    if (cityDiff !== 0) return cityDiff;
    return a.day - b.day;
  });

  return result;
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

  // ── Compute per-city daily_plan target counts ──────────────────────────────
  // The dashboard always renders a 2×2 outfit grid (4 slots) per city, so we
  // always need at least MIN_DAILY_PLAN_PER_CITY entries per city regardless of
  // actual trip duration.  For longer trips the actual day count is used.
  const perCityTargets = cities.map((c) => ({
    name: c.name,
    actualDays: c.days,
    targetEntries: Math.max(c.days, MIN_DAILY_PLAN_PER_CITY),
    bonusCount: Math.max(0, MIN_DAILY_PLAN_PER_CITY - c.days),
  }));

  // Build bonus-look instructions block (only shown when any city needs extras)
  const needsBonusLooks = perCityTargets.some((t) => t.bonusCount > 0);
  const bonusLookInstructions = needsBonusLooks
    ? `
MINIMUM LOOKS RULE (CRITICAL — the app displays a 2×2 outfit grid per city):
- Every city MUST have exactly ${MIN_DAILY_PLAN_PER_CITY} entries in daily_plan, even if actual days < ${MIN_DAILY_PLAN_PER_CITY}
- For cities with fewer than ${MIN_DAILY_PLAN_PER_CITY} actual days, generate extra "bonus look" entries:
${perCityTargets
  .filter((t) => t.bonusCount > 0)
  .map((t) => {
    const bonusLabels = ['morning casual', 'evening dressy', 'casual alternative', 'smart evening']
      .slice(0, t.bonusCount);
    return `  - ${t.name}: ${t.actualDays} actual day(s) + ${t.bonusCount} bonus look(s) → label them: ${bonusLabels.join(', ')}`;
  })
  .join('\n')}
- Bonus look day numbers: use fractional values (e.g. 1.5, 2.5) or continue the sequence after actual days
- Bonus look notes MUST describe the style variation (e.g. "Evening look: dress up the day 1 outfit with different shoes and blazer")
- Bonus looks MUST use different outfit combinations from actual days (no full combination repeats)
`
    : '';

  // Build per-city daily_plan count summary for the prompt
  const dailyPlanCountNote = perCityTargets.map((t) =>
    `  - ${t.name}: exactly ${t.targetEntries} entries (${t.actualDays} day(s) + ${t.bonusCount} bonus look(s))`
  ).join('\n');

  const systemPrompt =
    'You are a top-tier personal stylist and capsule wardrobe specialist — think Elin Kling meets a travel editor. ' +
    'Philosophy: maximum perceived variety from minimum pieces — strictly carry-on only. ' +
    'Every outfit must look intentional, editorial, and curated — never like a tourist or an afterthought. ' +
    genderNote + aestheticNote +
    'Always respond with valid JSON only — no markdown fences, no explanations.';

  const userPrompt = `Design a cohesive capsule wardrobe, a trip styling brief, and a day-by-day outfit plan for this trip:

${cityContext}${profileBlock}
Total duration: ${totalDays} days

═══ STEP 1: TRIP STYLING BRIEF ═══
Before choosing items, define the trip's visual identity:
- base_neutrals: pick 2–3 neutral foundation colors that mix-and-match (e.g. black, cream, navy)
- accent_color: 1 pop/accent color that ties the trip together (e.g. terracotta, burgundy, sage)
- jewelry_tone: gold, silver, or rose-gold — consistent across the trip
- silhouette_goal: a short phrase describing the body proportions intent (consider the traveller's build)
  Examples: "elongated and lean" (for petite), "relaxed-structured balance" (for tall), "defined waist, clean lines"

═══ STEP 2: CAPSULE ITEMS (8–12 pieces) ═══
CONSTRAINTS:
- 8–12 items total (shoes count as 1 pair; accessories excluded from count)
- Every item must pair with at least 3 others
- Account for climate transitions between cities
- No dry-clean-only or delicate fabrics
${userProfile ? `- All clothing items must be appropriate for ${userProfile.gender === 'male' ? 'men' : userProfile.gender === 'non-binary' ? 'any gender' : 'women'}` : ''}

STYLING-QUALITY RULES (make it look like a top stylist curated this):
- COHESIVE COLOR PALETTE: All items must draw from the base_neutrals + accent_color. No random colors.
- 3-COLOR RULE: Each outfit uses at most 3 colors (dominant + secondary + accent). The accent color should appear in 30-40% of outfits (not every day).
- "THIRD PIECE" PRINCIPLE: Every outfit MUST include either:
  (a) A layer piece (blazer, cardigan, trench, vest, light jacket), OR
  (b) A finishing accessory (belt, scarf, statement bag, jewelry, hat) that elevates the look
- "RULE OF THIRDS" PROPORTIONS: Guide the outfit silhouette for visual balance:
  Use tuck/half-tuck, cropped outer over high-waisted bottom, belt to define waist, open coat revealing 1/3-2/3 split, etc.
- PLACEMENT STRATEGY: Swap tops frequently — tops are the easiest way to create visually different looks while repeating bottoms.

REPETITION RULES (MUST follow strictly):
- Bottoms: each bottom worn at most 50% of total days
- Outerwear (jacket, coat): each piece worn at most 50% of total days
- Inner tops (knit, sweater): each piece worn at most 50% of total days
- T-shirts / short-sleeve: each worn at most 25% of total days
- Shoes: each pair worn at most 50% of total days
- Accessories (scarf, earrings, hat): unrestricted
- Same full combination of items: NEVER repeat across any two days
- Correction priority if a combination would repeat: 1. Change top, 2. Change bottom, 3. Add 1 accessory

RAIN DAY RULES:
- If rain probability > 40% for a city day: MUST include waterproof layer + umbrella in that day's outfit
- The outfit note should mention rainy styling (e.g. "rainy day: waterproof trench, rubber-sole boots")

OPTIMIZATION:
- Minimize total unique items (packing volume) while maximizing perceived outfit variety
- All days must be covered with a complete outfit
${bonusLookInstructions}
DAILY PLAN COUNT REQUIREMENT:
${dailyPlanCountNote}

═══ STEP 3: DAILY PLAN ═══
For each day: assign to a city, list 3–5 item names as the outfit, add a short activity note.
- Include a "styling_direction" hint per outfit (e.g. "half-tuck the shirt, leave blazer unbuttoned, roll sleeves")
- IMPORTANT: Every item name in daily_plan.outfit[] MUST exactly match an item name from the items[] array.

Item fields:
- name: specific descriptive name (e.g. "Cream linen relaxed-fit blazer")
- category: one of [top, bottom, outerwear, shoes, dress/jumpsuit, accessory]
- color: primary color name (e.g. "cream", "navy", "olive")
- material: fabric (e.g. "linen", "wool blend", "cotton jersey")
- fit: fit description (e.g. "relaxed", "tailored", "oversized", "slim")
- formality: one of [casual, smart-casual, dressy]
- water_resistant: true/false (for rain-ready items)
- why: one sentence on its capsule role
- versatility_score: 1–10

Respond ONLY with:
{
  "styling_brief": {
    "base_neutrals": ["black", "cream"],
    "accent_color": "terracotta",
    "jewelry_tone": "gold",
    "silhouette_goal": "elongated and lean"
  },
  "items": [
    { "name": "...", "category": "...", "color": "...", "material": "...", "fit": "...", "formality": "...", "water_resistant": false, "why": "...", "versatility_score": 8 }
  ],
  "daily_plan": [
    { "day": 1, "city": "...", "outfit": ["...", "..."], "note": "..." }
  ]
}`;

  const parsed = await chatCompletionJSON<{
    styling_brief?: {
      base_neutrals?: string[];
      accent_color?: string;
      jewelry_tone?: string;
      silhouette_goal?: string;
    };
    items: Array<{
      name: string; category: string; color?: string; material?: string;
      fit?: string; formality?: string; water_resistant?: boolean;
      why: string; versatility_score: number;
    }>;
    daily_plan: Array<{ day: number; city: string; outfit: string[]; styling_directions?: string[]; color_story?: string; note: string }>;
  }>(apiKey, systemPrompt, userPrompt, { maxTokens: 4096, reasoningEffort: 'medium' });

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('[capsuleAgent] GPT-5.4 returned no items');
  }
  if (!Array.isArray(parsed.daily_plan) || parsed.daily_plan.length === 0) {
    throw new Error('[capsuleAgent] GPT-5.4 returned no daily_plan');
  }

  // Parse styling brief (fallback to sensible defaults)
  const stylingBrief: TripStylingBrief = {
    base_neutrals: Array.isArray(parsed.styling_brief?.base_neutrals)
      ? parsed.styling_brief.base_neutrals.map(String).slice(0, 3)
      : ['black', 'cream'],
    accent_color: String(parsed.styling_brief?.accent_color ?? 'terracotta'),
    jewelry_tone: String(parsed.styling_brief?.jewelry_tone ?? 'gold'),
    silhouette_goal: String(parsed.styling_brief?.silhouette_goal ?? 'balanced proportions'),
  };

  const items: CapsuleItem[] = parsed.items.slice(0, 12).map((item) => ({
    name: String(item.name ?? ''),
    category: String(item.category ?? 'other'),
    color: String(item.color ?? ''),
    material: item.material ? String(item.material) : undefined,
    fit: item.fit ? String(item.fit) : undefined,
    formality: item.formality ? String(item.formality) as CapsuleItem['formality'] : undefined,
    water_resistant: item.water_resistant === true,
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
    styling_directions: Array.isArray(p.styling_directions) ? p.styling_directions.map(String) : undefined,
    color_story: p.color_story ? String(p.color_story) : undefined,
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

  // ── Guarantee MIN_DAILY_PLAN_PER_CITY entries per city ───────────────────
  // Safety net: if Claude returned fewer entries than required despite the
  // prompt instructions, pad with varied look entries derived from existing ones.
  // This ensures the dashboard 2×2 grid always has 4 slots to show.
  const paddedDailyPlan = padDailyPlanToMinimum(daily_plan, cities, items, itemNameMap);

  return { plan, styling_brief: stylingBrief, items, daily_plan: paddedDailyPlan };
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

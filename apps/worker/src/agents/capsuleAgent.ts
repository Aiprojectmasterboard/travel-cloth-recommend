import Anthropic from '@anthropic-ai/sdk';
import type {
  CityInput,
  ClimateData,
  CapsuleItem,
  DailyPlan,
} from '../../../../packages/types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';

// ─── Response Types ───────────────────────────────────────────────────────────

interface CapsuleResponse {
  items: CapsuleItem[];
  daily_plan: DailyPlan[];
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Uses Claude claude-sonnet-4-6 to generate an optimized capsule wardrobe
 * and daily outfit plan for a multi-city trip.
 *
 * Focuses on carry-on friendly packing: 8–12 versatile items that maximize
 * outfit combinations across all destinations.
 */
export async function generateCapsule(
  cities: CityInput[],
  month: number,
  climateData: ClimateData[],
  apiKey: string
): Promise<{ items: CapsuleItem[]; daily_plan: DailyPlan[] }> {
  const client = new Anthropic({ apiKey });

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = MONTH_NAMES[month - 1] ?? 'Unknown';

  const cityClimateDetails = cities
    .map((c) => {
      const climate = climateData.find((cd) => cd.city === c.name);
      return climate
        ? `- ${c.name} (${c.days} days): ${climate.vibe_band}, ${climate.temp_min}–${climate.temp_max}°C, precip: ${climate.precipitation}mm`
        : `- ${c.name} (${c.days} days): climate data unavailable`;
    })
    .join('\n');

  const totalDays = cities.reduce((sum, c) => sum + c.days, 0);
  const cityList = cities.map((c) => c.name).join(', ');

  const systemPrompt = `You are an expert travel fashion consultant and capsule wardrobe specialist.
Your philosophy: maximum outfit combinations from minimum pieces.
You design carry-on friendly wardrobes that work across multiple climates and dress codes.
You always think in terms of outfit formulas and item versatility scores.
Always respond with valid JSON only — no markdown fences, no extra text, no explanations.`;

  const userPrompt = `Create an optimized capsule wardrobe for this multi-city trip:

Destinations: ${cityList}
Travel Month: ${monthName}
Total Duration: ${totalDays} days

City-by-City Climate:
${cityClimateDetails}

CONSTRAINTS:
- Strict carry-on limit: 8–12 clothing items total (shoes count as 1 pair each, accessories don't count)
- Every item must work with at least 3 other items
- Account for climate transitions between cities
- Include at least 1 versatile item per climate need
- No dry-clean-only or delicate fabrics

FOR EACH ITEM provide:
- name: specific item (e.g., "White linen button-down shirt")
- category: one of [top, bottom, outerwear, shoes, dress/jumpsuit, accessory]
- why: one sentence explaining its role in the capsule
- versatility_score: 1–10 (10 = pairs with everything)

FOR DAILY PLAN:
- Assign a day number (1 to ${totalDays})
- Specify the city for that day
- List 3–5 item names as the outfit (from the items list)
- Add a brief note about the activity/occasion

Respond ONLY with this exact JSON structure:
{
  "items": [
    {
      "name": "item name",
      "category": "category",
      "why": "one sentence explanation",
      "versatility_score": 8
    }
  ],
  "daily_plan": [
    {
      "day": 1,
      "city": "City Name",
      "outfit": ["Item 1", "Item 2", "Item 3"],
      "note": "Morning sightseeing to evening dinner"
    }
  ]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const rawContent = message.content[0];
  if (rawContent.type !== 'text') {
    throw new Error(`Unexpected Claude response type: ${rawContent.type}`);
  }

  let parsed: CapsuleResponse;
  try {
    const cleaned = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    parsed = JSON.parse(cleaned) as CapsuleResponse;
  } catch (err) {
    throw new Error(
      `Failed to parse Claude capsule response: ${(err as Error).message}\nRaw: ${rawContent.text.slice(0, 500)}`
    );
  }

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('Claude returned no capsule items');
  }

  if (!Array.isArray(parsed.daily_plan) || parsed.daily_plan.length === 0) {
    throw new Error('Claude returned no daily plan');
  }

  // Validate and clamp item counts
  const items = parsed.items.slice(0, 12).map((item) => ({
    name: String(item.name ?? ''),
    category: String(item.category ?? 'other'),
    why: String(item.why ?? ''),
    versatility_score: Math.min(10, Math.max(1, Number(item.versatility_score ?? 5))),
  }));

  const daily_plan = parsed.daily_plan.map((plan) => ({
    day: Number(plan.day ?? 1),
    city: String(plan.city ?? ''),
    outfit: Array.isArray(plan.outfit) ? plan.outfit.map(String) : [],
    note: String(plan.note ?? ''),
  }));

  return { items, daily_plan };
}

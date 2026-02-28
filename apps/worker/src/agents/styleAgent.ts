import Anthropic from '@anthropic-ai/sdk';
import type { CityVibe, ClimateData, StylePrompt } from '../../../../packages/types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6-20260219';
const NEGATIVE_PROMPT =
  'nudity, revealing clothes, cartoon, illustration, anime, painting, sketch, drawing, 3d render, blurry, low quality';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StylePromptsResponse {
  prompts: Array<{
    mood: string;
    prompt_en: string;
  }>;
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Uses Claude claude-sonnet-4-6 to generate 3-4 mood-based fashion editorial
 * image prompts for a given city, taking climate and vibe into account.
 */
export async function generateStylePrompts(
  city: CityVibe,
  climate: ClimateData,
  apiKey: string
): Promise<StylePrompt[]> {
  const client = new Anthropic({ apiKey });

  const monthName = MONTH_NAMES[climate.month - 1] ?? 'Unknown';
  const keywordsStr = city.style_keywords.join(', ');

  const systemPrompt = `You are a professional fashion stylist and photographer specializing in travel editorial content.
Your task is to write precise, vivid image generation prompts for AI image models.
Each prompt must produce a photorealistic fashion editorial image that captures the unique spirit of the destination.
Always respond with valid JSON only — no markdown, no extra text.`;

  const userPrompt = `Generate 3 to 4 distinct fashion editorial image prompts for:

City: ${city.city}, ${city.country}
Vibe: ${city.vibe_cluster}
Style Keywords: ${keywordsStr}
Travel Month: ${monthName}
Climate: ${climate.vibe_band} (${climate.temp_min}°C – ${climate.temp_max}°C, precipitation: ${climate.precipitation}mm)

Requirements for each prompt:
1. Specify a clear MOOD (e.g., "morning-exploration", "golden-hour-cafe", "local-market", "evening-out")
2. Include specific clothing items appropriate for the climate and city vibe
3. Mention the city backdrop or a recognizable location type in ${city.city}
4. Describe lighting style (e.g., soft morning light, golden hour, overcast diffused)
5. Use the style: "fashion editorial photography, [clothing details], [city backdrop], [lighting], [camera angle], professional model, high fashion magazine style"

Climate guidance:
- cold (< 10°C): heavy coats, layered knits, boots, warm accessories
- mild (10–18°C): light jacket or trench coat, layered outfits
- warm (18–26°C): light clothing, breathable fabrics, light layers
- hot (> 26°C): minimal, breathable, sun protection
- rainy: waterproof outerwear, rain boots or waterproof shoes, umbrella as prop

Respond ONLY with this JSON structure:
{
  "prompts": [
    { "mood": "mood-name", "prompt_en": "full prompt here" },
    { "mood": "mood-name", "prompt_en": "full prompt here" },
    { "mood": "mood-name", "prompt_en": "full prompt here" }
  ]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.8,
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
    throw new Error(`Unexpected response type from Claude: ${rawContent.type}`);
  }

  let parsed: StylePromptsResponse;
  try {
    // Strip potential markdown code fences
    const cleaned = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    parsed = JSON.parse(cleaned) as StylePromptsResponse;
  } catch (err) {
    throw new Error(
      `Failed to parse Claude response as JSON for ${city.city}: ${(err as Error).message}\nRaw: ${rawContent.text}`
    );
  }

  if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
    throw new Error(`Claude returned no prompts for ${city.city}`);
  }

  return parsed.prompts.map((p) => ({
    city: city.city,
    mood: p.mood,
    prompt_en: p.prompt_en,
    negative_prompt: NEGATIVE_PROMPT,
  }));
}

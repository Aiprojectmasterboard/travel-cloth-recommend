/**
 * styleAgent.ts  (Pro plan only)
 *
 * Uses Claude API to generate NanoBanana-ready image prompts for each city.
 * Produces 2 prompts per city (max 6 total for a 3-city trip).
 *
 * Model: claude-sonnet-4-6
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Bindings } from '../index';
import type { VibeResult } from './vibeAgent';
import type { WeatherResult } from './weatherAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StylePrompts {
  city: string;
  mood: string;     // short label e.g. "morning-exploration"
  prompt: string;   // full NanoBanana positive prompt
  negative_prompt: string;
}

// Claude response shape
interface ClaudeStyleResponse {
  prompts: Array<{
    city: string;
    mood: string;
    prompt: string;
    negative_prompt: string;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';

const DEFAULT_NEGATIVE =
  'nudity, revealing clothes, cartoon, illustration, anime, painting, sketch, drawing, ' +
  '3d render, blurry, low quality, nsfw, watermark, text overlay, logo';

const PROMPTS_PER_CITY = 2;
const MAX_CITIES = 3;

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates 2 NanoBanana image prompts per city (up to 6 total).
 *
 * @param input.vibeResults - Array of VibeResult from vibeAgent (one per city)
 * @param input.cities      - City names in the same order as vibeResults
 * @param input.weather     - Optional WeatherResult array for additional context
 * @param env               - Cloudflare Worker bindings
 */
export async function styleAgent(
  input: {
    vibeResults: VibeResult[];
    cities: string[];
    weather?: WeatherResult[];
  },
  env: Bindings
): Promise<StylePrompts[]> {
  const { vibeResults, cities, weather = [] } = input;

  // Cap to MAX_CITIES to keep token usage predictable
  const activeCities = cities.slice(0, MAX_CITIES);
  const activeVibes = vibeResults.slice(0, MAX_CITIES);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Build per-city context block
  const cityBlocks = activeCities.map((city, i) => {
    const vibe = activeVibes[i];
    const wx = weather[i];
    const vibeStr = vibe
      ? `mood: ${vibe.mood_name}, tags: ${vibe.vibe_tags.join(', ')}, avoid: ${vibe.avoid_note}`
      : 'no vibe data';
    const wxStr = wx
      ? `${wx.climate_band}, ${wx.temperature_day_avg}°C avg, rain prob ${Math.round(wx.precipitation_prob * 100)}%`
      : 'no weather data';
    return `City ${i + 1}: ${city}\n  Vibe: ${vibeStr}\n  Weather: ${wxStr}`;
  }).join('\n\n');

  const systemPrompt =
    'You are a professional fashion stylist and AI image director. ' +
    'Your task is to write precise, vivid NanoBanana image generation prompts ' +
    'for fashion editorial photography. Each prompt must be photorealistic and ' +
    'capture the unique spirit of the destination and its current weather. ' +
    'Always respond with valid JSON only — no markdown fences, no extra text.';

  const userPrompt = `Generate exactly ${PROMPTS_PER_CITY} fashion editorial image prompts for EACH of the following cities (${activeCities.length * PROMPTS_PER_CITY} prompts total):

${cityBlocks}

Rules for each prompt:
1. mood: 2-3 word hyphenated English label (e.g. "morning-exploration", "golden-hour-cafe")
2. Each prompt must specify:
   - Specific clothing items appropriate for the climate and city vibe
   - A recognizable location type in that city (cafe, street, market, rooftop, etc.)
   - Lighting style (golden hour, soft overcast, neon-lit evening, bright midday, etc.)
   - Camera angle (full body, 3/4 shot, street-level)
   - End with: "fashion editorial photography, professional model, high fashion magazine style, photorealistic, 4K"
3. negative_prompt: include "blurry, low quality, cartoon, nsfw" plus any style-specific items to avoid
4. Prompts for the same city must have different moods/times-of-day

Climate clothing guide:
- cold (<10°C): heavy coats, thermal layers, knits, waterproof boots
- mild (10–18°C): trench coat, light knitwear, ankle boots
- warm (18–26°C): light layers, breathable fabrics, sandals or loafers
- hot (>26°C): linen, minimal layers, sun hat, sandals
- rainy: waterproof jacket, rain boots, umbrella as prop

Respond ONLY with this JSON:
{
  "prompts": [
    { "city": "CityName", "mood": "mood-label", "prompt": "...", "negative_prompt": "..." },
    ...
  ]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    temperature: 0.85,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content[0];
  if (raw.type !== 'text') {
    throw new Error('[styleAgent] Unexpected Claude response type');
  }

  const cleaned = raw.text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: ClaudeStyleResponse;
  try {
    parsed = JSON.parse(cleaned) as ClaudeStyleResponse;
  } catch (err) {
    throw new Error(
      `[styleAgent] Failed to parse Claude JSON: ${(err as Error).message}\nRaw: ${cleaned.slice(0, 400)}`
    );
  }

  if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
    throw new Error('[styleAgent] Claude returned no prompts');
  }

  // Normalise and cap at MAX_CITIES * PROMPTS_PER_CITY
  return parsed.prompts
    .slice(0, MAX_CITIES * PROMPTS_PER_CITY)
    .map((p) => ({
      city: String(p.city ?? ''),
      mood: String(p.mood ?? 'editorial'),
      prompt: String(p.prompt ?? ''),
      negative_prompt: String(p.negative_prompt ?? DEFAULT_NEGATIVE),
    }));
}

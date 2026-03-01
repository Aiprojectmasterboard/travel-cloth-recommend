/**
 * vibeAgent.ts
 *
 * Uses the Claude API to generate a city-specific fashion mood from weather data.
 * Output: mood_name, vibe_tags, color_palette, avoid_note — plus a combined
 * `{City} — {mood_name}` label.
 *
 * Model: claude-sonnet-4-6
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Bindings } from '../index';
import type { WeatherResult } from './weatherAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VibeResult {
  /** City name — injected by orchestrator after generation */
  city?: string;
  /** e.g. "Paris — Rainy Chic" */
  mood_label: string;
  /** e.g. "Rainy Chic" */
  mood_name: string;
  /** e.g. ["romantic", "layered", "effortless"] */
  vibe_tags: string[];
  /** Hex colours, e.g. ["#8B7355", "#C4B5A0", "#2C3E50"] */
  color_palette: string[];
  /** What to avoid, e.g. "Avoid heavy fur or thick woolen coats" */
  avoid_note: string;
}

// Claude response shape (raw parsed JSON)
interface ClaudeVibeResponse {
  mood_name: string;
  vibe_tags: string[];
  color_palette: string[];
  avoid_note: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6';

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates a fashion vibe/mood for a city based on its current weather.
 *
 * @param input - city name, country, and WeatherResult for the travel month
 * @param env   - Cloudflare Worker bindings (needs ANTHROPIC_API_KEY)
 */
export async function vibeAgent(
  input: { city: string; country: string; weather: WeatherResult },
  env: Bindings
): Promise<VibeResult> {
  const { city, country, weather } = input;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const systemPrompt =
    'You are an expert travel fashion stylist who specialises in creating location-specific ' +
    'outfit moods. You understand how climate, culture, and local aesthetics combine to ' +
    'define a unique fashion moment. ' +
    'Always respond with valid JSON only — no markdown fences, no extra text.';

  const userPrompt = `Generate a fashion mood for a trip to ${city}, ${country}.

Climate data for this month:
- Average daytime temperature: ${weather.temperature_day_avg}°C
- Average night temperature: ${weather.temperature_night_avg}°C
- Probability of rain: ${Math.round(weather.precipitation_prob * 100)}%
- Climate band: ${weather.climate_band}
- Style hint: ${weather.style_hint}

Rules:
1. mood_name must be 2–3 words in English that evoke both the city's character and the weather (e.g. "Rainy Chic", "Golden Sunset Ease", "Nordic Street Edge")
2. vibe_tags: 3–5 single-word English adjectives
3. color_palette: exactly 3 hex colour codes that match the mood
4. avoid_note: one practical sentence about what clothing to avoid for this climate/season

Respond ONLY with this exact JSON (no surrounding text):
{
  "mood_name": "...",
  "vibe_tags": ["...", "...", "..."],
  "color_palette": ["#XXXXXX", "#XXXXXX", "#XXXXXX"],
  "avoid_note": "..."
}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    temperature: 0.9,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content[0];
  if (raw.type !== 'text') {
    throw new Error(`[vibeAgent] Unexpected Claude response type: ${raw.type}`);
  }

  // Strip accidental markdown fences before parsing
  const cleaned = raw.text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: ClaudeVibeResponse;
  try {
    parsed = JSON.parse(cleaned) as ClaudeVibeResponse;
  } catch (err) {
    throw new Error(
      `[vibeAgent] Failed to parse Claude JSON for ${city}: ${(err as Error).message}\nRaw: ${cleaned.slice(0, 300)}`
    );
  }

  // Validate required fields
  if (!parsed.mood_name || typeof parsed.mood_name !== 'string') {
    throw new Error(`[vibeAgent] Claude returned empty mood_name for ${city}`);
  }
  if (!Array.isArray(parsed.vibe_tags) || parsed.vibe_tags.length === 0) {
    parsed.vibe_tags = ['versatile', 'stylish', 'travel-ready'];
  }
  if (!Array.isArray(parsed.color_palette) || parsed.color_palette.length === 0) {
    parsed.color_palette = ['#8B7355', '#C4B5A0', '#2C3E50'];
  }

  const moodName = parsed.mood_name.trim();

  return {
    mood_label: `${city} — ${moodName}`,
    mood_name: moodName,
    vibe_tags: parsed.vibe_tags.slice(0, 5).map(String),
    color_palette: parsed.color_palette.slice(0, 3).map(String),
    avoid_note: typeof parsed.avoid_note === 'string' ? parsed.avoid_note : '',
  };
}

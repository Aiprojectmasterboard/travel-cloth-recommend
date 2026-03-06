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

/**
 * Optional user profile for personalised image generation.
 * When provided, the model directive, silhouette, and clothing choices
 * in each prompt are adjusted to reflect the traveller's body and aesthetic.
 */
export interface UserProfile {
  /** Drives model directive: "male model" | "female model" | "androgynous model" */
  gender: 'male' | 'female' | 'non-binary';
  /** Height in centimetres — used to choose tall/average/petite silhouette phrasing */
  height_cm?: number;
  /** Weight in kilograms — used together with height to pick BMI-appropriate silhouettes */
  weight_kg?: number;
  /** Preferred fashion aesthetics e.g. ["minimalist", "classic", "streetwear"] */
  aesthetics: string[];
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

// ─── Profile Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the model directive string used at the start of every image prompt.
 * e.g. "Female model", "Male model", "Androgynous model"
 */
function resolveModelDirective(gender: UserProfile['gender']): string {
  if (gender === 'male') return 'Male model';
  if (gender === 'non-binary') return 'Androgynous model';
  return 'Female model';
}

/**
 * Derives a height-based silhouette descriptor from centimetres.
 * Falls back to "average height" when height is unknown.
 */
function resolveHeightDescriptor(height_cm?: number): string {
  if (!height_cm) return 'average height';
  if (height_cm >= 175) return 'tall slender figure';
  if (height_cm <= 160) return 'petite figure';
  return 'average height figure';
}

/**
 * Returns a BMI-aware silhouette note for the prompt.
 * Returns an empty string when insufficient data is provided so that
 * the prompt stays clean rather than guessing.
 */
function resolveBmiNote(height_cm?: number, weight_kg?: number): string {
  if (!height_cm || !weight_kg) return '';
  const heightM = height_cm / 100;
  const bmi = weight_kg / (heightM * heightM);
  if (bmi < 18.5) return 'slender build';
  if (bmi < 25) return 'slim build';
  if (bmi < 30) return 'regular build';
  return 'full-figured silhouette';
}

/**
 * Converts a list of aesthetic keywords into styling guidance that
 * the image prompt can reference for clothing choices.
 *
 * Examples:
 *   ["minimalist"] → "clean lines, neutral tones, minimal accessories"
 *   ["streetwear"] → "oversized silhouettes, sneakers, graphic elements"
 */
function resolveAestheticGuidance(aesthetics: string[]): string {
  const mapping: Record<string, string> = {
    minimalist:  'clean lines, neutral tones, minimal accessories',
    classic:     'tailored cuts, timeless pieces, polished accessories',
    streetwear:  'oversized silhouettes, sneakers, graphic elements',
    bohemian:    'flowy fabrics, earthy tones, layered textures',
    romantic:    'soft draping, floral details, delicate accessories',
    edgy:        'structured cuts, dark tones, statement accessories',
    sporty:      'functional layers, athletic-inspired pieces, comfortable footwear',
    preppy:      'clean-cut pieces, polo-style tops, loafers or white sneakers',
    luxury:      'premium fabrics, designer-inspired pieces, refined accessories',
    vintage:     'retro silhouettes, muted palettes, nostalgic details',
  };

  const matched = aesthetics
    .map((a) => mapping[a.toLowerCase()])
    .filter(Boolean);

  return matched.length > 0
    ? matched.join('; ')
    : aesthetics.join(', ');
}

/**
 * Detects if the user profile represents a non-walking infant.
 * Criteria: height < 85cm AND weight < 13kg.
 */
function isInfantProfile(profile?: UserProfile): boolean {
  return !!(
    profile?.height_cm && profile.height_cm < 85 &&
    profile?.weight_kg && profile.weight_kg < 13
  );
}

/**
 * Builds a concise profile block injected into the Claude user prompt.
 * Returns an empty string when no profile is provided so the prompt
 * degrades gracefully.
 */
function buildProfileBlock(profile?: UserProfile): string {
  if (!profile) return '';

  if (isInfantProfile(profile)) {
    return [
      `User Profile (apply to ALL prompts):`,
      `  - Subject: a baby/infant (${profile.height_cm}cm, ${profile.weight_kg}kg)`,
      `  - IMPORTANT: The baby must be lying in a stylish stroller/pram, NOT standing`,
      `  - Outfit: cute, weather-appropriate baby clothing`,
      `  - Scene: the stroller is positioned near the landmark, warm and adorable`,
    ].join('\n');
  }

  const modelDirective = resolveModelDirective(profile.gender);
  const heightDesc    = resolveHeightDescriptor(profile.height_cm);
  const bmiNote       = resolveBmiNote(profile.height_cm, profile.weight_kg);
  const aesthetics    = profile.aesthetics.length > 0
    ? profile.aesthetics.join(', ')
    : 'versatile travel style';
  const aestheticHints = resolveAestheticGuidance(profile.aesthetics);

  const lines = [
    `User Profile (apply to ALL prompts):`,
    `  - Model directive: ${modelDirective}`,
    `  - Figure: ${heightDesc}${bmiNote ? `, ${bmiNote}` : ''}`,
    `  - Style preferences: ${aesthetics}`,
    `  - Aesthetic guidance: ${aestheticHints}`,
  ];

  return lines.join('\n');
}

/**
 * Builds the model/figure prefix injected at the start of each image prompt.
 * e.g. "Female model, petite figure, slim build, "
 * For infants: "A cute baby lying in a stylish stroller, "
 */
function buildImagePrefix(profile?: UserProfile): string {
  if (!profile) return '';

  if (isInfantProfile(profile)) {
    return 'A cute baby lying comfortably in a stylish stroller, wearing a weather-appropriate baby outfit, ';
  }

  const directive  = resolveModelDirective(profile.gender);
  const heightDesc = resolveHeightDescriptor(profile.height_cm);
  const bmiNote    = resolveBmiNote(profile.height_cm, profile.weight_kg);

  const parts = [directive, heightDesc, bmiNote].filter(Boolean);
  return parts.join(', ') + ', ';
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates 2 NanoBanana image prompts per city (up to 6 total).
 *
 * @param input.vibeResults  - Array of VibeResult from vibeAgent (one per city)
 * @param input.cities       - City names in the same order as vibeResults
 * @param input.weather      - Optional WeatherResult array for additional context
 * @param input.userProfile  - Optional traveller profile to personalise model/silhouette/aesthetics
 * @param env                - Cloudflare Worker bindings
 */
export async function styleAgent(
  input: {
    vibeResults: VibeResult[];
    cities: string[];
    weather?: WeatherResult[];
    userProfile?: UserProfile;
  },
  env: Bindings
): Promise<StylePrompts[]> {
  const { vibeResults, cities, weather = [], userProfile } = input;

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

  // Build user profile block (empty string when no profile is supplied)
  const profileBlock = buildProfileBlock(userProfile);
  // Build the image prompt prefix (e.g. "Female model, petite figure, slim build, ")
  const imagePrefix  = buildImagePrefix(userProfile);

  // Compose aesthetic rules for the prompt when a profile is available
  const aestheticRule = userProfile && userProfile.aesthetics.length > 0
    ? `   - Incorporate the user's style preferences (${userProfile.aesthetics.join(', ')}) into clothing choices`
    : '';

  const isInfant = isInfantProfile(userProfile);
  const systemPrompt =
    'You are a professional fashion stylist and AI image director. ' +
    'Your task is to write precise, vivid NanoBanana image generation prompts ' +
    'for fashion editorial photography. Each prompt must be photorealistic and ' +
    'capture the unique spirit of the destination and its current weather. ' +
    (isInfant
      ? 'IMPORTANT: The subject is a baby/infant who cannot walk. Every prompt MUST show the baby ' +
        'lying comfortably in a stylish stroller/pram, wearing cute weather-appropriate baby clothing. ' +
        'The stroller should be positioned near the landmark. The scene should look warm and adorable. '
      : userProfile
      ? 'You must also honour the provided user profile — model directive, figure description, ' +
        'and aesthetic preferences must be reflected in every prompt. '
      : '') +
    'Always respond with valid JSON only — no markdown fences, no extra text.';

  const userPrompt = `Generate exactly ${PROMPTS_PER_CITY} fashion editorial image prompts for EACH of the following cities (${activeCities.length * PROMPTS_PER_CITY} prompts total):

${cityBlocks}
${profileBlock ? `\n${profileBlock}\n` : ''}
Rules for each prompt:
1. mood: 2-3 word English label for the travel occasion (e.g. "city-exploration", "museum-visit", "cafe-afternoon", "evening-stroll")
2. Each prompt MUST begin with: "${imagePrefix || 'A fashion model, '}" followed by the outfit description
3. Each prompt must specify:
   - Specific clothing items appropriate for the climate, city vibe, AND the travel occasion${aestheticRule ? `\n${aestheticRule}` : ''}
   - A SPECIFIC famous landmark or iconic location in that city as background (e.g. Eiffel Tower, Louvre Museum, Champs-Élysées)
   - The person must be standing naturally in front of or near the landmark
   - Lighting style (golden hour, soft overcast, neon-lit evening, bright midday, etc.)
   - Camera angle: ${isInfant ? 'eye-level shot of the baby in the stroller, showing the full outfit and stroller' : 'full body shot showing the complete outfit from head to toe'}
   - End with: "fashion editorial photography, photorealistic, 4K, sharp focus"
4. negative_prompt: include "blurry, low quality, cartoon, nsfw" plus any style-specific items to avoid
5. Prompts for the same city must have different travel occasions (e.g. one for museum/culture, one for city walk/cafe)

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

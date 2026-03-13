/**
 * styleAgent.ts  (Pro plan only)
 *
 * Uses OpenAI GPT-5.4 (Responses API) to generate gpt-image-1.5 image prompts
 * for each city. Produces 4 prompts per city (max 12 total for a 3-city trip).
 *
 * Image style: luxury travel editorial, fashion week street style
 * Each panel must show: same traveler, different outfit, full body head-to-toe,
 * destination landmark background (no repeated landmarks within same grid).
 *
 * Model: gpt-5.4
 */

import type { Bindings } from '../index';
import type { VibeResult } from './vibeAgent';
import type { WeatherResult } from './weatherAgent';
import { chatCompletionJSON } from './openaiChat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StylePrompts {
  city: string;
  mood: string;     // short label e.g. "morning-exploration"
  prompt: string;   // full DALL-E 3 positive prompt
  negative_prompt: string;
}

export interface UserProfile {
  gender: 'male' | 'female' | 'non-binary';
  height_cm?: number;
  weight_kg?: number;
  aesthetics: string[];
}

interface StyleResponse {
  prompts: Array<{
    city: string;
    mood: string;
    prompt: string;
    negative_prompt: string;
  }>;
}

export interface StyleGridPrompt {
  city: string;
  prompt: string;        // Combined 2x2 grid prompt for DALL-E 3
  negative_prompt: string;
  outfits: Array<{
    quadrant: number;    // 1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right
    mood: string;
    items: string[];
  }>;
}

interface StyleGridResponse {
  grids: Array<{
    city: string;
    prompt: string;
    negative_prompt: string;
    outfits: Array<{
      quadrant: number;
      mood: string;
      items: string[];
    }>;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NEGATIVE =
  'text, watermark, logo, brand name, lowres, blurry, bad anatomy, deformed hands, ' +
  'extra fingers, extra limbs, duplicate people, mismatched shoes, wrong outfit colors, ' +
  'messy layering, distracting background, background dominating subject, ' +
  'generic tourist clothing, cropped body, missing feet, cut off legs, ' +
  'nudity, revealing clothes, cartoon, illustration, anime, painting, sketch, drawing, ' +
  '3d render, low quality, low resolution, nsfw, twisted anatomy, incorrect proportions';

const PROMPTS_PER_CITY = 4;
const MAX_CITIES = 3;

// ─── Profile Helpers ──────────────────────────────────────────────────────────

function resolveModelDirective(gender: UserProfile['gender']): string {
  if (gender === 'male') return 'Male model';
  if (gender === 'non-binary') return 'Androgynous model';
  return 'Female model';
}

function resolveHeightDescriptor(height_cm?: number): string {
  if (!height_cm) return 'average height';
  if (height_cm >= 175) return 'tall slender figure';
  if (height_cm <= 160) return 'petite figure';
  return 'average height figure';
}

function resolveBmiNote(height_cm?: number, weight_kg?: number): string {
  if (!height_cm || !weight_kg) return '';
  const heightM = height_cm / 100;
  const bmi = weight_kg / (heightM * heightM);
  if (bmi < 18.5) return 'slender build';
  if (bmi < 25) return 'slim build';
  if (bmi < 30) return 'regular build';
  return 'full-figured silhouette';
}

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
  const matched = aesthetics.map((a) => mapping[a.toLowerCase()]).filter(Boolean);
  return matched.length > 0 ? matched.join('; ') : aesthetics.join(', ');
}

function isInfantProfile(profile?: UserProfile): boolean {
  return !!(
    profile?.height_cm && profile.height_cm < 85 &&
    profile?.weight_kg && profile.weight_kg < 13
  );
}

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

  return [
    `User Profile (apply to ALL prompts):`,
    `  - Model directive: ${modelDirective}`,
    `  - Figure: ${heightDesc}${bmiNote ? `, ${bmiNote}` : ''}`,
    `  - Style preferences: ${aesthetics}`,
    `  - Aesthetic guidance: ${aestheticHints}`,
  ].join('\n');
}

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

export async function styleAgent(
  input: {
    vibeResults: VibeResult[];
    cities: string[];
    weather?: WeatherResult[];
    userProfile?: UserProfile;
    outfitDescriptions?: Array<{ day: number; city: string; items: string[]; styling_directions?: string[]; color_story?: string }>;
    capsuleItems?: Array<{ name: string; category: string; color?: string; material?: string; fit?: string }>;
    stylingBrief?: { base_neutrals?: string[]; accent_color?: string; jewelry_tone?: string; silhouette_goal?: string };
  },
  env: Bindings
): Promise<StylePrompts[]> {
  const { vibeResults, cities, weather = [], userProfile, outfitDescriptions = [], capsuleItems = [], stylingBrief } = input;

  const activeCities = cities.slice(0, MAX_CITIES);
  const activeVibes = vibeResults.slice(0, MAX_CITIES);

  // Build per-city context block with rain detection
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

  const profileBlock = buildProfileBlock(userProfile);
  const imagePrefix  = buildImagePrefix(userProfile);

  // Build capsule outfit reference block (with styling_directions and color_story)
  const outfitsByCity: Record<string, Array<{ day: number; items: string[]; styling_directions?: string[]; color_story?: string }>> = {};
  for (const od of outfitDescriptions) {
    const key = od.city.toLowerCase();
    if (!outfitsByCity[key]) outfitsByCity[key] = [];
    outfitsByCity[key].push({ day: od.day, items: od.items, styling_directions: od.styling_directions, color_story: od.color_story });
  }

  const capsuleOutfitBlock = activeCities.map((city) => {
    const cityOutfits = outfitsByCity[city.toLowerCase()] ?? [];
    if (cityOutfits.length === 0) return '';
    return cityOutfits.slice(0, PROMPTS_PER_CITY).map((o, j) => {
      const base = `  Outfit ${j + 1} for ${city} (Day ${o.day}): ${o.items.join(', ')}`;
      const stylingDir = o.styling_directions?.length
        ? `\n    Styling directions: ${o.styling_directions.join('; ')}`
        : '';
      const colorStory = o.color_story
        ? `\n    Color story: ${o.color_story}`
        : '';
      return base + stylingDir + colorStory;
    }).join('\n');
  }).filter(Boolean).join('\n');

  // Enhanced item list with color/material/fit for better prompt accuracy
  const capsuleItemList = capsuleItems.length > 0
    ? `\nCapsule wardrobe items (use ONLY these items — describe with exact color, material, and fit):\n${capsuleItems.map((i) => {
        const details = [i.category];
        if (i.color) details.push(i.color);
        if (i.material) details.push(i.material);
        if (i.fit) details.push(`${i.fit} fit`);
        return `  - ${i.name} (${details.join(', ')})`;
      }).join('\n')}\n`
    : '';

  // Build styling brief block (same pattern as styleAgentGrid)
  const stylingBriefBlock = stylingBrief
    ? `\nTrip Styling Brief (MUST be reflected in ALL prompts for cohesive visual identity):
  - Color palette: base neutrals [${stylingBrief.base_neutrals?.join(', ') ?? 'black, cream'}] + accent [${stylingBrief.accent_color ?? 'terracotta'}]
  - Jewelry tone: ${stylingBrief.jewelry_tone ?? 'gold'}
  - Silhouette goal: ${stylingBrief.silhouette_goal ?? 'balanced proportions'}
  - Each outfit uses at most 3 colors (dominant + secondary + optional accent)
  - The accent color appears in 1-2 prompts per city (not all)\n`
    : '';

  // Detect rain cities for weather overrides
  const rainCities = new Set(
    activeCities.filter((_, i) => {
      const wx = weather[i];
      return wx && wx.precipitation_prob > 0.4;
    })
  );

  const isInfant = isInfantProfile(userProfile);

  const systemPrompt =
    'You are a world-class fashion stylist and AI image director for TravelCapsule — ' +
    'think Elin Kling directing a PORTER travel editorial shoot. ' +
    'Your task is to write precise, vivid gpt-image-1.5 image generation prompts ' +
    'for luxury travel fashion editorial photography. ' +
    'Each prompt MUST follow a strict section-based format: ' +
    '[STYLE], [SUBJECT], [OUTFIT_SPEC], [STYLING_DIRECTIONS], [COMPOSITION], [LIGHTING], [BACKGROUND], [WEATHER_OVERRIDES], [NEGATIVE]. ' +
    'Images must look like: instagram travel street style editorial, polished premium realistic photography. ' +
    'Full-body portrait, 4:5 vertical framing, subject centered, shallow depth of field, background bokeh. ' +
    'ZERO brand logos, ZERO text overlays. ' +
    (isInfant
      ? 'IMPORTANT: The subject is a baby/infant who cannot walk. Every prompt MUST show the baby ' +
        'lying comfortably in a stylish stroller/pram, wearing cute weather-appropriate baby clothing. ' +
        'The stroller should be positioned near the landmark. The scene should look warm and adorable. '
      : userProfile
      ? 'You must honour the provided user profile — model directive, figure description, ' +
        'and aesthetic preferences must be reflected in every prompt. '
      : '') +
    'Each prompt for the same city MUST use a DIFFERENT iconic landmark in the [BACKGROUND] section — ' +
    'landmarks must never repeat within the same city. ' +
    'Always respond with valid JSON only — no markdown fences, no extra text.';

  const hasOutfitRef = capsuleOutfitBlock.length > 0;
  const subjectDesc = imagePrefix || 'A fashion model, ';

  const userPrompt = `Generate exactly ${PROMPTS_PER_CITY} fashion editorial image prompts for EACH of the following cities (${activeCities.length * PROMPTS_PER_CITY} prompts total).

${cityBlocks}
${profileBlock ? `\n${profileBlock}\n` : ''}${stylingBriefBlock}${capsuleItemList}${hasOutfitRef ? `\nPre-assigned outfits (MUST match these exactly — describe each item with specific color, material, and styling state):\n${capsuleOutfitBlock}\n` : ''}
Each generated prompt MUST follow this EXACT section order:

[STYLE] {city_mood from vibe data}, instagram travel street style editorial, polished premium realistic photography
[SUBJECT] full-body portrait, realistic proportions, single person, ${isInfant ? 'a cute baby in a stylish stroller' : subjectDesc.replace(/, $/, '')}, natural confident pose
[OUTFIT_SPEC] ${hasOutfitRef ? 'EXACT items from pre-assigned outfit above — describe each item with its specific color, material, fit, and state (open/closed/tucked/rolled)' : 'specific clothing items appropriate for the climate and city vibe — each item named with color, material, and fit'}
[STYLING_DIRECTIONS] 3-color max rule (dominant + secondary + optional accent only); third piece mandatory (blazer/coat/scarf/bag/belt/jewelry elevating the look); rule-of-thirds proportion (shirt tucked/half-tucked, sleeves rolled, coat open revealing inner layer, belt defining waist, OR cropped outer + high-waisted bottom); clean editorial layering — no messiness
[COMPOSITION] eye-level shot, full-body in frame, 4:5 vertical portrait, subject centered at 1/3 axis, entire figure head-to-toe visible including feet, shallow depth of field, background softly blurred (bokeh)
[LIGHTING] {choose based on weather and time: golden hour warm glow / soft overcast diffused light / neon-lit evening ambiance / bright midday sunlight / moody atmospheric rain light}
[BACKGROUND] {city_name}, iconic landmark: {specific landmark — e.g. Eiffel Tower / Shibuya Crossing / Colosseum / Park Güell} — landmark recognizable but not dominant, travel editorial mood — each prompt in the same city MUST use a DIFFERENT landmark
[WEATHER_OVERRIDES] ${rainCities.size > 0 ? `for rain cities (${[...rainCities].join(', ')}): model holds umbrella in one hand, wet pavement reflections visible, overcast moody lighting, model wears waterproof/rain-appropriate items from capsule` : 'clear day — no weather overrides needed'}
[NEGATIVE] text, watermark, logo, brand name, lowres, blurry, bad anatomy, deformed hands, extra fingers, extra limbs, duplicate people, mismatched shoes, wrong outfit colors, messy layering, distracting background, background dominating subject, generic tourist clothing, cropped body, missing feet, cut off legs

Rules:
1. mood: 2-3 word English label for the travel occasion (e.g. "city-exploration", "museum-visit", "cafe-afternoon", "evening-stroll")
2. Each prompt MUST start with the [STYLE] section tag and follow all 9 sections in order
3. Each prompt for the same city MUST depict a completely different travel scenario, landmark, and lighting — no two prompts should share a landmark or similar composition
4. Style MUST look like luxury travel editorial — intentional, curated, elevated; avoid generic outfits or tourist clothing
${hasOutfitRef ? '5. CRITICAL: [OUTFIT_SPEC] MUST depict EXACTLY the pre-assigned items. Do NOT substitute, swap, or add items. The image must match the breakdown shown to the user.' : ''}

Climate clothing guide (apply in [OUTFIT_SPEC]):
- cold (<10°C): heavy coats, thermal layers, knits, waterproof boots
- mild (10–18°C): trench coat, light knitwear, ankle boots
- warm (18–26°C): light layers, breathable fabrics, sandals or loafers
- hot (>26°C): linen, minimal layers, sun hat, sandals
- rainy (>40% prob): waterproof jacket/trench, rain boots or rubber-sole shoes, umbrella in [WEATHER_OVERRIDES]

Respond ONLY with this JSON:
{
  "prompts": [
    { "city": "CityName", "mood": "mood-label", "prompt": "...", "negative_prompt": "..." },
    ...
  ]
}`;

  const parsed = await chatCompletionJSON<StyleResponse>(
    env.OPENAI_API_KEY,
    systemPrompt,
    userPrompt,
    { maxTokens: 4096, reasoningEffort: 'medium' },
  );

  if (!Array.isArray(parsed.prompts) || parsed.prompts.length === 0) {
    throw new Error('[styleAgent] GPT-5.4 returned no prompts');
  }

  return parsed.prompts
    .slice(0, MAX_CITIES * PROMPTS_PER_CITY)
    .map((p) => ({
      city: String(p.city ?? ''),
      mood: String(p.mood ?? 'editorial'),
      prompt: String(p.prompt ?? ''),
      negative_prompt: String(p.negative_prompt ?? DEFAULT_NEGATIVE),
    }));
}

// ─── Grid Prompt Generator ────────────────────────────────────────────────────

/**
 * Generates a single 2x2 grid image prompt per city for Pro/Annual plans.
 *
 * Instead of 4 separate portrait images per city, this produces ONE combined
 * square prompt where each quadrant depicts a different outfit at a different
 * landmark. The result is generated as a single 1024x1024 DALL-E 3 image.
 *
 * @param input.vibeResults         - Per-city vibe/mood data from vibeAgent
 * @param input.cities              - Ordered list of city names
 * @param input.weather             - Per-city weather data (optional)
 * @param input.userProfile         - User gender, body type, aesthetics (optional)
 * @param input.outfitDescriptions  - Per-day outfit item lists from capsuleAgent
 * @param input.capsuleItems        - Full capsule wardrobe item list
 * @param env                       - Cloudflare Worker bindings
 */
export async function styleAgentGrid(
  input: {
    vibeResults: VibeResult[];
    cities: string[];
    weather?: WeatherResult[];
    userProfile?: UserProfile;
    outfitDescriptions?: Array<{ day: number; city: string; items: string[]; styling_directions?: string[]; color_story?: string }>;
    capsuleItems?: Array<{ name: string; category: string; color?: string; material?: string; fit?: string }>;
    stylingBrief?: { base_neutrals?: string[]; accent_color?: string; jewelry_tone?: string; silhouette_goal?: string };
  },
  env: Bindings
): Promise<StyleGridPrompt[]> {
  const {
    vibeResults,
    cities,
    weather = [],
    userProfile,
    outfitDescriptions = [],
    capsuleItems = [],
    stylingBrief,
  } = input;

  const activeCities = cities.slice(0, MAX_CITIES);
  const activeVibes  = vibeResults.slice(0, MAX_CITIES);

  // Build per-city context block
  const cityBlocks = activeCities.map((city, i) => {
    const vibe  = activeVibes[i];
    const wx    = weather[i];
    const vibeStr = vibe
      ? `mood: ${vibe.mood_name}, tags: ${vibe.vibe_tags.join(', ')}, avoid: ${vibe.avoid_note}`
      : 'no vibe data';
    const wxStr = wx
      ? `${wx.climate_band}, ${wx.temperature_day_avg}°C avg, rain prob ${Math.round(wx.precipitation_prob * 100)}%`
      : 'no weather data';
    return `City ${i + 1}: ${city}\n  Vibe: ${vibeStr}\n  Weather: ${wxStr}`;
  }).join('\n\n');

  const profileBlock = buildProfileBlock(userProfile);
  const imagePrefix  = buildImagePrefix(userProfile);

  // Group outfits by city
  const outfitsByCity: Record<string, Array<{ day: number; items: string[] }>> = {};
  for (const od of outfitDescriptions) {
    const key = od.city.toLowerCase();
    if (!outfitsByCity[key]) outfitsByCity[key] = [];
    outfitsByCity[key].push({ day: od.day, items: od.items });
  }

  // Describe pre-assigned outfits for each city (up to 4 per city — one per quadrant)
  const outfitRefBlock = activeCities.map((city) => {
    const cityOutfits = outfitsByCity[city.toLowerCase()] ?? [];
    if (cityOutfits.length === 0) return '';
    const lines = cityOutfits.slice(0, 4).map((o, j) => {
      const base = `  Quadrant ${j + 1} for ${city} (Day ${o.day}): ${o.items.join(', ')}`;
      const stylingDir = (o as any).styling_directions?.length
        ? `\n    Styling: ${(o as any).styling_directions.join('; ')}`
        : '';
      const colorStory = (o as any).color_story
        ? `\n    Color story: ${(o as any).color_story}`
        : '';
      return base + stylingDir + colorStory;
    });
    return lines.join('\n');
  }).filter(Boolean).join('\n');

  // Enhanced item list with color/material/fit for better prompt accuracy
  const capsuleItemList = capsuleItems.length > 0
    ? `\nCapsule wardrobe items (use ONLY these items — describe them with their exact color, material, and fit):\n${capsuleItems.map((i) => {
        const details = [i.category];
        if ('color' in i && i.color) details.push(i.color);
        if ('material' in i && i.material) details.push(i.material);
        if ('fit' in i && i.fit) details.push(`${i.fit} fit`);
        return `  - ${i.name} (${details.join(', ')})`;
      }).join('\n')}\n`
    : '';

  // Build styling brief context for the prompt
  const stylingBriefBlock = stylingBrief
    ? `\nTrip Styling Brief (cohesive visual identity — MUST be reflected in all quadrants):
  - Color palette: base neutrals [${stylingBrief.base_neutrals?.join(', ') ?? 'black, cream'}] + accent [${stylingBrief.accent_color ?? 'terracotta'}]
  - Jewelry tone: ${stylingBrief.jewelry_tone ?? 'gold'}
  - Silhouette goal: ${stylingBrief.silhouette_goal ?? 'balanced proportions'}
  - Each outfit should use at most 3 colors (dominant + secondary + optional accent)
  - The accent color should appear in 1-2 quadrants (not all)\n`
    : '';

  const hasOutfitRef = outfitRefBlock.length > 0;
  const isInfant = isInfantProfile(userProfile);

  const modelDesc = imagePrefix || 'A fashion model, ';

  const systemPrompt =
    'You are a world-class fashion stylist and AI image director for TravelCapsule — ' +
    'think Elin Kling directing a PORTER travel editorial shoot. ' +
    'Your task is to write a single, precise gpt-image-1.5 image generation prompt per city. ' +
    'Each prompt must describe a 2x2 editorial grid photo where each quadrant shows a ' +
    'different outfit at a different city landmark. The panels are divided by thin white lines. ' +
    'Images must look like: luxury travel editorial, fashion week street style, ' +
    'professionally styled with intentional proportions and color harmony. ' +
    'Each panel MUST show: same traveler, different outfit, full body head-to-toe, ' +
    'destination landmark background (slightly blurred/bokeh — present but not distracting). ' +
    'Landmarks must NOT repeat within the same grid. ' +
    'ZERO brand logos, ZERO text overlays in the image. ' +
    (isInfant
      ? 'IMPORTANT: The subject is a baby/infant who cannot walk. Every quadrant MUST show the baby ' +
        'lying comfortably in a stylish stroller/pram, wearing cute weather-appropriate baby clothing. '
      : userProfile
      ? 'You must honour the provided user profile — model directive, figure, and aesthetic preferences ' +
        'must be reflected in every quadrant. '
      : '') +
    'Always respond with valid JSON only — no markdown fences, no extra text.';

  // Detect rain days for rain-specific prompt instructions
  const rainCities = activeCities.filter((_, i) => {
    const wx = weather[i];
    return wx && wx.precipitation_prob > 0.4;
  });
  const rainDayNote = rainCities.length > 0
    ? `\nRAIN DAY RULES (cities with >40% rain: ${rainCities.join(', ')}):
- At least 1 quadrant for rainy cities MUST show: umbrella held in hand, wet pavement reflections, overcast/rainy mood lighting
- The model should wear the waterproof/rain items from the capsule in that quadrant
- Background landmark should have a moody, atmospheric rain feel (glistening streets, cloudy sky)\n`
    : '';

  const userPrompt = `Generate exactly 1 fashion editorial GRID image prompt for EACH of the following cities (${activeCities.length} prompts total):

${cityBlocks}
${profileBlock ? `\n${profileBlock}\n` : ''}${stylingBriefBlock}${capsuleItemList}${hasOutfitRef ? `\nPre-assigned outfits per quadrant (MUST match exactly):\n${outfitRefBlock}\n` : ''}
Rules for each grid prompt:
1. The prompt must describe a "professional 2x2 fashion editorial grid photo" with "four separate panels arranged in a grid, each clearly divided by thin white lines"
2. Each quadrant (top-left, top-right, bottom-left, bottom-right) must describe:
   - ${modelDesc}wearing [EXACT outfit items from pre-assigned list above] — include specific colors, materials, fit, and styles
   - STYLING DIRECTIONS for each outfit (CRITICAL for editorial quality):
     * How garments are worn: tucked/half-tucked/untucked, sleeves rolled/down, buttons open/closed, layering state (coat open revealing top)
     * "Rule of thirds" proportions: ensure visual break at 1/3 or 2/3 of body (use tuck, cropped outer, high-waisted bottom, belt, open coat)
     * "Third piece" must be visible: blazer/coat/scarf/bag/belt/jewelry that elevates the look
   - A SPECIFIC famous landmark or iconic location in the city as background — each quadrant MUST use a DIFFERENT landmark
   - Background should be present but NOT distracting — slight bokeh/depth blur on the landmark
   - Lighting style (golden hour / soft overcast / neon-lit evening / bright midday) — vary across quadrants
   - Camera angle: ${isInfant ? 'eye-level shot of the baby in the stroller' : 'full body shot, complete outfit from head to toe, entire body and feet visible, fashion editorial framing'}
3. End every prompt with: "Luxury travel editorial photography, styled by a professional fashion editor, photorealistic, 4K, sharp focus, natural posing, consistent model appearance across all four panels."
4. The same model must appear in all four quadrants — consistent hair, face, physique
5. Style must look like a PORTER or Vogue travel editorial — intentional, curated, elevated. Avoid generic outfits or low-fashion tourist clothing.
6. negative_prompt: MUST include ALL of: "extra limbs, deformed hands, twisted anatomy, blurry, low quality, cartoon, nsfw, collage grid lines missing, merged panels, generic tourist clothing, cropped body, missing feet, brand logos, text overlay, messy layering, mismatched shoes, incorrect weather props, wrinkled clothes"
7. For "outfits" array: list each quadrant's mood (2-3 word label) and the exact item names used
${hasOutfitRef ? '8. CRITICAL: Each quadrant MUST depict EXACTLY the pre-assigned outfit items. Do NOT substitute or add items.' : ''}
${rainDayNote}
Climate clothing guide (apply per weather data):
- cold (<10°C): heavy coats, thermal layers, knits, waterproof boots
- mild (10–18°C): trench coat, light knitwear, ankle boots
- warm (18–26°C): light layers, breathable fabrics, sandals or loafers
- hot (>26°C): linen, minimal layers, sun hat, sandals
- rainy: waterproof jacket/trench, rain boots or rubber-sole shoes, umbrella as a prop in hand

Respond ONLY with this JSON:
{
  "grids": [
    {
      "city": "CityName",
      "prompt": "A professional 2x2 fashion editorial grid photo, styled by a top fashion editor. Four separate panels arranged in a grid, each clearly divided by thin white lines.\\n\\nTop-left panel: ${modelDesc}wearing [outfit 1 with color/material details], [styling direction: tucked/open/layered], at [landmark 1, slightly blurred background], [lighting], full body shot showing head to toe.\\nTop-right panel: ...\\nBottom-left panel: ...\\nBottom-right panel: ...\\n\\nLuxury travel editorial photography, photorealistic, 4K, sharp focus, natural posing, consistent model appearance across all four panels.",
      "negative_prompt": "extra limbs, deformed hands, twisted anatomy, blurry, low quality, cartoon, nsfw, collage grid lines missing, merged panels, generic tourist clothing, cropped body, missing feet, brand logos, text overlay, messy layering, mismatched shoes",
      "outfits": [
        { "quadrant": 1, "mood": "morning-exploration", "items": ["item1", "item2"] },
        { "quadrant": 2, "mood": "museum-visit", "items": ["item1", "item2"] },
        { "quadrant": 3, "mood": "cafe-afternoon", "items": ["item1", "item2"] },
        { "quadrant": 4, "mood": "evening-stroll", "items": ["item1", "item2"] }
      ]
    }
  ]
}`;

  const parsed = await chatCompletionJSON<StyleGridResponse>(
    env.OPENAI_API_KEY,
    systemPrompt,
    userPrompt,
    { maxTokens: 4096, reasoningEffort: 'medium' },
  );

  if (!Array.isArray(parsed.grids) || parsed.grids.length === 0) {
    throw new Error('[styleAgentGrid] GPT-5.4 returned no grid prompts');
  }

  return parsed.grids
    .slice(0, MAX_CITIES)
    .map((g) => ({
      city: String(g.city ?? ''),
      prompt: String(g.prompt ?? ''),
      negative_prompt: String(g.negative_prompt ?? DEFAULT_NEGATIVE),
      outfits: Array.isArray(g.outfits)
        ? g.outfits.map((o) => ({
            quadrant: Number(o.quadrant ?? 1),
            mood: String(o.mood ?? 'editorial'),
            items: Array.isArray(o.items) ? o.items.map(String) : [],
          }))
        : [],
    }));
}

/**
 * openaiImage.ts
 *
 * OpenAI Images API wrapper (gpt-image-1.5).
 * AI travel preparation platform — generates outfit images.
 *
 * gpt-image-1.5 valid sizes: 1024x1024, 1536x1024, 1024x1536, auto
 * gpt-image-1.5 valid quality: low, medium, high, auto
 * gpt-image-1.5 always returns b64_json (no response_format param needed)
 *
 * Never-Fail Architecture:
 *   Tier 1: User photo + /images/edits   (3 attempts — best effort)
 *   Tier 2: System default model + /images/edits (6 attempts, aggressive backoff — MUST succeed)
 *   Tier 3: Text-to-image /images/generations (5 attempts — last AI resort)
 *   → Always returns ArrayBuffer. NEVER returns null. NEVER falls to static images.
 *
 * Identity Engine:
 *   If user uploaded a reference photo, use /v1/images/edits endpoint to
 *   preserve traveler identity (facial structure, hairstyle, skin tone).
 *   If no reference photo, use system default model for consistent look.
 *
 * Quality: "high" for all paid plan images.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenAIImageResponse {
  data: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export type ImageQuality = 'low' | 'medium' | 'high';
// gpt-image-1.5 supported sizes
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';
const MODEL_PRIMARY = 'gpt-image-1.5';
const MODEL_FALLBACK = 'gpt-image-1';
const FETCH_TIMEOUT_MS = 120_000; // 2 minutes per request

// Tier 1: User photo — 3 attempts, moderate backoff
const TIER1_ATTEMPTS = 3;
const TIER1_BACKOFF_MS = [2_000, 4_000, 6_000] as const;

// Tier 2: System default model — 6 attempts, aggressive backoff (MUST succeed)
const TIER2_ATTEMPTS = 6;
const TIER2_BACKOFF_MS = [3_000, 5_000, 8_000, 12_000, 18_000, 25_000] as const;

// Tier 3: Text-to-image — 5 attempts, moderate backoff
const TIER3_ATTEMPTS = 5;
const TIER3_BACKOFF_MS = [3_000, 5_000, 8_000, 12_000, 18_000] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Decode base64 string to ArrayBuffer */
function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Fetch an image URL and return its raw bytes as a Blob.
 * Used by the Identity Engine to download user reference photos from R2.
 */
export async function fetchImageAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch reference image: HTTP ${res.status}`);
  }
  return res.blob();
}

// ─── Generation (no reference photo) ──────────────────────────────────────────

/**
 * Generates an image using OpenAI gpt-image-1.5 (text-to-image).
 * Returns the raw image buffer (PNG).
 * Tries gpt-image-1.5 first, falls back to gpt-image-1.
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'high',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  const models = [MODEL_PRIMARY, MODEL_FALLBACK];

  let lastError: Error | null = null;
  for (const model of models) {
    const body: Record<string, unknown> = {
      model,
      prompt,
      n: 1,
      size,
      quality,
    };
    if (model === MODEL_FALLBACK) {
      body.response_format = 'b64_json';
    }

    const res = await fetch(OPENAI_GENERATIONS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text();
      const errMsg = `OpenAI HTTP ${res.status}: ${text.slice(0, 300)}`;
      if (model === MODEL_PRIMARY) {
        console.warn(`[openaiImage] ${MODEL_PRIMARY} failed (${res.status}), trying ${MODEL_FALLBACK}...`);
        lastError = new Error(errMsg);
        continue;
      }
      throw new Error(errMsg);
    }

    const data = (await res.json()) as OpenAIImageResponse;

    if (data.error) {
      if (model === MODEL_PRIMARY) {
        console.warn(`[openaiImage] ${MODEL_PRIMARY} returned error: ${data.error.message}, trying ${MODEL_FALLBACK}...`);
        lastError = new Error(`OpenAI API error: ${data.error.message}`);
        continue;
      }
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }

    const imageItem = data.data?.[0];
    if (imageItem?.b64_json) {
      return b64ToArrayBuffer(imageItem.b64_json);
    }
    if (imageItem?.url) {
      const imgRes = await fetch(imageItem.url, { signal: AbortSignal.timeout(60_000) });
      if (!imgRes.ok) throw new Error(`Failed to fetch image URL: HTTP ${imgRes.status}`);
      return imgRes.arrayBuffer();
    }

    const errMsg = 'OpenAI returned no image data (neither b64_json nor url)';
    if (model === MODEL_PRIMARY) {
      console.warn(`[openaiImage] ${errMsg}, trying ${MODEL_FALLBACK}...`);
      lastError = new Error(errMsg);
      continue;
    }
    throw new Error(errMsg);
  }

  throw lastError ?? new Error('Image generation failed after all model attempts');
}

// ─── Generation with Reference Photo (Identity Engine) ───────────────────────

/**
 * Generates an image using OpenAI /images/edits endpoint with a reference photo.
 * Preserves traveler identity (facial structure, hairstyle, skin tone).
 */
export async function generateImageWithReference(
  prompt: string,
  referenceUrl: string,
  apiKey: string,
  quality: ImageQuality = 'high',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  const refBlob = await fetchImageAsBlob(referenceUrl);

  const formData = new FormData();
  formData.append('model', MODEL_PRIMARY);
  formData.append('prompt', prompt);
  formData.append('n', '1');
  formData.append('size', size);
  formData.append('quality', quality);
  formData.append('image', refBlob, 'reference.png');

  const res = await fetch(OPENAI_EDITS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Edits HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIImageResponse;

  if (data.error) {
    throw new Error(`OpenAI Edits API error: ${data.error.message}`);
  }

  const imageData = data.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error('OpenAI Edits returned no image data');
  }

  return b64ToArrayBuffer(imageData);
}

// ─── System Default Model Images ─────────────────────────────────────────────
// Professional model photos deployed to Pages CDN.
// Used as Tier 2 guaranteed fallback — this tier has 6 aggressive retries.

const DEFAULT_MODEL_URLS = {
  male:   'https://travelscapsule.com/defaults/default-male.png',
  female: 'https://travelscapsule.com/defaults/default-female.png',
} as const;

export function getDefaultModelUrl(gender: string): string {
  return gender === 'male' ? DEFAULT_MODEL_URLS.male : DEFAULT_MODEL_URLS.female;
}

// ─── Guaranteed Image Generation (Never-Fail) ────────────────────────────────
//
// Tier 1: User photo  + /images/edits   (3 attempts — best effort)
// Tier 2: Default model + /images/edits  (6 attempts, aggressive — MUST succeed)
// Tier 3: Text-to-image /images/generations (5 attempts — absolute last resort)
//
// This function ALWAYS returns an ArrayBuffer. It NEVER returns null.
// It NEVER falls through to static/Unsplash images.
// gpt-image-1.5 or gpt-image-1 will produce the image no matter what.

export async function generateImageGuaranteed(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'high',
  size: ImageSize = '1024x1536',
  userPhotoUrl?: string,
  gender: string = 'female',
): Promise<ArrayBuffer> {

  // ── Tier 1: User's uploaded photo + /images/edits (3 attempts) ──
  if (userPhotoUrl) {
    for (let attempt = 0; attempt < TIER1_ATTEMPTS; attempt++) {
      try {
        if (attempt > 0) await sleep(TIER1_BACKOFF_MS[attempt - 1] ?? 4_000);
        console.log(`[openaiImage] Tier 1 (user photo) attempt ${attempt + 1}/${TIER1_ATTEMPTS}...`);
        return await generateImageWithReference(prompt, userPhotoUrl, apiKey, quality, size);
      } catch (err) {
        console.warn(`[openaiImage] Tier 1 attempt ${attempt + 1} failed: ${(err as Error).message}`);
      }
    }
    console.warn('[openaiImage] Tier 1 exhausted — falling through to Tier 2 (default model, 6 retries)');
  }

  // ── Tier 2: System default model + /images/edits (6 attempts, MUST succeed) ──
  // This tier uses a stable, known-good system photo — no user-upload variability.
  // 6 attempts with aggressive exponential backoff (3s → 5s → 8s → 12s → 18s → 25s).
  // Total max wait: ~71 seconds. This should handle any transient OpenAI issues.
  const defaultModelUrl = getDefaultModelUrl(gender);
  for (let attempt = 0; attempt < TIER2_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await sleep(TIER2_BACKOFF_MS[attempt - 1] ?? 10_000);
      console.log(`[openaiImage] Tier 2 (default ${gender} model) attempt ${attempt + 1}/${TIER2_ATTEMPTS}...`);
      return await generateImageWithReference(prompt, defaultModelUrl, apiKey, quality, size);
    } catch (err) {
      console.warn(`[openaiImage] Tier 2 attempt ${attempt + 1}/${TIER2_ATTEMPTS} failed: ${(err as Error).message}`);
      // On safety filter rejection, simplify the prompt and retry
      const errMsg = (err as Error).message;
      if (errMsg.includes('safety') || errMsg.includes('content_policy') || errMsg.includes('rejected')) {
        console.warn('[openaiImage] Safety filter hit — simplifying prompt for next attempt');
        prompt = simplifySafetyPrompt(prompt);
      }
    }
  }
  console.warn('[openaiImage] Tier 2 exhausted after 6 attempts — falling through to Tier 3 (text-to-image, 5 retries)');

  // ── Tier 3: Pure text-to-image (no reference photo, 5 attempts) ──
  // If /images/edits endpoint is having issues, /images/generations is independent.
  // This always works as long as OpenAI API is reachable.
  for (let attempt = 0; attempt < TIER3_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await sleep(TIER3_BACKOFF_MS[attempt - 1] ?? 8_000);
      console.log(`[openaiImage] Tier 3 (text-to-image) attempt ${attempt + 1}/${TIER3_ATTEMPTS}...`);
      return await generateImage(prompt, apiKey, quality, size);
    } catch (err) {
      console.warn(`[openaiImage] Tier 3 attempt ${attempt + 1}/${TIER3_ATTEMPTS} failed: ${(err as Error).message}`);
      const errMsg = (err as Error).message;
      if (errMsg.includes('safety') || errMsg.includes('content_policy') || errMsg.includes('rejected')) {
        prompt = simplifySafetyPrompt(prompt);
      }
    }
  }

  // This should theoretically never be reached — 14 total AI attempts across 3 tiers.
  // But if it does, throw so the caller knows and can handle.
  throw new Error(
    `[CRITICAL] All 14 AI generation attempts failed (Tier1: ${TIER1_ATTEMPTS}, Tier2: ${TIER2_ATTEMPTS}, Tier3: ${TIER3_ATTEMPTS}). OpenAI API may be experiencing an outage.`
  );
}

// ─── Safety Prompt Simplifier ────────────────────────────────────────────────
// If OpenAI's safety filter rejects a prompt, strip potentially problematic
// sections and retry with a simpler version.

function simplifySafetyPrompt(prompt: string): string {
  // Remove negative prompt section (sometimes triggers filters)
  let simplified = prompt.replace(/\n\nDo NOT include:[\s\S]*$/, '');
  // Remove any body-specific descriptions that might trigger filters
  simplified = simplified.replace(/\b(slim|curvy|muscular|petite|athletic)\s+(build|figure|body)/gi, 'figure');
  // Keep it focused on fashion
  if (simplified.length > 800) {
    simplified = simplified.slice(0, 800) + '\n\nFashionable travel outfit, full-body portrait, high quality photography.';
  }
  return simplified;
}

// ─── Legacy: generateImageNeverFail (backward compatibility) ─────────────────
// Wraps generateImageGuaranteed but returns null instead of throwing (for callers
// that still use the old null-check pattern). New code should use generateImageGuaranteed.

export async function generateImageNeverFail(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'high',
  size: ImageSize = '1024x1536',
  userPhotoUrl?: string,
  gender: string = 'female',
): Promise<ArrayBuffer | null> {
  try {
    return await generateImageGuaranteed(prompt, apiKey, quality, size, userPhotoUrl, gender);
  } catch (err) {
    console.error('[openaiImage] generateImageNeverFail — all tiers failed:', (err as Error).message);
    return null;
  }
}

// ─── Legacy: generateImageWithRetry (still used by teaserAgent) ──────────────

/**
 * Generates image with exponential-backoff retry (3 attempts).
 * Unlike generateImageGuaranteed, this THROWS on failure (legacy behavior).
 */
export async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
  referenceUrl?: string,
): Promise<ArrayBuffer> {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [2_000, 4_000, 6_000] as const;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
      if (referenceUrl) {
        try {
          return await generateImageWithReference(prompt, referenceUrl, apiKey, quality, size);
        } catch (err) {
          console.warn(`[openaiImage] Reference failed, trying text-to-image: ${(err as Error).message}`);
        }
      }
      return await generateImage(prompt, apiKey, quality, size);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[openaiImage] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed: ${lastError.message}`
      );
    }
  }

  throw lastError ?? new Error('Image generation failed after all attempts');
}

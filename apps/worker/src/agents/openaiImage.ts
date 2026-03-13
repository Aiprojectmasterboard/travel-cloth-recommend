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
 * - Teaser (Standard):  quality "low",    size 1024x1536 (portrait, fast ~10-15s)
 * - Pro/Annual grid:    quality "medium", size 1024x1024 (2×2 grid, ~15-25s)
 *
 * Identity Engine:
 *   If user uploaded a reference photo, use /v1/images/edits endpoint to
 *   preserve traveler identity (facial structure, hairstyle, skin tone).
 *   If no reference photo, use /v1/images/generations with consistent
 *   default traveler model descriptor in the prompt.
 *
 * Retry strategy: exponential backoff — 2s, 4s, 6s (3 attempts)
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
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2_000, 4_000, 6_000] as const;
const FETCH_TIMEOUT_MS = 90_000;

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
 *
 * @param prompt  - Text prompt for image generation
 * @param apiKey  - OpenAI API key
 * @param quality - "low" for teasers, "medium" for paid plans
 * @param size    - Image dimensions. Defaults to "1024x1536" (portrait).
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  // Try primary model (gpt-image-1.5) first, fallback to gpt-image-1 on model error
  const models = [MODEL_PRIMARY, MODEL_FALLBACK];

  let lastError: Error | null = null;
  for (const model of models) {
    // gpt-image-1.5 always returns b64_json (no response_format param needed).
    // gpt-image-1 (fallback) requires explicit response_format to get b64_json.
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
      // On ANY error with primary model, try fallback model before giving up
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

    // Prefer b64_json; fall back to url if b64_json is absent (should not happen
    // after setting response_format, but guards against API contract changes).
    const imageItem = data.data?.[0];
    if (imageItem?.b64_json) {
      return b64ToArrayBuffer(imageItem.b64_json);
    }
    if (imageItem?.url) {
      // Fetch the image URL and return the raw bytes
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
 * Generates an image using OpenAI gpt-image-1.5 /images/edits endpoint
 * with a reference photo to preserve traveler identity.
 *
 * The reference photo is sent as an input image so gpt-image-1.5 can
 * preserve the person's facial structure, hairstyle, and skin tone
 * while generating the outfit and destination background.
 *
 * @param prompt       - Text prompt for image generation
 * @param referenceUrl - URL of the user's reference photo (R2 CDN)
 * @param apiKey       - OpenAI API key
 * @param quality      - "low" for teasers, "medium" for paid plans
 * @param size         - Image dimensions
 */
export async function generateImageWithReference(
  prompt: string,
  referenceUrl: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  // Fetch user reference photo as blob
  const refBlob = await fetchImageAsBlob(referenceUrl);

  // Build multipart form data for /v1/images/edits
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

// ─── Smart Generation (auto-selects endpoint) ────────────────────────────────

/**
 * Generates an image, automatically choosing the right endpoint:
 * - With referenceUrl → /images/edits (Identity Engine, preserves traveler)
 * - Without referenceUrl → /images/generations (default traveler model)
 *
 * Falls back to generations endpoint if edits fails (safety filter etc.).
 */
export async function generateImageSmart(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
  referenceUrl?: string,
): Promise<ArrayBuffer> {
  if (referenceUrl) {
    try {
      return await generateImageWithReference(prompt, referenceUrl, apiKey, quality, size);
    } catch (err) {
      console.warn(
        `[openaiImage] Identity Engine failed, falling back to generations: ${(err as Error).message}`
      );
      // Fall back to text-to-image generation without reference
    }
  }
  return generateImage(prompt, apiKey, quality, size);
}

// ─── With Retry ───────────────────────────────────────────────────────────────

/**
 * Generates image with exponential-backoff retry (3 attempts).
 * Supports Identity Engine via optional referenceUrl.
 *
 * @param prompt       - Text prompt for image generation
 * @param apiKey       - OpenAI API key
 * @param quality      - "low" for teasers, "medium" for paid plans
 * @param size         - Image dimensions. Defaults to "1024x1536" (portrait).
 * @param referenceUrl - Optional reference photo URL for Identity Engine
 */
export async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
  referenceUrl?: string,
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
      return await generateImageSmart(prompt, apiKey, quality, size, referenceUrl);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[openaiImage] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed: ${lastError.message}`
      );
    }
  }

  throw lastError ?? new Error('Image generation failed after all attempts');
}

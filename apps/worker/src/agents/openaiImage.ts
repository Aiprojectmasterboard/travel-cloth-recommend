/**
 * openaiImage.ts
 *
 * OpenAI Images API wrapper (gpt-image-1).
 * AI travel preparation platform — generates outfit images.
 *
 * gpt-image-1 valid sizes: 1024x1024, 1536x1024, 1024x1536, auto
 * gpt-image-1 valid quality: low, medium, high, auto
 * gpt-image-1 always returns b64_json (no response_format param needed)
 * gpt-image-1 uses output_format instead of response_format
 *
 * - Teaser:     quality "low",    size 1024x1536 (portrait, fast ~10-15s)
 * - Pro/Annual: quality "medium", size 1024x1024 (grid, ~15-25s)
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
// gpt-image-1 supported sizes (NOT the same as DALL-E 3)
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const MODEL = 'gpt-image-1';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2_000, 4_000, 6_000] as const;
const FETCH_TIMEOUT_MS = 90_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Generation Function ─────────────────────────────────────────────────

/**
 * Generates an image using OpenAI gpt-image-1.
 * Returns the raw image buffer (PNG).
 *
 * @param prompt  - Text prompt for image generation
 * @param apiKey  - OpenAI API key
 * @param quality - "low" for teasers, "medium" for paid plans, "high" for premium
 * @param size    - Image dimensions. Defaults to "1024x1536" (portrait).
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  const body = {
    model: MODEL,
    prompt,
    n: 1,
    size,
    quality,
  };

  const res = await fetch(OPENAI_API_URL, {
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
    throw new Error(`OpenAI HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIImageResponse;

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }

  const imageData = data.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error('OpenAI returned no image data');
  }

  // Decode base64 to ArrayBuffer
  const binaryString = atob(imageData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

// ─── With Retry ───────────────────────────────────────────────────────────────

/**
 * Generates image with exponential-backoff retry (3 attempts).
 *
 * @param prompt  - Text prompt for image generation
 * @param apiKey  - OpenAI API key
 * @param quality - "low" for teasers, "medium" for paid plans
 * @param size    - Image dimensions. Defaults to "1024x1536" (portrait).
 */
export async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
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

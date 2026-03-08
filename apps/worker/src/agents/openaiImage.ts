/**
 * openaiImage.ts
 *
 * OpenAI Images API wrapper (gpt-image-1.5).
 * AI travel preparation platform — generates outfit images with optional
 * identity preservation via reference photo input.
 *
 * gpt-image-1.5 valid sizes: 1024x1024, 1536x1024, 1024x1536, auto
 * gpt-image-1.5 valid quality: low, medium, high, auto
 * gpt-image-1.5 always returns b64_json (response_format NOT supported)
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
// gpt-image-1.5 supported sizes (NOT the same as DALL-E 3)
export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const MODEL = 'gpt-image-1.5';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2_000, 4_000, 6_000] as const;
const FETCH_TIMEOUT_MS = 90_000; // gpt-image-1.5 can take longer

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches an image from a URL and returns it as a base64-encoded data URL string.
 * Used for Identity Engine — passing reference photos to gpt-image-1.5.
 * Returns format: "data:image/png;base64,<base64data>"
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch reference image: HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || 'image/png';
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  // Return as data URL — format expected by OpenAI image input
  return `data:${contentType};base64,${b64}`;
}

// ─── Main Generation Function ─────────────────────────────────────────────────

/**
 * Generates an image using OpenAI gpt-image-1.5.
 * Returns the raw image buffer (PNG).
 *
 * Supports Identity Engine: when referenceImageDataUrl is provided,
 * it preserves the person's facial structure, hairstyle, skin tone,
 * and identity across all generated images.
 *
 * @param prompt                - Text prompt for image generation
 * @param apiKey                - OpenAI API key
 * @param quality               - "low" for teasers, "medium" for paid plans, "high" for premium
 * @param size                  - Image dimensions. Defaults to "1024x1536" (portrait).
 * @param referenceImageDataUrl - Optional data URL (data:image/...;base64,...) for identity preservation
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
  referenceImageDataUrl?: string,
): Promise<ArrayBuffer> {
  // Build the request body — gpt-image-1.5 specific params
  // NOTE: response_format is NOT supported for GPT image models (always returns b64_json)
  const body: Record<string, unknown> = {
    model: MODEL,
    prompt,
    n: 1,
    size,
    quality,
  };

  // If reference image provided, include as image input for identity preservation
  // gpt-image-1.5 accepts image inputs as base64 data URLs
  if (referenceImageDataUrl) {
    body.image = referenceImageDataUrl;
  }

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
 * @param prompt                - Text prompt for image generation
 * @param apiKey                - OpenAI API key
 * @param quality               - "low" for teasers, "medium" for paid plans
 * @param size                  - Image dimensions. Defaults to "1024x1536" (portrait).
 * @param referenceImageDataUrl - Optional data URL reference photo for identity preservation
 */
export async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  quality: ImageQuality = 'low',
  size: ImageSize = '1024x1536',
  referenceImageDataUrl?: string,
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
      return await generateImage(prompt, apiKey, quality, size, referenceImageDataUrl);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[openaiImage] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed: ${lastError.message}`
      );

      // If safety filter or image-related error, retry without reference image
      if (referenceImageDataUrl && (
        lastError.message.includes('safety') ||
        lastError.message.includes('image') ||
        lastError.message.includes('400')
      )) {
        console.warn('[openaiImage] Error with reference image — retrying without it');
        referenceImageDataUrl = undefined;
      }
    }
  }

  throw lastError ?? new Error('Image generation failed after all attempts');
}

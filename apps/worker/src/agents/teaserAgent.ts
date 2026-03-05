/**
 * teaserAgent.ts
 *
 * Generates ONE teaser fashion image via Nano Banana 2 (Gemini 3.1 Flash Image)
 * and stores it in R2.
 * The remaining 3 images shown in the preview are CSS-blurred placeholders
 * rendered client-side — only this single image is actually generated.
 *
 * R2 path: temp/{tripId}/teaser.png  (TTL: 48 h, deleted after paid fulfillment)
 * Public URL: {R2_PUBLIC_URL}/temp/{tripId}/teaser.png
 */

import type { Bindings } from '../index';
import type { VibeResult } from './vibeAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeaserResult {
  image_url: string;
  expires_at: string; // ISO 8601, 48 h from now
}

// Gemini API response shapes (camelCase from API)
interface GeminiInlineData {
  mimeType: string;
  data: string; // base64
}

interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: { message: string; code: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-3.1-flash-image-preview';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2_000, 4_000, 8_000] as const;
// Gemini image generation needs 10–30 s; allow enough headroom
const FETCH_TIMEOUT_MS = 45_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Max face image size for Gemini inlineData (bytes). Default images are ~2.4 MB PNG. */
const MAX_FACE_BYTES = 4_000_000; // 4 MB → ~5.3 MB base64 (Gemini accepts up to 20 MB)

/**
 * Fetches an image from a URL and returns base64-encoded data + mime type.
 * Skips images larger than MAX_FACE_BYTES to avoid Gemini request-size failures.
 * Uses chunked base64 encoding to avoid stack overflow on large buffers.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.warn(`[teaserAgent] Face fetch HTTP ${res.status} for ${url}`);
      return null;
    }

    const buffer = await res.arrayBuffer();

    // Skip oversized images — Gemini rejects large inlineData
    if (buffer.byteLength > MAX_FACE_BYTES) {
      console.warn(`[teaserAgent] Face image too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB > 4MB limit), skipping face reference`);
      return null;
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(buffer);

    // Chunked base64 encoding — avoids call-stack overflow for large buffers
    const CHUNK = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      binary += String.fromCharCode(...slice);
    }

    return { data: btoa(binary), mimeType: contentType };
  } catch (err) {
    console.warn('[teaserAgent] Failed to fetch face image:', (err as Error).message);
    return null;
  }
}

/**
 * Calls Gemini Nano Banana 2 once to generate a single image.
 * Returns the raw image buffer (PNG).
 */
async function generateNanoBanana(
  prompt: string,
  apiKey: string,
  faceUrl?: string
): Promise<ArrayBuffer> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // If face image is provided, fetch it and send as inlineData for Gemini to use as reference
  if (faceUrl) {
    const faceData = await fetchImageAsBase64(faceUrl);
    if (faceData) {
      parts.push({ inlineData: { mimeType: faceData.mimeType, data: faceData.data } });
      parts.push({ text: 'Use this person as the model in the generated image. You MUST preserve their exact facial features, face shape, skin tone, hair style, and natural appearance. Do NOT alter, beautify, smooth, or photoshop the face. The person in the output must be clearly recognizable as the same person in this reference photo.' });
    }
  }

  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio: '3:4',
        imageSize: '2K',
      },
    },
  };

  const res = await fetch(
    `${GEMINI_BASE}/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[teaserAgent] Gemini API HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiResponse;

  if (data.error) {
    throw new Error(`[teaserAgent] Gemini API error: ${data.error.message}`);
  }

  // Extract base64 image from response
  const responseParts = data.candidates?.[0]?.content?.parts;
  if (!responseParts) {
    throw new Error('[teaserAgent] Gemini returned no content parts');
  }

  const imagePart = responseParts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) {
    throw new Error('[teaserAgent] Gemini returned no image data');
  }

  // Decode base64 to ArrayBuffer
  const binaryString = atob(imagePart.inlineData.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Calls generateNanoBanana with exponential-backoff retry (3 attempts: 1s, 2s, 4s).
 */
async function generateWithRetry(
  prompt: string,
  apiKey: string,
  faceUrl?: string
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
      return await generateNanoBanana(prompt, apiKey, faceUrl);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[teaserAgent] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed: ${lastError.message}`
      );
    }
  }

  throw lastError ?? new Error(`Teaser generation failed after ${MAX_ATTEMPTS} attempts`);
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates a teaser image for the free preview.
 *
 * Steps:
 * 1. Build an editorial fashion prompt from the vibe
 * 2. Call Nano Banana 2 (Gemini 3.1 Flash Image) with optional face reference
 * 3. Store returned image buffer in R2 at temp/{tripId}/teaser.png
 * 5. Return the public CDN URL
 *
 * @param input - tripId, vibeResult, optional faceUrl
 * @param env   - Cloudflare Worker bindings
 */
export interface TeaserUserProfile {
  gender?: 'male' | 'female' | 'non-binary';
  height_cm?: number;
  aesthetics?: string[];
}

export async function teaserAgent(
  input: { tripId: string; vibeResult: VibeResult; faceUrl?: string; userProfile?: TeaserUserProfile },
  env: Bindings
): Promise<TeaserResult> {
  const { tripId, vibeResult, faceUrl, userProfile } = input;

  // Guard: NANOBANANA_API_KEY must be configured as a Worker secret
  if (!env.NANOBANANA_API_KEY) {
    throw new Error('[teaserAgent] NANOBANANA_API_KEY is not configured — run: wrangler secret put NANOBANANA_API_KEY');
  }

  // Build model descriptor from user profile
  const genderDesc = userProfile?.gender === 'male'
    ? 'a young Asian man'
    : userProfile?.gender === 'non-binary'
    ? 'an androgynous person'
    : 'a young woman';
  const heightDesc = userProfile?.height_cm
    ? `, ${userProfile.height_cm}cm tall`
    : '';
  const styleDesc = userProfile?.aesthetics?.length
    ? ` wearing ${userProfile.aesthetics.slice(0, 2).join(' and ')} style outfit`
    : '';

  // Extract city name for landmark background
  const cityName = vibeResult.city || vibeResult.mood_label?.split(' — ')[0] || 'a famous city';

  // Build image prompt: travel outfit with city landmark background
  const tagString = vibeResult.vibe_tags.join(', ');
  const prompt =
    `Generate a photorealistic full-body fashion photograph of ${genderDesc}${heightDesc}${styleDesc}. ` +
    `The person is standing in front of a famous landmark in ${cityName} as the background. ` +
    `Style mood: ${vibeResult.mood_label}, ${tagString}. ` +
    `The outfit should be stylish, travel-appropriate, and coordinated. ` +
    `${vibeResult.avoid_note ? `Avoid: ${vibeResult.avoid_note}. ` : ''}` +
    'Professional fashion editorial photography, natural lighting, sharp focus, 4K quality.';

  console.log(`[teaserAgent] Generating teaser for trip ${tripId} — mood: ${vibeResult.mood_label}`);

  // Generate via Nano Banana 2 with 3-attempt exponential backoff
  const imageBuffer = await generateWithRetry(prompt, env.NANOBANANA_API_KEY, faceUrl);

  // Store in R2
  const r2Key = `temp/${tripId}/teaser.png`;
  await env.R2.put(r2Key, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: {
      trip_id: tripId,
      mood: vibeResult.mood_name,
      generated_at: new Date().toISOString(),
    },
  });

  const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  console.log(`[teaserAgent] Teaser stored at ${publicUrl} (expires ${expiresAt})`);

  return { image_url: publicUrl, expires_at: expiresAt };
}

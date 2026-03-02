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

// Gemini API response shapes
interface GeminiInlineData {
  mime_type: string;
  data: string; // base64
}

interface GeminiPart {
  text?: string;
  inline_data?: GeminiInlineData;
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
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = [1_000, 2_000] as const;
// Keep per-request timeout short so teaser failures don't block the Worker response
const FETCH_TIMEOUT_MS = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const textParts: Array<{ text: string }> = [];

  // If face image is provided, reference it in the prompt
  if (faceUrl) {
    textParts.push({
      text: `Reference face for the model (preserve likeness with subtle similarity): ${faceUrl}`,
    });
  }

  textParts.push({ text: prompt });

  const body = {
    contents: [{ parts: textParts }],
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
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('[teaserAgent] Gemini returned no content parts');
  }

  const imagePart = parts.find((p) => p.inline_data?.data);
  if (!imagePart?.inline_data) {
    throw new Error('[teaserAgent] Gemini returned no image data');
  }

  // Decode base64 to ArrayBuffer
  const binaryString = atob(imagePart.inline_data.data);
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
export async function teaserAgent(
  input: { tripId: string; vibeResult: VibeResult; faceUrl?: string },
  env: Bindings
): Promise<TeaserResult> {
  const { tripId, vibeResult, faceUrl } = input;

  // Guard: NANOBANANA_API_KEY must be configured as a Worker secret
  if (!env.NANOBANANA_API_KEY) {
    throw new Error('[teaserAgent] NANOBANANA_API_KEY is not configured — run: wrangler secret put NANOBANANA_API_KEY');
  }

  // Build image prompt from vibe data
  const tagString = vibeResult.vibe_tags.join(', ');
  const prompt =
    `${vibeResult.mood_label} fashion editorial, ${tagString}, ` +
    `${vibeResult.avoid_note ? `(not: ${vibeResult.avoid_note}), ` : ''}` +
    'professional fashion photography, high fashion magazine editorial, ' +
    'full body shot, studio or city street background, golden hour light, ' +
    'photorealistic, 4K, sharp focus';

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

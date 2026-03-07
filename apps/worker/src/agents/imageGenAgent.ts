/**
 * imageGenAgent.ts  (Pro / Annual plan)
 *
 * Calls Nano Banana 2 (Gemini 3.1 Flash Image) for each StylePrompts entry
 * in parallel (Promise.allSettled), stores the resulting image in R2,
 * and updates generation_jobs in Supabase.
 *
 * R2 key pattern: outputs/{tripId}/{city}/{index}.png
 * Public URL:     {R2_PUBLIC_URL}/outputs/{tripId}/{city}/{index}.png
 *
 * Retry strategy: exponential backoff — 1 s, 2 s, 4 s (3 attempts per image)
 */

import type { Bindings } from '../index';
import type { StylePrompts } from './styleAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedImage {
  city: string;
  mood: string;
  image_url: string;   // public R2 CDN URL
  r2_key: string;
  job_id?: string;     // generation_jobs row id (if available)
  success: true;
}

export interface FailedImage {
  city: string;
  mood: string;
  error: string;
  job_id?: string;
  success: false;
}

export type ImageResult = GeneratedImage | FailedImage;

export interface GeneratedImages {
  results: ImageResult[];
  succeeded: number;
  failed: number;
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
// Must match teaserAgent model — gemini-2.0 is deprecated/removed
const MODEL = 'gemini-3.1-flash-image-preview';
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = [2_000, 4_000] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Slugify a city name for use as an R2 path segment. */
function citySlug(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Gemini Image Generation ─────────────────────────────────────────────────

/**
 * Calls Gemini Nano Banana 2 with exponential-backoff retry (3 attempts).
 * Returns the raw image buffer (PNG).
 */
/**
 * Fetches face image from URL and returns Gemini-compatible inline parts.
 * Returns empty array if face is unavailable, too large, or fetch fails.
 */
async function fetchFaceParts(faceUrl: string): Promise<GeminiPart[]> {
  try {
    const imgRes = await fetch(faceUrl, { signal: AbortSignal.timeout(10_000) });
    if (!imgRes.ok) return [];
    const imgBuf = await imgRes.arrayBuffer();
    if (imgBuf.byteLength > 4_000_000) {
      console.warn(`[imageGenAgent] Face image too large (${(imgBuf.byteLength / 1024 / 1024).toFixed(1)}MB > 4MB limit), skipping`);
      return [];
    }
    const bytes = new Uint8Array(imgBuf);
    const CHUNK = 8192;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      binary += String.fromCharCode(...slice);
    }
    const imgBase64 = btoa(binary);
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    return [
      { inlineData: { mimeType, data: imgBase64 } },
      {
        text: 'This is a reference photo of the person. Generate a new fashion editorial image featuring a person with the same general appearance — similar face shape, skin tone, hair color, body build. Dress them in a completely new travel-appropriate outfit for the destination as described below. This is for a travel fashion styling service.',
      },
    ];
  } catch (err) {
    console.warn('[imageGenAgent] Could not fetch face reference:', (err as Error).message);
    return [];
  }
}

/**
 * Calls Gemini once to generate an image. Returns raw PNG buffer.
 */
async function callGemini(
  sp: StylePrompts,
  apiKey: string,
  faceParts: GeminiPart[]
): Promise<ArrayBuffer> {
  const parts: GeminiPart[] = [...faceParts];
  const fullPrompt = sp.negative_prompt
    ? `${sp.prompt}\n\nAvoid: ${sp.negative_prompt}`
    : sp.prompt;
  parts.push({ text: fullPrompt });

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
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as GeminiResponse;
  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`);

  const responseParts = data.candidates?.[0]?.content?.parts;
  if (!responseParts) throw new Error('Gemini returned no content parts');

  const imagePart = responseParts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData) throw new Error('Gemini returned no image data');

  const binaryString = atob(imagePart.inlineData.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates image with retry + face fallback.
 * Phase 1: Try with face (1 attempt). If Gemini safety-blocks the face, fall back.
 * Phase 2: Try without face (up to MAX_ATTEMPTS).
 * This ensures images are always generated even when face triggers safety filters.
 */
async function generateWithRetry(
  sp: StylePrompts,
  apiKey: string,
  faceUrl?: string
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  // Phase 1: Try WITH face reference (single attempt to save time)
  if (faceUrl) {
    const faceParts = await fetchFaceParts(faceUrl);
    if (faceParts.length > 0) {
      try {
        return await callGemini(sp, apiKey, faceParts);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[imageGenAgent] Face attempt failed for ${sp.city}/${sp.mood}: ${lastError.message}`);
        console.warn(`[imageGenAgent] Retrying WITHOUT face reference`);
      }
    }
  }

  // Phase 2: Try WITHOUT face reference (always works unless Gemini is fully down)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }
    try {
      return await callGemini(sp, apiKey, []);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[imageGenAgent] No-face attempt ${attempt + 1}/${MAX_ATTEMPTS} failed for ${sp.city}/${sp.mood}:`,
        lastError.message
      );
    }
  }

  throw lastError ?? new Error(`Image gen failed after all attempts`);
}

// ─── Supabase Helper (local) ──────────────────────────────────────────────────

async function sbPatch(env: Bindings, path: string, body: Record<string, unknown>): Promise<void> {
  await fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates all Pro-plan images in parallel, stores them in R2, and updates
 * `generation_jobs` status after each result.
 *
 * @param input.prompts  - Array of StylePrompts (from styleAgent)
 * @param input.tripId   - Trip UUID
 * @param input.jobIds   - Optional map from "city/mood" → generation_jobs.id
 * @param input.faceUrl  - Optional face image URL for face preservation
 * @param env            - Cloudflare Worker bindings
 */
export async function imageGenAgent(
  input: {
    prompts: StylePrompts[];
    tripId: string;
    jobIds?: Record<string, string>; // "city/mood" → db row id
    faceUrl?: string;
  },
  env: Bindings
): Promise<GeneratedImages> {
  const { prompts, tripId, jobIds = {}, faceUrl } = input;

  // Track index per city for R2 naming
  const cityIndexCounter: Record<string, number> = {};

  const tasks = prompts.map((sp) => async (): Promise<ImageResult> => {
    const cityKey = `${sp.city}/${sp.mood}`;
    const jobId = jobIds[cityKey];

    // Mark job as processing
    if (jobId) {
      await sbPatch(env, `/generation_jobs?id=eq.${jobId}`, {
        status: 'processing',
        attempts: 1,
      });
    }

    try {
      // Determine R2 index for this city
      const slug = citySlug(sp.city);
      cityIndexCounter[slug] = (cityIndexCounter[slug] ?? 0) + 1;
      const idx = cityIndexCounter[slug];

      // Generate image (returns raw buffer directly from Gemini)
      const buffer = await generateWithRetry(sp, env.NANOBANANA_API_KEY, faceUrl);

      // Store in R2
      const r2Key = `outputs/${tripId}/${slug}/${idx}.png`;
      await env.R2.put(r2Key, buffer, {
        httpMetadata: { contentType: 'image/png' },
        customMetadata: {
          trip_id: tripId,
          city: sp.city,
          mood: sp.mood,
          generated_at: new Date().toISOString(),
        },
      });

      const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;

      // Update generation_jobs
      if (jobId) {
        await sbPatch(env, `/generation_jobs?id=eq.${jobId}`, {
          status: 'completed',
          image_url: publicUrl,
        });
      }

      console.log(`[imageGenAgent] Generated ${sp.city}/${sp.mood} → ${publicUrl}`);

      return {
        city: sp.city,
        mood: sp.mood,
        image_url: publicUrl,
        r2_key: r2Key,
        job_id: jobId,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[imageGenAgent] Failed ${sp.city}/${sp.mood}:`, errorMsg);

      if (jobId) {
        await sbPatch(env, `/generation_jobs?id=eq.${jobId}`, {
          status: 'failed',
          attempts: MAX_ATTEMPTS,
        });
      }

      return {
        city: sp.city,
        mood: sp.mood,
        error: errorMsg,
        job_id: jobId,
        success: false,
      };
    }
  });

  // Run all tasks in parallel
  const settled = await Promise.allSettled(tasks.map((t) => t()));

  const results: ImageResult[] = settled.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : ({
          city: 'unknown',
          mood: 'unknown',
          error: (r.reason as Error)?.message ?? 'Unknown error',
          success: false,
        } satisfies FailedImage)
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  console.log(`[imageGenAgent] Done: ${succeeded} succeeded, ${failed} failed`);

  return { results, succeeded, failed };
}

/**
 * imageGenAgent.ts  (Pro / Annual plan)
 *
 * Calls NanoBanana for each StylePrompts entry in parallel (Promise.allSettled),
 * downloads the resulting image, stores it in R2, and updates generation_jobs in Supabase.
 *
 * R2 key pattern: outputs/{tripId}/{city}/{index}.webp
 * Public URL:     {R2_PUBLIC_URL}/outputs/{tripId}/{city}/{index}.webp
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

// NanoBanana API shapes
interface NanoBananaResponse {
  image_url?: string;
  url?: string;
  id?: string;
  status?: string;
  error?: string;
}

interface NanoBananaJobResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_url?: string;
  url?: string;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NANOBANANA_BASE = 'https://api.nanobanana.ai/v1';
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 60; // 5 min max
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1_000, 2_000, 4_000] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Slugify a city name for use as an R2 path segment. */
function citySlug(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── NanoBanana Helpers ───────────────────────────────────────────────────────

async function pollJob(jobId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${NANOBANANA_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`[imageGenAgent] NanoBanana job poll HTTP ${res.status}`);
    }

    const job = (await res.json()) as NanoBananaJobResponse;

    if (job.status === 'completed') {
      const url = job.image_url ?? job.url;
      if (!url) throw new Error('[imageGenAgent] NanoBanana job completed but no image_url');
      return url;
    }

    if (job.status === 'failed') {
      throw new Error(`[imageGenAgent] NanoBanana job failed: ${job.error ?? 'unknown'}`);
    }
  }

  throw new Error(`[imageGenAgent] NanoBanana job ${jobId} timed out`);
}

/**
 * Calls NanoBanana with exponential-backoff retry (3 attempts).
 * Returns the remote image URL.
 */
async function generateWithRetry(
  sp: StylePrompts,
  apiKey: string,
  faceUrl?: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1] ?? 4_000);
    }

    try {
      const body: Record<string, unknown> = {
        prompt: sp.prompt,
        negative_prompt: sp.negative_prompt,
        width: 768,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      };
      if (faceUrl) {
        body.face_image_url = faceUrl;
        body.face_strength = 0.82;
      }

      const res = await fetch(`${NANOBANANA_BASE}/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`NanoBanana HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as NanoBananaResponse;

      if (data.image_url ?? data.url) {
        return (data.image_url ?? data.url) as string;
      }
      if (data.id) {
        return await pollJob(data.id, apiKey);
      }

      throw new Error('NanoBanana returned neither image_url nor job id');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[imageGenAgent] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed for ${sp.city}/${sp.mood}:`,
        lastError.message
      );
    }
  }

  throw lastError ?? new Error(`Image gen failed after ${MAX_ATTEMPTS} attempts`);
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

      // Generate image
      const remoteUrl = await generateWithRetry(sp, env.NANOBANANA_API_KEY, faceUrl);

      // Download buffer
      const imgRes = await fetch(remoteUrl);
      if (!imgRes.ok) {
        throw new Error(`Failed to download generated image: HTTP ${imgRes.status}`);
      }
      const buffer = await imgRes.arrayBuffer();

      // Store in R2
      const r2Key = `outputs/${tripId}/${slug}/${idx}.webp`;
      await env.R2.put(r2Key, buffer, {
        httpMetadata: { contentType: 'image/webp' },
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

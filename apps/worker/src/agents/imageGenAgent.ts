/**
 * imageGenAgent.ts  (Pro / Annual plan)
 *
 * Calls OpenAI gpt-image-1.5 for each StylePrompts entry in parallel
 * (Promise.allSettled), stores the resulting image in R2,
 * and updates generation_jobs in Supabase.
 *
 * Supports Identity Engine: passes reference photo base64 for identity
 * preservation across all generated outfit images.
 *
 * R2 key pattern: outputs/{tripId}/{city}/{index}.png
 * Public URL:     {R2_PUBLIC_URL}/outputs/{tripId}/{city}/{index}.png
 *
 * Retry strategy: exponential backoff — 2s, 4s, 6s (3 attempts per image)
 */

import type { Bindings } from '../index';
import type { StylePrompts, StyleGridPrompt } from './styleAgent';
import { generateImageWithRetry, fetchImageAsBase64 } from './openaiImage';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Slugify a city name for use as an R2 path segment. */
function citySlug(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
 * @param input.faceUrl  - Optional R2 URL of user's reference photo (Identity Engine)
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

  // Identity Engine: fetch reference photo once, share across all images
  let referenceBase64: string | undefined;
  if (faceUrl) {
    try {
      referenceBase64 = await fetchImageAsBase64(faceUrl);
      console.log(`[imageGenAgent] Reference photo fetched for identity preservation`);
    } catch (err) {
      console.warn(`[imageGenAgent] Failed to fetch reference photo, proceeding without:`, (err as Error).message);
    }
  }

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

      // Build prompt — include negative prompt as avoidance instruction
      const fullPrompt = sp.negative_prompt
        ? `${sp.prompt}\n\nDo NOT include: ${sp.negative_prompt}`
        : sp.prompt;

      // Generate image via OpenAI gpt-image-1.5 (medium quality for paid plans)
      const buffer = await generateImageWithRetry(fullPrompt, env.OPENAI_API_KEY, 'medium', '1024x1536', referenceBase64);

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

// ─── Grid Generation ──────────────────────────────────────────────────────────

export interface GridImageResult {
  city: string;
  image_url: string;  // public R2 CDN URL
  r2_key: string;
  success: boolean;
  error?: string;
}

/**
 * Generates one 1024x1024 grid image per city using the combined 2x2 grid
 * prompt from styleAgentGrid. Runs all cities in parallel via Promise.allSettled.
 *
 * R2 key pattern: outputs/{tripId}/{citySlug}/grid.png
 *
 * @param input.gridPrompts - Array of StyleGridPrompt (one per city, from styleAgentGrid)
 * @param input.tripId      - Trip UUID
 * @param input.faceUrl     - Optional R2 URL of user's reference photo (Identity Engine)
 * @param env               - Cloudflare Worker bindings
 */
export async function imageGenAgentGrid(
  input: {
    gridPrompts: StyleGridPrompt[];
    tripId: string;
    faceUrl?: string;
  },
  env: Bindings
): Promise<GridImageResult[]> {
  const { gridPrompts, tripId, faceUrl } = input;

  // Identity Engine: fetch reference photo once, share across all grid images
  let referenceBase64: string | undefined;
  if (faceUrl) {
    try {
      referenceBase64 = await fetchImageAsBase64(faceUrl);
      console.log(`[imageGenAgentGrid] Reference photo fetched for identity preservation`);
    } catch (err) {
      console.warn(`[imageGenAgentGrid] Failed to fetch reference photo, proceeding without:`, (err as Error).message);
    }
  }

  const tasks = gridPrompts.map((gp) => async (): Promise<GridImageResult> => {
    const slug = citySlug(gp.city);
    const r2Key = `outputs/${tripId}/${slug}/grid.png`;

    try {
      // Append negative prompt as avoidance instruction (same pattern as imageGenAgent)
      const fullPrompt = gp.negative_prompt
        ? `${gp.prompt}\n\nDo NOT include: ${gp.negative_prompt}`
        : gp.prompt;

      // 1024x1024 square — best for 2x2 grid layout, medium quality for paid plans
      const buffer = await generateImageWithRetry(fullPrompt, env.OPENAI_API_KEY, 'medium', '1024x1024', referenceBase64);

      // Store in R2
      await env.R2.put(r2Key, buffer, {
        httpMetadata: { contentType: 'image/png' },
        customMetadata: {
          trip_id: tripId,
          city: gp.city,
          image_type: 'grid',
          generated_at: new Date().toISOString(),
        },
      });

      const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;

      console.log(`[imageGenAgentGrid] Generated ${gp.city} grid → ${publicUrl}`);

      return {
        city: gp.city,
        image_url: publicUrl,
        r2_key: r2Key,
        success: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[imageGenAgentGrid] Failed ${gp.city} grid:`, errorMsg);

      return {
        city: gp.city,
        image_url: '',
        r2_key: r2Key,
        success: false,
        error: errorMsg,
      };
    }
  });

  // Run all cities in parallel — never throws
  const settled = await Promise.allSettled(tasks.map((t) => t()));

  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const city = gridPrompts[i]?.city ?? 'unknown';
    return {
      city,
      image_url: '',
      r2_key: `outputs/${tripId}/${citySlug(city)}/grid.png`,
      success: false,
      error: (r.reason as Error)?.message ?? 'Unknown error',
    };
  });
}

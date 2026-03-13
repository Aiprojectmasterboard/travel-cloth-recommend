/**
 * imageGenAgent.ts  (Pro / Annual plan)
 *
 * Calls OpenAI gpt-image-1.5 for each StylePrompts entry in parallel
 * (Promise.allSettled), stores the resulting image in R2,
 * and updates generation_jobs in Supabase.
 *
 * Never-Fail Architecture:
 *   Every image is guaranteed to be AI-generated via generateImageGuaranteed().
 *   Tier 1: User photo + /images/edits (3 attempts)
 *   Tier 2: System default model + /images/edits (6 attempts — MUST succeed)
 *   Tier 3: Text-to-image /images/generations (5 attempts)
 *   → 14 total AI attempts per image. Static fallbacks are NEVER used.
 *
 * Identity Engine: if faceUrl is provided, all generated images preserve
 * the same traveler identity using /images/edits endpoint.
 *
 * Quality: "high" for all paid plan images.
 *
 * R2 key pattern: outputs/{tripId}/{city}/{index}.png
 * Public URL:     {R2_PUBLIC_URL}/outputs/{tripId}/{city}/{index}.png
 */

import type { Bindings } from '../index';
import type { StylePrompts, StyleGridPrompt } from './styleAgent';
import { generateImageGuaranteed, generateImageWithRetry } from './openaiImage';

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
 * Every image is GUARANTEED to be AI-generated (gpt-image-1.5 or gpt-image-1).
 * Static/Unsplash fallbacks are NEVER used.
 *
 * @param input.prompts  - Array of StylePrompts (from styleAgent)
 * @param input.tripId   - Trip UUID
 * @param input.jobIds   - Optional map from "city/mood" → generation_jobs.id
 * @param input.faceUrl  - Optional R2 URL of user's reference photo (Identity Engine)
 * @param input.gender   - User gender for default model selection
 * @param env            - Cloudflare Worker bindings
 */
export async function imageGenAgent(
  input: {
    prompts: StylePrompts[];
    tripId: string;
    jobIds?: Record<string, string>; // "city/mood" → db row id
    faceUrl?: string;
    gender?: string;
  },
  env: Bindings
): Promise<GeneratedImages> {
  const { prompts, tripId, jobIds = {}, faceUrl, gender = 'female' } = input;

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

    // Determine R2 index for this city
    const slug = citySlug(sp.city);
    cityIndexCounter[slug] = (cityIndexCounter[slug] ?? 0) + 1;
    const idx = cityIndexCounter[slug];

    // Build prompt — include negative prompt as avoidance instruction
    const fullPrompt = sp.negative_prompt
      ? `${sp.prompt}\n\nDo NOT include: ${sp.negative_prompt}`
      : sp.prompt;

    // ── Guaranteed AI image generation ──
    // generateImageGuaranteed: 14 total attempts across 3 tiers
    // Quality: "high" for best output
    // NEVER returns null — always produces an AI-generated image
    const buffer = await generateImageGuaranteed(
      fullPrompt, env.OPENAI_API_KEY, 'high', '1024x1536', faceUrl, gender
    );

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
    console.log(`[imageGenAgent] AI generated ${sp.city}/${sp.mood} → ${publicUrl}`);

    // Update generation_jobs
    if (jobId) {
      try {
        await sbPatch(env, `/generation_jobs?id=eq.${jobId}`, {
          status: 'completed',
          image_url: publicUrl,
        });
      } catch { /* non-fatal */ }
    }

    return {
      city: sp.city,
      mood: sp.mood,
      image_url: publicUrl,
      r2_key: r2Key,
      job_id: jobId,
      success: true,
    };
  });

  // Run all tasks in parallel
  const settled = await Promise.allSettled(tasks.map((t) => t()));

  const results: ImageResult[] = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : ({
          city: prompts[i]?.city ?? 'unknown',
          mood: prompts[i]?.mood ?? 'unknown',
          error: (r.reason as Error)?.message ?? 'Unknown error',
          success: false,
        } satisfies FailedImage)
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  console.log(`[imageGenAgent] Done: ${succeeded} succeeded, ${failed} failed`);

  return { results, succeeded, failed };
}

// ─── Grid Generation (legacy — not used by runResult) ────────────────────────

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
 * Legacy — not used by the main pipeline (runResult uses individual images).
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

  const tasks = gridPrompts.map((gp) => async (): Promise<GridImageResult> => {
    const slug = citySlug(gp.city);
    const r2Key = `outputs/${tripId}/${slug}/grid.png`;

    try {
      const fullPrompt = gp.negative_prompt
        ? `${gp.prompt}\n\nDo NOT include: ${gp.negative_prompt}`
        : gp.prompt;

      const buffer = await generateImageWithRetry(fullPrompt, env.OPENAI_API_KEY, 'high', '1024x1024', faceUrl);

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

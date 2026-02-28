/**
 * teaserAgent.ts
 *
 * Generates ONE teaser fashion image via NanoBanana and stores it in R2.
 * The remaining 3 images shown in the preview are CSS-blurred placeholders
 * rendered client-side — only this single image is actually generated.
 *
 * R2 path: temp/{tripId}/teaser.webp  (TTL: 48 h, deleted after paid fulfillment)
 * Public URL: {R2_PUBLIC_URL}/temp/{tripId}/teaser.webp
 */

import type { Bindings } from '../index';
import type { VibeResult } from './vibeAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeaserResult {
  image_url: string;
  expires_at: string; // ISO 8601, 48 h from now
}

// NanoBanana API response shapes
interface NanoBananaResponse {
  image_url?: string;
  url?: string;
  id?: string;     // async job id
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls a NanoBanana async job until it completes, fails, or times out.
 */
async function pollJob(jobId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${NANOBANANA_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`[teaserAgent] NanoBanana job poll HTTP ${res.status}`);
    }

    const job = (await res.json()) as NanoBananaJobResponse;

    if (job.status === 'completed') {
      const url = job.image_url ?? job.url;
      if (!url) throw new Error('[teaserAgent] NanoBanana job completed but no image_url');
      return url;
    }

    if (job.status === 'failed') {
      throw new Error(`[teaserAgent] NanoBanana job failed: ${job.error ?? 'unknown'}`);
    }
    // 'pending' or 'processing' → keep polling
  }

  throw new Error(`[teaserAgent] NanoBanana job ${jobId} timed out after ${POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

/**
 * Calls NanoBanana to generate a single image and returns its remote URL.
 * Handles both sync (image_url returned immediately) and async (job_id polling).
 */
async function generateNanoBanana(
  prompt: string,
  apiKey: string,
  faceUrl?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    negative_prompt:
      'blurry, low quality, cartoon, anime, illustration, nsfw, nude, watermark, text, logo',
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
    const text = await res.text();
    throw new Error(`[teaserAgent] NanoBanana API HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as NanoBananaResponse;

  if (data.image_url ?? data.url) {
    return (data.image_url ?? data.url) as string;
  }

  if (data.id) {
    return pollJob(data.id, apiKey);
  }

  throw new Error('[teaserAgent] NanoBanana returned neither image_url nor job id');
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Generates a teaser image for the free preview.
 *
 * Steps:
 * 1. Build an editorial fashion prompt from the vibe
 * 2. Call NanoBanana (with optional face preservation)
 * 3. Download the image buffer
 * 4. Store in R2 at temp/{tripId}/teaser.webp
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

  // Build image prompt from vibe data
  const tagString = vibeResult.vibe_tags.join(', ');
  const prompt =
    `${vibeResult.mood_label} fashion editorial, ${tagString}, ` +
    `${vibeResult.avoid_note ? `(not: ${vibeResult.avoid_note}), ` : ''}` +
    'professional fashion photography, high fashion magazine editorial, ' +
    'full body shot, studio or city street background, golden hour light, ' +
    'photorealistic, 4K, sharp focus';

  console.log(`[teaserAgent] Generating teaser for trip ${tripId} — mood: ${vibeResult.mood_label}`);

  // Generate via NanoBanana
  const remoteImageUrl = await generateNanoBanana(prompt, env.NANOBANANA_API_KEY, faceUrl);

  // Download image buffer
  const imgRes = await fetch(remoteImageUrl);
  if (!imgRes.ok) {
    throw new Error(`[teaserAgent] Failed to download generated image: HTTP ${imgRes.status}`);
  }
  const imageBuffer = await imgRes.arrayBuffer();

  // Store in R2
  const r2Key = `temp/${tripId}/teaser.webp`;
  await env.R2.put(r2Key, imageBuffer, {
    httpMetadata: { contentType: 'image/webp' },
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

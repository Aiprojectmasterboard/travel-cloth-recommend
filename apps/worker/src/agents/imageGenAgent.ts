import type { StylePrompt } from '../../../../packages/types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const NANOBANANA_BASE_URL = 'https://api.nanobanan.ai/v1';
const MAX_ATTEMPTS = 3;

// Exponential backoff delays in ms: 1s, 2s, 4s
const BACKOFF_DELAYS = [1000, 2000, 4000];

// ─── NanoBanana API Types ─────────────────────────────────────────────────────

interface NanoBananaGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  face_image_url?: string;
  face_preservation_strength?: number;
}

interface NanoBananaGenerateResponse {
  id?: string;
  image_url?: string;
  url?: string;
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

// ─── Sleep Helper ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Poll for Async Job ───────────────────────────────────────────────────────

async function pollJobResult(jobId: string, apiKey: string): Promise<string> {
  const maxPollAttempts = 60; // 60 * 5s = 5 minutes max
  const pollInterval = 5000;

  for (let i = 0; i < maxPollAttempts; i++) {
    await sleep(pollInterval);

    const res = await fetch(`${NANOBANANA_BASE_URL}/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`NanoBanana job poll failed: HTTP ${res.status}`);
    }

    const job = (await res.json()) as NanoBananaJobResponse;

    if (job.status === 'completed') {
      const imageUrl = job.image_url ?? job.url;
      if (!imageUrl) {
        throw new Error('NanoBanana job completed but returned no image URL');
      }
      return imageUrl;
    }

    if (job.status === 'failed') {
      throw new Error(`NanoBanana job failed: ${job.error ?? 'unknown error'}`);
    }

    // Still pending/processing — continue polling
  }

  throw new Error(`NanoBanana job ${jobId} timed out after polling`);
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Calls the NanoBanana API to generate a fashion editorial image.
 * Supports face preservation when faceUrl is provided.
 * Retries up to 3 times with exponential backoff on failure.
 *
 * @param prompt - The StylePrompt object containing prompt and negative prompt
 * @param apiKey - The NanoBanana API key
 * @param faceUrl - Optional face image URL for face preservation
 * @returns The generated image URL
 */
export async function generateImage(
  prompt: StylePrompt,
  apiKey: string,
  faceUrl?: string
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delay = BACKOFF_DELAYS[attempt - 1] ?? 4000;
      await sleep(delay);
    }

    try {
      const requestBody: NanoBananaGenerateRequest = {
        prompt: prompt.prompt_en,
        negative_prompt: prompt.negative_prompt,
        width: 768,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      };

      // Add face preservation parameters when face URL is available
      if (faceUrl) {
        requestBody.face_image_url = faceUrl;
        requestBody.face_preservation_strength = 0.8;
      }

      const res = await fetch(`${NANOBANANA_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`NanoBanana API error: HTTP ${res.status} — ${errorText}`);
      }

      const data = (await res.json()) as NanoBananaGenerateResponse;

      // Handle synchronous response (image_url returned directly)
      if (data.image_url ?? data.url) {
        return (data.image_url ?? data.url) as string;
      }

      // Handle asynchronous job-based response
      if (data.id) {
        return await pollJobResult(data.id, apiKey);
      }

      throw new Error('NanoBanana API returned neither image_url nor job id');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `NanoBanana attempt ${attempt + 1}/${MAX_ATTEMPTS} failed for ${prompt.city}/${prompt.mood}:`,
        lastError.message
      );
    }
  }

  throw lastError ?? new Error(`Image generation failed after ${MAX_ATTEMPTS} attempts`);
}

/**
 * Tracks attempt count and marks job as failed after MAX_ATTEMPTS.
 * Used by orchestrator to update generation_jobs table.
 */
export { MAX_ATTEMPTS };

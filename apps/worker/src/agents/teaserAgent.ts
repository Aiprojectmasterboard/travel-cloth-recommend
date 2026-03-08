/**
 * teaserAgent.ts
 *
 * Generates teaser fashion images via OpenAI gpt-image-1.5 and stores them in R2.
 * Supports Identity Engine: if user uploaded a reference photo, preserves their
 * facial features across generated images.
 *
 * Standard plan: 4 images with different moods (parallel generation)
 * R2 path: temp/{tripId}/teaser-{index}.png
 * Public URL: {R2_PUBLIC_URL}/temp/{tripId}/teaser-{index}.png
 *
 * Single teaser mode (backward compat): temp/{tripId}/teaser.png
 */

import type { Bindings } from '../index';
import type { VibeResult } from './vibeAgent';
import { generateImageWithRetry, fetchImageAsBase64 } from './openaiImage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeaserResult {
  image_url: string;
  expires_at: string; // ISO 8601, 48 h from now
}

export interface MultipleTeaserResult {
  images: Array<{
    index: number;
    image_url: string;
    mood: string;
  }>;
  expires_at: string;
}

export interface TeaserUserProfile {
  gender?: 'male' | 'female' | 'non-binary';
  height_cm?: number;
  weight_kg?: number;
  aesthetics?: string[];
}

// ─── Mood Variations ──────────────────────────────────────────────────────────

/**
 * 4 different outfit mood/scene variations for Standard plan diversity.
 * Each produces a visually distinct look from the same vibe.
 */
const MOOD_VARIATIONS = [
  { scene: 'walking through a famous landmark area', time: 'golden hour morning light', style: 'polished editorial' },
  { scene: 'sitting at a stylish outdoor café', time: 'soft afternoon light', style: 'relaxed chic' },
  { scene: 'exploring a charming local street', time: 'natural daylight', style: 'smart casual' },
  { scene: 'standing at a scenic viewpoint', time: 'warm sunset light', style: 'effortlessly elegant' },
] as const;

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(
  vibeResult: VibeResult,
  userProfile: TeaserUserProfile | undefined,
  variationIndex: number,
): string {
  // Detect infant
  const isInfant = !!(
    userProfile?.height_cm && userProfile.height_cm < 85 &&
    userProfile?.weight_kg && userProfile.weight_kg < 13
  );

  // Build model descriptor
  let genderDesc: string;
  let heightDesc = '';
  let bodyDesc = '';
  let styleDesc = '';

  if (isInfant) {
    genderDesc = 'a cute baby';
  } else {
    genderDesc = userProfile?.gender === 'male'
      ? 'a stylish young man'
      : userProfile?.gender === 'non-binary'
      ? 'an androgynous person'
      : 'a stylish young woman';
    if (userProfile?.height_cm) {
      heightDesc = `, ${userProfile.height_cm}cm tall`;
    }
    if (userProfile?.height_cm && userProfile?.weight_kg) {
      const heightM = userProfile.height_cm / 100;
      const bmi = userProfile.weight_kg / (heightM * heightM);
      if (bmi < 18.5) bodyDesc = ', slender build';
      else if (bmi < 25) bodyDesc = ', slim build';
      else if (bmi < 30) bodyDesc = ', regular build';
      else bodyDesc = ', full-figured build';
    }
    styleDesc = userProfile?.aesthetics?.length
      ? ` in ${userProfile.aesthetics.slice(0, 2).join(' and ')} style`
      : '';
  }

  const cityName = vibeResult.city || vibeResult.mood_label?.split(' — ')[0] || 'a famous city';
  const tagString = vibeResult.vibe_tags.join(', ');
  const variation = MOOD_VARIATIONS[variationIndex % MOOD_VARIATIONS.length];

  if (isInfant) {
    return (
      `Photorealistic photo: ${genderDesc} in a stylish stroller ` +
      `${variation.scene} in ${cityName}. ` +
      `Cute weather-appropriate outfit, ${variation.style}. Mood: ${vibeResult.mood_label}. ` +
      `Professional photography, ${variation.time}, sharp focus.`
    );
  }

  return (
    `Photorealistic full-body fashion photo: ${genderDesc}${heightDesc}${bodyDesc}${styleDesc} ` +
    `${variation.scene} in ${cityName}. ` +
    `Travel outfit style: ${vibeResult.mood_label}, ${tagString}. ` +
    `${variation.style} look. ` +
    `Fashion editorial photography, ${variation.time}, sharp focus, high quality.`
  );
}

// ─── Main: Single Teaser (backward compat) ────────────────────────────────────

export async function teaserAgent(
  input: { tripId: string; vibeResult: VibeResult; faceUrl?: string; userProfile?: TeaserUserProfile },
  env: Bindings,
): Promise<TeaserResult> {
  const { tripId, vibeResult, faceUrl, userProfile } = input;

  if (!env.OPENAI_API_KEY) {
    throw new Error('[teaserAgent] OPENAI_API_KEY is not configured — run: wrangler secret put OPENAI_API_KEY');
  }

  const prompt = buildPrompt(vibeResult, userProfile, 0);
  console.log(`[teaserAgent] Generating teaser for trip ${tripId} — mood: ${vibeResult.mood_label}, face: ${faceUrl ? 'yes' : 'no'}`);

  // Identity Engine: fetch reference photo if user uploaded one
  let referenceBase64: string | undefined;
  if (faceUrl) {
    try {
      referenceBase64 = await fetchImageAsBase64(faceUrl);
      console.log(`[teaserAgent] Reference photo fetched for identity preservation`);
    } catch (err) {
      console.warn(`[teaserAgent] Failed to fetch reference photo, proceeding without:`, (err as Error).message);
    }
  }

  const imageBuffer = await generateImageWithRetry(prompt, env.OPENAI_API_KEY, 'low', '1024x1536', referenceBase64);

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

// ─── Main: Multiple Teasers (Standard 4-image) ───────────────────────────────

/**
 * Generates 4 teaser images with different moods in parallel.
 * Each image uses a different scene/lighting/style variation.
 * Stores in R2 as temp/{tripId}/teaser-{0-3}.png
 */
export async function teaserAgentMultiple(
  input: {
    tripId: string;
    vibeResult: VibeResult;
    faceUrl?: string;
    userProfile?: TeaserUserProfile;
    count?: number;
  },
  env: Bindings,
): Promise<MultipleTeaserResult> {
  const { tripId, vibeResult, faceUrl, userProfile, count = 4 } = input;

  if (!env.OPENAI_API_KEY) {
    throw new Error('[teaserAgent] OPENAI_API_KEY is not configured');
  }

  console.log(`[teaserAgent] Generating ${count} teasers for trip ${tripId} — mood: ${vibeResult.mood_label}, face: ${faceUrl ? 'yes' : 'no'}`);

  // Identity Engine: fetch reference photo once, share across all teasers
  let referenceBase64: string | undefined;
  if (faceUrl) {
    try {
      referenceBase64 = await fetchImageAsBase64(faceUrl);
      console.log(`[teaserAgent] Reference photo fetched for identity preservation`);
    } catch (err) {
      console.warn(`[teaserAgent] Failed to fetch reference photo, proceeding without:`, (err as Error).message);
    }
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const moodLabels = MOOD_VARIATIONS.map(v => v.style);

  // Generate all images in parallel
  const tasks = Array.from({ length: count }, (_, idx) => async () => {
    const prompt = buildPrompt(vibeResult, userProfile, idx);
    const imageBuffer = await generateImageWithRetry(prompt, env.OPENAI_API_KEY, 'low', '1024x1536', referenceBase64);

    const r2Key = `temp/${tripId}/teaser-${idx}.png`;
    await env.R2.put(r2Key, imageBuffer, {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: {
        trip_id: tripId,
        mood: moodLabels[idx] || `variation-${idx}`,
        index: String(idx),
        generated_at: new Date().toISOString(),
      },
    });

    const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;
    console.log(`[teaserAgent] Teaser ${idx} stored at ${publicUrl}`);

    return {
      index: idx,
      image_url: publicUrl,
      mood: moodLabels[idx] || `variation-${idx}`,
    };
  });

  const settled = await Promise.allSettled(tasks.map(t => t()));
  const images: Array<{ index: number; image_url: string; mood: string }> = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      images.push(r.value);
    }
  }

  // Log failures
  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[teaserAgent] Teaser ${i} failed:`, (r.reason as Error)?.message);
    }
  });

  console.log(`[teaserAgent] ${images.length}/${count} teasers generated for trip ${tripId}`);

  return { images, expires_at: expiresAt };
}

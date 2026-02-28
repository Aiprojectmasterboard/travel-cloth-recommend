import { getClimateData } from './weatherAgent';
import { generateStylePrompts } from './styleAgent';
import { generateImage } from './imageGenAgent';
import { generateCapsule } from './capsuleAgent';
import { fulfillTrip } from './fulfillmentAgent';
import { generateShareContent } from './growthAgent';
import type {
  CityInput,
  CityVibe,
  ClimateData,
  StylePrompt,
  Trip,
} from '../../../../packages/types/index';
import type { Env } from '../index';

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function supabaseRequest(
  env: Env,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Prefer: 'return=representation',
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}

// ─── Concurrency Limiter ──────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const taskIndex = index++;
      const task = tasks[taskIndex];
      if (task) {
        results[taskIndex] = await task();
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── City Vibe Lookup ─────────────────────────────────────────────────────────

async function getCityVibe(city: CityInput, env: Env): Promise<CityVibe | null> {
  const res = await supabaseRequest(
    env,
    `/city_vibes?city=eq.${encodeURIComponent(city.name)}&limit=1`
  );

  if (!res.ok) return null;

  const vibes = (await res.json()) as CityVibe[];
  if (vibes.length > 0) return vibes[0];

  // Fallback: construct a minimal CityVibe from the city input
  return {
    city: city.name,
    country: city.country,
    lat: city.lat ?? 0,
    lon: city.lon ?? 0,
    vibe_cluster: 'urban-casual',
    style_keywords: ['versatile', 'comfortable', 'smart-casual'],
  };
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

/**
 * Orchestrates the full AI pipeline for a trip:
 *
 * 1. Load trip from Supabase
 * 2. Fetch climate data for all cities (parallel)
 * 3. Generate style prompts via Claude (parallel per city)
 * 4. Save generation_jobs to DB
 * 5. Generate images via NanoBanana (concurrency: 2)
 * 6. Generate capsule wardrobe via Claude
 * 7. Run fulfillment (email + privacy cleanup)
 * 8. Generate share content
 * 9. Mark trip as completed
 */
export async function orchestrateTrip(
  tripId: string,
  tripData: Record<string, unknown>,
  env: Env,
  userEmail = ''
): Promise<void> {
  console.log(`[Orchestrator] Starting pipeline for trip ${tripId}`);

  // ── Step 1: Parse trip data ─────────────────────────────────────────────────

  const trip: Trip = {
    id: tripId,
    session_id: String(tripData.session_id ?? ''),
    cities: (tripData.cities as CityInput[]) ?? [],
    month: Number(tripData.month ?? 1),
    face_url: tripData.face_url ? String(tripData.face_url) : undefined,
    status: 'processing',
    created_at: String(tripData.created_at ?? new Date().toISOString()),
  };

  if (trip.cities.length === 0) {
    throw new Error(`Trip ${tripId} has no cities`);
  }

  try {
    // ── Step 2: Climate data (parallel) ──────────────────────────────────────

    console.log(`[Orchestrator] Fetching climate data for ${trip.cities.length} cities`);
    const climateResults = await Promise.allSettled(
      trip.cities.map((city) => getClimateData(city, trip.month))
    );

    const climateData: ClimateData[] = climateResults.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;
      console.warn(
        `[Orchestrator] Climate fetch failed for ${trip.cities[i]?.name}: ${result.reason}`
      );
      // Fallback climate data
      return {
        city: trip.cities[i]?.name ?? 'Unknown',
        month: trip.month,
        temp_min: 15,
        temp_max: 22,
        precipitation: 50,
        vibe_band: 'warm' as const,
      };
    });

    // ── Step 3: Style prompts (parallel per city) ─────────────────────────────

    console.log(`[Orchestrator] Generating style prompts for ${trip.cities.length} cities`);
    const cityVibes = await Promise.all(
      trip.cities.map((city) => getCityVibe(city, env))
    );

    const stylePromptsResults = await Promise.allSettled(
      trip.cities.map(async (city, i) => {
        const vibe = cityVibes[i] ?? {
          city: city.name,
          country: city.country,
          lat: city.lat ?? 0,
          lon: city.lon ?? 0,
          vibe_cluster: 'urban-casual',
          style_keywords: ['versatile', 'comfortable'],
        };
        // climateData is always populated (API result or fallback), but guard defensively.
        const climate = climateData[i];
        if (!climate) throw new Error(`No climate data for ${city.name}`);
        return generateStylePrompts(vibe, climate, env.ANTHROPIC_API_KEY);
      })
    );

    const allStylePrompts: StylePrompt[] = [];
    for (const result of stylePromptsResults) {
      if (result.status === 'fulfilled') {
        allStylePrompts.push(...result.value);
      } else {
        console.warn(`[Orchestrator] Style prompt generation failed: ${result.reason}`);
      }
    }

    if (allStylePrompts.length === 0) {
      throw new Error('No style prompts could be generated for any city');
    }

    // ── Step 4: Save generation_jobs to DB ────────────────────────────────────

    console.log(`[Orchestrator] Saving ${allStylePrompts.length} generation jobs to DB`);
    const jobRecords = allStylePrompts.map((sp) => ({
      trip_id: tripId,
      city: sp.city,
      mood: sp.mood,
      prompt: sp.prompt_en,
      status: 'pending',
    }));

    const insertRes = await supabaseRequest(env, '/generation_jobs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(jobRecords),
    });

    let savedJobs: Array<{ id: string; city: string; mood: string; prompt: string }> = [];
    if (insertRes.ok) {
      savedJobs = await insertRes.json();
    } else {
      console.error(`[Orchestrator] Failed to save jobs: ${await insertRes.text()}`);
    }

    // ── Step 5: Generate images (concurrency: 2) ──────────────────────────────

    console.log(`[Orchestrator] Generating ${allStylePrompts.length} images (concurrency: 2)`);

    const imageTasks = allStylePrompts.map((sp, i) => async () => {
      const job = savedJobs[i];
      const jobId = job?.id;

      // Mark job as processing
      if (jobId) {
        await supabaseRequest(env, `/generation_jobs?id=eq.${jobId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'processing', attempts: 1 }),
        });
      }

      try {
        const imageUrl = await generateImage(sp, env.NANOBANANA_API_KEY, trip.face_url);

        if (jobId) {
          await supabaseRequest(env, `/generation_jobs?id=eq.${jobId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed', image_url: imageUrl }),
          });
        }

        return { jobId, imageUrl, success: true };
      } catch (err) {
        console.error(
          `[Orchestrator] Image generation failed for ${sp.city}/${sp.mood}: ${(err as Error).message}`
        );

        if (jobId) {
          await supabaseRequest(env, `/generation_jobs?id=eq.${jobId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'failed', attempts: 3 }),
          });
        }

        return { jobId, imageUrl: null, success: false };
      }
    });

    await runWithConcurrency(imageTasks, 2);

    // ── Step 6: Generate capsule wardrobe via Claude ───────────────────────────

    console.log(`[Orchestrator] Generating capsule wardrobe via Claude`);
    const { items, daily_plan } = await generateCapsule(
      trip.cities,
      trip.month,
      climateData,
      env.ANTHROPIC_API_KEY
    );

    // Save capsule_results to DB
    const capsuleRes = await supabaseRequest(env, '/capsule_results', {
      method: 'POST',
      body: JSON.stringify({
        trip_id: tripId,
        items,
        daily_plan,
      }),
    });

    if (!capsuleRes.ok) {
      const errText = await capsuleRes.text();
      console.error(`[Orchestrator] Failed to save capsule results: ${errText}`);
    } else {
      console.log(`[Orchestrator] Capsule results saved for trip ${tripId}`);
    }

    // ── Step 7: Fulfillment (email + privacy cleanup) ─────────────────────────

    console.log(`[Orchestrator] Running fulfillment for trip ${tripId}`);
    await fulfillTrip(tripId, userEmail, env);

    // ── Step 8: Generate share content ────────────────────────────────────────

    const shareContent = generateShareContent(trip);
    console.log(
      `[Orchestrator] Share content generated. URL: ${shareContent.share_url}`
    );

    // Optionally persist share content to DB here if needed

    // ── Step 9: Mark trip as completed ───────────────────────────────────────

    await supabaseRequest(env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });

    console.log(`[Orchestrator] Trip ${tripId} completed successfully`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Orchestrator] Fatal error for trip ${tripId}: ${message}`);

    await supabaseRequest(env, `/trips?id=eq.${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed' }),
    });

    throw err;
  }
}

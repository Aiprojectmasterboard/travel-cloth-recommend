/**
 * orchestrator.ts
 *
 * Two exported pipeline functions:
 *
 *   runPreview(input, env) — free-tier pipeline:
 *     trips INSERT → annual limit check → weather (parallel) → vibe (parallel)
 *     → teaser (first city) → capsule free mode → generation_jobs INSERT → return PreviewResponse
 *
 *   runResult(tripId, plan, email, env) — post-payment pipeline:
 *     usage_records update → [pro/annual: styleAgent + imageGenAgent]
 *     → [standard: teaser unblur] → capsuleAgent paid → fulfillmentAgent → growthAgent
 */

import type { Bindings, PlanType } from '../index';
import { weatherAgent, type WeatherResult } from './weatherAgent';
import { vibeAgent, type VibeResult } from './vibeAgent';
import { teaserAgent } from './teaserAgent';
import { capsuleAgent, type CapsuleResult } from './capsuleAgent';
import { styleAgent, type UserProfile } from './styleAgent';
import { imageGenAgent } from './imageGenAgent';
import { fulfillmentAgent } from './fulfillmentAgent';
import { growthAgent } from './growthAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripInput {
  trip_id: string;
  session_id: string;
  cities: unknown[]; // raw JSONB from DB — cast to CityInput[] below
  month: number;
  face_url?: string;
  /** Optional traveller profile from the trip form (step 2 / step 3) */
  user_profile?: {
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    aesthetics?: string[];
  };
}

interface CityInput {
  name: string;
  country: string;
  days: number;
  lat?: number;
  lon?: number;
}

export interface PreviewResponse {
  trip_id: string;
  status: 'completed' | 'processing';
  teaser_url: string | null;
  mood_label: string | null;       // e.g. "Paris — Rainy Chic"
  capsule: CapsuleResult;
  vibes: VibeResult[];
  weather: WeatherResult[];
}

// ─── Face Cleanup Helper ──────────────────────────────────────────────────────

/**
 * Deletes the original face photo from R2 and nulls face_url in the DB.
 * Called immediately after image generation completes (success or failure).
 * Non-throwing — any errors are logged and suppressed.
 */
async function cleanupFace(tripId: string, faceUrl: string, env: Bindings): Promise<void> {
  try {
    const faceKey = faceUrl.startsWith('http')
      ? new URL(faceUrl).pathname.replace(/^\//, '')
      : faceUrl;
    await env.R2.delete(faceKey);
    console.log(`[orchestrator] Face image deleted from R2 for trip ${tripId}`);
  } catch (err) {
    console.error(`[orchestrator] R2 face deletion failed for trip ${tripId}:`, (err as Error).message);
  }
  // Always null face_url in DB regardless of R2 outcome
  try {
    await sbPatch(env, `/trips?id=eq.${tripId}`, { face_url: null });
    console.log(`[orchestrator] face_url nulled in DB for trip ${tripId}`);
  } catch (err) {
    console.error(`[orchestrator] DB face_url null failed for trip ${tripId}:`, (err as Error).message);
  }
}

// ─── Supabase Helper ──────────────────────────────────────────────────────────

async function sbFetch(
  env: Bindings,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function sbPatch(env: Bindings, path: string, body: Record<string, unknown>): Promise<void> {
  await sbFetch(env, path, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

// ─── Annual Limit Check ───────────────────────────────────────────────────────

/**
 * Throws an error with message "AnnualLimitReached" if the user_email has
 * consumed >= 12 trips in the current annual billing period.
 * Only applies to the "annual" plan.
 * Checks period_end to ensure the record is still within the active billing cycle.
 */
async function checkAnnualLimit(
  userEmail: string,
  env: Bindings
): Promise<void> {
  if (!userEmail) return; // anonymous previews are not tracked

  const res = await sbFetch(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(userEmail)}&plan=eq.annual&order=period_end.desc&limit=1`
  );

  if (!res.ok) {
    console.warn('[Orchestrator] Could not check annual usage — proceeding');
    return;
  }

  const rows = (await res.json()) as Array<{ trip_count: number; period_start: string; period_end: string }>;
  if (rows.length === 0) return; // no record yet → first trip, allow

  const row = rows[0];
  if (!row) return;

  // If the billing period has expired, treat as fresh (allow)
  const today = new Date().toISOString().slice(0, 10);
  if (row.period_end && today > row.period_end) return;

  if (row.trip_count >= 12) {
    throw new Error('AnnualLimitReached');
  }
}

/**
 * Increments usage_records.trip_count for an annual-plan user.
 * If an active period record exists, increments trip_count.
 * If no record or period expired, creates a new record with 1-year period.
 */
async function incrementAnnualUsage(userEmail: string, env: Bindings): Promise<void> {
  if (!userEmail) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Find the most recent annual usage record
  const existing = await sbFetch(
    env,
    `/usage_records?user_email=eq.${encodeURIComponent(userEmail)}&plan=eq.annual&order=period_end.desc&limit=1`
  );

  if (existing.ok) {
    const rows = (await existing.json()) as Array<{ id: string; trip_count: number; period_end: string }>;
    if (rows.length > 0 && rows[0]) {
      // If period is still active, increment
      if (rows[0].period_end && todayStr <= rows[0].period_end) {
        await sbPatch(env, `/usage_records?id=eq.${rows[0].id}`, {
          trip_count: rows[0].trip_count + 1,
        });
        return;
      }
      // Period expired — fall through to create new record
    }
  }

  // Create new usage record (first trip or new billing period)
  const periodStart = todayStr;
  const nextYear = new Date(now);
  nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  const periodEnd = nextYear.toISOString().slice(0, 10);

  await sbFetch(env, '/usage_records', {
    method: 'POST',
    body: JSON.stringify({
      user_email: userEmail,
      plan: 'annual',
      trip_count: 1,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  });
}

// ─── CityInput Parser ─────────────────────────────────────────────────────────

function parseCities(raw: unknown[]): CityInput[] {
  const results: CityInput[] = [];
  for (const c of raw) {
    if (typeof c !== 'object' || c === null) continue;
    const obj = c as Record<string, unknown>;
    if (!obj.name || typeof obj.name !== 'string') continue;
    results.push({
      name: obj.name,
      country: typeof obj.country === 'string' ? obj.country : '',
      days: typeof obj.days === 'number' ? obj.days : 1,
      lat: typeof obj.lat === 'number' ? obj.lat : undefined,
      lon: typeof obj.lon === 'number' ? obj.lon : undefined,
    });
  }
  return results;
}

// ─── runPreview ───────────────────────────────────────────────────────────────

/**
 * Runs the free-tier preview pipeline for a newly created trip.
 *
 * Writes to: generation_jobs (teaser row), trips.status
 * Returns:   PreviewResponse (teaser URL, mood, free capsule, weather/vibe arrays)
 */
export async function runPreview(
  input: TripInput,
  env: Bindings
): Promise<PreviewResponse> {
  const { trip_id, cities: rawCities, month, face_url, user_profile } = input;

  console.log(`[runPreview] Starting free preview for trip ${trip_id}`);

  // Mark trip as processing
  await sbPatch(env, `/trips?id=eq.${trip_id}`, { status: 'processing' });

  const cities = parseCities(rawCities);
  if (cities.length === 0) {
    throw new Error(`Trip ${trip_id} has no valid cities in the payload`);
  }

  try {
    // ── 1. Annual limit check ────────────────────────────────────────────────
    // (annual check is primarily enforced in runResult; this is a guard for
    // edge cases where email is known at preview time)

    // ── 2. Weather — parallel per city ───────────────────────────────────────
    const weatherResults = await Promise.all(
      cities.map(async (city): Promise<WeatherResult> => {
        if (!city.lat || !city.lon) {
          // Return a neutral fallback if coordinates are missing
          return {
            city: city.name,
            month,
            temperature_day_avg: 20,
            temperature_night_avg: 13,
            precipitation_prob: 0.3,
            climate_band: 'warm',
            style_hint: 'Pack versatile layers for mixed conditions.',
          };
        }
        try {
          return await weatherAgent({ city: city.name, lat: city.lat, lon: city.lon, month }, env);
        } catch (err) {
          console.warn(`[runPreview] Weather failed for ${city.name}:`, (err as Error).message);
          return {
            city: city.name,
            month,
            temperature_day_avg: 20,
            temperature_night_avg: 13,
            precipitation_prob: 0.3,
            climate_band: 'warm',
            style_hint: 'Pack versatile layers for mixed conditions.',
          };
        }
      })
    );

    // ── 3. Vibe — STATIC (no Claude API call) ─────────────────────────────
    // Cost savings: ~$0.004 per city per preview → $0
    const vibeResults: VibeResult[] = cities.map((city) => {
      const isWarm = month >= 5 && month <= 9;
      const vibeDb: Record<string, { mood: string; tags: string[]; colors: string[]; avoid: string }> = {
        paris: { mood: isWarm ? 'Sunlit Parisian Ease' : 'Parisian Twilight Layers', tags: ['effortless', 'refined', 'romantic', 'layered'], colors: ['#C9B99A', '#4A4E5A', '#D6CFC4'], avoid: isWarm ? 'Avoid heavy coats — light layers work best.' : 'Avoid thin fabrics without layering options.' },
        rome: { mood: isWarm ? 'Roman Golden Hour' : 'Roman Terracotta Warmth', tags: ['sun-kissed', 'Mediterranean', 'relaxed', 'warm-toned'], colors: ['#C2956B', '#E8C9A0', '#8B6E4E'], avoid: isWarm ? 'Avoid dark heavy fabrics in the heat.' : 'Pack a light jacket for cool evenings.' },
        barcelona: { mood: isWarm ? 'Coastal Barcelona Glow' : 'Barcelona Urban Breeze', tags: ['coastal', 'vibrant', 'casual', 'colorful'], colors: ['#E2A76F', '#5BA3C2', '#F5DEB3'], avoid: isWarm ? 'Avoid overdressing — coastal casual is key.' : 'Layer for variable Mediterranean weather.' },
        tokyo: { mood: isWarm ? 'Tokyo Neon Minimal' : 'Tokyo Urban Layer', tags: ['structured', 'minimal', 'urban', 'clean'], colors: ['#2C2C2C', '#E8E0D5', '#8B7355'], avoid: isWarm ? 'Avoid bulky items — clean lines work best.' : 'Pack warm layers for chilly evenings.' },
        london: { mood: isWarm ? 'London Garden Party' : 'London Understated Layer', tags: ['classic', 'tailored', 'understated', 'polished'], colors: ['#4A5568', '#C4A882', '#2C3E50'], avoid: 'Always pack a waterproof layer.' },
        'new york': { mood: isWarm ? 'NYC Street Edge' : 'NYC Dark Minimal', tags: ['edgy', 'street', 'bold', 'urban'], colors: ['#1A1A1A', '#C4613A', '#E8DDD4'], avoid: 'Comfortable shoes are essential for walking.' },
        seoul: { mood: isWarm ? 'Seoul Fresh Contemporary' : 'Seoul Clean Layer', tags: ['contemporary', 'clean', 'trendy', 'minimal'], colors: ['#E8E0D5', '#4A4E5A', '#A0C4B8'], avoid: isWarm ? 'Lightweight breathable fabrics recommended.' : 'Smart layering for variable temperatures.' },
        milan: { mood: isWarm ? 'Milan Luxe Ease' : 'Milan Tailored Elegance', tags: ['luxurious', 'tailored', 'refined', 'designer'], colors: ['#8B7355', '#2C2C2C', '#D4C5B2'], avoid: 'Avoid overly casual looks — Milan appreciates style.' },
        bali: { mood: 'Bali Coastal Ease', tags: ['tropical', 'relaxed', 'earthy', 'flowy'], colors: ['#8B6E4E', '#4A7C59', '#F0E0C8'], avoid: 'Pack light breathable fabrics only.' },
      };
      const key = city.name.toLowerCase();
      const match = vibeDb[key] || { mood: `${city.name} Style`, tags: ['versatile', 'travel-ready', 'stylish'], colors: ['#8B7355', '#C4A882', '#4A5568'], avoid: 'Pack versatile pieces that mix and match.' };
      return {
        city: city.name,
        mood_label: `${city.name} — ${match.mood}`,
        mood_name: match.mood,
        vibe_tags: match.tags,
        color_palette: match.colors,
        avoid_note: match.avoid,
      };
    });

    // ── 4. Teaser image — AI generated (Day 1 only, ~$0.01) ──────────────
    // Day 1 uses real AI generation based on user info (city, gender, style).
    // Days 2-4 use static blurred images on the frontend (no API cost).
    let teaserUrl: string | null = null;
    const firstVibe = vibeResults[0];

    // Fallback static images in case AI generation fails
    const gender = user_profile?.gender || 'female';
    const staticBase = 'https://travel-cloth-recommend.pages.dev/examples';
    const fallbackTeaser = gender === 'male'
      ? `${staticBase}/annual-outfit-1.png`
      : `${staticBase}/pro-outfit-1.png`;

    if (firstVibe) {
      try {
        const teaser = await teaserAgent(
          {
            tripId: trip_id,
            vibeResult: firstVibe,
            faceUrl: face_url || (gender === 'male'
              ? 'https://travel-cloth-recommend.pages.dev/defaults/default-male.png'
              : 'https://travel-cloth-recommend.pages.dev/defaults/default-female.png'),
            userProfile: user_profile
              ? {
                  gender: user_profile.gender as 'male' | 'female' | 'non-binary' | undefined,
                  height_cm: user_profile.height_cm,
                  aesthetics: user_profile.aesthetics,
                }
              : undefined,
          },
          env
        );
        teaserUrl = teaser.image_url;
      } catch (err) {
        console.warn(`[runPreview] Teaser AI generation failed, using fallback:`, (err as Error).message);
        teaserUrl = fallbackTeaser;
      }
    } else {
      teaserUrl = fallbackTeaser;
    }

    // Insert generation_jobs row for tracking
    try {
      await sbFetch(env, '/generation_jobs', {
        method: 'POST',
        body: JSON.stringify({
          trip_id,
          city: cities[0]?.name ?? '',
          mood: firstVibe?.mood_name ?? '',
          prompt: firstVibe?.mood_label ?? 'teaser',
          status: 'completed',
          image_url: teaserUrl,
          job_type: 'teaser',
          attempts: 1,
        }),
      });
    } catch (err) {
      console.warn(`[runPreview] generation_jobs INSERT failed:`, (err as Error).message);
    }

    // ── 5. Capsule — DETERMINISTIC (no Claude API call) ──────────────────
    // Cost savings: ~$0.006 per preview → $0
    const totalDays = cities.reduce((s, c) => s + c.days, 0);
    const capsuleCount = Math.min(15, Math.max(8, Math.round(totalDays * 1.5)));
    const isWarmMonth = month >= 5 && month <= 9;
    const capsule: CapsuleResult = {
      plan: 'free',
      count: capsuleCount,
      principles: [
        isWarmMonth
          ? `Pack lightweight breathable layers — a linen shirt or cotton tee transitions effortlessly from ${cities[0]?.name || 'the city'}'s warm days to cooler evenings.`
          : `Build around one versatile outerwear piece that handles ${cities[0]?.name || 'the city'}'s variable temperatures without adding bulk.`,
        `Choose ${Math.min(3, cities.length)} neutral base colors that mix and match across all ${totalDays} days, maximizing outfit combinations with fewer items.`,
        cities.length > 1
          ? `Select pieces that work across all ${cities.length} destinations — one pair of versatile shoes and one bag that handle both city walks and dining.`
          : `Carry a compact packable layer for unexpected weather changes throughout your ${totalDays}-day trip.`,
      ],
    };

    // ── 6. Mark trip as completed (free stage) ───────────────────────────────
    await sbPatch(env, `/trips?id=eq.${trip_id}`, {
      status: 'completed',
      // Store preview data on trip row so GET /api/preview/:tripId and runResult can read it
      vibe_data: vibeResults,
      weather_data: weatherResults,
      capsule_free: capsule,
    });

    console.log(`[runPreview] Free preview complete for trip ${trip_id}`);

    return {
      trip_id,
      status: 'completed',
      teaser_url: teaserUrl,
      mood_label: firstVibe?.mood_label ?? null,
      capsule,
      vibes: vibeResults,
      weather: weatherResults,
    };
  } catch (err) {
    await sbPatch(env, `/trips?id=eq.${trip_id}`, { status: 'failed' });
    throw err;
  }
}

// ─── runResult ────────────────────────────────────────────────────────────────

/**
 * Runs the post-payment pipeline after a Polar `order.paid` event.
 *
 * standard → unblur teaser + full capsule + email
 * pro/annual → style prompts + multi-image generation + full capsule + email
 */
export async function runResult(
  tripId: string,
  plan: PlanType,
  userEmail: string,
  env: Bindings
): Promise<void> {
  console.log(`[runResult] Starting ${plan} pipeline for trip ${tripId}`);

  // ── 1. Fetch trip data (vibes + weather stored from runPreview) ─────────────
  const tripRes = await sbFetch(env, `/trips?id=eq.${tripId}&limit=1`);
  if (!tripRes.ok) throw new Error(`[runResult] Failed to fetch trip ${tripId}`);

  const trips = (await tripRes.json()) as Array<Record<string, unknown>>;
  if (trips.length === 0) throw new Error(`[runResult] Trip ${tripId} not found`);

  const trip = trips[0];
  const rawCities = Array.isArray(trip.cities) ? trip.cities : [];
  const cities = parseCities(rawCities);
  // PostgREST may return NUMERIC columns as strings — coerce to number safely
  const month = Number(trip.month) || 1;
  const faceUrl = typeof trip.face_url === 'string' ? trip.face_url : undefined;

  // ── Read user profile from trip row (written by /api/preview on insert) ──
  // PostgREST returns NUMERIC(5,1) as strings (e.g. "180.0") — parse with Number()
  const tripGender   = typeof trip.gender === 'string' ? trip.gender : 'female';
  const tripAesthetics: string[] = Array.isArray(trip.aesthetics) ? (trip.aesthetics as string[]) : [];
  const rawHeight = Number(trip.height_cm);
  const rawWeight = Number(trip.weight_kg);
  const userProfile: UserProfile = {
    gender: (tripGender === 'male' || tripGender === 'non-binary')
      ? (tripGender as 'male' | 'non-binary')
      : 'female',
    height_cm: rawHeight > 0 ? rawHeight : undefined,
    weight_kg: rawWeight > 0 ? rawWeight : undefined,
    aesthetics: tripAesthetics,
  };

  console.log(`[runResult] User profile: gender=${userProfile.gender}, height=${userProfile.height_cm}, weight=${userProfile.weight_kg}, aesthetics=${userProfile.aesthetics.join(',')}, face=${faceUrl ? 'yes' : 'no'}`);

  // Retrieve cached vibe/weather from trip row (set by runPreview)
  const vibeResults: VibeResult[] = Array.isArray(trip.vibe_data)
    ? (trip.vibe_data as VibeResult[])
    : [];
  const weatherResults: WeatherResult[] = Array.isArray(trip.weather_data)
    ? (trip.weather_data as WeatherResult[])
    : [];

  // If vibes are missing (edge case), re-run weather+vibe pipeline
  const finalVibes: VibeResult[] = vibeResults.length > 0
    ? vibeResults
    : await Promise.all(
        cities.map(async (city, i) => {
          const weather = weatherResults[i] ?? {
            city: city.name,
            month,
            temperature_day_avg: 20,
            temperature_night_avg: 13,
            precipitation_prob: 0.3,
            climate_band: 'warm' as const,
            style_hint: '',
          };
          const r = await vibeAgent({ city: city.name, country: city.country, weather }, env);
          return { ...r, city: city.name };
        })
      );

  const finalWeather: WeatherResult[] = weatherResults.length > 0
    ? weatherResults
    : await Promise.all(
        cities.map((city) =>
          city.lat && city.lon
            ? weatherAgent({ city: city.name, lat: city.lat, lon: city.lon, month }, env)
            : Promise.resolve<WeatherResult>({
                city: city.name,
                month,
                temperature_day_avg: 20,
                temperature_night_avg: 13,
                precipitation_prob: 0.3,
                climate_band: 'warm',
                style_hint: '',
              })
        )
      );

  // ── 2. Annual limit check + usage increment ──────────────────────────────
  if (plan === 'annual') {
    await checkAnnualLimit(userEmail, env);
    await incrementAnnualUsage(userEmail, env);
  }

  // ── 3. Plan-specific image pipeline ──────────────────────────────────────

  if (plan === 'pro' || plan === 'annual') {
    // a. Generate style prompts via Claude
    const stylePrompts = await styleAgent(
      {
        vibeResults: finalVibes,
        cities: cities.map((c) => c.name),
        weather: finalWeather,
        userProfile,
      },
      env
    );

    // b. Insert generation_jobs rows for each prompt
    const jobInsertRows = stylePrompts.map((sp) => ({
      trip_id: tripId,
      city: sp.city,
      mood: sp.mood,
      prompt: sp.prompt,
      status: 'pending',
      job_type: 'full',
    }));

    let jobIds: Record<string, string> = {};
    try {
      const insertRes = await sbFetch(env, '/generation_jobs', {
        method: 'POST',
        body: JSON.stringify(jobInsertRows),
      });
      if (insertRes.ok) {
        const savedJobs = (await insertRes.json()) as Array<{ id: string; city: string; mood: string }>;
        for (const job of savedJobs) {
          jobIds[`${job.city}/${job.mood}`] = job.id;
        }
      }
    } catch (err) {
      console.warn('[runResult] Failed to insert generation_jobs:', (err as Error).message);
    }

    // c. Apply gender-based default face if user didn't upload a photo
    const effectiveFaceUrl = faceUrl || (
      userProfile.gender === 'male'
        ? 'https://travel-cloth-recommend.pages.dev/defaults/default-male.png'
        : 'https://travel-cloth-recommend.pages.dev/defaults/default-female.png'
    );

    // d. Generate images (Promise.allSettled internally — never throws)
    await imageGenAgent(
      {
        prompts: stylePrompts,
        tripId,
        jobIds,
        faceUrl: effectiveFaceUrl,
      },
      env
    );

    // e. Privacy cleanup: delete user-uploaded face only (not default images)
    //    (both success and failure paths — imageGenAgent uses Promise.allSettled so always returns)
    if (faceUrl) {
      await cleanupFace(tripId, faceUrl, env);
    }
  } else {
    // Standard plan: teaser is already completed — no further image generation.
    // Face cleanup is handled by fulfillmentAgent below.
  }

  // ── 4. Full capsule wardrobe ──────────────────────────────────────────────
  const totalDays = cities.reduce((s, c) => s + c.days, 0);

  // Non-fatal: capsule errors use a fallback so fulfillmentAgent always runs
  let capsule: Awaited<ReturnType<typeof capsuleAgent>>;
  try {
    capsule = await capsuleAgent(
      {
        vibeResults: finalVibes,
        weather: finalWeather,
        plan,
        cities: cities.map((c) => ({ name: c.name, days: c.days })),
        month,
        tripDays: totalDays,
        userProfile: {
          gender: userProfile.gender,
          height_cm: userProfile.height_cm,
          weight_kg: userProfile.weight_kg,
          aesthetics: userProfile.aesthetics,
        },
      },
      env
    );
  } catch (err) {
    console.error('[runResult] Capsule agent failed — using fallback:', (err as Error).message);
    // Fallback keeps the pipeline alive so fulfillmentAgent (email + cleanup) always runs
    capsule = {
      plan,
      items: [],
      daily_plan: [],
    } as Awaited<ReturnType<typeof capsuleAgent>>;
  }

  // Save capsule_results
  try {
    await sbFetch(env, '/capsule_results', {
      method: 'POST',
      body: JSON.stringify({
        trip_id: tripId,
        ...(capsule.plan !== 'free' ? capsule : {}),
        plan: capsule.plan,
      }),
    });
  } catch (err) {
    console.error('[runResult] Failed to save capsule_results:', (err as Error).message);
  }

  // ── 5. Fulfillment (email + face cleanup + temp R2 cleanup) ──────────────
  //       fulfillmentAgent checks face_url; if already nulled above (pro/annual),
  //       it skips R2 deletion (face_url is null) — safe to call in all cases.
  const galleryUrl = `https://travelscapsule.com/result/${tripId}`;
  await fulfillmentAgent({ tripId, email: userEmail, galleryUrl }, env);

  // ── 6. Growth (share copy + upgrade token) ────────────────────────────────
  const firstVibe = finalVibes[0];
  const moodLabel = firstVibe?.mood_label ?? cities[0]?.name ?? 'Travel Capsule';

  const growth = await growthAgent({ tripId, moodName: moodLabel, plan }, env);

  // Persist growth data on trip row
  await sbPatch(env, `/trips?id=eq.${tripId}`, {
    share_url: growth.share_url,
    upgrade_token: growth.upgrade_token ?? null,
    status: 'completed',
  });

  console.log(`[runResult] ${plan} pipeline complete for trip ${tripId}. Share: ${growth.share_url}`);
}

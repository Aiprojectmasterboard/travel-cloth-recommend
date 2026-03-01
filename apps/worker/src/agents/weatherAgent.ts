/**
 * weatherAgent.ts
 *
 * Fetches monthly climate statistics for a city from the Open-Meteo archive API
 * and caches results in the Supabase `weather_cache` table for 24 hours.
 *
 * Climate band logic:
 *   cold   → avg_max < 10°C
 *   mild   → 10°C ≤ avg_max < 18°C
 *   warm   → 18°C ≤ avg_max ≤ 26°C
 *   hot    → avg_max > 26°C
 *   rainy  → precipitation on ≥ 50% of days with daily total > 3 mm
 *            (rainy overrides any temperature band)
 */

import type { Bindings } from '../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClimateBand = 'cold' | 'mild' | 'warm' | 'hot' | 'rainy';

export interface WeatherResult {
  city: string;
  month: number;
  temperature_day_avg: number;   // °C — average of daily max values
  temperature_night_avg: number; // °C — average of daily min values
  precipitation_prob: number;    // 0.0–1.0 fraction of rainy days (>3 mm)
  climate_band: ClimateBand;
  style_hint: string;
}

// Internal Open-Meteo archive API response shape
interface OpenMeteoArchiveResponse {
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
  error?: boolean;
  reason?: string;
}

// Supabase weather_cache row
interface WeatherCacheRow {
  city: string;
  month: number;
  data: WeatherResult;
  cached_at: string;
}

// ─── Supabase Helper (local) ──────────────────────────────────────────────────

async function sbFetch(env: Bindings, path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${env.SUPABASE_URL}/rest/v1${path}`;
  return fetch(url, {
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

// ─── Climate Band Classifier ──────────────────────────────────────────────────

function classifyClimateBand(avgMax: number, precipFraction: number): ClimateBand {
  // Rainy takes priority over temperature band
  if (precipFraction >= 0.5) return 'rainy';
  if (avgMax < 10) return 'cold';
  if (avgMax < 18) return 'mild';
  if (avgMax <= 26) return 'warm';
  return 'hot';
}

// ─── Style Hint Generator ─────────────────────────────────────────────────────

function buildStyleHint(band: ClimateBand, dayAvg: number): string {
  switch (band) {
    case 'cold':
      return `Temperatures average ${dayAvg.toFixed(0)}°C — pack thermal layers, a heavy coat, and waterproof boots.`;
    case 'mild':
      return `Mild temperatures around ${dayAvg.toFixed(0)}°C — a trench coat and light knitwear are ideal.`;
    case 'warm':
      return `Warm days at ${dayAvg.toFixed(0)}°C — breathable fabrics and light layers for cooler evenings.`;
    case 'hot':
      return `Expect heat around ${dayAvg.toFixed(0)}°C — prioritise linen, UV protection, and minimal layers.`;
    case 'rainy':
      return `Frequent rain expected — waterproof outerwear, compact umbrella, and quick-dry fabrics are essential.`;
  }
}

// ─── Open-Meteo Fetch ─────────────────────────────────────────────────────────

async function fetchOpenMeteo(
  lat: number,
  lon: number,
  month: number
): Promise<WeatherResult | null> {
  // Use the previous calendar year's data for the same month (archive endpoint
  // requires a completed date range).
  const year = new Date().getUTCFullYear() - 1;
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: `${year}-${mm}-01`,
    end_date: `${year}-${mm}-${lastDay}`,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  });

  const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    const message = (err as Error).message;
    const reason = message.includes('abort') ? 'timeout after 10s' : message;
    console.error(`[weatherAgent] Network error calling Open-Meteo: ${reason}`);
    return null;
  }

  if (!res.ok) {
    console.error(`[weatherAgent] Open-Meteo HTTP ${res.status}`);
    return null;
  }

  const data = (await res.json()) as OpenMeteoArchiveResponse;

  if (data.error || !data.daily) {
    console.error('[weatherAgent] Open-Meteo returned error:', data.reason ?? 'unknown');
    return null;
  }

  const { temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;
  const n = temperature_2m_max.length;
  if (n === 0) return null;

  // Compute averages, ignoring null values
  const validMax = temperature_2m_max.filter((v): v is number => v !== null);
  const validMin = temperature_2m_min.filter((v): v is number => v !== null);
  const validPrecip = precipitation_sum.filter((v): v is number => v !== null);

  const dayAvg = validMax.length
    ? validMax.reduce((a, b) => a + b, 0) / validMax.length
    : 20;
  const nightAvg = validMin.length
    ? validMin.reduce((a, b) => a + b, 0) / validMin.length
    : 12;

  // Fraction of days with precipitation > 3 mm
  const rainyDays = validPrecip.filter((p) => p > 3).length;
  const precipFraction = validPrecip.length ? rainyDays / validPrecip.length : 0;

  const band = classifyClimateBand(dayAvg, precipFraction);

  return {
    city: '', // filled in by caller
    month,
    temperature_day_avg: Math.round(dayAvg * 10) / 10,
    temperature_night_avg: Math.round(nightAvg * 10) / 10,
    precipitation_prob: Math.round(precipFraction * 100) / 100,
    climate_band: band,
    style_hint: buildStyleHint(band, dayAvg),
  };
}

// ─── Main Exported Function ───────────────────────────────────────────────────

/**
 * Returns weather statistics for `city` in `month`.
 *
 * Cache strategy: reads `weather_cache` first. If the cached row is <24 hours
 * old, returns it immediately. Otherwise fetches fresh data from Open-Meteo
 * and upserts into the cache before returning.
 *
 * @param input - city name, lat/lon coordinates, and travel month (1–12)
 * @param env   - Cloudflare Worker bindings
 */
export async function weatherAgent(
  input: { city: string; lat: number; lon: number; month: number },
  env: Bindings
): Promise<WeatherResult> {
  const { city, lat, lon, month } = input;

  // ── 1. Cache lookup ──────────────────────────────────────────────────────

  const cacheRes = await sbFetch(
    env,
    `/weather_cache?city=eq.${encodeURIComponent(city)}&month=eq.${month}&limit=1`
  );

  if (cacheRes.ok) {
    const rows = (await cacheRes.json()) as WeatherCacheRow[];
    if (rows.length > 0) {
      const row = rows[0];
      const cachedAt = new Date(row.cached_at).getTime();
      const ageMs = Date.now() - cachedAt;
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

      if (ageMs < maxAgeMs) {
        console.log(`[weatherAgent] Cache HIT for ${city} month=${month}`);
        return { ...row.data, city };
      }
    }
  }

  // ── 2. Fetch from Open-Meteo ────────────────────────────────────────────

  console.log(`[weatherAgent] Cache MISS for ${city} month=${month} — fetching Open-Meteo`);
  const fresh = await fetchOpenMeteo(lat, lon, month);

  if (!fresh) {
    // Fallback: return neutral data rather than throwing so the pipeline continues
    console.warn(`[weatherAgent] Open-Meteo fetch failed for ${city} — using fallback`);
    const fallback: WeatherResult = {
      city,
      month,
      temperature_day_avg: 20,
      temperature_night_avg: 13,
      precipitation_prob: 0.3,
      climate_band: 'warm',
      style_hint: 'Pack versatile layers suitable for mixed conditions.',
    };
    return fallback;
  }

  const result: WeatherResult = { ...fresh, city };

  // ── 3. Upsert into weather_cache ────────────────────────────────────────

  try {
    await sbFetch(env, '/weather_cache', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        city,
        month,
        data: result,
        cached_at: new Date().toISOString(),
      }),
    });
    console.log(`[weatherAgent] Cache upserted for ${city} month=${month}`);
  } catch (err) {
    // Non-fatal: cache write failure should not block the pipeline
    console.error('[weatherAgent] Cache upsert failed:', (err as Error).message);
  }

  return result;
}

import type { CityInput, ClimateData, ClimateBand } from '../../../../packages/types/index';

// ─── Open-Meteo Response Types ────────────────────────────────────────────────

interface OpenMeteoResponse {
  monthly?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
  error?: boolean;
  reason?: string;
}

// ─── Climate Band Classifier ──────────────────────────────────────────────────

function classifyClimateBand(tempMax: number, precipitation: number): ClimateBand {
  // Rainy takes highest priority
  if (precipitation > 100) return 'rainy';
  if (tempMax < 10) return 'cold';
  if (tempMax < 18) return 'mild';
  if (tempMax <= 26) return 'warm';
  return 'hot';
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Fetches monthly climate data for a city from Open-Meteo and returns
 * a classified ClimateBand for the given travel month.
 *
 * Open-Meteo forecast endpoint returns the next 12 months of monthly data.
 * We select the index corresponding to the requested month (0 = current month).
 * For best accuracy we use climatological normals when available, but the
 * free forecast endpoint is sufficient for this use-case.
 */
export async function getClimateData(city: CityInput, month: number): Promise<ClimateData> {
  if (!city.lat || !city.lon) {
    throw new Error(
      `City "${city.name}" is missing lat/lon coordinates required for climate lookup`
    );
  }

  const params = new URLSearchParams({
    latitude: city.lat.toString(),
    longitude: city.lon.toString(),
    monthly: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
    forecast_months: '12',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(
      `Network error fetching climate data for ${city.name}: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error for ${city.name}: HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (data.error) {
    throw new Error(
      `Open-Meteo returned an error for ${city.name}: ${data.reason ?? 'unknown'}`
    );
  }

  if (!data.monthly) {
    throw new Error(`Open-Meteo returned no monthly data for ${city.name}`);
  }

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.monthly;

  if (time.length === 0) {
    throw new Error(`Open-Meteo returned empty monthly arrays for ${city.name}`);
  }

  // Find the index whose YYYY-MM matches the requested month.
  // Open-Meteo returns ISO date strings like "2025-03-01".
  const currentYear = new Date().getFullYear();
  const targetMonth = month.toString().padStart(2, '0');

  // Try current year first, then next year (for future months)
  let idx = time.findIndex((t) => t.startsWith(`${currentYear}-${targetMonth}`));
  if (idx === -1) {
    idx = time.findIndex((t) => t.startsWith(`${currentYear + 1}-${targetMonth}`));
  }
  // Fallback: use modular index (month - 1)
  if (idx === -1) {
    idx = Math.min(month - 1, time.length - 1);
  }

  const tempMax = temperature_2m_max[idx] ?? 20;
  const tempMin = temperature_2m_min[idx] ?? 10;
  const precipitation = precipitation_sum[idx] ?? 0;

  const vibe_band = classifyClimateBand(tempMax, precipitation);

  return {
    city: city.name,
    month,
    temp_min: Math.round(tempMin * 10) / 10,
    temp_max: Math.round(tempMax * 10) / 10,
    precipitation: Math.round(precipitation * 10) / 10,
    vibe_band,
  };
}

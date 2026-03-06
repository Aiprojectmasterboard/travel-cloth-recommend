/**
 * Validate a city name using OpenStreetMap Nominatim (free, no API key).
 * Returns city, country, lat, lon if valid; null if not found.
 */
export interface GeocodedCity {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export async function geocodeCity(cityName: string): Promise<GeocodedCity | null> {
  try {
    const encoded = encodeURIComponent(cityName.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1&accept-language=en`,
      { headers: { "User-Agent": "TravelCapsuleAI/1.0" } },
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    const addr = result.address || {};
    const country = addr.country || "";
    // Use the display city name from the result for proper casing
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.state || cityName.trim();

    return {
      city,
      country,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch {
    return null;
  }
}

/**
 * Get a fallback image URL for a city.
 * Returns a generic travel photo (source.unsplash.com is deprecated).
 * For real city photos, use fetchCityPhoto() in OnboardingStep1.tsx.
 */
export function getCityImageUrl(_cityName: string, _width = 800): string {
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
}

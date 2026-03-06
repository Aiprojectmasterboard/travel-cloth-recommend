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
 * Get an Unsplash image URL for a city (uses source.unsplash.com redirect).
 * Falls back to a search-based URL that always returns an image.
 */
export function getCityImageUrl(cityName: string, width = 800): string {
  const query = encodeURIComponent(`${cityName} city landmark`);
  return `https://source.unsplash.com/${width}x600/?${query}`;
}

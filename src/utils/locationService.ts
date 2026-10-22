/**
 * Universal Global Geocoding and Location Resolution Utility
 * Supports:
 * 1. Global City / Region / Country Search (OpenStreetMap Nominatim Geocoding)
 * 2. Reverse Geocoding (Lat/Lng to readable City, Country)
 * 3. Fallback to Popular Worldwide Metros and Cached Locations
 */

export interface GlobalLocationResult {
  cityName: string;
  country?: string;
  lat: number;
  lng: number;
  displayName?: string;
}

// Persistent memory & localStorage cache for resolved global locations
const GLOBAL_LOCATION_CACHE: Record<string, GlobalLocationResult> = {};

function initCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('squadup_global_location_cache_v1');
      if (saved) {
        Object.assign(GLOBAL_LOCATION_CACHE, JSON.parse(saved));
      }
    }
  } catch {
    // Ignore storage errors
  }
}
initCache();

export function cacheGlobalLocation(query: string, result: GlobalLocationResult) {
  const clean = query.trim().toLowerCase();
  if (!clean) return;
  GLOBAL_LOCATION_CACHE[clean] = result;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('squadup_global_location_cache_v1', JSON.stringify(GLOBAL_LOCATION_CACHE));
    }
  } catch {
    // Ignore quota errors
  }
}

// Popular worldwide gaming metros across continents
export const POPULAR_WORLD_CITIES: GlobalLocationResult[] = [
  // North America
  { cityName: 'Los Angeles, USA', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { cityName: 'New York, USA', country: 'United States', lat: 40.7128, lng: -74.006 },
  { cityName: 'Dallas, USA', country: 'United States', lat: 32.7767, lng: -96.797 },
  { cityName: 'Toronto, Canada', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { cityName: 'Mexico City, Mexico', country: 'Mexico', lat: 19.4326, lng: -99.1332 },

  // South America
  { cityName: 'São Paulo, Brazil', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { cityName: 'Buenos Aires, Argentina', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { cityName: 'Bogotá, Colombia', country: 'Colombia', lat: 4.711, lng: -74.0721 },

  // Europe
  { cityName: 'London, UK', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { cityName: 'Berlin, Germany', country: 'Germany', lat: 52.52, lng: 13.405 },
  { cityName: 'Paris, France', country: 'France', lat: 48.8566, lng: 2.3522 },
  { cityName: 'Madrid, Spain', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { cityName: 'Warsaw, Poland', country: 'Poland', lat: 52.2297, lng: 21.0122 },

  // Asia & Middle East
  { cityName: 'Tokyo, Japan', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { cityName: 'Seoul, South Korea', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { cityName: 'Manila, Philippines', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { cityName: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { cityName: 'Dubai, UAE', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },

  // Oceania & Africa
  { cityName: 'Sydney, Australia', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { cityName: 'Melbourne, Australia', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { cityName: 'Cape Town, South Africa', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
];

/**
 * Searches worldwide cities, towns, neighborhoods, or countries using Nominatim.
 * Works seamlessly in any language and anywhere across the globe.
 */
export async function searchGlobalLocation(query: string): Promise<GlobalLocationResult | null> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;
  const lower = clean.toLowerCase();

  // 1. Check local cache
  if (GLOBAL_LOCATION_CACHE[lower]) {
    return GLOBAL_LOCATION_CACHE[lower];
  }

  // 2. Check popular world cities list
  const popularMatch = POPULAR_WORLD_CITIES.find(
    (c) =>
      c.cityName.toLowerCase().includes(lower) ||
      (c.country && c.country.toLowerCase().includes(lower))
  );
  if (popularMatch) {
    return popularMatch;
  }

  // 3. Query OpenStreetMap Nominatim Geocoding API
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      clean
    )}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (!isNaN(lat) && !isNaN(lng)) {
          // Format compact readable city/region name
          const parts = (item.display_name || '').split(',');
          const city = parts[0]?.trim() || clean;
          const country = parts[parts.length - 1]?.trim() || '';
          const cityName = country && country !== city ? `${city}, ${country}` : city;

          const result: GlobalLocationResult = {
            cityName,
            country,
            lat,
            lng,
            displayName: item.display_name,
          };

          cacheGlobalLocation(clean, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Geocoding request error:', err);
  }

  return null;
}

/**
 * Reverse geocodes coordinates (lat, lng) to a friendly city and country string.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{ cityName: string; country?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        addr.state;
      const country = addr.country || '';

      if (city) {
        return {
          cityName: country ? `${city}, ${country}` : city,
          country,
        };
      }
    }
  } catch {
    // Ignore network error and fall back
  }

  return {
    cityName: `Sector ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
  };
}

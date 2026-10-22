import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export interface AirshipWaypoint {
  name: string;
  lat: number;
  lng: number;
}

// Scenic flight corridor connecting Tijuana (Baja California / Border) to San Francisco (Bay Area)
export const AIRSHIP_WAYPOINTS: AirshipWaypoint[] = [
  { name: 'Tijuana Skyport (Baja Frontier)', lat: 32.5149, lng: -117.0382 },
  { name: 'San Diego Naval Bay', lat: 32.7157, lng: -117.1611 },
  { name: 'Orange County Coastal Skyway', lat: 33.6846, lng: -117.8265 },
  { name: 'Los Angeles Metro Sector', lat: 34.0522, lng: -118.2437 },
  { name: 'Santa Barbara Channel', lat: 34.4208, lng: -119.6982 },
  { name: 'San Luis Obispo Ridge', lat: 35.2828, lng: -120.6596 },
  { name: 'Monterey Bay Aerial Corridor', lat: 36.6002, lng: -121.8947 },
  { name: 'Silicon Valley Flight Zone', lat: 37.3382, lng: -121.8863 },
  { name: 'San Francisco (Golden Gate Skyport)', lat: 37.7749, lng: -122.4194 },
];

export interface AirshipFlightStatus {
  lat: number;
  lng: number;
  bearing: number;
  currentSector: string;
  nextSector: string;
  directionLabel: string;
  progressPercent: number;
  altitudeFt: number;
}

// Compute total route distance in km using Haversine
function haversineDistance(w1: AirshipWaypoint, w2: AirshipWaypoint): number {
  const R = 6371; // Earth radius in km
  const dLat = ((w2.lat - w1.lat) * Math.PI) / 180;
  const dLng = ((w2.lng - w1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((w1.lat * Math.PI) / 180) *
      Math.cos((w2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Precompute cumulative distances along the route
const legDistances: number[] = [];
let totalOneWayDistance = 0;
for (let i = 0; i < AIRSHIP_WAYPOINTS.length - 1; i++) {
  const d = haversineDistance(AIRSHIP_WAYPOINTS[i], AIRSHIP_WAYPOINTS[i + 1]);
  legDistances.push(d);
  totalOneWayDistance += d;
}

// Compute compass bearing from pt1 to pt2
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lng2 - lng1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export type AerialCraftType = 'airship' | 'pokemon_balloon' | 'portal_dragon';

export interface GlobalAirshipCity {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  craftType?: AerialCraftType;
  stateName?: string;
}

export const GLOBAL_AIRSHIP_CITIES: GlobalAirshipCity[] = [
  // --- United States (Middle of Each State: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'us-alabama', name: 'Alabama', stateName: 'Alabama', country: 'United States', region: 'North America', lat: 32.8067, lng: -86.7911, craftType: 'airship' },
  { id: 'us-alaska', name: 'Alaska', stateName: 'Alaska', country: 'United States', region: 'North America', lat: 64.2008, lng: -149.4937, craftType: 'pokemon_balloon' },
  { id: 'us-arizona', name: 'Arizona', stateName: 'Arizona', country: 'United States', region: 'North America', lat: 34.0489, lng: -111.0937, craftType: 'pokemon_balloon' },
  { id: 'us-arkansas', name: 'Arkansas', stateName: 'Arkansas', country: 'United States', region: 'North America', lat: 34.9697, lng: -92.3731, craftType: 'airship' },
  { id: 'us-california', name: 'California', stateName: 'California', country: 'United States', region: 'North America', lat: 36.7783, lng: -119.4179, craftType: 'pokemon_balloon' },
  { id: 'us-colorado', name: 'Colorado', stateName: 'Colorado', country: 'United States', region: 'North America', lat: 39.5501, lng: -105.7821, craftType: 'airship' },
  { id: 'us-connecticut', name: 'Connecticut', stateName: 'Connecticut', country: 'United States', region: 'North America', lat: 41.6032, lng: -73.0877, craftType: 'pokemon_balloon' },
  { id: 'us-delaware', name: 'Delaware', stateName: 'Delaware', country: 'United States', region: 'North America', lat: 39.0000, lng: -75.5000, craftType: 'pokemon_balloon' },
  { id: 'us-florida', name: 'Florida', stateName: 'Florida', country: 'United States', region: 'North America', lat: 27.6648, lng: -81.5158, craftType: 'pokemon_balloon' },
  { id: 'us-georgia', name: 'Georgia', stateName: 'Georgia', country: 'United States', region: 'North America', lat: 32.1656, lng: -82.9001, craftType: 'airship' },
  { id: 'us-hawaii', name: 'Hawaii', stateName: 'Hawaii', country: 'United States', region: 'North America', lat: 20.7984, lng: -156.3319, craftType: 'airship' },
  { id: 'us-idaho', name: 'Idaho', stateName: 'Idaho', country: 'United States', region: 'North America', lat: 44.0682, lng: -114.7420, craftType: 'airship' },
  { id: 'us-illinois', name: 'Illinois', stateName: 'Illinois', country: 'United States', region: 'North America', lat: 40.0000, lng: -89.0000, craftType: 'pokemon_balloon' },
  { id: 'us-indiana', name: 'Indiana', stateName: 'Indiana', country: 'United States', region: 'North America', lat: 40.2672, lng: -86.1349, craftType: 'airship' },
  { id: 'us-iowa', name: 'Iowa', stateName: 'Iowa', country: 'United States', region: 'North America', lat: 41.8780, lng: -93.0977, craftType: 'airship' },
  { id: 'us-kansas', name: 'Kansas', stateName: 'Kansas', country: 'United States', region: 'North America', lat: 38.5266, lng: -96.7265, craftType: 'airship' },
  { id: 'us-kentucky', name: 'Kentucky', stateName: 'Kentucky', country: 'United States', region: 'North America', lat: 37.8393, lng: -84.2700, craftType: 'pokemon_balloon' },
  { id: 'us-louisiana', name: 'Louisiana', stateName: 'Louisiana', country: 'United States', region: 'North America', lat: 31.0000, lng: -92.0000, craftType: 'pokemon_balloon' },
  { id: 'us-maine', name: 'Maine', stateName: 'Maine', country: 'United States', region: 'North America', lat: 45.2538, lng: -69.4455, craftType: 'pokemon_balloon' },
  { id: 'us-maryland', name: 'Maryland', stateName: 'Maryland', country: 'United States', region: 'North America', lat: 39.0458, lng: -76.6413, craftType: 'pokemon_balloon' },
  { id: 'us-massachusetts', name: 'Massachusetts', stateName: 'Massachusetts', country: 'United States', region: 'North America', lat: 42.4072, lng: -71.3824, craftType: 'airship' },
  { id: 'us-michigan', name: 'Michigan', stateName: 'Michigan', country: 'United States', region: 'North America', lat: 44.3148, lng: -85.6024, craftType: 'airship' },
  { id: 'us-minnesota', name: 'Minnesota', stateName: 'Minnesota', country: 'United States', region: 'North America', lat: 46.7296, lng: -94.6859, craftType: 'pokemon_balloon' },
  { id: 'us-mississippi', name: 'Mississippi', stateName: 'Mississippi', country: 'United States', region: 'North America', lat: 32.7416, lng: -89.6787, craftType: 'pokemon_balloon' },
  { id: 'us-missouri', name: 'Missouri', stateName: 'Missouri', country: 'United States', region: 'North America', lat: 38.5739, lng: -92.6038, craftType: 'airship' },
  { id: 'us-montana', name: 'Montana', stateName: 'Montana', country: 'United States', region: 'North America', lat: 46.8797, lng: -110.3626, craftType: 'airship' },
  { id: 'us-nebraska', name: 'Nebraska', stateName: 'Nebraska', country: 'United States', region: 'North America', lat: 41.4925, lng: -99.9018, craftType: 'airship' },
  { id: 'us-nevada', name: 'Nevada', stateName: 'Nevada', country: 'United States', region: 'North America', lat: 38.8026, lng: -116.4194, craftType: 'airship' },
  { id: 'us-new-hampshire', name: 'New Hampshire', stateName: 'New Hampshire', country: 'United States', region: 'North America', lat: 43.1939, lng: -71.5724, craftType: 'airship' },
  { id: 'us-new-jersey', name: 'New Jersey', stateName: 'New Jersey', country: 'United States', region: 'North America', lat: 40.0583, lng: -74.4057, craftType: 'pokemon_balloon' },
  { id: 'us-new-mexico', name: 'New Mexico', stateName: 'New Mexico', country: 'United States', region: 'North America', lat: 34.5199, lng: -105.8701, craftType: 'pokemon_balloon' },
  { id: 'us-new-york', name: 'New York', stateName: 'New York', country: 'United States', region: 'North America', lat: 43.0000, lng: -75.0000, craftType: 'airship' },
  { id: 'us-north-carolina', name: 'North Carolina', stateName: 'North Carolina', country: 'United States', region: 'North America', lat: 35.7596, lng: -79.0193, craftType: 'pokemon_balloon' },
  { id: 'us-north-dakota', name: 'North Dakota', stateName: 'North Dakota', country: 'United States', region: 'North America', lat: 47.5515, lng: -101.0020, craftType: 'pokemon_balloon' },
  { id: 'us-ohio', name: 'Ohio', stateName: 'Ohio', country: 'United States', region: 'North America', lat: 40.4173, lng: -82.9071, craftType: 'airship' },
  { id: 'us-oklahoma', name: 'Oklahoma', stateName: 'Oklahoma', country: 'United States', region: 'North America', lat: 35.5653, lng: -96.9289, craftType: 'airship' },
  { id: 'us-oregon', name: 'Oregon', stateName: 'Oregon', country: 'United States', region: 'North America', lat: 43.8041, lng: -120.5542, craftType: 'pokemon_balloon' },
  { id: 'us-pennsylvania', name: 'Pennsylvania', stateName: 'Pennsylvania', country: 'United States', region: 'North America', lat: 41.2033, lng: -77.1945, craftType: 'pokemon_balloon' },
  { id: 'us-rhode-island', name: 'Rhode Island', stateName: 'Rhode Island', country: 'United States', region: 'North America', lat: 41.5801, lng: -71.4774, craftType: 'pokemon_balloon' },
  { id: 'us-south-carolina', name: 'South Carolina', stateName: 'South Carolina', country: 'United States', region: 'North America', lat: 33.8361, lng: -81.1637, craftType: 'pokemon_balloon' },
  { id: 'us-south-dakota', name: 'South Dakota', stateName: 'South Dakota', country: 'United States', region: 'North America', lat: 43.9695, lng: -99.9018, craftType: 'airship' },
  { id: 'us-tennessee', name: 'Tennessee', stateName: 'Tennessee', country: 'United States', region: 'North America', lat: 35.5175, lng: -86.5804, craftType: 'airship' },
  { id: 'us-texas', name: 'Texas', stateName: 'Texas', country: 'United States', region: 'North America', lat: 31.9686, lng: -99.9018, craftType: 'airship' },
  { id: 'us-utah', name: 'Utah', stateName: 'Utah', country: 'United States', region: 'North America', lat: 39.3210, lng: -111.0937, craftType: 'airship' },
  { id: 'us-vermont', name: 'Vermont', stateName: 'Vermont', country: 'United States', region: 'North America', lat: 44.0000, lng: -72.7000, craftType: 'pokemon_balloon' },
  { id: 'us-virginia', name: 'Virginia', stateName: 'Virginia', country: 'United States', region: 'North America', lat: 37.4316, lng: -78.6569, craftType: 'airship' },
  { id: 'us-washington', name: 'Washington', stateName: 'Washington', country: 'United States', region: 'North America', lat: 47.4009, lng: -121.4905, craftType: 'airship' },
  { id: 'us-west-virginia', name: 'West Virginia', stateName: 'West Virginia', country: 'United States', region: 'North America', lat: 38.5976, lng: -80.4549, craftType: 'pokemon_balloon' },
  { id: 'us-wisconsin', name: 'Wisconsin', stateName: 'Wisconsin', country: 'United States', region: 'North America', lat: 43.7844, lng: -88.7879, craftType: 'pokemon_balloon' },
  { id: 'us-wyoming', name: 'Wyoming', stateName: 'Wyoming', country: 'United States', region: 'North America', lat: 43.0760, lng: -107.2903, craftType: 'pokemon_balloon' },
  { id: 'us-washington-dc', name: 'District of Columbia', stateName: 'District of Columbia', country: 'United States', region: 'North America', lat: 38.9072, lng: -77.0369, craftType: 'pokemon_balloon' },

  // --- Mexico (States centered in middle of each state: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'mx-baja-california', name: 'Baja California', stateName: 'Baja California', country: 'Mexico', region: 'North America', lat: 30.8406, lng: -115.2838, craftType: 'airship' },
  { id: 'mx-jalisco', name: 'Jalisco', stateName: 'Jalisco', country: 'Mexico', region: 'North America', lat: 20.6595, lng: -103.3494, craftType: 'pokemon_balloon' },
  { id: 'mx-nuevo-leon', name: 'Nuevo León', stateName: 'Nuevo León', country: 'Mexico', region: 'North America', lat: 25.5922, lng: -99.9962, craftType: 'airship' },
  { id: 'mx-estado-mexico', name: 'Estado de México', stateName: 'Estado de México', country: 'Mexico', region: 'North America', lat: 19.3553, lng: -99.6406, craftType: 'pokemon_balloon' },
  { id: 'mx-quintana-roo', name: 'Quintana Roo', stateName: 'Quintana Roo', country: 'Mexico', region: 'North America', lat: 19.1817, lng: -88.4791, craftType: 'airship' },
  { id: 'mx-sonora', name: 'Sonora', stateName: 'Sonora', country: 'Mexico', region: 'North America', lat: 29.2972, lng: -110.3309, craftType: 'pokemon_balloon' },
  { id: 'mx-chihuahua', name: 'Chihuahua', stateName: 'Chihuahua', country: 'Mexico', region: 'North America', lat: 28.6353, lng: -106.0889, craftType: 'airship' },
  { id: 'mx-yucatan', name: 'Yucatán', stateName: 'Yucatán', country: 'Mexico', region: 'North America', lat: 20.7099, lng: -89.0943, craftType: 'pokemon_balloon' },
  { id: 'mx-veracruz', name: 'Veracruz', stateName: 'Veracruz', country: 'Mexico', region: 'North America', lat: 19.1738, lng: -96.1342, craftType: 'airship' },
  { id: 'mx-puebla', name: 'Puebla', stateName: 'Puebla', country: 'Mexico', region: 'North America', lat: 19.0414, lng: -98.2063, craftType: 'pokemon_balloon' },

  // --- Canada (Provinces centered in middle: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'ca-ontario', name: 'Ontario', stateName: 'Ontario', country: 'Canada', region: 'North America', lat: 51.2538, lng: -85.3232, craftType: 'airship' },
  { id: 'ca-quebec', name: 'Quebec', stateName: 'Quebec', country: 'Canada', region: 'North America', lat: 52.9399, lng: -73.5491, craftType: 'pokemon_balloon' },
  { id: 'ca-british-columbia', name: 'British Columbia', stateName: 'British Columbia', country: 'Canada', region: 'North America', lat: 53.7267, lng: -127.6476, craftType: 'airship' },
  { id: 'ca-alberta', name: 'Alberta', stateName: 'Alberta', country: 'Canada', region: 'North America', lat: 53.9333, lng: -116.5765, craftType: 'pokemon_balloon' },
  { id: 'ca-manitoba', name: 'Manitoba', stateName: 'Manitoba', country: 'Canada', region: 'North America', lat: 53.7609, lng: -98.8139, craftType: 'airship' },
  { id: 'ca-saskatchewan', name: 'Saskatchewan', stateName: 'Saskatchewan', country: 'Canada', region: 'North America', lat: 52.9399, lng: -106.4509, craftType: 'pokemon_balloon' },
  { id: 'ca-nova-scotia', name: 'Nova Scotia', stateName: 'Nova Scotia', country: 'Canada', region: 'North America', lat: 44.6820, lng: -63.7443, craftType: 'airship' },
  { id: 'ca-new-brunswick', name: 'New Brunswick', stateName: 'New Brunswick', country: 'Canada', region: 'North America', lat: 46.5653, lng: -66.4619, craftType: 'pokemon_balloon' },

  // --- South America (States & Provinces: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'br-sao-paulo', name: 'São Paulo State', stateName: 'São Paulo', country: 'Brazil', region: 'South America', lat: -22.1585, lng: -48.7408, craftType: 'airship' },
  { id: 'br-rio-de-janeiro', name: 'Rio de Janeiro State', stateName: 'Rio de Janeiro', country: 'Brazil', region: 'South America', lat: -22.3700, lng: -42.8700, craftType: 'pokemon_balloon' },
  { id: 'br-bahia', name: 'Bahia', stateName: 'Bahia', country: 'Brazil', region: 'South America', lat: -12.5797, lng: -41.7007, craftType: 'airship' },
  { id: 'br-minas-gerais', name: 'Minas Gerais', stateName: 'Minas Gerais', country: 'Brazil', region: 'South America', lat: -18.5122, lng: -44.5550, craftType: 'pokemon_balloon' },
  { id: 'br-amazonas', name: 'Amazonas', stateName: 'Amazonas', country: 'Brazil', region: 'South America', lat: -3.4168, lng: -65.8561, craftType: 'airship' },
  { id: 'br-rio-grande-sul', name: 'Rio Grande do Sul', stateName: 'Rio Grande do Sul', country: 'Brazil', region: 'South America', lat: -30.0346, lng: -53.2200, craftType: 'pokemon_balloon' },
  { id: 'ar-buenos-aires', name: 'Buenos Aires Province', stateName: 'Buenos Aires', country: 'Argentina', region: 'South America', lat: -36.6769, lng: -60.5588, craftType: 'airship' },
  { id: 'ar-cordoba', name: 'Córdoba', stateName: 'Córdoba', country: 'Argentina', region: 'South America', lat: -31.4201, lng: -64.1888, craftType: 'pokemon_balloon' },
  { id: 'ar-mendoza', name: 'Mendoza', stateName: 'Mendoza', country: 'Argentina', region: 'South America', lat: -34.5000, lng: -68.5000, craftType: 'airship' },
  { id: 'cl-metropolitana', name: 'Santiago Metropolitan', stateName: 'Región Metropolitana', country: 'Chile', region: 'South America', lat: -33.4489, lng: -70.6693, craftType: 'pokemon_balloon' },
  { id: 'co-antioquia', name: 'Antioquia', stateName: 'Antioquia', country: 'Colombia', region: 'South America', lat: 6.5350, lng: -75.4000, craftType: 'airship' },
  { id: 'co-cundinamarca', name: 'Cundinamarca', stateName: 'Cundinamarca', country: 'Colombia', region: 'South America', lat: 4.8000, lng: -74.1000, craftType: 'pokemon_balloon' },

  // --- Europe (States, Regions & Constituent Countries: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'uk-england', name: 'England', stateName: 'England', country: 'United Kingdom', region: 'Europe', lat: 52.3555, lng: -1.1743, craftType: 'airship' },
  { id: 'uk-scotland', name: 'Scotland', stateName: 'Scotland', country: 'United Kingdom', region: 'Europe', lat: 56.4907, lng: -4.2026, craftType: 'pokemon_balloon' },
  { id: 'uk-wales', name: 'Wales', stateName: 'Wales', country: 'United Kingdom', region: 'Europe', lat: 52.1307, lng: -3.7837, craftType: 'airship' },
  { id: 'uk-northern-ireland', name: 'Northern Ireland', stateName: 'Northern Ireland', country: 'United Kingdom', region: 'Europe', lat: 54.7877, lng: -6.4923, craftType: 'pokemon_balloon' },
  { id: 'fr-ile-de-france', name: 'Île-de-France', stateName: 'Île-de-France', country: 'France', region: 'Europe', lat: 48.6998, lng: 2.5000, craftType: 'airship' },
  { id: 'fr-paca', name: 'Provence-Alpes-Côte d\'Azur', stateName: 'PACA', country: 'France', region: 'Europe', lat: 43.9352, lng: 6.0679, craftType: 'pokemon_balloon' },
  { id: 'fr-auvergne', name: 'Auvergne-Rhône-Alpes', stateName: 'Auvergne-Rhône-Alpes', country: 'France', region: 'Europe', lat: 45.4473, lng: 4.3859, craftType: 'airship' },
  { id: 'fr-nouvelle-aquitaine', name: 'Nouvelle-Aquitaine', stateName: 'Nouvelle-Aquitaine', country: 'France', region: 'Europe', lat: 45.4000, lng: 0.1500, craftType: 'pokemon_balloon' },
  { id: 'de-bavaria', name: 'Bavaria (Bayern)', stateName: 'Bavaria', country: 'Germany', region: 'Europe', lat: 48.7904, lng: 11.4979, craftType: 'airship' },
  { id: 'de-nrw', name: 'North Rhine-Westphalia', stateName: 'NRW', country: 'Germany', region: 'Europe', lat: 51.4332, lng: 7.6616, craftType: 'pokemon_balloon' },
  { id: 'de-baden-wuerttemberg', name: 'Baden-Württemberg', stateName: 'Baden-Württemberg', country: 'Germany', region: 'Europe', lat: 48.6616, lng: 9.3501, craftType: 'airship' },
  { id: 'de-hesse', name: 'Hesse (Hessen)', stateName: 'Hesse', country: 'Germany', region: 'Europe', lat: 50.6521, lng: 9.1624, craftType: 'pokemon_balloon' },
  { id: 'es-andalusia', name: 'Andalusia', stateName: 'Andalusia', country: 'Spain', region: 'Europe', lat: 37.5443, lng: -4.7278, craftType: 'airship' },
  { id: 'es-catalonia', name: 'Catalonia', stateName: 'Catalonia', country: 'Spain', region: 'Europe', lat: 41.8375, lng: 1.5398, craftType: 'pokemon_balloon' },
  { id: 'es-madrid', name: 'Community of Madrid', stateName: 'Madrid', country: 'Spain', region: 'Europe', lat: 40.4168, lng: -3.7038, craftType: 'airship' },
  { id: 'es-valencia', name: 'Valencian Community', stateName: 'Valencia', country: 'Spain', region: 'Europe', lat: 39.4840, lng: -0.7533, craftType: 'pokemon_balloon' },
  { id: 'it-lombardy', name: 'Lombardy', stateName: 'Lombardy', country: 'Italy', region: 'Europe', lat: 45.6983, lng: 9.6773, craftType: 'airship' },
  { id: 'it-lazio', name: 'Lazio', stateName: 'Lazio', country: 'Italy', region: 'Europe', lat: 41.8919, lng: 12.5113, craftType: 'pokemon_balloon' },
  { id: 'it-tuscany', name: 'Tuscany', stateName: 'Tuscany', country: 'Italy', region: 'Europe', lat: 43.7711, lng: 11.2486, craftType: 'airship' },
  { id: 'it-sicily', name: 'Sicily', stateName: 'Sicily', country: 'Italy', region: 'Europe', lat: 37.5999, lng: 14.0154, craftType: 'pokemon_balloon' },

  // --- Asia (Prefectures, States & Provinces: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'jp-kanto', name: 'Kanto Region (Tokyo)', stateName: 'Kanto', country: 'Japan', region: 'Asia', lat: 36.0000, lng: 139.5000, craftType: 'airship' },
  { id: 'jp-kansai', name: 'Kansai Region (Osaka)', stateName: 'Kansai', country: 'Japan', region: 'Asia', lat: 35.0000, lng: 135.5000, craftType: 'pokemon_balloon' },
  { id: 'jp-hokkaido', name: 'Hokkaido', stateName: 'Hokkaido', country: 'Japan', region: 'Asia', lat: 43.2203, lng: 142.8635, craftType: 'airship' },
  { id: 'jp-kyushu', name: 'Kyushu', stateName: 'Kyushu', country: 'Japan', region: 'Asia', lat: 32.5900, lng: 130.8000, craftType: 'pokemon_balloon' },
  { id: 'cn-guangdong', name: 'Guangdong Province', stateName: 'Guangdong', country: 'China', region: 'Asia', lat: 23.3790, lng: 113.7633, craftType: 'airship' },
  { id: 'cn-zhejiang', name: 'Zhejiang Province', stateName: 'Zhejiang', country: 'China', region: 'Asia', lat: 29.1416, lng: 119.7889, craftType: 'pokemon_balloon' },
  { id: 'cn-sichuan', name: 'Sichuan Province', stateName: 'Sichuan', country: 'China', region: 'Asia', lat: 30.6517, lng: 104.0759, craftType: 'airship' },
  { id: 'cn-jiangsu', name: 'Jiangsu Province', stateName: 'Jiangsu', country: 'China', region: 'Asia', lat: 32.9711, lng: 119.4550, craftType: 'pokemon_balloon' },
  { id: 'in-maharashtra', name: 'Maharashtra', stateName: 'Maharashtra', country: 'India', region: 'Asia', lat: 19.7515, lng: 75.7139, craftType: 'airship' },
  { id: 'in-karnataka', name: 'Karnataka', stateName: 'Karnataka', country: 'India', region: 'Asia', lat: 15.3173, lng: 75.7139, craftType: 'pokemon_balloon' },
  { id: 'in-tamil-nadu', name: 'Tamil Nadu', stateName: 'Tamil Nadu', country: 'India', region: 'Asia', lat: 11.1271, lng: 78.6569, craftType: 'airship' },
  { id: 'in-uttar-pradesh', name: 'Uttar Pradesh', stateName: 'Uttar Pradesh', country: 'India', region: 'Asia', lat: 26.8467, lng: 80.9462, craftType: 'pokemon_balloon' },
  { id: 'kr-gyeonggi', name: 'Gyeonggi-do', stateName: 'Gyeonggi', country: 'South Korea', region: 'Asia', lat: 37.4138, lng: 127.5183, craftType: 'airship' },
  { id: 'kr-seoul-capital', name: 'Seoul Capital Area', stateName: 'Seoul', country: 'South Korea', region: 'Asia', lat: 37.5665, lng: 126.9780, craftType: 'pokemon_balloon' },

  // --- Australia & Oceania (States & Territories: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'au-nsw', name: 'New South Wales', stateName: 'New South Wales', country: 'Australia', region: 'Oceania', lat: -32.1633, lng: 147.0167, craftType: 'airship' },
  { id: 'au-victoria', name: 'Victoria', stateName: 'Victoria', country: 'Australia', region: 'Oceania', lat: -36.8642, lng: 144.3107, craftType: 'pokemon_balloon' },
  { id: 'au-queensland', name: 'Queensland', stateName: 'Queensland', country: 'Australia', region: 'Oceania', lat: -20.9176, lng: 142.7028, craftType: 'airship' },
  { id: 'au-western-australia', name: 'Western Australia', stateName: 'Western Australia', country: 'Australia', region: 'Oceania', lat: -25.0423, lng: 122.2222, craftType: 'pokemon_balloon' },
  { id: 'au-south-australia', name: 'South Australia', stateName: 'South Australia', country: 'Australia', region: 'Oceania', lat: -30.0002, lng: 136.2092, craftType: 'airship' },
  { id: 'au-tasmania', name: 'Tasmania', stateName: 'Tasmania', country: 'Australia', region: 'Oceania', lat: -42.0409, lng: 146.8087, craftType: 'pokemon_balloon' },
  { id: 'nz-canterbury', name: 'Canterbury Region', stateName: 'Canterbury', country: 'New Zealand', region: 'Oceania', lat: -43.5321, lng: 172.6362, craftType: 'airship' },
  { id: 'nz-auckland-region', name: 'Auckland Region', stateName: 'Auckland', country: 'New Zealand', region: 'Oceania', lat: -36.8485, lng: 174.7633, craftType: 'pokemon_balloon' },

  // --- Africa (Provinces & Regions: 50/50 Half Airship & Half Pokemon Air Balloon) ---
  { id: 'za-gauteng', name: 'Gauteng', stateName: 'Gauteng', country: 'South Africa', region: 'Africa', lat: -26.2708, lng: 28.1123, craftType: 'airship' },
  { id: 'za-western-cape', name: 'Western Cape', stateName: 'Western Cape', country: 'South Africa', region: 'Africa', lat: -33.2277, lng: 21.8569, craftType: 'pokemon_balloon' },
  { id: 'za-kwazulu-natal', name: 'KwaZulu-Natal', stateName: 'KwaZulu-Natal', country: 'South Africa', region: 'Africa', lat: -28.5306, lng: 30.8958, craftType: 'airship' },
  { id: 'eg-cairo-gov', name: 'Cairo Governorate', stateName: 'Cairo', country: 'Egypt', region: 'Africa', lat: 30.0444, lng: 31.2357, craftType: 'pokemon_balloon' },

  // --- Special Legend Creature Billboard: Dimensional Portal Dragon (Between North Pacific Ocean & USA) ---
  {
    id: 'pacific-dragon-portal',
    name: 'North Pacific Dimensional Dragon',
    stateName: 'North Pacific Flight Corridor',
    country: 'North Pacific Ocean (USA West Coast)',
    region: 'North America',
    lat: 34.8000,
    lng: -129.5000,
    craftType: 'portal_dragon',
  },
];

export const TIJUANA_AIRSHIP_COORDS = {
  name: 'Tijuana Skyport (Baja Frontier)',
  lat: 32.5149,
  lng: -117.0382,
};

/**
 * Returns airship location and status hovering stationarily above a specified city or Tijuana.
 */
export function getAirshipFlightStatus(cityId = 'us-california', timeMs = Date.now()): AirshipFlightStatus {
  const city = GLOBAL_AIRSHIP_CITIES.find((c) => c.id === cityId) || GLOBAL_AIRSHIP_CITIES[0];
  return {
    lat: city.lat,
    lng: city.lng,
    bearing: 45,
    currentSector: `${city.name} Air Zone (${city.country})`,
    nextSector: `Overhead Middle of ${city.name} (Stationary Hover)`,
    directionLabel: `Hovering Above Middle of ${city.name}`,
    progressPercent: 100,
    altitudeFt: 2850 + Math.round(Math.sin((timeMs / 1000) * 0.4) * 80),
  };
}

// ---------------- INDIVIDUAL BILLBOARD DATA & FIRESTORE SYNC ----------------

export interface AirshipBillboardData {
  billboardId?: string; // Unique ID of this individual billboard (e.g. 'us-california', 'us-new-york', 'radar-tijuana')
  billboardName?: string; // Friendly name of this billboard
  imageUrl: string;
  businessName?: string;
  businessLink?: string;
  tagline?: string;
  uploadedAt: number;
  expireTimestamp: number;
  durationDays: number; // Locked to 5 Days Promotion ($10.00)
  uploaderName?: string;
  uploaderUid?: string;
  paymentConfirmed?: boolean;
  paymentId?: string;
  amountCents?: number; // 1000 ($10.00 USD)
  currency?: string;
}

const LOCAL_STORAGE_PREFIX = 'squadup_billboard_';
const COLLECTION_NAME = 'airship_billboard';
const DEFAULT_DOC_ID = 'current';

export function getLocalBillboardData(billboardId: string = DEFAULT_DOC_ID): AirshipBillboardData | null {
  try {
    const raw =
      localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${billboardId}`) ||
      (billboardId === DEFAULT_DOC_ID ? localStorage.getItem('squadup_airship_billboard') : null);
    if (!raw) return null;
    const data: AirshipBillboardData = JSON.parse(raw);
    if (data.expireTimestamp && Date.now() < data.expireTimestamp) {
      return data;
    }
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${billboardId}`);
    return null;
  } catch {
    return null;
  }
}

export async function saveAirshipBillboard(
  data: AirshipBillboardData,
  billboardId: string = data.billboardId || DEFAULT_DOC_ID
): Promise<void> {
  const targetId = billboardId || DEFAULT_DOC_ID;
  const payload: AirshipBillboardData = {
    ...data,
    billboardId: targetId,
    amountCents: data.amountCents || 1000,
  };

  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${targetId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('LocalStorage billboard note:', err);
  }

  try {
    if (db) {
      const docRef = doc(db, COLLECTION_NAME, targetId);
      await setDoc(docRef, payload);
    }
  } catch (err) {
    console.warn('Firestore billboard write notice:', err);
  }
}

export async function clearAirshipBillboard(billboardId: string = DEFAULT_DOC_ID): Promise<void> {
  const targetId = billboardId || DEFAULT_DOC_ID;
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${targetId}`);
  } catch {}

  try {
    if (db) {
      const docRef = doc(db, COLLECTION_NAME, targetId);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.warn('Firestore billboard delete notice:', err);
  }
}

export function subscribeAirshipBillboard(
  onUpdate: (data: AirshipBillboardData | null) => void,
  billboardId: string = DEFAULT_DOC_ID
): () => void {
  const targetId = billboardId || DEFAULT_DOC_ID;
  // Initial local state
  onUpdate(getLocalBillboardData(targetId));

  try {
    if (!db) {
      return () => {};
    }

    const docRef = doc(db, COLLECTION_NAME, targetId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data() as AirshipBillboardData;
          if (cloudData.expireTimestamp && Date.now() < cloudData.expireTimestamp) {
            onUpdate(cloudData);
            try {
              localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${targetId}`, JSON.stringify(cloudData));
            } catch {}
          } else {
            onUpdate(null);
            clearAirshipBillboard(targetId);
          }
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Airship billboard subscription notice:', err);
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Deletes all expired billboards across the database so new users can promote.
 */
export async function cleanExpiredBillboards(): Promise<number> {
  if (!db) return 0;
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);
    const now = Date.now();
    let cleaned = 0;
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as AirshipBillboardData;
      if (data.expireTimestamp && now >= data.expireTimestamp) {
        await clearAirshipBillboard(docSnap.id);
        cleaned++;
      }
    }
    return cleaned;
  } catch (err) {
    console.warn('Clean expired billboards note:', err);
    return 0;
  }
}

/**
 * Subscribes to ALL individual billboards across the global map.
 * When a billboard's 5 days expires, it automatically deletes it from Firestore
 * and clears the board so new users can promote.
 */
export function subscribeAllBillboards(
  onUpdate: (billboardMap: Map<string, AirshipBillboardData>) => void
): () => void {
  try {
    if (!db) {
      return () => {};
    }

    let activeMap = new Map<string, AirshipBillboardData>();

    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const map = new Map<string, AirshipBillboardData>();
        const now = Date.now();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AirshipBillboardData;
          if (data.expireTimestamp && now < data.expireTimestamp) {
            map.set(docSnap.id, { ...data, billboardId: docSnap.id });
          } else {
            // EXPIRED: 5 days ended -> physically delete from Firestore so new users can promote!
            clearAirshipBillboard(docSnap.id);
          }
        });
        activeMap = map;
        onUpdate(map);
      },
      (err) => {
        console.warn('All billboards subscription notice:', err);
      }
    );

    // Live local interval ticker: checks every 15 seconds if any loaded billboard crossed the 5-day expiration
    const intervalTimer = setInterval(() => {
      const now = Date.now();
      let hasExpired = false;
      activeMap.forEach((data, id) => {
        if (data.expireTimestamp && now >= data.expireTimestamp) {
          hasExpired = true;
          // Delete from Firestore immediately!
          clearAirshipBillboard(id);
          activeMap.delete(id);
        }
      });
      if (hasExpired) {
        onUpdate(new Map(activeMap));
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(intervalTimer);
    };
  } catch {
    return () => {};
  }
}

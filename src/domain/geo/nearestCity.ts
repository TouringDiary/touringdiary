import { calculateDistance } from '@/services/geo';
import { GEO_CONFIG } from '@/constants/geoConfig';
import type { CitySummary } from '@/types/index';

function hasUsableCoords(coords: { lat?: number; lng?: number } | null | undefined): coords is {
    lat: number;
    lng: number;
} {
    if (!coords) return false;
    const { lat, lng } = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    // (0, 0) is the mapper placeholder for missing coordinates — not a real city.
    if (lat === 0 && lng === 0) return false;
    return true;
}

/**
 * Nearest published city to GPS coords within maxDistanceKm.
 * Returns null when GPS/cities are missing or nothing is close enough.
 */
export function findNearestCityId(
    userLocation: { lat: number; lng: number } | null | undefined,
    cities: Pick<CitySummary, 'id' | 'coords'>[],
    maxDistanceKm = GEO_CONFIG.SEARCH_RADIUS_MAX
): string | null {
    if (!userLocation || cities.length === 0) return null;
    if (!Number.isFinite(userLocation.lat) || !Number.isFinite(userLocation.lng)) return null;

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const city of cities) {
        if (!hasUsableCoords(city.coords)) continue;
        const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            city.coords.lat,
            city.coords.lng
        );
        if (Number.isFinite(dist) && dist < bestDist) {
            bestDist = dist;
            bestId = city.id;
        }
    }

    if (bestId == null || bestDist > maxDistanceKm) return null;
    return bestId;
}

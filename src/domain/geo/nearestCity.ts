import { calculateDistance } from '@/services/geo';
import type { CitySummary } from '@/types/index';

const DEFAULT_MAX_DISTANCE_KM = 80;

/**
 * Nearest published city to GPS coords within maxDistanceKm.
 * Returns null when GPS/cities are missing or nothing is close enough.
 */
export function findNearestCityId(
    userLocation: { lat: number; lng: number } | null | undefined,
    cities: Pick<CitySummary, 'id' | 'coords'>[],
    maxDistanceKm = DEFAULT_MAX_DISTANCE_KM
): string | null {
    if (!userLocation || cities.length === 0) return null;

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const city of cities) {
        const { lat, lng } = city.coords ?? {};
        if (!lat || !lng) continue;
        const dist = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        if (Number.isFinite(dist) && dist < bestDist) {
            bestDist = dist;
            bestId = city.id;
        }
    }

    if (bestId == null || bestDist > maxDistanceKm) return null;
    return bestId;
}

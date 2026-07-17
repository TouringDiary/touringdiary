import { supabase } from '../supabaseClient';
import type { SponsorRequest } from '../../types/models/Sponsor';
import { CRITICAL_RATING_THRESHOLD } from '../../utils/sponsorValidation';

/**
 * Media recensioni pubbliche approvate sul POI collegato allo sponsor (DL-030).
 * Shop/guide senza poi_id → null (nessun rating disponibile via reviews.poi_id).
 *
 * Aggregazione lato client: il set è limitato ai `poi_id` della pagina corrente
 * (tipicamente 10–50). AVG/GROUP BY o RPC dedicata non portano beneficio reale
 * a questi volumi; rivalutare se il filtro sotto-soglia diventerà server-side.
 */
export async function enrichSponsorsWithRatings(requests: SponsorRequest[]): Promise<SponsorRequest[]> {
    const poiIds = [...new Set(
        requests.map((r) => r.poiId).filter((id): id is string => typeof id === 'string' && id.length > 0)
    )];

    if (poiIds.length === 0) {
        return requests;
    }

    const { data, error } = await supabase
        .from('reviews')
        .select('poi_id, rating')
        .in('poi_id', poiIds)
        .eq('status', 'approved');

    if (error || !data) {
        console.error('[SponsorRatingService] Error fetching reviews:', error?.message);
        return requests;
    }

    const aggregates = new Map<string, { total: number; count: number }>();
    for (const row of data) {
        if (!row.poi_id) continue;
        const current = aggregates.get(row.poi_id) ?? { total: 0, count: 0 };
        current.total += Number(row.rating);
        current.count += 1;
        aggregates.set(row.poi_id, current);
    }

    return requests.map((request) => {
        if (!request.poiId) return request;
        const agg = aggregates.get(request.poiId);
        if (!agg || agg.count === 0) {
            return { ...request, rating: null };
        }
        const avg = Math.round((agg.total / agg.count) * 10) / 10;
        return { ...request, rating: avg };
    });
}

export function getSponsorRating(request: SponsorRequest): number | null {
    return request.rating ?? null;
}

export function isBelowRatingThreshold(
    rating: number | null | undefined,
    threshold: number = CRITICAL_RATING_THRESHOLD
): boolean {
    return rating != null && rating < threshold;
}

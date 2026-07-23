import { supabase } from '../supabaseClient';
import { Review } from '../../types/index';
import type { DbReview, Insert, Update } from '../../types/domain';
import type { Json } from '../../types/supabase';
import { invalidateCityCache, clearCacheKey } from '../city/cityCache';

export type ReviewCriteriaMap = Record<string, number>;

const MIN_STARS = 1;
const MAX_STARS = 5;

/** Stella intera di dominio (1–5). */
function isValidCriterionStar(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= MIN_STARS &&
        value <= MAX_STARS
    );
}

/** Media valida in dominio (1–5, anche con un decimale). */
function isValidAverageRating(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= MIN_STARS &&
        value <= MAX_STARS
    );
}

function collectValidCriteria(
    source: { readonly [key: string]: unknown }
): ReviewCriteriaMap | null {
    const out: ReviewCriteriaMap = {};
    for (const [key, raw] of Object.entries(source)) {
        if (!key || !isValidCriterionStar(raw)) continue;
        out[key] = raw;
    }
    return Object.keys(out).length > 0 ? out : null;
}

function sanitizeCriteriaMap(
    criteria: ReviewCriteriaMap | null | undefined
): ReviewCriteriaMap | null {
    if (!criteria) return null;
    return collectValidCriteria(criteria);
}

/** Media aritmetica dei criteri validi, arrotondata a 1 decimale. Senza criteri validi → 0 (nessuna media). */
export function computeReviewAverageRating(criteria: ReviewCriteriaMap): number {
    const values = Object.values(criteria).filter(isValidCriterionStar);
    if (values.length === 0) return 0;
    const raw = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(raw * 10) / 10;
}

export function parseReviewCriteria(value: Json | null | undefined): ReviewCriteriaMap | undefined {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return collectValidCriteria(value) ?? undefined;
}

function criteriaToJson(criteria: ReviewCriteriaMap | null): Json | null {
    if (!criteria) return null;
    const out: { [key: string]: Json | undefined } = {};
    for (const [key, value] of Object.entries(criteria)) {
        out[key] = value;
    }
    return out;
}

function mapReviewStatus(status: string): Review['status'] {
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
        return status;
    }
    return 'approved';
}

type ReviewRow = DbReview & { updated_at?: string | null };

function mapDbReview(db: ReviewRow): Review {
    return {
        id: db.id,
        author: db.author_name,
        authorId: db.author_id ?? undefined,
        rating: Number(db.rating),
        date: db.created_at ?? new Date(0).toISOString(),
        updatedAt: db.updated_at ?? undefined,
        approvedAt: db.approved_at ?? undefined,
        text: db.comment,
        status: mapReviewStatus(db.status),
        poiId: db.poi_id ?? undefined,
        poiName: db.poi_id ? 'POI' : 'Itinerario',
        itineraryId: db.itinerary_id ?? undefined,
        criteria: parseReviewCriteria(db.criteria),
    };
}

async function invalidateCachesForPoi(poiId: string | null | undefined): Promise<void> {
    if (!poiId) return;
    clearCacheKey('pois_multi_');
    try {
        const { data, error } = await supabase
            .from('pois')
            .select('city_id')
            .eq('id', poiId)
            .maybeSingle();
        if (error) {
            console.error('Errore lettura city_id per invalidazione cache POI:', error);
            return;
        }
        if (data?.city_id) {
            invalidateCityCache(data.city_id);
        }
    } catch (e) {
        console.error('Errore invalidazione cache POI:', e);
    }
}

export type SaveUnifiedReviewInput = {
    author: string;
    authorId?: string;
    rating: number;
    text: string;
    criteria?: ReviewCriteriaMap | null;
    poiId?: string | null;
    itineraryId?: string | null;
};

export type ReviewRatingAlert = {
    id: string;
    poiId: string;
    averageRating: number;
    threshold: number;
    reviewsCount: number;
    status: 'open' | 'acknowledged' | 'resolved';
    createdAt: string;
    updatedAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
};

function resolveContentRating(
    review: SaveUnifiedReviewInput
): { rating: number; criteria: ReviewCriteriaMap | null } {
    const criteria = sanitizeCriteriaMap(review.criteria ?? null);
    const rating = criteria
        ? computeReviewAverageRating(criteria)
        : review.rating;

    if (!isValidAverageRating(rating)) {
        throw new Error('Valutazione non valida.');
    }
    return { rating, criteria };
}

/** Conta segnalazioni rating aperte (badge Admin). */
export const getPendingReviewCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('review_rating_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        if (error) throw error;
        return count || 0;
    } catch {
        return 0;
    }
};

export const getOpenReviewRatingAlerts = async (): Promise<ReviewRatingAlert[]> => {
    const { data, error } = await supabase
        .from('review_rating_alerts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
        id: row.id,
        poiId: row.poi_id,
        averageRating: Number(row.average_rating),
        threshold: Number(row.threshold),
        reviewsCount: Number(row.reviews_count),
        status: row.status as ReviewRatingAlert['status'],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        acknowledgedAt: row.acknowledged_at ?? undefined,
        acknowledgedBy: row.acknowledged_by ?? undefined,
    }));
};

export const acknowledgeReviewRatingAlert = async (
    alertId: string,
    adminUserId: string
): Promise<void> => {
    const { error } = await supabase
        .from('review_rating_alerts')
        .update({
            status: 'acknowledged',
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: adminUserId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

    if (error) throw error;
};

export const getUnifiedReviews = async (): Promise<Review[]> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row) => mapDbReview(row as ReviewRow));
    } catch (e) {
        console.error('Errore caricamento recensioni unificate:', e);
        return [];
    }
};

export const getReviewsForPoi = async (poiId: string): Promise<Review[]> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('poi_id', poiId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => mapDbReview(row as ReviewRow));
};

export const getUserReviewForPoi = async (
    poiId: string,
    authorId: string
): Promise<Review | null> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('poi_id', poiId)
        .eq('author_id', authorId)
        .maybeSingle();

    if (error) throw error;
    return data ? mapDbReview(data as ReviewRow) : null;
};

export const getUserReviewForItinerary = async (
    itineraryId: string,
    authorId: string
): Promise<Review | null> => {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .eq('author_id', authorId)
        .maybeSingle();

    if (error) throw error;
    return data ? mapDbReview(data as ReviewRow) : null;
};

/**
 * Crea o aggiorna la recensione dell'utente sul target (POI o itinerario).
 * Una sola recensione per (author, target): se esiste → UPDATE, altrimenti INSERT.
 * Pubblicazione immediata (`status = approved`).
 */
export const saveUnifiedReview = async (review: SaveUnifiedReviewInput): Promise<Review> => {
    if (!review.authorId) {
        throw new Error('Devi accedere per pubblicare una recensione.');
    }
    if (!review.poiId && !review.itineraryId) {
        throw new Error('Target recensione mancante.');
    }
    if (review.poiId && review.itineraryId) {
        throw new Error('Una recensione può riferirsi a un solo target.');
    }

    const { rating, criteria } = resolveContentRating(review);
    const now = new Date().toISOString();

    let existingId: string | null = null;
    if (review.poiId) {
        const existing = await getUserReviewForPoi(review.poiId, review.authorId);
        existingId = existing?.id ?? null;
    } else if (review.itineraryId) {
        const existing = await getUserReviewForItinerary(review.itineraryId, review.authorId);
        existingId = existing?.id ?? null;
    }

    if (existingId) {
        const updatePayload: Update<'reviews'> = {
            author_name: review.author,
            rating,
            comment: review.text,
            criteria: criteriaToJson(criteria),
            status: 'approved',
            approved_at: now,
            updated_at: now,
        };

        const { data, error } = await supabase
            .from('reviews')
            .update(updatePayload)
            .eq('id', existingId)
            .eq('author_id', review.authorId)
            .select('*')
            .single();

        if (error) {
            console.error('Errore aggiornamento recensione cloud:', error);
            throw error;
        }

        await invalidateCachesForPoi(review.poiId);
        return mapDbReview(data as ReviewRow);
    }

    const insertPayload: Insert<'reviews'> = {
        author_name: review.author,
        author_id: review.authorId,
        rating,
        comment: review.text,
        status: 'approved',
        approved_at: now,
        poi_id: review.poiId || null,
        itinerary_id: review.itineraryId || null,
        criteria: criteriaToJson(criteria),
        updated_at: null,
    };

    const { data, error } = await supabase.from('reviews').insert(insertPayload).select('*').single();
    if (error) {
        console.error('Errore salvataggio recensione cloud:', error);
        throw error;
    }

    await invalidateCachesForPoi(review.poiId);
    return mapDbReview(data as ReviewRow);
};

export const updateUnifiedReviewStatus = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
    try {
        const now = status === 'approved' ? new Date().toISOString() : null;
        const { error } = await supabase
            .from('reviews')
            .update({ status, approved_at: now })
            .eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error('Errore status recensione:', e);
        throw e;
    }
};

export const deleteOwnReview = async (id: string, authorId: string): Promise<void> => {
    const { data, error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('author_id', authorId)
        .select('poi_id')
        .maybeSingle();

    if (error) {
        console.error('Errore eliminazione recensione autore:', error);
        throw error;
    }

    await invalidateCachesForPoi(data?.poi_id);
};

/** Eliminazione recensione da parte di admin (RLS: admin_all / admin_limited). */
export const deleteReviewAsAdmin = async (id: string): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id)
            .select('poi_id')
            .maybeSingle();
        if (error) throw error;
        await invalidateCachesForPoi(data?.poi_id);
    } catch (e) {
        console.error('Errore eliminazione recensione admin:', e);
        throw e;
    }
};

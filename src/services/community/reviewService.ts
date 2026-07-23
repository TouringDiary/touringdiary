import { supabase } from '../supabaseClient';
import { Review } from '../../types/index';
import type { DbReview, Insert } from '../../types/domain';
import type { Json } from '../../types/supabase';

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
    return 'pending';
}

function mapDbReview(db: DbReview): Review {
    return {
        id: db.id,
        author: db.author_name,
        authorId: db.author_id ?? undefined,
        rating: Number(db.rating),
        date: db.created_at ?? new Date(0).toISOString(),
        approvedAt: db.approved_at ?? undefined,
        text: db.comment,
        status: mapReviewStatus(db.status),
        poiId: db.poi_id ?? undefined,
        poiName: db.poi_id ? 'POI' : 'Itinerario',
        itineraryId: db.itinerary_id ?? undefined,
        criteria: parseReviewCriteria(db.criteria),
    };
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

export const getPendingReviewCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        if (error) throw error;
        return count || 0;
    } catch {
        return 0;
    }
};

export const getUnifiedReviews = async (): Promise<Review[]> => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row) => mapDbReview(row as DbReview));
    } catch {
        return [];
    }
};

export const saveUnifiedReview = async (review: SaveUnifiedReviewInput): Promise<void> => {
    const criteria = sanitizeCriteriaMap(review.criteria ?? null);
    // Con criteri: la media deriva dai criteri (impedisce rating incongruente).
    // Senza criteri: si accetta solo un rating di dominio 1–5.
    const rating = criteria
        ? computeReviewAverageRating(criteria)
        : review.rating;

    if (!isValidAverageRating(rating)) {
        throw new Error('Valutazione non valida.');
    }

    const payload: Insert<'reviews'> = {
        author_name: review.author,
        author_id: review.authorId ?? null,
        rating,
        comment: review.text,
        status: 'pending',
        poi_id: review.poiId || null,
        itinerary_id: review.itineraryId || null,
        criteria: criteriaToJson(criteria),
    };

    const { error } = await supabase.from('reviews').insert(payload);
    if (error) {
        console.error('Errore salvataggio recensione cloud:', error);
        throw error;
    }
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

export const deleteItineraryReview = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error('Errore eliminazione recensione:', e);
        throw e;
    }
};

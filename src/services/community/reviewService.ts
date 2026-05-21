import { supabase } from '../supabaseClient';
import { Review } from '../../types/index';

export const getPendingReviewCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        if (error) throw error;
        return count || 0;
    } catch (e: any) {
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

        return (data || []).map(db => ({
            id: db.id,
            author: db.author_name,
            authorId: db.author_id,
            rating: Number(db.rating),
            date: db.created_at,
            approvedAt: db.approved_at,
            text: db.comment,
            status: db.status as any,
            poiId: db.poi_id,
            poiName: db.poi_id ? "POI" : "Itinerario",
            itineraryId: db.itinerary_id,
            criteria: db.criteria || undefined
        }));
    } catch (e: any) {
        return [];
    }
};

export const saveUnifiedReview = async (review: any) => {
    try {
        const payload = {
            author_name: review.author,
            author_id: review.authorId,
            rating: review.rating,
            comment: review.text,
            status: 'pending',
            poi_id: review.poiId || null,
            itinerary_id: review.itineraryId || null,
            criteria: review.criteria || null
        };

        const { error } = await supabase.from('reviews').insert(payload);
        if (error) throw error;
    } catch (e) {
        console.error("Errore salvataggio recensione cloud:", e);
        throw e;
    }
};

export const updateUnifiedReviewStatus = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
        const now = status === 'approved' ? new Date().toISOString() : null;
        await supabase.from('reviews').update({ status, approved_at: now }).eq('id', id);
    } catch (e) {
        console.error("Errore status recensione:", e);
        throw e;
    }
};

export const deleteItineraryReview = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Errore eliminazione recensione:", e);
        throw e;
    }
};

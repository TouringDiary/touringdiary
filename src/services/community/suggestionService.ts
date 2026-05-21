import { supabase } from '../supabaseClient';
import { SuggestionRequest } from '../../types/index';
import { UUID_REGEX } from '../../utils/uuid';

export const getPendingSuggestionCount = async (): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        if (error) throw error;
        return count || 0;
    } catch (e: any) {
        return 0;
    }
};

export const getAllSuggestionsAsync = async (): Promise<SuggestionRequest[]> => {
    try {
        const { data, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((s: any) => ({
            id: s.id, userId: s.user_id, userName: s.user_name, cityId: s.city_id, cityName: s.city_name,
            poiId: s.poi_id, type: s.type, status: s.status, date: s.created_at,
            details: s.details_json || {}, adminNotes: s.admin_notes
        }));
    } catch (e) {
        console.error("Errore fetch suggestions:", e);
        return [];
    }
};

export const getUserSuggestionsAsync = async (userId: string): Promise<SuggestionRequest[]> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    
    try {
        const { data, error } = await supabase.from('suggestions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((s: any) => ({
            id: s.id, userId: s.user_id, userName: s.user_name, cityId: s.city_id, cityName: s.city_name,
            poiId: s.poi_id, type: s.type, status: s.status, date: s.created_at,
            details: s.details_json || {}, adminNotes: s.admin_notes
        }));
    } catch (e) {
        console.error("Errore fetch user suggestions:", e);
        return [];
    }
};

export const addSuggestion = async (suggestion: any): Promise<void> => {
    try {
        const payload = { 
            user_id: suggestion.userId, 
            user_name: suggestion.userName, 
            city_id: suggestion.cityId, 
            city_name: suggestion.cityName, 
            poi_id: suggestion.poiId, 
            type: suggestion.type, 
            status: 'pending', 
            details_json: suggestion.details, 
            created_at: new Date().toISOString() 
        };
        await supabase.from('suggestions').insert(payload);
    } catch (e) { console.error("Errore invio segnalazione:", e); }
};

export const updateSuggestionStatus = async (id: string, status: string, adminNotes?: string, details?: any, rejectionMeta?: any) => {
    try {
        const payload: any = { status, admin_notes: adminNotes };
        if (details) payload.details_json = details;
        if (rejectionMeta) {
            payload.admin_notes = `${adminNotes || ''}\n[REJECTION] ${rejectionMeta.reason}: ${rejectionMeta.adminMessage}`.trim();
        }
        await supabase.from('suggestions').update(payload).eq('id', id);
    } catch (e) { console.error("Errore update status:", e); }
};

export const deleteSuggestion = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('suggestions').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Errore eliminazione segnalazione:", e);
        throw e;
    }
};

export const applySuggestion = async (id: string, data: any, months: number) => {
    await updateSuggestionStatus(id, 'approved', data.adminNotes, data);
    return { success: true };
};

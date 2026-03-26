import { supabase } from './supabaseClient';
import { PremadeItinerary, Itinerary, SuggestionRequest, Review, CommunityPost } from '../types/index';
import { User } from '../types/users';
import { DatabaseCommunityPost } from '../types/database';

// Helper Regex UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- ITINERARI PERSONALI (BOZZE CLOUD) ---

export const saveUserDraft = async (itinerary: Itinerary, user: User): Promise<boolean> => {
    // 1. Check preliminare
    if (!user || user.role === 'guest') {
        return false;
    }

    try {
        // 2. RECUPERO SESSIONE (STRATEGIA "OTTIMISTICA")
        let realUserId = user.id;

        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
            realUserId = sessionData.session.user.id;
        } else {
            // Tentativo refresh, ma non bloccante
            const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: null }));
            if (userData?.user) {
                realUserId = userData.user.id;
            }
        }

        if (!realUserId || !UUID_REGEX.test(realUserId)) {
             if(user.id && UUID_REGEX.test(user.id)) {
                 realUserId = user.id;
             } else {
                 throw new Error("ID Utente non valido per il salvataggio.");
             }
        }

        // Calcolo durata giorni
        const start = itinerary.startDate ? new Date(itinerary.startDate).getTime() : Date.now();
        const end = itinerary.endDate ? new Date(itinerary.endDate).getTime() : Date.now();
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Impacchettiamo items E date nel JSON
        const packedData = {
            items: itinerary.items,
            startDate: itinerary.startDate,
            endDate: itinerary.endDate
        };

        const payload = {
            id: itinerary.id, 
            user_id: realUserId, 
            title: itinerary.name || 'Viaggio Senza Nome',
            description: 'Bozza salvata',
            duration_days: duration > 0 ? duration : 1,
            type: 'personal',
            status: 'draft',
            items_json: packedData,
            main_city: itinerary.items[0]?.cityId || 'Campania',
            created_at: new Date(itinerary.createdAt).toISOString(),
            updated_at: new Date().toISOString()
        };

        // Upsert gestisce sia INSERT che UPDATE
        const { error } = await supabase
            .from('itineraries')
            .upsert(payload, { onConflict: 'id' });

        if (error) {
            if (error.message === 'TypeError: Failed to fetch' || error.message?.includes('fetch')) {
                console.warn("[Cloud] Community offline: Database non raggiungibile.");
            } else {
                console.error("[Cloud] DB Error:", error);
            }
            throw error;
        }
        
        return true;
    } catch (e: any) {
        console.error("[Cloud] Eccezione Salvataggio:", e);
        throw e;
    }
};

export const getUserDrafts = async (userId: string): Promise<Itinerary[]> => {
    if (!userId || userId === 'guest') return [];
    
    if (!UUID_REGEX.test(userId)) {
        return [];
    }
    
    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'personal') 
            .order('updated_at', { ascending: false });
            
        if (error) throw error;

        return (data || []).map((db: any) => {
            const rawJson = db.items_json;
            let items = [];
            let startDate = null;
            let endDate = null;

            if (Array.isArray(rawJson)) {
                items = rawJson;
                const today = new Date();
                startDate = today.toISOString().split('T')[0];
                const end = new Date(today);
                end.setDate(today.getDate() + (db.duration_days || 1) - 1);
                endDate = end.toISOString().split('T')[0];
            } else if (rawJson && typeof rawJson === 'object') {
                items = rawJson.items || [];
                const todayStr = new Date().toISOString().split('T')[0];
                startDate = rawJson.startDate || todayStr;
                endDate = rawJson.endDate || todayStr;
            }

            return {
                id: db.id,
                userId: db.user_id,
                name: db.title,
                startDate: startDate, 
                endDate: endDate,
                items: items, 
                createdAt: new Date(db.created_at).getTime(),
                dayStyles: {}, 
                roadbook: []
            };
        });
    } catch (e) {
        console.error("Errore recupero bozze cloud:", e);
        return [];
    }
};

// FIX CRITICO: Cancellazione robusta che evita check di sessione superflui
export const deleteUserDraft = async (itineraryId: string, explicitUserId?: string): Promise<boolean> => {
    try {
        // DEBUG: Check session explicitly to diagnose RLS issues
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const sessionUserId = session?.user?.id;
        
        if (sessionError) console.warn("[Delete] Session check error:", sessionError);
        
        let userId = explicitUserId || sessionUserId;

        if (!userId) {
            console.error("[Delete] Impossibile cancellare: ID Utente mancante.");
            throw new Error("Errore di autenticazione: Impossibile identificare l'utente.");
        }

        console.log(`[Delete] Cancellazione itinerario ${itineraryId}. Target User: ${userId}. Auth User: ${sessionUserId}`);

        if (sessionUserId && userId !== sessionUserId) {
            console.warn(`[Delete] ATTENZIONE: Mismatch tra utente richiesto (${userId}) e utente autenticato (${sessionUserId}). RLS potrebbe bloccare.`);
        }

        // Esegui la cancellazione diretta. 
        // Il DB ha una policy RLS (Row Level Security) che permetterà la cancellazione SOLO SE:
        // auth.uid() == user_id della riga.
        // Rimuoviamo .eq('user_id', userId) perché RLS lo fa già implicitamente e per evitare mismatch se i dati locali sono stale.
        
        const { error, count } = await supabase
            .from('itineraries')
            .delete({ count: 'exact' })
            .eq('id', itineraryId);
            // .eq('user_id', userId); // RIMOSSO: Lasciamo fare a RLS

        if (error) {
            console.error("[Delete] Errore DB:", error);
            throw error;
        }

        // Se count è 0, significa che non ha trovato nulla o la policy ha bloccato.
        if (count === 0) {
            console.warn(`[Delete] Nessuna riga cancellata. ID errato o RLS bloccante. (ItineraryID: ${itineraryId})`);
            
            // Se l'utente è quello giusto ma non cancella, potrebbe essere un problema di sync.
            // In questo caso specifico, se non c'è errore DB, potremmo considerare di ritornare true 
            // per permettere alla UI di aggiornarsi se il dato è "fantasma" o già cancellato.
            // Ma per sicurezza, ritorniamo false per ora.
            return false;
        }
        
        return true;
    } catch (e: any) {
        console.error("[Delete] Eccezione:", e);
        throw e;
    }
};

/** @deprecated Table live_snaps is retired. Use photoService instead. */
// export const getLiveSnapsAsync = ...
// export const addLiveSnapAsync = ...
// export const deleteLiveSnap = ...

/** @deprecated interaction logic for live_snaps is retired. */
// export const toggleLiveSnapLike = async (snapId: string, userId: string): Promise<{ liked: boolean, count: number }> => {
//     if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) {
//         return { liked: false, count: 0 };
//     }

//     try {
//         // check se esiste già
//         const { data: existing } = await supabase
//             .from('user_interactions')
//             .select('id')
//             .match({
//                 user_id: userId,
//                 target_id: snapId,
//                 target_type: 'live_snap',
//                 interaction_type: 'like'
//             })
//             .maybeSingle();

//         let liked = false;

//         if (existing) {
//             // unlike
//             await supabase
//                 .from('user_interactions')
//                 .delete()
//                 .match({
//                     user_id: userId,
//                     target_id: snapId,
//                     target_type: 'live_snap',
//                     interaction_type: 'like'
//                 });
//         } else {
//             // like
//             await supabase
//                 .from('user_interactions')
//                 .insert({
//                     user_id: userId,
//                     target_id: snapId,
//                     target_type: 'live_snap',
//                     interaction_type: 'like'
//                 });

//             liked = true;
//         }

//         // conteggio aggiornato
//         const { count } = await supabase
//             .from('user_interactions')
//             .select('*', { count: 'exact', head: true })
//             .match({
//                 target_id: snapId,
//                 target_type: 'live_snap',
//                 interaction_type: 'like'
//             });

//         return { liked, count: count || 0 };

//     } catch (e) {
//         console.error("Errore toggle like live snap:", e);
//         return { liked: false, count: 0 };
//     }
// };

// export const getUserLiveLikes = async (userId: string): Promise<string[]> => {
//     if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
//     try {
//         const { data } = await supabase
//             .from('user_interactions')
//             .select('target_id')
//             .match({
//                 user_id: userId,
//                 target_type: 'live_snap',
//                 interaction_type: 'like'
//   });
//         return (data || []).map((row: any) => row.target_id);
//     } catch (e) {
//         return [];
//     }
// };

export const getCommunityPostsAsync = async (): Promise<CommunityPost[]> => {
    try {
        const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data as DatabaseCommunityPost[]).map(p => ({ 
            id: p.id, 
            authorId: p.author_id, 
            authorName: p.author_name, 
            authorRole: p.author_role || undefined, 
            authorAvatar: p.author_avatar || undefined, 
            cityId: p.city_id, 
            cityName: p.city_name, // Fixed: mapped to cityName
            text: p.text, 
            likes: p.likes, 
            repliesCount: p.replies_count, 
            replies: p.replies as any, 
            timestamp: p.created_at 
        }));
    } catch (e) {
        console.error("Errore fetch community posts:", e);
        return [];
    }
};

export const addCommunityPostAsync = async (post: CommunityPost): Promise<CommunityPost | null> => {
    try {
        const payload = { 
            id: post.id, 
            author_id: post.authorId, 
            author_name: post.authorName, 
            author_role: post.authorRole, 
            author_avatar: post.authorAvatar, 
            city_id: post.cityId, 
            city_name: post.cityName, 
            text: post.text, 
            likes: 0, 
            replies_count: 0, 
            replies: [], 
            created_at: new Date().toISOString() 
        };
        const { data, error } = await supabase.from('community_posts').insert(payload).select().single();
        if (error) throw error;
        return { 
            id: data.id, 
            authorId: data.author_id, 
            authorName: data.author_name, 
            authorRole: data.author_role || undefined, 
            authorAvatar: data.author_avatar || undefined, 
            cityId: data.city_id, 
            cityName: data.city_name, 
            text: data.text, 
            likes: data.likes, 
            repliesCount: data.replies_count, 
            replies: data.replies as any, 
            timestamp: data.created_at 
        };
    } catch (e) {
        console.error("Errore post domanda:", e);
        return null;
    }
};

export const togglePostLike = async (postId: string, userId: string): Promise<{ liked: boolean, count: number }> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) {
        return { liked: false, count: 0 };
    }

    try {
        const { data: existing } = await supabase
            .from('user_interactions')
            .select('id')
            .match({
                user_id: userId,
                target_id: postId,
                target_type: 'community_post',
                interaction_type: 'like'
            })
            .maybeSingle();

        let liked = false;

        if (existing) {
            await supabase
                .from('user_interactions')
                .delete()
                .match({
                    user_id: userId,
                    target_id: postId,
                    target_type: 'community_post',
                    interaction_type: 'like'
                });
        } else {
            await supabase
                .from('user_interactions')
                .insert({
                    user_id: userId,
                    target_id: postId,
                    target_type: 'community_post',
                    interaction_type: 'like'
                });

            liked = true;
        }

        const { count } = await supabase
            .from('user_interactions')
            .select('*', { count: 'exact', head: true })
            .match({
                target_id: postId,
                target_type: 'community_post',
                interaction_type: 'like'
            });

        return { liked, count: count || 0 };

    } catch (e) {
        console.error("Errore toggle like community post:", e);
        return { liked: false, count: 0 };
    }
};

export const getUserPostLikes = async (userId: string): Promise<string[]> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    try {
        const { data } = await supabase
            .from('user_interactions')
            .select('target_id')
            .match({
                user_id: userId,
                target_type: 'community_post',
                interaction_type: 'like'
  });
        return (data || []).map((row: any) => row.target_id);
    } catch (e) {
        return [];
    }
};

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

export const getCommunityItinerariesAsync = async (): Promise<PremadeItinerary[]> => {
    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .neq('type', 'personal'); 
        
        if (error) throw error;
        return (data || []).map((db: any) => ({
            id: db.id, title: db.title, description: db.description, durationDays: db.duration_days,
            coverImage: db.cover_image, tags: db.tags || [], difficulty: db.difficulty,
            type: db.type, status: db.status, author: db.author_name, date: db.created_at,
            rating: db.rating || 0, votes: db.votes || 0, continent: db.continent || 'Europa',
            nation: db.nation || 'Italia', region: db.region || 'Campania', zone: db.zone,
            mainCity: db.main_city, items: db.items_json || [] 
        }));
    } catch (e) {
        console.error("Errore fetch itinerari:", e);
        return [];
    }
};

export const getAllPremadeItinerariesAsync = getCommunityItinerariesAsync;

export interface ItineraryFilters {
    type?: 'official' | 'community' | 'ai';
    continent?: string;
    nation?: string;
    region?: string;
    zone?: string;
    mainCity?: string;
    searchQuery?: string;
    tag?: string;
    status?: string;
    limit?: number;
}

export const getCommunityItinerariesMetadataAsync = async (): Promise<Partial<PremadeItinerary>[]> => {
    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('id, continent, nation, region, zone, main_city, tags')
            .neq('type', 'personal')
            .eq('status', 'published'); 
        
        if (error) throw error;
        return (data || []).map((db: any) => ({
            id: db.id, 
            continent: db.continent || 'Europa',
            nation: db.nation || 'Italia', 
            region: db.region || 'Campania', 
            zone: db.zone,
            mainCity: db.main_city, 
            tags: db.tags || []
        }));
    } catch (e) {
        console.error("Errore fetch metadata itinerari:", e);
        return [];
    }
};

export const getFilteredCommunityItinerariesAsync = async (filters: ItineraryFilters): Promise<PremadeItinerary[]> => {
    try {
        let query = supabase.from('itineraries').select('*').neq('type', 'personal');

        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.type) {
            query = query.eq('type', filters.type);
        }
        if (filters.continent) {
            query = query.eq('continent', filters.continent);
        }
        if (filters.nation) {
            query = query.eq('nation', filters.nation);
        }
        if (filters.region) {
            query = query.eq('region', filters.region);
        }
        if (filters.zone) {
            query = query.eq('zone', filters.zone);
        }
        if (filters.mainCity) {
            query = query.eq('main_city', filters.mainCity);
        }
        if (filters.searchQuery) {
            // Use ilike for case-insensitive search on title
            query = query.ilike('title', `%${filters.searchQuery}%`);
        }
        if (filters.tag && filters.tag !== 'Tutti') {
            // Supabase array contains operator
            query = query.contains('tags', [filters.tag]);
        }
        
        // Order by votes descending
        query = query.order('votes', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        return (data || []).map((db: any) => ({
            id: db.id, title: db.title, description: db.description, durationDays: db.duration_days,
            coverImage: db.cover_image, tags: db.tags || [], difficulty: db.difficulty,
            type: db.type, status: db.status, author: db.author_name, date: db.created_at,
            rating: db.rating || 0, votes: db.votes || 0, continent: db.continent || 'Europa',
            nation: db.nation || 'Italia', region: db.region || 'Campania', zone: db.zone,
            mainCity: db.main_city, items: db.items_json || [] 
        }));
    } catch (e) {
        console.error("Errore fetch itinerari filtrati:", e);
        return [];
    }
};

export const savePremadeItinerary = async (itinerary: PremadeItinerary): Promise<boolean> => {
    try {
        const payload = {
            id: itinerary.id, title: itinerary.title, description: itinerary.description,
            duration_days: itinerary.durationDays, cover_image: itinerary.coverImage,
            tags: itinerary.tags, difficulty: itinerary.difficulty, type: itinerary.type,
            status: itinerary.status, author_name: itinerary.author || 'Redazione',
            rating: itinerary.rating, votes: itinerary.votes, continent: itinerary.continent,
            nation: itinerary.nation, region: itinerary.region, zone: itinerary.zone,
            main_city: itinerary.mainCity, items_json: itinerary.items, 
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('itineraries').upsert(payload);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error saving premade itinerary", e);
        return false;
    }
};

export const deletePremadeItinerary = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('itineraries')
            .delete() 
            .eq('id', id);

        if (error) throw error;
    } catch (e) {
        console.error("Errore eliminazione itinerario cloud:", e);
        throw e;
    }
};

export const getUserItineraryLikes = async (userId: string): Promise<string[]> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) return [];
    try {
        const { data } = await supabase
            .from('user_interactions')
            .select('target_id')
            .match({
                user_id: userId,
                target_type: 'itinerary',
                interaction_type: 'like'
  });   
        return (data || []).map((row: any) => row.target_id);
    } catch (e) {
        return [];
    }
};

export const toggleItineraryLike = async (itineraryId: string, userId: string): Promise<{ liked: boolean, count: number }> => {
    if (!userId || userId === 'guest' || !UUID_REGEX.test(userId)) {
        return { liked: false, count: 0 };
    }

    try {
        const { data: existing } = await supabase
            .from('user_interactions')
            .select('id')
            .match({
                user_id: userId,
                target_id: itineraryId,
                target_type: 'itinerary',
                interaction_type: 'like'
            })
            .maybeSingle();

        let liked = false;

        if (existing) {
            await supabase
                .from('user_interactions')
                .delete()
                .match({
                    user_id: userId,
                    target_id: itineraryId,
                    target_type: 'itinerary',
                    interaction_type: 'like'
                });
        } else {
            await supabase
                .from('user_interactions')
                .insert({
                    user_id: userId,
                    target_id: itineraryId,
                    target_type: 'itinerary',
                    interaction_type: 'like'
                });

            liked = true;
        }

        const { count } = await supabase
            .from('user_interactions')
            .select('*', { count: 'exact', head: true })
            .match({
                target_id: itineraryId,
                target_type: 'itinerary',
                interaction_type: 'like'
            });

        return { liked, count: count || 0 };

    } catch (e) {
        console.error("Errore like itinerario:", e);
        return { liked: false, count: 0 };
    }
};

export const publishUserItinerary = async (itinerary: Itinerary, user: User) => {
    await saveUserDraft(itinerary, user);

    const publicId = `pub_${Date.now()}`;
    const payload = {
        id: publicId,
        user_id: user.id,
        title: itinerary.name,
        description: `Itinerario creato da ${user.name}`,
        duration_days: Math.ceil((new Date(itinerary.endDate || '').getTime() - new Date(itinerary.startDate || '').getTime()) / (1000 * 60 * 60 * 24)) + 1 || 1,
        cover_image: itinerary.items[0]?.poi?.imageUrl || '',
        tags: ['Community'],
        difficulty: 'Moderato',
        type: 'community',
        status: 'published',
        author_name: user.name,
        rating: 0, votes: 0,
        continent: 'Europa', nation: 'Italia', region: 'Campania', zone: 'Campania',
        main_city: itinerary.items[0]?.cityId || 'Campania',
        items_json: itinerary.items,
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('itineraries').insert(payload);
        if (error) throw error;
        return { success: true, updatedUser: user };
    } catch (e) {
        console.error("Errore pubblicazione", e);
        return { success: false };
    }
};

export const getBusinessStats = (userId: string) => {
    return {
        views: 0,
        favorites: 0,
        interactions: 0
    };
};
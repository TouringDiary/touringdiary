import { supabase } from '../supabaseClient';
import { PremadeItinerary, Itinerary, ItineraryItem } from '../../types/index';
import { isDiaryNotesDocument } from '../../types/models/DiaryNotes';
import { User } from '../../types/users';
import { UUID_REGEX } from '../../utils/uuid';
import type { Json } from '../../types/supabase';

/**
 * Confine di serializzazione verso il DB.
 *
 * Le entità di dominio (es. ItineraryItem → PointOfInterest) non sono strutturalmente
 * assegnabili al tipo `Json` generato da Supabase, pur essendo perfettamente serializzabili.
 * Normalizziamo qui il valore in una struttura JSON pura (stesso payload che Supabase
 * invierebbe comunque), ottenendo un valore type-safe per le colonne `Json`.
 */
const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? null));

type PackedDiaryFields = Pick<
  Itinerary,
  'items' | 'startDate' | 'endDate' | 'dayStyles' | 'diaryNotes' | 'roadbook'
>;

function buildPackedDiaryData(itinerary: Itinerary): PackedDiaryFields {
  return {
    items: itinerary.items,
    startDate: itinerary.startDate,
    endDate: itinerary.endDate,
    dayStyles: itinerary.dayStyles || {},
    diaryNotes: itinerary.diaryNotes ?? null,
    roadbook: itinerary.roadbook ?? [],
  };
}

function unpackDiaryData(rawJson: unknown, durationDays: number): PackedDiaryFields {
  let items: ItineraryItem[] = [];
  let startDate: string | null = null;
  let endDate: string | null = null;
  let dayStyles: Record<number, string> = {};
  let diaryNotes: Itinerary['diaryNotes'] = null;
  let roadbook: Itinerary['roadbook'] = [];

  if (Array.isArray(rawJson)) {
    items = rawJson;
    const today = new Date();
    startDate = today.toISOString().split('T')[0];
    const end = new Date(today);
    end.setDate(today.getDate() + (durationDays || 1) - 1);
    endDate = end.toISOString().split('T')[0];
  } else if (rawJson && typeof rawJson === 'object') {
    const data = rawJson as Record<string, unknown>;
    if (Array.isArray(data.items)) {
      items = data.items;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    startDate = typeof data.startDate === 'string' ? data.startDate : todayStr;
    endDate = typeof data.endDate === 'string' ? data.endDate : todayStr;
    const rawDayStyles = data.dayStyles;
    if (rawDayStyles !== null && typeof rawDayStyles === 'object' && !Array.isArray(rawDayStyles)) {
      dayStyles = rawDayStyles as Record<number, string>;
    }
    if (isDiaryNotesDocument(data.diaryNotes)) {
      diaryNotes = data.diaryNotes;
    }
    if (Array.isArray(data.roadbook)) {
      roadbook = data.roadbook;
    }
  }

  return { items, startDate, endDate, dayStyles, diaryNotes, roadbook };
}

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

        const packedData = buildPackedDiaryData(itinerary);

        const payload = {
            id: itinerary.id, 
            user_id: realUserId, 
            title: itinerary.name || 'Viaggio Senza Nome',
            description: 'Bozza salvata',
            duration_days: duration > 0 ? duration : 1,
            type: 'personal',
            status: 'draft',
            items_json: toDbJson(packedData),
            main_city: itinerary.items[0]?.cityId || 'Campania',
            suitcase_id: itinerary.suitcase_id || null,
            created_at: new Date(itinerary.createdAt).toISOString(),
            updated_at: new Date().toISOString()
        };

        // Upsert gestisce sia INSERT che UPDATE.
        // Richiediamo SEMPRE la rappresentazione scritta (`.select()`): se la RLS blocca la
        // scrittura (es. sessione/JWT non allineati, account senza sessione attiva), PostgREST
        // non restituisce un errore ma filtra la riga → `data` resta vuoto. Senza questa verifica
        // il salvataggio fallirebbe in silenzio e la UI mostrerebbe un falso "Salvato".
        const { data, error } = await supabase
            .from('itineraries')
            .upsert(payload, { onConflict: 'id' })
            .select('id');

        if (error) {
            if (error.message === 'TypeError: Failed to fetch' || error.message?.includes('fetch')) {
                console.warn("[Cloud] Community offline: Database non raggiungibile.");
            } else {
                console.error("[Cloud] DB Error:", error);
            }
            throw error;
        }

        if (!data || data.length === 0) {
            // Nessuna riga persistita pur senza errore: la RLS ha bloccato la scrittura.
            console.error("[Cloud] Salvataggio bloccato dalla RLS: nessuna riga scritta.");
            throw new Error("Salvataggio non riuscito: sessione non valida o permessi insufficienti.");
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
            const { items, startDate, endDate, dayStyles, diaryNotes, roadbook } = unpackDiaryData(
                db.items_json,
                db.duration_days
            );

            return {
                id: db.id,
                userId: db.user_id,
                name: db.title,
                startDate: startDate, 
                endDate: endDate,
                items: items, 
                createdAt: new Date(db.created_at).getTime(),
                updatedAt: db.updated_at ? new Date(db.updated_at).getTime() : undefined,
                dayStyles: dayStyles,
                diaryNotes,
                roadbook,
                suitcase_id: db.suitcase_id || null
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
        
        const { error, count } = await supabase
            .from('itineraries')
            .delete({ count: 'exact' })
            .eq('id', itineraryId);

        if (error) {
            console.error("[Delete] Errore DB:", error);
            throw error;
        }

        // Se count è 0, significa che non ha trovato nulla o la policy ha bloccato.
        if (count === 0) {
            console.warn(`[Delete] Nessuna riga cancellata. ID errato o RLS bloccante. (ItineraryID: ${itineraryId})`);
            return false;
        }
        
        return true;
    } catch (e: any) {
        console.error("[Delete] Eccezione:", e);
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
            query = query.ilike('title', `%${filters.searchQuery}%`);
        }
        if (filters.tag && filters.tag !== 'Tutti') {
            query = query.contains('tags', [filters.tag]);
        }
        
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

    const payload = {
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
        items_json: toDbJson(itinerary.items),
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

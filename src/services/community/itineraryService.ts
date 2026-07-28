import { resolveAuthenticatedUserId } from '../auth/authIdentity';
import { supabase } from '../supabaseClient';
import { PremadeItinerary, Itinerary, ItineraryItem } from '../../types/index';
import { normalizeDiaryNotesState } from '../../domain/diary/diaryNotesState';
import { User } from '../../types/users';
import { UUID_REGEX } from '../../utils/uuid';
import type { Json } from '../../types/supabase';
import type { DbItinerary, Row } from '../../types/domain';
import { canUserModifyResource } from '../collaboration/permissionService';
import { fetchCollaborativeDiaryIdsForMember } from '../collaboration/diaryCollaborationService';
import {
    createViaggio,
    ensureViaggioForPersonalDiary,
    setActiveDiary,
    updateViaggio,
} from '../viaggio/viaggioService';
import type { SaveUserDraftViaggioOptions } from '../../types/resourceAssociation';

/**
 * Confine di serializzazione verso il DB.
 *
 * Le entità di dominio (es. ItineraryItem → PointOfInterest) non sono strutturalmente
 * assegnabili al tipo `Json` generato da Supabase, pur essendo perfettamente serializzabili.
 * Normalizziamo qui il valore in una struttura JSON pura (stesso payload che Supabase
 * invierebbe comunque), ottenendo un valore type-safe per le colonne `Json`.
 */
const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? null));

type CommunityItineraryMetadataRow = Pick<
  DbItinerary,
  'id' | 'continent' | 'nation' | 'region' | 'zone' | 'main_city' | 'tags'
>;

type ItineraryLikeTargetRow = Pick<Row<'user_interactions'>, 'target_id'>;

// Normalizzano le colonne testuali libere del DB (`string | null`) verso le union
// letterali del dominio, con fallback sicuro se il valore non è tra quelli attesi.
const ITINERARY_DIFFICULTIES: readonly PremadeItinerary['difficulty'][] = ['Relax', 'Moderato', 'Intenso'];
const ITINERARY_TYPES: readonly PremadeItinerary['type'][] = ['official', 'community', 'ai'];
const ITINERARY_STATUSES: readonly PremadeItinerary['status'][] = ['published', 'draft'];

function toDifficulty(value: string | null): PremadeItinerary['difficulty'] {
  return ITINERARY_DIFFICULTIES.includes(value as PremadeItinerary['difficulty'])
    ? (value as PremadeItinerary['difficulty'])
    : 'Moderato';
}

function toItineraryType(value: string | null): PremadeItinerary['type'] {
  return ITINERARY_TYPES.includes(value as PremadeItinerary['type'])
    ? (value as PremadeItinerary['type'])
    : 'community';
}

function toStatus(value: string | null): PremadeItinerary['status'] {
  return ITINERARY_STATUSES.includes(value as PremadeItinerary['status'])
    ? (value as PremadeItinerary['status'])
    : 'draft';
}

type PremadeItineraryItem = PremadeItinerary['items'][number];

function isPremadeItineraryItem(value: Json): value is PremadeItineraryItem {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const item = value;
  return (
    typeof item.dayIndex === 'number' &&
    typeof item.timeSlotStr === 'string' &&
    typeof item.poiId === 'string' &&
    typeof item.cityId === 'string' &&
    (item.fallbackName === undefined || typeof item.fallbackName === 'string') &&
    (item.note === undefined || typeof item.note === 'string')
  );
}

/** Converte `items_json` (colonna `Json` Supabase) nel tipo dominio, senza cast. */
function toPremadeItems(itemsJson: Json | null): PremadeItinerary['items'] {
  if (itemsJson === null) return [];
  if (!Array.isArray(itemsJson)) return [];
  return itemsJson.filter(isPremadeItineraryItem);
}

function mapDbItineraryToPremade(db: DbItinerary): PremadeItinerary {
  return {
    id: db.id,
    title: db.title ?? '',
    description: db.description ?? '',
    durationDays: db.duration_days ?? 0,
    coverImage: db.cover_image ?? '',
    tags: db.tags ?? [],
    difficulty: toDifficulty(db.difficulty),
    type: toItineraryType(db.type),
    status: toStatus(db.status),
    author: db.author_name ?? undefined,
    date: db.created_at ?? undefined,
    rating: db.rating ?? 0,
    votes: db.votes ?? 0,
    continent: db.continent ?? 'Europa',
    nation: db.nation ?? 'Italia',
    region: db.region ?? 'Campania',
    zone: db.zone ?? '',
    mainCity: db.main_city ?? '',
    items: toPremadeItems(db.items_json),
  };
}

function mapCommunityMetadataRow(db: CommunityItineraryMetadataRow): Partial<PremadeItinerary> {
  return {
    id: db.id,
    continent: db.continent ?? 'Europa',
    nation: db.nation ?? 'Italia',
    region: db.region ?? 'Campania',
    zone: db.zone ?? '',
    mainCity: db.main_city ?? '',
    tags: db.tags ?? [],
  };
}

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
    // Scrittura canonica: garantisce sempre uno DiaryNotesState valido nel DB,
    // anche se l'istanza in memoria è parziale o ancora in formato legacy.
    diaryNotes:
      itinerary.diaryNotes != null
        ? normalizeDiaryNotesState(itinerary.diaryNotes)
        : null,
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
    if (data.diaryNotes != null) {
      // Normalizzazione in lettura: gestisce automaticamente formato legacy
      // (DiaryNotesDocument), nuovo DiaryNotesState (qualsiasi versione con forma valida)
      // e valori null/mancenti — produce uno stato canonico in memoria.
      diaryNotes = normalizeDiaryNotesState(data.diaryNotes);
    }
    if (Array.isArray(data.roadbook)) {
      roadbook = data.roadbook;
    }
  }

  return { items, startDate, endDate, dayStyles, diaryNotes, roadbook };
}

function mapDbRowToItinerary(db: {
  id: string;
  user_id: string | null;
  title: string | null;
  duration_days: number | null;
  items_json: unknown;
  created_at: string | null;
  updated_at: string | null;
  suitcase_id: string | null;
  last_modified_by?: string | null;
  viaggio_id?: string | null;
}): Itinerary {
  const { items, startDate, endDate, dayStyles, diaryNotes, roadbook } = unpackDiaryData(
    db.items_json,
    db.duration_days ?? 1
  );

  return {
    id: db.id,
    userId: db.user_id ?? undefined,
    viaggioId: db.viaggio_id ?? null,
    name: db.title ?? '',
    startDate,
    endDate,
    items,
    createdAt: db.created_at ? new Date(db.created_at).getTime() : Date.now(),
    updatedAt: db.updated_at ? new Date(db.updated_at).getTime() : undefined,
    lastModifiedBy: db.last_modified_by ?? undefined,
    dayStyles,
    diaryNotes,
    roadbook,
    suitcase_id: db.suitcase_id ?? null,
  };
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

/** Decide viaggio di destinazione per saveUserDraft (opzioni Salva con nome o ensure legacy). */
async function resolveSaveUserDraftViaggio(params: {
  realUserId: string;
  itinerary: Itinerary;
  existingRowViaggioId: string | null | undefined;
  viaggioOptions?: SaveUserDraftViaggioOptions;
}): Promise<{ viaggioId: string | null; viaggioCreated: boolean }> {
  const { realUserId, itinerary, existingRowViaggioId, viaggioOptions } = params;
  const viaggioTitle = itinerary.name || 'Viaggio';

  if (viaggioOptions?.viaggioChoice === 'none') {
    return { viaggioId: null, viaggioCreated: false };
  }

  if (viaggioOptions?.viaggioChoice === 'new') {
    const createdViaggio = await createViaggio({
      userId: realUserId,
      title: viaggioTitle,
      periodStart: itinerary.startDate ?? null,
      periodEnd: itinerary.endDate ?? null,
    });
    return { viaggioId: createdViaggio.id, viaggioCreated: true };
  }

  if (
    viaggioOptions?.viaggioChoice === 'existing' &&
    viaggioOptions.existingViaggioId
  ) {
    return { viaggioId: viaggioOptions.existingViaggioId, viaggioCreated: false };
  }

  const ensured = await ensureViaggioForPersonalDiary({
    userId: realUserId,
    diaryId: itinerary.id,
    existingViaggioId: itinerary.viaggioId ?? existingRowViaggioId ?? null,
    title: viaggioTitle,
    periodStart: itinerary.startDate,
    periodEnd: itinerary.endDate,
  });
  return { viaggioId: ensured.viaggioId, viaggioCreated: ensured.created };
}

export const saveUserDraft = async (
    itinerary: Itinerary,
    user: User,
    viaggioOptions?: SaveUserDraftViaggioOptions,
): Promise<boolean> => {
    // 1. Check preliminare
    if (!user || user.role === 'guest') {
        return false;
    }

    try {
        const realUserId = await resolveAuthenticatedUserId(user.id);
        if (!realUserId) {
            throw new Error('ID Utente non valido per il salvataggio.');
        }

        // Calcolo durata giorni
        const start = itinerary.startDate ? new Date(itinerary.startDate).getTime() : Date.now();
        const end = itinerary.endDate ? new Date(itinerary.endDate).getTime() : Date.now();
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const packedData = buildPackedDiaryData(itinerary);

        const { data: existingRow } = await supabase
            .from('itineraries')
            .select('user_id, viaggio_id')
            .eq('id', itinerary.id)
            .maybeSingle();

        const isCollaborativeMemberSave =
            !!existingRow?.user_id &&
            existingRow.user_id !== realUserId;

        if (isCollaborativeMemberSave) {
            const canModify = await canUserModifyResource(realUserId, 'diary', itinerary.id!);
            if (!canModify) {
                throw new Error('Permessi insufficienti per modificare questo Diario condiviso.');
            }

            // Collab: non tocca viaggi / viaggio_id (resource_id resta sul Diario).
            const collaborativePayload = {
                title: itinerary.name || 'Viaggio Senza Nome',
                description: 'Bozza salvata',
                duration_days: duration > 0 ? duration : 1,
                items_json: toDbJson(packedData),
                main_city: itinerary.items[0]?.cityId || 'Campania',
                updated_at: new Date().toISOString(),
                last_modified_by: realUserId,
            };

            const { data, error } = await supabase
                .from('itineraries')
                .update(collaborativePayload)
                .eq('id', itinerary.id)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Salvataggio non riuscito: sessione non valida o permessi insufficienti.');
            }
            return true;
        }

        if (!itinerary.id || !UUID_REGEX.test(itinerary.id)) {
            throw new Error('ID Diario non valido per il salvataggio cloud.');
        }

        const viaggioTitle = itinerary.name || 'Viaggio';

        const { viaggioId, viaggioCreated } = await resolveSaveUserDraftViaggio({
            realUserId,
            itinerary,
            existingRowViaggioId: existingRow?.viaggio_id,
            viaggioOptions,
        });

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
            viaggio_id: viaggioId,
            created_at: new Date(itinerary.createdAt).toISOString(),
            updated_at: new Date().toISOString(),
            last_modified_by: realUserId,
        };

        // Upsert gestisce sia INSERT che UPDATE.
        // Richiediamo SEMPRE la rappresentazione scritta (`.select()`): se la RLS blocca la
        // scrittura (es. sessione/JWT non allineati, account senza sessione attiva), PostgREST
        // non restituisce un errore ma filtra la riga → `data` resta vuoto. Senza questa verifica
        // il salvataggio fallirebbe in silenzio e la UI mostrerebbe un falso "Salvato".
        const { data, error } = await supabase
            .from('itineraries')
            .upsert(payload, { onConflict: 'id' })
            .select('id, viaggio_id');

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

        // Dopo il link viaggio_id: se nuovo Viaggio o active assente → imposta questo Diario come attivo.
        if (viaggioId) {
            if (viaggioCreated) {
                await setActiveDiary(viaggioId, itinerary.id);
            } else {
                // TODO architetturale (limitazione BACKEND / servizio, non frontend):
                // questa SELECT esiste solo perché il servizio setActiveDiary non è ancora
                // idempotente lato backend (chiamarlo a ogni save potrebbe sovrascrivere un
                // altro Diario attivo). Quando setActiveDiary sarà idempotente nel servizio
                // backend (set-if-null / no-op se già valorizzato), questa SELECT potrà essere
                // rimossa e si potrà chiamare setActiveDiary in modo sicuro.
                const { data: viaggioRow } = await supabase
                    .from('viaggi')
                    .select('active_diary_id')
                    .eq('id', viaggioId)
                    .maybeSingle();
                if (viaggioRow && viaggioRow.active_diary_id == null) {
                    await setActiveDiary(viaggioId, itinerary.id);
                }
            }

            try {
                await updateViaggio(viaggioId, {
                    title: viaggioTitle,
                    periodStart: itinerary.startDate,
                    periodEnd: itinerary.endDate,
                });
            } catch (metaErr) {
                console.warn('[Cloud] Aggiornamento metadati Viaggio non riuscito (diario salvato):', metaErr);
            }
        }

        // Non mutiamo l’oggetto `itinerary` del chiamante.
        // Il viaggioId definitivo è già persistito su `itineraries.viaggio_id`;
        // il chiamante deve sincronizzarlo (es. reload da storage / aggiornamento stato locale).

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

        return (data || []).map((db) => mapDbRowToItinerary(db));
    } catch (e) {
        console.error("Errore recupero bozze cloud:", e);
        return [];
    }
};

/** Diari condivisi in modalità Collaborativa accessibili come membro (§13). */
export const fetchDiariesByIds = async (diaryIds: string[]): Promise<Itinerary[]> => {
    if (diaryIds.length === 0) return [];

    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .in('id', diaryIds)
            .eq('type', 'personal')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((db) => mapDbRowToItinerary(db));
    } catch (e) {
        console.error('Errore recupero diari condivisi:', e);
        return [];
    }
};

/**
 * Diari di proprietà + condivisi in modalità Collaborativa (§13).
 */
export const getAccessibleDiariesForUser = async (userId: string): Promise<Itinerary[]> => {
    const [owned, sharedIds] = await Promise.all([
        getUserDrafts(userId),
        fetchCollaborativeDiaryIdsForMember(userId),
    ]);
    const ownedIds = new Set(owned.map((diary) => diary.id).filter((id): id is string => !!id));
    const missingSharedIds = sharedIds.filter((id) => !ownedIds.has(id));

    if (missingSharedIds.length === 0) return owned;

    const shared = await fetchDiariesByIds(missingSharedIds);
    return [...owned, ...shared];
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
        return (data || []).map(mapDbItineraryToPremade);
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
        return (data || []).map(mapCommunityMetadataRow);
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
        
        return (data || []).map(mapDbItineraryToPremade);
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
        return (data || []).map((row: ItineraryLikeTargetRow) => row.target_id);
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

export interface PublishItineraryResult {
    success: boolean;
    error?: string;
    alreadyPublished?: boolean;
    xpAwarded?: number;
    updatedUser?: User;
}

/** Verifica se un diario personale è già stato pubblicato in Community. */
export const isDiaryPublishedToCommunity = async (sourceDiaryId: string): Promise<boolean> => {
    if (!sourceDiaryId || !UUID_REGEX.test(sourceDiaryId)) return false;

    try {
        const { data, error } = await supabase
            .from('itineraries')
            .select('id')
            .eq('source_diary_id', sourceDiaryId)
            .eq('type', 'community')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (e) {
        console.error('[itineraryService] isDiaryPublishedToCommunity:', e);
        return false;
    }
};

/**
 * Pubblica un diario personale in Community tramite RPC atomica:
 * anti-duplicato, insert snapshot indipendente, assegnazione XP reale.
 */
export const publishUserItinerary = async (
    itinerary: Itinerary,
    user: User,
): Promise<PublishItineraryResult> => {
    if (!user || user.role === 'guest' || !itinerary.id || !UUID_REGEX.test(itinerary.id)) {
        return { success: false, error: 'Accedi e salva il diario prima di pubblicare.' };
    }

    if (!itinerary.items.length || !itinerary.name?.trim()) {
        return { success: false, error: 'Aggiungi tappe e un nome al viaggio per pubblicare.' };
    }

    try {
        await saveUserDraft(itinerary, user);

        const { data, error } = await supabase.rpc('publish_diary_to_community', {
            p_source_diary_id: itinerary.id,
        });

        if (error) {
            const msg = error.message ?? '';
            if (msg.includes('ALREADY_PUBLISHED') || error.code === '23505') {
                return { success: false, alreadyPublished: true, error: 'Questo diario è già stato pubblicato.' };
            }
            if (msg.includes('FORBIDDEN')) {
                return { success: false, error: 'Solo il proprietario può pubblicare questo diario.' };
            }
            throw error;
        }

        const result = data as {
            success?: boolean;
            xp_awarded?: number;
            new_xp?: number;
        } | null;

        const xpAwarded = result?.xp_awarded ?? 0;
        const newXp = result?.new_xp ?? (user.xp ?? 0) + xpAwarded;

        return {
            success: true,
            xpAwarded,
            updatedUser: { ...user, xp: newXp },
        };
    } catch (e) {
        console.error('Errore pubblicazione', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Pubblicazione non riuscita.',
        };
    }
};

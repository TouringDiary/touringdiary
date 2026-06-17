import { supabase, Json } from '../supabaseClient';
import { Database } from '../../types/supabase';
import { DbSuitcase, DbSuitcaseItem } from '../../types/domain/index';
import { Suitcase, SuitcaseItem, SuitcaseCategory, SuitcaseUiState } from '../../types/suitcase';
import { CategorySetupEntry } from '../../domain/packing/categorySetupTypes';
import { getDefaultCategorySetupForNewEntity } from '../../domain/packing/categorySetup';
import { normalizeCategoryName } from '../../domain/packing/packingCategories';
import { resolveRuntimeIsTemplate } from '../../utils/suitcaseDomain';

type RawSuitcase = Database['public']['Tables']['suitcases']['Row'];
type RawSuitcaseItem = Database['public']['Tables']['suitcase_items']['Row'];

/**
 * Normalizzatore e parser sicuro per custom_categories.
 * Esegue validazione a runtime reale, lanciando eccezioni per dati corrotti.
 */
export const parseCustomCategories = (json: unknown): SuitcaseCategory[] => {
  if (json === null || json === undefined) {
    return [];
  }
  if (!Array.isArray(json)) {
    throw new Error(`[suitcaseCoreService] Errore di validazione: custom_categories deve essere un array, ottenuto: ${typeof json}`);
  }
  return json.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`[suitcaseCoreService] Errore di validazione: custom_categories[${idx}] non è un oggetto.`);
    }
    const obj = item as { id: unknown; name: unknown; icon_key?: unknown };
    if (typeof obj.id !== 'string') {
      throw new Error(`[suitcaseCoreService] Errore di validazione: custom_categories[${idx}].id manca o non è una stringa.`);
    }
    if (typeof obj.name !== 'string') {
      throw new Error(`[suitcaseCoreService] Errore di validazione: custom_categories[${idx}].name manca o non è una stringa.`);
    }
    
    return {
      id: obj.id,
      name: obj.name,
      icon_key: typeof obj.icon_key === 'string' ? obj.icon_key : undefined
    };
  });
};

/**
 * Normalizzatore e parser sicuro per ui_state.
 * Esegue validazione a runtime reale, lanciando eccezioni per dati corrotti.
 */
export const parseUiState = (json: unknown): SuitcaseUiState => {
  if (json === null || json === undefined) {
    return { hidden_category_ids: [] };
  }
  if (typeof json !== 'object' || Array.isArray(json)) {
    throw new Error(`[suitcaseCoreService] Errore di validazione: ui_state deve essere un oggetto, ottenuto: ${typeof json}`);
  }

  const obj = json as { hidden_category_ids?: unknown; category_setup?: unknown };
  const result: SuitcaseUiState = { hidden_category_ids: [] };

  if (obj.hidden_category_ids !== undefined) {
    if (!Array.isArray(obj.hidden_category_ids)) {
      throw new Error(`[suitcaseCoreService] Errore di validazione: ui_state.hidden_category_ids deve essere un array.`);
    }
    result.hidden_category_ids = obj.hidden_category_ids.map((id, idx) => {
      if (typeof id !== 'string') {
        throw new Error(`[suitcaseCoreService] Errore di validazione: ui_state.hidden_category_ids[${idx}] non è una stringa.`);
      }
      return id;
    });
  }

  if (obj.category_setup !== undefined && obj.category_setup !== null) {
    if (typeof obj.category_setup !== 'object' || Array.isArray(obj.category_setup)) {
      throw new Error(`[suitcaseCoreService] Errore di validazione: ui_state.category_setup deve essere un oggetto.`);
    }
    const setup: Record<string, CategorySetupEntry> = {};
    for (const [key, value] of Object.entries(obj.category_setup as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`[suitcaseCoreService] Errore di validazione: ui_state.category_setup[${key}] non è un oggetto.`);
      }
      const entry = value as { enabled?: unknown; seeded?: unknown };
      setup[key] = {
        enabled: entry.enabled !== false,
        seeded: entry.seeded === true,
      };
    }
    if (Object.keys(setup).length > 0) {
      result.category_setup = setup;
    }
  }

  return result;
};

/**
 * Serializer sicuro runtime -> Json per custom_categories.
 */
export const serializeCustomCategories = (
  categories: SuitcaseCategory[]
): Json => {
  return categories.map(category => ({
    id: category.id,
    name: category.name,
    icon_key: category.icon_key ?? null
  }));
};

/**
 * Serializer sicuro runtime -> Json per ui_state.
 */
export const serializeUiState = (
  uiState: SuitcaseUiState
): Json => {
  const payload: Record<string, unknown> = {
    hidden_category_ids: uiState.hidden_category_ids,
  };
  if (uiState.category_setup && Object.keys(uiState.category_setup).length > 0) {
    payload.category_setup = uiState.category_setup;
  }
  return payload as Json;
};

/**
 * Mapper rigoroso da DbSuitcaseItem (Row<'suitcase_items'>) a modello runtime SuitcaseItem.
 */
export const mapDbSuitcaseItemToRuntimeItem = (dbItem: DbSuitcaseItem): SuitcaseItem => {
  return {
    id: dbItem.id,
    name: dbItem.name,
    category: normalizeCategoryName(dbItem.category),
    suitcase_id: dbItem.suitcase_id,
    is_checked: dbItem.is_checked,
    is_ai_suggestion: dbItem.is_ai_suggestion,
    quantity: dbItem.quantity,
    ai_suggestion_context: dbItem.ai_suggestion_context,
    suggested_at: dbItem.suggested_at,
    accepted_from_ai: dbItem.accepted_from_ai === true ? true : undefined,
    created_at: dbItem.created_at,
    affiliate_tags: dbItem.affiliate_tags,
    poi_triggers: dbItem.poi_triggers
  };
};

/**
 * Mapper rigoroso da DbSuitcase (Row<'suitcases'>) a modello runtime Suitcase.
 */
export const mapDbSuitcaseToRuntimeSuitcase = (
  dbSuitcase: DbSuitcase,
  suitcaseItems?: DbSuitcaseItem[],
  itinerarySuitcases?: { itinerary_id: string }[]
): Suitcase => {
  return {
    id: dbSuitcase.id,
    title: dbSuitcase.title,
    icon: dbSuitcase.icon,
    user_id: dbSuitcase.user_id,
    created_at: dbSuitcase.created_at,
    updated_at: dbSuitcase.updated_at,
    source_template_id: dbSuitcase.source_template_id,
    custom_categories: parseCustomCategories(dbSuitcase.custom_categories),
    ui_state: parseUiState(dbSuitcase.ui_state),
    is_user_template: dbSuitcase.is_user_template ?? false,
    is_template: resolveRuntimeIsTemplate({
      user_id: dbSuitcase.user_id,
      is_user_template: dbSuitcase.is_user_template ?? false,
    }),
    itinerary_suitcases: itinerarySuitcases || undefined,
    suitcase_items: suitcaseItems ? suitcaseItems.map(mapDbSuitcaseItemToRuntimeItem) : undefined
  };
};

/**
 * Normalizzatore centralizzato ed immediato Supabase Row<'suitcases'> -> Modello Runtime Suitcase.
 */
export const mapDbSuitcaseRowToRuntime = (
  row: RawSuitcase,
  suitcaseItems?: RawSuitcaseItem[],
  itinerarySuitcases?: { itinerary_id: string }[]
): Suitcase => {
  const dbSuitcase: DbSuitcase = {
    id: row.id,
    title: row.title,
    icon: row.icon,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source_template_id: row.source_template_id,
    custom_categories: row.custom_categories,
    ui_state: row.ui_state,
    is_user_template: row.is_user_template,
  };

  const dbItems = suitcaseItems?.map(it => {
    const si: DbSuitcaseItem = {
      id: it.id,
      name: it.name,
      category: it.category,
      suitcase_id: it.suitcase_id,
      is_checked: it.is_checked,
      is_ai_suggestion: it.is_ai_suggestion,
      quantity: it.quantity,
      ai_suggestion_context: it.ai_suggestion_context,
      suggested_at: it.suggested_at,
      created_at: it.created_at,
      accepted_from_ai: it.accepted_from_ai,
      affiliate_tags: it.affiliate_tags,
      poi_triggers: it.poi_triggers
    };
    return si;
  });

  return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, dbItems, itinerarySuitcases);
};

/**
 * Normalizzatore centralizzato ed immediato Supabase Row<'suitcase_items'> -> Modello Runtime SuitcaseItem.
 */
export const mapDbSuitcaseItemRowToRuntime = (row: RawSuitcaseItem): SuitcaseItem => {
  const dbItem: DbSuitcaseItem = {
    id: row.id,
    name: row.name,
    category: row.category,
    suitcase_id: row.suitcase_id,
    is_checked: row.is_checked,
    is_ai_suggestion: row.is_ai_suggestion,
    quantity: row.quantity,
    ai_suggestion_context: row.ai_suggestion_context,
    suggested_at: row.suggested_at,
    created_at: row.created_at,
    accepted_from_ai: row.accepted_from_ai,
    affiliate_tags: row.affiliate_tags,
    poi_triggers: row.poi_triggers
  };
  return mapDbSuitcaseItemToRuntimeItem(dbItem);
};

/**
 * Recupera tutte le valigie associate a un utente specifico.
 */
export const fetchUserSuitcasesAsync = async (userId: string): Promise<Suitcase[]> => {
  const { data, error } = await supabase
    .from('suitcases')
    .select(`
      id,
      title,
      icon,
      user_id,
      is_user_template,
      itinerary_suitcases(itinerary_id),
      source_template_id,
      custom_categories,
      ui_state,
      created_at,
      updated_at,
      suitcase_items!suitcase_items_suitcase_id_fkey(
        id,
        name,
        category,
        suitcase_id,
        is_checked,
        is_ai_suggestion,
        quantity,
        ai_suggestion_context,
        suggested_at,
        created_at,
        accepted_from_ai,
        affiliate_tags,
        poi_triggers
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseCoreService] fetchUserSuitcasesAsync ha restituito data null.");
  }

  return data.map(item => {
    const rawItems = Array.isArray(item.suitcase_items) ? item.suitcase_items : [];
    const rawItineraries = Array.isArray(item.itinerary_suitcases)
      ? item.itinerary_suitcases
      : [];
    const itinerary_suitcases = rawItineraries.map(it => {
      if (!it || typeof it.itinerary_id !== 'string') {
        throw new Error("[suitcaseCoreService] Errore di validazione: itinerary_id non valido o mancante.");
      }
      return { itinerary_id: it.itinerary_id };
    });

    return mapDbSuitcaseRowToRuntime(item, rawItems, itinerary_suitcases);
  });
};

export interface CreateSuitcaseOptions {
  is_user_template?: boolean;
  source_template_id?: string | null;
  custom_categories?: SuitcaseCategory[];
  ui_state?: SuitcaseUiState;
}

/**
 * Crea una nuova valigia o template utente associandolo ad un utente.
 */
export const createSuitcaseAsync = async (
  userId: string,
  title: string,
  icon: string,
  options: CreateSuitcaseOptions = {}
): Promise<Suitcase | null> => {
  const uiState = options.ui_state ?? {
    hidden_category_ids: [],
    category_setup: getDefaultCategorySetupForNewEntity(),
  };

  const { data, error } = await supabase
    .from('suitcases')
    .insert({
      user_id: userId,
      title,
      icon,
      is_user_template: options.is_user_template ?? false,
      source_template_id: options.source_template_id ?? null,
      custom_categories: options.custom_categories
        ? serializeCustomCategories(options.custom_categories)
        : undefined,
      ui_state: serializeUiState(uiState),
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) return null;

  return mapDbSuitcaseRowToRuntime(data, []);
};

/**
 * Clona una valigia esistente tramite RPC a database.
 */
export const cloneSuitcaseAsync = async (
  suitcaseId: string,
  userId: string,
  title?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('clone_suitcase', {
    p_template_id: suitcaseId,
    p_user_id: userId,
    p_title: title ?? null,
  });

  if (error) throw error;
  if (typeof data !== 'string') {
    throw new Error(`[suitcaseCoreService] cloneSuitcaseAsync ha restituito un valore non valido (atteso string, ottenuto ${typeof data}).`);
  }
  return data;
};

/**
 * Aggiorna i dettagli di una valigia (es. titolo, icone, custom_categories, ui_state).
 */
export const updateSuitcaseAsync = async (suitcaseId: string, updates: Partial<Suitcase>): Promise<void> => {
  const payload: {
    title?: string;
    icon?: string | null;
    custom_categories?: Json;
    ui_state?: Json;
    source_template_id?: string | null;
  } = {};

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.custom_categories !== undefined) {
    payload.custom_categories =
      serializeCustomCategories(updates.custom_categories);
  }

  if (updates.ui_state !== undefined) {
    payload.ui_state =
      serializeUiState(updates.ui_state);
  }
  if (updates.source_template_id !== undefined) payload.source_template_id = updates.source_template_id;

  const { error } = await supabase
    .from('suitcases')
    .update(payload)
    .eq('id', suitcaseId);

  if (error) throw error;
};

/**
 * Elimina una valigia ed i suoi collegamenti in modo atomico.
 */
export const deleteSuitcaseAsync = async (suitcaseId: string): Promise<void> => {
  const { error: unlinkError } = await supabase
    .from('itinerary_suitcases')
    .delete()
    .eq('suitcase_id', suitcaseId);

  if (unlinkError) {
    throw new Error(`[suitcaseCoreService] deleteSuitcaseAsync fallito durante l'unlink delle relazioni: ${unlinkError.message}`);
  }

  const { error } = await supabase
    .from('suitcases')
    .delete()
    .eq('id', suitcaseId)
    .select();

  if (error) throw error;
};

/**
 * Recupera le valigie associate a un itinerario (trip).
 */
export const fetchTripSuitcasesAsync = async (itineraryId: string): Promise<Suitcase[]> => {
  const { data: linkData, error: linkErr } = await supabase
    .from('itinerary_suitcases')
    .select('suitcase_id')
    .eq('itinerary_id', itineraryId);
  if (linkErr) throw linkErr;
  if (!linkData || linkData.length === 0) return [];

  const suitcaseIds = linkData.map(l => l.suitcase_id);
  const { data: suitcasesData, error: err } = await supabase
    .from('suitcases')
    .select('*')
    .in('id', suitcaseIds);
  if (err) throw err;
  if (!suitcasesData || suitcasesData.length === 0) return [];

  const { data: itemsData, error: itemsErr } = await supabase
    .from('suitcase_items')
    .select('*')
    .in('suitcase_id', suitcaseIds);
  if (itemsErr) throw itemsErr;

  return suitcasesData.map(item => {
    const dbItems = (itemsData || []).filter(si => si.suitcase_id === item.id);
    return mapDbSuitcaseRowToRuntime(item, dbItems);
  });
};

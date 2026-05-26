import { supabase } from '../supabaseClient';
import { Insert, DbSuitcase, DbSuitcaseItem } from '../../types/domain/index';
import { Suitcase, SuitcaseItem } from '../../types/suitcase';
import {
  mapDbSuitcaseToRuntimeSuitcase,
  mapDbSuitcaseItemToRuntimeItem,
  serializeUiState
} from './suitcaseCoreService';

/* NOTE: I servizi editoriali di master template e relative sotto-entità (creazione, modifica, clonazione e rimozione)
   sono stati migrati e centralizzati all'interno di suitcaseEditorialService.ts per una chiara separazione delle responsabilità. */

/* ==========================================
   SERVIZI RUNTIME UTENTE (RIPRISTINATI)
   ========================================== */

/**
 * Recupera tutti i template globali (quelli con user_id nullo) e le loro relazioni interne.
 */
export const fetchGlobalTemplatesAsync = async (): Promise<Suitcase[]> => {
  const { data, error } = await supabase
    .from('suitcases')
    .select(`
      id,
      title,
      icon,
      user_id,
      created_at,
      updated_at,
      source_template_id,
      custom_categories,
      ui_state,
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
    .is('user_id', null)
    .order('title');

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchGlobalTemplatesAsync ha restituito data null.");
  }

  return data.map(item => {
    const rawItems = Array.isArray(item.suitcase_items) ? item.suitcase_items : [];
    const dbSuitcase: DbSuitcase = {
      id: item.id,
      title: item.title,
      icon: item.icon,
      user_id: item.user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      source_template_id: item.source_template_id,
      custom_categories: item.custom_categories,
      ui_state: item.ui_state
    };

    const dbItems: DbSuitcaseItem[] = rawItems.map(si => ({
      id: si.id,
      name: si.name,
      category: si.category,
      suitcase_id: si.suitcase_id,
      is_checked: si.is_checked,
      is_ai_suggestion: si.is_ai_suggestion,
      quantity: si.quantity,
      ai_suggestion_context: si.ai_suggestion_context,
      suggested_at: si.suggested_at,
      created_at: si.created_at,
      accepted_from_ai: si.accepted_from_ai,
      affiliate_tags: si.affiliate_tags,
      poi_triggers: si.poi_triggers
    }));

    return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, dbItems);
  });
};

/**
 * Recupera la mappa dei template associati a un tipo di città ordinati per priorità.
 */
export const fetchCityTypeTemplatesAsync = async (cityType: string): Promise<string[]> => {
  if (!cityType) {
    throw new Error("[suitcaseTemplateService] fetchCityTypeTemplatesAsync: cityType mancante.");
  }

  const { data, error } = await supabase
    .from('city_template_map')
    .select('template_id')
    .eq('city_type', cityType.toLowerCase())
    .order('priority', { ascending: true });

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchCityTypeTemplatesAsync ha restituito data null.");
  }

  return data.map(d => d.template_id);
};

/**
 * Recupera i dettagli specifici di un template clonato (comprensivo di items).
 */
export const fetchClonedTemplateDetailsAsync = async (suitcaseId: string): Promise<Suitcase | null> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseTemplateService] fetchClonedTemplateDetailsAsync: suitcaseId mancante.");
  }

  const { data, error } = await supabase
    .from('suitcases')
    .select(`
      id,
      title,
      icon,
      user_id,
      created_at,
      updated_at,
      source_template_id,
      custom_categories,
      ui_state,
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
    .eq('id', suitcaseId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rawItems = Array.isArray(data.suitcase_items) ? data.suitcase_items : [];
  const dbSuitcase: DbSuitcase = {
    id: data.id,
    title: data.title,
    icon: data.icon,
    user_id: data.user_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    source_template_id: data.source_template_id,
    custom_categories: data.custom_categories,
    ui_state: data.ui_state
  };

  const dbItems: DbSuitcaseItem[] = rawItems.map(si => ({
    id: si.id,
    name: si.name,
    category: si.category,
    suitcase_id: si.suitcase_id,
    is_checked: si.is_checked,
    is_ai_suggestion: si.is_ai_suggestion,
    quantity: si.quantity,
    ai_suggestion_context: si.ai_suggestion_context,
    suggested_at: si.suggested_at,
    created_at: si.created_at,
    accepted_from_ai: si.accepted_from_ai,
    affiliate_tags: si.affiliate_tags,
    poi_triggers: si.poi_triggers
  }));

  return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, dbItems);
};

/**
 * Recupera le preferenze dell'utente sui template.
 */
export const fetchUserTemplatePreferencesAsync = async (
  userId: string
): Promise<{ template_id: string; enabled: boolean; priority: number }[]> => {
  if (!userId) {
    throw new Error("[suitcaseTemplateService] fetchUserTemplatePreferencesAsync: userId mancante.");
  }

  const { data, error } = await supabase
    .from('user_template_preferences')
    .select('template_id, enabled, priority')
    .eq('user_id', userId);

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchUserTemplatePreferencesAsync ha restituito data null.");
  }

  return data;
};

/**
 * Crea o aggiorna la preferenza di un utente per un template.
 */
export const upsertUserTemplatePreferenceAsync = async (
  userId: string,
  templateId: string,
  enabled: boolean
): Promise<void> => {
  if (!userId) {
    throw new Error("[suitcaseTemplateService] upsertUserTemplatePreferenceAsync: userId mancante.");
  }
  if (!templateId) {
    throw new Error("[suitcaseTemplateService] upsertUserTemplatePreferenceAsync: templateId mancante.");
  }

  const { error } = await supabase
    .from('user_template_preferences')
    .upsert({
      user_id: userId,
      template_id: templateId,
      enabled,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,template_id'
    });

  if (error) throw error;
};

/**
 * Aggiorna le categorie nascoste (ui_state) di una valigia.
 */
export const updateHiddenCategoriesAsync = async (
  suitcaseId: string,
  hiddenCategoryIds: string[]
): Promise<void> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseTemplateService] updateHiddenCategoriesAsync: suitcaseId mancante.");
  }
  if (!hiddenCategoryIds) {
    throw new Error("[suitcaseTemplateService] updateHiddenCategoriesAsync: hiddenCategoryIds mancante.");
  }

  const { error } = await supabase
    .from('suitcases')
    .update({
      ui_state: serializeUiState({ hidden_category_ids: hiddenCategoryIds })
    })
    .eq('id', suitcaseId);

  if (error) throw error;
};

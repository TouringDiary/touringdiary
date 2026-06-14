import { supabase } from '../supabaseClient';
import { Insert, DbSuitcase, DbSuitcaseItem } from '../../types/domain/index';
import { Json } from '../supabaseClient';
import { Suitcase, SuitcaseItem } from '../../types/suitcase';
import { dedupeTemplateIds } from '../../utils/deriveItineraryCityTypes';
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

const mapSuitcaseRowWithItems = (
  item: {
    id: string;
    title: string;
    icon: string | null;
    user_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    source_template_id: string | null;
    custom_categories: Json;
    ui_state: Json;
    is_user_template?: boolean;
    suitcase_items?: DbSuitcaseItem[];
  }
): Suitcase => {
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
    ui_state: item.ui_state,
    is_user_template: item.is_user_template ?? false,
  };

  const dbItems: DbSuitcaseItem[] = rawItems.map((si) => ({
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
    poi_triggers: si.poi_triggers,
  }));

  return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, dbItems);
};

const SUITCASE_WITH_ITEMS_SELECT = `
  id,
  title,
  icon,
  user_id,
  is_user_template,
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
` as const;

/**
 * Recupera tutti i template globali (quelli con user_id nullo) e le loro relazioni interne.
 */
export const fetchGlobalTemplatesAsync = async (): Promise<Suitcase[]> => {
  const { data, error } = await supabase
    .from('suitcases')
    .select(SUITCASE_WITH_ITEMS_SELECT)
    .is('user_id', null)
    .order('title');

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchGlobalTemplatesAsync ha restituito data null.");
  }

  return data.map(mapSuitcaseRowWithItems);
};

/**
 * Recupera i template personali dell'utente (is_user_template = true).
 */
export const fetchUserOwnedTemplatesAsync = async (userId: string): Promise<Suitcase[]> => {
  const { data, error } = await supabase
    .from('suitcases')
    .select(SUITCASE_WITH_ITEMS_SELECT)
    .eq('user_id', userId)
    .eq('is_user_template', true)
    .order('title');

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchUserOwnedTemplatesAsync ha restituito data null.");
  }

  return data.map(mapSuitcaseRowWithItems);
};

/**
 * Recupera la mappa dei template associati a un tipo di città ordinati per priorità.
 * Deduplica template_id a runtime (mapping duplicati in city_template_map).
 */
export const fetchCityTypeTemplatesAsync = async (cityType: string): Promise<string[]> => {
  if (!cityType) {
    throw new Error("[suitcaseTemplateService] fetchCityTypeTemplatesAsync: cityType mancante.");
  }

  const { data, error } = await supabase
    .from('city_template_map')
    .select('template_id, priority')
    .eq('city_type', cityType.toLowerCase())
    .order('priority', { ascending: true });

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseTemplateService] fetchCityTypeTemplatesAsync ha restituito data null.");
  }

  return dedupeTemplateIds(data.map((d) => d.template_id));
};

/**
 * Recupera template suggeriti per più city_type, con deduplica e ordine per priorità.
 */
export const fetchCityTypesTemplatesAsync = async (cityTypes: string[]): Promise<string[]> => {
  if (cityTypes.length === 0) return [];

  const orderedIds: string[] = [];

  for (const cityType of cityTypes) {
    const ids = await fetchCityTypeTemplatesAsync(cityType);
    ids.forEach((id) => orderedIds.push(id));
  }

  return dedupeTemplateIds(orderedIds);
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
    .select(SUITCASE_WITH_ITEMS_SELECT)
    .eq('id', suitcaseId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapSuitcaseRowWithItems(data);
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

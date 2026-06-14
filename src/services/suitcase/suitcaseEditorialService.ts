import { supabase } from '../supabaseClient';
import {
  createProductWithOverrideTriggerAsync,
  deleteAffiliateTriggerAsync,
  upsertAffiliateTriggerFromDtoAsync
} from './suitcaseAffiliateService';
import { Insert, DbSuitcase, DbSuitcaseItem } from '../../types/domain/index';
import { Suitcase, SuitcaseItem } from '../../types/suitcase';
import {
  mapDbSuitcaseToRuntimeSuitcase,
  mapDbSuitcaseItemToRuntimeItem
} from './suitcaseCoreService';

/* ==========================================
   SERVIZI EDITORIALI MASTER TEMPLATE (MIGRATI)
   ========================================== */

/**
 * Recupera tutti i master template valigia (quelli con user_id null).
 */
export const fetchMasterTemplatesAsync = async (): Promise<Suitcase[]> => {
  const { data, error } = await supabase
    .from('suitcases')
    .select('*')
    .is('user_id', null)
    .order('title');

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseEditorialService] fetchMasterTemplatesAsync ha restituito data null.");
  }

  return data.map(row => {
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
      is_user_template: row.is_user_template ?? false,
    };

    return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, []);
  });
};

/**
 * Recupera tutti gli oggetti valigia (items) associati a un determinato template.
 */
export const fetchTemplateItemsAsync = async (suitcaseId: string): Promise<SuitcaseItem[]> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseEditorialService] fetchTemplateItemsAsync: suitcaseId mancante.");
  }

  const { data, error } = await supabase
    .from('suitcase_items')
    .select('*')
    .eq('suitcase_id', suitcaseId)
    .order('category');

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseEditorialService] fetchTemplateItemsAsync ha restituito data null.");
  }

  return data.map(row => {
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
  });
};

/**
 * Crea un nuovo master template valigia (user_id forzatamente impostato a null).
 */
export const createMasterTemplateAsync = async (
  title: string = 'Nuovo Template',
  icon: string = '🎒'
): Promise<Suitcase> => {
  const { data, error } = await supabase
    .from('suitcases')
    .insert({ title, icon, user_id: null })
    .select()
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseEditorialService] createMasterTemplateAsync: nessun record creato.");
  }

  const dbSuitcase: DbSuitcase = {
    id: data.id,
    title: data.title,
    icon: data.icon,
    user_id: data.user_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    source_template_id: data.source_template_id,
    custom_categories: data.custom_categories,
    ui_state: data.ui_state,
    is_user_template: data.is_user_template ?? false,
  };

  return mapDbSuitcaseToRuntimeSuitcase(dbSuitcase, []);
};

/**
 * Clona un master template profondo richiamando la RPC Postgres clone_suitcase_master.
 */
export const cloneMasterTemplateAsync = async (sourceId: string): Promise<string> => {
  if (!sourceId) {
    throw new Error("[suitcaseEditorialService] cloneMasterTemplateAsync: sourceId mancante.");
  }

  const { data, error } = await supabase.rpc('clone_suitcase_master', {
    p_source_id: sourceId
  });

  if (error) throw error;
  if (typeof data !== 'string') {
    throw new Error("[suitcaseEditorialService] Chiamata RPC clone_suitcase_master non ha restituito un ID valido.");
  }
  return data;
};

/**
 * Elimina definitivamente un master template valigia dal DB.
 */
export const deleteMasterTemplateAsync = async (suitcaseId: string): Promise<void> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseEditorialService] deleteMasterTemplateAsync: suitcaseId mancante.");
  }

  const { error } = await supabase
    .from('suitcases')
    .delete()
    .eq('id', suitcaseId);

  if (error) throw error;
};

/**
 * Aggiorna il titolo di un master template.
 */
export const updateMasterTemplateTitleAsync = async (suitcaseId: string, title: string): Promise<void> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseEditorialService] updateMasterTemplateTitleAsync: suitcaseId mancante.");
  }
  if (!title) {
    throw new Error("[suitcaseEditorialService] updateMasterTemplateTitleAsync: title mancante.");
  }

  const { error } = await supabase
    .from('suitcases')
    .update({ title })
    .eq('id', suitcaseId);

  if (error) throw error;
};

export interface UpsertTemplateItemDto {
  id?: string;
  suitcase_id: string;
  name: string;
  category: string;
  quantity?: number;
  is_checked?: boolean;
  is_ai_suggestion?: boolean;
}

/**
 * Crea o aggiorna un oggetto all'interno di un template valigia.
 */
export const upsertTemplateItemAsync = async (
  item: UpsertTemplateItemDto
): Promise<SuitcaseItem> => {
  const suitcase_id = item.suitcase_id;
  const name = item.name;
  const category = item.category;

  if (!suitcase_id) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: suitcase_id mancante.");
  }
  if (!name) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: name mancante.");
  }
  if (!category) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: category mancante.");
  }

  const payload: Insert<'suitcase_items'> = {
    id: item.id,
    suitcase_id,
    name,
    category,
    quantity: item.quantity ?? 1,
    is_checked: item.is_checked ?? false,
    is_ai_suggestion: item.is_ai_suggestion ?? false
  };

  const { data, error } = await supabase
    .from('suitcase_items')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  if (!data) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: nessun record restituito.");
  }

  const dbItem: DbSuitcaseItem = {
    id: data.id,
    name: data.name,
    category: data.category,
    suitcase_id: data.suitcase_id,
    is_checked: data.is_checked,
    is_ai_suggestion: data.is_ai_suggestion,
    quantity: data.quantity,
    ai_suggestion_context: data.ai_suggestion_context,
    suggested_at: data.suggested_at,
    created_at: data.created_at,
    accepted_from_ai: data.accepted_from_ai,
    affiliate_tags: data.affiliate_tags,
    poi_triggers: data.poi_triggers
  };

  return mapDbSuitcaseItemToRuntimeItem(dbItem);
};

/**
 * Rimuove un oggetto da un template valigia.
 */
export const deleteTemplateItemAsync = async (itemId: string): Promise<void> => {
  if (!itemId) {
    throw new Error("[suitcaseEditorialService] deleteTemplateItemAsync: itemId mancante.");
  }

  const { error } = await supabase
    .from('suitcase_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};

export interface SaveOverrideResult {
  action: 'delete' | 'upsert' | 'create';
  finalTriggerId?: string;
  targetProductId?: string;
}

/**
 * Salva o rimuove in modo centralizzato un override per un determinato oggetto del template valigia.
 * Governa internamente il branching di cancellazione, aggiornamento, o creazione di un nuovo prodotto affiliato.
 */
export const saveTemplateOverrideAsync = async (
  itemName: string,
  overrideId: string | undefined,
  productId: string | undefined,
  triggerKey: string
): Promise<SaveOverrideResult> => {
  if (!productId) {
    if (overrideId) {
      await deleteAffiliateTriggerAsync(overrideId);
    }
    return { action: 'delete' };
  }

  if (productId === 'new') {
    const { product, trigger } = await createProductWithOverrideTriggerAsync({
      name: itemName,
      imageUrl: 'https://placehold.co/400x400/0f172a/6366f1?text=' + encodeURIComponent(itemName),
      preferredPartners: [],
      targetCategories: [],
      targetTags: []
    }, triggerKey);

    return {
      action: 'create',
      finalTriggerId: trigger.id,
      targetProductId: product.id
    };
  }

  const trigger = await upsertAffiliateTriggerFromDtoAsync({
    id: overrideId,
    triggerKey,
    triggerType: 'item',
    productId,
    priority: 100
  });

  return {
    action: 'upsert',
    finalTriggerId: trigger.id,
    targetProductId: productId
  };
};

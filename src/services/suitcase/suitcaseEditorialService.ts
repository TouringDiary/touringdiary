import { supabase } from '../supabaseClient';
import {
  createProductWithOverrideTriggerAsync,
  deleteAffiliateTriggerAsync,
  upsertAffiliateTriggerFromDtoAsync
} from './suitcaseAffiliateService';
import { DbSuitcase } from '../../types/domain/index';
import { Suitcase, SuitcaseItem } from '../../types/suitcase';
import {
  mapDbSuitcaseToRuntimeSuitcase,
} from './suitcaseCoreService';
import {
  fetchAllTemplateSpecificItemsAsync,
  upsertTemplateSpecificItemAsync,
  deleteTemplateSpecificItemAsync,
  cloneTemplateSpecificItemsAsync,
} from './packingCatalogService';
import { UpsertPackingTemplateItemDto } from '@/types/packingCatalog';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';

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
 * Recupera gli oggetti specifici di un template TD (packing_template_items).
 */
export const fetchTemplateItemsAsync = async (suitcaseId: string): Promise<SuitcaseItem[]> => {
  if (!suitcaseId) {
    throw new Error("[suitcaseEditorialService] fetchTemplateItemsAsync: suitcaseId mancante.");
  }

  const rows = await fetchAllTemplateSpecificItemsAsync(suitcaseId);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    suitcase_id: row.template_id,
    is_checked: false,
    is_ai_suggestion: false,
    quantity: 1,
  }));
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

  await cloneTemplateSpecificItemsAsync(sourceId, data);
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
 * Crea o aggiorna un oggetto specifico template TD (packing_template_items).
 */
export const upsertTemplateItemAsync = async (
  item: UpsertTemplateItemDto
): Promise<SuitcaseItem> => {
  const template_id = item.suitcase_id;
  const name = item.name;
  const category = item.category;

  if (!template_id) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: suitcase_id mancante.");
  }
  if (!name) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: name mancante.");
  }
  if (!category) {
    throw new Error("[suitcaseEditorialService] upsertTemplateItemAsync: category mancante.");
  }

  const dto: UpsertPackingTemplateItemDto = {
    id: item.id,
    template_id,
    name,
    category: normalizeCategoryName(category),
  };

  const row = await upsertTemplateSpecificItemAsync(dto);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    suitcase_id: row.template_id,
    is_checked: false,
    is_ai_suggestion: false,
    quantity: 1,
  };
};

/**
 * Rimuove un oggetto specifico da un template TD.
 */
export const deleteTemplateItemAsync = async (itemId: string): Promise<void> => {
  if (!itemId) {
    throw new Error("[suitcaseEditorialService] deleteTemplateItemAsync: itemId mancante.");
  }

  await deleteTemplateSpecificItemAsync(itemId);
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

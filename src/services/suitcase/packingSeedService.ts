import { getCategoryId, normalizeCategoryName } from '@/domain/packing/packingCategories';
import {
  getDefaultCategorySetupForNewEntity,
  resolveCategorySetup,
} from '@/domain/packing/categorySetup';
import { Suitcase, SuitcaseItem, SuitcaseUiState } from '@/types/suitcase';
import { CategorySetupMap } from '@/types/packingCatalog';
import { fetchActiveStandardItemsAsync } from './packingCatalogService';
import { serializeUiState, parseUiState } from './suitcaseCoreService';
import { persistSuitcaseItemsFromRuntimeAsync } from './suitcaseItemsService';
import { supabase } from '../supabaseClient';
import { normalizeItemName } from '@/utils/tagDerivation';

/**
 * Genera item seed per nuova valigia / template utente da packing_standard_items.
 */
export const buildStandardSeedItems = (
  standardRows: { name: string; category: string; tier: string }[],
  setup: CategorySetupMap,
  suitcaseId: string
): SuitcaseItem[] => {
  const items: SuitcaseItem[] = [];
  let index = 0;

  for (const row of standardRows) {
    const cat = normalizeCategoryName(row.category);
    const catId = getCategoryId(cat);
    const entry = setup[catId];
    if (entry?.enabled === false) continue;
    if (entry?.seeded !== true) continue;
    if (row.tier === 'additional_ai_only') continue;

    items.push({
      id: `seed-${suitcaseId}-${index++}`,
      name: row.name,
      category: cat,
      suitcase_id: suitcaseId,
      is_checked: false,
      is_ai_suggestion: false,
      quantity: 1,
    });
  }

  return items;
};

export const fetchStandardSeedItemsForSetupAsync = async (
  setup: CategorySetupMap,
  suitcaseId: string
): Promise<SuitcaseItem[]> => {
  const rows = await fetchActiveStandardItemsAsync();
  return buildStandardSeedItems(rows, setup, suitcaseId);
};

export const getDefaultUiStateForNewEntity = (): SuitcaseUiState => ({
  hidden_category_ids: [],
  dismissed_category_ids: [],
  category_display_order: [],
  category_setup: getDefaultCategorySetupForNewEntity(),
});

/** Applica seed standard in memoria (draft/guest) se la valigia è ancora vuota. */
export const applyStandardSeedToSuitcaseInMemory = async (
  suitcase: Suitcase
): Promise<Suitcase> => {
  if ((suitcase.suitcase_items?.length ?? 0) > 0) {
    return suitcase;
  }

  const setup = resolveCategorySetup(suitcase);
  const hasSeedIntent = Object.values(setup).some((entry) => entry.enabled && entry.seeded);
  if (!hasSeedIntent) {
    return suitcase;
  }

  const seedItems = await fetchStandardSeedItemsForSetupAsync(setup, suitcase.id);
  if (seedItems.length === 0) {
    return suitcase;
  }

  return { ...suitcase, suitcase_items: seedItems };
};

/**
 * Persiste item_display_order su valigia esistente (merge con ui_state corrente).
 */
export const persistItemDisplayOrderAsync = async (
  suitcaseId: string,
  itemDisplayOrder: SuitcaseUiState['item_display_order']
): Promise<void> => {
  const { data, error: fetchError } = await supabase
    .from('suitcases')
    .select('ui_state')
    .eq('id', suitcaseId)
    .single();

  if (fetchError) throw fetchError;

  const parsed = parseUiState(data?.ui_state);
  const merged: SuitcaseUiState = {
    ...parsed,
    item_display_order: itemDisplayOrder ?? {},
  };

  const { error } = await supabase
    .from('suitcases')
    .update({ ui_state: serializeUiState(merged) })
    .eq('id', suitcaseId);

  if (error) throw error;
};

/**
 * Persiste category_setup, hidden_category_ids, dismissed e display order su valigia esistente.
 */
export const persistCategoryVisibilityAsync = async (
  suitcaseId: string,
  patch: Pick<
    SuitcaseUiState,
    'category_setup' | 'hidden_category_ids' | 'dismissed_category_ids' | 'category_display_order'
  >
): Promise<void> => {
  const { data, error: fetchError } = await supabase
    .from('suitcases')
    .select('ui_state')
    .eq('id', suitcaseId)
    .single();

  if (fetchError) throw fetchError;

  const parsed = parseUiState(data?.ui_state);
  const merged: SuitcaseUiState = {
    ...parsed,
    category_setup: patch.category_setup ?? parsed.category_setup,
    hidden_category_ids: patch.hidden_category_ids ?? parsed.hidden_category_ids,
    dismissed_category_ids: patch.dismissed_category_ids ?? parsed.dismissed_category_ids ?? [],
    category_display_order: patch.category_display_order ?? parsed.category_display_order ?? [],
    item_display_order: parsed.item_display_order,
  };

  const { error } = await supabase
    .from('suitcases')
    .update({ ui_state: serializeUiState(merged) })
    .eq('id', suitcaseId);

  if (error) throw error;
};

/**
 * Persiste ui_state.category_setup su valigia esistente.
 */
export const updateCategorySetupAsync = async (
  suitcaseId: string,
  setup: CategorySetupMap
): Promise<void> => {
  const { data, error: fetchError } = await supabase
    .from('suitcases')
    .select('ui_state')
    .eq('id', suitcaseId)
    .single();

  if (fetchError) throw fetchError;

  const parsed = parseUiState(data?.ui_state);
  const merged: SuitcaseUiState = {
    ...parsed,
    category_setup: setup,
  };

  const { error } = await supabase
    .from('suitcases')
    .update({ ui_state: serializeUiState(merged) })
    .eq('id', suitcaseId);

  if (error) throw error;
};

/**
 * Seed standard items su valigia utente (non TD) con setup dato.
 */
export const seedStandardItemsOnSuitcaseAsync = async (
  suitcaseId: string,
  setup: CategorySetupMap
): Promise<number> => {
  const items = await fetchStandardSeedItemsForSetupAsync(setup, suitcaseId);
  if (items.length === 0) return 0;
  await persistSuitcaseItemsFromRuntimeAsync(suitcaseId, items);
  return items.length;
};

/**
 * Item seed standard mancanti rispetto alla valigia corrente (es. attivazione categoria opzionale).
 */
export const buildMissingStandardSeedItems = async (
  suitcase: Suitcase,
  setup: CategorySetupMap
): Promise<SuitcaseItem[]> => {
  const existing = new Set(
    (suitcase.suitcase_items ?? []).map((i) => normalizeItemName(i.name))
  );
  const rows = await fetchActiveStandardItemsAsync();
  const candidates = buildStandardSeedItems(rows, setup, suitcase.id);
  return candidates.filter((item) => !existing.has(normalizeItemName(item.name)));
};

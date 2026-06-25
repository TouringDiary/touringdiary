import {
  ADDITIONAL_CATEGORY_NAMES,
  CATEGORY_ID_MAP,
  CATEGORY_ORDER,
  CORE_CATEGORY_NAMES,
  getCategoryId,
  normalizeCategoryName,
  SystemCategoryName,
} from './packingCategories';
import { getItemDisplayOrder } from '@/domain/packing/itemDisplayOrder';
import { Suitcase, SuitcaseItem, SuitcaseUiState } from '@/types/suitcase';
import type { CategorySetupEntry, CategorySetupMap } from './categorySetupTypes';

const SYSTEM_CATEGORY_IDS = new Set<string>(Object.values(CATEGORY_ID_MAP));

/** Core opzionali attivabili dalla sezione "Disponibili" nell'editor valigia. */
const CORE_ACTIVATABLE_CATEGORY_NAMES = ['Farmaci', 'Accessori'] as const satisfies readonly SystemCategoryName[];

const EDITOR_ACTIVATABLE_CATEGORY_NAMES: readonly SystemCategoryName[] = [
  ...CORE_ACTIVATABLE_CATEGORY_NAMES,
  ...ADDITIONAL_CATEGORY_NAMES,
];

export function isSystemCategoryId(categoryId: string): boolean {
  return SYSTEM_CATEGORY_IDS.has(categoryId);
}

export function hasPersistedCategorySetup(suitcase: Suitcase): boolean {
  return Boolean(
    suitcase.ui_state?.category_setup && Object.keys(suitcase.ui_state.category_setup).length > 0
  );
}

export function getDismissedCategoryIds(suitcase: Suitcase): string[] {
  return suitcase.ui_state?.dismissed_category_ids ?? [];
}

export function getCategoryDisplayOrder(suitcase: Suitcase): string[] {
  return suitcase.ui_state?.category_display_order ?? [];
}

/** Materializza setup scrivibile: inferenza legacy + hidden_category_ids solo per custom. */
export function materializeCategorySetupForWrite(suitcase: Suitcase): {
  setup: CategorySetupMap;
  hidden_category_ids: string[];
  dismissed_category_ids: string[];
  category_display_order: string[];
} {
  const hiddenIds = suitcase.ui_state?.hidden_category_ids ?? [];
  const setup = hasPersistedCategorySetup(suitcase)
    ? { ...suitcase.ui_state!.category_setup! }
    : inferCategorySetupFromSuitcase(suitcase);

  return {
    setup,
    hidden_category_ids: hiddenIds.filter((id) => !isSystemCategoryId(id)),
    dismissed_category_ids: getDismissedCategoryIds(suitcase),
    category_display_order: getCategoryDisplayOrder(suitcase),
  };
}

/**
 * Nascondi / mostra categoria sistema.
 * Nascondere imposta seeded: true — l'utente ha interagito con la categoria;
 * non va più trattata come "mai attivata" (Disponibili).
 */
export function setCategoryEnabled(
  setup: CategorySetupMap,
  categoryId: string,
  enabled: boolean
): CategorySetupMap {
  const current = setup[categoryId] ?? { enabled: false, seeded: false };
  return {
    ...setup,
    [categoryId]: {
      enabled,
      seeded: enabled ? current.seeded : true,
    },
  };
}

/** Attiva categoria opzionale (Bambini / Animali) con seed standard. */
export function enableOptionalSystemCategory(
  setup: CategorySetupMap,
  categoryId: string,
  options: { seeded?: boolean } = {}
): CategorySetupMap {
  return {
    ...setup,
    [categoryId]: {
      enabled: true,
      seeded: options.seeded ?? true,
    },
  };
}

export function addDismissedCategoryId(
  dismissedIds: string[],
  categoryId: string
): string[] {
  if (dismissedIds.includes(categoryId)) return dismissedIds;
  return [...dismissedIds, categoryId];
}

export function removeDismissedCategoryId(
  dismissedIds: string[],
  categoryId: string
): string[] {
  return dismissedIds.filter((id) => id !== categoryId);
}

export function isCategoryDismissed(suitcase: Suitcase, categoryId: string): boolean {
  return getDismissedCategoryIds(suitcase).includes(categoryId);
}

/** Normalizza ui_state per persistenza (materializza setup legacy al primo save). */
export function ensureUiStateForPersist(suitcase: Suitcase): SuitcaseUiState {
  const materialized = materializeCategorySetupForWrite(suitcase);
  return {
    hidden_category_ids: materialized.hidden_category_ids,
    category_setup: materialized.setup,
    dismissed_category_ids: materialized.dismissed_category_ids,
    category_display_order: materialized.category_display_order,
    item_display_order: getItemDisplayOrder(suitcase),
  };
}

function isOptionalNeverActivated(setup: CategorySetupMap, categoryId: string): boolean {
  const entry = setup[categoryId];
  return entry?.enabled === false && entry?.seeded !== true;
}

/**
 * Categorie nascoste recuperabili (hide utente) — esclude opzionali mai attivate e dismissate.
 */
export function getRestorableHiddenCategories(
  suitcase: Suitcase,
  isHidden: (categoryId: string) => boolean
): DisplayCategory[] {
  const setup = resolveCategorySetup(suitcase);
  const dismissed = new Set(getDismissedCategoryIds(suitcase));
  const hidden: DisplayCategory[] = [];

  for (const name of CATEGORY_ORDER) {
    const id = getCategoryId(name);
    if (!isHidden(id)) continue;
    if (dismissed.has(id)) continue;
    // Mai usata nella valigia → "Disponibili", non "Nascoste"
    if (isOptionalNeverActivated(setup, id)) continue;
    hidden.push({ id, name, icon_key: null, source: 'system' });
  }

  for (const cat of suitcase.custom_categories ?? []) {
    if (isHidden(cat.id)) {
      hidden.push({
        id: cat.id,
        name: cat.name,
        icon_key: cat.icon_key ?? null,
        source: 'user',
      });
    }
  }

  return hidden;
}

/**
 * Categorie disabilitate, mai usate nella valigia, attivabili dalla sezione "Disponibili".
 * Mutuamente esclusive con getRestorableHiddenCategories (stesso criterio seeded).
 */
export function getAvailableOptionalCategories(
  suitcase: Suitcase,
  setup?: CategorySetupMap
): DisplayCategory[] {
  const resolved = setup ?? resolveCategorySetup(suitcase);
  const dismissed = new Set(getDismissedCategoryIds(suitcase));
  const available: DisplayCategory[] = [];

  for (const name of EDITOR_ACTIVATABLE_CATEGORY_NAMES) {
    const id = CATEGORY_ID_MAP[name];
    if (dismissed.has(id)) continue;
    const entry = resolved[id];
    if (entry?.enabled !== false) continue;
    if (!isOptionalNeverActivated(resolved, id)) continue;
    available.push({ id, name, icon_key: null, source: 'system' });
  }

  return available;
}

export const FAMIGLIA_TEMPLATE_TITLE_PATTERN = /famiglia|family/i;

/** Default per nuova valigia / nuovo template utente */
export function getDefaultCategorySetupForNewEntity(): CategorySetupMap {
  const setup: CategorySetupMap = {};
  for (const name of CORE_CATEGORY_NAMES) {
    const id = CATEGORY_ID_MAP[name];
    setup[id] = { enabled: true, seeded: true };
  }
  for (const name of ADDITIONAL_CATEGORY_NAMES) {
    const id = CATEGORY_ID_MAP[name];
    setup[id] = { enabled: false, seeded: false };
  }
  return setup;
}

/** Default per template TD in base al titolo */
export function getDefaultCategorySetupForTdTemplate(title: string): CategorySetupMap {
  const setup = getDefaultCategorySetupForNewEntity();
  if (FAMIGLIA_TEMPLATE_TITLE_PATTERN.test(title)) {
    setup[CATEGORY_ID_MAP.Bambini] = { enabled: true, seeded: true };
    setup[CATEGORY_ID_MAP.Animali] = { enabled: true, seeded: true };
  }
  return setup;
}

/** Inferisce setup da valigie legacy senza category_setup in ui_state. */
export function inferCategorySetupFromSuitcase(suitcase: Suitcase): CategorySetupMap {
  const items = suitcase.suitcase_items ?? [];
  const hiddenIds = new Set(suitcase.ui_state?.hidden_category_ids ?? []);
  const setup: CategorySetupMap = {};

  const hasItemsInCategory = (name: SystemCategoryName): boolean =>
    items.some((i) => normalizeCategoryName(i.category) === name);

  const applyCategoryState = (name: SystemCategoryName): void => {
    const id = CATEGORY_ID_MAP[name];
    const isHidden = hiddenIds.has(id);
    const hasItems = hasItemsInCategory(name);

    if (isHidden) {
      setup[id] = { enabled: false, seeded: true };
    } else if (hasItems) {
      setup[id] = { enabled: true, seeded: true };
    } else {
      setup[id] = { enabled: true, seeded: false };
    }
  };

  for (const name of CORE_CATEGORY_NAMES) {
    applyCategoryState(name);
  }
  for (const name of ADDITIONAL_CATEGORY_NAMES) {
    applyCategoryState(name);
  }

  return setup;
}

export function resolveCategorySetup(suitcase: Suitcase): CategorySetupMap {
  if (suitcase.ui_state?.category_setup && Object.keys(suitcase.ui_state.category_setup).length > 0) {
    return suitcase.ui_state.category_setup;
  }
  return inferCategorySetupFromSuitcase(suitcase);
}

/** Applica overlay sessione preview su template senza mutare la sorgente TD. */
export function mergeTemplateWithOverlay(
  template: Suitcase,
  overlay?: CategorySetupMap
): Suitcase {
  if (!overlay || Object.keys(overlay).length === 0) return template;
  return {
    ...template,
    ui_state: {
      ...template.ui_state,
      category_setup: {
        ...resolveCategorySetup(template),
        ...overlay,
      },
    },
  };
}

export function isCategoryEnabled(suitcase: Suitcase, categoryName: SystemCategoryName): boolean {
  const id = getCategoryId(categoryName);
  const setup = resolveCategorySetup(suitcase);
  return setup[id]?.enabled !== false;
}

export function getEnabledSystemCategoryNames(suitcase: Suitcase): SystemCategoryName[] {
  const setup = resolveCategorySetup(suitcase);
  return CATEGORY_ORDER.filter((name) => {
    const id = getCategoryId(name);
    return setup[id]?.enabled !== false;
  });
}

export function getEnabledSystemCategoryNamesFromSetup(setup: CategorySetupMap): SystemCategoryName[] {
  return CATEGORY_ORDER.filter((name) => {
    const id = getCategoryId(name);
    return setup[id]?.enabled !== false;
  });
}

export function getMissingSystemCategories(suitcase: Suitcase): SystemCategoryName[] {
  const enabled = new Set(getEnabledSystemCategoryNames(suitcase));
  return CATEGORY_ORDER.filter((name) => !enabled.has(name));
}

export interface DisplayCategory {
  id: string;
  name: string;
  icon_key: string | null;
  source: 'system' | 'user';
}

function sortByDisplayOrder(
  categories: DisplayCategory[],
  displayOrder: string[]
): DisplayCategory[] {
  if (displayOrder.length === 0) return categories;

  const indexMap = new Map(displayOrder.map((id, i) => [id, i]));
  return [...categories].sort((a, b) => {
    const ia = indexMap.get(a.id);
    const ib = indexMap.get(b.id);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return 0;
  });
}

export function buildDisplayCategories(suitcase: Suitcase): DisplayCategory[] {
  const enabledNames = new Set(getEnabledSystemCategoryNames(suitcase));
  const systemCats: DisplayCategory[] = CATEGORY_ORDER.filter((name) => enabledNames.has(name)).map(
    (name) => ({
      id: getCategoryId(name),
      name,
      icon_key: null,
      source: 'system' as const,
    })
  );

  const customCats: DisplayCategory[] = (suitcase.custom_categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon_key: cat.icon_key ?? null,
    source: 'user' as const,
  }));

  const merged = [...systemCats, ...customCats];
  return sortByDisplayOrder(merged, getCategoryDisplayOrder(suitcase));
}

export function moveCategoryInDisplayOrder(
  order: string[],
  categoryId: string,
  direction: 'up' | 'down',
  visibleIds: string[]
): string[] {
  const baseOrder =
    order.length > 0
      ? [...order]
      : visibleIds.filter((id, idx, arr) => arr.indexOf(id) === idx);

  for (const id of visibleIds) {
    if (!baseOrder.includes(id)) baseOrder.push(id);
  }

  const visibleSet = new Set(visibleIds);
  const working = baseOrder.filter((id) => visibleSet.has(id));
  const idx = working.indexOf(categoryId);
  if (idx === -1) return baseOrder;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= working.length) return baseOrder;

  const nextWorking = [...working];
  [nextWorking[idx], nextWorking[swapIdx]] = [nextWorking[swapIdx], nextWorking[idx]];

  const workingSet = new Set(working);
  const result: string[] = [];
  let wi = 0;
  for (const id of baseOrder) {
    if (workingSet.has(id)) {
      result.push(nextWorking[wi++]);
    } else {
      result.push(id);
    }
  }
  while (wi < nextWorking.length) {
    result.push(nextWorking[wi++]);
  }
  return result;
}

export function categorySetupToUiStatePatch(setup: CategorySetupMap): { category_setup: CategorySetupMap } {
  return { category_setup: setup };
}

export function itemsToSeedFromStandard(
  standardRows: { name: string; category: string }[],
  setup: CategorySetupMap,
  suitcaseId: string
): SuitcaseItem[] {
  return standardRows
    .filter((row) => {
      const cat = normalizeCategoryName(row.category);
      const id = getCategoryId(cat);
      const entry = setup[id];
      return entry?.enabled && entry?.seeded;
    })
    .map((row, index) => ({
      id: `seed-${Date.now()}-${index}`,
      name: row.name,
      category: normalizeCategoryName(row.category),
      suitcase_id: suitcaseId,
      is_checked: false,
      is_ai_suggestion: false,
      quantity: 1,
    }));
}

/** Conta categorie nascoste recuperabili (esclude opzionali disponibili e dismissate). */
export function countRestorableHiddenCategories(
  suitcase: Suitcase,
  isHidden: (categoryId: string) => boolean
): number {
  return getRestorableHiddenCategories(suitcase, isHidden).length;
}

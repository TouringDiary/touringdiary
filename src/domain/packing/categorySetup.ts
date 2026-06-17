import {
  ADDITIONAL_CATEGORY_NAMES,
  CATEGORY_ID_MAP,
  CATEGORY_ORDER,
  CORE_CATEGORY_NAMES,
  getCategoryId,
  normalizeCategoryName,
  SystemCategoryName,
} from './packingCategories';
import { Suitcase, SuitcaseItem, SuitcaseUiState } from '@/types/suitcase';
import type { CategorySetupEntry, CategorySetupMap } from './categorySetupTypes';

const SYSTEM_CATEGORY_IDS = new Set<string>(Object.values(CATEGORY_ID_MAP));

export function isSystemCategoryId(categoryId: string): boolean {
  return SYSTEM_CATEGORY_IDS.has(categoryId);
}

export function hasPersistedCategorySetup(suitcase: Suitcase): boolean {
  return Boolean(
    suitcase.ui_state?.category_setup && Object.keys(suitcase.ui_state.category_setup).length > 0
  );
}

/** Materializza setup scrivibile: inferenza legacy + hidden_category_ids solo per custom. */
export function materializeCategorySetupForWrite(suitcase: Suitcase): {
  setup: CategorySetupMap;
  hidden_category_ids: string[];
} {
  const hiddenIds = suitcase.ui_state?.hidden_category_ids ?? [];
  const setup = hasPersistedCategorySetup(suitcase)
    ? { ...suitcase.ui_state!.category_setup! }
    : inferCategorySetupFromSuitcase(suitcase);

  return {
    setup,
    hidden_category_ids: hiddenIds.filter((id) => !isSystemCategoryId(id)),
  };
}

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
      seeded: enabled ? current.seeded : false,
    },
  };
}

/** Normalizza ui_state per persistenza (materializza setup legacy al primo save). */
export function ensureUiStateForPersist(suitcase: Suitcase): SuitcaseUiState {
  const materialized = materializeCategorySetupForWrite(suitcase);
  return {
    hidden_category_ids: materialized.hidden_category_ids,
    category_setup: materialized.setup,
  };
}

export function getRestorableHiddenCategories(
  suitcase: Suitcase,
  isHidden: (categoryId: string) => boolean
): DisplayCategory[] {
  const hidden: DisplayCategory[] = [];

  for (const name of CATEGORY_ORDER) {
    const id = getCategoryId(name);
    if (isHidden(id)) {
      hidden.push({ id, name, icon_key: null, source: 'system' });
    }
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
  }
  return setup;
}

/** Inferisce setup da valigie legacy senza category_setup in ui_state.
 *  Tre stati distinti:
 *  - assente: enabled false, seeded false
 *  - presente vuota: enabled true, seeded false
 *  - presente precompilata: enabled true, seeded true
 *
 *  Legacy: tutte le categorie erano visibili salvo hidden_category_ids.
 */
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
      setup[id] = { enabled: false, seeded: false };
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

  return [...systemCats, ...customCats];
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

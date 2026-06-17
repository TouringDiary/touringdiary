import { CATEGORY_ID_MAP, CATEGORY_ORDER, SystemCategoryName } from './packingCategories';
import type { CategorySetupMap } from './categorySetupTypes';
import { setCategoryEnabled } from './categorySetup';

/** Categorie standard attive (e con oggetti standard) di default nella modale di configurazione. */
export const CONFIGURATION_MODAL_STANDARD_NAMES = [
  'Abbigliamento',
  'Igiene',
  'Documenti',
  'Elettronica',
  'Extra',
] as const satisfies readonly SystemCategoryName[];

/** Categorie opzionali disattivate di default nella modale di configurazione. */
export const CONFIGURATION_MODAL_OPTIONAL_NAMES = [
  'Bambini',
  'Farmaci',
  'Animali',
  'Accessori',
] as const satisfies readonly SystemCategoryName[];

export function getCategorySetupDefaultsForConfigurationModal(): CategorySetupMap {
  const setup: CategorySetupMap = {};

  for (const name of CONFIGURATION_MODAL_STANDARD_NAMES) {
    setup[CATEGORY_ID_MAP[name]] = { enabled: true, seeded: true };
  }
  for (const name of CONFIGURATION_MODAL_OPTIONAL_NAMES) {
    setup[CATEGORY_ID_MAP[name]] = { enabled: false, seeded: false };
  }

  for (const name of CATEGORY_ORDER) {
    const id = CATEGORY_ID_MAP[name];
    if (!setup[id]) {
      setup[id] = { enabled: false, seeded: false };
    }
  }

  return setup;
}

export function setCategorySeeded(
  setup: CategorySetupMap,
  categoryId: string,
  seeded: boolean
): CategorySetupMap {
  const current = setup[categoryId] ?? { enabled: false, seeded: false };
  if (!current.enabled) {
    return { ...setup, [categoryId]: { enabled: false, seeded: false } };
  }
  return { ...setup, [categoryId]: { enabled: true, seeded } };
}

export { setCategoryEnabled };

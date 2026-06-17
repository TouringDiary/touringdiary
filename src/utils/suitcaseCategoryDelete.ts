import { Suitcase, SuitcaseCategory, SuitcaseItem } from '@/types/suitcase';
import {
  materializeCategorySetupForWrite,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import { CategorySetupMap } from '@/domain/packing/categorySetupTypes';

export type CategoryDeleteTarget = {
  id: string;
  name: string;
  source: 'system' | 'user';
};

export type CategoryDeleteSnapshot = {
  target: CategoryDeleteTarget;
  previousItems: SuitcaseItem[];
  previousCustomCategories: SuitcaseCategory[];
  previousHiddenCategoryIds: string[];
  previousCategorySetup: CategorySetupMap;
};

export function createCategoryDeleteSnapshot(
  suitcase: Suitcase,
  target: CategoryDeleteTarget
): CategoryDeleteSnapshot {
  const materialized = materializeCategorySetupForWrite(suitcase);

  return {
    target,
    previousItems: [...(suitcase.suitcase_items ?? [])],
    previousCustomCategories: [...(suitcase.custom_categories ?? [])],
    previousHiddenCategoryIds: [...materialized.hidden_category_ids],
    previousCategorySetup: { ...materialized.setup },
  };
}

export function computeCategoryDeleteUpdates(
  suitcase: Suitcase,
  target: CategoryDeleteTarget
): Partial<Suitcase> {
  const items = suitcase.suitcase_items ?? [];
  const materialized = materializeCategorySetupForWrite(suitcase);
  const customCategories = suitcase.custom_categories ?? [];
  const nextItems = items.filter((item) => item.category !== target.name);

  if (target.source === 'user') {
    return {
      suitcase_items: nextItems,
      custom_categories: customCategories.filter(
        (category) => category.id !== target.id && category.name !== target.name
      ),
      ui_state: {
        ...suitcase.ui_state,
        category_setup: materialized.setup,
        hidden_category_ids: materialized.hidden_category_ids.filter((id) => id !== target.id),
      },
    };
  }

  return {
    suitcase_items: nextItems,
    ui_state: {
      ...suitcase.ui_state,
      category_setup: setCategoryEnabled(materialized.setup, target.id, false),
      hidden_category_ids: materialized.hidden_category_ids,
    },
  };
}

export function computeCategoryRestoreUpdates(
  snapshot: CategoryDeleteSnapshot
): Partial<Suitcase> {
  return {
    suitcase_items: snapshot.previousItems,
    custom_categories: snapshot.previousCustomCategories,
    ui_state: {
      hidden_category_ids: snapshot.previousHiddenCategoryIds,
      category_setup: snapshot.previousCategorySetup,
    },
  };
}

export function getItemsRemovedByCategoryDelete(
  suitcase: Suitcase,
  target: CategoryDeleteTarget
): SuitcaseItem[] {
  return (suitcase.suitcase_items ?? []).filter((item) => item.category === target.name);
}

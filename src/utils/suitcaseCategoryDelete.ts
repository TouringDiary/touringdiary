import { Suitcase, SuitcaseCategory, SuitcaseItem } from '@/types/suitcase';
import {
  addDismissedCategoryId,
  materializeCategorySetupForWrite,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import {
  cloneItemDisplayOrder,
  getItemDisplayOrder,
  removeCategoryFromDisplayOrder,
} from '@/domain/packing/itemDisplayOrder';
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
  previousDismissedCategoryIds: string[];
  previousCategoryDisplayOrder: string[];
  previousItemDisplayOrder: Record<string, string[]>;
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
    previousDismissedCategoryIds: [...materialized.dismissed_category_ids],
    previousCategoryDisplayOrder: [...materialized.category_display_order],
    previousItemDisplayOrder: cloneItemDisplayOrder(getItemDisplayOrder(suitcase)),
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
  const nextItemDisplayOrder = removeCategoryFromDisplayOrder(
    getItemDisplayOrder(suitcase),
    target.id
  );

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
        dismissed_category_ids: materialized.dismissed_category_ids,
        category_display_order: materialized.category_display_order.filter(
          (id) => id !== target.id
        ),
        item_display_order: nextItemDisplayOrder,
      },
    };
  }

  const dismissed = addDismissedCategoryId(materialized.dismissed_category_ids, target.id);

  return {
    suitcase_items: nextItems,
    ui_state: {
      ...suitcase.ui_state,
      category_setup: setCategoryEnabled(materialized.setup, target.id, false),
      hidden_category_ids: materialized.hidden_category_ids,
      dismissed_category_ids: dismissed,
      category_display_order: materialized.category_display_order.filter(
        (id) => id !== target.id
      ),
      item_display_order: nextItemDisplayOrder,
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
      dismissed_category_ids: snapshot.previousDismissedCategoryIds,
      category_display_order: snapshot.previousCategoryDisplayOrder,
      item_display_order: snapshot.previousItemDisplayOrder,
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

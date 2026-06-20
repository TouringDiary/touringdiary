import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  countRestorableHiddenCategories,
  enableOptionalSystemCategory,
  isSystemCategoryId,
  materializeCategorySetupForWrite,
  moveCategoryInDisplayOrder,
  removeDismissedCategoryId,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import { CategorySetupMap } from '@/domain/packing/categorySetupTypes';
import { persistCategoryVisibilityAsync } from '@/services/suitcase/packingSeedService';
import { SuitcaseUiState } from '@/types/suitcase';
import { getGuestSuitcase, isDraftWorkspaceId, saveGuestSuitcase } from '@/utils/guestSuitcaseHelper';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import { Suitcase } from '@/types/suitcase';

export type CategoryVisibilityPatch = Pick<
  SuitcaseUiState,
  'category_setup' | 'hidden_category_ids' | 'dismissed_category_ids' | 'category_display_order'
>;

/**
 * Gestisce visibilità categorie via category_setup.enabled (sistema)
 * e hidden_category_ids (solo categorie custom).
 */
export const useHiddenCategories = (
  suitcaseId: string | undefined,
  suitcase: Suitcase | undefined,
  onSync?: (patch: CategoryVisibilityPatch) => void
) => {
  const materialized = useMemo(
    () =>
      suitcase
        ? materializeCategorySetupForWrite(suitcase)
        : {
            setup: {},
            hidden_category_ids: [],
            dismissed_category_ids: [],
            category_display_order: [],
          },
    [suitcase]
  );

  const [categorySetup, setCategorySetup] = useState<CategorySetupMap>(materialized.setup);
  const [customHiddenIds, setCustomHiddenIds] = useState<string[]>(materialized.hidden_category_ids);
  const [dismissedIds, setDismissedIds] = useState<string[]>(materialized.dismissed_category_ids);
  const [displayOrder, setDisplayOrder] = useState<string[]>(materialized.category_display_order);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setCategorySetup(materialized.setup);
    setCustomHiddenIds(materialized.hidden_category_ids);
    setDismissedIds(materialized.dismissed_category_ids);
    setDisplayOrder(materialized.category_display_order);
  }, [
    suitcaseId,
    materialized.setup,
    materialized.hidden_category_ids,
    materialized.dismissed_category_ids,
    materialized.category_display_order,
  ]);

  const emitSync = useCallback(
    (
      setup: CategorySetupMap,
      hiddenIds: string[],
      dismissed: string[],
      order: string[]
    ) => {
      onSync?.({
        category_setup: setup,
        hidden_category_ids: hiddenIds,
        dismissed_category_ids: dismissed,
        category_display_order: order,
      });
    },
    [onSync]
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (isSystemCategoryId(categoryId)) {
        const enabled = categorySetup[categoryId]?.enabled === false;
        const nextSetup = setCategoryEnabled(categorySetup, categoryId, enabled);
        setCategorySetup(nextSetup);
        emitSync(nextSetup, customHiddenIds, dismissedIds, displayOrder);
        return;
      }

      const nextHidden = customHiddenIds.includes(categoryId)
        ? customHiddenIds.filter((id) => id !== categoryId)
        : [...customHiddenIds, categoryId];
      setCustomHiddenIds(nextHidden);
      emitSync(categorySetup, nextHidden, dismissedIds, displayOrder);
    },
    [categorySetup, customHiddenIds, dismissedIds, displayOrder, emitSync]
  );

  const activateOptionalCategory = useCallback(
    (categoryId: string) => {
      const nextSetup = enableOptionalSystemCategory(categorySetup, categoryId);
      const nextDismissed = removeDismissedCategoryId(dismissedIds, categoryId);
      setCategorySetup(nextSetup);
      setDismissedIds(nextDismissed);
      emitSync(nextSetup, customHiddenIds, nextDismissed, displayOrder);
    },
    [categorySetup, customHiddenIds, dismissedIds, displayOrder, emitSync]
  );

  const moveCategory = useCallback(
    (categoryId: string, direction: 'up' | 'down', visibleIds: string[]) => {
      const nextOrder = moveCategoryInDisplayOrder(displayOrder, categoryId, direction, visibleIds);
      setDisplayOrder(nextOrder);
      emitSync(categorySetup, customHiddenIds, dismissedIds, nextOrder);
    },
    [categorySetup, customHiddenIds, dismissedIds, displayOrder, emitSync]
  );

  const reorderCategoryToIndex = useCallback(
    (categoryId: string, targetIndex: number, visibleIds: string[]) => {
      const visibleSet = new Set(visibleIds);
      const baseOrder =
        displayOrder.length > 0
          ? [...displayOrder]
          : visibleIds.filter((id, idx, arr) => arr.indexOf(id) === idx);

      for (const id of visibleIds) {
        if (!baseOrder.includes(id)) baseOrder.push(id);
      }

      const working = baseOrder.filter((id) => visibleSet.has(id));
      const currentIdx = working.indexOf(categoryId);
      if (currentIdx === -1 || targetIndex < 0 || targetIndex >= working.length || currentIdx === targetIndex) {
        return;
      }

      const nextWorking = working.filter((id) => id !== categoryId);
      nextWorking.splice(targetIndex, 0, categoryId);

      const workingSet = new Set(working);
      const nextOrder: string[] = [];
      let wi = 0;
      for (const id of baseOrder) {
        if (workingSet.has(id)) {
          nextOrder.push(nextWorking[wi++]);
        } else {
          nextOrder.push(id);
        }
      }
      while (wi < nextWorking.length) {
        nextOrder.push(nextWorking[wi++]);
      }

      setDisplayOrder(nextOrder);
      emitSync(categorySetup, customHiddenIds, dismissedIds, nextOrder);
    },
    [categorySetup, customHiddenIds, dismissedIds, displayOrder, emitSync]
  );

  const showAll = useCallback(() => {
    let nextSetup = categorySetup;
    for (const categoryId of Object.keys(categorySetup)) {
      if (categorySetup[categoryId]?.enabled === false) {
        nextSetup = setCategoryEnabled(nextSetup, categoryId, true);
      }
    }
    setCategorySetup(nextSetup);
    setCustomHiddenIds([]);
    emitSync(nextSetup, [], dismissedIds, displayOrder);
  }, [categorySetup, dismissedIds, displayOrder, emitSync]);

  const isHidden = useCallback(
    (categoryId: string) => {
      if (isSystemCategoryId(categoryId)) {
        return categorySetup[categoryId]?.enabled === false;
      }
      return customHiddenIds.includes(categoryId);
    },
    [categorySetup, customHiddenIds]
  );

  const hiddenIds = useMemo(() => {
    const disabledSystemIds = Object.entries(categorySetup)
      .filter(([, entry]) => entry.enabled === false)
      .map(([id]) => id);
    return [...disabledSystemIds, ...customHiddenIds];
  }, [categorySetup, customHiddenIds]);

  const restorableHiddenCount = useMemo(() => {
    if (!suitcase) return 0;
    const withState: Suitcase = {
      ...suitcase,
      ui_state: {
        ...suitcase.ui_state,
        category_setup: categorySetup,
        hidden_category_ids: customHiddenIds,
        dismissed_category_ids: dismissedIds,
        category_display_order: displayOrder,
      },
    };
    return countRestorableHiddenCategories(withState, isHidden);
  }, [suitcase, categorySetup, customHiddenIds, dismissedIds, displayOrder, isHidden]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!suitcaseId) return;
    if (suitcase && isTdTemplate(suitcase)) return;

    const patch: CategoryVisibilityPatch = {
      category_setup: categorySetup,
      hidden_category_ids: customHiddenIds,
      dismissed_category_ids: dismissedIds,
      category_display_order: displayOrder,
    };

    if (isDraftWorkspaceId(suitcaseId)) {
      const timer = setTimeout(() => {
        const draft = getGuestSuitcase();
        if (draft?.id === suitcaseId) {
          saveGuestSuitcase({
            ...draft,
            ui_state: {
              ...draft.ui_state,
              ...patch,
            },
          });
        }
      }, 800);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      try {
        await persistCategoryVisibilityAsync(suitcaseId, patch);
      } catch (error) {
        console.error('[useHiddenCategories] Errore salvataggio category_setup:', error);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [categorySetup, customHiddenIds, dismissedIds, displayOrder, suitcaseId]);

  return {
    hiddenIds,
    restorableHiddenCount,
    toggleCategory,
    activateOptionalCategory,
    moveCategory,
    reorderCategoryToIndex,
    showAll,
    isHidden,
    categorySetup,
    dismissedIds,
    displayOrder,
  };
};

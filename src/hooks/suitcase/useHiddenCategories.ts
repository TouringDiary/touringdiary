import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  isSystemCategoryId,
  materializeCategorySetupForWrite,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import { CategorySetupMap } from '@/domain/packing/categorySetupTypes';
import { persistCategoryVisibilityAsync } from '@/services/suitcase/packingSeedService';
import { getGuestSuitcase, isDraftWorkspaceId, saveGuestSuitcase } from '@/utils/guestSuitcaseHelper';
import { Suitcase } from '@/types/suitcase';

export type CategoryVisibilityPatch = {
  category_setup: CategorySetupMap;
  hidden_category_ids: string[];
};

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
    () => (suitcase ? materializeCategorySetupForWrite(suitcase) : { setup: {}, hidden_category_ids: [] }),
    [suitcase]
  );

  const [categorySetup, setCategorySetup] = useState<CategorySetupMap>(materialized.setup);
  const [customHiddenIds, setCustomHiddenIds] = useState<string[]>(materialized.hidden_category_ids);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setCategorySetup(materialized.setup);
    setCustomHiddenIds(materialized.hidden_category_ids);
  }, [suitcaseId, materialized.setup, materialized.hidden_category_ids]);

  const emitSync = useCallback(
    (setup: CategorySetupMap, hiddenIds: string[]) => {
      onSync?.({ category_setup: setup, hidden_category_ids: hiddenIds });
    },
    [onSync]
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (isSystemCategoryId(categoryId)) {
        const enabled = categorySetup[categoryId]?.enabled === false;
        const nextSetup = setCategoryEnabled(categorySetup, categoryId, enabled);
        setCategorySetup(nextSetup);
        emitSync(nextSetup, customHiddenIds);
        return;
      }

      const nextHidden = customHiddenIds.includes(categoryId)
        ? customHiddenIds.filter((id) => id !== categoryId)
        : [...customHiddenIds, categoryId];
      setCustomHiddenIds(nextHidden);
      emitSync(categorySetup, nextHidden);
    },
    [categorySetup, customHiddenIds, emitSync]
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
    emitSync(nextSetup, []);
  }, [categorySetup, emitSync]);

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

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!suitcaseId) return;

    if (isDraftWorkspaceId(suitcaseId)) {
      const timer = setTimeout(() => {
        const draft = getGuestSuitcase();
        if (draft?.id === suitcaseId) {
          saveGuestSuitcase({
            ...draft,
            ui_state: {
              ...draft.ui_state,
              category_setup: categorySetup,
              hidden_category_ids: customHiddenIds,
            },
          });
        }
      }, 800);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      try {
        await persistCategoryVisibilityAsync(suitcaseId, categorySetup, customHiddenIds);
      } catch (error) {
        console.error('[useHiddenCategories] Errore salvataggio category_setup:', error);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [categorySetup, customHiddenIds, suitcaseId]);

  return { hiddenIds, toggleCategory, showAll, isHidden };
};

import { useMemo } from 'react';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import type { CategoryVisibilityPatch } from '@/hooks/suitcase/useHiddenCategories';
import type { Suitcase } from '@/types/suitcase';
import { isTdTemplate } from '@/utils/suitcaseDomain';

interface UseSuitcaseHiddenCategoriesOptions {
  activeSuitcase: Suitcase | undefined;
  onUpdateCategoryVisibility: (patch: CategoryVisibilityPatch) => void;
}

export function useSuitcaseHiddenCategories({
  activeSuitcase,
  onUpdateCategoryVisibility,
}: UseSuitcaseHiddenCategoriesOptions) {
  const hiddenCategoriesLogic = useHiddenCategories(
    activeSuitcase && !isTdTemplate(activeSuitcase) ? activeSuitcase.id : undefined,
    activeSuitcase,
    onUpdateCategoryVisibility
  );

  const enhancedHiddenCategoriesLogic = useMemo(
    () => hiddenCategoriesLogic,
    [hiddenCategoriesLogic]
  );

  return {
    enhancedHiddenCategoriesLogic,
  };
}

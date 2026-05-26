import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import type { Suitcase } from '@/types/suitcase';

interface UseSuitcaseHiddenCategoriesOptions {
  activeSuitcase: Suitcase | undefined;
  onUpdateHiddenCategoryIds: (ids: string[]) => void;
}

export function useSuitcaseHiddenCategories({
  activeSuitcase,
  onUpdateHiddenCategoryIds,
}: UseSuitcaseHiddenCategoriesOptions) {
  const [showHiddenCategories, setShowHiddenCategories] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('showHiddenCategories') : null;
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('showHiddenCategories', JSON.stringify(showHiddenCategories));
  }, [showHiddenCategories]);

  const [isEyeFlashing, setIsEyeFlashing] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const hiddenCategoriesLogic = useHiddenCategories(
    activeSuitcase?.id,
    activeSuitcase?.ui_state?.hidden_category_ids || [],
    onUpdateHiddenCategoryIds
  );

  const toggleCategoryWithFlash = useCallback((id: string) => {
    const wasHidden = hiddenCategoriesLogic.isHidden(id);
    hiddenCategoriesLogic.toggleCategory(id);

    if (!wasHidden) {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      setIsEyeFlashing(true);
      flashTimeoutRef.current = setTimeout(() => setIsEyeFlashing(false), 2000);
    }
  }, [hiddenCategoriesLogic]);

  const enhancedHiddenCategoriesLogic = useMemo(
    () => ({
      ...hiddenCategoriesLogic,
      toggleCategory: toggleCategoryWithFlash,
    }),
    [hiddenCategoriesLogic, toggleCategoryWithFlash]
  );

  return {
    showHiddenCategories,
    setShowHiddenCategories,
    isEyeFlashing,
    enhancedHiddenCategoriesLogic,
  };
}

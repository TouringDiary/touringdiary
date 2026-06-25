import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, FolderX, Check, Package, ChevronUp, ChevronDown, Eye, CheckSquare, CloudOff } from 'lucide-react';
import {
  ItemCategoryIcon,
  filterCategoriesByStatus,
  getIncompleteItemCount,
  getSuitcaseItemProgress,
  CategoryStatusFilter,
  SUITCASE_CATEGORY_SECTION_SHELL_CLASS,
  SUITCASE_CATEGORY_SECTION_HEADER_CLASS,
} from './SuitcaseUtils';
import { buildGroupedItemsByCategory } from '@/domain/packing/itemDisplayOrder';
import {
  buildDisplayCategories,
  enableOptionalSystemCategory,
  getAvailableOptionalCategories,
  getEnabledSystemCategoryNames,
  getRestorableHiddenCategories,
  mergeTemplateWithOverlay,
  resolveCategorySetup,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase, SuitcaseItem, RuntimeAffiliateProduct } from '@/types/suitcase';
import type { UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import { AiSuggestion, AiQuotaFeedback } from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import { GetAiCandidatesOptions } from '@/hooks/useSuitcaseSystem';
import { SuitcaseItemRow } from './SuitcaseItemRow';
import { CategorySuggestionPanel } from './CategorySuggestionPanel';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { SuitcaseMobileSuggestionsDrawer } from './SuitcaseMobileSuggestionsDrawer';
import { normalizeItemName } from '@/utils/tagDerivation';
import { SuitcaseToast } from '../SuitcaseFloatingPanel/components/SuitcaseToast';
import { AiSuggestionsModal } from './AiSuggestionsModal';
import { SuitcaseEditorToolbar } from './SuitcaseEditorToolbar';
import { HiddenCategoriesPanel } from './HiddenCategoriesPanel';
import { OptionalCategoriesPanel } from './OptionalCategoriesPanel';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';
import { NewCategoryPanel } from './NewCategoryPanel';
import { isTdTemplate, getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { CategorySetupMap } from '@/types/packingCatalog';
import {
  composeTdTemplateItemsAsync,
  ensureTdTemplateCategorySetup,
} from '@/services/suitcase/packingCompositionService';

import { ToastVariant, CATEGORY_ADDED_TOAST } from '@/types/toast';

/** Soglia px dal top dello scrollport per considerare una sezione "attiva". */
const ACTIVE_CATEGORY_THRESHOLD = 8;

interface HiddenCategories {
  enhancedHiddenCategoriesLogic: {
    toggleCategory: (id: string) => void;
    activateOptionalCategory: (id: string) => void;
    moveCategory: (id: string, direction: 'up' | 'down', visibleIds: string[]) => void;
    reorderCategoryToIndex: (id: string, targetIndex: number, visibleIds: string[]) => void;
    showAll: () => void;
    isHidden: (id: string) => boolean;
    hiddenIds: string[];
    restorableHiddenCount: number;
  };
}

interface SuitcaseEditorViewProps {
  suitcase: Suitcase;
  readOnly?: boolean;
  onUpdateItem: (itemId: string, updates: UpdateSuitcaseItemDto) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (category: string, name: string) => void;
  onUpdateSuitcase: (updates: Partial<Suitcase>) => void;
  onUpdateSuitcaseLocal?: (id: string, updates: Partial<Suitcase>) => void;
  onSeedAi: (
    categories?: string[],
    mode?: 'direct' | 'review',
    options?: GetAiCandidatesOptions
  ) => void;
  onOpenBlacklist: () => void;
  autoOpenNewCategory?: boolean;
  isSeedingAi: boolean;
  aiSuggestions: AiSuggestion[];
  onAcceptAiSuggestion: (name: string, category: string) => Promise<void>;
  onRejectAiSuggestion: (name: string, category: string) => Promise<void>;
  onShowMoreAi: () => void;
  hasMoreAi: boolean;
  aiQuotaFeedback?: AiQuotaFeedback | null;
  exhaustedCategories?: string[];
  itemMap: Record<string, RuntimeAffiliateProduct[]>;
  categoryMap: Record<string, RuntimeAffiliateProduct[]>;
  overrides: Record<string, RuntimeAffiliateProduct>;
  globalMap: RuntimeAffiliateProduct[];
  placeholders: Record<string, RuntimeAffiliateProduct[]>;
  onLinkBuild: (provider: string, url: string) => string;
  onLinkBuildSearch: (query: string) => string;
  highlightItemId: string | null;
  selectedItemName: string | null;
  onSelectItem: (name: string | null) => void;
  onDeleteCategory?: (category: { id: string; name: string; source: string }) => void;
  onSwapItemsInCategory?: (
    categoryId: string,
    draggedName: string,
    targetName: string,
    visibleNamesInOrder: string[]
  ) => void;
  onActivateOptionalCategory?: (categoryId: string) => void | Promise<void>;
  hiddenCategories: HiddenCategories;
  showToast?: (message: string, description?: string, variant?: ToastVariant) => void;
  toast?: { visible: boolean; message: string; description?: string; variant?: ToastVariant };
  blacklistCount?: number;
  isBlacklistFlashing?: boolean;
  isAddingNewCategory: boolean;
  setIsAddingNewCategory: (val: boolean) => void;
  showGuestWarning?: boolean;
  panelViewMode?: 'viewer' | 'editor';
  onSetViewMode?: (mode: 'viewer' | 'editor') => void;
  onUseTemplate?: () => void;
  categorySetupOverlay?: CategorySetupMap;
  onCategorySetupOverlayChange?: (
    updater: (prev: CategorySetupMap) => CategorySetupMap
  ) => void;
}

export const SuitcaseEditorView: React.FC<SuitcaseEditorViewProps> = ({
  suitcase,
  readOnly = false,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onUpdateSuitcase,
  onUpdateSuitcaseLocal,
  onSeedAi,
  onOpenBlacklist,
  autoOpenNewCategory,
  isSeedingAi,
  itemMap,
  categoryMap,
  overrides,
  globalMap,
  placeholders,
  onLinkBuild,
  onLinkBuildSearch,
  highlightItemId,
  selectedItemName,
  onSelectItem,
  onDeleteCategory,
  onSwapItemsInCategory,
  onActivateOptionalCategory,
  hiddenCategories,
  showToast,
  toast = { visible: false, message: "" },
  blacklistCount = 0,
  isBlacklistFlashing = false,
  isAddingNewCategory,
  setIsAddingNewCategory,
  showGuestWarning = false,
  aiSuggestions,
  onAcceptAiSuggestion,
  onRejectAiSuggestion,
  onShowMoreAi,
  hasMoreAi,
  aiQuotaFeedback = null,
  exhaustedCategories = [],
  panelViewMode = 'editor',
  onSetViewMode,
  onUseTemplate,
  categorySetupOverlay,
  onCategorySetupOverlayChange,
}) => {
  const isTd = isTdTemplate(suitcase);
  const guestDraftIsTemplate = getDraftWorkspaceKind(suitcase) === 'user_template';
  const useTdOverlayMode = isTd && !!onCategorySetupOverlayChange;

  const resolvedBaseTemplate = useMemo(
    () => (isTd ? ensureTdTemplateCategorySetup(suitcase) : suitcase),
    [suitcase, isTd]
  );

  const effectiveSuitcase = useMemo(
    () =>
      useTdOverlayMode
        ? mergeTemplateWithOverlay(resolvedBaseTemplate, categorySetupOverlay)
        : resolvedBaseTemplate,
    [resolvedBaseTemplate, categorySetupOverlay, useTdOverlayMode]
  );

  const [composedTdItems, setComposedTdItems] = useState<SuitcaseItem[] | null>(null);

  useEffect(() => {
    if (!useTdOverlayMode) {
      setComposedTdItems(null);
      return;
    }

    let cancelled = false;

    void composeTdTemplateItemsAsync(effectiveSuitcase, {
      categorySetup: resolveCategorySetup(effectiveSuitcase),
    }).then((items) => {
      if (!cancelled) {
        setComposedTdItems(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [effectiveSuitcase, useTdOverlayMode]);

  const displaySuitcase = useMemo(
    () =>
      useTdOverlayMode && composedTdItems !== null
        ? { ...effectiveSuitcase, suitcase_items: composedTdItems }
        : effectiveSuitcase,
    [effectiveSuitcase, composedTdItems, useTdOverlayMode]
  );

  const overlayIsHidden = useCallback(
    (categoryId: string): boolean => {
      const setup = resolveCategorySetup(displaySuitcase);
      if (setup[categoryId]?.enabled === false) return true;
      return (displaySuitcase.ui_state?.hidden_category_ids ?? []).includes(categoryId);
    },
    [displaySuitcase]
  );

  const { enhancedHiddenCategoriesLogic } = hiddenCategories;
  const {
    toggleCategory,
    activateOptionalCategory,
    moveCategory,
    reorderCategoryToIndex,
    showAll,
    isHidden,
  } = enhancedHiddenCategoriesLogic;

  const resolvedIsHidden = useTdOverlayMode ? overlayIsHidden : isHidden;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncSidebarOpen = (event: MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', syncSidebarOpen);
    return () => {
      mediaQuery.removeEventListener('change', syncSidebarOpen);
    };
  }, []);

  const [newItemName, setNewItemName] = useState("");
  const [activeCategoryForAdd, setActiveCategoryForAdd] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Package");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<CategoryStatusFilter>('all');
  const dragItemIdRef = useRef<string | null>(null);
  const dragCategoryIdRef = useRef<string | null>(null);
  const dragMovedRef = useRef(false);
  const [dropTarget, setDropTarget] = useState<{ categoryId: string; index: number } | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoOpenNewCategory && !readOnly) {
      setIsAddingNewCategory(true);
    }
  }, [autoOpenNewCategory, setIsAddingNewCategory, readOnly]);

  const handleAdd = (category: string) => {
    if (!newItemName.trim()) return;
    onAddItem(category, newItemName.trim());
    setNewItemName("");
    setActiveCategoryForAdd(null);
  };

  const handleAddNewCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `custom_${Date.now()}`,
      name: newCatName.trim(),
      icon_key: newCatIcon,
      order: (suitcase.custom_categories?.length || 0) + 1,
      source: 'user',
      created_at: new Date().toISOString()
    };
    const updatedCustomCats = [...(suitcase.custom_categories || []), newCat];
    onUpdateSuitcase({ custom_categories: updatedCustomCats });
    setNewCatName("");
    setNewCatIcon("Package");
    setIsAddingNewCategory(false);
    showToast?.(
      CATEGORY_ADDED_TOAST.message,
      CATEGORY_ADDED_TOAST.description,
      'success'
    );
  };

  const allCategories = buildDisplayCategories(displaySuitcase);

  const visibleCategories = allCategories.filter(
    (cat) => cat.source === 'system' || !resolvedIsHidden(cat.id)
  );

  const hiddenCategoriesList = getRestorableHiddenCategories(displaySuitcase, resolvedIsHidden);
  const availableOptionalCategories = getAvailableOptionalCategories(displaySuitcase);
  const categorySectionsReadOnly = readOnly && !useTdOverlayMode;
  const visibleCategoryIds = visibleCategories.map((cat) => cat.id);
  const aiInitialCategories = getEnabledSystemCategoryNames(displaySuitcase);

  const groupedItems = useMemo(
    () => buildGroupedItemsByCategory(displaySuitcase, buildDisplayCategories(displaySuitcase)),
    [displaySuitcase]
  );

  const resetItemDragState = useCallback(() => {
    dragItemIdRef.current = null;
    dragCategoryIdRef.current = null;
    dragMovedRef.current = false;
    setDropTarget(null);
  }, []);

  const handleItemDragStart = useCallback(
    (categoryId: string, itemId: string) => (e: React.DragEvent) => {
      if (readOnly) return;
      dragItemIdRef.current = itemId;
      dragCategoryIdRef.current = categoryId;
      dragMovedRef.current = false;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', itemId);
    },
    [readOnly]
  );

  const handleItemDragOver = useCallback(
    (categoryId: string, index: number) => (e: React.DragEvent) => {
      if (readOnly || !dragItemIdRef.current || dragCategoryIdRef.current !== categoryId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragMovedRef.current = true;
      setDropTarget({ categoryId, index });
    },
    [readOnly]
  );

  const handleItemDragLeave = useCallback(
    (categoryId: string, index: number) => (e: React.DragEvent) => {
      const related = e.relatedTarget as Node | null;
      if (related && e.currentTarget.contains(related)) return;
      setDropTarget((current) =>
        current?.categoryId === categoryId && current.index === index ? null : current
      );
    },
    []
  );

  const handleItemDrop = useCallback(
    (categoryId: string, categoryName: string, targetIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = dragItemIdRef.current;
      if (readOnly || !draggedId || dragCategoryIdRef.current !== categoryId) {
        resetItemDragState();
        return;
      }
      const items = groupedItems[categoryName] ?? [];
      const draggedItem = items.find((entry) => entry.id === draggedId);
      const targetItem = items[targetIndex];
      if (
        draggedItem &&
        targetItem &&
        draggedItem.id !== targetItem.id &&
        onSwapItemsInCategory
      ) {
        onSwapItemsInCategory(
          categoryId,
          draggedItem.name,
          targetItem.name,
          items.map((entry) => entry.name)
        );
      }
      resetItemDragState();
    },
    [groupedItems, onSwapItemsInCategory, readOnly, resetItemDragState]
  );

  const incompleteCountsByCategoryId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of visibleCategories) {
      counts[cat.id] = getIncompleteItemCount(groupedItems[cat.name]);
    }
    return counts;
  }, [visibleCategories, groupedItems]);

  const filteredVisibleCategories = useMemo(
    () => filterCategoriesByStatus(visibleCategories, groupedItems, categoryStatusFilter),
    [visibleCategories, groupedItems, categoryStatusFilter]
  );

  const filteredVisibleCategoryIds = useMemo(
    () => filteredVisibleCategories.map((cat) => cat.id),
    [filteredVisibleCategories]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || filteredVisibleCategoryIds.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    const updateActiveCategory = () => {
      const containerTop = container.getBoundingClientRect().top;
      let nextActiveId = filteredVisibleCategoryIds[0];

      for (const categoryId of filteredVisibleCategoryIds) {
        const section = categorySectionRefs.current[categoryId];
        if (!section) continue;

        const sectionTop = section.getBoundingClientRect().top - containerTop;
        if (sectionTop <= ACTIVE_CATEGORY_THRESHOLD) {
          nextActiveId = categoryId;
        } else {
          break;
        }
      }

      setActiveCategoryId((current) => (current === nextActiveId ? current : nextActiveId));
    };

    updateActiveCategory();
    container.addEventListener('scroll', updateActiveCategory, { passive: true });
    window.addEventListener('resize', updateActiveCategory);

    return () => {
      container.removeEventListener('scroll', updateActiveCategory);
      window.removeEventListener('resize', updateActiveCategory);
    };
  }, [filteredVisibleCategoryIds]);

  const suitcaseProgress = useMemo(
    () => getSuitcaseItemProgress(displaySuitcase.suitcase_items),
    [displaySuitcase.suitcase_items]
  );

  const handleNavigateToCategory = useCallback((categoryId: string) => {
    const section = categorySectionRefs.current[categoryId];
    const container = scrollContainerRef.current;
    if (!section || !container) return;

    const containerTop = container.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const scrollOffset = 0;

    container.scrollTo({
      top: Math.max(0, container.scrollTop + (sectionTop - containerTop) - scrollOffset),
      behavior: 'smooth',
    });

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    setHighlightedCategoryId(categoryId);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedCategoryId(null);
    }, 1000);
  }, []);

  const handleReorderCategory = useCallback(
    (categoryId: string, targetIndex: number) => {
      if (readOnly) return;
      const targetCategoryId = filteredVisibleCategories[targetIndex]?.id;
      if (!targetCategoryId) return;
      const fullTargetIndex = visibleCategoryIds.indexOf(targetCategoryId);
      if (fullTargetIndex < 0) return;
      reorderCategoryToIndex(categoryId, fullTargetIndex, visibleCategoryIds);
    },
    [readOnly, reorderCategoryToIndex, visibleCategoryIds, filteredVisibleCategories]
  );

  const handleActivateOptional = async (categoryId: string) => {
    if (useTdOverlayMode && onCategorySetupOverlayChange) {
      onCategorySetupOverlayChange((prevOverlay) => {
        const base = resolveCategorySetup(resolvedBaseTemplate);
        const next = enableOptionalSystemCategory({ ...base, ...prevOverlay }, categoryId);
        return {
          ...prevOverlay,
          [categoryId]: next[categoryId],
        };
      });
      return;
    }
    if (onActivateOptionalCategory) {
      await onActivateOptionalCategory(categoryId);
    } else {
      activateOptionalCategory(categoryId);
    }
  };

  const handleRestoreHiddenCategory = (categoryId: string) => {
    if (useTdOverlayMode && onCategorySetupOverlayChange) {
      onCategorySetupOverlayChange((prevOverlay) => {
        const merged = { ...resolveCategorySetup(resolvedBaseTemplate), ...prevOverlay };
        if (merged[categoryId]?.enabled !== false) return prevOverlay;
        const next = setCategoryEnabled(merged, categoryId, true);
        return { ...prevOverlay, [categoryId]: next[categoryId] };
      });
      return;
    }
    toggleCategory(categoryId);
  };

  const handleShowAllHidden = () => {
    if (useTdOverlayMode && onCategorySetupOverlayChange) {
      onCategorySetupOverlayChange((prevOverlay) => {
        let merged = { ...resolveCategorySetup(resolvedBaseTemplate), ...prevOverlay };
        const nextOverlay = { ...prevOverlay };
        for (const categoryId of Object.keys(merged)) {
          if (merged[categoryId]?.enabled === false) {
            merged = setCategoryEnabled(merged, categoryId, true);
            nextOverlay[categoryId] = merged[categoryId];
          }
        }
        return nextOverlay;
      });
      return;
    }
    showAll();
  };

  const selectedItemData = displaySuitcase.suitcase_items?.find(i => i.name === selectedItemName);
  const canToggleViewMode = !!onSetViewMode && !isTdTemplate(suitcase);
  const canUseTemplateAction =
    !!onUseTemplate && isTdTemplate(suitcase) && panelViewMode === 'viewer';

  return (    <div className="relative flex flex-col lg:flex-row gap-0 items-stretch w-full h-full lg:min-h-0 lg:overflow-y-hidden lg:overflow-x-visible bg-transparent">
      {/* LEFT: Items List */}
      <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden lg:overflow-visible">
        <SuitcaseEditorToolbar
          readOnly={readOnly}
          isSeedingAi={isSeedingAi}
          onOpenAiModal={() => setShowAiModal(true)}
          onOpenBlacklist={onOpenBlacklist}
          blacklistCount={blacklistCount}
          isBlacklistFlashing={isBlacklistFlashing}
          visibleCategories={filteredVisibleCategories}
          activeCategoryId={activeCategoryId}
          incompleteCountsByCategoryId={incompleteCountsByCategoryId}
          categoryStatusFilter={categoryStatusFilter}
          onCategoryStatusFilterChange={setCategoryStatusFilter}
          onNavigateToCategory={handleNavigateToCategory}
          onReorderCategory={handleReorderCategory}
          onAddCategory={() => setIsAddingNewCategory(true)}
          canToggleViewMode={canToggleViewMode}
          canUseTemplateAction={canUseTemplateAction}
          panelViewMode={panelViewMode}
          onSetViewMode={onSetViewMode}
          onUseTemplate={onUseTemplate}
        />
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 lg:px-10 pb-4 md:pb-6 lg:pb-10 lg:pr-6 custom-scrollbar relative">
        <div className="pt-6 space-y-8">
          {/* Toast localizzato sopra la lista */}
          <SuitcaseToast {...toast} />

        {showGuestWarning && (
          <div
            role="status"
            className="rounded-2xl border border-slate-600/25 bg-slate-950/50 backdrop-blur-sm px-4 py-4 shadow-lg shadow-black/20 ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                <CloudOff className="w-4 h-4 text-slate-400" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    {guestDraftIsTemplate ? 'Template temporaneo' : 'Valigia temporanea'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    Non salvato
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                  {guestDraftIsTemplate
                    ? 'Effettua il login per salvare questo template.'
                    : 'Effettua il login per salvare questa valigia.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {(availableOptionalCategories.length > 0 || hiddenCategoriesList.length > 0) && (
          <div className="grid grid-cols-1 gap-3 md:hidden">
            <OptionalCategoriesPanel
              categories={availableOptionalCategories}
              onActivate={handleActivateOptional}
              readOnly={categorySectionsReadOnly}
            />
            <HiddenCategoriesPanel
              categories={hiddenCategoriesList}
              onRestore={handleRestoreHiddenCategory}
              onRestoreAll={handleShowAllHidden}
              readOnly={categorySectionsReadOnly}
            />
          </div>
        )}

        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-stretch">
          <OptionalCategoriesPanel
            categories={availableOptionalCategories}
            onActivate={handleActivateOptional}
            readOnly={categorySectionsReadOnly}
          />
          <HiddenCategoriesPanel
            categories={hiddenCategoriesList}
            onRestore={handleRestoreHiddenCategory}
            onRestoreAll={handleShowAllHidden}
            readOnly={categorySectionsReadOnly}
          />
          <SuitcaseToolbarProgressBox
            checkedCount={suitcaseProgress.checked}
            totalCount={suitcaseProgress.total}
            progressPerc={suitcaseProgress.percentage}
            variant="panels"
          />
        </div>

        {isAddingNewCategory && !readOnly && (
          <NewCategoryPanel
            newCatName={newCatName}
            onNameChange={setNewCatName}
            newCatIcon={newCatIcon}
            showIconPicker={showIconPicker}
            onToggleIconPicker={() => setShowIconPicker(!showIconPicker)}
            onSelectIcon={setNewCatIcon}
            onCloseIconPicker={() => setShowIconPicker(false)}
            onCancel={() => setIsAddingNewCategory(false)}
            onSave={handleAddNewCategory}
          />
        )}
        
        {/* LISTA CATEGORIE VISIBILI */}
        <div className="suitcase-category-sections space-y-4">
        {filteredVisibleCategories.map((cat) => {
          const catCheckedCount = groupedItems[cat.name].filter(i => i.is_checked).length;
          const catTotalCount = groupedItems[cat.name].length;
          const catPerc = catTotalCount > 0 ? Math.round((catCheckedCount / catTotalCount) * 100) : 0;
          const isCatComplete = catTotalCount > 0 && catCheckedCount === catTotalCount;

          return (
            <div
              key={cat.id}
              data-category-id={cat.id}
              ref={(el) => {
                categorySectionRefs.current[cat.id] = el;
              }}
              className={`${SUITCASE_CATEGORY_SECTION_SHELL_CLASS} group/section scroll-mt-4 transition-shadow duration-300 overflow-visible ${
                highlightedCategoryId === cat.id
                  ? 'ring-2 ring-indigo-500/60 shadow-indigo-500/20'
                  : ''
              }`}
            >
            {/* Category Header Bar */}
            <div className={SUITCASE_CATEGORY_SECTION_HEADER_CLASS}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex flex-col gap-px shrink-0 rounded-md border border-white/10 p-px"
                  role="group"
                  aria-label="Ordine categoria"
                >
                  <button
                    onClick={() => !readOnly && moveCategory(cat.id, 'up', visibleCategoryIds)}
                    disabled={readOnly || visibleCategoryIds.indexOf(cat.id) <= 0}
                    className="w-7 h-7 rounded bg-slate-900/50 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta categoria su'}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => !readOnly && moveCategory(cat.id, 'down', visibleCategoryIds)}
                    disabled={readOnly || visibleCategoryIds.indexOf(cat.id) >= visibleCategoryIds.length - 1}
                    className="w-7 h-7 rounded bg-slate-900/50 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta categoria giù'}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-white/5 shadow-lg shadow-indigo-500/5 shrink-0">
                  <ItemCategoryIcon category={cat.name} iconKey={cat.icon_key} className="w-5.5 h-5.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-[13px] md:text-[15px] uppercase font-semibold text-slate-200 tracking-wide leading-none mb-1 truncate">{cat.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className={`w-3 h-3 shrink-0 ${isCatComplete ? 'text-emerald-500' : 'text-indigo-400'}`} />
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                      {catCheckedCount}/{catTotalCount} <span className="opacity-40 mx-0.5">•</span> {catPerc}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => !readOnly && setActiveCategoryForAdd(cat.name === activeCategoryForAdd ? null : cat.name)}
                    disabled={readOnly}
                    className="w-9 h-9 rounded-full bg-slate-900/50 hover:bg-white/10 text-indigo-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Aggiungi oggetto'}
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => !readOnly && toggleCategory(cat.id)}
                    disabled={readOnly}
                    className="w-9 h-9 rounded-full bg-slate-900/50 hover:bg-rose-500/10 text-rose-400/80 hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/50 disabled:hover:text-rose-400/80"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      !readOnly &&
                      onDeleteCategory?.({
                        id: cat.id,
                        name: cat.name,
                        source: cat.source,
                      })
                    }
                    disabled={readOnly}
                    className="w-9 h-9 rounded-full bg-slate-900/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/50 disabled:hover:text-slate-400"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Elimina definitivamente la categoria'}
                  >
                    <FolderX className="w-4 h-4" />
                  </button>
              </div>
            </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedItems[cat.name].map((item, itemIndex) => (
                    <SuitcaseItemRow
                      key={item.id}
                      item={item}
                      readOnly={readOnly}
                      onUpdate={onUpdateItem}
                      onDelete={onDeleteItem}
                      highlightId={highlightItemId}
                      override={overrides[normalizeItemName(item.name)]}
                      onLinkBuildSearch={onLinkBuildSearch}
                      isSelected={selectedItemName === item.name}
                      onSelect={() => onSelectItem(item.name === selectedItemName ? null : item.name)}
                      moveTargets={visibleCategories.filter((target) => target.name !== cat.name)}
                      onMoveToCategory={(targetName) => onUpdateItem(item.id, { category: targetName })}
                      reorderEnabled={!readOnly && !!onSwapItemsInCategory}
                      isDragTarget={
                        dropTarget?.categoryId === cat.id && dropTarget.index === itemIndex
                      }
                      onDragStart={handleItemDragStart(cat.id, item.id)}
                      onDragOver={handleItemDragOver(cat.id, itemIndex)}
                      onDragLeave={handleItemDragLeave(cat.id, itemIndex)}
                      onDrop={handleItemDrop(cat.id, cat.name, itemIndex)}
                      onDragEnd={resetItemDragState}
                    />
                  ))}

                  {activeCategoryForAdd === cat.name && !readOnly && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl border border-indigo-500/30 bg-slate-900/60 animate-in fade-in slide-in-from-top-1 shadow-lg shadow-indigo-500/10 h-[50px]">
                      <input
                        autoFocus
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat.name)}
                        placeholder="Cosa vuoi aggiungere?"
                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder:text-slate-600 font-medium"
                      />
                      <button
                        onClick={() => handleAdd(cat.name)}
                        className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-all font-bold shadow-lg shadow-indigo-500/20"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </div>

                {catTotalCount === 0 && !activeCategoryForAdd && (
                  <div className="py-4 text-center">
                    <p className="text-[11px] text-slate-700 italic flex items-center justify-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Nessun oggetto in {cat.name.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
        </div>
        </div>
      </div>

      {/* RIGHT: Sidebar Suggestions Unificata (Sticky & Collapsible) */}
      <SuitcaseSidePanel 
        isCollapsible={true} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sticky={true}
      >
        <CategorySuggestionPanel
          category={selectedItemData?.category || 'General'}
          selectedItem={selectedItemData ? {
            name: selectedItemData.name,
            category: selectedItemData.category,
            tags: selectedItemData.affiliate_tags || []
          } : null}
          itemMap={itemMap}
          categoryMap={categoryMap}
          overrides={overrides}
          globalMap={globalMap}
          placeholders={placeholders}
          onLinkBuild={onLinkBuild}
          onLinkBuildSearch={onLinkBuildSearch}
        />
      </SuitcaseSidePanel>

      <SuitcaseMobileSuggestionsDrawer
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <CategorySuggestionPanel
          category={selectedItemData?.category || 'General'}
          selectedItem={selectedItemData ? {
            name: selectedItemData.name,
            category: selectedItemData.category,
            tags: selectedItemData.affiliate_tags || []
          } : null}
          itemMap={itemMap}
          categoryMap={categoryMap}
          overrides={overrides}
          globalMap={globalMap}
          placeholders={placeholders}
          onLinkBuild={onLinkBuild}
          onLinkBuildSearch={onLinkBuildSearch}
        />
      </SuitcaseMobileSuggestionsDrawer>

      <AiSuggestionsModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        initialCategories={aiInitialCategories}
        onGenerate={(categories, mode, options) => {
          onSeedAi(categories, mode, options);
        }}
        onShowMore={onShowMoreAi}
        onAccept={onAcceptAiSuggestion}
        onReject={onRejectAiSuggestion}
        showToast={showToast}
        isGenerating={isSeedingAi}
        suggestions={aiSuggestions}
        hasMore={hasMoreAi}
        quotaFeedback={aiQuotaFeedback}
        exhaustedCategories={exhaustedCategories}
      />
    </div>
  );
};

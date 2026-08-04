import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  filterCategoriesByStatus,
  getIncompleteItemCount,
  getSuitcaseItemProgress,
  CategoryStatusFilter,
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
import { CategorySuggestionPanel } from './CategorySuggestionPanel';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { SuitcaseMobileSuggestionsDrawer } from './SuitcaseMobileSuggestionsDrawer';
import { SuitcaseToast } from '../SuitcaseFloatingPanel/components/SuitcaseToast';
import { AiSuggestionsModal } from './AiSuggestionsModal';
import { SuitcaseEditorToolbar } from './SuitcaseEditorToolbar';
import { NewCategoryPanel } from './NewCategoryPanel';
import { CategorySection } from './CategorySection';
import { CategoryPanelsHeader } from './CategoryPanelsHeader';
import { GuestDraftBanner } from './GuestDraftBanner';
import { isTdTemplate, getDraftWorkspaceKind } from '@/utils/suitcaseDomain';
import { CategorySetupMap } from '@/types/packingCatalog';
import {
  composeTdTemplateItemsAsync,
  ensureTdTemplateCategorySetup,
} from '@/services/suitcase/packingCompositionService';
import { useBelowLg } from '@/hooks/ui/useBelowLg';
import { useHideOnScrollDown } from '@/hooks/ui/useHideOnScrollDown';

import { ToastVariant, CATEGORY_ADDED_TOAST } from '@/types/toast';

/**
 * Tolleranza sub-pixel per riconoscere il fondo dello scroll: scrollTop/clientHeight/scrollHeight
 * possono essere frazionari (zoom, DPI, scrollbar nascoste) e non combaciare al pixel esatto.
 * 1px è il minimo che assorbe questo arrotondamento senza mascherare scroll reali.
 */
const SCROLL_BOTTOM_EPSILON_PX = 1;

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
  /** Apertura del modale AI controllata dall'esterno (es. dal menu "Azione" nell'header).
   *  Se non fornita, il componente usa uno stato locale (comportamento legacy). */
  aiModalOpen?: boolean;
  onAiModalOpenChange?: (open: boolean) => void;
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
  aiModalOpen,
  onAiModalOpenChange,
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

  // SoT breakpoint: useBelowLg (HERO_STACKED_QUERY = sotto LG). Desktop = !isBelowLg
  // (equivalente a DESKTOP_MIN_QUERY). Sidebar aperta su desktop; smart toolbar solo <lg.
  const isBelowLg = useBelowLg();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isBelowLg);

  useEffect(() => {
    setIsSidebarOpen(!isBelowLg);
  }, [isBelowLg]);

  const [newItemName, setNewItemName] = useState("");
  const [activeCategoryForAdd, setActiveCategoryForAdd] = useState<string | null>(null);
  // Apertura modale AI: controllata dall'esterno se forniti i props, altrimenti stato locale.
  const [internalAiModalOpen, setInternalAiModalOpen] = useState(false);
  const showAiModal = aiModalOpen ?? internalAiModalOpen;
  const setShowAiModal = onAiModalOpenChange ?? setInternalAiModalOpen;
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Package");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Barra categorie "intelligente" (solo <lg, vista editor/viewer): si nasconde scorrendo
  // verso il basso e riappare scorrendo verso l'alto, riusando il container scrollabile esistente.
  // Il gate è esplicitamente legato sia al breakpoint sia alla modalità della vista: così il
  // dominio della feature è chiaro e non si attiva da solo se SuitcaseEditorView verrà riusato altrove.
  const enableSmartToolbar =
    isBelowLg && (panelViewMode === 'viewer' || panelViewMode === 'editor');
  const isToolbarHidden = useHideOnScrollDown(scrollContainerRef, enableSmartToolbar);
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

  const allCategories = useMemo(
    () => buildDisplayCategories(displaySuitcase),
    [displaySuitcase],
  );

  const visibleCategories = allCategories.filter(
    (cat) => cat.source === 'system' || !resolvedIsHidden(cat.id)
  );

  const hiddenCategoriesList = getRestorableHiddenCategories(displaySuitcase, resolvedIsHidden);
  const availableOptionalCategories = getAvailableOptionalCategories(displaySuitcase);
  const categorySectionsReadOnly = readOnly && !useTdOverlayMode;
  const visibleCategoryIds = visibleCategories.map((cat) => cat.id);
  const aiInitialCategories = getEnabledSystemCategoryNames(displaySuitcase);

  const groupedItems = useMemo(
    () => buildGroupedItemsByCategory(displaySuitcase, allCategories),
    [displaySuitcase, allCategories],
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
      const ids = filteredVisibleCategoryIds;

      // Caso fondo scroll: le ultime categorie possono essere troppo basse per diventare mai la
      // sezione predominante o per risalire verso il top. Quando la viewport ha raggiunto il fondo
      // (e c'è davvero spazio scrollabile) si evidenzia sempre l'ultima categoria, che è quella
      // realmente in vista. Senza questo caso l'highlight resterebbe "indietro" di alcune voci.
      const isScrolledToBottom =
        container.scrollHeight > container.clientHeight &&
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - SCROLL_BOTTOM_EPSILON_PX;

      if (isScrolledToBottom) {
        const lastId = ids[ids.length - 1];
        setActiveCategoryId((current) => (current === lastId ? current : lastId));
        return;
      }

      // Caso generale: si evidenzia la categoria con la maggiore area effettivamente visibile nella
      // viewport (intersezione sezione↔scrollport). È robusto con categorie molto alte o molto basse
      // e non dipende da soglie/offset fissi, quindi segue lo scroll senza salti né ritardi.
      const containerRect = container.getBoundingClientRect();
      let nextActiveId = ids[0];
      let maxVisibleHeight = -1;

      for (const categoryId of ids) {
        const section = categorySectionRefs.current[categoryId];
        if (!section) continue;

        const rect = section.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, containerRect.top);
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
        const visibleHeight = visibleBottom - visibleTop;

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          nextActiveId = categoryId;
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

  return (    <div className="relative flex flex-col lg:flex-row gap-0 items-stretch w-full h-full lg:min-h-0 lg:overflow-y-hidden lg:overflow-x-visible bg-slate-900 lg:bg-transparent">
      {/* LEFT: Items List */}
      <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden lg:overflow-visible">
        {/* Wrapper "barra intelligente": su <lg collassa con transizione fluida (grid-rows + opacity,
            nessun layout shift); su ≥lg resta sempre visibile e in overflow-visible (niente clipping
            di badge/popover). La logica di direzione vive in useHideOnScrollDown.
            IMPORTANTE: la doppia struttura (outer `grid grid-template-rows` + inner `overflow-hidden min-h-0`)
            è ciò che permette di animare l'altezza da 1fr a 0fr in modo fluido SENZA layout shift.
            Non semplificare rimuovendo il wrapper: senza questo schema la transizione tornerebbe a
            "saltare" l'altezza del contenuto. */}
        <div
          className={`shrink-0 grid transition-[grid-template-rows,opacity] duration-300 ease-out lg:grid-rows-[1fr] lg:opacity-100 ${
            isToolbarHidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden lg:overflow-visible min-h-0">
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
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 lg:px-10 pb-4 md:pb-6 lg:pb-10 lg:pr-6 custom-scrollbar relative">
        <div className="pt-6 space-y-8">
          {/* Toast localizzato sopra la lista */}
          <SuitcaseToast {...toast} />

        {showGuestWarning && <GuestDraftBanner isTemplate={guestDraftIsTemplate} />}

        <CategoryPanelsHeader
          availableOptionalCategories={availableOptionalCategories}
          hiddenCategoriesList={hiddenCategoriesList}
          readOnly={categorySectionsReadOnly}
          onActivateOptional={handleActivateOptional}
          onRestoreHidden={handleRestoreHiddenCategory}
          onRestoreAllHidden={handleShowAllHidden}
          progress={suitcaseProgress}
        />

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
          const items = groupedItems[cat.name] ?? [];
          const checked = items.filter((i) => i.is_checked).length;
          const total = items.length;
          const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
          return (
            <CategorySection
              key={cat.id}
              category={cat}
              items={items}
              categoryProgress={{
                checked,
                total,
                percentage,
                isComplete: total > 0 && checked === total,
              }}
              readOnly={!!readOnly}
              highlighted={highlightedCategoryId === cat.id}
              visibleCategoryIds={visibleCategoryIds}
              sectionRef={(el) => {
                categorySectionRefs.current[cat.id] = el;
              }}
              selection={{
                highlightItemId,
                selectedItemName,
                onSelectItem,
              }}
              itemActions={{
                overrides,
                moveTargets: visibleCategories.filter((target) => target.name !== cat.name),
                onUpdateItem,
                onDeleteItem,
                onLinkBuildSearch,
              }}
              drag={{
                dropTarget,
                onSwapItemsInCategory,
                handleItemDragStart,
                handleItemDragOver,
                handleItemDragLeave,
                handleItemDrop,
                resetItemDragState,
              }}
              activeCategoryForAdd={activeCategoryForAdd}
              newItemName={newItemName}
              onNewItemNameChange={setNewItemName}
              onToggleAdd={() =>
                setActiveCategoryForAdd(cat.name === activeCategoryForAdd ? null : cat.name)
              }
              onConfirmAdd={() => handleAdd(cat.name)}
              onMoveCategory={(direction) => moveCategory(cat.id, direction, visibleCategoryIds)}
              onHideCategory={() => toggleCategory(cat.id)}
              onDeleteCategory={
                onDeleteCategory
                  ? () =>
                      onDeleteCategory({
                        id: cat.id,
                        name: cat.name,
                        source: cat.source,
                      })
                  : undefined
              }
            />
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
          // 'General' è solo un fallback UI quando nessun oggetto è selezionato:
          // non è una categoria del dominio.
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
          // 'General' è solo un fallback UI quando nessun oggetto è selezionato:
          // non è una categoria del dominio.
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

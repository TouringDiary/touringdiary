import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ListRestart, FolderPlus, Eye, EyeOff, CheckSquare, MinusCircle, Trash2 } from 'lucide-react';
import { TemplateCategoryIcon, ItemCategoryIcon, getSuitcaseItemProgress } from './SuitcaseUtils';
import {
  buildDisplayCategories,
  enableOptionalSystemCategory,
  getAvailableOptionalCategories,
  getRestorableHiddenCategories,
  mergeTemplateWithOverlay,
  resolveCategorySetup,
  setCategoryEnabled,
} from '@/domain/packing/categorySetup';
import { ADDITIONAL_CATEGORY_NAMES } from '@/domain/packing/packingCategories';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { CountBadge } from '@/components/ui/CountBadge';
import { CategorySetupMap } from '@/types/packingCatalog';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import { isTdTemplate } from '@/utils/suitcaseDomain';
import { composeTdTemplateItemsAsync, ensureTdTemplateCategorySetup } from '@/services/suitcase/packingCompositionService';
import { HiddenCategoriesPanel } from './HiddenCategoriesPanel';
import { OptionalCategoriesPanel } from './OptionalCategoriesPanel';
import { CategoryMobileDialog } from './CategoryMobileDialog';
import { DraggableSlider } from '@/components/common/DraggableSlider';

interface TemplatePreviewProps {
  template: Suitcase | null;
  sourceTab?: 'trip' | 'saved' | 'default';
  onAddCategory?: (id: string) => void;
  onDeleteCategory?: (category: { id: string; name: string; source: string }) => void;
  onUpdateSuitcaseLocal?: (id: string, updates: Partial<Suitcase>) => void;
  readOnly?: boolean;
  categorySetupOverlay?: CategorySetupMap;
  onCategorySetupOverlayChange?: (
    updater: (prev: CategorySetupMap) => CategorySetupMap
  ) => void;
  /**
   * Riporta al parent lo stato del carosello categorie (avanzamento scroll + numero di tile) così
   * che il `CarouselPositionIndicator` possa essere renderizzato nell'intestazione del box padre.
   * La fonte di verità resta `categoryCarouselProgress` qui dentro: questo è solo un report in sola
   * lettura, nessuna logica del carosello viene spostata o duplicata.
   */
  onCarouselStateChange?: (state: { progress: number; count: number }) => void;
}

const PREVIEW_LABELS: Record<'trip' | 'saved' | 'default', string> = {
  default: "TEMPLATE PRONTO ALL'USO",
  saved: 'VALIGIA SALVATA',
  trip: 'VALIGIA ASSOCIATA AL DIARIO DI VIAGGIO',
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  sourceTab = 'default',
  onAddCategory,
  onDeleteCategory,
  onUpdateSuitcaseLocal,
  readOnly: readOnlyProp,
  categorySetupOverlay,
  onCategorySetupOverlayChange,
  onCarouselStateChange,
}) => {
  const isTd = template ? isTdTemplate(template) : false;
  const isReadOnly = readOnlyProp ?? isTd;
  const useOverlayMode = isTd && !!onCategorySetupOverlayChange;

  const resolvedBaseTemplate = useMemo(() => {
    if (!template) return null;
    return isTd ? ensureTdTemplateCategorySetup(template) : template;
  }, [template, isTd]);

  const editableTemplate = useMemo(
    () =>
      resolvedBaseTemplate
        ? mergeTemplateWithOverlay(resolvedBaseTemplate, categorySetupOverlay)
        : null,
    [resolvedBaseTemplate, categorySetupOverlay]
  );

  const { toggleCategory, showAll, isHidden, activateOptionalCategory } = useHiddenCategories(
    useOverlayMode ? undefined : template?.id,
    useOverlayMode ? undefined : editableTemplate ?? undefined,
    (patch) => {
      if (template?.id && onUpdateSuitcaseLocal) {
        onUpdateSuitcaseLocal(template.id, {
          ui_state: {
            ...template.ui_state,
            category_setup: patch.category_setup,
            hidden_category_ids: patch.hidden_category_ids,
            dismissed_category_ids: patch.dismissed_category_ids,
            category_display_order: patch.category_display_order,
          },
        });
      }
    }
  );

  const [displayItems, setDisplayItems] = useState<SuitcaseItem[]>([]);
  const [optionalPopoverOpen, setOptionalPopoverOpen] = useState(false);
  const [hiddenPopoverOpen, setHiddenPopoverOpen] = useState(false);
  const [categoryCarouselProgress, setCategoryCarouselProgress] = useState(0);

  useEffect(() => {
    if (!editableTemplate) {
      setDisplayItems([]);
      return;
    }

    if (!isTd) {
      setDisplayItems(editableTemplate.suitcase_items ?? []);
      return;
    }

    let cancelled = false;

    void composeTdTemplateItemsAsync(editableTemplate, {
      categorySetup: resolveCategorySetup(editableTemplate),
    }).then((items) => {
      if (!cancelled) {
        setDisplayItems(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editableTemplate, isTd]);

  const overlayIsHidden = (categoryId: string): boolean => {
    if (!editableTemplate) return false;
    const setup = resolveCategorySetup(editableTemplate);
    if (setup[categoryId]?.enabled === false) return true;
    return (editableTemplate.ui_state?.hidden_category_ids ?? []).includes(categoryId);
  };

  const resolvedIsHidden = useOverlayMode ? overlayIsHidden : isHidden;

  const categoryCounts = useMemo(() => {
    return displayItems.reduce((acc: Record<string, number>, item) => {
      const cat = normalizeCategoryName(item.category);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [displayItems]);

  const allCategories = useMemo(() => {
    if (!editableTemplate) return [];
    return buildDisplayCategories(editableTemplate);
  }, [editableTemplate]);

  const visibleCategories = useMemo(() => {
    return allCategories.filter((cat) => cat.source === 'system' || !resolvedIsHidden(cat.id));
  }, [allCategories, resolvedIsHidden]);

  const hiddenCategories = useMemo(() => {
    if (!editableTemplate) return [];
    return getRestorableHiddenCategories(editableTemplate, resolvedIsHidden);
  }, [editableTemplate, resolvedIsHidden]);

  const availableOptionalCategories = useMemo(() => {
    if (!editableTemplate) return [];
    return getAvailableOptionalCategories(editableTemplate);
  }, [editableTemplate]);

  const progress = useMemo(
    () => getSuitcaseItemProgress(displayItems),
    [displayItems]
  );

  const handleActivateOptional = (categoryId: string) => {
    if (useOverlayMode && resolvedBaseTemplate && onCategorySetupOverlayChange) {
      onCategorySetupOverlayChange((prevOverlay) => {
        const base = resolveCategorySetup(resolvedBaseTemplate);
        const next = enableOptionalSystemCategory(
          { ...base, ...prevOverlay },
          categoryId
        );
        return {
          ...prevOverlay,
          [categoryId]: next[categoryId],
        };
      });
      return;
    }

    if (isReadOnly) return;
    activateOptionalCategory(categoryId);
  };

  const handleRestoreHiddenCategory = (categoryId: string) => {
    if (useOverlayMode && resolvedBaseTemplate && onCategorySetupOverlayChange) {
      onCategorySetupOverlayChange((prevOverlay) => {
        const merged = { ...resolveCategorySetup(resolvedBaseTemplate), ...prevOverlay };
        if (merged[categoryId]?.enabled !== false) return prevOverlay;
        const next = setCategoryEnabled(merged, categoryId, true);
        return { ...prevOverlay, [categoryId]: next[categoryId] };
      });
      return;
    }

    if (!isReadOnly) toggleCategory(categoryId);
  };

  const handleShowAllHidden = () => {
    if (useOverlayMode && resolvedBaseTemplate && onCategorySetupOverlayChange) {
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

    if (!isReadOnly) showAll();
  };

  const handleDeactivateOptional = (categoryId: string) => {
    // Coerente con le altre action (activate/restore/showAll): disponibile solo in overlay mode,
    // mai in read-only o fuori overlay. Il gate su `useOverlayMode` rispecchia quello delle altre.
    if (!useOverlayMode || !resolvedBaseTemplate || !onCategorySetupOverlayChange) return;
    onCategorySetupOverlayChange((prevOverlay) => {
      const base = resolveCategorySetup(resolvedBaseTemplate);
      const next = setCategoryEnabled({ ...base, ...prevOverlay }, categoryId, false);
      return {
        ...prevOverlay,
        [categoryId]: next[categoryId],
      };
    });
  };

  const isActiveOptionalCategory = (categoryId: string, categoryName: string): boolean => {
    if (!editableTemplate) return false;
    if (!(ADDITIONAL_CATEGORY_NAMES as readonly string[]).includes(categoryName)) {
      return false;
    }
    const setup = resolveCategorySetup(editableTemplate);
    return setup[categoryId]?.enabled !== false;
  };

  const previewSectionsReadOnly = isReadOnly && !useOverlayMode;
  const showCategoryDelete = !!onDeleteCategory && sourceTab !== 'default' && !isTd;

  const handleCategoryCarouselScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setCategoryCarouselProgress(0);
      return;
    }
    setCategoryCarouselProgress(el.scrollLeft / maxScroll);
  }, []);

  useEffect(() => {
    setCategoryCarouselProgress(0);
  }, [template?.id, visibleCategories.length]);

  // Report (sola lettura) dello stato del carosello verso il parent, che monta l'indicatore
  // nell'intestazione del box. Nessuna logica spostata: si limita a rispecchiare lo stato locale.
  useEffect(() => {
    onCarouselStateChange?.({
      progress: categoryCarouselProgress,
      count: visibleCategories.length,
    });
  }, [categoryCarouselProgress, visibleCategories.length, onCarouselStateChange]);

  if (!template || !editableTemplate) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-xs italic rounded-xl border border-dashed border-slate-800 p-6 text-center h-full">
        Scegli un template per visualizzare la preview
      </div>
    );
  }

  const renderCategoryTile = (cat: (typeof visibleCategories)[number]) => {
    const count = categoryCounts[cat.name] || 0;
    const showDeactivateOptional =
      useOverlayMode && isActiveOptionalCategory(cat.id, cat.name);

    return (
      <div
        className={`group relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border border-white/5 bg-slate-800/20 transition-all max-lg:gap-0.5 max-lg:p-1.5 max-lg:rounded-xl max-lg:shrink-0 max-lg:w-[4.25rem] ${count === 0 ? 'opacity-30' : 'opacity-100'}`}
      >
        {showDeactivateOptional && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeactivateOptional(cat.id);
            }}
            className="absolute top-2 right-2 p-1 rounded-lg bg-slate-900/60 text-slate-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-emerald-300 transition-all z-local-overlay max-lg:top-1 max-lg:right-1 max-lg:p-0.5 max-lg:rounded-md"
            title={`Disattiva ${cat.name}`}
            aria-label={`Disattiva ${cat.name}`}
          >
            <MinusCircle className="w-3 h-3 max-lg:w-2.5 max-lg:h-2.5" />
          </button>
        )}

        {!useOverlayMode && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 lg:group-hover:opacity-100 transition-all z-local-overlay max-lg:top-1 max-lg:right-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isReadOnly) return;
                toggleCategory(cat.id);
              }}
              disabled={isReadOnly}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900/70 text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-amber-400 disabled:hover:bg-slate-900/70 max-lg:w-6 max-lg:h-6 max-lg:rounded-md"
              title={isReadOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
              aria-label={isReadOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
            >
              <Eye className="w-4 h-4 max-lg:w-3 max-lg:h-3" aria-hidden />
            </button>
            {showCategoryDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isReadOnly) return;
                  onDeleteCategory?.({
                    id: cat.id,
                    name: cat.name,
                    source: cat.source,
                  });
                }}
                disabled={isReadOnly}
                className="p-1 rounded-lg bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-900/60 disabled:hover:text-slate-400 max-lg:p-0.5 max-lg:rounded-md"
                title="Elimina categoria"
                aria-label={`Elimina categoria ${cat.name}`}
              >
                <Trash2 className="w-3 h-3 max-lg:w-2.5 max-lg:h-2.5 text-red-500" />
              </button>
            )}
          </div>
        )}

        <div className="relative">
          <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-2xl flex items-center justify-center bg-slate-800/40 text-slate-400 lg:group-hover:text-indigo-400 transition-colors overflow-hidden max-lg:w-9 max-lg:h-9 max-lg:rounded-xl">
            <ItemCategoryIcon category={cat.name} iconKey={cat.icon_key} className="text-[22px] 2xl:text-[26px] leading-none max-lg:text-base" />
          </div>
          {count > 0 && (
            <>
              <CountBadge
                count={count}
                size="xs"
                variant="indigo-light"
                position="overlay-corner"
                className="animate-in zoom-in duration-300 lg:hidden"
                aria-hidden
              />
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-400 hidden lg:flex items-center justify-center text-[12px] font-bold text-white ring-1 ring-slate-900 shadow-lg animate-in zoom-in duration-300 leading-none">
                {count}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[7px] 2xl:text-[9px] text-slate-500 uppercase tracking-widest font-black text-center line-clamp-1 px-1 max-lg:text-[6px] max-lg:tracking-wider max-lg:line-clamp-2 max-lg:px-0.5 max-lg:leading-tight">{cat.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 space-y-3 sticky top-4 max-lg:p-2 max-lg:space-y-2 max-lg:static max-lg:top-auto">
      <div className="flex items-start gap-3 pb-3 border-b border-slate-800 max-lg:gap-2 max-lg:pb-1.5">
        <div className="p-2 rounded-xl bg-slate-800/50 flex items-center justify-center w-11 h-11 text-xl shrink-0 max-lg:p-1.5 max-lg:rounded-lg max-lg:w-8 max-lg:h-8 max-lg:text-base">
          <TemplateCategoryIcon template={template} />
        </div>
        <div className="min-w-0 max-lg:flex-1">
          <div className="text-[13.5px] font-bold text-white leading-tight truncate max-lg:text-[11px]">
            {template.title.replace(/^Template\s+/i, '')}
          </div>
          <div className="text-[9px] xl:text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-0.5 max-lg:text-[8px] max-lg:line-clamp-1">
            {PREVIEW_LABELS[sourceTab]}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 max-lg:gap-1">
            <CheckSquare className={`w-3 h-3 shrink-0 max-lg:w-2.5 max-lg:h-2.5 ${progress.percentage === 100 ? 'text-emerald-500' : 'text-indigo-400'}`} />
            <span className="text-[9px] xl:text-[11px] text-indigo-400 font-black uppercase tracking-wider tabular-nums max-lg:text-[8px]">
              {progress.checked}/{progress.total} <span className="opacity-40 mx-0.5">•</span> {progress.percentage}%
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0 max-lg:gap-1">
          {onAddCategory && !useOverlayMode && (
            <button
              onClick={() => !isReadOnly && onAddCategory(template.id)}
              disabled={isReadOnly}
              className="hidden lg:flex w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-500/10 disabled:hover:border-indigo-500/20"
              title={isReadOnly ? 'Non disponibile per i template TD' : 'Crea categoria'}
            >
              <FolderPlus className="w-7 h-7 text-emerald-500" />
            </button>
          )}

          <div className="lg:hidden flex items-end gap-1 shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => setOptionalPopoverOpen((open) => !open)}
                aria-expanded={optionalPopoverOpen}
                aria-haspopup="dialog"
                aria-label="Categorie disponibili"
                className="relative w-8 h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-all"
              >
                <ListRestart className="w-3.5 h-3.5" />
                {availableOptionalCategories.length > 0 && (
                  <CountBadge
                    count={availableOptionalCategories.length}
                    size="xs"
                    variant="indigo-light"
                    position="overlay-corner"
                    className="scale-90"
                    aria-hidden
                  />
                )}
              </button>
              <span className="text-[6px] font-black uppercase tracking-wider text-emerald-400 leading-none">
                Disponibili
              </span>
            </div>
            <CategoryMobileDialog
              isOpen={optionalPopoverOpen}
              onClose={() => setOptionalPopoverOpen(false)}
            >
              <OptionalCategoriesPanel
                categories={availableOptionalCategories}
                onActivate={(categoryId) => {
                  handleActivateOptional(categoryId);
                  setOptionalPopoverOpen(false);
                }}
                readOnly={previewSectionsReadOnly}
              />
            </CategoryMobileDialog>

            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => setHiddenPopoverOpen((open) => !open)}
                aria-expanded={hiddenPopoverOpen}
                aria-haspopup="dialog"
                aria-label="Categorie nascoste"
                className="relative w-8 h-8 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 flex items-center justify-center transition-all"
              >
                <EyeOff className="w-3 h-3" />
                {hiddenCategories.length > 0 && (
                  <CountBadge
                    count={hiddenCategories.length}
                    size="xs"
                    variant="amber"
                    position="overlay-corner"
                    className="scale-90"
                    aria-hidden
                  />
                )}
              </button>
              <span className="text-[6px] font-black uppercase tracking-wider text-amber-400 leading-none">
                Nascoste
              </span>
            </div>
            <CategoryMobileDialog
              isOpen={hiddenPopoverOpen}
              onClose={() => setHiddenPopoverOpen(false)}
            >
              <HiddenCategoriesPanel
                categories={hiddenCategories}
                onRestore={(categoryId) => {
                  handleRestoreHiddenCategory(categoryId);
                  setHiddenPopoverOpen(false);
                }}
                onRestoreAll={() => {
                  handleShowAllHidden();
                  setHiddenPopoverOpen(false);
                }}
                readOnly={previewSectionsReadOnly}
              />
            </CategoryMobileDialog>

            {onAddCategory && !useOverlayMode && (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => !isReadOnly && onAddCategory(template.id)}
                  disabled={isReadOnly}
                  aria-label="Crea categoria"
                  className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40 flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-500/10 disabled:hover:border-indigo-500/20"
                  title={isReadOnly ? 'Non disponibile per i template TD' : 'Crea categoria'}
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
                </button>
                <span className="text-[6px] font-black uppercase tracking-wider text-indigo-400 leading-none">
                  Aggiungi
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[380px] lg:overflow-y-auto lg:custom-scrollbar pr-1 max-lg:max-h-none max-lg:overflow-visible max-lg:pr-0.5">
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/5">
          <OptionalCategoriesPanel
            categories={availableOptionalCategories}
            onActivate={handleActivateOptional}
            readOnly={previewSectionsReadOnly}
          />
          <HiddenCategoriesPanel
            categories={hiddenCategories}
            onRestore={handleRestoreHiddenCategory}
            onRestoreAll={handleShowAllHidden}
            readOnly={previewSectionsReadOnly}
          />
        </div>

        <div className="hidden lg:grid grid-cols-3 gap-3">
          {visibleCategories.map((cat) => (
            <div key={cat.id}>{renderCategoryTile(cat)}</div>
          ))}
        </div>

        <div className="lg:hidden">
          <DraggableSlider className="gap-2" onScroll={handleCategoryCarouselScroll}>
            {visibleCategories.map((cat) => (
              <div key={cat.id} className="snap-start shrink-0">
                {renderCategoryTile(cat)}
              </div>
            ))}
          </DraggableSlider>
        </div>
      </div>
    </div>
  );
};

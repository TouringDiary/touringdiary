import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Sparkles, ShoppingBag, Package, ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, Ban, CheckSquare, CloudOff, Wrench } from 'lucide-react';
import { ItemCategoryIcon, getCategoryId, CATEGORY_ICON_REGISTRY } from './SuitcaseUtils';
import { buildDisplayCategories, getAvailableOptionalCategories, getEnabledSystemCategoryNames, getRestorableHiddenCategories } from '@/domain/packing/categorySetup';
import { normalizeCategoryName } from '@/domain/packing/packingCategories';
import { Suitcase, SuitcaseItem, RuntimeAffiliateProduct, SuitcaseCategory } from '@/types/suitcase';
import { AiSuggestion } from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import { SuitcaseItemRow } from './SuitcaseItemRow';
import { CategorySuggestionPanel } from './CategorySuggestionPanel';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { normalizeItemName } from '@/utils/tagDerivation';
import { SuitcaseToast } from '../SuitcaseFloatingPanel/components/SuitcaseToast';
import { AiSuggestionsModal } from './AiSuggestionsModal';
import { SUITCASE_TOOLBAR_BTN_CLASS, SUITCASE_TOOLBAR_SHELL_CLASS, SUITCASE_VIEW_MODE_ACTION_BTN_CLASS } from './SuitcaseUtils';
import { isTdTemplate } from '@/utils/suitcaseDomain';

import { ToastVariant, CATEGORY_ADDED_TOAST } from '@/types/toast';

interface HiddenCategories {
  showHiddenCategories: boolean;
  setShowHiddenCategories: (val: boolean) => void;
  isEyeFlashing: boolean;
  enhancedHiddenCategoriesLogic: {
    toggleCategory: (id: string) => void;
    activateOptionalCategory: (id: string) => void;
    moveCategory: (id: string, direction: 'up' | 'down', visibleIds: string[]) => void;
    showAll: () => void;
    isHidden: (id: string) => boolean;
    hiddenIds: string[];
    restorableHiddenCount: number;
  };
}

interface SuitcaseEditorViewProps {
  suitcase: Suitcase;
  readOnly?: boolean;
  onUpdateItem: (itemId: string, updates: Partial<SuitcaseItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (category: string, name: string) => void;
  onUpdateSuitcase: (updates: Partial<Suitcase>) => void;
  onUpdateSuitcaseLocal?: (id: string, updates: Partial<Suitcase>) => void;
  onSeedAi: (categories?: string[], mode?: 'direct' | 'review') => void;
  onOpenBlacklist: () => void;
  autoOpenNewCategory?: boolean;
  isSeedingAi: boolean;
  aiSuggestions: AiSuggestion[];
  onAcceptAiSuggestion: (name: string, category: string) => Promise<void>;
  onRejectAiSuggestion: (name: string, category: string) => Promise<void>;
  onShowMoreAi: () => void;
  hasMoreAi: boolean;
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
}

// Componente locale per la selezione icone
const IconPicker = ({ onSelect, onClose }: { onSelect: (key: string) => void, onClose: () => void }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-slate-900 border border-white/10 rounded-3xl z-modal p-4 scrollbar-hide">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-black uppercase text-indigo-400">Scegli Icona</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-5 gap-2 h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {Object.entries(CATEGORY_ICON_REGISTRY).map(([key, icon]: [string, React.ReactElement]) => (
          <button
            key={key}
            onClick={() => { onSelect(key); onClose(); }}
            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-indigo-400 transition-all hover:scale-110"
          >
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
          </button>
        ))}
      </div>
    </div>
  );
};

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
  panelViewMode = 'editor',
  onSetViewMode
}) => {
  const { showHiddenCategories, setShowHiddenCategories, isEyeFlashing, enhancedHiddenCategoriesLogic } = hiddenCategories;
  const {
    toggleCategory,
    activateOptionalCategory,
    moveCategory,
    showAll,
    isHidden,
    restorableHiddenCount,
  } = enhancedHiddenCategoriesLogic;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [activeCategoryForAdd, setActiveCategoryForAdd] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Package");
  const [showIconPicker, setShowIconPicker] = useState(false);

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

  const allCategories = buildDisplayCategories(suitcase);

  const visibleCategories = allCategories.filter(
    (cat) => cat.source === 'system' || !isHidden(cat.id)
  );

  const hiddenCategoriesList = getRestorableHiddenCategories(suitcase, isHidden);
  const availableOptionalCategories = getAvailableOptionalCategories(suitcase);
  const visibleCategoryIds = visibleCategories.map((cat) => cat.id);
  const aiInitialCategories = getEnabledSystemCategoryNames(suitcase);

  const handleActivateOptional = async (categoryId: string) => {
    if (onActivateOptionalCategory) {
      await onActivateOptionalCategory(categoryId);
    } else {
      activateOptionalCategory(categoryId);
    }
  };

  const groupedItems = allCategories.reduce((acc: Record<string, SuitcaseItem[]>, cat) => {
    acc[cat.name] = (suitcase.suitcase_items || []).filter(
      item => normalizeCategoryName(item.category) === cat.name || item.category === cat.name
    );
    return acc;
  }, {});

  const selectedItemData = suitcase.suitcase_items?.find(i => i.name === selectedItemName);
  const canToggleViewMode = !!onSetViewMode && !isTdTemplate(suitcase);

  return (
    <div className="flex flex-col lg:flex-row gap-0 items-stretch w-full h-full lg:min-h-0 lg:overflow-y-hidden lg:overflow-x-visible bg-transparent">
      {/* LEFT: Items List */}
      <div className="flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden lg:overflow-visible">
        <div className={SUITCASE_TOOLBAR_SHELL_CLASS}>
          <div className="flex items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-center gap-3 md:gap-6 flex-wrap justify-center md:justify-start min-w-0">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => !readOnly && setShowAiModal(true)}
                disabled={readOnly || isSeedingAi}
                className={`${SUITCASE_TOOLBAR_BTN_CLASS} bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500/40 disabled:hover:bg-amber-500/10 disabled:hover:text-amber-400 group`}
                title={readOnly ? 'Non disponibile in sola lettura' : undefined}
              >
                <Sparkles className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isSeedingAi ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSeedingAi ? 'Generazione...' : 'Suggerimenti'}</span>
                <span className="sm:hidden">{isSeedingAi ? '...' : 'Suggerisci'}</span>
              </button>

              <button
                onClick={() => !readOnly && onOpenBlacklist()}
                disabled={readOnly}
                className={`${SUITCASE_TOOLBAR_BTN_CLASS} group relative ${
                  readOnly
                    ? 'bg-slate-800/50 border-white/10 text-slate-500'
                    : isBlacklistFlashing
                      ? 'bg-amber-500 animate-pulse ring-2 ring-amber-300 text-white border-amber-400/50'
                      : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-white/15'
                }`}
                title={readOnly ? 'Non disponibile in sola lettura' : 'Oggetti rifiutati'}
              >
                <Ban className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Rifiutati</span>
                {blacklistCount > 0 && (
                  <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[9px] font-black border-2 transition-all ml-0.5 ${
                    isBlacklistFlashing ? 'bg-white text-amber-600 border-amber-400' : 'bg-indigo-500 text-white border-slate-900'
                  }`}>
                    {blacklistCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0" />

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => !readOnly && setIsAddingNewCategory(true)}
                disabled={readOnly}
                className={`${SUITCASE_TOOLBAR_BTN_CLASS} bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500/40 disabled:hover:bg-indigo-600/10 disabled:hover:text-indigo-400 group`}
                title={readOnly ? 'Non disponibile in sola lettura' : undefined}
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Nuova</span>
              </button>

              <button
                onClick={() => !readOnly && setShowHiddenCategories(!showHiddenCategories)}
                disabled={readOnly || restorableHiddenCount === 0}
                className={`${SUITCASE_TOOLBAR_BTN_CLASS} group relative ${
                  readOnly || restorableHiddenCount === 0
                    ? 'bg-slate-800/50 border-white/10 text-slate-600 cursor-not-allowed opacity-50'
                    : showHiddenCategories
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:border-white/15'
                }`}
                title={readOnly ? 'Non disponibile in sola lettura' : restorableHiddenCount === 0 ? 'Nessuna categoria nascosta' : 'Categorie nascoste'}
              >
                {showHiddenCategories ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Nascoste</span>
                {restorableHiddenCount > 0 && (
                  <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-white text-[9px] font-black border-2 border-slate-900 transition-all ml-0.5 ${isEyeFlashing ? 'bg-amber-500 scale-110' : 'bg-slate-700'}`}>
                    {restorableHiddenCount}
                  </span>
                )}
              </button>
            </div>
            </div>

            {canToggleViewMode && (
              <button
                type="button"
                onClick={() => onSetViewMode!(panelViewMode === 'viewer' ? 'editor' : 'viewer')}
                className={`${SUITCASE_VIEW_MODE_ACTION_BTN_CLASS} shrink-0 ml-auto`}
                aria-label={panelViewMode === 'viewer' ? 'Modifica' : 'Visualizzazione'}
                title={panelViewMode === 'viewer' ? 'Modifica' : 'Visualizzazione'}
              >
                {panelViewMode === 'viewer' ? (
                  <Wrench className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
                ) : (
                  <Eye className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 lg:px-10 pb-4 md:pb-6 lg:pb-10 lg:pr-6 custom-scrollbar relative">
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
                    Valigia temporanea
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    Non salvata
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                  Effettua il login per salvare questa valigia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BOX CATEGORIE NASCOSTE - ORA SOPRA LE CATEGORIE NORMALI */}
        {restorableHiddenCount > 0 && showHiddenCategories && !readOnly && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-950/40 rounded-3xl border border-white/5 py-4 px-5 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  CATEGORIE NASCOSTE <EyeOff className="w-3.5 h-3.5" />
                </h4>
                <button 
                  onClick={showAll}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                >
                  Ripristina tutte
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenCategoriesList.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all group"
                    title="Ripristina categoria"
                  >
                    <Eye className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {availableOptionalCategories.length > 0 && !readOnly && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-950/40 rounded-3xl border border-emerald-500/10 py-4 px-5 shadow-xl shadow-black/20">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-1">
                Categorie disponibili
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableOptionalCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleActivateOptional(cat.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/20 transition-all group"
                    title={`Attiva ${cat.name}`}
                  >
                    <Plus className="w-3 h-3 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    <span className="text-[9px] font-bold text-emerald-300 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AREA NUOVA CATEGORIA (INLINE) */}
        {isAddingNewCategory && !readOnly && (
          <div className="bg-slate-900/60 rounded-3xl border border-indigo-500/30 p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl shadow-indigo-500/10">
            <div className="max-w-[400px] w-full space-y-6">
              <div className="text-center">
                <h5 className="text-[11px] uppercase font-black text-indigo-400 tracking-widest mb-1">Nuova Categoria</h5>
                <p className="text-[10px] text-slate-500">Organizza i tuoi oggetti in una nuova sezione dedicata</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Nome Sezione</label>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                    placeholder="Es. Fotografia, Accessori..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Icona Sezione</label>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowIconPicker(!showIconPicker); }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
                        <ItemCategoryIcon category="custom" iconKey={newCatIcon} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 tracking-wide">{newCatIcon}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${showIconPicker ? 'rotate-90' : ''}`} />
                  </button>

                  {showIconPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2">
                      <IconPicker onSelect={setNewCatIcon} onClose={() => setShowIconPicker(false)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button onClick={() => setIsAddingNewCategory(false)} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Annulla</button>
                <button onClick={handleAddNewCategory} className="flex-[2] py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all active:scale-95">Salva Categoria</button>
              </div>
            </div>
          </div>
        )}
        
        {/* LISTA CATEGORIE VISIBILI */}
        {visibleCategories.map(cat => {
          const catCheckedCount = groupedItems[cat.name].filter(i => i.is_checked).length;
          const catTotalCount = groupedItems[cat.name].length;
          const catPerc = catTotalCount > 0 ? Math.round((catCheckedCount / catTotalCount) * 100) : 0;
          const isCatComplete = catTotalCount > 0 && catCheckedCount === catTotalCount;

          return (
            <div
              key={cat.id}
              className="bg-slate-900/40 rounded-3xl border border-white/5 lg:overflow-hidden shadow-2xl shadow-black/20 group/section"
            >
            {/* Category Header Bar */}
            <div className="bg-slate-800/40 px-5 py-3 border-b border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-white/5 shadow-lg shadow-indigo-500/5">
                  <ItemCategoryIcon category={cat.name} iconKey={cat.icon_key} className="w-5.5 h-5.5" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[13px] md:text-[15px] uppercase font-semibold text-slate-200 tracking-wide leading-none mb-1">{cat.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className={`w-3 h-3 ${isCatComplete ? 'text-emerald-500' : 'text-indigo-400'}`} />
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                      {catCheckedCount}/{catTotalCount} <span className="opacity-40 mx-0.5">•</span> {catPerc}%
                    </span>
                  </div>
                </div>
              </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => !readOnly && moveCategory(cat.id, 'up', visibleCategoryIds)}
                    disabled={readOnly || visibleCategoryIds.indexOf(cat.id) <= 0}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta su'}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => !readOnly && moveCategory(cat.id, 'down', visibleCategoryIds)}
                    disabled={readOnly || visibleCategoryIds.indexOf(cat.id) >= visibleCategoryIds.length - 1}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Sposta giù'}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => !readOnly && setActiveCategoryForAdd(cat.name === activeCategoryForAdd ? null : cat.name)}
                    disabled={readOnly}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-indigo-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Aggiungi oggetto'}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => !readOnly && toggleCategory(cat.id)}
                    disabled={readOnly}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-slate-400"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Nascondi categoria'}
                  >
                    <Eye className="w-3.5 h-3.5" />
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
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-slate-400"
                    title={readOnly ? 'Non disponibile in sola lettura' : 'Elimina definitivamente la categoria'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedItems[cat.name].map(item => (
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

      {/* RIGHT: Sidebar Suggestions Unificata (Sticky & Collapsible) */}
      <SuitcaseSidePanel 
        isCollapsible={true} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sticky={true}
        className="hidden lg:flex"
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

      <AiSuggestionsModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        initialCategories={aiInitialCategories}
        onGenerate={(categories, mode) => {
          onSeedAi(categories, mode);
        }}
        onShowMore={onShowMoreAi}
        onAccept={onAcceptAiSuggestion}
        onReject={onRejectAiSuggestion}
        showToast={showToast}
        isGenerating={isSeedingAi}
        suggestions={aiSuggestions}
        hasMore={hasMoreAi}
      />
    </div>
  );
};

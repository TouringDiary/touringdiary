import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Sparkles, ShoppingBag, Package, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { ItemCategoryIcon, STABLE_CATEGORY_ORDER, getCategoryId, CATEGORY_ICON_REGISTRY } from './SuitcaseUtils';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { useHiddenCategories } from '@/hooks/suitcase/useHiddenCategories';
import { SuitcaseItemRow } from './SuitcaseItemRow';
import { CategorySuggestionPanel } from './CategorySuggestionPanel';
import { SuitcaseSidePanel } from './SuitcaseSidePanel';
import { normalizeItemName } from '@/utils/tagDerivation';
import { SuitcaseToast } from '../SuitcaseFloatingPanel/components/SuitcaseToast';

interface SuitcaseEditorViewProps {
  suitcase: Suitcase;
  onUpdateItem: (itemId: string, updates: Partial<SuitcaseItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (category: string, name: string) => void;
  onUpdateSuitcase: (updates: Partial<Suitcase>) => void;
  onUpdateSuitcaseLocal?: (id: string, updates: any) => void;
  onSeedAi: () => void;
  autoOpenNewCategory?: boolean;
  isSeedingAi: boolean;
  itemMap: Record<string, any[]>;
  categoryMap: Record<string, any[]>;
  overrides: Record<string, any>;
  globalMap: any[];
  placeholders: Record<string, any[]>;
  onLinkBuild: (provider: string, url: string) => string;
  onLinkBuildSearch: (query: string) => string;
  highlightItemId: string | null;
  selectedItemName: string | null;
  onSelectItem: (name: string | null) => void;
  showHiddenCategories: boolean;
  hiddenCategoriesLogic: any;
  toast?: { visible: boolean; message: string };
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
        {Object.entries(CATEGORY_ICON_REGISTRY).map(([key, icon]: [string, any]) => (
          <button
            key={key}
            onClick={() => { onSelect(key); onClose(); }}
            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/50 flex items-center justify-center text-slate-300 hover:text-indigo-400 transition-all hover:scale-110"
          >
            {React.cloneElement(icon, { className: "w-4 h-4" })}
          </button>
        ))}
      </div>
    </div>
  );
};

export const SuitcaseEditorView: React.FC<SuitcaseEditorViewProps> = ({
  suitcase,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onUpdateSuitcase,
  onUpdateSuitcaseLocal,
  onSeedAi,
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
  showHiddenCategories,
  hiddenCategoriesLogic,
  toast = { visible: false, message: "" }
}) => {
  const { toggleCategory, showAll, isHidden, hiddenIds } = hiddenCategoriesLogic;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [activeCategoryForAdd, setActiveCategoryForAdd] = useState<string | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(autoOpenNewCategory || false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Package");
  const [showIconPicker, setShowIconPicker] = useState(false);

  // La logica delle categorie nascoste è ora gestita dal genitore e passata come prop

  useEffect(() => {
    if (autoOpenNewCategory) {
      setIsAddingNewCategory(true);
    }
  }, [autoOpenNewCategory]);

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
    onUpdateSuitcase({ custom_categories: updatedCustomCats } as any);
    setNewCatName("");
    setNewCatIcon("Package");
    setIsAddingNewCategory(false);
  };

  const allCategories = [
    ...STABLE_CATEGORY_ORDER.map(name => ({ id: getCategoryId(name), name, icon_key: null, source: 'system' })),
    ...(suitcase.custom_categories || []).map((cat: any) => ({ ...cat, source: 'user' }))
  ];

  const visibleCategories = allCategories.filter(cat => !isHidden(cat.id));

  const groupedItems = allCategories.reduce((acc: Record<string, SuitcaseItem[]>, cat) => {
    acc[cat.name] = (suitcase.suitcase_items || []).filter(item => item.category === cat.name);
    return acc;
  }, {});

  const selectedItemData = suitcase.suitcase_items?.find(i => i.name === selectedItemName);

  return (
    <div className="flex flex-col lg:flex-row gap-0 items-start w-full h-full lg:overflow-hidden bg-transparent">
      {/* LEFT: Items List */}
      <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 lg:p-10 lg:pr-6 custom-scrollbar space-y-6 relative">
        {/* Toast localizzato sopra la lista */}
        <SuitcaseToast {...toast} />
        
        {/* BOX CATEGORIE NASCOSTE - Ora pilotato da toolbar esterna */}
        {hiddenIds.length > 0 && showHiddenCategories && (
          <div className="space-y-3 mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-950/40 rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20">
              <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  Sezioni nascoste <EyeOff className="w-3 h-3" />
                </h4>
                <button 
                  onClick={showAll}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                >
                  Ripristina tutte
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allCategories.filter(c => isHidden(c.id)).map(cat => (
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

        {visibleCategories.map(cat => (
          <div
            key={cat.id}
            className="bg-slate-900/40 rounded-3xl border border-white/5 lg:overflow-hidden shadow-2xl shadow-black/20 group/section mb-6"
          >
            {/* Category Header Bar */}
            <div className="bg-slate-800/40 px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-white/5">
                  <ItemCategoryIcon category={cat.name} iconKey={cat.icon_key} className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-[13px] md:text-[15px] uppercase font-semibold text-slate-200 tracking-wide leading-none mb-1">{cat.name}</h4>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{groupedItems[cat.name].length} {groupedItems[cat.name].length === 1 ? 'Oggetto' : 'Oggetti'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition-all"
                  title="Nascondi categoria"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveCategoryForAdd(cat.name === activeCategoryForAdd ? null : cat.name)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-indigo-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="Aggiungi oggetto"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedItems[cat.name].map(item => (
                  <SuitcaseItemRow
                    key={item.id}
                    item={item}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                    highlightId={highlightItemId}
                    override={overrides[normalizeItemName(item.name)]}
                    onLinkBuildSearch={onLinkBuildSearch}
                    isSelected={selectedItemName === item.name}
                    onSelect={() => onSelectItem(item.name === selectedItemName ? null : item.name)}
                  />
                ))}

                {activeCategoryForAdd === cat.name && (
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

              {groupedItems[cat.name].length === 0 && !activeCategoryForAdd && (
                <div className="py-4 text-center">
                  <p className="text-[11px] text-slate-700 italic flex items-center justify-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    Nessun oggetto in {cat.name.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="bg-slate-950/40 rounded-3xl border border-white/5 border-dashed lg:overflow-hidden hover:border-indigo-500/30 transition-all group">
          {isAddingNewCategory ? (
            <div className="p-8 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
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
          ) : (
             <button 
               onClick={() => setIsAddingNewCategory(true)}
               className="w-full h-12 flex items-center justify-center gap-4 hover:bg-indigo-500/[0.02] transition-colors group"
             >
               <div className="w-7 h-7 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-500/50 group-hover:text-indigo-400 transition-all group-hover:bg-indigo-500/10">
                 <Plus className="w-4 h-4" />
               </div>
               <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 group-hover:text-indigo-400 transition-colors">NUOVA</span>
               </div>
             </button>
          )}
        </div>

        <div className="pt-8 border-t border-white/5 shrink-0">
          <button
            onClick={onSeedAi}
            disabled={isSeedingAi}
            className="w-full py-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm font-bold shadow-xl shadow-amber-500/5 group"
          >
            <Sparkles className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            {isSeedingAi ? 'Generazione suggerimenti...' : 'Ottieni suggerimenti AI per completare'}
          </button>
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
    </div>
  );
};

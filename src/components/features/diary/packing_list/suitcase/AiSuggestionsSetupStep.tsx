import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Settings2, ListChecks, ChevronDown, X, Check } from 'lucide-react';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

interface AiSuggestionsSetupStepProps {
  selectedCategories: string[];
  availableCategories: string[];
  showAddCategoryDropdown: boolean;
  mode: 'direct' | 'review';
  onAddCategory: (cat: string) => void;
  onRemoveCategory: (cat: string) => void;
  onToggleDropdown: () => void;
  onSetMode: (mode: 'direct' | 'review') => void;
}

export const AiSuggestionsSetupStep: React.FC<AiSuggestionsSetupStepProps> = ({
  selectedCategories,
  availableCategories,
  showAddCategoryDropdown,
  mode,
  onAddCategory,
  onRemoveCategory,
  onToggleDropdown,
  onSetMode
}) => {
  // Rilevamento Mobile per Design System
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Token Design System
  const labelStyle = useDynamicStyles('suitcase_label_caps', isMobile);
  const helperStyle = useDynamicStyles('suitcase_text_support', isMobile);
  const itemPrimaryStyle = useDynamicStyles('suitcase_item_primary', isMobile);

  return (
    <div className="space-y-10">
      {/* Categorie Dinamiche */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className={`${labelStyle || "text-[11px] font-black text-slate-300 uppercase tracking-widest"} flex items-center gap-2`}>
              <LayoutGrid className="w-3.5 h-3.5" /> Categorie Selezionate
            </h4>
            <p className={`${helperStyle || "text-[11px] text-slate-400 font-medium"}`}>
              Seleziona le categorie per cui desideri ricevere suggerimenti nella valigia.
            </p>
          </div>
          <span className={`${helperStyle || "text-[10px] text-slate-400 font-bold"}`}>{selectedCategories.length} attive</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(cat => (
            <div
              key={cat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 border border-indigo-500 text-white shadow-lg shadow-indigo-500/20 text-xs font-bold animate-in zoom-in-90 duration-200"
            >
              <ItemCategoryIcon category={cat} className="w-4 h-4" />
              {cat}
              <button 
                onClick={() => onRemoveCategory(cat)}
                className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          ))}

          {availableCategories.length > 0 && (
            <div className="relative">
              <button
                onClick={onToggleDropdown}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:border-white/10 hover:text-slate-200 transition-all text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
                <ChevronDown className={`w-3 h-3 transition-transform ${showAddCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showAddCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => onAddCategory(cat)}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <ItemCategoryIcon category={cat} className="w-4 h-4" />
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modalità */}
      <div className="space-y-4">
        <h4 className={`${labelStyle || "text-[11px] font-black text-slate-300 uppercase tracking-widest"} flex items-center gap-2`}>
          <Settings2 className="w-3.5 h-3.5" /> Modalità Generazione
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onSetMode('direct')}
            className={`p-5 rounded-3xl border text-left transition-all group relative ${
              mode === 'direct' 
                ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              mode === 'direct' 
                ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/40' 
                : 'border-white/10 bg-black/20'
            }`}>
              {mode === 'direct' && <Check className="w-3 h-3 text-white stroke-[4]" />}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                mode === 'direct' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
              }`}>
                <Plus className="w-5 h-5" />
              </div>
              <span className={`${itemPrimaryStyle || (mode === 'direct' ? 'text-white' : 'text-slate-300')} text-sm font-bold`}>Aggiungi direttamente</span>
            </div>
            <p className={`${helperStyle || "text-[11px] text-slate-400"} leading-relaxed`}>I suggerimenti verranno inseriti immediatamente nella valigia senza revisione.</p>
          </button>

          <button
            onClick={() => onSetMode('review')}
            className={`p-5 rounded-3xl border text-left transition-all group relative ${
              mode === 'review' 
                ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              mode === 'review' 
                ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/40' 
                : 'border-white/10 bg-black/20'
            }`}>
              {mode === 'review' && <Check className="w-3 h-3 text-white stroke-[4]" />}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                mode === 'review' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
              }`}>
                <ListChecks className="w-5 h-5" />
              </div>
              <span className={`${itemPrimaryStyle || (mode === 'review' ? 'text-white' : 'text-slate-300')} text-sm font-bold`}>Rivedi prima di aggiungere</span>
            </div>
            <p className={`${helperStyle || "text-[11px] text-slate-400"} leading-relaxed`}>Potrai valutare ogni singolo oggetto suggerito prima di confermarlo.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { AiSuggestionReviewRow } from './AiSuggestionReviewRow';
import { AiSuggestion } from '../SuitcaseFloatingPanel/hooks/useSuitcaseSuggestions';
import { STABLE_CATEGORY_ORDER, ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

interface AiSuggestionsReviewStepProps {
  suggestions: AiSuggestion[];
  isGenerating: boolean;
  hasMore: boolean;
  onShowMore: () => void;
  onAccept: (name: string, category: string) => Promise<void>;
  onReject: (name: string, category: string) => Promise<void>;
  onBackToSetup: () => void;
}

export const AiSuggestionsReviewStep: React.FC<AiSuggestionsReviewStepProps> = ({
  suggestions,
  isGenerating,
  hasMore,
  onShowMore,
  onAccept,
  onReject,
  onBackToSetup
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

  // Raggruppamento suggerimenti per categoria
  const groupedData = useMemo(() => {
    const groups: Record<string, AiSuggestion[]> = {};
    
    suggestions.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });

    // Ordinamento categorie: STABLE_CATEGORY_ORDER prima, poi le altre
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      const indexA = STABLE_CATEGORY_ORDER.indexOf(a);
      const indexB = STABLE_CATEGORY_ORDER.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return { groups, sortedCategories };
  }, [suggestions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className={`${labelStyle || "text-[11px] font-black text-slate-300 uppercase tracking-widest"}`}>Suggerimenti Trovati</h4>
        <button 
          onClick={onBackToSetup}
          className="text-[10px] font-black text-indigo-400 uppercase hover:text-indigo-300 transition-colors"
        >
          Modifica Filtri
        </button>
      </div>

      {isGenerating && suggestions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className={`${labelStyle || "text-xs text-slate-400 font-bold uppercase tracking-widest"}`}>L'AI sta lavorando...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {suggestions.length > 0 ? (
            <>
              {groupedData.sortedCategories.map(category => (
                <div key={category} className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 md:p-6 space-y-5">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-sm">
                      <ItemCategoryIcon category={category} className="w-4 h-4" />
                    </div>
                    <h5 className={`${labelStyle || "text-[11px] font-black text-slate-300 uppercase tracking-[0.15em]"} flex items-center gap-2`}>
                      {category}
                      <span className="w-1 h-1 rounded-full bg-slate-500" />
                      <span className="text-indigo-400">{groupedData.groups[category].length}</span>
                    </h5>
                  </div>

                  {/* Suggestions in Category */}
                  <div className="space-y-2">
                    {groupedData.groups[category].map((s, idx) => (
                      <AiSuggestionReviewRow 
                        key={`${category}-${s.name}-${idx}`}
                        name={s.name}
                        category={s.category}
                        status={s.status}
                        onAccept={() => onAccept(s.name, s.category)}
                        onReject={() => onReject(s.name, s.category)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button
                  onClick={onShowMore}
                  disabled={isGenerating}
                  className={`w-full py-4 mt-4 rounded-2xl border border-dashed border-white/10 ${labelStyle || "text-[10px] font-black uppercase tracking-widest"} text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2`}
                >
                  {isGenerating ? <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Mostra altri suggerimenti
                </button>
              )}
            </>
          ) : (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className={`${helperStyle || "text-sm text-slate-400"}`}>Nessun nuovo suggerimento trovato per queste categorie.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

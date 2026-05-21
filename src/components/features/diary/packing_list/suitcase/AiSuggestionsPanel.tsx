import React from 'react';
import { Sparkles, Plus, CheckCircle2 } from 'lucide-react';

interface AiSuggestionsPanelProps {
  suggestions: any[];
  isLoading: boolean;
  onAdd: (category: string, name: string) => void;
  onClear: () => void;
}

export const AiSuggestionsPanel: React.FC<AiSuggestionsPanelProps> = ({
  suggestions,
  isLoading,
  onAdd,
  onClear
}) => {
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Suggerimenti AI</h5>
        </div>
        <button onClick={onClear} className="text-[10px] text-amber-700 hover:text-amber-500 font-bold">Nascondi</button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {isLoading ? (
            <div className="py-4 text-center">
                <Sparkles className="w-5 h-5 text-amber-500 animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-amber-700">Analisi viaggio...</p>
            </div>
        ) : (
            suggestions.map((item, idx) => (
                <button
                key={idx}
                onClick={() => onAdd(item.category, item.name)}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 text-left transition-all group"
                >
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-300 truncate group-hover:text-amber-200">{item.name}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-tight">{item.category}</div>
                </div>
                <Plus className="w-3 h-3 text-slate-700 group-hover:text-amber-500 transition-colors" />
                </button>
            ))
        )}
      </div>
      
      {!isLoading && suggestions.length > 0 && (
          <p className="text-[9px] text-amber-700 text-center leading-tight">
              Questi oggetti sono suggeriti in base al tipo di viaggio e alle previsioni meteo locali.
          </p>
      )}
    </div>
  );
};

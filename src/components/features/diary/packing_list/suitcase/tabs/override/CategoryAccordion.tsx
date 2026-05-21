import React from 'react';
import { ChevronRight, Package } from 'lucide-react';

interface CategoryAccordionProps {
  category: string;
  configuredCount: number;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  allSaved: boolean;
}

export const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  category,
  configuredCount,
  totalCount,
  isExpanded,
  onToggle,
  allSaved
}) => {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isExpanded
          ? 'bg-slate-900 border-indigo-500/30'
          : (allSaved ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' : 'bg-slate-900/50 border-white/5 hover:border-white/10')
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
          <Package className="w-5 h-5" />
        </div>
        <div className="text-left">
          <span className="text-sm font-black uppercase tracking-widest text-slate-200">{category}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold ${allSaved ? 'text-emerald-500' : 'text-slate-500'}`}>
              {configuredCount} / {totalCount} {configuredCount === 1 ? 'OGGETTO CONFIGURATO' : 'OGGETTI CONFIGURATI'}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`} />
    </button>
  );
};

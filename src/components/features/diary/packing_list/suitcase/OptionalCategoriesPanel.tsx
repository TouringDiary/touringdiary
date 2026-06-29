import React from 'react';
import { ListRestart } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';

interface OptionalCategoriesPanelProps {
  categories: DisplayCategory[];
  onActivate: (categoryId: string) => void;
  readOnly?: boolean;
}

export const OptionalCategoriesPanel: React.FC<OptionalCategoriesPanelProps> = ({
  categories,
  onActivate,
  readOnly = false,
}) => (
  <div className="bg-slate-950/40 rounded-3xl border border-white/10 py-4 px-5 shadow-lg shadow-black/25 ring-1 ring-white/10 min-h-[5.5rem]">
    <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-1">
      Categorie disponibili
    </h4>
    {categories.length === 0 ? (
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">
        Nessuna categoria
      </p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => !readOnly && onActivate(cat.id)}
            disabled={readOnly}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-emerald-500/20 disabled:hover:bg-emerald-500/10"
            title={readOnly ? cat.name : `Attiva ${cat.name}`}
          >
            <ListRestart className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <span className="text-[9px] font-bold text-emerald-300 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

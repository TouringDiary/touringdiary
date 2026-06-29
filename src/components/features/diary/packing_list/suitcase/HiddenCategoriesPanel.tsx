import React from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { DisplayCategory } from '@/domain/packing/categorySetup';

interface HiddenCategoriesPanelProps {
  categories: DisplayCategory[];
  onRestore: (categoryId: string) => void;
  onRestoreAll: () => void;
  readOnly?: boolean;
}

export const HiddenCategoriesPanel: React.FC<HiddenCategoriesPanelProps> = ({
  categories,
  onRestore,
  onRestoreAll,
  readOnly = false,
}) => (
  <div className="bg-slate-950/40 rounded-3xl border border-white/10 py-4 px-5 shadow-lg shadow-black/25 ring-1 ring-white/10 min-h-[5.5rem]">
    <div className="flex items-center justify-between gap-2 mb-3 px-1 min-w-0">
      <h4 className="text-[11px] font-black text-amber-400/90 uppercase tracking-widest flex items-center gap-2 min-w-0 whitespace-nowrap">
        <span className="truncate">Categorie nascoste</span>
        <EyeOff className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden />
      </h4>
      {!readOnly && categories.length > 0 && (
        <button
          type="button"
          onClick={onRestoreAll}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          title="Ripristina tutte le categorie"
          aria-label="Ripristina tutte le categorie"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden />
        </button>
      )}
    </div>
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
            onClick={() => !readOnly && onRestore(cat.id)}
            disabled={readOnly}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/5 disabled:hover:bg-white/5"
            title={readOnly ? cat.name : 'Ripristina categoria'}
          >
            <Eye className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

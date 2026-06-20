import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
    <div className="flex items-center justify-between mb-3 px-1">
      <h4 className="text-[10px] font-black text-rose-400/90 uppercase tracking-widest flex items-center gap-2">
        Categorie nascoste <EyeOff className="w-3.5 h-3.5 text-rose-400/80" />
      </h4>
      {!readOnly && categories.length > 0 && (
        <button
          type="button"
          onClick={onRestoreAll}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
        >
          Ripristina tutte
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/5 disabled:hover:bg-white/5"
            title={readOnly ? cat.name : 'Ripristina categoria'}
          >
            <Eye className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

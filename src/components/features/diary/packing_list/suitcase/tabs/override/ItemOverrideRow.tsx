import React from 'react';
import { CheckCircle2, Save, Loader2 } from 'lucide-react';
import { SuitcaseItem } from '@/types/suitcase';
import { SuggestionProduct, ItemOverride } from '@/types/suitcase';

interface ItemOverrideRowProps {
  item: SuitcaseItem;
  override: ItemOverride | undefined;
  currentProduct: SuggestionProduct | undefined;
  onSave: () => void;
  hasChanges: boolean;
  picker: React.ReactNode;
  partnerPanel?: React.ReactNode;
}

export const ItemOverrideRow: React.FC<ItemOverrideRowProps> = ({
  item,
  override,
  currentProduct,
  onSave,
  hasChanges,
  picker,
  partnerPanel
}) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${override?.is_saved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-700/50 hover:border-slate-600 shadow-xl'}`}>
      <div className="flex items-center gap-6">
        <div className="w-1/3">
          <span className="text-sm font-bold text-white">{item.name}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${override?.is_saved ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              {override?.is_saved ? 'Assegnato' : 'In attesa'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3">
          {picker}

          {currentProduct && (
            <div className="w-12 h-12 rounded-lg bg-white overflow-hidden border border-white/10 shrink-0 shadow-sm p-1">
              <img src={currentProduct.image_url} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <button
            onClick={onSave}
            disabled={!hasChanges || override?.is_saving}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${override?.is_saved && !hasChanges
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-30 disabled:grayscale'
              }`}
          >
            {override?.is_saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : override?.is_saved && !hasChanges ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Salvato
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Salva
              </>
            )}
          </button>
        </div>
      </div>

      {partnerPanel}
    </div>
  );
};

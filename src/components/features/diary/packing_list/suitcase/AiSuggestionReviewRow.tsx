import React from 'react';
import { Plus, X, Sparkles, Check } from 'lucide-react';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface AiSuggestionReviewRowProps {
  name: string;
  category: string;
  onAccept: () => void;
  onReject: () => void;
  status: 'pending' | 'accepted' | 'rejected';
  tripRelevant?: boolean;
  isSelectedForAccept?: boolean;
  onToggleSelectForAccept?: () => void;
}

const ROW_CATEGORY_LABEL_CLASS =
  'text-[10px] text-slate-500 uppercase font-black tracking-widest';
const ROW_RECOMMENDED_BADGE_CLASS =
  'text-[9px] font-black uppercase tracking-widest';

export const AiSuggestionReviewRow: React.FC<AiSuggestionReviewRowProps> = ({
  name,
  category,
  onAccept,
  onReject,
  status,
  tripRelevant = false,
  isSelectedForAccept = false,
  onToggleSelectForAccept,
}) => {
  const useSelectionMode = status === 'pending' && !!onToggleSelectForAccept;
  const isMobile = useMobileDetect();
  const itemPrimaryStyle = useDynamicStyles('suitcase_item_primary', isMobile);

  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
      status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
      status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 opacity-50' :
      isSelectedForAccept ? 'bg-indigo-500/10 border-indigo-500/35' :
      tripRelevant ? 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/30' :
      'bg-white/5 border-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          tripRelevant ? 'bg-violet-500/10 text-violet-300' : 'bg-indigo-500/10 text-indigo-400'
        }`}>
          <ItemCategoryIcon category={category} className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`${itemPrimaryStyle || "text-base font-bold text-white"} truncate`}>{name}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`${ROW_CATEGORY_LABEL_CLASS} truncate`}>{category}</span>
            {tripRelevant && status === 'pending' && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-400/30 ${ROW_RECOMMENDED_BADGE_CLASS} text-violet-200`}
                title="Consigliato in base al tuo itinerario"
              >
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                <span className="hidden sm:inline">Consigliato</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status === 'pending' && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
              title="Rifiuta (Blacklist)"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (useSelectionMode) {
                  onToggleSelectForAccept?.();
                } else {
                  onAccept();
                }
              }}
              className={`p-2 rounded-lg transition-all ${
                useSelectionMode && isSelectedForAccept
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
              }`}
              title={useSelectionMode ? (isSelectedForAccept ? 'Deseleziona' : 'Seleziona per accettare') : 'Accetta'}
              aria-pressed={useSelectionMode ? isSelectedForAccept : undefined}
            >
              {useSelectionMode && isSelectedForAccept ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

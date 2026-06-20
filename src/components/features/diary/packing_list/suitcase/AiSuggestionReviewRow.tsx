import React from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
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
}

export const AiSuggestionReviewRow: React.FC<AiSuggestionReviewRowProps> = ({
  name,
  category,
  onAccept,
  onReject,
  status,
  tripRelevant = false,
}) => {
  const isMobile = useMobileDetect();
  const itemPrimaryStyle = useDynamicStyles('suitcase_item_primary', isMobile);
  const labelStyle = useDynamicStyles('suitcase_label_caps', isMobile);

  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
      status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
      status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 opacity-50' :
      tripRelevant ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30' :
      'bg-white/5 border-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          tripRelevant ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
        }`}>
          <ItemCategoryIcon category={category} className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`${itemPrimaryStyle || "text-base font-bold text-white"} truncate`}>{name}</span>
            {tripRelevant && status === 'pending' && (
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 ${labelStyle || "text-[9px] font-black uppercase tracking-widest"} text-amber-300`}
                title="Consigliato in base al tuo viaggio"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Viaggio
              </span>
            )}
          </div>
          <span className={`${labelStyle || "text-[10px] text-slate-500 uppercase font-black tracking-widest"}`}>{category}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status === 'pending' && (
          <>
            <button
              onClick={onReject}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
              title="Rifiuta (Blacklist)"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onAccept}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
              title="Accetta"
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { ItemCategoryIcon } from './SuitcaseUtils';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';

interface AiSuggestionReviewRowProps {
  name: string;
  category: string;
  onAccept: () => void;
  onReject: () => void;
  status: 'pending' | 'accepted' | 'rejected';
}

export const AiSuggestionReviewRow: React.FC<AiSuggestionReviewRowProps> = ({
  name,
  category,
  onAccept,
  onReject,
  status
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
  const itemPrimaryStyle = useDynamicStyles('suitcase_item_primary', isMobile);
  const labelStyle = useDynamicStyles('suitcase_label_caps', isMobile);

  return (
    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
      status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
      status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 opacity-50' :
      'bg-white/5 border-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
          <ItemCategoryIcon category={category} className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`${itemPrimaryStyle || "text-base font-bold text-white"} truncate`}>{name}</span>
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

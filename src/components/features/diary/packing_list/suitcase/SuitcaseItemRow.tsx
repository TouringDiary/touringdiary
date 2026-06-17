import React, { useState, useEffect } from 'react';
import { Check, Trash2, Sparkles, X } from 'lucide-react';
import { SuitcaseItem } from '@/types/suitcase';
import { affiliateTrackingService } from '@/services/affiliateTrackingService';

interface SuitcaseItemRowProps {
  item: SuitcaseItem;
  readOnly?: boolean;
  onUpdate: (id: string, updates: Partial<SuitcaseItem>) => void;
  onDelete: (id: string) => void;
  highlightId: string | null;
  override?: any;
  onLinkBuildSearch?: (query: string) => string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const SuitcaseItemRow: React.FC<SuitcaseItemRowProps> = ({
  item,
  readOnly = false,
  onUpdate,
  onDelete,
  highlightId,
  override,
  onLinkBuildSearch,
  isSelected,
  onSelect
}) => {
  const [isTemporarilyHighlighted, setIsTemporarilyHighlighted] = useState(false);

  // Trigger temporary highlight when this specific item is modified
  useEffect(() => {
    if (highlightId === item.id) {
      setIsTemporarilyHighlighted(true);
      const timer = setTimeout(() => setIsTemporarilyHighlighted(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightId, item.id]);

  return (
    <div 
      onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 group relative cursor-pointer ${
        isTemporarilyHighlighted 
          ? 'bg-emerald-400/20 border-emerald-400/30' 
          : isSelected
            ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : item.is_ai_suggestion
              ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5'
              : item.is_checked 
                ? 'bg-emerald-500/[0.03] border-emerald-500/15' 
                : 'bg-slate-800/40 border-white/5 hover:border-white/10 hover:bg-slate-800/60'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) onUpdate(item.id, { is_checked: !item.is_checked });
        }}
        disabled={readOnly}
        className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          item.is_checked 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'bg-slate-900 border-slate-700 hover:border-indigo-500 group-hover:scale-105 active:scale-95'
        }`}
      >
        {item.is_checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>
      
      <span className={`flex-1 text-sm font-medium transition-colors flex items-center gap-2 ${
        item.is_checked ? 'text-slate-400' : 'text-slate-200'
      }`}>
        {item.name}
      </span>

      {override && (
        <a 
          href={(() => {
            const pid = override.product_id || "";
            if (pid.startsWith("search:")) {
              const keyword = pid.replace("search:", "");
              return onLinkBuildSearch?.(keyword) || '#';
            }
            return onLinkBuildSearch?.(pid) || '#';
          })()}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 transition-all hover:-translate-y-0.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-md shadow-black/10 flex items-center justify-center hover:shadow-lg active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            affiliateTrackingService.trackClickOut({
              partnerId: 'amazon',
              sourceType: 'suitcase',
              category: item.category || 'gear',
              productId: override.product_id || undefined,
              searchQuery: override.product_id?.startsWith('search:') ? override.product_id.replace('search:', '') : undefined
            });
          }}
        >
          <img 
            src="/assets/logos/amazon_logo.svg" 
            alt="Amazon" 
            className="h-3.5 object-contain" 
          />
        </a>
      )}

       {item.is_ai_suggestion ? (
        <div className="flex items-center gap-1.5 px-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-sm shrink-0" title="Suggerimento AI">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-amber-600/80 tracking-widest">AI</span>
          </div>

          {!readOnly && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(item.id, { is_ai_suggestion: false, accepted_from_ai: true } as any);
                }}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20"
                title="Accetta Suggerimento"
              >
                <Check className="w-4.5 h-4.5 stroke-[3]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                title="Rifiuta Suggerimento"
              >
                <X className="w-4.5 h-4.5 stroke-[3]" />
              </button>
            </>
          )}
        </div>
      ) : (
        !readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1 px-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1"
          title="Rimuovi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        )
      )}
    </div>
  );
};

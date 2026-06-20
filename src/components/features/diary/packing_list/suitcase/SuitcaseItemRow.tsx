import React, { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Sparkles, X, Minus, Plus } from 'lucide-react';
import { SuitcaseItem, RuntimeAffiliateProduct } from '@/types/suitcase';
import { affiliateTrackingService } from '@/services/affiliateTrackingService';

interface SuitcaseItemRowProps {
  item: SuitcaseItem;
  readOnly?: boolean;
  onUpdate: (id: string, updates: Partial<SuitcaseItem>) => void;
  onDelete: (id: string) => void;
  highlightId: string | null;
  override?: RuntimeAffiliateProduct;
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
  const quantity = item.quantity ?? 1;
  const [quantityInput, setQuantityInput] = useState<string | null>(null);
  const [isFadingHighlight, setIsFadingHighlight] = useState(false);
  const wasHighlightedRef = useRef(false);
  const isActiveHighlight = highlightId === item.id;
  const showModifiedHighlight = isActiveHighlight || isFadingHighlight;

  useEffect(() => {
    if (isActiveHighlight) {
      wasHighlightedRef.current = true;
      setIsFadingHighlight(false);
      return;
    }

    if (!wasHighlightedRef.current) return;

    wasHighlightedRef.current = false;
    setIsFadingHighlight(true);
    const timer = setTimeout(() => setIsFadingHighlight(false), 500);
    return () => clearTimeout(timer);
  }, [isActiveHighlight, item.id]);

  const sanitizeQuantityDigits = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') return '';
    return String(parseInt(digits, 10));
  };

  const commitQuantity = (raw: string) => {
    const parsed = parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    setQuantityInput(null);
    if (next !== quantity) {
      onUpdate(item.id, { quantity: next });
    }
  };

  const getEffectiveQuantity = () => {
    if (quantityInput !== null && quantityInput !== '') {
      const parsed = parseInt(quantityInput, 10);
      if (Number.isFinite(parsed) && parsed >= 1) {
        return parsed;
      }
    }
    return quantity;
  };

  const adjustQuantity = (delta: number) => {
    const next = Math.max(1, getEffectiveQuantity() + delta);
    setQuantityInput(null);
    if (next !== quantity) {
      onUpdate(item.id, { quantity: next });
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`flex items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all duration-500 group relative cursor-pointer ${
        showModifiedHighlight
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
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!readOnly) onUpdate(item.id, { is_checked: !item.is_checked });
        }}
        disabled={readOnly}
        aria-checked={!!item.is_checked}
        aria-label={item.is_checked ? 'Deseleziona oggetto' : 'Seleziona oggetto'}
        className="shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 md:min-w-[32px] md:min-h-[32px] md:w-8 md:h-8 rounded-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all shadow-sm group-hover:scale-105 active:scale-95 ${
            item.is_checked
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-slate-900 border-slate-700 group-hover:border-indigo-500'
          }`}
        >
          {item.is_checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </span>
      </button>
      
      <span className={`flex-1 min-w-0 text-base font-medium transition-colors flex items-center gap-2 ${
        item.is_checked ? 'text-slate-400' : 'text-slate-200'
      }`}>
        <span className="truncate">{item.name}</span>
      </span>

      {!item.is_ai_suggestion && !readOnly && (
        <div
          className="flex items-center shrink-0 rounded-lg border border-white/10 bg-slate-900/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Quantità"
        >
          <button
            type="button"
            onClick={() => adjustQuantity(-1)}
            disabled={getEffectiveQuantity() <= 1}
            className="flex items-center justify-center w-8 h-8 md:w-7 md:h-7 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Diminuisci quantità"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantityInput ?? String(quantity)}
            onChange={(e) => setQuantityInput(sanitizeQuantityDigits(e.target.value))}
            onBlur={() => commitQuantity(quantityInput ?? String(quantity))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-8 md:w-7 h-8 md:h-7 bg-transparent border-x border-white/10 text-center text-sm font-semibold text-slate-200 focus:outline-none focus:bg-white/5"
            aria-label="Quantità oggetto"
          />
          <button
            type="button"
            onClick={() => adjustQuantity(1)}
            className="flex items-center justify-center w-8 h-8 md:w-7 md:h-7 text-slate-400 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
            aria-label="Aumenta quantità"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                  onUpdate(item.id, { is_ai_suggestion: false, accepted_from_ai: true } as Partial<SuitcaseItem>);
                }}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20"
                title="Accetta Suggerimento"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                title="Rifiuta Suggerimento"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </>
          )}
        </div>
      ) : (
        !readOnly && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="shrink-0 flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:min-w-0 md:min-h-0 p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all touch-manipulation"
          title="Rimuovi"
          aria-label="Rimuovi oggetto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        )
      )}
    </div>
  );
};

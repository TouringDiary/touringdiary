import React, { useEffect, useRef, useState } from 'react';
import { Check, MinusCircle, Sparkles, X, Minus, Plus, GripVertical } from 'lucide-react';
import { SuitcaseItem, RuntimeAffiliateProduct } from '@/types/suitcase';
import type { UpdateSuitcaseItemDto } from '@/services/suitcase/suitcaseItemsService';
import { affiliateTrackingService } from '@/services/affiliateTrackingService';
import type { DisplayCategory } from '@/domain/packing/categorySetup';
import { MoveItemCategoryPopover } from './MoveItemCategoryPopover';

interface SuitcaseItemRowProps {
  item: SuitcaseItem;
  readOnly?: boolean;
  onUpdate: (id: string, updates: UpdateSuitcaseItemDto) => void;
  onDelete: (id: string) => void;
  highlightId: string | null;
  override?: RuntimeAffiliateProduct;
  onLinkBuildSearch?: (query: string) => string;
  isSelected?: boolean;
  onSelect?: () => void;
  moveTargets?: DisplayCategory[];
  onMoveToCategory?: (categoryName: string) => void;
  reorderEnabled?: boolean;
  isDragTarget?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
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
  onSelect,
  moveTargets,
  onMoveToCategory,
  reorderEnabled = false,
  isDragTarget = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
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
      onDragOver={reorderEnabled ? onDragOver : undefined}
      onDragLeave={reorderEnabled ? onDragLeave : undefined}
      onDrop={reorderEnabled ? onDrop : undefined}
      className={`flex overflow-hidden rounded-xl border transition-all duration-500 group relative cursor-pointer ${
        isDragTarget
          ? 'border-sky-400/60 bg-sky-500/10 ring-1 ring-sky-400/30'
          : showModifiedHighlight
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
      {!readOnly && reorderEnabled && (
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart?.(e);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            onDragEnd?.();
          }}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 self-stretch flex items-center justify-center w-8 bg-slate-950/60 border-r border-white/[0.06] text-slate-600 hover:text-slate-400 hover:bg-slate-950/80 cursor-grab active:cursor-grabbing touch-manipulation transition-colors"
          aria-label="Riordina oggetto"
          title="Trascina per riordinare"
        >
          <GripVertical className="w-[15px] h-[15px]" />
        </button>
      )}

      <div className="flex items-center gap-2 sm:gap-3 p-3 flex-1 min-w-0">

      {readOnly ? (
        <span
          className="relative group/checkbox shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 md:min-w-[32px] md:min-h-[32px] md:w-8 md:h-8 rounded-lg touch-manipulation cursor-not-allowed"
        >
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            disabled
            aria-checked={!!item.is_checked}
            aria-label={`${item.is_checked ? 'Deseleziona oggetto' : 'Seleziona oggetto'} — Non disponibile in sola lettura`}
            className="flex items-center justify-center w-full h-full rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all shadow-sm ${
                item.is_checked
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              {item.is_checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-950 border border-white/10 text-[10px] font-medium text-slate-200 whitespace-nowrap opacity-0 group-hover/checkbox:opacity-100 group-focus-within/checkbox:opacity-100 transition-opacity duration-100 z-floating-panel shadow-lg"
          >
            Non disponibile in sola lettura
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate(item.id, { is_checked: !item.is_checked });
          }}
          aria-checked={!!item.is_checked}
          aria-label={item.is_checked ? 'Deseleziona oggetto' : 'Seleziona oggetto'}
          className="shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 md:min-w-[32px] md:min-h-[32px] md:w-8 md:h-8 rounded-lg touch-manipulation"
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
      )}

      <span
        className={`flex-1 min-w-0 text-base font-medium transition-colors flex items-center gap-2 ${
          item.is_checked ? 'text-slate-400' : 'text-slate-200'
        }`}
      >
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
            const pid = override.product_id || '';
            if (pid.startsWith('search:')) {
              const keyword = pid.replace('search:', '');
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
              searchQuery: override.product_id?.startsWith('search:')
                ? override.product_id.replace('search:', '')
                : undefined,
            });
          }}
        >
          <img src="/assets/logos/amazon_logo.svg" alt="Amazon" className="h-3.5 object-contain" />
        </a>
      )}

      {!readOnly && moveTargets && moveTargets.length > 0 && onMoveToCategory && (
        <MoveItemCategoryPopover
          targets={moveTargets}
          onSelect={onMoveToCategory}
        />
      )}

      {item.is_ai_suggestion ? (
        <div className="flex items-center gap-1.5 px-1">
          <div
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-sm shrink-0"
            title="Suggerimento AI"
          >
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-amber-600/80 tracking-widest">AI</span>
          </div>

          {!readOnly && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(item.id, { is_ai_suggestion: false, accepted_from_ai: true });
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
            className="shrink-0 flex items-center justify-center min-w-[36px] min-h-[36px] w-9 h-9 md:w-8 md:h-8 p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all touch-manipulation"
            title="Rimuovi"
            aria-label="Rimuovi oggetto"
          >
            <MinusCircle className="w-4 h-4" />
          </button>
        )
      )}

      </div>
    </div>
  );
};

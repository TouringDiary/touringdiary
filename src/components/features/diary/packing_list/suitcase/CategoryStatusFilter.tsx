import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import {
  SUITCASE_COMPACT_DROPDOWN_TRIGGER_LAYOUT_CLASS,
  type CategoryStatusFilter,
} from './SuitcaseUtils';

interface CategoryStatusFilterDropdownProps {
  value: CategoryStatusFilter;
  onChange: (value: CategoryStatusFilter) => void;
  /**
   * Trigger sola-icona (solo `SlidersHorizontal`, niente valore/freccia): usato nel layout
   * compatto (<lg) per inserire il filtro fra i pulsanti della toolbar categorie.
   * Lasciato `false` su desktop → resta il trigger compatto che mostra il valore attivo.
   */
  iconOnly?: boolean;
  /** Override classe del trigger: allinea il pulsante allo stile degli altri della toolbar. */
  triggerClassName?: string;
  /** Dimensione dell'icona in modalità `iconOnly`. */
  iconClassName?: string;
}

/**
 * Chiusura automatica del dropdown dopo un periodo di inattività.
 * Il filtro normalmente si usa una volta sola: lo chiudiamo da solo per liberare spazio,
 * ma il timer viene azzerato ad ogni interazione (hover/tap/tastiera) sul menu.
 */
const FILTER_AUTOCLOSE_MS = 5000;

const FILTER_OPTIONS: {
  value: CategoryStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'ALL' },
  { value: 'incomplete', label: 'INCOMPLETE' },
  { value: 'complete', label: 'COMPLETE' },
];

const ACTIVE_TRIGGER_CLASS: Record<CategoryStatusFilter, string> = {
  all: 'bg-slate-800/90 border-white/15 text-slate-200 hover:bg-slate-800 hover:border-white/25',
  incomplete: 'bg-amber-500/15 border-amber-500/35 text-amber-200 hover:bg-amber-500/20',
  complete: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/20',
};

export const CategoryStatusFilterDropdown: React.FC<CategoryStatusFilterDropdownProps> = ({
  value,
  onChange,
  iconOnly = false,
  triggerClassName,
  iconClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = FILTER_OPTIONS.find((option) => option.value === value) ?? FILTER_OPTIONS[0];

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const scheduleAutoClose = useCallback(() => {
    clearAutoCloseTimer();
    autoCloseTimerRef.current = setTimeout(() => setIsOpen(false), FILTER_AUTOCLOSE_MS);
  }, [clearAutoCloseTimer]);

  // Avvia/azzera il timer all'apertura; pulisce alla chiusura/smontaggio.
  useEffect(() => {
    if (isOpen) {
      scheduleAutoClose();
      return clearAutoCloseTimer;
    }
    clearAutoCloseTimer();
    return undefined;
  }, [isOpen, scheduleAutoClose, clearAutoCloseTimer]);

  const handleSelect = (next: CategoryStatusFilter) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onMouseEnter={() => { if (isOpen) scheduleAutoClose(); }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filtro categorie: ${selected.label}`}
        className={triggerClassName ?? `${SUITCASE_COMPACT_DROPDOWN_TRIGGER_LAYOUT_CLASS} gap-1 px-2 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${ACTIVE_TRIGGER_CLASS[value]}`}
        title={`Filtro: ${selected.label}`}
      >
        {iconOnly ? (
          <SlidersHorizontal className={iconClassName ?? 'w-4 h-4'} aria-hidden />
        ) : (
          <>
            <ChevronDown
              className={`w-3 h-3 shrink-0 opacity-80 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider leading-none whitespace-nowrap">
              {selected.label}
            </span>
          </>
        )}
      </button>

      <AnchoredPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        align="left"
        role="listbox"
        className="min-w-[7.5rem] rounded-xl border border-white/10 bg-slate-950/98 backdrop-blur-md shadow-2xl shadow-black/40 py-1 overflow-hidden pointer-events-auto"
      >
        {/* Reset del timer di auto-chiusura: un'unica funzione (scheduleAutoClose) agganciata
            alle sole modalità di input distinte — puntatore (mouse+touch) e tastiera.
            onMouseEnter è omesso perché ridondante con onPointerMove. */}
        <div
          onPointerMove={scheduleAutoClose}
          onPointerDown={scheduleAutoClose}
          onKeyDown={scheduleAutoClose}
        >
        {FILTER_OPTIONS.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                isSelected
                  ? 'bg-indigo-500/15 text-indigo-100'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-3.5 shrink-0 flex items-center justify-center">
                {isSelected ? <Check className="w-3 h-3 text-indigo-400" aria-hidden /> : null}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {option.label}
              </span>
            </button>
          );
        })}
        </div>
      </AnchoredPopover>
    </>
  );
};

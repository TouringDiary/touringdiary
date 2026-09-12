import { X } from 'lucide-react';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import type { CultureFilterState } from '@/domain/city/famousPersonFilter';
import type { CategoryOption } from './useCultureCornerSession';

interface CultureCornerFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  panelRef?: RefObject<HTMLDivElement | null>;
  filters: CultureFilterState;
  filtersActive: boolean;
  masterOptions: Array<{ slug: string; label: string; orderIndex: number }>;
  visibleSpecificOptions: CategoryOption[];
  toggleMaster: (slug: string) => void;
  toggleSpecific: (slug: string) => void;
  clearFilters: () => void;
  applyFilterChange: (nextFilters: CultureFilterState) => void;
}

const parseYearInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
};

const CATEGORY_BOX_SCROLL_CLASS =
  'min-h-[8rem] max-h-[10rem] sm:max-h-[12rem] overflow-y-auto custom-scrollbar p-2 space-y-1.5';

const CATEGORY_CHECKBOX_LABEL_CLASS =
  'flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-colors min-h-11 w-full';

const YEAR_INPUT_FIELD_CLASS =
  'w-full min-h-11 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600 outline-none transition-[border-color] focus:border-amber-500 focus-visible:border-amber-500';

function CategoryCheckboxList({
  options,
  checkedSlugs,
  onToggle,
  checkedClassName,
  uncheckedClassName,
  checkboxClassName,
  emptyMessage,
}: {
  options: Array<{ slug: string; label: string }>;
  checkedSlugs: string[];
  onToggle: (slug: string) => void;
  checkedClassName: string;
  uncheckedClassName: string;
  checkboxClassName: string;
  emptyMessage: string;
}) {
  if (options.length === 0) {
    return <p className="px-2 py-3 text-xs text-slate-600 italic">{emptyMessage}</p>;
  }

  return options.map((option) => {
    const checked = checkedSlugs.includes(option.slug);
    return (
      <label
        key={option.slug}
        className={`${CATEGORY_CHECKBOX_LABEL_CLASS} ${
          checked ? checkedClassName : uncheckedClassName
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(option.slug)}
          className={`shrink-0 rounded border-slate-600 bg-slate-900 focus:ring-amber-500 ${checkboxClassName}`}
        />
        <span className="min-w-0 leading-snug">{option.label}</span>
      </label>
    );
  });
}

export const CultureCornerFilters = ({
  isOpen,
  onClose,
  anchorRef,
  panelRef,
  filters,
  filtersActive,
  masterOptions,
  visibleSpecificOptions,
  toggleMaster,
  toggleSpecific,
  clearFilters,
  applyFilterChange,
}: CultureCornerFiltersProps) => {
  const titleId = 'culture-filters-title';
  const masterBoxId = useId();
  const specificBoxId = useId();

  const [yearFromText, setYearFromText] = useState('');
  const [yearToText, setYearToText] = useState('');
  const yearFromFocusedRef = useRef(false);
  const yearToFocusedRef = useRef(false);

  useEffect(() => {
    if (yearFromFocusedRef.current) return;
    setYearFromText(filters.birthYearFrom != null ? String(filters.birthYearFrom) : '');
  }, [filters.birthYearFrom]);

  useEffect(() => {
    if (yearToFocusedRef.current) return;
    setYearToText(filters.birthYearTo != null ? String(filters.birthYearTo) : '');
  }, [filters.birthYearTo]);

  const commitYearFrom = () => {
    applyFilterChange({
      ...filters,
      birthYearFrom: parseYearInput(yearFromText),
    });
  };

  const commitYearTo = () => {
    applyFilterChange({
      ...filters,
      birthYearTo: parseYearInput(yearToText),
    });
  };

  const handleYearFromFocus = () => {
    yearFromFocusedRef.current = true;
  };

  const handleYearFromBlur = () => {
    yearFromFocusedRef.current = false;
    commitYearFrom();
  };

  const handleYearToFocus = () => {
    yearToFocusedRef.current = true;
  };

  const handleYearToBlur = () => {
    yearToFocusedRef.current = false;
    commitYearTo();
  };

  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      panelRef={panelRef}
      align="right"
      role="dialog"
      aria-labelledby={titleId}
      className="w-[min(92vw,28rem)] rounded-2xl border border-slate-700 bg-[#020617] shadow-2xl shadow-black/50 p-4"
    >
      <div className="space-y-4 max-h-[min(75vh,32rem)] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between gap-2">
          <h2
            id={titleId}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500"
          >
            Filtra personaggi
          </h2>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded min-h-8 px-2"
            >
              <X className="w-3 h-3" aria-hidden />
              Pulisci
            </button>
          ) : null}
        </div>

        <fieldset className="space-y-3 min-w-0">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Categorie
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <section
              aria-labelledby={masterBoxId}
              className="flex flex-col min-w-0 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden"
            >
              <h3
                id={masterBoxId}
                className="shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 bg-slate-900/40"
              >
                Master
              </h3>
              <div className={CATEGORY_BOX_SCROLL_CLASS}>
                <CategoryCheckboxList
                  options={masterOptions}
                  checkedSlugs={filters.masterSlugs}
                  onToggle={toggleMaster}
                  checkedClassName="border-indigo-500 bg-indigo-900/40 text-indigo-100"
                  uncheckedClassName="border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"
                  checkboxClassName="text-indigo-500"
                  emptyMessage="Nessuna categoria disponibile."
                />
              </div>
            </section>

            <section
              aria-labelledby={specificBoxId}
              className="flex flex-col min-w-0 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden"
            >
              <h3
                id={specificBoxId}
                className="shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 bg-slate-900/40"
              >
                Specifiche
              </h3>
              <div className={CATEGORY_BOX_SCROLL_CLASS}>
                <CategoryCheckboxList
                  options={visibleSpecificOptions}
                  checkedSlugs={filters.specificSlugs}
                  onToggle={toggleSpecific}
                  checkedClassName="border-amber-500/70 bg-amber-500/10 text-amber-100"
                  uncheckedClassName="border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"
                  checkboxClassName="text-amber-500"
                  emptyMessage="Nessuna specifica disponibile."
                />
              </div>
            </section>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Anno di nascita
          </legend>
          <div className="flex items-center gap-2">
            <label className="flex-1 space-y-1 min-w-0">
              <span className="sr-only">Anno di nascita da</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Da"
                value={yearFromText}
                onChange={(e) => setYearFromText(e.target.value)}
                onFocus={handleYearFromFocus}
                onBlur={handleYearFromBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className={YEAR_INPUT_FIELD_CLASS}
              />
            </label>
            <span className="text-slate-600 text-xs shrink-0" aria-hidden>
              —
            </span>
            <label className="flex-1 space-y-1 min-w-0">
              <span className="sr-only">Anno di nascita a</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="A"
                value={yearToText}
                onChange={(e) => setYearToText(e.target.value)}
                onFocus={handleYearToFocus}
                onBlur={handleYearToBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className={YEAR_INPUT_FIELD_CLASS}
              />
            </label>
          </div>
        </fieldset>
      </div>
    </AnchoredPopover>
  );
};

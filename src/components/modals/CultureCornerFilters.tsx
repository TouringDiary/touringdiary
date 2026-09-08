import type { RefObject } from 'react';
import { X } from 'lucide-react';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';
import type { CultureFilterState } from '@/domain/city/famousPersonFilter';
import type { CategoryOption } from './useCultureCornerSession';

interface CultureCornerFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
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

export const CultureCornerFilters = ({
  isOpen,
  onClose,
  anchorRef,
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
  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      align="right"
      role="dialog"
      aria-labelledby={titleId}
      className="w-[min(92vw,22rem)] rounded-2xl border border-slate-700 bg-[#020617] shadow-2xl shadow-black/50 p-4"
    >
      <div className="space-y-4 max-h-[min(70vh,28rem)] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
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

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Categorie master
          </legend>
          {masterOptions.length === 0 ? (
            <p className="text-xs text-slate-600 italic">Nessuna categoria disponibile.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {masterOptions.map((m) => {
                const checked = filters.masterSlugs.includes(m.slug);
                return (
                  <label
                    key={m.slug}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors min-h-11 ${
                      checked
                        ? 'border-indigo-500 bg-indigo-900/40 text-indigo-100'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMaster(m.slug)}
                      className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-amber-500"
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Categorie specifiche
          </legend>
          {visibleSpecificOptions.length === 0 ? (
            <p className="text-xs text-slate-600 italic">Nessuna specifica disponibile.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleSpecificOptions.map((s) => {
                const checked = filters.specificSlugs.includes(s.slug);
                return (
                  <label
                    key={s.slug}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors min-h-11 ${
                      checked
                        ? 'border-amber-500/70 bg-amber-500/10 text-amber-100'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSpecific(s.slug)}
                      className="rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Anno di nascita
          </legend>
          <div className="flex items-center gap-2">
            <label className="flex-1 space-y-1">
              <span className="sr-only">Anno di nascita da</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Da"
                value={filters.birthYearFrom ?? ''}
                onChange={(e) =>
                  applyFilterChange({
                    ...filters,
                    birthYearFrom: parseYearInput(e.target.value),
                  })
                }
                className="w-full min-h-11 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </label>
            <span className="text-slate-600 text-xs" aria-hidden>
              —
            </span>
            <label className="flex-1 space-y-1">
              <span className="sr-only">Anno di nascita a</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="A"
                value={filters.birthYearTo ?? ''}
                onChange={(e) =>
                  applyFilterChange({
                    ...filters,
                    birthYearTo: parseYearInput(e.target.value),
                  })
                }
                className="w-full min-h-11 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </label>
          </div>
        </fieldset>
      </div>
    </AnchoredPopover>
  );
};

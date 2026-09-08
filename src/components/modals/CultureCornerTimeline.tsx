import type { RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DraggableSlider, type DraggableSliderHandle } from '@/components/common/DraggableSlider';
import type { DerivedPersonData } from './cultureCornerUtils';
import type { VisibleBirthYearRange } from './useCultureCornerTimeline';

interface CultureCornerTimelineProps {
  timelineRef: RefObject<DraggableSliderHandle | null>;
  derivedPeople: DerivedPersonData[];
  selectedPersonId: string | null;
  selectPerson: (id: string) => void;
  viewportYears: VisibleBirthYearRange;
  timelineCanScrollLeft: boolean;
  timelineCanScrollRight: boolean;
}

function formatViewportYear(year: number | null): string {
  return year == null ? '—' : String(year);
}

export const CultureCornerTimeline = ({
  timelineRef,
  derivedPeople,
  selectedPersonId,
  selectPerson,
  viewportYears,
  timelineCanScrollLeft,
  timelineCanScrollRight,
}: CultureCornerTimelineProps) => {
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <div className="shrink-0 flex flex-col items-center gap-1.5 w-12 pt-0.5">
        <button
          type="button"
          onClick={() => timelineRef.current?.scroll('left')}
          disabled={!timelineCanScrollLeft}
          aria-label="Scorri timeline a sinistra"
          aria-disabled={!timelineCanScrollLeft}
          className="inline-flex items-center justify-center min-h-11 min-w-11 p-0 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:text-slate-400"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
        </button>
        <span className="min-h-4 font-mono text-[11px] sm:text-xs font-bold text-amber-400 tracking-wider tabular-nums leading-none text-center">
          {formatViewportYear(viewportYears.minYear)}
        </span>
      </div>

      <div className="relative flex-1 min-w-0 self-center">
        {/* Asse timeline: dietro i box, solo viewport visibile, no pointer */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-px -translate-y-1/2 bg-slate-600/70"
          aria-hidden
        />
        <DraggableSlider ref={timelineRef} className="relative z-10 gap-2 pb-1">
          {derivedPeople.map(({ id, name, primaryMasterLabel, yearLabel }) => {
            const selected = id === selectedPersonId;
            return (
              <button
                key={`tl-${id}`}
                type="button"
                data-person-id={id}
                onClick={() => selectPerson(id)}
                aria-pressed={selected}
                aria-label={
                  primaryMasterLabel
                    ? `Seleziona ${name}, nascite ${yearLabel}, ${primaryMasterLabel}`
                    : `Seleziona ${name}, nascite ${yearLabel}`
                }
                className={`snap-start shrink-0 flex flex-col items-stretch gap-0.5 px-3 py-2 rounded-xl border w-[9.5rem] max-w-[9.5rem] min-w-0 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selected
                    ? 'border-amber-500 bg-slate-950 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-500/40'
                }`}
              >
                <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                  {yearLabel}
                </span>
                <span className="block w-full min-w-0 truncate text-[11px] font-bold leading-none">
                  {name}
                </span>
                {primaryMasterLabel ? (
                  <span className="block w-full min-w-0 truncate text-[9px] uppercase tracking-widest text-indigo-400">
                    {primaryMasterLabel}
                  </span>
                ) : null}
              </button>
            );
          })}
        </DraggableSlider>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-1.5 w-12 pt-0.5">
        <button
          type="button"
          onClick={() => timelineRef.current?.scroll('right')}
          disabled={!timelineCanScrollRight}
          aria-label="Scorri timeline a destra"
          aria-disabled={!timelineCanScrollRight}
          className="inline-flex items-center justify-center min-h-11 min-w-11 p-0 bg-slate-900 border border-slate-700 rounded-lg hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:text-slate-400"
        >
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
        <span className="min-h-4 font-mono text-[11px] sm:text-xs font-bold text-amber-400 tracking-wider tabular-nums leading-none text-center">
          {formatViewportYear(viewportYears.maxYear)}
        </span>
      </div>
    </div>
  );
};

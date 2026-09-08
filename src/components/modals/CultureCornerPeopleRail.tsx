import type { RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DraggableSlider, type DraggableSliderHandle } from '@/components/common/DraggableSlider';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import type { DerivedPersonData } from './cultureCornerUtils';

interface CultureCornerPeopleRailProps {
  railRef: RefObject<DraggableSliderHandle | null>;
  derivedPeople: DerivedPersonData[];
  selectedPersonId: string | null;
  selectPerson: (
    personId: string,
    options?: { openDetail?: boolean; syncBehavior?: ScrollBehavior },
  ) => void;
  showRailArrows: boolean;
}

const RAIL_CARD_HEIGHT_CLASS = 'h-[420px] sm:h-[440px] md:h-[460px]';

export const CultureCornerPeopleRail = ({
  railRef,
  derivedPeople,
  selectedPersonId,
  selectPerson,
  showRailArrows,
}: CultureCornerPeopleRailProps) => {
  return (
    <div className="flex items-stretch gap-1.5 sm:gap-2 min-w-0">
      {showRailArrows ? (
        <button
          type="button"
          onClick={() => railRef.current?.scroll('left')}
          aria-label="Scorri personaggi a sinistra"
          className={`hidden md:inline-flex shrink-0 self-stretch w-11 items-center justify-center p-0 bg-slate-900/90 border border-slate-700 rounded-xl hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${RAIL_CARD_HEIGHT_CLASS}`}
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
      ) : null}
      <div className="flex-1 min-w-0">
        <DraggableSlider ref={railRef} className="gap-4 sm:gap-5 pb-1">
          {derivedPeople.map(
            ({
              id,
              name,
              imageUrl,
              sortableCategories,
              primarySpecific,
              cityBadge,
              lifespan,
            }) => {
              const selected = id === selectedPersonId;

              return (
                <article
                  key={id}
                  className={`snap-start shrink-0 w-[260px] sm:w-[300px] ${RAIL_CARD_HEIGHT_CLASS} rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden border flex flex-col bg-slate-950 transition-all ${
                    selected
                      ? 'border-amber-500 shadow-xl shadow-amber-900/20 ring-2 ring-amber-500/40'
                      : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectPerson(id)}
                    aria-pressed={selected}
                    aria-label={`Seleziona ${name}`}
                    className="group relative flex-1 min-h-0 w-full p-0 border-0 bg-slate-900 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                  >
                    <ImageWithFallback
                      src={imageUrl}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        selected
                          ? 'grayscale-0 scale-105'
                          : 'grayscale group-hover:grayscale-0 group-hover:scale-105'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent opacity-90 pointer-events-none" />
                    {cityBadge ? (
                      <span className="absolute top-3 left-3 z-local-raised text-[9px] font-bold uppercase tracking-widest text-emerald-300/90 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {cityBadge}
                      </span>
                    ) : null}
                  </button>

                  <div className="shrink-0 px-4 pt-3 pb-2 border-t border-slate-800/80 bg-[#020617]">
                    <button
                      type="button"
                      onClick={() => selectPerson(id, { openDetail: true })}
                      aria-label={`Scopri la storia di ${name}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      Scopri la storia
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </div>

                  <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col gap-1.5 bg-[#020617]">
                    <div className="flex flex-wrap gap-1">
                      {sortableCategories.length > 0 ? (
                        sortableCategories.slice(0, 2).map((c) => (
                          <span
                            key={`${id}-${c.slug}`}
                            className={`text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded border ${
                              primarySpecific?.slug === c.slug
                                ? 'text-indigo-200 border-indigo-400/50 bg-indigo-900/40'
                                : 'text-slate-400 border-slate-700/80 bg-slate-900/40'
                            }`}
                          >
                            {c.label}
                          </span>
                        ))
                      ) : primarySpecific ? (
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] pl-1 border-l-2 border-indigo-500">
                          {primarySpecific.label}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg sm:text-2xl font-display font-bold text-white leading-[0.95] line-clamp-2">
                      {name}
                    </h3>
                    {lifespan ? (
                      <p className="text-slate-400 font-mono text-xs tracking-wider">
                        {lifespan}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            },
          )}
        </DraggableSlider>
      </div>
      {showRailArrows ? (
        <button
          type="button"
          onClick={() => railRef.current?.scroll('right')}
          aria-label="Scorri personaggi a destra"
          className={`hidden md:inline-flex shrink-0 self-stretch w-11 items-center justify-center p-0 bg-slate-900/90 border border-slate-700 rounded-xl hover:border-amber-500 text-slate-400 hover:text-white transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${RAIL_CARD_HEIGHT_CLASS}`}
        >
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
};

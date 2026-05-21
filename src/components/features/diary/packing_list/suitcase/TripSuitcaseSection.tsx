import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Briefcase, Link2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SuitcaseCard } from './SuitcaseCard';
import { TemplateCategoryIcon } from './SuitcaseUtils';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';

interface TripSuitcaseSectionProps {
  tripSuitcases: Suitcase[];
  mergedSuggestedItems?: SuitcaseItem[];
  suggestedTemplates?: Suitcase[];
  isMerging?: boolean;
  onOpenSuitcase: (id: string) => void;
  onUnlinkSuitcase: (id: string) => void;
  onDeleteSuitcase: (id: string) => void;
  onUseSuggested?: () => void;
  onDismissSuggested?: () => void;
  currentUser?: any;
  compact?: boolean;
}

export const TripSuitcaseSection: React.FC<TripSuitcaseSectionProps> = ({
  tripSuitcases,
  mergedSuggestedItems,
  suggestedTemplates,
  isMerging,
  onOpenSuitcase,
  onUnlinkSuitcase,
  onDeleteSuitcase,
  onUseSuggested,
  onDismissSuggested,
  currentUser,
  compact = false
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    setShowArrows(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);
    checkScroll();

    return () => observer.disconnect();
  }, [checkScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollLeft / (target.scrollWidth - target.clientWidth)) * 100;
    setScrollProgress(isNaN(progress) ? 0 : progress);
    checkScroll();
  };

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };
  return (
    <div className="space-y-4">
      {/* ── Suggested Suitcase (Auto-Merge) ── */}
      {mergedSuggestedItems?.length > 0 && tripSuitcases.length === 0 && (
        <div className="p-4 bg-indigo-900/40 rounded-2xl border border-indigo-400/30 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          <div className="relative z-floating-panel">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider">Magic Pack</span>
              <h4 className="text-sm font-bold text-white">Valigia suggerita</h4>
            </div>
            <p className="text-xs text-indigo-200 mb-4 pr-10">
              Abbiamo creato una valigia perfetta unendo {suggestedTemplates?.length ?? 0} template per la tua destinazione.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedTemplates?.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-indigo-950/50 border border-indigo-400/20 text-[10px] text-indigo-300">
                  <TemplateCategoryIcon template={t} className="w-3.5 h-3.5" />
                  <span>{t.title}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onUseSuggested}
                disabled={isMerging}
                className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {isMerging ? <Sparkles className="w-3 h-3 animate-spin" /> : <Briefcase className="w-3 h-3" />}
                {isMerging ? 'Preparazione in corso...' : 'Usa questa valigia'}
              </button>
              <button
                onClick={onDismissSuggested}
                className="w-full py-2 rounded-xl border border-indigo-400/30 text-indigo-300 hover:text-white hover:bg-indigo-400/10 font-bold text-[10px] transition-all"
              >
                Scegli un altro template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Trip Suitcase ── */}
      <div className="relative group">
        {!compact && (
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valigia di questo viaggio</p>

            {showArrows && (
              <div className="flex bg-slate-900 rounded-lg border border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-r border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scorri a sinistra"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Scorri a destra"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="block overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full"
        >
          {tripSuitcases.length > 0 ? (
            <div className="flex flex-nowrap items-stretch gap-3 min-w-max">
              {tripSuitcases.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <SuitcaseCard
                    suitcase={s}
                    isActive={true}
                    isLinked={true}
                    onClick={onOpenSuitcase}
                    onDelete={onUnlinkSuitcase}
                    currentUser={currentUser}
                  />
                  {idx < tripSuitcases.length - 1 && (
                    <div className="flex items-center px-1">
                      <div className="w-6 h-px bg-slate-800 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 bg-slate-950 rounded-full border border-slate-800 shadow-sm">
                          <Link2 className="w-3 h-3 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : !compact ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-500 mb-1">Nessuna valigia collegata a questo diario.</p>
              <div className="mt-1">
                <span className="px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-300 text-[8px] font-bold uppercase tracking-wider border border-slate-500/20 whitespace-nowrap">
                  0 oggetti
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Scegline una dai template o dalle tue salvate.</p>
            </div>
          ) : null}
        </div>

        {/* PROGESS BAR SOTTILE */}
        {tripSuitcases.length > 1 && (
          <div className="mt-2 px-1">
            <div className="w-full h-0.5 bg-slate-800/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-150 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

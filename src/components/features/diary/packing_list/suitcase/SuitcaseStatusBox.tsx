import React, { useMemo } from 'react';
import { Suitcase } from '@/types/suitcase';
import { getSuitcaseItemProgress } from './SuitcaseUtils';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';
import { SuitcaseAscentProgressIndicator } from './SuitcaseAscentProgressIndicator';

interface SuitcaseStatusBoxProps {
  suitcases: Suitcase[];
  onOpenSuitcase: (id: string) => void;
  onHoverSuitcase: (id: string | null) => void;
  onSelectSuitcase?: (id: string) => void;
  activeTabId: string | null;
}

export const SuitcaseStatusBox: React.FC<SuitcaseStatusBoxProps> = ({
  suitcases,
  onOpenSuitcase,
  onHoverSuitcase,
  onSelectSuitcase,
  activeTabId,
}) => {
  const globalStats = useMemo(() => {
    const allItems = suitcases.flatMap((s) => s.suitcase_items ?? []);
    return getSuitcaseItemProgress(allItems);
  }, [suitcases]);

  if (suitcases.length === 0) return null;

  const suitcaseGridClass =
    suitcases.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-1';

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-2 sm:p-4 w-full grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 items-stretch animate-in fade-in zoom-in duration-500">
      <SuitcaseToolbarProgressBox
        checkedCount={globalStats.checked}
        totalCount={globalStats.total}
        progressPerc={globalStats.percentage}
        variant="panels"
        className="w-full h-full min-w-0"
        mobileSingleRow
      />

      <div
        className={`grid ${suitcaseGridClass} gap-2 min-w-0 min-h-0 ${
          suitcases.length > 2 ? 'max-h-36 sm:max-h-40 overflow-y-auto custom-scrollbar pr-0.5' : ''
        }`}
      >
        {suitcases.map((s) => {
          const { percentage: perc } = getSuitcaseItemProgress(s.suitcase_items);
          const isActive = activeTabId === s.id;

          const dotClass = `w-1.5 h-1.5 rounded-full shrink-0 ${
            perc === 100
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
          }`;

          return (
            <div
              key={s.id}
              onClick={() => (onSelectSuitcase ? onSelectSuitcase(s.id) : onOpenSuitcase(s.id))}
              onMouseEnter={() => onHoverSuitcase(s.id)}
              onMouseLeave={() => onHoverSuitcase(null)}
              className={`flex flex-col justify-center h-full rounded-xl border transition-all cursor-pointer px-2.5 py-1.5 min-h-0 lg:px-3 lg:py-2.5 lg:min-h-[4.5rem] ${
                isActive
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                  : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-800 text-slate-400'
              }`}
            >
              {/* Mobile (<lg): nome + % su una riga, barra avanzamento sotto */}
              <div className="flex lg:hidden flex-col gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={dotClass} />
                  <span className="text-[10px] font-bold leading-snug truncate flex-1 min-w-0">
                    {s.title}
                  </span>
                  <span className="text-[10px] font-black tabular-nums text-white shrink-0">{perc}%</span>
                </div>
                <SuitcaseAscentProgressIndicator progressPerc={perc} />
              </div>

              {/* Desktop (lg+): layout originale invariato */}
              <div className="hidden lg:flex lg:flex-col lg:gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={dotClass} />
                  <span className="text-[10px] font-bold line-clamp-2 leading-snug">{s.title}</span>
                </div>
                <span className="text-[10px] font-black tabular-nums text-white self-end">{perc}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

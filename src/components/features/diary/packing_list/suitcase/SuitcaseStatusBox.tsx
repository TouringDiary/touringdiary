import React, { useMemo } from 'react';
import { Suitcase } from '@/types/suitcase';
import { getSuitcaseItemProgress } from './SuitcaseUtils';
import { SuitcaseToolbarProgressBox } from './SuitcaseToolbarProgressBox';

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
  activeTabId
}) => {
  const globalStats = useMemo(() => {
    const allItems = suitcases.flatMap((s) => s.suitcase_items ?? []);
    return getSuitcaseItemProgress(allItems);
  }, [suitcases]);

  if (suitcases.length === 0) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 py-4 px-5 w-full h-[85px] lg:h-[90px] flex flex-col lg:flex-row items-stretch gap-6 animate-in fade-in zoom-in duration-500 overflow-hidden">
      <div className="lg:w-[320px] shrink-0 flex flex-col justify-center">
        <SuitcaseToolbarProgressBox
          checkedCount={globalStats.checked}
          totalCount={globalStats.total}
          progressPerc={globalStats.percentage}
          variant="panels"
        />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="flex flex-col gap-2 py-1.5">
          {suitcases.map(s => {
            const { percentage: perc } = getSuitcaseItemProgress(s.suitcase_items);
            const isActive = activeTabId === s.id;

            return (
              <div 
                key={s.id}
                onClick={() => onSelectSuitcase ? onSelectSuitcase(s.id) : onOpenSuitcase(s.id)}
                onMouseEnter={() => onHoverSuitcase(s.id)}
                onMouseLeave={() => onHoverSuitcase(null)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                    : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${perc === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`} />
                  <span className="text-[10px] font-bold truncate">{s.title}</span>
                </div>
                <span className="text-[10px] font-black tabular-nums text-white ml-2">{perc}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

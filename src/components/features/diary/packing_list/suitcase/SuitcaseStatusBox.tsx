import React, { useMemo } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Suitcase } from '@/types/suitcase';

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
    let total = 0;
    let checked = 0;
    
    suitcases.forEach(s => {
      const items = s.suitcase_items || [];
      total += items.length;
      checked += items.filter(i => i.is_checked).length;
    });

    return {
      total,
      checked,
      percentage: total > 0 ? Math.round((checked / total) * 100) : 0
    };
  }, [suitcases]);

  if (suitcases.length === 0) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 py-4 px-5 w-full h-[85px] lg:h-[90px] flex flex-col lg:flex-row items-stretch gap-6 animate-in fade-in zoom-in duration-500 overflow-hidden">
      {/* Left: Global Stats (Fixed width area) */}
      <div className="lg:w-[320px] shrink-0 flex flex-col justify-start pt-1 gap-y-2">
        {/* Row 1: Stats & Percentage Inline */}
        <div className="flex items-baseline gap-5 mb-0.5">
          <span className="text-[18px] font-semibold text-slate-100 tabular-nums">
            {globalStats.checked} / {globalStats.total} <span className="text-[12px] uppercase text-indigo-400 ml-1 font-medium">oggetti</span>
          </span>
          <span className="text-[14px] font-semibold text-indigo-400 leading-none">{globalStats.percentage}%</span>
        </div>

        {/* Row 2: Progress Bar */}
        <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.3)]" 
            style={{ width: `${globalStats.percentage}%` }}
          />
        </div>
      </div>

      {/* Right: Individual Suitcases List (Scrollable) */}
      <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="flex flex-col gap-2 py-1.5">
          {suitcases.map(s => {
            const total = s.suitcase_items?.length || 0;
            const checked = s.suitcase_items?.filter(i => i.is_checked).length || 0;
            const perc = total > 0 ? Math.round((checked / total) * 100) : 0;
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

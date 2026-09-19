import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

export type ReportsMicroTab = {
  id: string;
  label: string;
};

type ReportsMicroTabBarProps = {
  tabs: readonly ReportsMicroTab[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
};

export const ReportsMicroTabBar = ({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}: ReportsMicroTabBarProps) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTabAt = (index: number) => {
    const tab = tabs[index];
    if (!tab) return;
    onChange(tab.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = tabs.length;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % count;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + count) % count;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = count - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    focusTabAt(nextIndex);
  };

  return (
    <div
      className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-950/60 border border-slate-800"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`reports-micro-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`reports-micro-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';
import { CalendarDays, LayoutGrid, RotateCcw, RotateCw, StickyNote } from 'lucide-react';
import { HorizontalScrollStrip } from '@/components/common/HorizontalScrollStrip';
import type { DiaryActiveTab } from '@/domain/diary/diaryActiveTab';
import { isDayTab } from '@/domain/diary/diaryActiveTab';
import './diaryHeaderTabs.css';

interface DiaryHeaderTabsProps {
    days: Date[];
    activeTab: DiaryActiveTab;
    setActiveTab: (tab: DiaryActiveTab) => void;
    tabsContainerRef: React.RefObject<HTMLDivElement>;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

function headerTabClass(active: boolean, size: 'all' | 'day' | 'notes'): string {
    const sizeClass =
        size === 'all'
            ? 'diary-header-tab--all'
            : size === 'notes'
              ? 'diary-header-tab--notes'
              : 'diary-header-tab--day';
    const stateClass = active ? 'diary-header-tab--active' : 'diary-header-tab--inactive';
    return `diary-header-tab ${sizeClass} ${stateClass}`;
}

export const DiaryHeaderTabs: React.FC<DiaryHeaderTabsProps> = ({
    days, activeTab, setActiveTab, tabsContainerRef,
    onUndo, onRedo, canUndo, canRedo
}) => {
    return (
        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-800/50 min-w-0">
            <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={headerTabClass(activeTab === 'all', 'all')}
            >
                <span className="diary-header-tab__icon-well" aria-hidden>
                    <LayoutGrid className="diary-header-tab__icon" />
                </span>
                <span className="diary-header-tab__label">ALL</span>
            </button>

            <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />

            <div className="flex-1 min-w-0 flex items-center">
                <HorizontalScrollStrip
                    className="flex-1 min-w-0 w-full"
                    scrollClassName="flex-nowrap"
                    scrollRef={tabsContainerRef}
                    ariaLabel="Giorni del viaggio"
                    arrowClassName="diary-header-tab-scroll-arrow"
                >
                    {days.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setActiveTab(index)}
                            className={headerTabClass(isDayTab(activeTab) && activeTab === index, 'day')}
                        >
                            <span className="diary-header-tab__icon-well" aria-hidden>
                                <CalendarDays className="diary-header-tab__icon" />
                            </span>
                            <span className="diary-header-tab__label">DAY {index + 1}</span>
                        </button>
                    ))}
                </HorizontalScrollStrip>
            </div>

            <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`${headerTabClass(activeTab === 'notes', 'notes')} ml-1`}
            >
                <span className="diary-header-tab__icon-well" aria-hidden>
                    <StickyNote className="diary-header-tab__icon" />
                </span>
                <span className="diary-header-tab__label">NOTE</span>
            </button>

            <div className="mx-2 h-4 w-px bg-slate-700 shrink-0" />

            <div className="flex items-center gap-0.5 shrink-0">
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Annulla (Ctrl+Z)"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Ripristina (Ctrl+Y)"
                >
                    <RotateCw className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

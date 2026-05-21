import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';

interface DiaryHeaderTabsProps {
    days: Date[];
    activeTab: 'all' | number;
    setActiveTab: (tab: 'all' | number) => void;
    scrollTabs: (direction: 'left' | 'right') => void;
    tabsContainerRef: React.RefObject<HTMLDivElement>;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export const DiaryHeaderTabs: React.FC<DiaryHeaderTabsProps> = ({
    days, activeTab, setActiveTab, scrollTabs, tabsContainerRef,
    onUndo, onRedo, canUndo, canRedo
}) => {
    return (
        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-800/50">
            <button 
                onClick={() => setActiveTab('all')} 
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 border ${activeTab === 'all' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
                ALL
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button onClick={() => scrollTabs('left')} className="p-0.5 text-slate-500 hover:text-white"><ChevronLeft className="w-3 h-3"/></button>
            <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-1 mx-1" ref={tabsContainerRef}>
                {days.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => setActiveTab(index)} 
                        className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-colors duration-150 ${activeTab === index ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
                    >
                        DAY {index + 1}
                    </button>
                ))}
            </div>
            <button onClick={() => scrollTabs('right')} className="p-0.5 text-slate-500 hover:text-white"><ChevronRight className="w-3 h-3"/></button>

            {/* Visual Separator */}
            <div className="mx-2 h-4 w-px bg-slate-700" />

            {/* Undo/Redo Buttons */}
            <div className="flex items-center gap-0.5">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Annulla (Ctrl+Z)"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
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

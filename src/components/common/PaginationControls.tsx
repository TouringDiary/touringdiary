
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    maxPage: number;
    onNext: () => void;
    onPrev: () => void;
    totalItems: number;
}

export const PaginationControls = ({ currentPage, maxPage, onNext, onPrev, totalItems }: PaginationControlsProps) => {
    if (maxPage <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
            <div className="text-xs text-slate-500 font-mono">
                Totale: <span className="font-bold text-slate-300">{totalItems}</span> elementi
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onPrev} 
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-bold text-slate-400 px-2">
                    Pagina <span className="text-white">{currentPage}</span> di {maxPage}
                </span>

                <button 
                    onClick={onNext} 
                    disabled={currentPage === maxPage}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

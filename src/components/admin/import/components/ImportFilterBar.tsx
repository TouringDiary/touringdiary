
import React from 'react';
import { Search, Filter } from 'lucide-react';

interface ImportFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    activeFiltersCount: number;
    onOpenFilterDrawer: () => void;
}

export const ImportFilterBar = ({ 
    searchTerm, 
    onSearchChange, 
    onKeyDown, 
    activeFiltersCount, 
    onOpenFilterDrawer 
}: ImportFilterBarProps) => {
    return (
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
             <div className="relative group w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-cyan-500 transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Cerca nome o indirizzo..." 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
            </div>
            
            <button 
                onClick={onOpenFilterDrawer}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'}`}
            >
                <Filter className="w-3.5 h-3.5"/> 
                Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
        </div>
    );
};

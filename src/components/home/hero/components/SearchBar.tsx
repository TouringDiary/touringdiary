
import React from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { CitySummary } from '../../../../types/index';
import { heroCompactFieldShell, HERO_COMPACT } from '../heroCompactTokens';
import { HeroCompactInputShell, HeroCompactInputInner } from './HeroCompactInputShell';

interface SearchBarProps {
    className?: string;
    variant?: 'default' | 'minimal';
    compact?: boolean;
    value: string;
    onChange: (val: string) => void;
    isFocused: boolean;
    onFocus: (val: boolean) => void;
    results: CitySummary[];
    onSelect: (id: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const SearchBar = ({ className = "", variant = "default", compact = false, value, onChange, isFocused, onFocus, results, onSelect, containerRef }: SearchBarProps) => {
    const showResults = isFocused && value.trim().length > 0;

    return (
    <div className={`w-full relative ${showResults ? 'z-home-hero-popover' : ''} ${className}`} ref={containerRef}>
        {compact ? (
            <HeroCompactInputShell focused={isFocused}>
                <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${isFocused ? 'text-amber-500' : 'text-slate-500'}`} />
                <HeroCompactInputInner>
                    <input
                        type="text"
                        placeholder="Cerca una città"
                        value={value}
                        onChange={(e) => { onChange(e.target.value); onFocus(true); }}
                        onFocus={() => onFocus(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                onChange('');
                                onFocus(false);
                            }
                        }}
                        className={`w-full min-w-0 bg-transparent border-none outline-none ${HERO_COMPACT.fieldInputText}`}
                    />
                </HeroCompactInputInner>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="shrink-0 p-1.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"
                        title="Cancella ricerca"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </HeroCompactInputShell>
        ) : (
        <div className={`flex items-center transition-all h-full ${variant === 'minimal'
                ? 'bg-transparent pl-3 pr-0 flex w-full'
                : `bg-slate-950 border rounded-full px-4 py-2 shadow-xl ${isFocused ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-slate-700 hover:border-slate-500'}`
            }`}>
            <Search className={`w-3.5 h-3.5 mr-3 shrink-0 ${isFocused ? 'text-amber-500' : 'text-slate-500'}`} />
            <input
                type="text"
                placeholder="Cerca una città"
                value={value}
                onChange={(e) => { onChange(e.target.value); onFocus(true); }}
                onFocus={() => onFocus(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        onChange('');
                        onFocus(false);
                    }
                }}
                className="bg-transparent border-none outline-none text-[12px] text-white placeholder-slate-500 flex-1 min-w-0 font-medium h-full"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="p-1.5 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors shrink-0"
                    title="Cancella ricerca"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
        )}

        {showResults && (
            <div className="absolute top-full mt-2 left-2 right-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                {results.length > 0 ? (
                    results.map(city => (
                        <button
                            key={city.id}
                            onClick={() => onSelect(city.id)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-600/20 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wide border-b border-slate-800 last:border-0 flex items-center gap-3 transition-colors group"
                        >
                            <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                            <span>{city.name}</span>
                        </button>
                    ))
                ) : (
                    <div className="p-6 text-center flex flex-col items-center gap-2 text-slate-500">
                        <MapPin className="w-8 h-8 opacity-20" />
                        <span className="text-xs italic">Nessuna città trovata</span>
                    </div>
                )}
            </div>
        )}
    </div>
    );
};

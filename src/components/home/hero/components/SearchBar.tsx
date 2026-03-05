
import React from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { CitySummary } from '../../../../types/index';

interface SearchBarProps {
    className?: string;
    value: string;
    onChange: (val: string) => void;
    isFocused: boolean;
    onFocus: (val: boolean) => void;
    results: CitySummary[];
    onSelect: (id: string) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const SearchBar = ({ className = "", value, onChange, isFocused, onFocus, results, onSelect, containerRef }: SearchBarProps) => (
    <div className={`w-full relative z-40 ${className}`} ref={containerRef}>
        <div className={`flex items-center bg-slate-950 border rounded-full px-4 py-2 shadow-xl transition-all ${isFocused ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
            <Search className={`w-4 h-4 mr-3 ${isFocused ? 'text-amber-500' : 'text-slate-500'}`}/>
            <input 
                type="text" 
                placeholder="Cerca una città (es. Napoli)..." 
                value={value}
                onChange={(e) => { onChange(e.target.value); onFocus(true); }}
                onFocus={() => onFocus(true)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full font-medium"
            />
            {value && (
                <button 
                    onClick={() => onChange('')} 
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4"/>
                </button>
            )}
        </div>

        {isFocused && value.trim().length > 0 && (
            <div className="absolute top-full mt-2 left-2 right-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 z-50">
                {results.length > 0 ? (
                    results.map(city => (
                        <button 
                            key={city.id} 
                            onClick={() => onSelect(city.id)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-600/20 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wide border-b border-slate-800 last:border-0 flex items-center gap-3 transition-colors group"
                        >
                            <div className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400"/>
                            </div>
                            <span>{city.name}</span>
                        </button>
                    ))
                ) : (
                    <div className="p-6 text-center flex flex-col items-center gap-2 text-slate-500">
                        <MapPin className="w-8 h-8 opacity-20"/>
                        <span className="text-xs italic">Nessuna città trovata</span>
                    </div>
                )}
            </div>
        )}
    </div>
);


import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, CheckSquare, Square, Filter } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    badge?: string; // Opzionale: conteggio o info extra
    color?: string; // Classe colore testo
}

interface AdminMultiSelectProps {
    label: string;
    icon?: React.ReactNode;
    options: Option[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
}

export const AdminMultiSelect = ({ label, icon, options, selectedValues, onChange, placeholder = "Seleziona..." }: AdminMultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (val: string) => {
        // Se si seleziona "all", resetta tutto
        if (val === 'all') {
            onChange([]); // Array vuoto significa "Tutti"
            return;
        }

        let newValues = [...selectedValues];
        if (newValues.includes(val)) {
            newValues = newValues.filter(v => v !== val);
        } else {
            newValues.push(val);
        }
        onChange(newValues);
    };

    const isAllSelected = selectedValues.length === 0;
    const badgeCount = selectedValues.length;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap h-full
                    ${badgeCount > 0 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                        : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                    }
                `}
            >
                {icon || <Filter className="w-3.5 h-3.5"/>}
                <span className="truncate max-w-[100px]">{label}</span>
                {badgeCount > 0 && (
                    <span className="bg-white text-indigo-600 px-1.5 rounded-full text-[9px] min-w-[16px] text-center">
                        {badgeCount}
                    </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50`}/>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in zoom-in-95 origin-top-left">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{placeholder}</span>
                        {badgeCount > 0 && (
                            <button onClick={() => onChange([])} className="text-[9px] text-red-400 hover:text-white flex items-center gap-1">
                                <X className="w-3 h-3"/> Reset
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                        <button 
                            onClick={() => toggleOption('all')}
                            className={`w-full text-left px-3 py-2 text-xs font-bold uppercase flex items-center gap-2 rounded-lg transition-colors ${isAllSelected ? 'bg-indigo-900/30 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            {isAllSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                            Tutti
                        </button>
                        <div className="h-px bg-slate-800 my-1 mx-2"></div>
                        {options.map(opt => {
                            const isSelected = selectedValues.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleOption(opt.value)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-colors group ${isSelected ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-500"/> : <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400"/>}
                                        <span className={`font-medium ${opt.color || ''}`}>{opt.label}</span>
                                    </div>
                                    {opt.badge && <span className="text-[9px] bg-slate-950 px-1.5 rounded text-slate-500 border border-slate-800">{opt.badge}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, CheckSquare, Square } from 'lucide-react';
import { useDynamicStyles } from '../../../../hooks/useDynamicStyles';

interface Option {
    label: string;
    value: string;
}

interface MultiFilterSelectProps {
    label: string;
    selectedValues: string[];
    onChange: (values: string[]) => void;
    options: Option[];
}

export const MultiFilterSelect = ({ label, selectedValues, onChange, options }: MultiFilterSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
    const labelStyle = useDynamicStyles('filter_label', isMobile);

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
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter(v => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    const displayText = selectedValues.length > 0 
        ? `${selectedValues.length} Selezionati` 
        : 'Tutte';

    return (
        <div className="relative min-w-0 group/select" ref={containerRef}>
            <label className={`${labelStyle} absolute -top-1.5 left-2 bg-slate-900 px-1 z-10 leading-none pointer-events-none`}>{label}</label>
            <div className="relative">
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-slate-900 border ${selectedValues.length > 0 ? 'border-amber-500/50' : 'border-slate-600'} rounded-lg text-xs md:text-sm px-3 h-9 md:h-10 text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-colors truncate pr-6 flex items-center justify-between font-medium`}
                >
                    <span className="truncate">{displayText}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {selectedValues.length > 0 && (
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange([]); }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-slate-800 transition-colors z-20"
                        title="Resetta Tipologia"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}

                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar w-48 animate-in fade-in zoom-in-95 duration-100">
                        {options.map(opt => {
                            const isSelected = selectedValues.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleOption(opt.value)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0 ${isSelected ? 'text-amber-400 font-bold bg-slate-800/30' : 'text-slate-300'}`}
                                >
                                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                    <span className="truncate">{opt.label}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { useDynamicStyles } from '../../../../hooks/useDynamicStyles';

interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}

interface FilterSelectProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onReset: () => void;
    options: Option[];
    disabled?: boolean;
}

export const FilterSelect = ({ label, value, onChange, onReset, options, disabled = false }: FilterSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Stili dinamici per coerenza col design system
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

    const handleSelect = (val: string) => {
        // Simuliamo un evento change nativo per mantenere compatibilità con la logica padre
        const syntheticEvent = { target: { value: val } } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    const selectedLabel = options.find(o => o.value === value)?.label || 'Seleziona...';

    return (
        <div className="relative min-w-0 group/select" ref={containerRef}>
            <label className={`${labelStyle} absolute -top-1.5 left-2 bg-slate-900 px-1 z-10 leading-none pointer-events-none`}>{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full bg-slate-900 border ${value ? 'border-amber-500/50' : 'border-slate-600'} rounded-lg text-xs md:text-sm px-3 h-9 md:h-10 text-slate-200 text-left flex items-center justify-between transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800 hover:border-slate-500'}`}
                >
                    <span className="truncate mr-4">{selectedLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {value && !disabled && (
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onReset(); }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-slate-800 transition-colors z-20"
                        title={`Resetta ${label}`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}

                {isOpen && !disabled && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar w-full min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                disabled={opt.disabled}
                                className={`w-full text-left px-3 py-2.5 text-xs md:text-sm hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-800/50 last:border-0 ${value === opt.value ? 'text-amber-400 font-bold bg-slate-800/50' : 'text-slate-300'} ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Check className="w-3 h-3 text-amber-500"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

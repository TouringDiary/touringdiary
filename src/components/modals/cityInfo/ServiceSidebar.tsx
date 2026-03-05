
import React from 'react';
import { Filter, ChevronRight, Plus, Siren, AlertCircle } from 'lucide-react';
import { getServicesConfig } from '../../../constants/services';

interface ServiceSidebarProps {
    activeServiceCategory: string;
    onCategoryChange: (id: string) => void;
}

export const ServiceSidebar = ({ activeServiceCategory, onCategoryChange }: ServiceSidebarProps) => {
    // Recupera la config dinamica (unisce DB + Icone)
    const SERVICES_CATEGORIES = getServicesConfig();

    return (
        <div className="h-full flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3 shrink-0">
                <Filter className="w-5 h-5 text-amber-500"/>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Seleziona Categoria</span>
            </div>
            
            {/* Lista Scrollabile (Esclude Emergency) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                 {SERVICES_CATEGORIES.map(cat => (
                     <button 
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all ${activeServiceCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                     >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 flex justify-center shrink-0">
                                {cat.id === 'pharmacy' ? (
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                        <Plus className="w-5 h-5 text-emerald-600 fill-current" strokeWidth={4}/>
                                    </div>
                                ) : (
                                    <span className="text-2xl drop-shadow-sm filter leading-none">{cat.emoji}</span>
                                )}
                            </div>
                            <span className="text-xs md:text-sm font-bold uppercase tracking-wide truncate">{cat.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 opacity-50 shrink-0 ${activeServiceCategory === cat.id ? 'text-white' : ''}`}/>
                     </button>
                 ))}
            </div>

            {/* SEZIONE SOS FISSA IN BASSO */}
            <div className="p-4 border-t border-slate-800 bg-[#050b14] shrink-0">
                <button 
                    onClick={() => onCategoryChange('emergency')}
                    className={`
                        w-full py-4 px-4 rounded-2xl flex items-center justify-between transition-all shadow-xl group
                        ${activeServiceCategory === 'emergency' 
                            ? 'bg-red-600 text-white ring-4 ring-red-900/50' 
                            : 'bg-red-900/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white'
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${activeServiceCategory === 'emergency' ? 'bg-white/20' : 'bg-red-500/20 group-hover:bg-white/20'} animate-pulse`}>
                            <Siren className="w-6 h-6 fill-current"/>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-black uppercase tracking-widest leading-none">NUMERI EMERGENZA</span>
                            <span className="text-[9px] font-bold opacity-80 mt-1">SOS, Polizia, Ospedali</span>
                        </div>
                    </div>
                    <AlertCircle className={`w-5 h-5 ${activeServiceCategory === 'emergency' ? 'text-white' : 'opacity-50 group-hover:text-white'}`}/>
                </button>
            </div>
        </div>
    );
};

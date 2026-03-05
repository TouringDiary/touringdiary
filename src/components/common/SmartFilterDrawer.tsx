import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Filter, Utensils, Landmark, Bed, ShoppingBag, Music, Sun, EyeOff, Eye, Star, Layers, CheckSquare, Square, AlertTriangle, TrendingUp, Coins, RotateCcw, Box, FileText, List, Search } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { getSubCategoryLabel } from '../../utils/common';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

interface SmartFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'live' | 'staging'; 
    filters: {
        status: 'published' | 'draft' | 'needs_check' | 'all' | 'new' | 'ready' | 'imported' | 'discarded';
        category: string;
        subCategory: string[];
        minRating: number;
        interest?: string;
        priceLevel?: number[];
        rawCategories?: string[]; 
    };
    onApply: (filters: Partial<SmartFilterDrawerProps['filters']>) => void;
    resultCount?: number;
    availableItems?: PointOfInterest[];
    hideStatus?: boolean;
    hideCategory?: boolean;
    rawCategoryOptions?: string[]; 
}

const CATEGORY_ICONS: any = {
    monument: Landmark,
    food: Utensils,
    hotel: Bed,
    shop: ShoppingBag,
    leisure: Music,
    nature: Sun
};

export const SmartFilterDrawer = ({ 
    isOpen, onClose, filters, onApply, resultCount, availableItems, 
    hideStatus = false, hideCategory = false, mode = 'live', rawCategoryOptions = [] 
}: SmartFilterDrawerProps) => {
    
    const [localFilters, setLocalFilters] = useState(filters);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [rawCatSearch, setRawCatSearch] = useState('');
    
    // --- DYNAMIC DATA ---
    const CATEGORIES = getCachedSetting<any[]>(SETTINGS_KEYS.POI_CATEGORIES_CONFIG) || [];
    const POI_STRUCTURE = getCachedSetting<Record<string, any[]>>(SETTINGS_KEYS.POI_ADVANCED_STRUCTURE) || {};

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const headerStyle = useDynamicStyles('filter_header_title', isMobile);
    const sectionTitleStyle = useDynamicStyles('filter_section_title', isMobile);
    
    const btnBaseClass = "rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 py-2"; 
    const btnDefaultClass = "bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500";
    const btnSelectedClass = "bg-indigo-600 text-white shadow-md border border-indigo-500";
    const btnActionStyle = useDynamicStyles('filter_btn_action', isMobile);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        }
        const timer = setTimeout(() => {
            if (!isOpen) setShouldRender(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) setLocalFilters(filters);
    }, [isOpen, filters]);

    const isDirty = useMemo(() => {
        return JSON.stringify(localFilters) !== JSON.stringify(filters);
    }, [localFilters, filters]);

    // Subcategories Logic (Solo per LIVE mode)
    const { visibleSubCatGroups } = useMemo(() => {
        if (mode === 'staging' || !availableItems || availableItems.length === 0) return { visibleSubCatGroups: [] };
        
        const uniqueKeys = new Set<string>();
        const activeCatForSubs = localFilters.category !== 'all' ? localFilters.category : null;

        availableItems.forEach(poi => {
            if (!activeCatForSubs || poi.category === activeCatForSubs) {
                const sub = poi.subCategory ? poi.subCategory.toLowerCase().trim() : '_generic_';
                uniqueKeys.add(sub);
            }
        });

        const usedLabels = new Set<string>(); 
        
        // Uso POI_STRUCTURE dinamico invece di SUB_CATS hardcoded
        const standardGroups = activeCatForSubs && POI_STRUCTURE[activeCatForSubs]
            ? POI_STRUCTURE[activeCatForSubs].map((group: any) => {
                const presentKeys = group.items.filter((key: string) => uniqueKeys.has(key));
                const uniqueButtons: string[] = [];
                presentKeys.forEach((key: string) => {
                    const label = key === '_generic_' ? 'Generico / Altro' : getSubCategoryLabel(key);
                    if (!usedLabels.has(label)) {
                        usedLabels.add(label);
                        uniqueButtons.push(key);
                    }
                });
                return { ...group, items: uniqueButtons };
            }).filter((group: any) => group.items.length > 0)
            : [];

        const orphans: string[] = [];
        Array.from(uniqueKeys).forEach(key => {
             const label = key === '_generic_' ? 'Generico / Altro' : getSubCategoryLabel(key);
             if (!usedLabels.has(label)) {
                 usedLabels.add(label);
                 orphans.push(key);
             }
        });

        if (orphans.length > 0) {
            standardGroups.push({
                label: 'Altro / Specifico',
                items: orphans.sort()
            });
        }

        return { visibleSubCatGroups: standardGroups };

    }, [availableItems, localFilters.category, mode, POI_STRUCTURE]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isOpen, onClose]);

    const handleReset = () => {
        setLocalFilters(prev => ({
            status: hideStatus ? prev.status : 'all',
            category: hideCategory ? prev.category : 'all',
            subCategory: [],
            interest: 'all',
            minRating: 0,
            priceLevel: [],
            rawCategories: [] 
        }));
        setRawCatSearch('');
    };

    const handleApplyClick = () => {
        onApply(localFilters);
        onClose();
    };

    const toggleRawCat = (cat: string) => {
        setLocalFilters(prev => {
            const current = prev.rawCategories || [];
            if (current.includes(cat)) {
                return { ...prev, rawCategories: current.filter(c => c !== cat) };
            } else {
                return { ...prev, rawCategories: [...current, cat] };
            }
        });
    };

    const toggleSubCat = (subKey: string) => {
        setLocalFilters(prev => {
            const current = prev.subCategory || [];
            const isSelected = current.includes(subKey);
            
            if (isSelected) {
                return { ...prev, subCategory: current.filter(s => s !== subKey) };
            } else {
                return { ...prev, subCategory: [...current, subKey] };
            }
        });
    };
    
    const togglePrice = (level: number) => {
        setLocalFilters(prev => {
            const current = prev.priceLevel || [];
            if (current.includes(level)) {
                return { ...prev, priceLevel: current.filter(p => p !== level) };
            } else {
                return { ...prev, priceLevel: [...current, level] };
            }
        });
    };

    if (!shouldRender && !isOpen) return null;

    const activeCatForSubs = localFilters.category !== 'all' ? localFilters.category : null;

    const filteredRawOptions = rawCategoryOptions.filter(opt => 
        opt.toLowerCase().includes(rawCatSearch.toLowerCase())
    );

    if (typeof document === 'undefined') return null;

    // Get Icon component safely
    const getCatIcon = (iconName: string) => {
        return CATEGORY_ICONS[iconName.toLowerCase()] || Box;
    };

    return createPortal(
        <>
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[5000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-[5010] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* HEADER */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
                            <Filter className="w-5 h-5 text-white"/>
                        </div>
                        <div>
                            <h3 className={headerStyle || "text-lg font-bold text-white font-display uppercase tracking-wide"}>
                                {mode === 'staging' ? 'Filtri Staging' : 'Filtri Avanzati'}
                            </h3>
                            {mode === 'staging' && <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Dati Grezzi OSM</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    
                    {/* --- STAGING MODE FILTERS --- */}
                    {mode === 'staging' && (
                        <>
                            {/* AI RATING */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                     <TrendingUp className="w-4 h-4 text-orange-500"/>
                                     <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest"}>AI Quality Rating</h4>
                                </div>
                                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
                                     {[
                                         { id: 'all', label: 'Tutti' },
                                         { id: 'high', label: 'High' },
                                         { id: 'medium', label: 'Medium' },
                                         { id: 'low', label: 'Low' },
                                         { id: 'service', label: 'Service' },
                                     ].map(r => (
                                         <button 
                                            key={r.id}
                                            type="button"
                                            onClick={() => setLocalFilters(prev => ({ ...prev, interest: r.id }))}
                                            className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${localFilters.interest === r.id ? 'bg-orange-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                                         >
                                             {r.label}
                                         </button>
                                     ))}
                                </div>
                            </div>

                            {/* RAW CATEGORY (MULTI-SELECT LIST) */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest mb-2"}>
                                    Categorie Originali (Raw)
                                </h4>
                                
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500"/>
                                    <input 
                                        value={rawCatSearch}
                                        onChange={(e) => setRawCatSearch(e.target.value)}
                                        placeholder="Cerca categoria..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                                    {localFilters.rawCategories && localFilters.rawCategories.length > 0 && (
                                         <div className="p-2 mb-2 border-b border-slate-800/50 flex flex-wrap gap-2">
                                             <span className="w-full text-[9px] text-slate-500 uppercase font-bold">Attivi ({localFilters.rawCategories.length})</span>
                                             {localFilters.rawCategories.map(cat => (
                                                 <button 
                                                    key={cat} 
                                                    onClick={() => toggleRawCat(cat)}
                                                    className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-red-500 transition-colors"
                                                 >
                                                     {cat} <X className="w-3 h-3"/>
                                                 </button>
                                             ))}
                                         </div>
                                    )}
                                    
                                    {filteredRawOptions.map(cat => {
                                        const isSelected = localFilters.rawCategories?.includes(cat);
                                        return (
                                            <button 
                                                key={cat}
                                                onClick={() => toggleRawCat(cat)}
                                                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-slate-800 rounded-lg transition-colors ${isSelected ? 'text-indigo-400 font-bold bg-slate-900' : 'text-slate-300'}`}
                                            >
                                                <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white"/>}
                                                </div>
                                                <span className="truncate">{cat}</span>
                                            </button>
                                        );
                                    })}
                                    
                                    {filteredRawOptions.length === 0 && (
                                        <div className="p-4 text-center text-slate-500 text-xs italic">Nessuna categoria trovata.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'live' && (
                        <>
                            {!hideStatus && (
                                <div>
                                    <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest mb-2"}>Stato Pubblicazione</h4>
                                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                        {[
                                            { id: 'all', label: 'Tutti', icon: Layers },
                                            { id: 'published', label: 'Online', icon: Eye },
                                            { id: 'draft', label: 'Bozze', icon: EyeOff },
                                            { id: 'needs_check', label: 'Check', icon: AlertTriangle }
                                        ].map(s => (
                                            <button 
                                                key={s.id} 
                                                type="button"
                                                onClick={() => setLocalFilters(prev => ({ ...prev, status: s.id as any }))}
                                                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${localFilters.status === s.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                                            >
                                                <s.icon className="w-3.5 h-3.5"/> {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!hideCategory && (
                                <div>
                                    <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest mb-2"}>Categoria Principale</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setLocalFilters(prev => ({ ...prev, category: 'all', subCategory: [] }))}
                                            className={`${btnBaseClass} ${localFilters.category === 'all' ? btnSelectedClass : btnDefaultClass}`}
                                        >
                                            <span>Tutti</span>
                                        </button>
                                        
                                        {CATEGORIES.map((cat: any) => {
                                            const isSelected = localFilters.category === cat.id;
                                            const Icon = getCatIcon(cat.icon);
                                            return (
                                                <button 
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setLocalFilters(prev => ({ ...prev, category: cat.id, subCategory: [] }))}
                                                    className={`${btnBaseClass} ${isSelected ? btnSelectedClass : btnDefaultClass}`}
                                                >
                                                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`}/>
                                                    <span>{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TIPOLOGIA (SOTTOCATEGORIE) - SOLO LIVE */}
                            {activeCatForSubs && visibleSubCatGroups.length > 0 && (
                                 <div className="animate-in slide-in-from-right-4 fade-in">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Layers className="w-4 h-4 text-indigo-500"/>
                                        <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest"}>
                                            {hideCategory ? 'Tipologia Specifica' : `Tipi di ${CATEGORIES.find((c:any) => c.id === activeCatForSubs)?.label || activeCatForSubs}`}
                                        </h4>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {visibleSubCatGroups.map((group: any, groupIdx: number) => (
                                            <div key={groupIdx} className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                                                <h5 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2 ml-1">{group.label}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.items.map((subKey: string) => {
                                                        const isSelected = localFilters.subCategory.includes(subKey);
                                                        const label = subKey === '_generic_' ? 'Generico' : getSubCategoryLabel(subKey);
                                                        
                                                        return (
                                                            <button 
                                                                key={subKey}
                                                                type="button"
                                                                onClick={() => toggleSubCat(subKey)}
                                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                                                            >
                                                                {isSelected ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                            )}

                             {/* INTERESSE TURISTICO */}
                            <div>
                                 <div className="flex items-center gap-2 mb-2">
                                     <TrendingUp className="w-4 h-4 text-orange-500"/>
                                     <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest"}>Interesse Turistico</h4>
                                 </div>
                                 <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
                                     {[
                                         { id: 'all', label: 'Tutti' },
                                         { id: 'high', label: 'Top' },
                                         { id: 'medium', label: 'Medio' },
                                         { id: 'low', label: 'Basso' },
                                         { id: 'unknown', label: 'N/C' }
                                     ].map(r => (
                                         <button 
                                            key={r.id}
                                            type="button"
                                            onClick={() => setLocalFilters(prev => ({ ...prev, interest: r.id }))}
                                            className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${localFilters.interest === r.id ? 'bg-orange-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                                         >
                                             {r.label}
                                         </button>
                                     ))}
                                 </div>
                            </div>
                            
                            {/* FASCIA PREZZO */}
                            <div>
                                 <div className="flex items-center gap-2 mb-2">
                                     <Coins className="w-4 h-4 text-emerald-500"/>
                                     <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest"}>Fascia Prezzo</h4>
                                 </div>
                                 <div className="grid grid-cols-4 gap-2">
                                     {[
                                         { val: 1, label: '€' },
                                         { val: 2, label: '€€' },
                                         { val: 3, label: '€€€' },
                                         { val: 4, label: '€€€€' }
                                     ].map(p => {
                                         const isSelected = (localFilters.priceLevel || []).includes(p.val);
                                         return (
                                             <button 
                                                key={p.val}
                                                type="button"
                                                onClick={() => togglePrice(p.val)}
                                                className={`${btnBaseClass} ${isSelected ? 'bg-emerald-600 text-white border-emerald-500' : btnDefaultClass}`}
                                             >
                                                 {p.label}
                                             </button>
                                         );
                                     })}
                                 </div>
                            </div>

                            {/* RATING MINIMO */}
                            <div>
                                 <div className="flex items-center gap-2 mb-2">
                                     <Star className="w-4 h-4 text-yellow-500"/>
                                     <h4 className={sectionTitleStyle || "text-xs font-black text-slate-500 uppercase tracking-widest"}>Rating Minimo</h4>
                                 </div>
                                 <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                     {[0, 3, 4, 5].map(r => (
                                         <button 
                                            key={r}
                                            type="button"
                                            onClick={() => setLocalFilters(prev => ({ ...prev, minRating: r }))}
                                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${localFilters.minRating === r ? 'bg-yellow-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                                         >
                                             {r === 0 ? 'Tutti' : <>{r}<Star className="w-3 h-3 fill-current"/></>}
                                         </button>
                                     ))}
                                 </div>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex items-center gap-3 shrink-0">
                    <button onClick={handleApplyClick} className={`flex-1 flex items-center justify-center gap-2 ${btnActionStyle || 'bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-lg py-3 rounded-xl transition-all active:scale-95'}`}>
                        <Check className="w-4 h-4"/> {isDirty ? 'Applica Filtri' : `Vedi ${resultCount !== undefined ? resultCount : 'Risultati'}`}
                    </button>
                    <button onClick={handleReset} className={`flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-xs tracking-widest border border-slate-700 rounded-xl`}>
                         <RotateCcw className="w-3.5 h-3.5"/> RESET
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};
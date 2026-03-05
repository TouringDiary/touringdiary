
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Grid, Heart, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { CitySummary } from '../../types/index';
import { useCityData } from '../../hooks/useCityData';

// Sub-components
import { PreviewSidebar, CategoryConfig } from './sectionPreview/PreviewSidebar';
import { PreviewHero } from './sectionPreview/PreviewHero';
import { PreviewRatings } from './sectionPreview/PreviewRatings';
import { PreviewGallery } from './sectionPreview/PreviewGallery';

interface SectionPreviewModalProps {
    onClose: () => void;
    cities: any[]; // Può essere CitySummary o generic Item (Guide/Event)
    title: string;
    icon?: React.ReactNode;
    onCitySelect: (id: string) => void;
    initialSelectedId?: string | null;
    categories?: CategoryConfig[];
}

interface LightboxState {
    url: string;
    user: string;
    likes: number;
    caption: string;
}

export const SectionPreviewModal = ({ onClose, cities, title, icon, initialSelectedId, onCitySelect, categories }: SectionPreviewModalProps) => {
    const [selectedCityId, setSelectedCityId] = useState<string | null>(initialSelectedId || null);
    const [lightboxData, setLightboxData] = useState<LightboxState | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryConfig | null>(categories ? categories[0] : null);
    const [showMobileList, setShowMobileList] = useState(false); 
    
    const tabsRef = useRef<HTMLDivElement>(null);
    
    // Filtro items in base alla categoria attiva
    const filteredItemsByTab = useMemo(() => {
        if (!categories || !activeCategory) return cities;
        return cities.filter(c => c.specialBadge === activeCategory.badge);
    }, [cities, categories, activeCategory]);

    // Se l'elemento selezionato non è nella lista filtrata, seleziona il primo disponibile
    useEffect(() => {
        if (filteredItemsByTab.length > 0) {
            const currentInList = filteredItemsByTab.find(c => c.id === selectedCityId);
            if (!currentInList) {
                setSelectedCityId(filteredItemsByTab[0].id);
            }
        }
    }, [filteredItemsByTab, selectedCityId]);

    // --- CHECK SE SONO CITTÀ O ITEM GENERICI ---
    const selectedItem = filteredItemsByTab.find(c => c.id === selectedCityId);
    
    // Riconosciamo una città dal fatto che ha la proprietà 'visitors' (che le guide/eventi non hanno)
    const isCityObject = selectedItem && typeof selectedItem.visitors !== 'undefined';
    
    // Hook Data (Solo se è una città reale, altrimenti null per non far crashare l'hook)
    const { city: hookCity, loading } = useCityData(isCityObject ? selectedCityId : null);

    // Se è una città, usiamo i dati completi dal DB (hookCity). Se è un oggetto generico, usiamo l'oggetto stesso.
    const effectiveItem = isCityObject ? hookCity : selectedItem;

    // ESC Key Listener per chiudere modale o lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (lightboxData) setLightboxData(null);
                else onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, lightboxData]);

    const handleItemSelectWrapper = (id: string) => {
        setSelectedCityId(id);
        setShowMobileList(false); // Close mobile list on select
    };
    
    const handleSwitchTab = (direction: 'prev' | 'next') => {
        if (!categories || !activeCategory) return;
        const currentIndex = categories.findIndex(c => c.id === activeCategory.id);
        if (currentIndex === -1) return;
        
        let newIndex;
        if (direction === 'prev') {
            newIndex = (currentIndex - 1 + categories.length) % categories.length;
        } else {
            newIndex = (currentIndex + 1) % categories.length;
        }
        
        const newCat = categories[newIndex];
        setActiveCategory(newCat);
        
        // Scroll automatico per mantenere la tab visibile (opzionale ma utile)
        if (tabsRef.current) {
            // Logica semplificata di scroll
            const tabButtons = tabsRef.current.querySelectorAll('button');
            const targetBtn = tabButtons[newIndex] as HTMLElement;
            if (targetBtn) {
                targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    };

    return (
        <div className="fixed top-24 bottom-0 left-0 right-0 z-[200] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-[#020617] w-full max-w-7xl h-full rounded-none md:rounded-xl border-x-0 md:border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                
                {/* 1. HEADER */}
                <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-[#0f172a] shrink-0 z-50 relative">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border border-slate-800 ${activeCategory ? 'bg-slate-900' : 'bg-slate-900 text-amber-500'}`}>
                            <div className={activeCategory ? activeCategory.color : ''}>
                                {icon || <Grid className="w-4 h-4"/>}
                            </div>
                        </div>
                        <h2 className={`text-sm md:text-lg font-display font-bold uppercase tracking-wide ${activeCategory ? activeCategory.color : 'text-white'}`}>
                            {activeCategory ? activeCategory.label : title}
                        </h2>
                        <span className="bg-slate-800 text-slate-400 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                            {filteredItemsByTab.length}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* MOBILE: Show List Button */}
                        <button 
                            onClick={() => setShowMobileList(!showMobileList)} 
                            className="md:hidden p-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors border border-slate-700"
                            title="Lista Elementi"
                        >
                            <List className="w-4 h-4"/>
                        </button>

                        {/* STANDARD RED CLOSE BUTTON */}
                        <button onClick={onClose} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-4 h-4 md:w-5 md:h-5"/>
                        </button>
                    </div>
                </div>

                {/* 2. CATEGORY TABS (Redesigned & Compacted) */}
                {categories && (
                    <div className="bg-[#020617] shrink-0 relative z-40 flex flex-col">
                        
                        {/* TAB LIST */}
                        <div className="px-4 md:px-6 pt-1 overflow-x-auto no-scrollbar" ref={tabsRef}>
                            <div className="flex gap-8 min-w-max">
                                {categories.map(cat => {
                                    const isActive = activeCategory?.id === cat.id;
                                    
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`
                                                relative flex-shrink-0 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-colors group
                                                ${isActive ? 'text-orange-500' : 'text-yellow-400 hover:text-orange-500'}
                                            `}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* CUSTOM NAVIGATOR (< . . . >) */}
                        <div className="flex items-center justify-center gap-4 pb-2 pt-1 border-b border-slate-800 bg-[#020617] relative z-50">
                            <button onClick={() => handleSwitchTab('prev')} className="text-amber-500 hover:text-amber-400 transition-colors p-1">
                                <ChevronLeft className="w-5 h-5"/>
                            </button>
                            
                            <div className="flex gap-2 items-center">
                                {categories.map((cat, idx) => {
                                    const isActive = activeCategory?.id === cat.id;
                                    const bgClass = cat.color.replace('text-', 'bg-');
                                    
                                    return (
                                        <button 
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`
                                                transition-all duration-300 rounded-full
                                                ${isActive 
                                                    ? `w-4 h-2 ${bgClass} shadow-[0_0_8px_currentColor]` 
                                                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                                                }
                                            `}
                                            title={cat.label}
                                        />
                                    );
                                })}
                            </div>

                            <button onClick={() => handleSwitchTab('next')} className="text-amber-500 hover:text-amber-400 transition-colors p-1">
                                <ChevronRight className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden relative">
                    {/* 3. SIDEBAR (DESKTOP: Fixed, MOBILE: Overlay) */}
                    <div className={`
                        absolute inset-0 z-50 bg-[#020617] transition-transform duration-300 md:relative md:translate-x-0 md:w-80 border-r border-slate-800 flex flex-col
                        ${showMobileList ? 'translate-x-0' : '-translate-x-full md:transform-none'}
                    `}>
                         <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a]">
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seleziona</span>
                             <button onClick={() => setShowMobileList(false)}><X className="w-5 h-5 text-slate-400"/></button>
                         </div>
                         <PreviewSidebar 
                            cities={filteredItemsByTab} 
                            selectedCityId={selectedCityId} 
                            onSelectCity={handleItemSelectWrapper} 
                            activeCategory={activeCategory} 
                            className="flex-1"
                        />
                    </div>

                    {/* 4. MAIN CONTENT */}
                    <div className="flex-1 overflow-y-auto md:overflow-hidden bg-slate-950 relative custom-scrollbar">
                        {(loading && isCityObject) ? (
                            <div className="flex items-center justify-center h-full">
                                <div className={`w-10 h-10 border-2 border-slate-700 rounded-full animate-spin ${activeCategory ? activeCategory.color.replace('text-', 'border-t-') : 'border-t-amber-500'}`}></div>
                            </div>
                        ) : !effectiveItem ? (
                             <div className="flex items-center justify-center h-full text-slate-500 text-sm">Seleziona un elemento per visualizzare l'anteprima</div>
                        ) : (
                            <div className="animate-in fade-in duration-500 flex flex-col min-h-full md:h-full pb-32 md:pb-0">
                                {/* HERO IMAGE & INFO */}
                                <PreviewHero 
                                    city={effectiveItem} 
                                    onExplore={onCitySelect} 
                                    className="h-[220px] md:h-[35%] min-h-[220px] shrink-0" 
                                />

                                {/* CONTENT (RATINGS) */}
                                <div className="px-4 md:px-8 mt-2 md:mt-0 relative z-10 flex flex-col justify-start gap-2 shrink-0 md:flex-1 md:min-h-0 md:overflow-hidden pt-4 pb-4">
                                    <PreviewRatings city={effectiveItem} />
                                </div>

                                {/* GALLERY */}
                                <PreviewGallery 
                                    city={effectiveItem} 
                                    onOpenLightbox={setLightboxData} 
                                    activeCategoryColor={activeCategory ? activeCategory.color : ''}
                                    className="h-[220px] md:h-[28%] min-h-[220px] mt-auto shrink-0 bg-slate-950 border-t border-slate-800"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIGHTBOX OVERLAY */}
            {lightboxData && (
                <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300" onClick={() => setLightboxData(null)}>
                    <img src={lightboxData.url} alt="Fullscreen" className="max-w-[95vw] max-h-[85vh] rounded shadow-2xl object-contain"/>
                    <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X className="w-8 h-8"/></button>
                    
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-6 shadow-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-indigo-400">
                                {lightboxData.user.charAt(0)}
                            </div>
                            <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{lightboxData.user}</span>
                        </div>
                        {lightboxData.caption && <span className="text-slate-300 text-xs italic border-l border-white/20 pl-4">{lightboxData.caption}</span>}
                        <div className="flex items-center gap-1.5 text-rose-500 font-bold border-l border-white/20 pl-4">
                             <Heart className="w-4 h-4 fill-current"/> {lightboxData.likes}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

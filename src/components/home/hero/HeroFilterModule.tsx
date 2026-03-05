import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Flower, Sun, Leaf, Snowflake, Waves, Mountain, Sparkles, Castle } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { FilterSelect } from './components/FilterSelect';
import { MultiFilterSelect } from './components/MultiFilterSelect';
import { SearchBar } from './components/SearchBar';
import { 
    FALLBACK_CATEGORIES
} from '../../../data/ui/heroConstants';
import { CitySummary } from '../../../types/index';

// Per evitare break, usiamo CATEGORY_OPTIONS come fallback
const CAT_OPTIONS = FALLBACK_CATEGORIES;

interface HeroFilterModuleProps {
    // State
    continent: string;
    nation: string;
    region: string;
    selectedCity: string;
    selectedZone: string;
    isFiltersExpanded: boolean;
    manualCitySearch: string;
    isSearchFocused: boolean;
    heroImage: string;
    activeCategories: string[];
    
    // Computed Data
    uniqueZones: string[];
    filteredCities: CitySummary[];
    searchResults: CitySummary[];
    
    // New: Geo Options from Hook
    geoOptions?: {
        continents: any[];
        nations: any[];
        regions: any[];
    };
    
    // Refs
    searchRef: React.RefObject<HTMLDivElement>;

    // Handlers
    setIsFiltersExpanded: (v: boolean) => void;
    setManualCitySearch: (v: string) => void;
    setIsSearchFocused: (v: boolean) => void;
    handleContinentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetContinent: () => void;
    handleNationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetNation: () => void;
    handleRegionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetRegion: () => void;
    handleZoneChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetZone: () => void;
    handleCityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetCity: () => void;
    handleGlobalReset: () => void;
    handleToggleCategory: (cat: string) => void;
    handleSeasonClick: (label: string) => void;
    handleManualCitySelect: (id: string) => void;
    setActiveCategories: (cats: string[]) => void;
}

export const HeroFilterModule = (props: HeroFilterModuleProps) => {
    // Rilevamento Mobile per stili dinamici locali
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Stile dinamico dal DB (Admin > Design System > Hero Label)
    const heroLabelStyle = useDynamicStyles('hero_label', isMobile);
    
    const continents = props.geoOptions?.continents || [];
    const nations = props.geoOptions?.nations || [];
    const regions = props.geoOptions?.regions || [];

    return (
        <div id="tour-search-section" className={`col-span-12 lg:col-span-7 relative group shadow-2xl flex flex-col bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-300 overflow-hidden ${!props.isFiltersExpanded ? 'h-auto' : 'lg:h-full'}`}>
             
             {/* BACKGROUND IMAGE WITH OVERLAY - ONLY IF EXISTS */}
             {props.heroImage && (
                 <div className="absolute inset-0 pointer-events-none">
                    <ImageWithFallback 
                        src={props.heroImage} 
                        alt="Hero" 
                        className="w-full h-full object-cover opacity-60 grayscale-[30%] group-hover:grayscale-[10%] transition-all duration-1000"
                        priority={true} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent"></div>
                 </div>
             )}

             <div className="relative z-10 p-4 flex flex-col h-full justify-between">
                
                {/* HEADER ROW */}
                <div 
                    className="flex justify-between items-center h-10 shrink-0 mb-1 cursor-pointer lg:cursor-default" 
                    onClick={() => props.setIsFiltersExpanded(!props.isFiltersExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        {/* TITOLO COLLEGATO AL DB */}
                        <h3 className={`${heroLabelStyle} drop-shadow-md z-20 relative`}>Trova la tua meta</h3>
                    </div>
                    <div className="lg:hidden p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm">
                         {props.isFiltersExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); props.handleGlobalReset(); }} className="text-slate-400 hover:text-white transition-colors hidden lg:flex items-center gap-1 text-[10px] uppercase font-bold bg-black/30 px-3 py-1 rounded-full border border-white/10" title="Resetta filtri">
                        <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                </div>

                {/* MOBILE SEARCH BAR (Visible only on mobile/collapsed) */}
                <div className="lg:hidden mt-2">
                    <SearchBar 
                        className="mb-1"
                        value={props.manualCitySearch}
                        onChange={props.setManualCitySearch}
                        isFocused={props.isSearchFocused}
                        onFocus={props.setIsSearchFocused}
                        results={props.searchResults}
                        onSelect={props.handleManualCitySelect}
                        containerRef={props.searchRef}
                    />
                </div>

                {/* EXPANDABLE CONTENT */}
                <div className={`flex-col flex-1 justify-between ${props.isFiltersExpanded ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* FILTER GRID - COMPACT */}
                    <div className="flex-1 flex flex-col justify-center py-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4">
                            <FilterSelect label="Continente" value={props.continent} options={continents} onChange={props.handleContinentChange} onReset={props.resetContinent}/>
                            <FilterSelect label="Nazione" value={props.nation} options={nations} onChange={props.handleNationChange} onReset={props.resetNation} disabled={!props.continent}/>
                            <FilterSelect label="Regione" value={props.region} options={regions} onChange={props.handleRegionChange} onReset={props.resetRegion} disabled={!props.nation}/>
                            <FilterSelect label="Zona Turistica" value={props.selectedZone} options={props.uniqueZones.map(z => ({ label: z, value: z }))} onChange={props.handleZoneChange} onReset={props.resetZone} disabled={!props.region}/>
                            <FilterSelect label="Città" value={props.selectedCity} options={props.filteredCities.map(c => ({ label: c.name, value: c.id }))} onChange={props.handleCityChange} onReset={props.resetCity} disabled={!props.region}/>
                            <MultiFilterSelect label="Tipologia" selectedValues={props.activeCategories} onChange={props.setActiveCategories} options={CAT_OPTIONS}/>
                        </div>
                    </div>

                    {/* BOTTOM BAR - REFACTORED (STACKED LABELS) */}
                    <div className="flex justify-between items-end gap-2 border-t border-slate-700/30 pt-3 mt-1 shrink-0 overflow-visible relative z-20">
                        
                        {/* LEFT: STAGIONE */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">Stagione</span>
                            <div className="flex gap-1.5">
                                {[
                                    { icon: Flower, color: 'text-emerald-400', label: 'Primavera' },
                                    { icon: Sun, color: 'text-amber-400', label: 'Estate' },
                                    { icon: Leaf, color: 'text-orange-500', label: 'Autunno' },
                                    { icon: Snowflake, color: 'text-cyan-400', label: 'Inverno' }
                                ].map((s,i) => {
                                    // Mapping logico per categorie
                                    let mappedCat = '';
                                    if (s.label === 'Estate') mappedCat = 'Mare';
                                    if (s.label === 'Primavera') mappedCat = 'Natura';
                                    if (s.label === 'Inverno') mappedCat = 'Cultura';
                                    if (s.label === 'Autunno') mappedCat = 'Vino';
                                    const isActive = props.activeCategories.includes(mappedCat);
                                    
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => props.handleSeasonClick(s.label.substring(0,3))} 
                                            className={`p-2 rounded-lg border transition-all shadow-sm group relative ${isActive ? 'bg-slate-800 border-amber-500' : 'bg-slate-950/80 border-slate-700 hover:bg-slate-800'}`} 
                                            title={s.label}
                                        >
                                            <s.icon className={`w-4 h-4 ${s.color}`}/>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* CENTER: SEARCH (DESKTOP) - Aligned to bottom */}
                        <div className="hidden lg:block flex-1 max-w-[240px] pb-0.5">
                           <SearchBar 
                                value={props.manualCitySearch}
                                onChange={props.setManualCitySearch}
                                isFocused={props.isSearchFocused}
                                onFocus={props.setIsSearchFocused}
                                results={props.searchResults}
                                onSelect={props.handleManualCitySelect}
                                containerRef={props.searchRef}
                           />
                        </div>

                        {/* RIGHT: ISPIRAZIONE */}
                        <div className="flex flex-col gap-1.5 shrink-0 items-end">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1 leading-none">Ispirazione</span>
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-[160px] md:max-w-none justify-end">
                                {[
                                    { label: 'Mare', icon: Waves, color: 'text-cyan-400', val: 'Mare' },
                                    { label: 'Monti', icon: Mountain, color: 'text-stone-400', val: 'Entroterra' },
                                    { label: 'Relax', icon: Sparkles, color: 'text-pink-400', val: 'Terme' },
                                    { label: 'Borghi', icon: Castle, color: 'text-amber-600', val: 'Storia' },
                                ].map((item) => {
                                        const isActive = props.activeCategories.includes(item.val);
                                        return (
                                        <button 
                                            key={item.label} 
                                            onClick={() => props.handleToggleCategory(item.val)} 
                                            className={`p-2 rounded-lg border transition-all flex items-center justify-center shadow-sm ${isActive ? 'bg-slate-800 border-amber-500' : 'bg-slate-950/80 border-slate-700 hover:bg-slate-800'}`} 
                                            title={item.label}
                                        >
                                            <item.icon className={`w-4 h-4 ${item.color}`} />
                                        </button>
                                        );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
             </div>
        </div>
    );
};
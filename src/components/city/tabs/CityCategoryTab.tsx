
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, X, ArrowDownAZ, ArrowUpAZ, Star, Plus, Crosshair, Search, SlidersHorizontal, ChevronDown, PenTool, Award, MapPin, TrendingUp, Heart, ArrowUp, ArrowDown, Coins } from 'lucide-react';
import { PointOfInterest, SuggestionType, User as UserType } from '../../../types/index';
import { CityGuide } from './CityGuide';
import { useItinerary } from '@/context/ItineraryContext';
import { SmartFilterDrawer } from '../../common/SmartFilterDrawer';
import { useInteraction } from '../../../context/InteractionContext';
import { calculateDistance } from '../../../services/geo';
import { getPoiCategoryLabel } from '../../../utils/common';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { CategorySponsorColumn } from './CategorySponsorColumn';
import { CompactDiscoveryCard } from '../ShowcaseCards';

// --- MAPPING CATEGORIA -> TAB ---
const CATEGORY_TO_TAB_MAP: Record<string, string> = {
    'monument': 'destinazioni',
    'food': 'sapori',
    'hotel': 'alloggi',
    'nature': 'natura',
    'leisure': 'svago',
    'shop': 'shopping',
    'discovery': 'novita'
};

// --- COMPONENTE SEARCH ESTRATTO ---
const SearchInput = ({ value, onChange, isMobile = false }: { value: string, onChange: (val: string) => void, isMobile?: boolean }) => {
    return (
        <div className={`relative group flex items-center bg-[#0f172a] border border-slate-800 rounded-xl shadow-inner transition-all hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 ${isMobile ? 'w-full h-11' : 'h-11 w-full max-w-sm'}`}>
            <div className="pl-3 pr-2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Search className="w-4 h-4" />
            </div>
            <input 
                type="text" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Cerca luogo..."
                className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-medium h-full rounded-r-xl pr-8"
            />
            {value && (
                <button 
                    onClick={() => onChange('')}
                    className="absolute right-2 text-slate-500 hover:text-white transition-colors p-1"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

interface CityCategoryTabProps {
    sourceList: PointOfInterest[];
    activeSponsors: PointOfInterest[];
    userLocation: { lat: number; lng: number } | null;
    onToggleLocation: () => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenPoiDetail: (poi: PointOfInterest) => void;
    onOpenReview: (poi: PointOfInterest) => void;
    onOpenSponsor: (tier?: 'gold' | 'silver') => void;
    referencePoint: PointOfInterest | null;
    setReferencePoint: (poi: PointOfInterest | null) => void;
    onOpenSuggestion: (type: SuggestionType) => void;
    isSidebarOpen?: boolean;
    onOpenShopFromPoi: (poi: PointOfInterest) => void;
    user: UserType;
    onOpenAuth: () => void;
    isUiVisible?: boolean;
    onAdminEdit?: (poi: PointOfInterest) => void;
    onTabChange?: (tab: string) => void;
    currentCategory?: string; 
}

type SortOption = 'votes' | 'rating' | 'name' | 'interest' | 'price';
type SortDirection = 'asc' | 'desc';

export const CityCategoryTab = ({
    sourceList, activeSponsors, userLocation, onToggleLocation, onAddToItinerary,
    onOpenPoiDetail, onOpenReview, onOpenSponsor, referencePoint, setReferencePoint,
    onOpenSuggestion, isSidebarOpen, onOpenShopFromPoi, user, onOpenAuth, isUiVisible, onAdminEdit,
    onTabChange, currentCategory = 'all'
}: CityCategoryTabProps) => {
    const { itinerary } = useItinerary();
    const { hasUserLiked, toggleLike } = useInteraction();
    
    // Filters - DEFAULT SORT CHANGED TO 'interest'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('interest');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');
    
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        status: 'all' as any,
        category: currentCategory, 
        subCategory: [] as string[],
        minRating: 0,
        interest: 'all',
        priceLevel: [] as number[]
    });

    // Filtriamo gli sponsor per Tier
    const goldSponsors = useMemo(() => activeSponsors.filter(s => s.tier === 'gold'), [activeSponsors]);
    const silverSponsors = useMemo(() => activeSponsors.filter(s => s.tier === 'silver'), [activeSponsors]);
    
    // Reset filters when tab changes
    useEffect(() => {
        setAdvancedFilters(prev => ({
            ...prev,
            category: currentCategory,
            subCategory: [],
            minRating: 0,
            interest: 'all',
            priceLevel: []
        }));
        setSearchTerm('');
    }, [currentCategory]);

    // Dropdown States
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showContribMenu, setShowContribMenu] = useState(false);

    const referenceDistanceStyle = useDynamicStyles('city_reference_distance');
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const contribMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setShowSortMenu(false);
            }
            if (contribMenuRef.current && !contribMenuRef.current.contains(event.target as Node)) {
                setShowContribMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isItemInItinerary = (id: string) => itinerary.items.some(i => i.poi.id === id);

    const handleSetReference = (e: React.MouseEvent, poi: PointOfInterest) => {
        e.stopPropagation();
        if (referencePoint?.id === poi.id) {
            setReferencePoint(null);
        } else {
            setReferencePoint(poi);
        }
    };

    const handleLike = (poi: PointOfInterest) => {
        if (!user || user.role === 'guest') {
            if(onOpenAuth) onOpenAuth();
            return;
        }
        toggleLike(poi.id);
    };

    const handleProtectedAction = (action: () => void) => {
        if (!user || user.role === 'guest') {
            onOpenAuth();
        } else {
            action();
        }
        setShowContribMenu(false);
    };

    const handleCategoryLinkClick = () => {
        if (!referencePoint || !onTabChange) return;
        const targetTab = CATEGORY_TO_TAB_MAP[referencePoint.category];
        if (targetTab) {
            onTabChange(targetTab);
        }
    };

    const activeFilterCount = advancedFilters.subCategory.length + (advancedFilters.minRating > 0 ? 1 : 0) + (advancedFilters.interest !== 'all' ? 1 : 0) + (advancedFilters.priceLevel.length > 0 ? 1 : 0);

    const handleResetFilters = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setAdvancedFilters(prev => ({
            ...prev,
            subCategory: [],
            minRating: 0,
            interest: 'all',
            priceLevel: []
        }));
    };

    const getInterestScore = (interest?: string) => {
        switch(interest) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };

    const handleSortChange = (key: SortOption) => {
        if (sortBy === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDir(key === 'name' || key === 'price' ? 'asc' : 'desc');
        }
    };

    // --- FILTER & SORT LOGIC ---
    const filteredList = useMemo(() => {
        let result = sourceList.filter(poi => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchName = (poi.name || '').toLowerCase().includes(term);
                const matchDesc = (poi.description || '').toLowerCase().includes(term);
                if (!matchName && !matchDesc) return false;
            }
            if (advancedFilters.minRating > 0 && (poi.rating || 0) < advancedFilters.minRating) return false;
            
            if (advancedFilters.subCategory.length > 0) {
                const poiSub = poi.subCategory ? poi.subCategory.toLowerCase().trim() : '_generic_';
                if (!advancedFilters.subCategory.some(filterSub => filterSub.toLowerCase().trim() === poiSub)) return false;
            }
            
            if (advancedFilters.interest && advancedFilters.interest !== 'all') {
                if (advancedFilters.interest === 'unknown') {
                    if (poi.tourismInterest !== null && poi.tourismInterest !== undefined) return false;
                } else {
                    if (poi.tourismInterest !== advancedFilters.interest) return false;
                }
            }
            if (advancedFilters.priceLevel && advancedFilters.priceLevel.length > 0) {
                if (!poi.priceLevel || !advancedFilters.priceLevel.includes(poi.priceLevel)) return false;
            }
            return true;
        });

        if (referencePoint) {
            return result.sort((a, b) => {
                const distA = calculateDistance(referencePoint.coords.lat, referencePoint.coords.lng, a.coords.lat, a.coords.lng);
                const distB = calculateDistance(referencePoint.coords.lat, referencePoint.coords.lng, b.coords.lat, b.coords.lng);
                return distA - distB;
            });
        }

        return result.sort((a, b) => {
             const multiplier = sortDir === 'asc' ? 1 : -1;
             switch (sortBy) {
                 case 'votes': return ((a.votes || 0) - (b.votes || 0)) * multiplier;
                 case 'rating': return ((a.rating || 0) - (b.rating || 0)) * multiplier;
                 case 'interest':
                     const scoreA = getInterestScore(a.tourismInterest);
                     const scoreB = getInterestScore(b.tourismInterest);
                     return scoreA !== scoreB ? (scoreA - scoreB) * multiplier : ((a.rating || 0) - (b.rating || 0)) * multiplier;
                 case 'price': return ((a.priceLevel || 0) - (b.priceLevel || 0)) * multiplier;
                 case 'name': return (a.name || '').localeCompare(b.name || '') * multiplier;
                 default: return 0;
             }
        });
    }, [sourceList, searchTerm, sortBy, sortDir, advancedFilters, referencePoint]);

    const getSortLabel = () => {
        switch(sortBy) {
            case 'votes': return 'Popolarità';
            case 'rating': return 'Valutazione'; // RENAMED
            case 'name': return 'A-Z';
            case 'interest': return 'Top Interest';
            case 'price': return 'Prezzo';
            default: return 'Ordina';
        }
    };

    const SortItem = ({ id, label, icon: Icon }: { id: SortOption, label: string, icon: any }) => {
        const isActive = sortBy === id;
        return (
            <button 
                onClick={() => handleSortChange(id)} 
                className={`w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors ${isActive ? 'text-amber-500 bg-slate-800/50' : 'text-slate-400'}`}
            >
                <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5"/> {label}</div>
                {isActive && (
                    <div className="flex items-center text-[10px] text-slate-400 font-black gap-2">
                        <span className="text-slate-700">|</span>
                        {sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5"/> : <ArrowDown className="w-3.5 h-3.5"/>}
                    </div>
                )}
            </button>
        );
    };

    // --- RENDER COMPLETO ---
    // MOBILE FIX: h-auto instead of h-full to allow parent scrolling
    return (
        <div className="flex flex-col w-full h-auto md:h-full bg-[#020617] relative">
            <SmartFilterDrawer 
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                filters={advancedFilters}
                onApply={(newFilters) => setAdvancedFilters(prev => ({ ...prev, ...newFilters }))}
                resultCount={filteredList.length}
                availableItems={sourceList}
                hideStatus={true} 
                hideCategory={true} 
            />

            {/* HEADER CONTROLLI (2 RIGHE) - RELATIVE SU MOBILE PER SCROLLARE VIA */}
            <div className={`
                flex flex-col border-b border-slate-800 bg-[#020617]/95 backdrop-blur-md z-30 transition-all duration-300 shadow-xl shrink-0
                relative md:sticky md:top-0
                ${isUiVisible === false && window.innerWidth >= 768 ? '-translate-y-full opacity-0 pointer-events-none absolute w-full' : ''}
            `}>
                <div className="flex flex-col gap-2 p-3">
                    
                    {/* RIGA 1: TOOLBAR */}
                    <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
                        
                        {/* LEFT: CONTRIBUISCI */}
                        <div className="relative shrink-0 w-full md:w-1/4" ref={contribMenuRef}>
                             <button 
                                onClick={() => setShowContribMenu(!showContribMenu)}
                                className="w-full md:w-auto h-11 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-500 border border-slate-700 hover:border-amber-500/50 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 shadow-sm px-4"
                            >
                                <Plus className="w-3.5 h-3.5"/> Contribuisci
                            </button>
                            {showContribMenu && (
                                <div className="absolute top-full left-0 mt-2 w-full md:w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden py-1 animate-in zoom-in-95 origin-top-left">
                                    <button onClick={() => handleProtectedAction(() => onOpenSuggestion('new_place'))} className="w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center gap-3 hover:bg-slate-800 text-emerald-400 transition-colors border-b border-slate-800/50"><Plus className="w-3.5 h-3.5"/> Nuovo Luogo</button>
                                    <button onClick={() => handleProtectedAction(() => onOpenSuggestion('edit_info'))} className="w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center gap-3 hover:bg-slate-800 text-indigo-400 transition-colors"><PenTool className="w-3.5 h-3.5"/> Modifica Luogo</button>
                                </div>
                            )}
                        </div>
                        
                        {/* CENTER: SEARCH */}
                        <div className="flex-1 md:px-4 flex justify-center">
                            <SearchInput value={searchTerm} onChange={setSearchTerm} isMobile={false} />
                        </div>
                        
                        {/* RIGHT: TOOLS (SORT & FILTER) */}
                        <div className="flex gap-2 w-full md:w-1/4 justify-end">
                            {/* SORT */}
                            <div className="relative flex-1 md:flex-none" ref={sortMenuRef}>
                                 <button 
                                    onClick={() => setShowSortMenu(!showSortMenu)} 
                                    className={`h-11 w-full md:w-auto px-4 rounded-xl border flex items-center justify-center gap-2 transition-all bg-slate-900 border-slate-700 text-slate-300 hover:text-white`}
                                >
                                    <ArrowDownAZ className="w-4 h-4"/>
                                    <span className="hidden md:inline text-[10px] font-bold uppercase">Ordina</span>
                                </button>
                                {showSortMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden py-1 animate-in zoom-in-95 origin-top-right">
                                        <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-1">Ordina Per</div>
                                        <SortItem id="votes" label="Popolarità" icon={Heart} />
                                        <SortItem id="interest" label="Interesse" icon={TrendingUp} />
                                        <SortItem id="rating" label="Valutazione" icon={Star} />
                                        <SortItem id="price" label="Prezzo" icon={Coins} />
                                        <SortItem id="name" label="A-Z" icon={ArrowDownAZ} />
                                    </div>
                                )}
                            </div>

                            {/* FILTERS */}
                            <button 
                                onClick={() => setIsFilterDrawerOpen(true)} 
                                className={`flex-1 md:flex-none h-11 px-4 flex items-center justify-center gap-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider ${activeFilterCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5"/> 
                                <span className="hidden md:inline">Filtri</span> 
                                {activeFilterCount > 0 && `(${activeFilterCount})`}
                                {activeFilterCount > 0 && <div className="ml-1 p-1 hover:bg-white/20 rounded-full" onClick={handleResetFilters}><X className="w-3 h-3"/></div>}
                            </button>
                        </div>

                    </div>
                </div>

                {/* RIGA 2: REFERENCE POINT (Se attivo) */}
                {referencePoint && (
                    <div className="w-full px-4 pb-2 animate-in slide-in-from-top-1 bg-[#020617] border-b border-slate-800/50">
                        <div className="bg-indigo-600/90 px-4 py-2 rounded-xl shadow-lg flex items-center justify-between border border-indigo-500/50 backdrop-blur-sm gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <Crosshair className="w-4 h-4 animate-pulse text-indigo-200 shrink-0"/>
                                <span className={`truncate ${referenceDistanceStyle || 'text-white text-xs font-bold'}`}>Distanza da: <span className="font-bold text-indigo-300 ml-1">{referencePoint.name}</span> <span className="text-indigo-200/70 text-[10px] ml-1">(<button onClick={handleCategoryLinkClick} className="underline decoration-indigo-300/50 hover:text-indigo-200 transition-colors">{getPoiCategoryLabel(referencePoint.category)}</button>)</span></span>
                            </div>
                            <button onClick={() => setReferencePoint(null)} className="p-1 hover:bg-indigo-700 rounded-full transition-colors text-white shrink-0"><X className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- GRID LAYOUT RESPONSIVO (Contenuto Principale) --- */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[19rem_1fr_19rem] min-[1900px]:grid-cols-[19rem_19rem_1fr_19rem_19rem] w-full relative">
                
                {/* 1. COLONNA ESTERNA SX (SOLO >1900px) */}
                <div className="hidden min-[1900px]:block h-full border-r border-slate-800/50 overflow-hidden">
                    <CategorySponsorColumn 
                        side="left" 
                        offsetMultiplier={0}
                        goldSponsors={goldSponsors} 
                        silverSponsors={silverSponsors}
                        onAddToItinerary={onAddToItinerary}
                        onOpenPoiDetail={onOpenPoiDetail}
                        onOpenSponsor={onOpenSponsor}
                        onLike={handleLike}
                        hasUserLiked={hasUserLiked}
                        userLocation={userLocation}
                    />
                </div>
                
                {/* 2. COLONNA INTERNA SX (Desktop Standard & Wide) */}
                <div className="hidden lg:block h-full border-r border-slate-800/50 overflow-hidden">
                    <CategorySponsorColumn 
                        side="left" 
                        offsetMultiplier={1}
                        goldSponsors={goldSponsors} 
                        silverSponsors={silverSponsors}
                        onAddToItinerary={onAddToItinerary}
                        onOpenPoiDetail={onOpenPoiDetail}
                        onOpenSponsor={onOpenSponsor}
                        onLike={handleLike}
                        hasUserLiked={hasUserLiked}
                        userLocation={userLocation}
                    />
                </div>
                
                {/* 3. CONTENUTO CENTRALE (Fluido & Scrollable) */}
                <div className="w-full min-w-0 h-auto md:h-full md:overflow-y-auto overflow-visible custom-scrollbar bg-[#020617]">
                     <div className="w-full flex flex-col pb-32">
                         {/* CITY GUIDE RENDERIZZA LA LISTA VERTICALE DEI POI */}
                         <CityGuide 
                            pois={filteredList} 
                            sponsors={activeSponsors}
                            userLocation={userLocation} 
                            onAddToItinerary={onAddToItinerary} 
                            isItemInItinerary={isItemInItinerary} 
                            referencePoint={referencePoint ? {lat: referencePoint.coords.lat, lng: referencePoint.coords.lng, name: referencePoint.name} : null}
                            onSetReference={handleSetReference}
                            onOpenDetail={onOpenPoiDetail}
                            onOpenShop={onOpenShopFromPoi}
                            onOpenSponsor={onOpenSponsor}
                            isSidebarOpen={isSidebarOpen}
                            user={user}
                            onOpenAuth={onOpenAuth}
                            onOpenReview={onOpenReview}
                            scrollContainerRef={useRef(null)} // Dummy ref
                            onAdminEdit={onAdminEdit}
                         />
                         
                         {/* MOBILE SPONSOR BLOCK (Only visible on small screens) */}
                         <div className="lg:hidden mt-8 px-4">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-px flex-1 bg-amber-600/40"></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">PARTNER</span>
                                <div className="h-px flex-1 bg-amber-600/40"></div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {goldSponsors.slice(0, 2).map((s, i) => (
                                     <div key={s.id} className="h-40">
                                         <CompactDiscoveryCard 
                                            poi={s} 
                                            onOpenDetail={onOpenPoiDetail} 
                                            onAddToItinerary={onAddToItinerary} 
                                            onLike={() => handleLike(s)} 
                                            isLiked={hasUserLiked(s.id)} 
                                            fluid={true} 
                                            verticalStretch={true} 
                                            userLocation={userLocation}
                                         />
                                     </div>
                                  ))}
                                  
                                  {silverSponsors.length > 0 && (
                                     <div className="h-40 col-span-1 sm:col-span-2">
                                        <CompactDiscoveryCard 
                                            poi={silverSponsors[0]} 
                                            onOpenDetail={onOpenPoiDetail} 
                                            onAddToItinerary={onAddToItinerary} 
                                            onLike={() => handleLike(silverSponsors[0])} 
                                            isLiked={hasUserLiked(silverSponsors[0].id)} 
                                            fluid={true} 
                                            verticalStretch={true} 
                                            userLocation={userLocation}
                                         />
                                     </div>
                                  )}
                              </div>
                         </div>
                    </div>
                </div>

                {/* 4. COLONNA INTERNA DX (Desktop Standard & Wide) */}
                <div className="hidden lg:block h-full border-l border-slate-800/50 overflow-hidden">
                    <CategorySponsorColumn 
                        side="right" 
                        offsetMultiplier={2}
                        goldSponsors={goldSponsors} 
                        silverSponsors={silverSponsors}
                        onAddToItinerary={onAddToItinerary}
                        onOpenPoiDetail={onOpenPoiDetail}
                        onOpenSponsor={onOpenSponsor}
                        onLike={handleLike}
                        hasUserLiked={hasUserLiked}
                        userLocation={userLocation}
                    />
                </div>

                {/* 5. COLONNA ESTERNA DX (SOLO >1900px) */}
                <div className="hidden min-[1900px]:block h-full border-l border-slate-800/50 overflow-hidden">
                    <CategorySponsorColumn 
                        side="right" 
                        offsetMultiplier={3}
                        goldSponsors={goldSponsors} 
                        silverSponsors={silverSponsors}
                        onAddToItinerary={onAddToItinerary}
                        onOpenPoiDetail={onOpenPoiDetail}
                        onOpenSponsor={onOpenSponsor}
                        onLike={handleLike}
                        hasUserLiked={hasUserLiked}
                        userLocation={userLocation}
                    />
                </div>
            </div>
        </div>
    );
};


import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { Layout, MapPin, Utensils, Bed, Camera, Sparkles, PartyPopper, User, Trees, Loader2, ShoppingBag } from 'lucide-react';
import { PointOfInterest, SuggestionType, CityDetails, CitySummary } from '../../types/index';
import { useCityData } from '../../hooks/useCityData';
import { CityHeader } from './CityHeader';
import { CityInfoModal } from '../modals/CityInfoModal';
import { ProvinceModal } from '../modals/ProvinceModal';
import { CultureCornerModal } from '../modals/CultureCornerModal';
import { PatronSaintModal } from '../modals/PatronSaintModal';
import { HistoryModal } from '../modals/HistoryModal';
import { SuggestionModal } from '../modals/SuggestionModal'; 
import { isPoiNew } from '../../utils/common';
import { fetchSponsorsByCityAsync } from '../../services/sponsorService'; 
import { useModal } from '../../context/ModalContext'; 
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUser } from '../../context/UserContext'; 
import { useGps } from '../../context/GpsContext'; 
import { useUI } from '../../context/UIContext'; // IMPORT UI CONTEXT

// --- LAZY IMPORTS ---
const CityGallery = React.lazy(() => import('./tabs/CityGallery').then(m => ({ default: m.CityGallery })));
const CityShowcaseTab = React.lazy(() => import('./tabs/CityShowcaseTab').then(m => ({ default: m.CityShowcaseTab })));
const CityCategoryTab = React.lazy(() => import('./tabs/CityCategoryTab').then(m => ({ default: m.CityCategoryTab })));

type CityTab = 'vetrina' | 'destinazioni' | 'natura' | 'sapori' | 'alloggi' | 'shopping' | 'svago' | 'novita' | 'galleria';

interface CityDetailContentProps {
  cityId: string;
  onBack: () => void;
  onToggleLocation: () => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  onRemoveFromItinerary: (poiId: string) => void;
  onOpenPoiDetail: (poi: PointOfInterest) => void;
  onOpenReview: (poi: PointOfInterest) => void;
  onSwitchCity: (cityId: string) => void;
  onOpenSponsor: (tier?: 'gold' | 'silver') => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenShop: (poi?: PointOfInterest) => void; 
  onOpenAuth: () => void;
  cityManifest: CitySummary[]; 
  isSidebarOpen?: boolean;
  preloadedCity?: CityDetails | null;
  isUiVisible?: boolean; 
}

const TabLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 w-full text-slate-500 gap-4 min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500"/>
        <p className="font-bold uppercase tracking-widest text-xs">Caricamento Sezione...</p>
    </div>
);

// Helper per mappare Tab -> Categoria Tecnica
const getCategoryFromTab = (tab: CityTab): string => {
    switch (tab) {
        case 'destinazioni': return 'monument';
        case 'natura': return 'nature';
        case 'sapori': return 'food';
        case 'alloggi': return 'hotel';
        case 'shopping': return 'shop';
        case 'svago': return 'leisure';
        default: return 'all';
    }
};

export const CityDetailContent: React.FC<CityDetailContentProps> = ({ 
    cityId, onBack, onToggleLocation, onAddToItinerary, 
    onRemoveFromItinerary, onOpenPoiDetail, onOpenReview, onSwitchCity, 
    onOpenSponsor, initialTab = 'vetrina', onTabChange, 
    onOpenShop, onOpenAuth, cityManifest, isSidebarOpen, preloadedCity,
    isUiVisible = true
}) => {
    
    // --- CONTEXT HOOKS ---
    const { user } = useUser();
    const { userLocation } = useGps();
    const { handleMainScroll } = useUI(); // SCROLL HANDLER

    const hookData = useCityData(preloadedCity ? null : cityId);
    
    const city = preloadedCity || hookData.city;
    const loading = preloadedCity ? false : hookData.loading;
    
    useDocumentTitle(city?.name || 'Caricamento...');

    const [activeTab, setActiveTab] = useState<CityTab>((initialTab as CityTab) || 'vetrina');
    const [activeModal, setActiveModal] = useState<'none' | 'guides' | 'services' | 'events' | 'province' | 'culture' | 'patron' | 'history' | 'tour_operators'>('none');
    const [suggestionModal, setSuggestionModal] = useState<{ isOpen: boolean; type: SuggestionType; prefilledName?: string }>({ isOpen: false, type: 'new_place' });
    
    const [referencePoint, setReferencePoint] = useState<PointOfInterest | null>(null);
    const [activeSponsors, setActiveSponsors] = useState<PointOfInterest[]>([]);
    
    const { openModal } = useModal(); 
    
    // Gestione Scroll Reset al cambio Tab
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!preloadedCity) {
             fetchSponsorsByCityAsync(cityId).then(setActiveSponsors);
        } else {
            setActiveSponsors([]); 
        }
    }, [cityId, preloadedCity]);

    const isAdmin = user.role === 'admin_all' || user.role === 'admin_limited';

    const visibleAllPois = useMemo(() => {
        if (!city || !city.details.allPois) return [];
        return city.details.allPois.filter(p => (p.status || 'published') === 'published');
    }, [city]);

    const sourceList = useMemo(() => {
        if (!city) return [];

        const mixWithSponsors = (category: string) => {
            // Filtra sponsor per categoria
            const sponsored = activeSponsors.filter(s => s.category === category);
            
            // Filtra POI editoriali
            const editorial = visibleAllPois.filter(p => p.category === category);
            
            // Rimuovi duplicati (se uno sponsor è anche editoriale, usa lo sponsor)
            const uniqueEditorial = editorial.filter(ep => 
                !sponsored.some(sp => sp.name.toLowerCase().trim() === ep.name.toLowerCase().trim())
            );
            return [...sponsored, ...uniqueEditorial];
        };

        switch (activeTab) {
            case 'destinazioni': return mixWithSponsors('monument');
            case 'natura': return mixWithSponsors('nature');
            case 'sapori': return mixWithSponsors('food');
            case 'alloggi': return mixWithSponsors('hotel');
            case 'shopping': return mixWithSponsors('shop');
            case 'svago': return mixWithSponsors('leisure');
            case 'novita': {
                const newsEditorial = visibleAllPois.filter(p => isPoiNew(p));
                const uniqueEditorial = newsEditorial.filter(ep => 
                    !activeSponsors.some(sp => sp.name.toLowerCase().trim() === ep.name.toLowerCase().trim())
                );
                return [...activeSponsors.filter(s => isPoiNew(s)), ...uniqueEditorial];
            }
            default: return [];
        }
    }, [activeTab, city, visibleAllPois, activeSponsors]);

    const handleTabChange = (newTab: CityTab) => {
        setActiveTab(newTab);
        if (onTabChange) onTabChange(newTab);
        // Scroll leggero verso l'alto ma sotto l'header (UX)
        if (scrollContainerRef.current && window.innerWidth < 768) {
            // Su mobile scrolliamo un po' per mostrare il contenuto
            const headerHeight = 300; 
            if (scrollContainerRef.current.scrollTop > headerHeight) {
                scrollContainerRef.current.scrollTo({ top: headerHeight, behavior: 'smooth' });
            }
        }
    };
    
    const handleMergeTrigger = (isActive: boolean, radius: number) => {
        if (isActive) {
             const event = new CustomEvent('trigger-merge-mode', { detail: { cityId: city?.id, radius } });
             window.dispatchEvent(event);
        } else {
             if (onSwitchCity && city) onSwitchCity(city.id);
        }
        setActiveModal('none');
    };
    
    const handleAdminEdit = (poi: PointOfInterest) => {
        if (isAdmin) {
             openModal('adminEditPoi', { poi });
        }
    };

    const tabs = [
        { id: 'vetrina', label: 'Vetrina', icon: Layout },
        { id: 'destinazioni', label: 'Destinazioni', icon: MapPin },
        { id: 'sapori', label: 'Sapori', icon: Utensils },
        { id: 'alloggi', label: 'Alloggi', icon: Bed },
        { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
        { id: 'svago', label: 'Svago', icon: PartyPopper },
        { id: 'natura', label: 'Natura', icon: Trees },
        { id: 'novita', label: 'Novità', icon: Sparkles },
        { id: 'galleria', label: 'Galleria', icon: Camera },
    ];

    if (loading || !city) return (
        <div className="h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                <span className="text-slate-500 font-mono text-sm animate-pulse">Caricamento città...</span>
            </div>
        </div>
    );

    const isVirtual = city.id === 'around-me-virtual' || (preloadedCity && preloadedCity.id === city.id);

    return (
        <div 
            ref={scrollContainerRef}
            onScroll={handleMainScroll}
            className="flex flex-col w-full bg-[#020617] relative custom-scrollbar scrollbar-hide-mobile scroll-smooth h-full overflow-y-auto"
        >
            
            {/* 1. HEADER CITTÀ (IMMAGINE HERO) */}
            <div className="shrink-0 z-10 relative">
                <CityHeader city={city} onOpenInfo={(t) => setActiveModal(t)} onOpenPatron={() => setActiveModal('patron')} onOpenSurroundings={() => setActiveModal('province')} onOpenCulture={() => setActiveModal('culture')} onOpenShop={() => onOpenShop()} onOpenSponsor={() => onOpenSponsor()} onOpenHistory={() => setActiveModal('history')} onToggleLocation={onToggleLocation} isLocationActive={!!userLocation} />
            </div>

            {/* 2. TAB NAVIGATION - NOT STICKY ON MOBILE */}
            <div className="relative md:sticky md:top-0 z-[40] bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 shadow-xl shrink-0">
                {/* DESKTOP TABS */}
                <div className="hidden md:flex flex-nowrap justify-center gap-0 overflow-x-auto no-scrollbar px-1 w-full">
                    {tabs.map((tab) => (
                        <React.Fragment key={tab.id}>
                            <button onClick={() => handleTabChange(tab.id as any)} className={`flex-shrink-0 py-3 px-3 text-sm font-bold uppercase tracking-wider transition-all relative group whitespace-nowrap ${activeTab === tab.id ? 'text-orange-500' : 'text-yellow-400 hover:text-orange-500'}`}><span className="flex items-center gap-1.5 relative z-10">{/*@ts-ignore*/}<tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-orange-500' : 'text-yellow-400 group-hover:text-orange-500'}`}/> {tab.label}</span></button>
                            <div className="w-px h-3 bg-slate-800 flex-shrink-0 opacity-50 mx-1 self-center"></div>
                        </React.Fragment>
                    ))}
                </div>
                
                {/* MOBILE TABS (GRID 2 ROWS) */}
                <div className="md:hidden grid grid-cols-5 grid-rows-2 gap-1 p-2 bg-slate-900">
                    {tabs.filter(t => t.id !== 'galleria').map((tab) => (
                        <button 
                            key={tab.id} 
                            onClick={() => handleTabChange(tab.id as any)} 
                            className={`flex flex-col items-center justify-center p-1 rounded-lg border transition-all h-10 ${activeTab === tab.id ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-orange-500'}`}
                        >
                            {/* @ts-ignore */}
                            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-orange-500' : 'text-slate-500'}`}/>
                            <span className="text-[7px] font-bold uppercase text-center leading-none mt-0.5 w-full truncate px-0.5">{tab.label}</span>
                        </button>
                    ))}

                    {tabs.filter(t => t.id === 'galleria').map((tab) => (
                        <button 
                            key={tab.id} 
                            onClick={() => handleTabChange(tab.id as any)} 
                            className={`col-start-5 row-start-1 row-span-2 flex flex-col items-center justify-center rounded-xl border transition-all shadow-md active:scale-95 ${activeTab === tab.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                        >
                            {/* @ts-ignore */}
                            <tab.icon className={`w-5 h-5 mb-0.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}/>
                            <span className="text-[8px] font-black uppercase text-center leading-none">FOTO</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. CONTENUTO - MD: FLEX-1 MIN-H-0 */}
            <div className="w-full bg-[#020617] relative z-0 md:flex-1 md:min-h-0 md:overflow-hidden">
                <div key={activeTab} className="w-full h-full animate-in fade-in duration-500">
                    <Suspense fallback={<TabLoader />}>
                        {activeTab === 'galleria' ? (
                            <CityGallery city={city} user={user} onOpenAuth={onOpenAuth} />
                        ) : activeTab === 'vetrina' ? (
                            <CityShowcaseTab 
                                city={city} visibleAllPois={visibleAllPois} activeSponsors={activeSponsors}
                                onOpenPoiDetail={onOpenPoiDetail} onAddToItinerary={onAddToItinerary}
                                onOpenSponsor={onOpenSponsor} onOpenSuggestion={() => setSuggestionModal({ isOpen: true, type: 'new_place' })}
                                user={user}
                                onOpenAuth={onOpenAuth}
                                userLocation={userLocation}
                            />
                        ) : (
                            <CityCategoryTab 
                                sourceList={sourceList} 
                                activeSponsors={activeSponsors} 
                                userLocation={userLocation}
                                onToggleLocation={onToggleLocation} 
                                onAddToItinerary={onAddToItinerary}
                                onOpenPoiDetail={onOpenPoiDetail} 
                                onOpenReview={onOpenReview} 
                                onOpenSponsor={() => onOpenSponsor()}
                                referencePoint={referencePoint} 
                                setReferencePoint={setReferencePoint}
                                onOpenSuggestion={(type) => setSuggestionModal({ isOpen: true, type })}
                                isSidebarOpen={isSidebarOpen} 
                                onOpenShopFromPoi={onOpenShop} 
                                user={user}
                                onOpenAuth={onOpenAuth}
                                isUiVisible={isUiVisible} 
                                onAdminEdit={handleAdminEdit}
                                onTabChange={(t) => handleTabChange(t as CityTab)}
                                currentCategory={getCategoryFromTab(activeTab)} 
                            />
                        )}
                    </Suspense>
                </div>
            </div>
            
            {/* SPAZIO EXTRA PER MOBILE NAV (Solo mobile) */}
            <div className="h-24 md:hidden w-full shrink-0"></div>

            {/* MODALI */}
            {['guides', 'services', 'events', 'tour_operators'].includes(activeModal) && (
                <CityInfoModal 
                    isOpen={true} 
                    onClose={() => setActiveModal('none')} 
                    city={city} 
                    initialTab={activeModal as any} 
                    onAddToItinerary={onAddToItinerary} 
                    user={user} 
                    onOpenAuth={onOpenAuth} 
                    onSuggestEdit={(name) => setSuggestionModal({ isOpen: true, type: 'edit_info', prefilledName: name })}
                />
            )}
            <ProvinceModal 
                isOpen={activeModal === 'province'} 
                onClose={() => setActiveModal('none')} 
                currentCity={city} 
                onSelectCity={(id) => onSwitchCity && onSwitchCity(id)} 
                liveManifest={cityManifest} 
                onToggleMerge={handleMergeTrigger}
                isMergeActive={isVirtual}
            />
            <CultureCornerModal isOpen={activeModal === 'culture'} onClose={() => setActiveModal('none')} city={city} onAddToItinerary={onAddToItinerary} />
            <PatronSaintModal isOpen={activeModal === 'patron'} onClose={() => setActiveModal('none')} city={city} />
            <HistoryModal isOpen={activeModal === 'history'} onClose={() => setActiveModal('none')} city={city} openSuggestion={() => setSuggestionModal({ isOpen: true, type: 'history_culture' })} />
            <SuggestionModal isOpen={suggestionModal.isOpen} onClose={() => setSuggestionModal({ ...suggestionModal, isOpen: false })} cityId={city.id} cityName={city.name} user={user} onOpenAuth={onOpenAuth} initialType={suggestionModal.type} prefilledName={suggestionModal.prefilledName} existingPois={visibleAllPois} />
        </div>
    );
};

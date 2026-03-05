
import React, { useMemo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { HomeContent } from '../home/HomeContent';
import { getShopByVat } from '../../services/shopService';
import { useModal } from '../../context/ModalContext';

// CONTEXT CONSUMER
import { useUser } from '../../context/UserContext';
import { useGps } from '../../context/GpsContext';
import { useNavigation } from '../../context/NavigationContext';
import { useUI } from '../../context/UIContext';
import { useDiaryInteractionsContext } from '../../context/DiaryInteractionContext'; // NEW IMPORT

// --- LAZY IMPORTS ---
const CityDetailContent = React.lazy(() => import('../city/CityDetailContent').then(module => ({ default: module.CityDetailContent })));
const ShopPage = React.lazy(() => import('../shop/ShopPage').then(module => ({ default: module.ShopPage })));
const TravelDiary = React.lazy(() => import('../features/TravelDiary').then(module => ({ default: module.TravelDiary }))); // Imported for Side Planner

const PageLoader = () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin"/>
        <p className="text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">
            Caricamento Risorsa...
        </p>
    </div>
);

export const AppRouter: React.FC = () => {
    // Context Consumption
    const { user, cityManifest, isLoadingManifest } = useUser();
    const { userLocation } = useGps();
    const { isSidebarOpen, handleMainScroll, isUiVisible } = useUI();
    const { 
        activeCityId, activeShopId, virtualCity, isBuildingVirtual,
        currentCityTab, activeCategories, selectedZone,
        setActiveCategories, setSelectedZone, 
        navigateToCity, goBack, goHome, handleAroundMeTrigger,
        openShopFromPoi, handleNavigateGlobal, targetShopVat, setActivePreview
    } = useNavigation();
    
    const { openModal } = useModal();
    
    // RECUPERO LOGICA DIARIO
    const { handleSmartDrop } = useDiaryInteractionsContext();

    // --- FILTRO VISIBILITÀ (SOLO PUBBLICATI) ---
    const publicManifest = useMemo(() => cityManifest.filter(c => c.status === 'published'), [cityManifest]);
    const publicFeatured = useMemo(() => publicManifest.filter(c => c.isFeatured), [publicManifest]);
    const publicMostVisited = useMemo(() => [...publicManifest].sort((a,b) => b.visitors - a.visitors).slice(0,10), [publicManifest]);
    const publicDestinations = useMemo(() => publicManifest.filter(c => c.specialBadge === 'destination'), [publicManifest]);

    // Local state for planner side panel inside shop page logic or general
    // NOTE: ShowPlanner state is managed inside ShopPage but we might need to pass down handleSmartDrop

    const handleSmartBack = () => {
        if (activeShopId) { goBack(); return; }
        if (virtualCity) { 
            if (virtualCity.id === 'around-me-virtual') { goHome(); return; }
            goBack(); return; 
        } 
        goBack();
    };

    const handleSmartPoiClick = async (poi: PointOfInterest) => {
        if (poi.vatNumber) {
            try {
                const shop = await getShopByVat(poi.vatNumber);
                if (shop) { openShopFromPoi(poi); return; }
            } catch (e) { console.error(e); }
        }
        openModal('poiDetail', { poi });
    };

    if (isLoadingManifest || isBuildingVirtual) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin"/>
                <p className="text-slate-500 uppercase font-black text-xs tracking-widest">
                    {isBuildingVirtual ? 'Analisi Territorio & Fusione Dati...' : 'Caricamento Campania Cloud...'}
                </p>
            </div>
        );
    }

    if (activeShopId) {
        const contextCityId = activeCityId || 'napoli'; 
        const city = cityManifest.find(c => c.id === contextCityId);
        
        return (
            <Suspense fallback={<PageLoader />}>
                <ShopPage 
                    cityId={contextCityId} 
                    cityName={city?.name || 'Campania'}
                    onBack={handleSmartBack}
                    onAddToItinerary={(poi) => openModal('add', { poi })}
                    onOpenPoiDetail={handleSmartPoiClick} 
                    onOpenSponsor={(type) => openModal('sponsor', { sponsorType: type })}
                    isSidebarOpen={isSidebarOpen}
                    initialShopVat={targetShopVat}
                    isModalOpen={false}
                />
            </Suspense>
        );
    }

    // RENDER VIRTUAL CITY (AROUND ME OR MERGED)
    if (virtualCity) {
         return (
            <Suspense fallback={<PageLoader />}>
                <CityDetailContent 
                    key={virtualCity.id} 
                    cityId={virtualCity.id} 
                    onBack={handleSmartBack} 
                    onToggleLocation={() => openModal('gpsAlert')}
                    onAddToItinerary={(poi) => openModal('add', { poi })} 
                    onRemoveFromItinerary={() => {}} 
                    onOpenPoiDetail={handleSmartPoiClick}
                    onOpenReview={(poi) => openModal('review', { poi })}
                    onSwitchCity={navigateToCity} 
                    onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
                    initialTab={currentCityTab} 
                    onTabChange={() => {}} 
                    onOpenShop={openShopFromPoi}
                    onOpenAuth={() => openModal('auth')}
                    cityManifest={publicManifest} 
                    isSidebarOpen={isSidebarOpen} 
                    preloadedCity={virtualCity}
                    isUiVisible={isUiVisible} 
                />
            </Suspense>
        );
    }

    if (activeCityId) {
        return (
            <Suspense fallback={<PageLoader />}>
                <CityDetailContent 
                    key={activeCityId} 
                    cityId={activeCityId} 
                    onBack={goBack} 
                    onToggleLocation={() => openModal('gpsAlert')}
                    onAddToItinerary={(poi) => openModal('add', { poi })} 
                    onRemoveFromItinerary={() => {}} 
                    onOpenPoiDetail={handleSmartPoiClick}
                    onOpenReview={(poi) => openModal('review', { poi })}
                    onSwitchCity={navigateToCity} 
                    onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
                    initialTab={currentCityTab} 
                    onTabChange={() => {}} 
                    onOpenShop={openShopFromPoi}
                    onOpenAuth={() => openModal('auth')}
                    cityManifest={publicManifest} 
                    isSidebarOpen={isSidebarOpen} 
                    isUiVisible={isUiVisible} 
                />
            </Suspense>
        );
    }

    return (
        <HomeContent 
            heroProps={{ activeCategories, setActiveCategories, onSelectCity: navigateToCity, selectedZone, setSelectedZone }}
            featuredCities={publicFeatured} 
            mostVisitedCities={publicMostVisited} 
            allMostVisitedCities={[...publicManifest].sort((a,b) => b.visitors - a.visitors)}
            destinationCities={publicDestinations} 
            onCityClick={navigateToCity}
            onExploreSection={(cities, title, icon, categories) => { setActivePreview({ isOpen: true, title, icon, cities, categories }); openModal('preview'); }}
            onAddToItinerary={(poi) => openModal('add', { poi })} 
            onOpenPoiDetail={handleSmartPoiClick}
            onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
        />
    );
};

import React, { useMemo, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { HomeContent } from '../home/HomeContent';
import { getShopByVat } from '../../services/shopService';
import { useModal } from '@/context/ModalContext';
import { buildHomeShelf } from '@/domain/city/homeShelf';

// CONTEXT CONSUMER
import { useUser } from '@/context/UserContext';
import { useGps } from '@/context/GpsContext';
import { useNavigation } from '@/context/useNavigation';
import { useUI } from '@/context/UIContext';
import { useDiaryInteractionsContext } from '@/context/useDiaryInteractionsContext';
import { useAppRouter } from '@/hooks/useAppRouter';

// --- LAZY IMPORTS ---
const CityDetailContent = React.lazy(() => import('../city/CityDetailContent').then(module => ({ default: module.CityDetailContent })));
const ShopPage = React.lazy(() => import('../shop/ShopPage').then(module => ({ default: module.ShopPage })));
const TravelDiary = React.lazy(() => import('../features/diary/TravelDiary').then(module => ({ default: module.TravelDiary })));
const UserDashboard = React.lazy(() => import('../user/UserDashboard').then(module => ({ default: module.UserDashboard })));
const CheckoutSuccessPage = React.lazy(() => import('../features/checkout/CheckoutSuccessPage').then(module => ({ default: module.CheckoutSuccessPage })));

const PageLoader = () => (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-slate-500 uppercase font-black text-xs tracking-widest animate-pulse">
            Caricamento Risorsa...
        </p>
    </div>
);

const MainContent: React.FC = () => {
    // Context Consumption
    const { user, cityManifest, isLoadingManifest, handleLogout } = useUser();
    const { userLocation } = useGps();
    const { isSidebarOpen, handleMainScroll, isUiVisible } = useUI();
    const {
        activeCityId, activeShopId, virtualCity, isBuildingVirtual,
        currentCityTab, activeCategories, selectedZone, selectedSeason,
        setActiveCategories, setSelectedZone, setSelectedSeason,
        navigateToCity, goBack, goHome, handleAroundMeTrigger, handleMergeCities,
        openShopFromPoi, handleNavigateGlobal, targetShopVat, setActivePreview,
    } = useNavigation();

    const { openModal } = useModal();
    const location = useLocation();

    // RECUPERO LOGICA DIARIO
    const { handleSmartDrop } = useDiaryInteractionsContext();
    const router = useAppRouter();

    // CatalogRest (manifest completo) — sorgente dati, NON gate del first paint (DOC-38 §S.4).
    const publicManifest = useMemo(() => cityManifest || [], [cityManifest]);
    // HomeShelf — proiezione minima per la vetrina (stesso fetch; nessun secondo round-trip).
    const homeShelf = useMemo(() => buildHomeShelf(publicManifest), [publicManifest]);
    const publicMostVisited = useMemo(
        () => [...homeShelf].sort((a, b) => (b.visitors || 0) - (a.visitors || 0)).slice(0, 10),
        [homeShelf],
    );
    const shelfSortedByVisitors = useMemo(
        () => [...homeShelf].sort((a, b) => (b.visitors || 0) - (a.visitors || 0)),
        [homeShelf],
    );

    // ======== DASHBOARD INTERCEPTION (V4 & LEGACY) ========
    if (router.isDashboardPath || location.pathname.includes('/partner/')) {
        return (
            <Suspense fallback={<PageLoader />}>
                <UserDashboard 
                    isOpen={true} 
                    onClose={() => goHome()} 
                    user={user} 
                    onLogout={async () => { 
                        await handleLogout(); 
                        goHome(); 
                    }} 
                    onNavigate={handleNavigateGlobal}
                />
            </Suspense>
        );
    }

    // ======== CHECKOUT SUCCESS INTERCEPTION ========
    if (router.isCheckoutSuccessPath) {
        return (
            <Suspense fallback={<PageLoader />}>
                <CheckoutSuccessPage />
            </Suspense>
        );
    }
    // ====================================================================

    // Allineato a NavigationContext.goBack (autorità Header): Around Me → Home semantica.
    const handleSmartBack = () => {
        if (activeShopId) { goBack(); return; }
        if (virtualCity?.virtualMode === 'around_me' || virtualCity?.id === 'around-me-virtual') {
            goHome();
            return;
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

    // STEP S.4: Manifest non blocca più la Home. Restano solo loading locali utili:
    // - isBuildingVirtual (azione utente Around Me / merge)
    // - citySlug ancora irrisolto mentre CatalogRest è in volo (evita flash Home → città)
    if (isBuildingVirtual) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                <p className="text-slate-500 uppercase font-black text-xs tracking-widest">
                    Analisi Territorio & Fusione Dati...
                </p>
            </div>
        );
    }

    if (router.citySlug && !activeCityId && isLoadingManifest) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                <p className="text-slate-500 uppercase font-black text-xs tracking-widest">
                    Caricamento Città...
                </p>
            </div>
        );
    }

    if (activeShopId) {
        const isAroundMeShop = activeShopId === 'around-me-virtual';
        const aroundMeTerritory =
            virtualCity?.virtualMode === 'around_me' || virtualCity?.id === 'around-me-virtual'
                ? virtualCity
                : null;
        const contextCityId = isAroundMeShop
            ? 'around-me-virtual'
            : activeCityId || 'napoli';
        const city = isAroundMeShop
            ? null
            : cityManifest.find(c => c.id === contextCityId);
        const territoryIds = isAroundMeShop
            ? (aroundMeTerritory?.aggregatedCities ?? []).map((c) => c.id)
            : undefined;

        return (
            <Suspense fallback={<PageLoader />}>
                <ShopPage
                    cityId={contextCityId}
                    cityName={isAroundMeShop ? 'Around Me' : (city?.name || 'Campania')}
                    cityIds={territoryIds}
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
                    onRemoveFromItinerary={() => { }}
                    onOpenPoiDetail={handleSmartPoiClick}
                    onOpenReview={(poi) => openModal('review', { poi })}
                    onSwitchCity={navigateToCity}
                    onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
                    initialTab={currentCityTab}
                    onTabChange={() => { }}
                    onOpenShop={openShopFromPoi}
                    onOpenAuth={() => openModal('auth')}
                    cityManifest={publicManifest}
                    isSidebarOpen={isSidebarOpen}
                    preloadedCity={virtualCity}
                    onMergeCities={handleMergeCities}
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
                    onRemoveFromItinerary={() => { }}
                    onOpenPoiDetail={handleSmartPoiClick}
                    onOpenReview={(poi) => openModal('review', { poi })}
                    onSwitchCity={navigateToCity}
                    onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
                    initialTab={currentCityTab}
                    onTabChange={() => { }}
                    onOpenShop={openShopFromPoi}
                    onOpenAuth={() => openModal('auth')}
                    cityManifest={publicManifest}
                    isSidebarOpen={isSidebarOpen}
                    onMergeCities={handleMergeCities}
                    isUiVisible={isUiVisible}
                />
            </Suspense>
        );
    }

    return (
        <HomeContent
            heroProps={{ activeCategories, setActiveCategories, onSelectCity: navigateToCity, selectedZone, setSelectedZone, selectedSeason, setSelectedSeason }}
            mostVisitedCities={publicMostVisited}
            allMostVisitedCities={shelfSortedByVisitors}
            catalogForSearch={publicManifest}
            onCityClick={navigateToCity}
            onExploreSection={(cities, title, icon, categories) => {
                    // Preview è gestita esclusivamente da activePreview (NavigationContext).
                    // Non chiamare openModal('preview'): creerebbe un doppio stato che lascia
                    // #focus-overlay attivo dopo la chiusura del modale (bug Esplora).
                    setActivePreview({ isOpen: true, title, icon, cities, categories, selectedId: null });
                }}
            onAddToItinerary={(poi) => openModal('add', { poi })}
            onOpenPoiDetail={handleSmartPoiClick}
            onOpenSponsor={(tier) => openModal('sponsor', { sponsorTier: tier })}
        />
    );
};

export const AppRouter: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            {/* --- ADMIN DOMAIN (Priority Routing) --- */}
            <Route path="/admin" element={<MainContent />} />
            <Route path="/admin/:section/*" element={<MainContent />} />

            {/* --- PARTNER DOMAIN (URL-Driven Multi-Business) --- */}
            <Route path="/partner/dashboard/:businessId/*" element={<MainContent />} />
            <Route path="/partner/shop/:businessId/*" element={<MainContent />} />
            <Route path="/partner/*" element={<MainContent />} />

            {/* --- V4 NAMESPACE INTERCEPTION (Owner Dashboard) --- */}
            {/* Questi pattern catturano /:ownerSlug/dashboard e lo passano a MainContent */}
            <Route path="/:ownerSlug/dashboard/*" element={<MainContent />} />

            {/* --- CONSUMER DOMAIN --- */}
            <Route path="/checkout-success" element={<MainContent />} />
            <Route path="/:continent/:nation/:region/:zone/:city" element={<MainContent />} />
            <Route path="/:continent/:nation/:region/:city" element={<MainContent />} />
            <Route path="/:city" element={<MainContent />} />
            <Route path="/*" element={<MainContent />} />
        </Routes>
    </Suspense>
);

export default AppRouter;

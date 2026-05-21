import React, { useMemo, Suspense } from 'react';
import { Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PointOfInterest } from '../../types/index';
import { HomeContent } from '../home/HomeContent';
import { getShopByVat } from '../../services/shopService';
import { useModal } from '@/context/ModalContext';
import { StaticPage } from './StaticPage';

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
        navigateToCity, goBack, goHome, handleAroundMeTrigger,
        openShopFromPoi, handleNavigateGlobal, targetShopVat, setActivePreview,
        activeStaticPage
    } = useNavigation();

    const { openModal } = useModal();
    const location = useLocation();

    // RECUPERO LOGICA DIARIO
    const { handleSmartDrop } = useDiaryInteractionsContext();
    const router = useAppRouter();

    // --- FILTRO VISIBILITÀ (VIEW DB GIÀ FILTRATA) ---
    const publicManifest = useMemo(() => {
        const list = (cityManifest || []);
        return list;
    }, [cityManifest]);

    const publicFeatured = useMemo(() => publicManifest.filter(c => c.isFeatured), [publicManifest]);
    const publicMostVisited = useMemo(() => [...publicManifest].sort((a, b) => (b.visitors || 0) - (a.visitors || 0)).slice(0, 10), [publicManifest]);
    const publicDestinations = useMemo(() => publicManifest.filter(c => c.specialBadge === 'destination'), [publicManifest]);

    // ======== DASHBOARD INTERCEPTION (V4 & LEGACY) ========
    if (router.isDashboardPath || location.pathname.includes('/partner/')) {
        return (
            <Suspense fallback={<PageLoader />}>
                <UserDashboard 
                    isOpen={true} 
                    onClose={() => goHome()} 
                    user={user} 
                    onLogout={async () => { 
                        console.log("[TRACE_LOGOUT] Dashboard: trigger onLogout.");
                        await handleLogout(); 
                        console.log("[TRACE_LOGOUT] Dashboard: handleLogout finito, navigazione alla home...");
                        goHome(); 
                    }} 
                    onNavigate={handleNavigateGlobal}
                />
            </Suspense>
        );
    }
    // ====================================================================

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

    // ======== BLOCCO AGGIUNTO PER PAGINE STATICHE ========
    const staticPages = ['chi-siamo', 'contatti', 'privacy', 'termini', 'support', 'about', 'contacts'];
    if (staticPages.includes(activeStaticPage)) {
        return <StaticPage type={activeStaticPage} onBack={goHome} />;
    }
    // ========================================================

    if (isLoadingManifest || isBuildingVirtual) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
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
                    isUiVisible={isUiVisible}
                />
            </Suspense>
        );
    }

    return (
        <HomeContent
            heroProps={{ activeCategories, setActiveCategories, onSelectCity: navigateToCity, selectedZone, setSelectedZone, selectedSeason, setSelectedSeason }}
            featuredCities={publicFeatured}
            mostVisitedCities={publicMostVisited}
            allMostVisitedCities={[...publicManifest].sort((a, b) => b.visitors - a.visitors)}
            destinationCities={publicDestinations}
            onCityClick={navigateToCity}
            onExploreSection={(cities, title, icon, categories) => { setActivePreview({ isOpen: true, title, icon, cities, categories }); openModal('preview'); }}
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
            <Route path="/:continent/:nation/:region/:zone/:city" element={<MainContent />} />
            <Route path="/:continent/:nation/:region/:city" element={<MainContent />} />
            <Route path="/:city" element={<MainContent />} />
            <Route path="/*" element={<MainContent />} />
        </Routes>
    </Suspense>
);

export default AppRouter;

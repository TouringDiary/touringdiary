import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppRouter } from '../hooks/useAppRouter';
import { useUser } from './UserContext';
import { useModal } from './ModalContext';
import { useAiPlanner } from './AiPlannerContext';
import { CityDetails, CitySummary, PointOfInterest } from '../types/index';
import { buildVirtualCity, getPoisByCityId } from '../services/cityService';
import { getShopByVat } from '../services/shopService';
import { GEO_CONFIG } from '../constants/geoConfig';
import { useGps } from './GpsContext';

interface NavigationContextType {
    // Router State
    viewMode: 'app' | 'admin';
    activeCityId: string | null;
    activeShopId: string | null;
    targetShopVat: string | null;
    currentCityTab: string;
    activeStaticPage: string | null;
    activePreview: any;
    
    // Virtual City State
    virtualCity: CityDetails | null;
    isBuildingVirtual: boolean;
    
    // Filters State
    selectedZone: string;
    activeCategories: string[];
    selectedSeason: string;
    
    // Actions
    navigateToCity: (id: string, tab?: string) => void;
    openShop: () => void;
    openShopFromPoi: (poi?: PointOfInterest) => void;
    goBack: () => void;
    goHome: () => void;
    handleNavigateGlobal: (section: string, tab?: string, id?: string, extra?: any) => void;
    handleAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
    resolveCityIdFromSlug: (slug: string) => string | null;
    
    // Setters
    setViewMode: (mode: 'app' | 'admin') => void;
    setCurrentCityTab: (tab: string) => void;
    setActiveStaticPage: (page: any) => void;
    setActivePreview: (preview: any) => void;
    setSelectedZone: (z: string) => void;
    setActiveCategories: (c: string[]) => void;
    setSelectedSeason: (s: string) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children?: ReactNode }) => {
    const navigate = useNavigate();
    const router = useAppRouter();
    const { syncMode } = useUser();
    const modalContext = useModal();
    const aiPlannerContext = useAiPlanner();
    const userContext = useUser();
    const cityManifest = userContext?.cityManifest ?? [];
    const isLoadingManifest = userContext?.isLoadingManifest ?? true;
    const gpsContext = useGps();

    // Virtual Mode State
    const [virtualCity, setVirtualCity] = useState<CityDetails | null>(null);
    const [isBuildingVirtual, setIsBuildingVirtual] = useState(false);
    
    // Global Filters State
    const [selectedZone, setSelectedZone] = useState('');
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- DEEP LINK LOGIC (Encapsulated) ---
    useEffect(() => {
        if (isLoadingManifest) return;
        if (!cityManifest || cityManifest.length === 0) return;

        if (router.deepLinkParams) {
            const { cityId, poiId, shopVat } = router.deepLinkParams;

            const processLink = async () => {
                let navigationSuccess = false;

                // A. Navigazione Città
                if (cityId) {
                    const cityExists = cityManifest.some(c => c.id === cityId);
                    if (cityExists) {
                        navigateToCity(cityId);
                        navigationSuccess = true;
                    }
                }

                // B. Navigazione Shop
                if (shopVat) {
                    try {
                        const shop = await getShopByVat(shopVat);
                        if (shop) {
                            const shopPoi: PointOfInterest = {
                                id: `shop-${shop.id}`,
                                name: shop.name,
                                category: 'shop',
                                vatNumber: shop.vatNumber,
                                cityId: shop.cityId,
                                description: '', imageUrl: '', rating: 0, votes: 0, coords: {lat:0,lng:0}, address: ''
                            };
                            if (!navigationSuccess && shop.cityId) {
                                navigateToCity(shop.cityId);
                            }
                            router.openShopFromPoi(shopPoi);
                            navigationSuccess = true;
                        }
                    } catch (e) {
                        console.error("Deep link shop error", e);
                    }
                }
                // C. Navigazione POI
                else if (poiId && cityId) {
                    try {
                        const cityPois = await getPoisByCityId(cityId);
                        const targetPoi = cityPois.find(p => p.id === poiId);
                        if (targetPoi) {
                            modalContext.openModal('poiDetail', { poi: targetPoi });
                            navigationSuccess = true;
                        }
                    } catch (e) {
                        console.error("Deep link poi error", e);
                    }
                }

                router.consumeDeepLink();
            };

            processLink();
        }
    }, [isLoadingManifest, router.deepLinkParams, cityManifest, modalContext, router]);

    const navigateToCity = useCallback((id: string, tab?: string) => {
        setVirtualCity(null); // RESET VIRTUAL STATE ON EXPLICIT NAVIGATION
        router.navigateToCity(id, tab);
    }, [router]);

    // --- NAVIGATION ACTIONS ---

    const handleAroundMeTrigger = async (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => {
        setIsBuildingVirtual(true);
        let centerCoords = GEO_CONFIG.DEFAULT_CENTER; 
        
        if (config.type === 'gps' && gpsContext.userLocation) {
             centerCoords = gpsContext.userLocation;
        } else if (config.type === 'manual' && config.cityId) {
            const targetCity = cityManifest.find(c => c.id === config.cityId);
            if (targetCity) centerCoords = targetCity.coords;
        }

        const virtual = await buildVirtualCity(centerCoords, config.radius, cityManifest);
        
        if (isMounted.current) {
            setVirtualCity(virtual);
            setIsBuildingVirtual(false);
        }
    };

    const goBack = () => {
        // 1. Se c'è una modale aperta, la chiudiamo (comportamento standard UX)
        if (modalContext.activeModal) { 
            modalContext.closeModal(); 
            return; 
        }
        
        // 2. Altrimenti seguiamo la history naturale del browser (URL-driven)
        // Il cleanup di virtualCity e altri stati avverrà reattivamente tramite l'effetto su pathname
        router.goBack();
    };

    const goHome = () => {
        router.goHome();
        modalContext.closeModal();
        setVirtualCity(null);
        aiPlannerContext.resetAiSession();
    };

    const handleNavigateGlobal = (section: string, tab?: string, id?: string, extra?: any) => {
        if (section === 'city' && id) navigateToCity(id, tab); 
        else if (section === 'auth') modalContext.openModal('auth');
        else if (section === 'rewards') {
            navigate(router.buildDashboardPath(userContext?.user?.slug, undefined, 'wallet'));
        }
        else if (section === 'profile') {
            const targetSlug = extra?.slug || userContext?.user?.slug;
            navigate(router.buildDashboardPath(targetSlug));
        }
        else if (section === 'itineraries') modalContext.openModal('itineraries');
        else if (section === 'community') modalContext.openModal('global', { section: 'community', tab, id });
        else if (section === 'sponsors') modalContext.openModal('global', { section: 'sponsors' });
        else if (section === 'around_me') modalContext.openModal('aroundMe'); 
        else if (section === 'suggestion') modalContext.openModal('suggestion', extra);
        else modalContext.openModal('global', { section });
    };

    const resolveCityIdFromSlug = useCallback((slug: string): string | null => {
        if (!slug) return null;
        // Lookup nel manifest: cerchiamo per slug o per ID (come fallback)
        const city = cityManifest.find(c => c.slug === slug || c.id === slug);
        return city?.id || null;
    }, [cityManifest]);

    // --- FASE 4: VOLATILITY & CLEANUP (SINGLE SOURCE OF TRUTH) ---
    const lastPathnameRef = useRef(router.pathname);

    // Ad ogni variazione REALE del pathname, eseguiamo la tabula rasa degli stati volatili
    useEffect(() => {
        if (router.pathname !== lastPathnameRef.current) {
            // --- WORKSPACE & ADMIN EXCLUSION GUARD ---
            // Se stiamo navigando all'interno del dominio admin o dashboard (workspace), 
            // non eseguiamo il cleanup distruttivo per preservare modali e stati interni.
            const isInternalAdminNav = 
                lastPathnameRef.current?.startsWith('/admin') && 
                router.pathname.startsWith('/admin');

            const isInternalDashboardNav = 
                router.isDashboardPathFn(lastPathnameRef.current || '') && 
                router.isDashboardPathFn(router.pathname);

            if (isInternalAdminNav || isInternalDashboardNav) {
                lastPathnameRef.current = router.pathname;
                return;
            }

            // Sincronizziamo il bootstrap mode del UserContext ad ogni cambio path (reattivo, no polling)
            syncMode(router.pathname);

            console.log(`[NavigationSync] Pathname changed to ${router.pathname}. Performing cleanup.`);
            
            // 1. Chiudiamo eventuali modali o overlay persistenti
            modalContext.closeModal();
            console.log(`[OverlayCleanup] Modals closed.`);

            // 2. Resettiamo la Virtual City (Around Me / Merged)
            setVirtualCity(null);
            console.log(`[OverlayCleanup] Virtual City destroyed.`);

            // 3. Resettiamo le preview aperte
            router.setActivePreview({ isOpen: false, title: '', cities: [], selectedId: null, categories: undefined });

            // 4. Riportiamo il tab della città allo stato iniziale 'vetrina'
            router.setCurrentCityTab('vetrina');

            lastPathnameRef.current = router.pathname;
        }
    }, [router.pathname, modalContext, router]);

    return (
        <NavigationContext.Provider value={{
            // Router State
            viewMode: router.viewMode,
            activeCityId: router.activeCityId,
            activeShopId: router.activeShopId,
            targetShopVat: router.targetShopVat,
            currentCityTab: router.currentCityTab,
            activeStaticPage: router.activeStaticPage,
            activePreview: router.activePreview,
            
            // Virtual City
            virtualCity,
            isBuildingVirtual,
            
            // Filters
            selectedZone,
            activeCategories,
            selectedSeason,
            
            // Actions
            navigateToCity,
            openShop: router.openShop,
            openShopFromPoi: router.openShopFromPoi,
            goBack,
            goHome,
            handleNavigateGlobal,
            handleAroundMeTrigger,
            resolveCityIdFromSlug,
            
            // Setters
            setViewMode: router.setViewMode,
            setCurrentCityTab: router.setCurrentCityTab,
            setActiveStaticPage: router.setActiveStaticPage,
            setActivePreview: router.setActivePreview,
            setSelectedZone,
            setActiveCategories,
            setSelectedSeason
        }}>
            {children}
        </NavigationContext.Provider>
    );
};


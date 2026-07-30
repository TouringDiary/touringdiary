import React, { createContext, useState, useEffect, useRef, useCallback, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppRouter } from '../hooks/useAppRouter';
import { useUser } from './UserContext';
import { useModal } from './ModalContext';
import { useAiPlanner } from './AiPlannerContext';
import { CityDetails, PointOfInterest } from '../types/index';
import { buildVirtualCity, getPoisByCityId } from '../services/cityService';
import { getShopByVat } from '../services/shopService';
import { GEO_CONFIG } from '../constants/geoConfig';
import { useGps } from './GpsContext';
import type { NavigationViewMode } from '../types/navigationViewMode';
import type { NavigationPreviewState } from '../types/navigationPreview';
import { CLOSED_NAVIGATION_PREVIEW } from '../types/navigationPreview';
import type { NavigationGlobalExtra } from '../types/navigationGlobal';
import { useOpenMyWorld } from '@/hooks/useOpenMyWorld';

/** Sessione Around Me: virtualMode o id sentinella (vista attiva o sospesa in ref). */
const isAroundMeCity = (city: CityDetails | null | undefined): city is CityDetails =>
    city?.virtualMode === 'around_me' || city?.id === 'around-me-virtual';

interface NavigationContextType {
    // Router State
    viewMode: NavigationViewMode;
    activeCityId: string | null;
    activeShopId: string | null;
    targetShopVat: string | null;
    currentCityTab: string;
    activeStaticPage: string | null;
    activePreview: NavigationPreviewState;
    
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
    handleNavigateGlobal: (section: string, tab?: string, id?: string, extra?: NavigationGlobalExtra) => void;
    handleAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
    handleMergeCities: (baseCity: CityDetails, radius: number, selectedCityIds: string[]) => void;
    resolveCityIdFromSlug: (slug: string) => string | null;
    
    // Setters
    setViewMode: (mode: NavigationViewMode) => void;
    setCurrentCityTab: (tab: string) => void;
    setActiveStaticPage: Dispatch<SetStateAction<string | null>>;
    setActivePreview: Dispatch<SetStateAction<NavigationPreviewState>>;
    setSelectedZone: (z: string) => void;
    setActiveCategories: (c: string[]) => void;
    setSelectedSeason: (s: string) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children?: ReactNode }) => {
    const navigate = useNavigate();
    const router = useAppRouter();
    const userContext = useUser();
    const { syncMode } = userContext;
    const modalContext = useModal();
    const aiPlannerContext = useAiPlanner();
    const cityManifest = userContext?.cityManifest ?? [];
    const isLoadingManifest = userContext?.isLoadingManifest ?? true;
    const gpsContext = useGps();
    const openMyWorld = useOpenMyWorld();

    // Virtual Mode State
    const [virtualCity, setVirtualCity] = useState<CityDetails | null>(null);
    const [isBuildingVirtual, setIsBuildingVirtual] = useState(false);
    /** Sessione Around Me sospesa durante drill-in città reale (niente rebuild al Back). */
    const aroundMeSessionRef = useRef<CityDetails | null>(null);
    
    // Global Filters State
    const [selectedZone, setSelectedZone] = useState('');
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const navigateToCity = useCallback((id: string, tab?: string) => {
        // Suspend Around Me in memory; do not destroy the computed territory.
        if (isAroundMeCity(virtualCity)) {
            aroundMeSessionRef.current = virtualCity;
        } else if (virtualCity) {
            // Merge / other virtual: clear (existing identity follows base city).
            aroundMeSessionRef.current = null;
        }
        setVirtualCity(null);
        router.navigateToCity(id, tab);
    }, [router, virtualCity]);

    const openShopFromPoi = useCallback((poi?: PointOfInterest) => {
        const aroundMe = isAroundMeCity(virtualCity)
            ? virtualCity
            : isAroundMeCity(aroundMeSessionRef.current)
              ? aroundMeSessionRef.current
              : null;

        if (!poi && aroundMe) {
            router.openShopForAroundMe();
            return;
        }
        router.openShopFromPoi(poi);
    }, [router, virtualCity]);

    // --- DEEP LINK LOGIC (Encapsulated) ---
    useEffect(() => {
        if (isLoadingManifest) return;
        if (!cityManifest || cityManifest.length === 0) return;

        if (router.deepLinkParams) {
            const { cityId, poiId, shopVat } = router.deepLinkParams;
            let cancelled = false;

            const processLink = async () => {
                let navigationSuccess = false;

                // A. Navigazione Città
                if (cityId) {
                    const cityExists = cityManifest.some(c => c.id === cityId);
                    if (cityExists) {
                        if (cancelled || !isMounted.current) return;
                        navigateToCity(cityId);
                        navigationSuccess = true;
                    }
                }

                // B. Navigazione Shop
                if (shopVat) {
                    try {
                        const shop = await getShopByVat(shopVat);
                        if (cancelled || !isMounted.current) return;
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
                        if (cancelled || !isMounted.current) return;
                        const targetPoi = cityPois.find(p => p.id === poiId);
                        if (targetPoi) {
                            modalContext.openModal('poiDetail', { poi: targetPoi });
                            navigationSuccess = true;
                        }
                    } catch (e) {
                        console.error("Deep link poi error", e);
                    }
                }

                if (cancelled || !isMounted.current) return;
                router.consumeDeepLink();
            };

            void processLink();
            return () => {
                cancelled = true;
            };
        }
    }, [isLoadingManifest, cityManifest, modalContext, router, navigateToCity]);

    // --- NAVIGATION ACTIONS ---

    const handleAroundMeTrigger = useCallback(async (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => {
        setIsBuildingVirtual(true);
        aroundMeSessionRef.current = null;
        setVirtualCity(null);
        // Sentinel history: Around Me vive su `/`, così Back da una città drill-in
        // ripristina esattamente questa sessione senza rebuild.
        if (router.pathname !== '/') {
            router.goHome();
        }

        let centerCoords = GEO_CONFIG.DEFAULT_CENTER; 
        
        if (config.type === 'gps' && gpsContext.userLocation) {
             centerCoords = gpsContext.userLocation;
        } else if (config.type === 'manual' && config.cityId) {
            const targetCity = cityManifest.find(c => c.id === config.cityId);
            if (targetCity) centerCoords = targetCity.coords;
        }

        try {
            const virtual = await buildVirtualCity(centerCoords, config.radius, cityManifest);
            if (isMounted.current) {
                aroundMeSessionRef.current = virtual;
                setVirtualCity(virtual);
            }
        } finally {
            if (isMounted.current) {
                setIsBuildingVirtual(false);
            }
        }
    }, [gpsContext.userLocation, cityManifest, router]);

    // Fusione "Tutto Incluso": riusa buildVirtualCity (logica di fusione invariata),
    // limitandola alla città base + alle sole città selezionate dall'utente.
    const handleMergeCities = useCallback(async (baseCity: CityDetails, radius: number, selectedCityIds: string[]) => {
        setIsBuildingVirtual(true);
        try {
            const virtual = await buildVirtualCity(baseCity.coords, radius, cityManifest, { baseCity, selectedCityIds });
            if (isMounted.current) {
                aroundMeSessionRef.current = null;
                setVirtualCity(virtual);
            }
        } finally {
            if (isMounted.current) {
                setIsBuildingVirtual(false);
            }
        }
    }, [cityManifest]);

    const goBack = useCallback(() => {
        // 1. Se c'è una modale aperta, la chiudiamo (comportamento standard UX)
        if (modalContext.activeModal) { 
            modalContext.closeModal(); 
            return; 
        }
        
        // 2. Altrimenti seguiamo la history naturale del browser (URL-driven)
        // Il cleanup di virtualCity e altri stati avverrà reattivamente tramite l'effetto su pathname
        router.goBack();
    }, [modalContext.activeModal, modalContext.closeModal, router]);

    const goHome = useCallback(() => {
        aroundMeSessionRef.current = null;
        router.goHome();
        modalContext.closeModal();
        setVirtualCity(null);
        aiPlannerContext.resetAiSession();
    }, [router, modalContext.closeModal, aiPlannerContext.resetAiSession]);

    // TODO(WF-03): handleNavigateGlobal is duplicated in useNavigationController — consolidate when that hook is retired or wired as thin delegate (no behavior change).
    const handleNavigateGlobal = useCallback((section: string, tab?: string, id?: string, extra?: NavigationGlobalExtra) => {
        if (section === 'city' && id) {
            navigateToCity(id, tab);
            return;
        }
        if (section === 'auth') {
            modalContext.openModal('auth');
            return;
        }
        if (section === 'rewards') {
            navigate(router.buildDashboardPath(userContext?.user?.slug, undefined, 'wallet'));
            return;
        }
        if (section === 'profile') {
            const targetSlug = extra?.slug || userContext?.user?.slug;
            navigate(router.buildDashboardPath(targetSlug));
            return;
        }
        // TODO(WF-03): section key 'workspace' is a public nav token that now opens MyWorld; rename only with a coordinated API/migration pass.
        if (section === 'workspace') {
            openMyWorld();
            return;
        }
        if (section === 'community') {
            modalContext.openModal('global', { section: 'community', tab, id });
            return;
        }
        if (section === 'sponsors') {
            modalContext.openModal('global', { section: 'sponsors' });
            return;
        }
        if (section === 'around_me') {
            modalContext.openModal('aroundMe');
            return;
        }
        if (section === 'suggestion') {
            modalContext.openModal('suggestion', extra);
            return;
        }
        modalContext.openModal('global', { section });
    }, [
        navigateToCity,
        modalContext,
        navigate,
        router,
        userContext?.user?.slug,
        openMyWorld,
    ]);

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
        let scrollFrame: number | undefined;

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
            } else {
                // Sincronizziamo il bootstrap mode del UserContext ad ogni cambio path (reattivo, no polling)
                syncMode(router.pathname);
                
                // 1. Chiudiamo eventuali modali o overlay persistenti
                modalContext.closeModal();

                // 2. Virtual city / Around Me session
                // Drill-in città reale: sospende la vista Around Me ma preserva la sessione in memoria.
                // Back verso path senza città: ripristina Around Me senza rebuild.
                if (router.activeCityId && aroundMeSessionRef.current) {
                    setVirtualCity(null);
                } else if (!router.activeCityId && aroundMeSessionRef.current) {
                    setVirtualCity(aroundMeSessionRef.current);
                } else {
                    setVirtualCity(null);
                    aroundMeSessionRef.current = null;
                }

                // 3. Resettiamo le preview aperte
                router.setActivePreview(CLOSED_NAVIGATION_PREVIEW);

                // 4. Riportiamo il tab della città allo stato iniziale 'vetrina'
                router.setCurrentCityTab('vetrina');

                // 5. Scroll in cima alla nuova pagina.
                //    Eseguito qui (effect legato al pathname committato da React Router) e
                //    dopo il paint via requestAnimationFrame: elimina la race del vecchio
                //    setTimeout(0) in navigateToCity, che poteva scrollare prima che il
                //    nuovo contenuto fosse renderizzato.
                scrollFrame = requestAnimationFrame(() => {
                    if (typeof window !== 'undefined') {
                        window.scrollTo(0, 0);
                    }
                });

                lastPathnameRef.current = router.pathname;
            }
        }

        return () => {
            if (scrollFrame !== undefined) {
                cancelAnimationFrame(scrollFrame);
            }
        };
    }, [modalContext, router, syncMode]);

    const value = useMemo<NavigationContextType>(() => ({
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
        openShopFromPoi,
        goBack,
        goHome,
        handleNavigateGlobal,
        handleAroundMeTrigger,
        handleMergeCities,
        resolveCityIdFromSlug,
        
        // Setters
        setViewMode: router.setViewMode,
        setCurrentCityTab: router.setCurrentCityTab,
        setActiveStaticPage: router.setActiveStaticPage,
        setActivePreview: router.setActivePreview,
        setSelectedZone,
        setActiveCategories,
        setSelectedSeason
    }), [
        router.viewMode,
        router.activeCityId,
        router.activeShopId,
        router.targetShopVat,
        router.currentCityTab,
        router.activeStaticPage,
        router.activePreview,
        router.openShop,
        openShopFromPoi,
        router.setViewMode,
        router.setCurrentCityTab,
        router.setActiveStaticPage,
        router.setActivePreview,
        virtualCity,
        isBuildingVirtual,
        selectedZone,
        activeCategories,
        selectedSeason,
        navigateToCity,
        goBack,
        goHome,
        handleNavigateGlobal,
        handleAroundMeTrigger,
        handleMergeCities,
        resolveCityIdFromSlug,
    ]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
};


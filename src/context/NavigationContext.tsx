
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAppRouter } from '../hooks/useAppRouter';
import { useModal } from './ModalContext';
import { useAiPlanner } from './AiPlannerContext';
import { useUser } from './UserContext';
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
    activeStaticPage: 'about' | 'contacts' | 'terms' | 'privacy';
    activePreview: any;
    
    // Virtual City State
    virtualCity: CityDetails | null;
    isBuildingVirtual: boolean;
    
    // Filters State
    selectedZone: string;
    activeCategories: string[];
    
    // Actions
    navigateToCity: (id: string, tab?: string) => void;
    openShop: () => void;
    openShopFromPoi: (poi?: PointOfInterest) => void;
    goBack: () => void;
    goHome: () => void;
    handleNavigateGlobal: (section: string, tab?: string, id?: string, extra?: any) => void;
    handleAroundMeTrigger: (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => void;
    
    // Setters
    setViewMode: (mode: 'app' | 'admin') => void;
    setCurrentCityTab: (tab: string) => void;
    setActiveStaticPage: (page: any) => void;
    setActivePreview: (preview: any) => void;
    setSelectedZone: (z: string) => void;
    setActiveCategories: (c: string[]) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children?: ReactNode }) => {
    const router = useAppRouter();
    const modalContext = useModal();
    const aiPlannerContext = useAiPlanner();
    const userContext = useUser();
    const gpsContext = useGps();

    // Virtual Mode State
    const [virtualCity, setVirtualCity] = useState<CityDetails | null>(null);
    const [isBuildingVirtual, setIsBuildingVirtual] = useState(false);
    
    // Global Filters State
    const [selectedZone, setSelectedZone] = useState('');
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- DEEP LINK LOGIC (Encapsulated) ---
    useEffect(() => {
        if (userContext.isLoadingManifest) return;
        if (!userContext.cityManifest || userContext.cityManifest.length === 0) return;

        if (router.deepLinkParams) {
            const { cityId, poiId, shopVat } = router.deepLinkParams;

            const processLink = async () => {
                let navigationSuccess = false;

                // A. Navigazione Città
                if (cityId) {
                    const cityExists = userContext.cityManifest.some(c => c.id === cityId);
                    if (cityExists) {
                        router.navigateToCity(cityId);
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
                                router.navigateToCity(shop.cityId);
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
    }, [userContext.isLoadingManifest, router.deepLinkParams, userContext.cityManifest, modalContext]);

    // --- NAVIGATION ACTIONS ---

    const handleAroundMeTrigger = async (config: { type: 'gps' | 'manual', cityId?: string, radius: number }) => {
        setIsBuildingVirtual(true);
        let centerCoords = GEO_CONFIG.DEFAULT_CENTER; 
        
        if (config.type === 'gps' && gpsContext.userLocation) {
             centerCoords = gpsContext.userLocation;
        } else if (config.type === 'manual' && config.cityId) {
            const targetCity = userContext.cityManifest.find(c => c.id === config.cityId);
            if (targetCity) centerCoords = targetCity.coords;
        }

        const virtual = await buildVirtualCity(centerCoords, config.radius, userContext.cityManifest.filter(c => c.status === 'published'));
        
        if (isMounted.current) {
            setVirtualCity(virtual);
            setIsBuildingVirtual(false);
        }
    };

    const goBack = () => {
        if (modalContext.activeModal) { modalContext.closeModal(); return; }
        if (virtualCity) { 
            setVirtualCity(null); 
            if (virtualCity.id === 'around-me-virtual') router.goHome(); 
            return; 
        } 
        router.goBack();
    };

    const goHome = () => {
        router.goHome();
        modalContext.closeModal();
        setVirtualCity(null);
        aiPlannerContext.resetAiSession();
    };

    const handleNavigateGlobal = (section: string, tab?: string, id?: string, extra?: any) => {
        if (section === 'city' && id) router.navigateToCity(id, tab); 
        else if (section === 'auth') modalContext.openModal('auth');
        else if (section === 'rewards') modalContext.openModal('userDashboard', { tab: 'wallet' });
        else if (section === 'profile') modalContext.openModal('userDashboard', { tab: tab || 'overview' });
        else if (section === 'itineraries') modalContext.openModal('itineraries');
        else if (section === 'community') modalContext.openModal('global', { section: 'community', tab, id });
        else if (section === 'sponsors') modalContext.openModal('global', { section: 'sponsors' });
        else if (section === 'around_me') modalContext.openModal('aroundMe'); 
        else if (section === 'suggestion') modalContext.openModal('suggestion', extra);
        else modalContext.openModal('global', { section });
    };

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
            
            // Actions
            navigateToCity: router.navigateToCity,
            openShop: router.openShop,
            openShopFromPoi: router.openShopFromPoi,
            goBack,
            goHome,
            handleNavigateGlobal,
            handleAroundMeTrigger,
            
            // Setters
            setViewMode: router.setViewMode,
            setCurrentCityTab: router.setCurrentCityTab,
            setActiveStaticPage: router.setActiveStaticPage,
            setActivePreview: router.setActivePreview,
            setSelectedZone,
            setActiveCategories
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error("useNavigation must be used within NavigationProvider");
    return context;
};


import { useState, useEffect, useCallback } from 'react';
import { PointOfInterest, SuggestionType } from '../types/index';

interface HistorySnapshot {
    view: 'city' | 'home';
    cityId: string | null;
    scrollY: number;
    activePreview: any;
    activeTab: string;
}

export const useAppRouter = () => {
    // --- CORE ROUTING STATE ---
    const [viewMode, setViewMode] = useState<'app' | 'admin'>('app');
    const [activeCityId, setActiveCityId] = useState<string | null>(null);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [targetShopVat, setTargetShopVat] = useState<string | null>(null);
    
    // --- TAB STATE ---
    const [activeStaticPage, setActiveStaticPage] = useState<'about' | 'contacts' | 'terms' | 'privacy'>('about');
    const [currentCityTab, setCurrentCityTab] = useState<string>('vetrina');
    const [activePreview, setActivePreview] = useState<any>({ isOpen: false, title: '', cities: [], selectedId: null, categories: undefined });

    // --- HISTORY STACK ---
    const [historyStack, setHistoryStack] = useState<HistorySnapshot[]>([]);

    // --- DEEP LINK STATE ---
    const [deepLinkParams, setDeepLinkParams] = useState<{ cityId?: string, poiId?: string, shopVat?: string } | null>(null);

    // --- INITIALIZATION: PARSE URL ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const city = params.get('city');
            const poi = params.get('poi');
            const shop = params.get('shop');

            // Se ci sono parametri rilevanti, li salviamo nello stato per il Coordinator
            if (city || poi || shop) {
                setDeepLinkParams({
                    cityId: city || undefined,
                    poiId: poi || undefined,
                    shopVat: shop || undefined
                });
            }
        }
    }, []);

    // --- ACTIONS ---

    const navigateToCity = (targetCityId: string, targetTab: string = 'vetrina') => {
        setHistoryStack(prev => [...prev, { 
            view: activeCityId ? 'city' : 'home', 
            cityId: activeCityId, 
            scrollY: window.scrollY, 
            activePreview,
            activeTab: currentCityTab 
        }]);
        
        setActiveCityId(targetCityId); 
        setActiveShopId(null); 
        setActivePreview((prev: any) => ({ ...prev, isOpen: false })); 
        setCurrentCityTab(targetTab); 
        setTimeout(() => window.scrollTo(0, 0), 0);
    };

    const openShop = () => {
        if (activeCityId) {
            setActiveShopId(activeCityId);
        }
    };

    const openShopFromPoi = (poi?: PointOfInterest) => {
        // CASO 1: Apertura Generica (es. click su icona Shopping header)
        if (!poi) {
            if (activeCityId) {
                setActiveShopId(activeCityId);
                setTargetShopVat(null); // Nessuno shop specifico targettizzato
            }
            return;
        }

        // CASO 2: Apertura Specifica (es. click su POI Bottega o Deep Link)
        if (!poi.vatNumber) return; 
        
        // Ensure context city is set (fallback to napoli if global)
        const contextCity = activeCityId || poi.cityId || 'napoli';
        if (!activeCityId) setActiveCityId(contextCity); 
        
        setActiveShopId(contextCity);
        setTargetShopVat(poi.vatNumber);
    };

    const goBack = () => {
        if (activeShopId) { 
            setActiveShopId(null); 
            setTargetShopVat(null); 
            return; 
        } 
        if (historyStack.length === 0) { 
            setActiveCityId(null); 
            return; 
        }
        
        const snapshot = historyStack[historyStack.length - 1];
        setHistoryStack(prev => prev.slice(0, -1));
        
        setActiveCityId(snapshot.cityId); 
        setActivePreview(snapshot.activePreview); 
        setCurrentCityTab(snapshot.activeTab || 'vetrina');
        
        setTimeout(() => window.scrollTo(0, snapshot.scrollY), 50);
    };

    const goHome = () => {
        setActiveCityId(null); 
        setActiveShopId(null); 
        setHistoryStack([]); 
        setViewMode('app'); 
        
        // Pulizia URL visuale (SAFE VERSION)
        // Avvolta in try-catch per prevenire SecurityError su blob/iframe
        if (typeof window !== 'undefined') {
            try {
                // Check per evitare esecuzione in contesti non supportati (es. preview blob)
                if (window.location.protocol === 'blob:' || window.location.protocol === 'about:') {
                    return;
                }

                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            } catch (e) {
                // Ignora silenziosamente errori di sicurezza su history API in ambienti sandbox
                // console.warn("History replaceState blocked (sandbox environment). Ignored.");
            }
        }

        window.scrollTo(0,0);
    };

    const consumeDeepLink = useCallback(() => {
        setDeepLinkParams(null);
    }, []);

    return {
        // State
        viewMode, activeCityId, activeShopId, targetShopVat,
        activeStaticPage, 
        currentCityTab, activePreview, historyStack,
        deepLinkParams, // EXPORTED
        
        // Setters (exposed for granular control when needed)
        setViewMode, setActivePreview, setCurrentCityTab,
        setActiveStaticPage,
        
        // Actions
        navigateToCity, openShop, openShopFromPoi, goBack, goHome,
        consumeDeepLink // EXPORTED
    };
};

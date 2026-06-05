import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { PointOfInterest } from '../types/index';
import type { NavigationViewMode } from '@/types/navigationViewMode';
import type { NavigationPreviewState } from '@/types/navigationPreview';
import { CLOSED_NAVIGATION_PREVIEW } from '@/types/navigationPreview';

// --- DASHBOARD ROUTING CONFIGURATION ---
export const USER_DASHBOARD_TABS = {
    overview_user: 'profilo',
    trips: 'viaggi',
    suitcases: 'valigie',
    notifications: 'notifiche',
    wallet: 'wallet',
    referral: 'amico',
    settings: 'impostazioni'
} as const;

export const BIZ_DASHBOARD_TABS = {
    overview_biz: 'business-stats',
    bottega: 'bottega',
    messages: 'supporto-partner'
} as const;

export type UserDashboardTab = keyof typeof USER_DASHBOARD_TABS;
export type BizDashboardTab = keyof typeof BIZ_DASHBOARD_TABS;
export type DashboardTab = UserDashboardTab | BizDashboardTab;

export function isUserDashboardTab(tab: string): tab is UserDashboardTab {
    return tab in USER_DASHBOARD_TABS;
}

export function isBizDashboardTab(tab: string): tab is BizDashboardTab {
    return tab in BIZ_DASHBOARD_TABS;
}

function buildUrlToInternalTab(): Record<string, DashboardTab> {
    const map: Record<string, DashboardTab> = {
        'porta-un-amico': 'referral',
    };

    for (const tab of Object.keys(USER_DASHBOARD_TABS) as UserDashboardTab[]) {
        map[USER_DASHBOARD_TABS[tab]] = tab;
    }

    for (const tab of Object.keys(BIZ_DASHBOARD_TABS) as BizDashboardTab[]) {
        map[BIZ_DASHBOARD_TABS[tab]] = tab;
    }

    return map;
}

// Reverse Mappings for Parser
export const URL_TO_INTERNAL_TAB: Record<string, DashboardTab> = buildUrlToInternalTab();

export const useAppRouter = () => {
    const { user, cityManifest } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    // --- UTILITIES ---
    const isDashboardPath = useCallback((path: string) => {
        const segments = path.split('/').filter(Boolean);
        
        // Deve avere almeno 2 segmenti e il secondo deve essere ESATTAMENTE 'dashboard'
        // Esempi validi: /paolo/dashboard, /partner/dashboard/123
        if (segments.length < 2 || segments[1] !== 'dashboard') return false;
        
        // Esclusione rigorosa dei namespace di sistema per evitare falsi positivi
        const systemNamespaces = ['admin', 'api', 'discover'];
        if (systemNamespaces.includes(segments[0])) return false;
        
        return true;
    }, []);

    const isCheckoutSuccessPath = useCallback((path: string) => {
        return path === '/checkout-success';
    }, []);

    // --- CORE ROUTING STATE (DERIVED FROM PATHNAME) ---
    // Estraiamo lo slug direttamente dal pathname per essere indipendenti dal nesting del router
    const citySlug = useMemo(() => {
        // HARDENING: Se siamo in dashboard o in checkout success, non cerchiamo slug di città.
        // Questo evita collisioni tra businessSlug e citySlug.
        if (isDashboardPath(location.pathname) || isCheckoutSuccessPath(location.pathname)) return null;

        const segments = location.pathname.split('/').filter(Boolean);
        if (segments.length === 0) return null;
        
        // Lo slug della città è l'ultimo segmento (es: /europa/italia/napoli -> napoli)
        const lastSegment = segments[segments.length - 1];
        
        // Esclusione rotte protette/statiche
        const reservedSegments = ['admin', 'partner', 'dashboard', 'chi-siamo', 'contatti', 'privacy', 'termini', 'support', 'about', 'contacts'];
        if (reservedSegments.includes(lastSegment)) return null;

        return lastSegment;
    }, [location.pathname, isDashboardPath]);

    const activeCityId = useMemo(() => {
        if (!citySlug) {
            console.log(`[NavigationSync] No city slug found. State: HOME`);
            return null;
        }
        // Lookup atomico slug -> id
        const target = cityManifest.find(c => c.slug === citySlug || c.id === citySlug);
        console.log(`[NavigationSync] Slug: ${citySlug} -> activeCityId: ${target?.id || 'NOT_FOUND'}`);
        return target?.id || null;
    }, [citySlug, cityManifest]);

    // --- CORE VIEW MODE (DERIVED FROM URL) ---
    const viewMode = useMemo<NavigationViewMode>(() =>
        location.pathname.startsWith('/admin') ? 'admin' : 'app'
    , [location.pathname]);

    // --- REMAINING UI STATE ---
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [targetShopVat, setTargetShopVat] = useState<string | null>(null);
    const [activeStaticPage, setActiveStaticPage] = useState<string | null>(null);
    const [currentCityTab, setCurrentCityTab] = useState<string>('vetrina');
    const [activePreview, setActivePreview] = useState<NavigationPreviewState>(CLOSED_NAVIGATION_PREVIEW);

    // --- DEEP LINK STATE ---
    const [deepLinkParams, setDeepLinkParams] = useState<{ cityId?: string, poiId?: string, shopVat?: string } | null>(null);

    // --- INITIALIZATION: PARSE URL (LEGACY SUPPORT) ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const city = params.get('city');
            const poi = params.get('poi');
            const shop = params.get('shop');

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
        console.log(`[NavigationSync] Navigating to city: ${targetCityId}`);
        const targetCity = cityManifest.find((c) => c.id === targetCityId);
        if (!targetCity) return;

        const continent = targetCity.continent_slug ?? 'europa';
        const nation = targetCity.nation_slug ?? 'italia';
        const region = targetCity.region_slug;
        const zone = targetCity.zone_slug;
        const citySlugForPath = targetCity.slug || targetCity.id;

        const segments = [continent, nation, region, zone, citySlugForPath].filter(
            (segment): segment is string => Boolean(segment)
        );
        const newPath = `/${segments.join('/')}`;

        setActiveShopId(null); 
        setActivePreview((prev) => ({ ...prev, isOpen: false })); 
        setCurrentCityTab(targetTab); 
        
        console.log(`[OverlayCleanup] Resetting UI state for new city: ${targetCityId}`);
        navigate(newPath);
        setTimeout(() => window.scrollTo(0, 0), 0);
    };

    const openShop = () => {
        if (activeCityId) {
            setActiveShopId(activeCityId);
        }
    };

    const openShopFromPoi = (poi?: PointOfInterest) => {
        if (!poi) {
            if (activeCityId) {
                setActiveShopId(activeCityId);
                setTargetShopVat(null);
            }
            return;
        }

        if (!poi.vatNumber) return; 
        
        const contextCity = activeCityId || poi.cityId || 'napoli';
        // Se non siamo in una città, navighiamo prima alla città dello shop
        if (!activeCityId) {
            navigateToCity(contextCity);
        }
        
        setActiveShopId(contextCity);
        setTargetShopVat(poi.vatNumber);
    };

    const goBack = () => {
        if (activeShopId) { 
            setActiveShopId(null); 
            setTargetShopVat(null); 
            return; 
        } 
        
        // Utilizzo della history nativa del browser
        navigate(-1);
    };

    const goHome = () => {
        setActiveShopId(null); 
        navigate('/');
        window.scrollTo(0, 0);
    };

    const setViewModeAction = (mode: NavigationViewMode) => {
        if (mode === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const consumeDeepLink = useCallback(() => {
        setDeepLinkParams(null);
    }, []);

    const buildDashboardPath = useCallback((ownerSlug?: string, businessIdOrSlug?: string, tab?: string) => {
        const owner = ownerSlug || user?.slug || 'partner';
        const baseUrl = `/${owner}/dashboard`;
        
        // 1. Root Fallback
        if (!tab) return `${baseUrl}/profilo`;

        if (isUserDashboardTab(tab)) {
            return `${baseUrl}/${USER_DASHBOARD_TABS[tab]}`;
        }

        if (isBizDashboardTab(tab)) {
            let path = `${baseUrl}/${BIZ_DASHBOARD_TABS[tab]}`;
            if (businessIdOrSlug) {
                path += `/${businessIdOrSlug}`;
            }
            return path;
        }

        // Legacy/Unknown Fallback
        return `${baseUrl}/${tab}${businessIdOrSlug ? `/${businessIdOrSlug}` : ''}`;
    }, [user?.slug]);

    return {
        // State
        pathname: location.pathname,
        isDashboardPath: isDashboardPath(location.pathname),
        isCheckoutSuccessPath: isCheckoutSuccessPath(location.pathname),
        viewMode, activeCityId, activeShopId, targetShopVat,
        activeStaticPage, 
        currentCityTab, activePreview,
        deepLinkParams, 
        
        // Setters
        setViewMode: setViewModeAction, setActivePreview, setCurrentCityTab,
        setActiveStaticPage,
        
        // Actions
        navigateToCity, openShop, openShopFromPoi, goBack, goHome,
        consumeDeepLink,
        buildDashboardPath,
        isDashboardPathFn: isDashboardPath
    };
};

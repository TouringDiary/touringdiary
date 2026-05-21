
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { getSponsorsByOwner } from '../services/sponsors/sponsorContractsService';
import { ResolvedSponsor } from '../types/models/Sponsor';
import { useAppRouter, BIZ_DASHBOARD_TABS, URL_TO_INTERNAL_TAB } from '../hooks/useAppRouter';

/**
 * BusinessContext - FOUNDATION FASE 3
 * Responsabile del coordinamento dell'identità business attiva nel runtime.
 * Guida l'isolamento dei dati e la sicurezza multi-business.
 */

interface BusinessContextType {
    activeBusinessId: string | null;
    activeBusiness: ResolvedSponsor | null;
    userBusinesses: ResolvedSponsor[];
    isLoading: boolean;
    isOwner: boolean;
    switchBusiness: (businessId: string, options?: { replace?: boolean }) => void;
    refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const { buildDashboardPath } = useAppRouter();

    // -- STATE --
    const [userBusinesses, setUserBusinesses] = useState<ResolvedSponsor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // activeBusinessId rimosso dallo stato, ora derivato dall'URL

    // -- 1. CARICAMENTO LISTA BUSINESS (OWNERSHIP BASE) --
    const fetchBusinesses = async () => {
        if (!user?.id || user.role !== 'business') {
            setUserBusinesses([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const businesses = await getSponsorsByOwner(user.id);
            setUserBusinesses(businesses || []);
        } catch (error) {
            console.error('[BusinessContext] Failed to fetch user businesses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, [user?.id, user?.role]);

    // -- 2. IDENTIFIER EXTRACTION (URL-DRIVEN & AGNOSTIC) --
    const rawIdentifier = useMemo(() => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        const dashboardIdx = pathParts.indexOf('dashboard');
        if (dashboardIdx === -1) return null;

        const firstSegmentAfterDashboard = pathParts[dashboardIdx + 1];
        if (!firstSegmentAfterDashboard) return null;

        // Se il primo segmento è un tab business, l'identifier è il secondo
        const isBizTab = Object.values(BIZ_DASHBOARD_TABS).includes(firstSegmentAfterDashboard as any);
        if (isBizTab) {
            return pathParts[dashboardIdx + 2] || null;
        }

        // Se è un tab user, non c'è identifier
        const isUserTab = Object.values(URL_TO_INTERNAL_TAB).includes(URL_TO_INTERNAL_TAB[firstSegmentAfterDashboard]);
        if (isUserTab) return null;

        // Fallback Legacy: /dashboard/:id/:tab
        // In questo caso il primo segmento è l'ID se non è un tab conosciuto
        return firstSegmentAfterDashboard;
    }, [location.pathname]);

    // -- 3. RESOLUTION & IDENTITY MAPPING (DUAL-KEY) --
    // Cerchiamo il business corrispondente nel pool dell'owner
    const activeBusiness = useMemo(() => {
        if (!rawIdentifier || userBusinesses.length === 0) return null;

        // TENTATIVO 1: Risoluzione tramite UUID (Legacy / Direct)
        let found = userBusinesses.find(b => b.id === rawIdentifier);

        // TENTATIVO 2: Risoluzione tramite Slug (V4)
        if (!found) {
            found = userBusinesses.find(b => b.slug === rawIdentifier);
        }

        if (found) {
            console.log(`[V4-Resolver] Identifier "${rawIdentifier}" resolved to: ${found.companyName} (${found.id})`);
        } else if (rawIdentifier && userBusinesses.length > 0) {
            console.warn(`[V4-Resolver] Identifier "${rawIdentifier}" could not be resolved in user business pool.`);
        }
        
        return found || null;
    }, [rawIdentifier, userBusinesses]);

    // ESPONIAMO SEMPRE L'UUID REALE (Per garantire coerenza con Supabase/ReactQuery)
    const activeBusinessId = useMemo(() => activeBusiness?.id || null, [activeBusiness]);

    const isOwner = useMemo(() => !!activeBusiness, [activeBusiness]);

    // -- 4. CANONICAL URL NORMALIZATION & AUTO-SELECT --
    useEffect(() => {
        if (isLoading || !user || user.role !== 'business') return;

        const pathParts = location.pathname.split('/').filter(Boolean);
        const dashboardIdx = pathParts.indexOf('dashboard');
        if (dashboardIdx === -1) return;

        const ownerSlug = user.slug || 'partner';
        const currentOwner = pathParts[dashboardIdx - 1];
        const firstSegment = pathParts[dashboardIdx + 1];
        const secondSegment = pathParts[dashboardIdx + 2];

        // 1. ROOT REDIRECT: /dashboard -> /dashboard/profilo
        if (!firstSegment) {
            console.log("[V4-Normalizer] Root detected. Redirecting to /profilo");
            navigate(buildDashboardPath(ownerSlug, undefined, 'overview_user'), { replace: true });
            return;
        }

        // 2. IDENTIFY CURRENT TAB
        // Potrebbe essere in prima o seconda posizione a seconda se l'URL è legacy o nuovo
        let currentTabInternal: string | undefined = URL_TO_INTERNAL_TAB[firstSegment];
        let urlIsLegacy = false;

        if (!currentTabInternal && secondSegment) {
            // Tentativo legacy: /dashboard/:id/:tab
            currentTabInternal = URL_TO_INTERNAL_TAB[secondSegment];
            if (currentTabInternal) urlIsLegacy = true;
        }

        // Se non abbiamo identificato il tab, usiamo 'overview_user' come default per la normalizzazione
        const effectiveTab = currentTabInternal || 'overview_user';
        const isBizTab = !!BIZ_DASHBOARD_TABS[effectiveTab as keyof typeof BIZ_DASHBOARD_TABS];

        // 3. BUSINESS AUTO-SELECTION (Area Business senza slug)
        if (isBizTab && !rawIdentifier && userBusinesses.length > 0) {
            const bestId = userBusinesses[0].slug || userBusinesses[0].id;
            console.log(`[V4-AutoSelect] Biz tab "${firstSegment}" detected without business slug. Injecting primary: ${bestId}`);
            navigate(buildDashboardPath(ownerSlug, bestId, effectiveTab), { replace: true });
            return;
        }

        // 4. CANONICAL NORMALIZATION (UUID -> Slug / Owner Fix / Format Swap)
        if (activeBusiness || !isBizTab) {
            const targetBusinessSlug = activeBusiness?.slug || activeBusiness?.id;
            const canonicalPath = buildDashboardPath(ownerSlug, targetBusinessSlug, effectiveTab);
            
            // Verifichiamo se l'URL attuale differisce dal canonico
            // Ignoriamo slash finali e query params per il confronto
            const currentPathClean = location.pathname.replace(/\/$/, '');
            const canonicalPathClean = canonicalPath.replace(/\/$/, '');

            if (currentPathClean !== canonicalPathClean) {
                console.log(`[V4-Normalization] Non-canonical path detected.`);
                console.log(`Current: ${currentPathClean}`);
                console.log(`Canonical: ${canonicalPathClean}`);
                navigate(canonicalPath, { replace: true });
            }
        }
    }, [isLoading, activeBusinessId, activeBusiness, userBusinesses, location.pathname, user, navigate, buildDashboardPath, rawIdentifier]);

    // -- 5. ACTIONS --
    const switchBusiness = (target: string, options?: { replace?: boolean }) => {
        // Determiniamo il tab attuale per preservarlo
        const pathParts = location.pathname.split('/').filter(Boolean);
        const dashboardIdx = pathParts.indexOf('dashboard');
        let currentTab: string | undefined = undefined;

        if (dashboardIdx !== -1) {
            const first = pathParts[dashboardIdx + 1];
            const second = pathParts[dashboardIdx + 2];
            
            // Cerchiamo il tab in prima o seconda posizione
            const internalFirst = URL_TO_INTERNAL_TAB[first];
            const internalSecond = URL_TO_INTERNAL_TAB[second];
            
            currentTab = internalFirst || internalSecond;
        }

        // Costruiamo il path canonico tramite il router
        const finalPath = buildDashboardPath(user?.slug, target, currentTab);
        
        navigate(finalPath, { replace: options?.replace });
    };

    const value = useMemo(() => ({
        activeBusinessId,
        activeBusiness,
        userBusinesses,
        isLoading,
        isOwner,
        switchBusiness,
        refreshBusinesses: fetchBusinesses
    }), [
        activeBusinessId, 
        activeBusiness, 
        userBusinesses, 
        isLoading, 
        isOwner, 
        switchBusiness, 
        fetchBusinesses
    ]);

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusinessContext = () => {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusinessContext must be used within a BusinessProvider');
    }
    return context;
};


import { useState, useEffect, useRef } from 'react';
import { useAppRouter } from '../useAppRouter';
import { useModal } from '@/context/ModalContext';
import { useAiPlanner } from '@/context/AiPlannerContext';
import { CityDetails, CitySummary } from '../../types/index';
import { buildVirtualCity } from '../../services/cityService';
import { GEO_CONFIG } from '../../constants/geoConfig';

export const useNavigationController = (cityManifest: CitySummary[]) => {
    const router = useAppRouter();
    const { openModal, closeModal, activeModal } = useModal();
    const { resetAiSession } = useAiPlanner();

    // Virtual Mode State (Around Me / Merged)
    const [virtualCity, setVirtualCity] = useState<CityDetails | null>(null);
    const [isBuildingVirtual, setIsBuildingVirtual] = useState(false);
    
    // Mount Ref per sicurezza async
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);
    
    // Listener per Reset Globale
    useEffect(() => {
        const handleReset = () => { if(isMounted.current) setVirtualCity(null); };
        window.addEventListener('reset-virtual-city', handleReset);
        return () => window.removeEventListener('reset-virtual-city', handleReset);
    }, []);

    // Listener per creazione Virtual City (Around Me)
    const handleAroundMeTrigger = async (config: { type: 'gps' | 'manual', cityId?: string, radius: number }, userLoc: { lat: number; lng: number } | null) => {
        setIsBuildingVirtual(true);
        let centerCoords = GEO_CONFIG.DEFAULT_CENTER; 
        
        if (config.type === 'gps' && userLoc) {
             centerCoords = userLoc;
        } else if (config.type === 'manual' && config.cityId) {
            const targetCity = cityManifest.find(c => c.id === config.cityId);
            if (targetCity) centerCoords = targetCity.coords;
        }

        const virtual = await buildVirtualCity(centerCoords, config.radius, cityManifest.filter(c => c.status === 'published'));
        
        if (isMounted.current) {
            setVirtualCity(virtual);
            setIsBuildingVirtual(false);
        }
    };

    // Global Back Handler
    const handleGlobalBack = () => {
        // PRIORITY 1: Close active modal if any
        if (activeModal) { 
            closeModal(); 
            return; 
        }

        // PRIORITY 2: Exit Virtual City if active (Around Me)
        if (virtualCity) { 
            setVirtualCity(null); 
            // If we were in "Around Me", reset to home completely
            if (virtualCity.id === 'around-me-virtual') {
                 router.goHome(); 
            }
            return; 
        } 
        
        // PRIORITY 3: Standard Router Back
        router.goBack();
    };
    
    // Global Home Handler
    const handleGoHome = () => {
        router.goHome();
        closeModal();
        setVirtualCity(null);
        resetAiSession();
    };

    // Global Navigation Handler
    const handleNavigateGlobal = (section: string, tab?: string, id?: string, extra?: any) => {
        if (section === 'city' && id) router.navigateToCity(id, tab); 
        else if (section === 'auth') openModal('auth');
        else if (section === 'rewards') openModal('userDashboard', { tab: 'wallet' });
        else if (section === 'profile') openModal('userDashboard', { tab: tab || 'overview' });
        else if (section === 'itineraries') openModal('itineraries');
        else if (section === 'community') openModal('global', { section: 'community', tab, id });
        else if (section === 'sponsors') openModal('global', { section: 'sponsors' });
        else if (section === 'around_me') openModal('aroundMe'); 
        else if (section === 'suggestion') openModal('suggestion', extra);
        else openModal('global', { section });
    };

    return {
        router,
        virtualCity,
        isBuildingVirtual,
        handleAroundMeTrigger,
        handleGlobalBack,
        handleGoHome,
        handleNavigateGlobal,
        // Espone setter safe
        setVirtualCity
    };
};

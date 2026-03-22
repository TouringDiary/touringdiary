
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { getFullManifestAsync } from '../../services/cityService';
import { refreshUsersCache, getUserById } from '../../services/userService';
import { getGuestUser } from '../../utils/userUtils';
import { loadGlobalCache, getSetting } from '../../services/settingsService';
import { getCurrentLevel, fetchLevelsAsync } from '../../services/gamificationService'; // UPDATED
import { usePersistedState } from '../usePersistedState';
import type { CitySummary, User } from '../../types/index';

export const useAppInitialization = (viewMode: string) => {
    // State
    const [user, setUser] = useState<User>(() => getGuestUser());
    const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);
    const [isLoadingManifest, setIsLoadingManifest] = useState(true);
    const [connectionError, setConnectionError] = useState(false);
    
    // Gamification State
    const [showLevelUp, setShowLevelUp] = useState(false);
    const prevLevelRef = useRef(1); // Default to level 1 safely
    const prevUserIdRef = useRef(user.id);

    // Onboarding Persistence
    const [hasSeenOnboarding, setHasSeenOnboarding] = usePersistedState<boolean>('has_seen_onboarding_v3', false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // 1. Global Setup & Connection Check & Auth Restoration
    useEffect(() => {
        // Caricamenti base
        loadGlobalCache();
        
        const initUserSession = async () => {
            // Prima carichiamo la cache utenti per poter mappare l'ID di sessione
            const allUsers = await refreshUsersCache();
            
            // Poi controlliamo se c'è una sessione attiva persistita
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const currentUser = allUsers.find(u => u.id === session.user.id);
                // --- FIX: setUser viene chiamato solo se l'utente è cambiato ---
                if (currentUser && currentUser.id !== user.id) {
                    console.log("[AppInit] Sessione ripristinata per:", currentUser.name);
                    setUser(currentUser);
                }
            }
        };

        initUserSession();

        fetchLevelsAsync().then(() => {
             // Dopo aver caricato i livelli, aggiorniamo il ref del livello corrente per evitare falsi positivi al primo render
             prevLevelRef.current = getCurrentLevel(user.xp || 0).level;
        });

        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('global_settings').select('key').limit(1);
                if (error && (error.message.includes('fetch') || error.message.includes('network'))) {
                    setConnectionError(true);
                } else {
                    setConnectionError(false);
                }
            } catch (e) {
                setConnectionError(true);
            }
        };
        checkConnection();
    }, []);

    // 2. Manifest Loading
    useEffect(() => { 
        if (viewMode === 'app') {
            setIsLoadingManifest(true);
            getFullManifestAsync().then(data => {
                setCityManifest(data);
                setIsLoadingManifest(false);
            });
        }
    }, [viewMode]);

    // 4. Level Up Detection
    useEffect(() => {
        const currentLvl = getCurrentLevel(user.xp || 0).level;
        
        // Se cambia utente, resetta il ref ma non mostrare level up
        if (user.id !== prevUserIdRef.current) {
            prevLevelRef.current = currentLvl;
            prevUserIdRef.current = user.id;
            return;
        }

        // Se stesso utente sale di livello
        if (currentLvl > prevLevelRef.current) {
            setShowLevelUp(true);
        }
        prevLevelRef.current = currentLvl;
    }, [user.xp, user.id]);

    // 5. Onboarding Trigger
    useEffect(() => {
        const checkAutoStart = async () => {
            if (!hasSeenOnboarding && viewMode === 'app') {
                try {
                    const config = await getSetting<{autoStart: boolean}>('onboarding_config');
                    if (config && config.autoStart === false) {
                        return; 
                    }
                    const timer = setTimeout(() => setShowOnboarding(true), 800);
                    return () => clearTimeout(timer);
                } catch (e) {
                    const timer = setTimeout(() => setShowOnboarding(true), 800);
                    return () => clearTimeout(timer);
                }
            }
        };
        
        checkAutoStart();

        const handleManualRestart = () => {
            setShowOnboarding(true);
        };

        window.addEventListener('restart-onboarding', handleManualRestart);
        return () => window.removeEventListener('restart-onboarding', handleManualRestart);
    }, [hasSeenOnboarding, viewMode]);

    const completeOnboarding = () => {
        setShowOnboarding(false);
        setHasSeenOnboarding(true);
    };

    const closeLevelUp = () => setShowLevelUp(false);

    return {
        user, setUser,
        cityManifest,
        isLoadingManifest,
        connectionError,
        showLevelUp, closeLevelUp,
        showOnboarding, setShowOnboarding, completeOnboarding
    };
};

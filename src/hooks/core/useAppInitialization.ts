
import { useState, useEffect, useRef } from 'react';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, validateSession, isAuthOperationInProgress } from '../../services/supabaseClient';

import { getFullManifestAsync } from '../../services/cityService';
import { refreshUsersCache, getUserById, getCurrentUserProfile } from '../../services/userService';
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
    
    // Recovery Guard: previene loop infiniti in caso di sessione corrotta
    const sessionRecoveryAttemptedRef = useRef(false);


    // 1. Global Setup & Connection Check & Auth Restoration
    useEffect(() => {
        const syncUserState = async (session: any) => {
            if (session?.user) {
                try {
                    console.log("[AppInit] Sincronizzazione utente con token...");
                    // Tentiamo il recupero tramite proxy (bypass RLS) passando il token direttamente
                    const currentUser = await getCurrentUserProfile(session.access_token);
                    
                    if (currentUser) {
                        console.log("[AppInit] Utente sincronizzato via Proxy:", currentUser.name);
                        setUser(currentUser);
                    } else {
                        // Fallback: tenta dalla cache locale (comportamento originale)
                        const allUsers = await refreshUsersCache();
                        const foundInCache = allUsers.find(u => u.id === session.user.id);
                        if (foundInCache) {
                            console.log("[AppInit] Utente recuperato dalla Cache:", foundInCache.name);
                            setUser(foundInCache);
                        }
                    }
                } catch (e) {
                    console.error("[AppInit] Error syncing user state:", e);
                }
            } else {
                setUser(getGuestUser());
            }
        };

        // Listener reattivo per cambi di sessione
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event as string) === 'USER_UPDATED') {
                await syncUserState(session);
            } else if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
                setUser(getGuestUser());
            }
        });

        // Inizializzazione sessione (solo al primo mount)
        const initUserSession = async () => {
            if (isAuthOperationInProgress) {
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const nowSec = Math.floor(Date.now() / 1000);
                    const isExpired = session.expires_at && session.expires_at <= nowSec;

                    if (!isExpired) {
                        await syncUserState(session);
                    } else if (!sessionRecoveryAttemptedRef.current) {
                        sessionRecoveryAttemptedRef.current = true;
                        await supabase.auth.signOut();
                    }
                }
            } catch (e) {
                // Mantenuto: error handling reale dell'inizializzazione sessione.
                console.error("[AppInit] Error in initUserSession:", e);
            }
        };


        initUserSession();


        fetchLevelsAsync().then(() => {
            // Dopo aver caricato i livelli, aggiorniamo il ref del livello corrente per evitare falsi positivi al primo render
            prevLevelRef.current = getCurrentLevel(user.xp || 0).level;
        });

        const checkConnection = async () => {
            try {
                // Usiamo getSession() come health check leggero:
                // non chiama PostgREST, non tocca global_settings,
                // fallisce solo se Supabase è completamente irraggiungibile.
                const { error } = await supabase.auth.getSession();
                setConnectionError(!!error);
            } catch (e) {
                setConnectionError(true);
            }
        };
        checkConnection();


        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 2. Manifest Loading
    useEffect(() => {
        if (viewMode === 'app') {
            setIsLoadingManifest(true);
            getFullManifestAsync().then(data => {
                setCityManifest(data);
                setIsLoadingManifest(false);
            });
        } else {
            // In modalità admin non carichiamo il manifest consumer, 
            // ma segnamo comunque l'inizializzazione come completata.
            setIsLoadingManifest(false);
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
                    const config = await getSetting<{ autoStart: boolean }>('onboarding_config');
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

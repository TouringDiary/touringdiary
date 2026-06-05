import React, { createContext, useContext, ReactNode } from 'react';
import { useAppInitialization } from '../hooks/core/useAppInitialization';
import { getGuestUser } from '../utils/userUtils';
import { supabase } from '../services/supabaseClient';
import type { User, CitySummary } from '../types/index';
import type { AiQuota } from '../types/ai';

interface UserContextType {
    user: User;
    setUser: (u: User) => void;
    cityManifest: CitySummary[];
    isLoadingManifest: boolean;
    connectionError: boolean;
    handleLogout: () => void;
    
    // AI Quota
    aiQuota: AiQuota | null;
    refreshAiQuota: () => Promise<void>;
    
    // Gamification & Onboarding (parte di AppInit)
    showLevelUp: boolean;
    closeLevelUp: () => void;
    showOnboarding: boolean;
    completeOnboarding: () => void;
    syncMode: (path: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children?: ReactNode }) {
    // Gestiamo la modalità corrente in modo reattivo per intercettare il ritorno da Admin a App (es. Browser Back)
    const [currentMode, setCurrentMode] = React.useState<'app' | 'admin'>(() => 
        window.location.pathname.startsWith('/admin') ? 'admin' : 'app'
    );

    // Sincronizzazione con l'URL fornita ai figli (NavigationProvider) per gestire la volatilità
    const syncMode = React.useCallback((path: string) => {
        const nextMode = path.startsWith('/admin') ? 'admin' : 'app';
        if (nextMode !== currentMode) {
            console.log(`[UserContext] Reactive Mode transition: ${currentMode} -> ${nextMode}`);
            setCurrentMode(nextMode);
        }
    }, [currentMode]);

    const {
        user, setUser,
        cityManifest,
        isLoadingManifest,
        connectionError,
        showLevelUp, closeLevelUp,
        showOnboarding, completeOnboarding
    } = useAppInitialization(currentMode);

    const [aiQuota, setAiQuota] = React.useState<AiQuota | null>(null);

    const refreshAiQuota = React.useCallback(async () => {
        if (!user || user.role === 'guest') {
            setAiQuota(null);
            return;
        }
        try {
            const { data, error } = await supabase.rpc('get_current_ai_quota', {
                p_user_id: user.id
            });
            if (error) throw error;
            setAiQuota(data as unknown as AiQuota);
        } catch (err) {
            console.error("[UserContext] Error fetching quota:", err);
        }
    }, [user.id, user.role]);

    // Inizializzazione completata
    React.useEffect(() => {
        if (!isLoadingManifest) {
            // Manifest inizializzato correttamente (o saltato in modalità admin)
            refreshAiQuota();
        }
    }, [isLoadingManifest, refreshAiQuota]);


    const handleLogout = async () => {
        try {
            // 1. Logout reale da Supabase per invalidare sessione server-side e locale
            await supabase.auth.signOut();
        } catch (error) {
            console.error("[Logout] Errore reset sessione:", error);
        } finally {
            // 2. Reset deterministico dello stato locale
            setUser(getGuestUser());
        }
    };


    const value = React.useMemo(() => ({
        user, setUser,
        cityManifest, isLoadingManifest, connectionError,
        handleLogout,
        aiQuota, refreshAiQuota,
        showLevelUp, closeLevelUp,
        showOnboarding, completeOnboarding,
        syncMode
    }), [
        user, setUser, 
        cityManifest, isLoadingManifest, connectionError, 
        handleLogout,
        aiQuota, refreshAiQuota,
        showLevelUp, closeLevelUp, 
        showOnboarding, completeOnboarding, 
        syncMode
    ]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};

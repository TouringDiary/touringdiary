import React, { createContext, useContext, ReactNode } from 'react';
import { useAppInitialization } from '../hooks/core/useAppInitialization';
import { getGuestUser } from '../utils/userUtils';
import type { User, CitySummary } from '../types/index';

interface UserContextType {
    user: User;
    setUser: (u: User) => void;
    cityManifest: CitySummary[];
    isLoadingManifest: boolean;
    connectionError: boolean;
    handleLogout: () => void;
    
    // Gamification & Onboarding (parte di AppInit)
    showLevelUp: boolean;
    closeLevelUp: () => void;
    showOnboarding: boolean;
    completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children?: ReactNode }) {
    // Usiamo l'hook esistente che contiene tutta la logica di inizializzazione
    const {
        user, setUser,
        cityManifest,
        isLoadingManifest,
        connectionError,
        showLevelUp, closeLevelUp,
        showOnboarding, completeOnboarding
    } = useAppInitialization('app');

    // Funzione Logout spostata qui (semplificata per il context, la logica di routing rimane nel router)
    const handleLogout = () => {
        // La logica di reset router avverrà nei componenti che ascoltano il cambio user
        // Qui resettiamo solo lo stato utente
        setUser(getGuestUser());
    };

    const value = {
        user, setUser,
        cityManifest, isLoadingManifest, connectionError,
        handleLogout,
        showLevelUp, closeLevelUp,
        showOnboarding, completeOnboarding
    };

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
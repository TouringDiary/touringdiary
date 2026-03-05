import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useGpsManager } from '../hooks/core/useGpsManager';
import { useModal } from './ModalContext';

interface GpsContextType {
    userLocation: { lat: number; lng: number } | null;
    isLocating: boolean;
    error: string | null;
    toggleGps: () => void;
    confirmGpsFromModal: () => void;
}

const GpsContext = createContext<GpsContextType | undefined>(undefined);

export const GpsProvider = ({ children }: { children?: ReactNode }) => {
    const { 
        userLocation, 
        isLocating, 
        error, 
        requestPosition, 
        clearPosition 
    } = useGpsManager();

    const modalContext = useModal();

    // Logica unificata per il toggle (Header button)
    const toggleGps = useCallback(async () => {
        if (userLocation) {
            clearPosition();
            return;
        }
        const result = await requestPosition();
        if (!result.success && result.error) {
            modalContext.openModal('gpsError', { message: result.error, isCritical: result.isCriticalError });
        }
    }, [userLocation, clearPosition, requestPosition, modalContext]);

    // Logica per il modale di conferma (es. "Attiva GPS")
    const confirmGpsFromModal = useCallback(async () => {
        const result = await requestPosition();
        if (!result.success && result.error) {
             modalContext.openModal('gpsError', { message: result.error, isCritical: result.isCriticalError });
        }
    }, [requestPosition, modalContext]);

    return (
        <GpsContext.Provider value={{ userLocation, isLocating, error, toggleGps, confirmGpsFromModal }}>
            {children}
        </GpsContext.Provider>
    );
};

export const useGps = () => {
    const context = useContext(GpsContext);
    if (!context) throw new Error("useGps must be used within GpsProvider");
    return context;
};
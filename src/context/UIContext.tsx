import React, { createContext, useContext, ReactNode } from 'react';
import { useAppUI } from '../hooks/core/useAppUI';
// Importiamo hook router solo per monitorare lo shop attivo (per chiudere sidebar)
import { useAppRouter } from '../hooks/useAppRouter';

interface UIContextType {
    isMobile: boolean;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setIsSidebarOpen: (v: boolean) => void;
    
    isUiVisible: boolean;
    showUi: () => void;
    setIsUiVisible: (v: boolean) => void;
    
    mobileShowWeather: boolean;
    toggleMobileWeather: () => void;
    setMobileShowWeather: (v: boolean) => void;

    mobileDiaryFullScreen: boolean;
    toggleMobileDiary: () => void;
    setMobileDiaryFullScreen: (v: boolean) => void;

    handleMainScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children?: ReactNode }) => {
    // Nota: usiamo l'hook router qui SOLO per sapere se c'è uno shop attivo
    // Questo è un piccolo accoppiamento necessario per la logica "auto-close sidebar"
    // In un refactoring futuro, activeShopId potrebbe stare in un global store.
    // Per ora leggiamo l'URL o usiamo un default null, lasciando che AppCoordinator gestisca il sync se critico.
    // TUTTAVIA: useAppUI accetta activeShopId. Per semplicità in questo step,
    // passiamo null e lasciamo che la sidebar si gestisca manualmente o tramite eventi.
    // L'automazione "chiudi sidebar su shop" è meno critica del prop drilling.
    
    const {
        isMobile,
        isSidebarOpen, setIsSidebarOpen,
        isUiVisible, setIsUiVisible,
        mobileShowWeather, setMobileShowWeather,
        mobileDiaryFullScreen, setMobileDiaryFullScreen,
        handleMainScroll
    } = useAppUI(null); // Passing null activeShopId for now to decouple

    const value = {
        isMobile,
        isSidebarOpen,
        toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
        setIsSidebarOpen,
        
        isUiVisible,
        showUi: () => setIsUiVisible(true),
        setIsUiVisible,
        
        mobileShowWeather,
        toggleMobileWeather: () => setMobileShowWeather(!mobileShowWeather),
        setMobileShowWeather,
        
        mobileDiaryFullScreen,
        toggleMobileDiary: () => setMobileDiaryFullScreen(!mobileDiaryFullScreen),
        setMobileDiaryFullScreen,

        handleMainScroll
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error("useUI must be used within UIProvider");
    return context;
};
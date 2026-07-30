import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useAppUI } from '../hooks/core/useAppUI';

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
    const {
        isMobile,
        isSidebarOpen, setIsSidebarOpen,
        isUiVisible, setIsUiVisible,
        mobileShowWeather, setMobileShowWeather,
        mobileDiaryFullScreen, setMobileDiaryFullScreen,
        handleMainScroll
    } = useAppUI();

    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, [setIsSidebarOpen]);

    const showUi = useCallback(() => {
        setIsUiVisible(true);
    }, [setIsUiVisible]);

    const toggleMobileWeather = useCallback(() => {
        setMobileShowWeather(prev => !prev);
    }, [setMobileShowWeather]);

    const toggleMobileDiary = useCallback(() => {
        setMobileDiaryFullScreen(prev => !prev);
    }, [setMobileDiaryFullScreen]);

    const value = useMemo<UIContextType>(() => ({
        isMobile,
        isSidebarOpen,
        toggleSidebar,
        setIsSidebarOpen,
        
        isUiVisible,
        showUi,
        setIsUiVisible,
        
        mobileShowWeather,
        toggleMobileWeather,
        setMobileShowWeather,
        
        mobileDiaryFullScreen,
        toggleMobileDiary,
        setMobileDiaryFullScreen,

        handleMainScroll
    }), [
        isMobile,
        isSidebarOpen,
        toggleSidebar,
        setIsSidebarOpen,
        isUiVisible,
        showUi,
        setIsUiVisible,
        mobileShowWeather,
        toggleMobileWeather,
        setMobileShowWeather,
        mobileDiaryFullScreen,
        toggleMobileDiary,
        setMobileDiaryFullScreen,
        handleMainScroll,
    ]);

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

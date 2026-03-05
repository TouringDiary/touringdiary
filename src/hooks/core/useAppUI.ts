
import { useState, useEffect } from 'react';
import { useMobileDetect } from '../ui/useMobileDetect';
import { useScrollUI } from '../ui/useScrollUI';

export const useAppUI = (activeShopId: string | null) => {
    // 1. Mobile Detection (Logic separated)
    const isMobile = useMobileDetect();

    // 2. Scroll Logic (Logic separated)
    const { isUiVisible, setIsUiVisible, handleMainScroll } = useScrollUI();

    // 3. Panel States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [mobileShowWeather, setMobileShowWeather] = useState(false);
    const [mobileDiaryFullScreen, setMobileDiaryFullScreen] = useState(false);

    // Auto-close sidebar on specific conditions
    useEffect(() => {
        if (activeShopId) {
            setIsSidebarOpen(false);
        } else if (!isMobile) {
            // Su desktop, se usciamo dallo shop, riapriamo la sidebar
            setIsSidebarOpen(true);
        }
    }, [activeShopId, isMobile]);

    // Gestione Eventi Custom per forzare apertura/chiusura diario da Onboarding
    useEffect(() => {
        const handleOpenDiary = () => { setMobileDiaryFullScreen(true); };
        const handleCloseDiary = () => { setMobileDiaryFullScreen(false); };

        window.addEventListener('onboarding-force-open-diary', handleOpenDiary);
        window.addEventListener('onboarding-force-close-diary', handleCloseDiary);
        
        return () => {
            window.removeEventListener('onboarding-force-open-diary', handleOpenDiary);
            window.removeEventListener('onboarding-force-close-diary', handleCloseDiary);
        };
    }, []);

    return {
        isMobile,
        isSidebarOpen, 
        setIsSidebarOpen,
        isUiVisible, 
        setIsUiVisible,
        mobileShowWeather, 
        setMobileShowWeather,
        mobileDiaryFullScreen, 
        setMobileDiaryFullScreen,
        handleMainScroll
    };
};

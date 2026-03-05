
import { useState, useEffect } from 'react';
import { LAYOUT } from '../../constants/layout';

export const useMobileDetect = () => {
    // Inizializza basandosi sulla larghezza finestra se disponibile (SSR safe)
    const [isMobile, setIsMobile] = useState(() => 
        typeof window !== 'undefined' ? window.innerWidth < LAYOUT.BREAKPOINTS.LG : false
    );

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < LAYOUT.BREAKPOINTS.LG;
            setIsMobile(mobile);
        };

        // Check iniziale
        check();

        // Passive listener per performance
        window.addEventListener('resize', check, { passive: true });
        return () => window.removeEventListener('resize', check);
    }, []);

    return isMobile;
};

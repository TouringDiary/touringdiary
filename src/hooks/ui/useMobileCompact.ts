import { useState, useEffect } from 'react';
import { MOBILE_COMPACT_QUERY } from '@/constants/breakpoints';

export function useMobileCompact(): boolean {
    const [isMobileCompact, setIsMobileCompact] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(MOBILE_COMPACT_QUERY).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_COMPACT_QUERY);
        const sync = () => setIsMobileCompact(mediaQuery.matches);
        sync();
        mediaQuery.addEventListener('change', sync);
        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    return isMobileCompact;
}

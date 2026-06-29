import { useState, useEffect } from 'react';
import { HERO_STACKED_QUERY } from '@/constants/breakpoints';

/** True on mobile and tablet (below lg): stacked hero modules with dynamic order. */
export function useHeroStackedLayout(): boolean {
    const [isStacked, setIsStacked] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(HERO_STACKED_QUERY).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(HERO_STACKED_QUERY);
        const sync = () => setIsStacked(mediaQuery.matches);
        sync();
        mediaQuery.addEventListener('change', sync);
        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    return isStacked;
}

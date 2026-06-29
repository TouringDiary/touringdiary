import { useState, useEffect } from 'react';
import { HERO_STACKED_QUERY } from '@/constants/breakpoints';

/**
 * True on mobile and tablet (below the `lg` desktop breakpoint, max-width 1023px).
 * Single source of truth: HERO_STACKED_MAX_WIDTH_PX / HERO_STACKED_QUERY.
 */
export function useBelowLg(): boolean {
    const [belowLg, setBelowLg] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(HERO_STACKED_QUERY).matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(HERO_STACKED_QUERY);
        const sync = () => setBelowLg(mediaQuery.matches);
        sync();
        mediaQuery.addEventListener('change', sync);
        return () => mediaQuery.removeEventListener('change', sync);
    }, []);

    return belowLg;
}

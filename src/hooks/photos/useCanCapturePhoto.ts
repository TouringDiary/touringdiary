import { useState, useEffect } from 'react';

/**
 * Camera capture for phone/tablet only (D-007).
 *
 * Prefer touch capability over viewport: iPad + keyboard / Surface / touch Chromebook
 * still expose maxTouchPoints or a coarse pointer, while classic desktops do not.
 * Actual capture uses in-page getUserMedia (CommunityPhotoWorkflow), not system
 * `<input capture>` (that backgrounds the tab on mobile).
 */
export function useCanCapturePhoto(): boolean {
    const [canCapture, setCanCapture] = useState(false);

    useEffect(() => {
        const evaluate = () => {
            if (typeof window === 'undefined' || typeof navigator === 'undefined') {
                setCanCapture(false);
                return;
            }

            const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
            const coarsePrimary =
                typeof window.matchMedia === 'function' &&
                window.matchMedia('(pointer: coarse)').matches;
            const coarseAny =
                typeof window.matchMedia === 'function' &&
                window.matchMedia('(any-pointer: coarse)').matches;

            setCanCapture(hasTouch || coarsePrimary || coarseAny);
        };

        evaluate();
        window.addEventListener('resize', evaluate, { passive: true });
        return () => window.removeEventListener('resize', evaluate);
    }, []);

    return canCapture;
}

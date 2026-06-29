import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePanelEnterAnimation } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/usePanelEnterAnimation';

function parseMaxTransitionDurationMs(transitionDuration: string): number {
    if (!transitionDuration || transitionDuration === 'none') return 0;
    return Math.max(
        ...transitionDuration.split(',').map((part) => {
            const value = part.trim();
            if (value.endsWith('ms')) return parseFloat(value);
            if (value.endsWith('s')) return parseFloat(value) * 1000;
            return parseFloat(value) || 0;
        }),
        0
    );
}

/**
 * Controlled slide-up panel lifecycle (open prop drives mount/raise/close).
 * Reuses the same enter/close pattern as SuitcaseFloatingPanel.
 */
export function useControlledSlidePanel(isOpen: boolean) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isEntered, setIsEntered] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const closePendingRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            closePendingRef.current = false;
        } else if (shouldRender && !closePendingRef.current) {
            closePendingRef.current = true;
            setIsClosing(true);
        }
    }, [isOpen, shouldRender]);

    const finalizeClose = useCallback(() => {
        closePendingRef.current = false;
        setShouldRender(false);
        setIsEntered(false);
        setIsClosing(false);
    }, []);

    usePanelEnterAnimation({
        panelRef,
        isPortalReady: shouldRender && isOpen && !isClosing,
        setIsEntered,
    });

    useLayoutEffect(() => {
        if (!isClosing || !closePendingRef.current) return;

        const el = panelRef.current;
        if (!el) {
            finalizeClose();
            return;
        }

        const style = window.getComputedStyle(el);
        const durationMs = parseMaxTransitionDurationMs(style.transitionDuration);

        if (durationMs === 0 || !isEntered) {
            finalizeClose();
            return;
        }

        const onTransitionEnd = (event: TransitionEvent) => {
            if (event.target !== el) return;
            const prop = event.propertyName;
            if (prop !== 'translate' && !prop.includes('transform')) return;
            if (!closePendingRef.current) return;
            finalizeClose();
        };

        el.addEventListener('transitionend', onTransitionEnd);
        return () => el.removeEventListener('transitionend', onTransitionEnd);
    }, [isClosing, isEntered, finalizeClose]);

    const isPanelRaised = isEntered && !isClosing;

    return {
        panelRef,
        shouldRender,
        isPanelRaised,
        isClosing,
    };
}

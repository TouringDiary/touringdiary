import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export type AnchoredAlign = 'left' | 'right' | 'center';

export interface AnchoredPortalPosition {
    top: number;
    left?: number;
    right?: number;
}

/**
 * Computes fixed viewport coordinates for a portaled popover anchored to a trigger element.
 * Recalculates on scroll (capture), resize, and anchor layout shifts (ResizeObserver).
 */
export function useAnchoredPortalPosition(
    anchorRef: RefObject<HTMLElement | null>,
    isActive: boolean,
    align: AnchoredAlign = 'right',
    margin = 6,
): AnchoredPortalPosition | null {
    const [pos, setPos] = useState<AnchoredPortalPosition | null>(null);

    useEffect(() => {
        if (!isActive || !anchorRef.current) {
            setPos(null);
            return;
        }

        const update = () => {
            const el = anchorRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (align === 'right') {
                setPos({ top: rect.bottom + margin, right: window.innerWidth - rect.right });
            } else if (align === 'center') {
                setPos({ top: rect.bottom + margin, left: rect.left + rect.width / 2 });
            } else {
                setPos({ top: rect.bottom + margin, left: rect.left });
            }
        };

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);

        let resizeObserver: ResizeObserver | undefined;
        const el = anchorRef.current;
        if (el && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(update);
            resizeObserver.observe(el);
        }

        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
            resizeObserver?.disconnect();
        };
    }, [isActive, anchorRef, align, margin]);

    return pos;
}

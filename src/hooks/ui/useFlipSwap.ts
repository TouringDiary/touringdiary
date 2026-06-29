import { useLayoutEffect, useRef, type RefObject } from 'react';
import { SLIDE_PANEL_DURATION_MS } from '@/constants/breakpoints';

const FLIP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

interface UseFlipSwapOptions {
    enabled: boolean;
    orderKey: string;
    refs: Record<string, RefObject<HTMLElement | null>>;
}

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * FLIP animation when sibling order changes.
 *
 * Single responsibility: animate the position swap. Scroll stabilization is
 * intentionally owned by the consumer (HeroSection), not by this hook.
 */
export function useFlipSwap({ enabled, orderKey, refs }: UseFlipSwapOptions): void {
    const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
    const prevOrderKeyRef = useRef(orderKey);

    useLayoutEffect(() => {
        if (!enabled) {
            prevRectsRef.current.clear();
            prevOrderKeyRef.current = orderKey;
            return;
        }

        const keys = Object.keys(refs);
        const orderChanged = prevOrderKeyRef.current !== orderKey;

        // Per-run teardown handles: ensure styles/listeners/timers are always
        // released, even if the component unmounts mid-transition.
        const animatedEls: HTMLElement[] = [];
        const timeouts: number[] = [];
        const listeners: Array<{ el: HTMLElement; fn: (e: TransitionEvent) => void }> = [];

        if (orderChanged && prevRectsRef.current.size > 0) {
            keys.forEach((key) => {
                const el = refs[key]?.current;
                const first = prevRectsRef.current.get(key);
                if (!el || !first) return;

                const last = el.getBoundingClientRect();
                const dy = first.top - last.top;
                if (Math.abs(dy) < 0.5) return;

                const durationMs = prefersReducedMotion() ? 0 : SLIDE_PANEL_DURATION_MS;

                // FLIP: invert to the previous position, then play to the new one.
                el.style.transition = 'none';
                el.style.transform = `translateY(${dy}px)`;
                void el.offsetHeight; // force reflow so the inverted state is committed

                if (durationMs === 0) {
                    el.style.transform = '';
                    return;
                }

                el.style.transition = `transform ${durationMs}ms ${FLIP_EASING}`;
                el.style.transform = '';
                animatedEls.push(el);

                const cleanupEl = () => {
                    el.style.transition = '';
                    el.style.transform = '';
                };

                const onEnd = (event: TransitionEvent) => {
                    if (event.target !== el) return;
                    if (event.propertyName !== 'transform' && event.propertyName !== 'translate') return;
                    el.removeEventListener('transitionend', onEnd);
                    cleanupEl();
                };

                el.addEventListener('transitionend', onEnd);
                listeners.push({ el, fn: onEnd });
                // Safety net if transitionend never fires (e.g. interrupted layout).
                timeouts.push(window.setTimeout(cleanupEl, durationMs + 50));
            });
        }

        // Snapshot current positions for the next reorder.
        const nextRects = new Map<string, DOMRect>();
        keys.forEach((key) => {
            const el = refs[key]?.current;
            if (el) nextRects.set(key, el.getBoundingClientRect());
        });
        prevRectsRef.current = nextRects;
        prevOrderKeyRef.current = orderKey;

        return () => {
            timeouts.forEach((id) => window.clearTimeout(id));
            listeners.forEach(({ el, fn }) => el.removeEventListener('transitionend', fn));
            animatedEls.forEach((el) => {
                el.style.transition = '';
                el.style.transform = '';
            });
        };
    }, [enabled, orderKey, refs]);
}

import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

export type AnchoredAlign = 'left' | 'right' | 'center';

export interface AnchoredPortalPosition {
    top: number;
    left?: number;
    right?: number;
}

export interface AnchoredPortalState {
    /** Coordinate calcolate (null finché l'ancora non è disponibile). */
    position: AnchoredPortalPosition | null;
    /**
     * True quando `position` riflette una misurazione reale del popover (clamping/flip applicati),
     * oppure quando il clamping non è richiesto (nessun `popoverRef`). Permette ai consumer di
     * mostrare il popover solo nella posizione finale, evitando lo "scatto" del primo frame.
     */
    ready: boolean;
    /**
     * Forza un ricalcolo immediato della posizione. Il consumer DEVE invocarlo (tipicamente in un
     * `useLayoutEffect`, sincronamente prima del paint) appena il popover è montato, così la
     * misurazione/clamp avviene in modo deterministico e `ready` diventa true senza dipendere dalla
     * corsa con il `requestAnimationFrame`. Identità stabile.
     */
    remeasure: () => void;
}

/**
 * Computes fixed viewport coordinates for a portaled popover anchored to a trigger element.
 * Recalculates on scroll (capture), resize, and anchor layout shifts (ResizeObserver).
 *
 * Viewport collision: when `popoverRef` is provided (and the popover has been measured),
 * the computed coordinates are clamped so the panel stays fully inside the viewport, and
 * flipped above the anchor when there is no room below. The alignment contract is preserved
 * (right stays right-anchored, center stays center-anchored): only the magnitude is adjusted,
 * and ONLY when the panel would otherwise overflow. Without `popoverRef` the behavior is
 * identical to before (no clamping).
 */
export function useAnchoredPortalPosition(
    anchorRef: RefObject<HTMLElement | null>,
    isActive: boolean,
    align: AnchoredAlign = 'right',
    margin = 6,
    popoverRef?: RefObject<HTMLElement | null>,
): AnchoredPortalState {
    const [state, setState] = useState<{ position: AnchoredPortalPosition | null; ready: boolean }>({
        position: null,
        ready: false,
    });

    // Se nessun popoverRef è fornito, il clamping non è atteso: la posizione è subito "finale".
    const clampingExpected = !!popoverRef;

    const update = useCallback(() => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const pop = popoverRef?.current ?? null;
        // offsetWidth/Height (not getBoundingClientRect) on purpose: the popover mounts with an
        // `animate-in zoom-in-95` entrance, so getBoundingClientRect would report the transient
        // SCALED size during the measurement. ResizeObserver doesn't fire on transforms, so that
        // wrong size would never be re-corrected. offsetWidth/Height ignore the transform and
        // return the stable final layout size — exactly what the clamp needs.
        const pw = pop?.offsetWidth ?? 0;
        const ph = pop?.offsetHeight ?? 0;
        const canClamp = pw > 0 && ph > 0;

        // Vertical: place below the anchor; flip above only if it would overflow the bottom.
        let top = rect.bottom + margin;
        if (canClamp) {
            if (top + ph > vh - margin) {
                const above = rect.top - margin - ph;
                top = above >= margin ? above : Math.max(margin, vh - ph - margin);
            }
            top = Math.max(margin, Math.min(top, vh - ph - margin));
        }

        // "ready" = la posizione corrente è quella finale: o è stata misurata/clampata,
        // o il clamping non era atteso (nessun popoverRef).
        const ready = canClamp || !clampingExpected;

        let next: AnchoredPortalPosition;
        if (align === 'right') {
            let right = vw - rect.right;
            if (canClamp) {
                // left edge = vw - right - pw ; keep it >= margin and right edge <= vw - margin
                right = Math.max(margin, Math.min(right, vw - pw - margin));
            }
            next = { top, right };
        } else if (align === 'center') {
            let centerX = rect.left + rect.width / 2;
            if (canClamp) {
                // popover is translated by -50%, so clamp the center so both edges stay in view
                centerX = Math.max(margin + pw / 2, Math.min(centerX, vw - margin - pw / 2));
            }
            next = { top, left: centerX };
        } else {
            let left = rect.left;
            if (canClamp) {
                left = Math.max(margin, Math.min(left, vw - pw - margin));
            }
            next = { top, left };
        }

        // Bail out se nulla è cambiato: ritornando lo stesso stato, React salta il re-render. Questo
        // mantiene STABILE l'identità di `position`, così il `useLayoutEffect` del consumer (che ne
        // dipende) non rientra in loop dopo che il clamp è convergito.
        setState(prev => {
            const p = prev.position;
            if (
                p &&
                prev.ready === ready &&
                p.top === next.top &&
                p.left === next.left &&
                p.right === next.right
            ) {
                return prev;
            }
            return { position: next, ready };
        });
    }, [anchorRef, align, margin, popoverRef, clampingExpected]);

    useEffect(() => {
        if (!isActive || !anchorRef.current) {
            setState({ position: null, ready: false });
            return;
        }

        update();

        let resizeObserver: ResizeObserver | undefined;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => update());
            const anchorEl = anchorRef.current;
            if (anchorEl) resizeObserver.observe(anchorEl);
            // The popover is usually NOT mounted yet on the first effect run: it only renders once
            // `position` is set (one render later). Observe it now if it already exists; the reliable
            // synchronous measure happens in the consumer's useLayoutEffect (remeasure), and the rAF
            // below is a backup.
            if (popoverRef?.current) resizeObserver.observe(popoverRef.current);
        }

        // Backup re-measure once the popover has (likely) mounted, and attach the ResizeObserver to it
        // now that the ref may be populated. observe() is idempotent, so the potential double-observe
        // is harmless. NOTE: visibility no longer depends on this rAF winning the mount race — the
        // consumer triggers a deterministic synchronous measure via `remeasure` in a layout effect.
        const raf = requestAnimationFrame(() => {
            update();
            if (resizeObserver && popoverRef?.current) {
                resizeObserver.observe(popoverRef.current);
            }
        });

        const onScroll = () => update();
        const onResize = () => update();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
            resizeObserver?.disconnect();
        };
    }, [isActive, anchorRef, popoverRef, update]);

    return { position: state.position, ready: state.ready, remeasure: update };
}

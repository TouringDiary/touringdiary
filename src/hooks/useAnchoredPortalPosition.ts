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
 * the computed coordinates are clamped so the panel stays fully inside the viewport and,
 * when `boundaryRef` is set, inside that element's bounding box (intersection of both).
 * Flipped above the anchor when there is no room below. Without `popoverRef` the behavior is
 * identical to before (no clamping).
 */
function normalizeAxis(min: number, max: number): { min: number; max: number } {
    if (min <= max) return { min, max };
    const mid = (min + max) / 2;
    return { min: mid, max: mid };
}

function getClampBounds(
    margin: number,
    boundaryRef?: RefObject<HTMLElement | null>,
): { minX: number; maxX: number; minY: number; maxY: number } {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let minX = margin;
    let maxX = vw - margin;
    let minY = margin;
    let maxY = vh - margin;

    const boundary = boundaryRef?.current;
    if (boundary) {
        const rect = boundary.getBoundingClientRect();
        minX = Math.max(minX, rect.left + margin);
        maxX = Math.min(maxX, rect.right - margin);
        minY = Math.max(minY, rect.top + margin);
        maxY = Math.min(maxY, rect.bottom - margin);
    }

    const x = normalizeAxis(minX, maxX);
    const y = normalizeAxis(minY, maxY);
    return { minX: x.min, maxX: x.max, minY: y.min, maxY: y.max };
}

export function useAnchoredPortalPosition(
    anchorRef: RefObject<HTMLElement | null>,
    isActive: boolean,
    align: AnchoredAlign = 'right',
    margin = 6,
    popoverRef?: RefObject<HTMLElement | null>,
    boundaryRef?: RefObject<HTMLElement | null>,
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
        const { minX, maxX, minY, maxY } = getClampBounds(margin, boundaryRef);

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
            if (top + ph > maxY) {
                const above = rect.top - margin - ph;
                top = above >= minY ? above : Math.max(minY, maxY - ph);
            }
            top = Math.max(minY, Math.min(top, maxY - ph));
        }

        // "ready" = la posizione corrente è quella finale: o è stata misurata/clampata,
        // o il clamping non era atteso (nessun popoverRef).
        const ready = canClamp || !clampingExpected;

        let next: AnchoredPortalPosition;
        if (align === 'right') {
            let right = vw - rect.right;
            if (canClamp) {
                // left edge = vw - right - pw ; keep within [minX, maxX]
                right = Math.max(vw - maxX, Math.min(right, vw - minX - pw));
            }
            next = { top, right };
        } else if (align === 'center') {
            let centerX = rect.left + rect.width / 2;
            if (canClamp) {
                // popover is translated by -50%, so clamp the center so both edges stay in bounds
                centerX = Math.max(minX + pw / 2, Math.min(centerX, maxX - pw / 2));
            }
            next = { top, left: centerX };
        } else {
            let left = rect.left;
            if (canClamp) {
                left = Math.max(minX, Math.min(left, maxX - pw));
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
    }, [anchorRef, align, margin, popoverRef, boundaryRef, clampingExpected]);

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
            const boundaryEl = boundaryRef?.current;
            if (boundaryEl) resizeObserver.observe(boundaryEl);
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
    }, [isActive, anchorRef, popoverRef, boundaryRef, update]);

    return { position: state.position, ready: state.ready, remeasure: update };
}

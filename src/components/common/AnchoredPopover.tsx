import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { AnchoredAlign, useAnchoredPortalPosition } from '@/hooks/useAnchoredPortalPosition';

export interface AnchoredPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    align?: AnchoredAlign;
    className?: string;
    /** Optional layout boundary — popover is clamped inside this element (and the viewport). */
    boundaryRef?: React.RefObject<HTMLElement | null>;
    /** Register close on ESC via LIFO stack (default true). */
    closeOnEscape?: boolean;
    /** Close when pointer down occurs outside popover + anchor (default true). */
    closeOnClickOutside?: boolean;
    role?: 'dialog' | 'menu' | 'tooltip' | 'listbox';
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Portaled floating popover — shared pattern with CustomCalendar.
 * portal + fixed + anchorRef + getBoundingClientRect.
 * NO backdrop. NO raw keydown listeners.
 */
export const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
    isOpen,
    onClose,
    anchorRef,
    children,
    align = 'right',
    className = '',
    boundaryRef,
    closeOnEscape = true,
    closeOnClickOutside = true,
    role = 'dialog',
    onMouseEnter,
    onMouseLeave,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { position, ready, remeasure } = useAnchoredPortalPosition(
        anchorRef,
        isOpen,
        align,
        undefined,
        popoverRef,
        boundaryRef,
    );

    useGlobalModalEscape(isOpen && closeOnEscape, onClose);

    // Misurazione DETERMINISTICA: appena il portale è montato (position calcolata + ref popolato),
    // ricalcoliamo sincronamente PRIMA del paint. Così `ready` diventa true subito, senza dipendere
    // dalla corsa con il requestAnimationFrame: il popover non resta mai bloccato invisibile e appare
    // già nella posizione finale clampata (nessuno "scatto", nessun taglio ai bordi su mobile).
    useLayoutEffect(() => {
        if (isOpen && position && !ready && popoverRef.current) {
            remeasure();
        }
    }, [isOpen, position, ready, remeasure]);

    useEffect(() => {
        if (!isOpen || !closeOnClickOutside) return;
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (popoverRef.current?.contains(target)) return;
            if (anchorRef.current?.contains(target)) return;
            onClose();
        };
        document.addEventListener('pointerdown', handlePointerDown, true);
        return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    }, [isOpen, closeOnClickOutside, onClose, anchorRef]);

    if (!isOpen || !position || typeof document === 'undefined') return null;

    // Finché la posizione non è "finale" (clamp/flip applicati dal posizionatore), il popover resta
    // montato ma invisibile: viene misurato a layout completo (offsetWidth ignora opacity) e rivelato
    // con l'animazione d'ingresso direttamente nella posizione corretta, senza scatti né tagli.
    return createPortal(
        <div
            ref={popoverRef}
            role={role}
            aria-modal={false}
            className={`fixed ${align === 'center' ? '-translate-x-1/2' : ''} ${ready ? 'animate-in fade-in zoom-in-95' : 'opacity-0 pointer-events-none'} ${className}`}
            style={{ zIndex: Z_MODAL_NESTED, ...position }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>,
        document.body,
    );
};

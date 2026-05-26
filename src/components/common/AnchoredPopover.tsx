import { Z_MODAL_NESTED } from '@/constants/zIndex';
import React, { useEffect, useRef } from 'react';
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
    closeOnEscape = true,
    closeOnClickOutside = true,
    role = 'dialog',
    onMouseEnter,
    onMouseLeave,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const pos = useAnchoredPortalPosition(anchorRef, isOpen, align);

    useGlobalModalEscape(isOpen && closeOnEscape, onClose);

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

    if (!isOpen || !pos || typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={popoverRef}
            role={role}
            aria-modal={false}
            className={`fixed animate-in fade-in zoom-in-95 ${align === 'center' ? '-translate-x-1/2' : ''} ${className}`}
            style={{ zIndex: Z_MODAL_NESTED, ...pos }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>,
        document.body,
    );
};

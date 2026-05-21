import { Z_OVERLAY } from '@/constants/zIndex';
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';

// Singleton Registry: permette di avere un solo popover aperto nell'header alla volta
let activePopoverClose: (() => void) | null = null;

export interface HeaderPopoverHandle {
    close: () => void;
    open: () => void;
}

interface HeaderPopoverProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    offset?: number;
    width?: string;
    alignment?: 'right' | 'left';
    className?: string;
    onOpen?: () => void;
    onClose?: () => void;
}

/**
 * HeaderPopover - Componente standard per pannelli a scomparsa nell'header.
 * Gestisce posizionamento, portaling, chiusura su click esterno ed ESC.
 * Supporta singleton mode (solo uno aperto) e reposition su scroll.
 */
export const HeaderPopover = forwardRef<HeaderPopoverHandle, HeaderPopoverProps>(({
    trigger,
    children,
    offset = 8,
    width,
    alignment = 'right',
    className = "",
    onOpen,
    onClose
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId();

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + offset,
                left: rect.left,
                right: window.innerWidth - rect.right
            });
        }
    }, [offset]);

    const closePopover = useCallback(() => {
        setIsOpen(false);
        onClose?.();
        if (activePopoverClose === closePopover) {
            activePopoverClose = null;
        }
    }, [onClose]);

    const openPopover = useCallback(() => {
        // Chiudi altri popover aperti (Singleton Pattern)
        if (activePopoverClose && activePopoverClose !== closePopover) {
            activePopoverClose();
        }

        updatePosition();
        setIsOpen(true);
        onOpen?.();

        // Registra questo popover come quello attivo
        activePopoverClose = closePopover;
    }, [updatePosition, onOpen, closePopover]);

    useImperativeHandle(ref, () => ({
        close: closePopover,
        open: openPopover
    }));

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            openPopover();
        } else {
            closePopover();
        }
    };

    // Gestione Reposition su Resize e SCROLL (Capture mode per sticky headers)
    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // true = capture

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    useGlobalModalEscape(isOpen, closePopover);

    // Gestione chiusura esterna (Click Outside)
    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideInteraction = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                closePopover();
            }
        };

        window.addEventListener('mousedown', handleOutsideInteraction);

        return () => {
            window.removeEventListener('mousedown', handleOutsideInteraction);
        };
    }, [isOpen, closePopover]);

    const renderPanel = () => {
        if (!isOpen) return null;

        const style: React.CSSProperties = {
            top: `${pos.top}px`,
            position: 'fixed',
            zIndex: Z_OVERLAY
        };

        if (alignment === 'right') {
            style.right = `${pos.right}px`;
        } else {
            style.left = `${pos.left}px`;
        }

        if (width) {
            style.width = width;
        }

        return createPortal(
            <div
                ref={panelRef}
                id={`header-popover-panel-${uniqueId}`}
                className={`animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl pointer-events-auto cursor-default shadow-2xl ${className}`}
                style={style}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>,
            document.body
        );
    };

    return (
        <div className="relative flex items-center">
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="cursor-pointer"
            >
                {trigger}
            </div>
            {renderPanel()}
        </div>
    );
});




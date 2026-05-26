import React from 'react';
import { createPortal } from 'react-dom';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';

export type FullscreenModalMaxWidth = '4xl' | '7xl' | 'full' | 'screen';

const MAX_WIDTH_CLASS: Record<FullscreenModalMaxWidth, string> = {
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
    screen: 'max-w-[98vw]',
};

export interface BaseFullscreenModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    /** Override ESC handler (e.g. nested back navigation). Defaults to onClose. */
    onEscape?: () => void;
    children: React.ReactNode;
    /** Optional header slot rendered above scrollable body. */
    header?: React.ReactNode;
    maxWidth?: FullscreenModalMaxWidth;
    /** Panel height: full viewport below chrome (default) or auto. */
    fullHeight?: boolean;
    /** Extra classes on the inner panel. */
    panelClassName?: string;
    /** Outer overlay padding (default: p-0 md:p-4). */
    padding?: string;
    /** Click on overlay backdrop closes modal (default true). */
    closeOnOverlayClick?: boolean;
    /** Render standard CloseButton (default true). Set false when header supplies its own. */
    showCloseButton?: boolean;
    /** When true, CloseButton is rendered inside the header slot area. */
    closeButtonInHeader?: boolean;
    closeButtonClassName?: string;
}

/**
 * BaseFullscreenModalShell — canonical consumer fullscreen modal contract.
 *
 * - Portal: document.body
 * - Overlay: td-modal-overlay (chrome-safe top, NO local backdrop)
 * - Dimming: FocusOverlay (modalDim) via UIMode policy in AppCoordinator
 * - ESC: single useGlobalModalEscape registration (CloseButton withEscape=false)
 * - z-index: Z_OVERLAY (overlay) / Z_MODAL (panel) from registry
 */
export const BaseFullscreenModalShell: React.FC<BaseFullscreenModalShellProps> = ({
    isOpen,
    onClose,
    onEscape,
    children,
    header,
    maxWidth = '7xl',
    fullHeight = true,
    panelClassName = '',
    padding = 'p-0 md:p-4',
    closeOnOverlayClick = true,
    showCloseButton = true,
    closeButtonInHeader = true,
    closeButtonClassName = 'top-3 right-3 md:top-4 md:right-4',
}) => {
    const handleEscape = onEscape ?? onClose;
    useGlobalModalEscape(isOpen, handleEscape);

    if (!isOpen || typeof document === 'undefined') return null;

    const heightClass = fullHeight ? 'h-full' : 'max-h-full';

    return createPortal(
        <div
            className={`td-modal-overlay flex items-center justify-center animate-in fade-in ${padding}`}
            style={{ zIndex: Z_OVERLAY }}
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            <div
                className={`
                    relative bg-[#020617] w-full ${MAX_WIDTH_CLASS[maxWidth]} ${heightClass}
                    rounded-none md:rounded-xl border-x-0 md:border border-slate-800
                    shadow-2xl overflow-hidden flex flex-col
                    animate-in zoom-in-95 pointer-events-auto
                    ${panelClassName}
                `.trim()}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >
                {header != null && (
                    <div className="shrink-0 relative">
                        {header}
                        {showCloseButton && closeButtonInHeader && (
                            <CloseButton
                                onClose={onClose}
                                variant="primary"
                                position="absolute"
                                className={closeButtonClassName}
                                withEscape={false}
                            />
                        )}
                    </div>
                )}

                {!header && showCloseButton && (
                    <CloseButton
                        onClose={onClose}
                        variant="primary"
                        position="absolute"
                        className={`${closeButtonClassName} z-10`}
                        withEscape={false}
                    />
                )}

                <div className="flex flex-1 flex-col min-h-0 overflow-hidden relative">
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    );
};

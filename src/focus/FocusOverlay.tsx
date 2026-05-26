import React from 'react';
import { Z_FOCUS_DIM, Z_OVERLAY } from '@/constants/zIndex';
import { useFocusMode } from './FocusModeContext';

/**
 * Unified focus overlay — visual dimming driven by UIMode policy.
 *
 * workspaceDim (Z_FOCUS_DIM):
 *   Covers viewport below header. Sits ABOVE inline dimmedBackground surfaces
 *   (sidebar widgets, home hero) and BELOW focusCompanion / focusActive / globalChrome.
 *
 * modalDim (Z_OVERLAY):
 *   Classic consumer modal / preview dim stack. Chrome-safe top offset.
 *   backdrop-blur ONLY when active (GPU compositing bug otherwise).
 */
export const FocusOverlay: React.FC = () => {
  const { overlayKind, closeFocus } = useFocusMode();

  if (overlayKind === 'workspaceDim') {
    return (
      <div
        id="focus-dim-overlay"
        role="presentation"
        aria-hidden="true"
        onClick={closeFocus}
        className="
          fixed top-[var(--header-height)] left-0 right-0 bottom-0
          bg-black/60 backdrop-blur-sm
          pointer-events-auto cursor-pointer
          select-none
          animate-in fade-in duration-300
        "
        style={{ zIndex: Z_FOCUS_DIM }}
        data-focus-overlay="workspace"
      />
    );
  }

  if (overlayKind === 'modalDim') {
    return (
      <div
        id="focus-overlay"
        role="presentation"
        aria-hidden="true"
        onClick={closeFocus}
        className="
          fixed top-[var(--header-height)] left-0 right-0 bottom-0
          bg-black/60 backdrop-blur-sm
          pointer-events-auto cursor-pointer
          select-none
          animate-in fade-in duration-500
        "
        style={{ zIndex: Z_OVERLAY }}
        data-focus-overlay="modal"
      />
    );
  }

  return null;
};

import { Z_FOCUS_ACTIVE } from '@/constants/zIndex';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { SuitcaseFloatingPanelBody } from './SuitcaseFloatingPanel/SuitcaseFloatingPanelBody';
import { useFloatingPanelShellLifecycle } from './SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { useSuitcasePanelComposition } from './SuitcaseFloatingPanel/hooks/useSuitcasePanelComposition';

interface Props {
  itineraryId: string | null;
  cityType?: string;
  suitcaseId?: string | null;
}

export const SuitcaseFloatingPanel: React.FC<Props> = ({
  itineraryId,
  cityType,
  suitcaseId,
}) => {
  const closeAttemptRef = useRef<() => void>(() => {});

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'packingList',
    onCloseAttempt: () => closeAttemptRef.current(),
  });

  const composition = useSuitcasePanelComposition({
    itineraryId,
    cityType,
    suitcaseId,
    requestClose: shell.requestClose,
    registerCloseAttempt: (handler) => {
      closeAttemptRef.current = handler;
    },
  });

  if (!shell.isPortalReady) return null;

  return createPortal(
    <div
      ref={shell.panelRef}
      data-testid="suitcase-root"
      data-focus-surface={FOCUS_SURFACE_ATTR.focusActive}
      className={`
        fixed bottom-0 flex flex-col min-h-0 h-screen lg:h-[70vh] pointer-events-auto
        bg-slate-900 border-t border-indigo-500/20 rounded-t-3xl shadow-2xl
        transition-transform duration-500
        ${shell.isPanelRaised ? 'translate-y-0' : 'translate-y-full'}
        ${shell.isClosing ? 'ease-in' : 'ease-out'}
      `}
      style={{ zIndex: Z_FOCUS_ACTIVE, ...composition.panelInsetStyle }}
    >
      <SuitcaseFloatingPanelBody composition={composition} />
    </div>,
    document.body
  );
};

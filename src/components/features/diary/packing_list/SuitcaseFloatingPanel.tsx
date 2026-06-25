import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { useUI } from '@/context/UIContext';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import { resolveWorkspaceShellGeometry } from '@/layering/resolveWorkspaceShellGeometry';
import {
  resolveCompanionSurfaceTier,
  resolveWorkspacePanelZIndex,
} from '@/layering/resolveWorkspacePanelZIndex';
import React, { useRef, useState } from 'react';
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
  const { mobileDiaryFullScreen, isMobile } = useUI();
  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen })
  );
  const isElevated = panelZIndex === Z_MODAL_NESTED;

  const closeAttemptRef = useRef<() => void>(() => {});
  const [suppressShellEscape, setSuppressShellEscape] = useState(false);

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'packingList',
    onCloseAttempt: () => closeAttemptRef.current(),
    suppressEscape: suppressShellEscape,
  });

  const composition = useSuitcasePanelComposition({
    itineraryId,
    cityType,
    suitcaseId,
    requestClose: shell.requestClose,
    registerCloseAttempt: (handler) => {
      closeAttemptRef.current = handler;
    },
    onOverlayModalOpenChange: setSuppressShellEscape,
  });

  if (!shell.isPortalReady) return null;

  return createPortal(
    <div
      ref={shell.panelRef}
      data-testid="suitcase-root"
      data-focus-surface={FOCUS_SURFACE_ATTR.focusActive}
      data-workspace-elevated={isElevated ? 'true' : undefined}
      className={`
        fixed bottom-0 left-0 right-0 flex flex-col min-h-0 lg:h-[70vh] pointer-events-auto
        bg-slate-900 border-t border-indigo-500/20 rounded-t-3xl shadow-2xl
        transition-transform duration-500
        ${shell.isPanelRaised ? 'translate-y-0' : 'translate-y-full'}
        ${shell.isClosing ? 'ease-in' : 'ease-out'}
      `}
      style={{
        zIndex: panelZIndex,
        ...resolveWorkspaceShellGeometry(isMobile),
        ...composition.panelInsetStyle,
      }}
    >
      <SuitcaseFloatingPanelBody composition={composition} />
    </div>,
    document.body
  );
};

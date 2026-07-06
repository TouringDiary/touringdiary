import { useUI } from '@/context/UIContext';
import { useUser } from '@/context/UserContext';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import { resolveCollaborationWorkspaceShellGeometry } from '@/layering/resolveCollaborationWorkspaceShellGeometry';
import {
  SLIDE_PANEL_TRANSITION_CLASS,
  slidePanelEaseClass,
  slidePanelTransformClass,
  slidePanelTransformClassByAxis,
} from '@/constants/slidePanelMotion';
import { resolveWorkspacePanelZIndex, resolveCompanionSurfaceTier } from '@/layering/resolveWorkspacePanelZIndex';
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { CollaborationWorkspacePanelBody } from './CollaborationWorkspacePanelBody';

interface Props {
  workspaceId: string;
}

/**
 * Dashboard Workspace laterale (§12.3).
 * Desktop: pannello da destra; mobile: bottom sheet.
 */
export const CollaborationWorkspacePanel: React.FC<Props> = ({ workspaceId }) => {
  const { user } = useUser();
  const { isMobile, mobileDiaryFullScreen } = useUI();
  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen })
  );

  const closeAttemptRef = useRef<() => void>(() => {});

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'collaborationWorkspace',
    onCloseAttempt: () => closeAttemptRef.current(),
  });

  if (!shell.isPortalReady || !user || user.role === 'guest') return null;

  const geometry = resolveCollaborationWorkspaceShellGeometry(isMobile, !mobileDiaryFullScreen);
  const transformClass = isMobile
    ? slidePanelTransformClass(shell.isPanelRaised)
    : slidePanelTransformClassByAxis('x', shell.isPanelRaised);

  return createPortal(
    <div
      ref={shell.panelRef}
      data-testid="collaboration-workspace-root"
      data-focus-surface={FOCUS_SURFACE_ATTR.focusActive}
      className={`
        fixed flex flex-col min-h-0 pointer-events-auto
        bg-slate-900 border-indigo-500/20 shadow-2xl
        ${isMobile ? 'bottom-0 left-0 right-0 border-t rounded-t-3xl' : 'border-l'}
        ${SLIDE_PANEL_TRANSITION_CLASS}
        ${transformClass}
        ${slidePanelEaseClass(shell.isClosing)}
      `}
      style={{
        zIndex: panelZIndex,
        ...geometry,
      }}
    >
      <CollaborationWorkspacePanelBody
        workspaceId={workspaceId}
        user={user}
        requestClose={shell.requestClose}
        registerCloseHandler={(handler) => {
          closeAttemptRef.current = handler;
        }}
      />
    </div>,
    document.body
  );
};

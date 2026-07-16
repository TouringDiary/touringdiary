import { useUI } from '@/context/UIContext';
import { useUser } from '@/context/UserContext';
import { useModal } from '@/context/ModalContext';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import { resolveGlobalWorkspacePanelGeometry } from '@/layering/resolveGlobalWorkspacePanelGeometry';
import {
  BINDER_PANEL_TRANSITION_CLASS,
  binderPanelMaxHeightClass,
  binderPanelMinHeightClass,
  slidePanelEaseClass,
} from '@/constants/slidePanelMotion';
import { resolveWorkspacePanelZIndex, resolveCompanionSurfaceTier } from '@/layering/resolveWorkspacePanelZIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { GlobalWorkspacePanelBody } from './GlobalWorkspacePanelBody';
import type { WorkspacePanelSection } from './globalWorkspacePresentation';

/**
 * Hub Workspace globale — pannello ~95% width con espansione top-origin (raccoglitore).
 */
export const GlobalWorkspacePanel: React.FC = () => {
  const { user } = useUser();
  const { isMobile, mobileDiaryFullScreen } = useUI();

  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen })
  );

  const reserveBottomNav = !mobileDiaryFullScreen;

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'collaborationWorkspace',
    closeTransitionProperties: ['max-height'],
  });

  if (!shell.isPortalReady || !user || user.role === 'guest') return null;

  const geometry = resolveGlobalWorkspacePanelGeometry(isMobile, reserveBottomNav);

  return createPortal(
    <div
      ref={shell.panelRef}
      id="global-workspace-panel"
      data-testid="collaboration-workspace-root"
      data-focus-surface={FOCUS_SURFACE_ATTR.focusActive}
      className={`
        fixed flex flex-col min-h-0 pointer-events-auto origin-top
        ${BINDER_PANEL_TRANSITION_CLASS}
        ${binderPanelMaxHeightClass(shell.isPanelRaised, isMobile, reserveBottomNav)}
        ${binderPanelMinHeightClass(shell.isPanelRaised, isMobile, reserveBottomNav)}
        ${slidePanelEaseClass(shell.isClosing)}
      `}
      style={{
        zIndex: panelZIndex,
        ...geometry,
      }}
    >
      <GlobalWorkspacePanelBody />
    </div>,
    document.body
  );
};

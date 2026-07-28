import { useUI } from '@/context/UIContext';
import { useUser } from '@/context/UserContext';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import { resolveGlobalWorkspacePanelGeometry } from '@/layering/resolveGlobalWorkspacePanelGeometry';
import {
  binderPanelMaxHeightClass,
  binderPanelMinHeightClass,
  SLIDE_PANEL_TRANSITION_CLASS,
  slidePanelEaseClass,
  slidePanelTransformClassFromTop,
} from '@/constants/slidePanelMotion';
import { resolveWorkspacePanelZIndex, resolveCompanionSurfaceTier } from '@/layering/resolveWorkspacePanelZIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { GlobalWorkspacePanelBody } from './GlobalWorkspacePanelBody';

/**
 * Hub Workspace globale — pannello ~95% width, slide dall'alto (stesso lifecycle Valigia).
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
  });

  if (!shell.isPortalReady || !user || user.role === 'guest') return null;

  const geometry = resolveGlobalWorkspacePanelGeometry(isMobile, reserveBottomNav);

  return createPortal(
    <div
      id="global-workspace-panel"
      data-testid="collaboration-workspace-root"
      data-focus-surface={FOCUS_SURFACE_ATTR.focusActive}
      className={`
        fixed flex flex-col min-h-0 overflow-hidden
        ${shell.isPanelRaised ? 'pointer-events-auto' : 'pointer-events-none'}
      `}
      style={{
        zIndex: panelZIndex,
        ...geometry,
      }}
    >
      <div
        ref={shell.panelRef}
        className={`
          flex flex-col min-h-0 pointer-events-auto w-full h-full
          ${SLIDE_PANEL_TRANSITION_CLASS}
          ${slidePanelTransformClassFromTop(shell.isPanelRaised)}
          ${slidePanelEaseClass(shell.isClosing)}
          ${binderPanelMaxHeightClass(true, isMobile, reserveBottomNav)}
          ${binderPanelMinHeightClass(true, isMobile, reserveBottomNav)}
        `}
      >
        <header className="flex items-center justify-end gap-3 px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-950/95 backdrop-blur-md rounded-t-xl">
          <CloseButton
            onClose={shell.requestClose}
            variant="primary"
            withEscape={false}
            className="shrink-0"
          />
        </header>
        <GlobalWorkspacePanelBody />
      </div>
    </div>,
    document.body
  );
};

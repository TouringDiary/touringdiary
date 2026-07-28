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
import { Briefcase, Home, type LucideIcon } from 'lucide-react';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { useModal } from '@/context/ModalContext';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { MyWorldBreadcrumb } from './MyWorldBreadcrumb';

type ChooserAccent = 'amber' | 'indigo';

const CHOOSER_CARD_ACCENT: Record<
  ChooserAccent,
  { borderHover: string; iconWrap: string }
> = {
  amber: {
    borderHover: 'hover:border-amber-500/50',
    iconWrap: 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20',
  },
  indigo: {
    borderHover: 'hover:border-indigo-500/50',
    iconWrap: 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20',
  },
};

/** Card locale del chooser — non riusata fuori da questo pannello. */
const MyWorldChooserCard: React.FC<{
  title: string;
  description: string;
  accent: ChooserAccent;
  Icon: LucideIcon;
  onClick: () => void;
}> = ({ title, description, accent, Icon, onClick }) => {
  const styles = CHOOSER_CARD_ACCENT[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group flex flex-col items-start gap-3 p-5 min-h-[10rem] rounded-2xl text-left
        bg-slate-900/80 border border-slate-700 ${styles.borderHover}
        hover:bg-slate-900 transition-colors
      `}
    >
      <span className={`p-2.5 rounded-xl ${styles.iconWrap}`}>
        <Icon className="w-6 h-6" />
      </span>
      <span>
        <span className="block text-base font-bold text-white">{title}</span>
        <span className="block text-xs text-slate-400 mt-1 leading-relaxed">
          {description}
        </span>
      </span>
    </button>
  );
};

/**
 * Chooser MyWorld — scelta MySpace | Workspace (D2).
 * Ramo Workspace riusa l'hub esistente senza modificarne il comportamento interno.
 */
export const MyWorldChooserPanel: React.FC = () => {
  const { user } = useUser();
  const { isMobile, mobileDiaryFullScreen } = useUI();
  const { openModal } = useModal();
  const openCollaborationWorkspace = useOpenCollaborationWorkspace();

  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen }),
  );
  const reserveBottomNav = !mobileDiaryFullScreen;

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'myWorld',
  });

  if (!shell.isPortalReady || !user || user.role === 'guest') return null;

  const geometry = resolveGlobalWorkspacePanelGeometry(isMobile, reserveBottomNav);

  const openMySpace = () => {
    openModal('mySpace');
  };

  const openWorkspace = () => {
    openCollaborationWorkspace();
  };

  return createPortal(
    <div
      id="myworld-chooser-panel"
      data-testid="myworld-chooser-root"
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
          bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-b-xl shadow-2xl
          ${SLIDE_PANEL_TRANSITION_CLASS}
          ${slidePanelTransformClassFromTop(shell.isPanelRaised)}
          ${slidePanelEaseClass(shell.isClosing)}
          ${binderPanelMaxHeightClass(true, isMobile, reserveBottomNav)}
          ${binderPanelMinHeightClass(true, isMobile, reserveBottomNav)}
        `}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <MyWorldBreadcrumb crumbs={[{ id: 'myWorld', label: 'MyWorld' }]} />
          <CloseButton
            onClose={shell.requestClose}
            variant="primary"
            withEscape={false}
            className="shrink-0"
          />
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MyWorldChooserCard
                title="MySpace"
                description="Consulta i viaggi ed i documenti personali!"
                accent="amber"
                Icon={Home}
                onClick={openMySpace}
              />
              <MyWorldChooserCard
                title="Workspace"
                description="Collabora e condividi il viaggio con i tuoi amici!"
                accent="indigo"
                Icon={Briefcase}
                onClick={openWorkspace}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

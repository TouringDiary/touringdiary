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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { useModal } from '@/context/ModalContext';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { MyWorldBreadcrumb, type MyWorldCrumb } from '@/components/myworld/MyWorldBreadcrumb';
import {
  getMySpaceRoot,
  MY_SPACE_DEFAULT_ROOT,
  type MySpaceRootId,
} from '@/myspace/mySpaceRoots';
import {
  MY_SPACE_TRIPS_CATALOG,
  openTripsFolder,
  type MySpaceTripsView,
} from '@/myspace/mySpaceTripsSession';
import {
  getViaggioFolderSection,
  VIAGGIO_FOLDER_DEFAULT_SECTION,
  type ViaggioFolderSectionId,
} from '@/myspace/viaggioFolderSections';
import {
  loadMySpaceNavMemory,
  saveMySpaceNavMemory,
} from '@/myspace/mySpaceNavMemory';
import type { Viaggio } from '@/types/models/Viaggio';
import { MySpaceRootNav } from './MySpaceRootNav';
import { MySpaceTripsCatalog } from './MySpaceTripsCatalog';
import { ViaggioFolderShell } from './ViaggioFolderShell';
import { MySpaceFavoritesRoot } from './MySpaceFavoritesRoot';
import { MySpaceExplorerRoot } from './MySpaceExplorerRoot';
import { MySpaceToolsRoot } from './MySpaceToolsRoot';
import { MySpaceInvitesRoot } from './MySpaceInvitesRoot';

function parseInitialTripsView(raw: unknown): MySpaceTripsView | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as MySpaceTripsView;
  if (v.kind === 'catalog') return MY_SPACE_TRIPS_CATALOG;
  if (v.kind === 'folder' && typeof v.viaggioId === 'string' && v.section) {
    return openTripsFolder(v.viaggioId, v.section as ViaggioFolderSectionId);
  }
  return null;
}

/**
 * Shell MySpace — DOC 35; memoria path completo (MP-02 STEP-1).
 */
export const MySpaceMinimalShell: React.FC = () => {
  const { user } = useUser();
  const { isMobile, mobileDiaryFullScreen } = useUI();
  const { openModal, modalProps } = useModal();

  const restoredRef = useRef(false);
  const initialFromProps = parseInitialTripsView(modalProps?.initialTripsView);
  const initialRootProp =
    typeof modalProps?.initialRoot === 'string'
      ? (modalProps.initialRoot as MySpaceRootId)
      : null;

  const [activeRoot, setActiveRoot] = useState<MySpaceRootId>(
    initialRootProp || MY_SPACE_DEFAULT_ROOT,
  );
  const [tripsView, setTripsView] = useState<MySpaceTripsView>(
    initialFromProps || MY_SPACE_TRIPS_CATALOG,
  );
  const [folderTitle, setFolderTitle] = useState<string | null>(
    typeof modalProps?.folderTitle === 'string' ? modalProps.folderTitle : null,
  );

  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen }),
  );
  const reserveBottomNav = !mobileDiaryFullScreen;

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'mySpace',
  });

  /** Restore da sessionStorage se non aperto con deep link. */
  useEffect(() => {
    if (!user?.id || restoredRef.current) return;
    restoredRef.current = true;
    if (initialFromProps) return;
    const mem = loadMySpaceNavMemory(user.id);
    if (!mem) return;
    setActiveRoot(mem.activeRoot);
    setTripsView(mem.tripsView);
    setFolderTitle(mem.folderTitle ?? null);
  }, [user?.id, initialFromProps]);

  const persistNav = useCallback(() => {
    if (!user?.id) return;
    saveMySpaceNavMemory(user.id, {
      activeRoot,
      tripsView,
      folderTitle,
    });
  }, [user?.id, activeRoot, tripsView, folderTitle]);

  /** Autosave path su ogni cambio navigazione interna. */
  useEffect(() => {
    if (!user?.id) return;
    persistNav();
  }, [user?.id, persistNav]);

  const resetTripsToCatalog = useCallback(() => {
    setTripsView(MY_SPACE_TRIPS_CATALOG);
    setFolderTitle(null);
  }, []);

  const handleViaggioLoaded = useCallback((viaggio: Viaggio | null) => {
    setFolderTitle(viaggio?.title ?? null);
  }, []);

  if (!shell.isPortalReady || !user || user.role === 'guest') return null;

  const geometry = resolveGlobalWorkspacePanelGeometry(isMobile, reserveBottomNav);
  const currentRoot = getMySpaceRoot(activeRoot);

  const goMyWorld = () => {
    persistNav();
    openModal('myWorld');
  };

  const goMySpaceRoot = () => {
    setActiveRoot(MY_SPACE_DEFAULT_ROOT);
    resetTripsToCatalog();
  };

  const handleRootNavigate = (root: MySpaceRootId) => {
    setActiveRoot(root);
    if (root !== 'trips') {
      resetTripsToCatalog();
    }
  };

  const handleOpenViaggio = (viaggioId: string) => {
    setFolderTitle(null);
    setTripsView(openTripsFolder(viaggioId, VIAGGIO_FOLDER_DEFAULT_SECTION));
  };

  const handleSectionChange = (section: ViaggioFolderSectionId) => {
    setTripsView((prev) =>
      prev.kind === 'folder' ? { ...prev, section } : prev,
    );
  };

  const crumbs: MyWorldCrumb[] = [
    { id: 'myWorld', label: 'MyWorld', onClick: goMyWorld },
    { id: 'mySpace', label: 'MySpace', onClick: goMySpaceRoot },
  ];

  if (activeRoot === 'trips') {
    crumbs.push({
      id: 'trips',
      label: currentRoot.label,
      onClick: resetTripsToCatalog,
    });
    if (tripsView.kind === 'folder') {
      crumbs.push({
        id: tripsView.viaggioId,
        label: folderTitle || 'Viaggio',
        onClick: () => handleSectionChange(VIAGGIO_FOLDER_DEFAULT_SECTION),
      });
      if (tripsView.section !== VIAGGIO_FOLDER_DEFAULT_SECTION) {
        crumbs.push({
          id: tripsView.section,
          label: getViaggioFolderSection(tripsView.section).label,
          onClick: () => handleSectionChange(tripsView.section),
        });
      }
    }
  } else {
    crumbs.push({
      id: currentRoot.id,
      label: currentRoot.label,
      onClick: () => handleRootNavigate(currentRoot.id),
    });
  }

  return createPortal(
    <div
      id="myspace-shell-panel"
      data-testid="myspace-shell-root"
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
        <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0">
          <MyWorldBreadcrumb crumbs={crumbs} />
          <CloseButton
            onClose={() => {
              persistNav();
              shell.requestClose();
            }}
            variant="primary"
            withEscape={false}
            className="shrink-0"
          />
        </header>

        <MySpaceRootNav activeRoot={activeRoot} onNavigate={handleRootNavigate} />

        {activeRoot === 'trips' ? (
          tripsView.kind === 'catalog' ? (
            <MySpaceTripsCatalog
              userId={user.id}
              onOpenViaggio={handleOpenViaggio}
              onBeforeLeaveMySpace={persistNav}
            />
          ) : (
            <ViaggioFolderShell
              viaggioId={tripsView.viaggioId}
              userId={user.id}
              section={tripsView.section}
              onSectionChange={handleSectionChange}
              onBackToCatalog={resetTripsToCatalog}
              onViaggioLoaded={handleViaggioLoaded}
              onDeleted={resetTripsToCatalog}
              onBeforeLeaveMySpace={persistNav}
            />
          )
        ) : activeRoot === 'favorites' ? (
          <MySpaceFavoritesRoot userId={user.id} />
        ) : activeRoot === 'explorer' ? (
          <MySpaceExplorerRoot userId={user.id} />
        ) : activeRoot === 'tools' ? (
          <MySpaceToolsRoot userId={user.id} onBeforeLeaveMySpace={persistNav} />
        ) : activeRoot === 'invites' ? (
          <MySpaceInvitesRoot userId={user.id} onBeforeLeaveMySpace={persistNav} />
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

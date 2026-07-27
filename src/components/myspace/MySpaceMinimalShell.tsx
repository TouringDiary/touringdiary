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
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFloatingPanelShellLifecycle } from '@/components/features/diary/packing_list/SuitcaseFloatingPanel/hooks/useFloatingPanelShellLifecycle';
import { useModal } from '@/context/ModalContext';
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
import type { Viaggio } from '@/types/models/Viaggio';
import { MySpaceRootNav } from './MySpaceRootNav';
import { MySpaceSectionPlaceholder } from './MySpaceSectionPlaceholder';
import { MySpaceTripsCatalog } from './MySpaceTripsCatalog';
import { ViaggioFolderShell } from './ViaggioFolderShell';

/**
 * Shell MySpace — root navigabili; root «I miei Viaggi» = catalogo/cartella Viaggio (MP-01 STEP-2).
 * Altre root = placeholder. Preferiti / packing / roadbook / collab = STEP successivi.
 */
export const MySpaceMinimalShell: React.FC = () => {
  const { user } = useUser();
  const { isMobile, mobileDiaryFullScreen } = useUI();
  const { openModal } = useModal();
  const [activeRoot, setActiveRoot] = useState<MySpaceRootId>(MY_SPACE_DEFAULT_ROOT);
  const [tripsView, setTripsView] = useState<MySpaceTripsView>(MY_SPACE_TRIPS_CATALOG);
  const [folderTitle, setFolderTitle] = useState<string | null>(null);

  const panelZIndex = resolveWorkspacePanelZIndex(
    resolveCompanionSurfaceTier({ mobileDiaryFullScreen }),
  );
  const reserveBottomNav = !mobileDiaryFullScreen;

  const shell = useFloatingPanelShellLifecycle({
    workspaceId: 'mySpace',
  });

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
    openModal('myWorld');
  };

  /** Click MySpace → root default + catalogo. */
  const goMySpaceRoot = () => {
    setActiveRoot(MY_SPACE_DEFAULT_ROOT);
    resetTripsToCatalog();
  };

  const handleRootNavigate = (root: MySpaceRootId) => {
    setActiveRoot(root);
    // Reset stato locale del root che si lascia (oggi: solo trips).
    // Estensione futura: qui i reset di explorer / favorites / tools quando avranno sessione interna.
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
      onClick: tripsView.kind === 'folder' ? resetTripsToCatalog : undefined,
    });
    if (tripsView.kind === 'folder') {
      crumbs.push({
        id: tripsView.viaggioId,
        label: folderTitle || 'Viaggio',
        onClick:
          tripsView.section !== VIAGGIO_FOLDER_DEFAULT_SECTION
            ? () => handleSectionChange(VIAGGIO_FOLDER_DEFAULT_SECTION)
            : undefined,
      });
      if (tripsView.section !== VIAGGIO_FOLDER_DEFAULT_SECTION) {
        crumbs.push({
          id: tripsView.section,
          label: getViaggioFolderSection(tripsView.section).label,
        });
      }
    }
  } else {
    crumbs.push({ id: currentRoot.id, label: currentRoot.label });
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
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <MyWorldBreadcrumb crumbs={crumbs} />
          <button
            type="button"
            onClick={shell.requestClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Chiudi MySpace"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <MySpaceRootNav activeRoot={activeRoot} onNavigate={handleRootNavigate} />

        {activeRoot === 'trips' ? (
          tripsView.kind === 'catalog' ? (
            <MySpaceTripsCatalog userId={user.id} onOpenViaggio={handleOpenViaggio} />
          ) : (
            <ViaggioFolderShell
              viaggioId={tripsView.viaggioId}
              userId={user.id}
              section={tripsView.section}
              onSectionChange={handleSectionChange}
              onBackToCatalog={resetTripsToCatalog}
              onViaggioLoaded={handleViaggioLoaded}
            />
          )
        ) : (
          <MySpaceSectionPlaceholder root={currentRoot} />
        )}
      </div>
    </div>,
    document.body,
  );
};

import React, { Suspense, useEffect } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import {
  isMyWorldFamilyModal,
  saveLastMyWorldSurface,
  type MyWorldFamilyModalKey,
} from '@/myworld/myWorldSession';
import { resolveWorkspaceId } from './focusModeRegistry';
import { useWorkspaceSessionEnd } from './useWorkspaceSessionEnd';

const SuitcaseFloatingPanel = React.lazy(() =>
  import('@/components/features/diary/packing_list/SuitcaseFloatingPanel').then((module) => ({
    default: module.SuitcaseFloatingPanel,
  }))
);

const GlobalWorkspacePanel = React.lazy(() =>
  import('@/components/workspace/global/GlobalWorkspacePanel').then((module) => ({
    default: module.GlobalWorkspacePanel,
  }))
);

const MyWorldChooserPanel = React.lazy(() =>
  import('@/components/myworld/MyWorldChooserPanel').then((module) => ({
    default: module.MyWorldChooserPanel,
  }))
);

const MySpaceMinimalShell = React.lazy(() =>
  import('@/components/myspace/MySpaceMinimalShell').then((module) => ({
    default: module.MySpaceMinimalShell,
  }))
);

/**
 * Mounts workspace focus panels (NOT classic modals) based on active modal key.
 */
export const WorkspaceHost: React.FC = () => {
  const { activeModal, modalProps, closeModal } = useModal();
  const { user } = useUser();
  const workspaceId = resolveWorkspaceId(activeModal);

  useWorkspaceSessionEnd(workspaceId, closeModal);

  /** Memorizza l’ultima superficie MyWorld attiva (non packing / altri modal). */
  useEffect(() => {
    if (!user?.id || !isMyWorldFamilyModal(activeModal)) return;
    saveLastMyWorldSurface(user.id, activeModal as MyWorldFamilyModalKey);
  }, [activeModal, user?.id]);

  if (!workspaceId) return null;

  switch (workspaceId) {
    case 'packingList':
      return (
        <Suspense fallback={null}>
          <SuitcaseFloatingPanel
            itineraryId={modalProps?.itineraryId || null}
            cityType={modalProps?.cityType}
            suitcaseId={modalProps?.suitcaseId}
            initialAction={modalProps?.initialAction}
          />
        </Suspense>
      );
    case 'collaborationWorkspace':
      return (
        <Suspense fallback={null}>
          <GlobalWorkspacePanel />
        </Suspense>
      );
    case 'myWorld':
      return (
        <Suspense fallback={null}>
          <MyWorldChooserPanel />
        </Suspense>
      );
    case 'mySpace':
      return (
        <Suspense fallback={null}>
          <MySpaceMinimalShell />
        </Suspense>
      );
    default:
      return null;
  }
};

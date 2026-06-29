import React, { Suspense } from 'react';
import { useModal } from '@/context/ModalContext';
import { resolveWorkspaceId } from './focusModeRegistry';
import { useWorkspaceSessionEnd } from './useWorkspaceSessionEnd';

const SuitcaseFloatingPanel = React.lazy(() =>
  import('@/components/features/diary/packing_list/SuitcaseFloatingPanel').then((module) => ({
    default: module.SuitcaseFloatingPanel,
  }))
);

/**
 * Mounts workspace focus panels (NOT classic modals) based on active modal key.
 * Owns workspace session teardown: closeModal clears activeModal → overlay unmounts.
 */
export const WorkspaceHost: React.FC = () => {
  const { activeModal, modalProps, closeModal } = useModal();
  const workspaceId = resolveWorkspaceId(activeModal);

  useWorkspaceSessionEnd(workspaceId, closeModal);

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
    default:
      return null;
  }
};

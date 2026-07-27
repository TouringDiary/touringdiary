import { useCallback } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import { userNeedsUsername } from '@/domain/profile/username';
import { isCollaborationEngineEnabled } from '@/services/collaboration/workspaceEngineConfigService';
import type { WizardEntryMode } from '@/components/collaboration/collaborationSharePresentation';

export interface WorkspaceFromViaggioTarget {
  viaggioId: string;
  viaggioTitle?: string;
  preselectedDiaryId?: string;
}

export interface WorkspaceFromViaggioModalProps extends WorkspaceFromViaggioTarget {
  entryMode: Extract<WizardEntryMode, 'workspace_from_viaggio'>;
}

/** Entry prodotto «Workspace da Viaggio» (DOC 28 Parte A · MP-01 STEP-4). */
export function useOpenWorkspaceFromViaggio() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (target: WorkspaceFromViaggioTarget) => {
      const viaggioId = target.viaggioId?.trim();
      if (!viaggioId) return;

      const modalProps: WorkspaceFromViaggioModalProps = {
        entryMode: 'workspace_from_viaggio',
        viaggioId,
        viaggioTitle: target.viaggioTitle,
        preselectedDiaryId: target.preselectedDiaryId,
      };

      if (isGuestUser(user)) {
        requestCollaborationAuth(openModal, 'share', modalProps);
        return;
      }

      if (userNeedsUsername(user.slug)) {
        openModal('setUsername', {
          mandatory: true,
          returnTo: COLLABORATION_RETURN_TO,
          returnProps: modalProps,
        });
        return;
      }

      if (!isCollaborationEngineEnabled()) {
        return;
      }

      openModal('collaborationShare', modalProps);
    },
    [openModal, user]
  );
}

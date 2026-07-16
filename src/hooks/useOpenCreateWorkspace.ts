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

export interface CreateWorkspaceTarget {
  preselectedDiaryId?: string;
  preselectedDiaryTitle?: string;
}

export interface CreateWorkspaceModalProps extends CreateWorkspaceTarget {
  entryMode: Extract<WizardEntryMode, 'create_workspace'>;
}

export function useOpenCreateWorkspace() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (target?: CreateWorkspaceTarget) => {
      const modalProps: CreateWorkspaceModalProps = {
        entryMode: 'create_workspace',
        preselectedDiaryId: target?.preselectedDiaryId,
        preselectedDiaryTitle: target?.preselectedDiaryTitle,
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

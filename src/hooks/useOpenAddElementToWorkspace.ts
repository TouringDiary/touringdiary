import { useCallback } from 'react';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import type { WizardEntryMode } from '@/components/collaboration/collaborationSharePresentation';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { userNeedsUsername } from '@/domain/profile/username';
import { isCollaborationEngineEnabled } from '@/services/collaboration/workspaceEngineConfigService';

export interface AddElementToWorkspaceModalProps {
  entryMode: Extract<WizardEntryMode, 'add_element_to_workspace'>;
  workspaceId: string;
}

export function useOpenAddElementToWorkspace() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (workspaceId: string) => {
      const modalProps: AddElementToWorkspaceModalProps = {
        entryMode: 'add_element_to_workspace',
        workspaceId,
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
    [openModal, user],
  );
}

import { useCallback } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import { userNeedsUsername } from '@/domain/profile/username';
import type { WorkspacePanelSection } from '@/components/workspace/global/globalWorkspacePresentation';

export interface CollaborationWorkspaceTarget {
  workspaceId?: string;
  initialSection?: WorkspacePanelSection;
}

export function useOpenCollaborationWorkspace() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (target?: CollaborationWorkspaceTarget) => {
      if (isGuestUser(user)) {
        requestCollaborationAuth(openModal, 'workspace', target);
        return;
      }

      if (userNeedsUsername(user.slug)) {
        openModal('setUsername', {
          mandatory: true,
          returnTo: COLLABORATION_RETURN_TO,
          returnProps: { intent: 'workspace', ...target },
        });
        return;
      }

      openModal('collaborationWorkspace', target ?? {});
    },
    [openModal, user]
  );
}

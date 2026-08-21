import { useCallback } from 'react';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import type { SharedResourceKind } from '@/domain/collaboration';
import { userNeedsUsername } from '@/domain/profile/username';
import {
  isCollaborationEngineEnabled,
  isSharedResourceKindEnabled,
} from '@/services/collaboration/workspaceEngineConfigService';

export interface CollaborationShareTarget {
  kind: SharedResourceKind;
  resourceId: string;
  resourceTitle: string;
}

export function useOpenCollaborationShare() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (target: CollaborationShareTarget) => {
      if (isGuestUser(user)) {
        requestCollaborationAuth(openModal, 'share', target);
        return;
      }

      if (userNeedsUsername(user.slug)) {
        openModal('setUsername', {
          mandatory: true,
          returnTo: COLLABORATION_RETURN_TO,
          returnProps: target,
        });
        return;
      }

      if (!isCollaborationEngineEnabled() || !isSharedResourceKindEnabled(target.kind)) {
        return;
      }

      openModal('collaborationShare', target);
    },
    [openModal, user],
  );
}

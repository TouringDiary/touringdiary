import { useCallback } from 'react';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import { userNeedsUsername } from '@/domain/profile/username';
import type { User } from '@/types/users';
import type { WorkspacePanelSection } from '@/components/workspace/global/globalWorkspacePresentation';

export interface CollaborationWorkspaceTarget {
  workspaceId?: string;
  initialSection?: WorkspacePanelSection;
}

type OpenModalFn = (type: string, props?: object) => void;

/**
 * Flusso unico di apertura Workspace (guest → auth, username obbligatorio, altrimenti panel).
 * Usare questa funzione quando lo user di riferimento non è ancora quello del context
 * (es. resume immediato post-login).
 */
export function openCollaborationWorkspaceFlow(
  user: User | null | undefined,
  openModal: OpenModalFn,
  target?: CollaborationWorkspaceTarget,
): void {
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
}

/** Entry-point React: stesso flusso di {@link openCollaborationWorkspaceFlow} via context. */
export function useOpenCollaborationWorkspace() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(
    (target?: CollaborationWorkspaceTarget) => {
      openCollaborationWorkspaceFlow(user, openModal, target);
    },
    [openModal, user],
  );
}

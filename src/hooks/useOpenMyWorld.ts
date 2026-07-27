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

type OpenModalFn = (type: string, props?: object) => void;

/**
 * Flusso unico di apertura MyWorld (guest → auth, username obbligatorio, altrimenti chooser).
 * Deep link Workspace continuano a usare {@link openCollaborationWorkspaceFlow} (bypass chooser — D4).
 */
export function openMyWorldFlow(
  user: User | null | undefined,
  openModal: OpenModalFn,
): void {
  if (isGuestUser(user)) {
    requestCollaborationAuth(openModal, 'myworld');
    return;
  }

  if (userNeedsUsername(user.slug)) {
    openModal('setUsername', {
      mandatory: true,
      returnTo: COLLABORATION_RETURN_TO,
      returnProps: { intent: 'myworld' },
    });
    return;
  }

  openModal('myWorld');
}

/** Entry-point React: apre il chooser MyWorld. */
export function useOpenMyWorld() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(() => {
    openMyWorldFlow(user, openModal);
  }, [openModal, user]);
}

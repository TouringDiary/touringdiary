import { useCallback } from 'react';
import {
  COLLABORATION_RETURN_TO,
  isGuestUser,
  requestCollaborationAuth,
} from '@/collaboration/guestGate';
import { useModal } from '@/context/ModalContext';
import { useUser } from '@/context/UserContext';
import { userNeedsUsername } from '@/domain/profile/username';
import {
  loadLastMyWorldSurface,
  type MyWorldFamilyModalKey,
  saveLastMyWorldSurface,
} from '@/myworld/myWorldSession';
import type { ModalPropsBag } from '@/types/modalProps';
import type { User } from '@/types/users';

type OpenModalFn = (type: string, props?: ModalPropsBag) => void;

/**
 * Flusso unico di apertura MyWorld (guest → auth, username obbligatorio).
 * Se esiste una superficie precedente (MySpace / Workspace / chooser), la ripristina
 * (DOC 35 §11 — memoria path + rientro binder MyWorld). Altrimenti apre il chooser.
 * Deep link Workspace continuano a usare {@link openCollaborationWorkspaceFlow} (bypass chooser — D4).
 */
export function openMyWorldFlow(user: User | null | undefined, openModal: OpenModalFn): void {
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

  const last = loadLastMyWorldSurface(user.id);
  const target: MyWorldFamilyModalKey =
    last === 'mySpace' || last === 'collaborationWorkspace' || last === 'myWorld'
      ? last
      : 'myWorld';

  saveLastMyWorldSurface(user.id, target);
  openModal(target);
}

/** Entry-point React: apre MyWorld (o ultima posizione nella famiglia). */
export function useOpenMyWorld() {
  const { openModal } = useModal();
  const { user } = useUser();

  return useCallback(() => {
    openMyWorldFlow(user, openModal);
  }, [openModal, user]);
}

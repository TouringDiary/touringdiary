import type { ModalPropsBag } from '@/types/modalProps';
import type { User } from '@/types/users';

/** Intenti collaborativi / MyWorld (§6.1) — estesi nelle fasi successive */
export type CollaborationIntent = 'share' | 'workspace' | 'myworld';

/** Chiave returnTo ModalContext per ripresa post-login */
export const COLLABORATION_RETURN_TO = 'collaboration_resume' as const;

export function isGuestUser(
  user: User | null | undefined,
): user is null | undefined | (User & { role: 'guest' }) {
  return !user || user.role === 'guest';
}

export function requestCollaborationAuth(
  openModal: (type: string, props?: ModalPropsBag) => void,
  intent: CollaborationIntent,
  returnProps?: ModalPropsBag,
): void {
  openModal('auth', {
    returnTo: COLLABORATION_RETURN_TO,
    returnProps: { intent, ...returnProps },
  });
}

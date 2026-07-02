import { useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useModal } from '@/context/ModalContext';
import { userNeedsUsername } from '@/domain/profile/username';

/**
 * Obbliga gli utenti esistenti senza Nome utente a completare il profilo (§10.1).
 */
export function UsernameRequiredGate() {
  const { user } = useUser();
  const { activeModal, openModal } = useModal();
  const promptedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user.role === 'guest') {
      promptedForUserId.current = null;
      return;
    }

    if (!userNeedsUsername(user.slug)) {
      promptedForUserId.current = null;
      return;
    }

    if (activeModal === 'auth' || activeModal === 'setUsername') {
      return;
    }

    if (promptedForUserId.current === user.id) {
      return;
    }

    promptedForUserId.current = user.id;
    openModal('setUsername', { mandatory: true });
  }, [user.id, user.slug, user.role, activeModal, openModal]);

  return null;
}

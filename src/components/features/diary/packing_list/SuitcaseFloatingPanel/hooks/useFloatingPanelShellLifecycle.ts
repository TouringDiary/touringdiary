import { useEffect, useMemo, useState, useCallback, useRef, type RefObject } from 'react';
import type { WorkspaceId } from '@/focus/focusModeRegistry';
import { endWorkspaceSession } from '@/focus/workspaceSessionRegistry';
import { useWorkspaceCloseRegistration } from '@/focus/useWorkspaceCloseRegistration';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { usePanelEnterAnimation } from './usePanelEnterAnimation';
import { useSuitcasePanelClose } from './useSuitcasePanelClose';

interface UseFloatingPanelShellLifecycleOptions {
  workspaceId: WorkspaceId;
  /** Intercetta X / ESC / overlay prima della chiusura animata (es. modale Pausa). */
  onCloseAttempt?: () => void;
  /** Disattiva ESC del panel quando una modale overlay figlia è aperta. */
  suppressEscape?: boolean;
}

export interface FloatingPanelShellLifecycle {
  isPortalReady: boolean;
  isPanelRaised: boolean;
  isClosing: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  requestClose: () => void;
}

/**
 * Owns portal mount, enter animation, animated close, ESC, and workspace close registration.
 * Session teardown (closeModal) is owned by the focus layer via endWorkspaceSession().
 */
export function useFloatingPanelShellLifecycle({
  workspaceId,
  onCloseAttempt,
  suppressEscape = false,
}: UseFloatingPanelShellLifecycleOptions): FloatingPanelShellLifecycle {
  const [isPortalReady, setIsPortalReady] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const completeSessionRef = useRef(() => {
    endWorkspaceSession(workspaceId);
  });
  completeSessionRef.current = () => {
    endWorkspaceSession(workspaceId);
  };

  const onCloseComplete = useCallback(() => {
    completeSessionRef.current();
  }, []);

  const { panelRef, requestClose } = useSuitcasePanelClose({
    isClosing,
    isEntered,
    setIsClosing,
    onCloseComplete,
  });

  const attemptClose = useCallback(() => {
    if (onCloseAttempt) {
      onCloseAttempt();
      return;
    }
    requestClose();
  }, [onCloseAttempt, requestClose]);

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

  usePanelEnterAnimation({ panelRef, isPortalReady, setIsEntered });

  useGlobalModalEscape(isPortalReady && !isClosing && !suppressEscape, attemptClose);
  useWorkspaceCloseRegistration(workspaceId, attemptClose);

  const isPanelRaised = isEntered && !isClosing;

  return useMemo(
    () => ({
      isPortalReady,
      isPanelRaised,
      isClosing,
      panelRef,
      requestClose,
    }),
    [isPortalReady, isPanelRaised, isClosing, panelRef, requestClose]
  );
}

import { useEffect, useMemo, useState, useCallback, useRef, type RefObject } from 'react';
import type { WorkspaceId } from '@/focus/focusModeRegistry';
import { endWorkspaceSession } from '@/focus/workspaceSessionRegistry';
import { useWorkspaceCloseRegistration } from '@/focus/useWorkspaceCloseRegistration';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { usePanelEnterAnimation } from './usePanelEnterAnimation';
import { useSuitcasePanelClose } from './useSuitcasePanelClose';

interface UseFloatingPanelShellLifecycleOptions {
  workspaceId: WorkspaceId;
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

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

  usePanelEnterAnimation({ panelRef, isPortalReady, setIsEntered });

  useGlobalModalEscape(isPortalReady && !isClosing, requestClose);
  useWorkspaceCloseRegistration(workspaceId, requestClose);

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

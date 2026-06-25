import { useEffect } from 'react';
import { getBlockingExitGates } from '@/focus/exitGate/documentExitRegistry';
import { phaseBlocksExit } from '@/domain/save/documentSaveTypes';

/**
 * Browser-level protection for unsaved document changes.
 */
export function useAppExitProtection(): void {
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const blocking = getBlockingExitGates().filter(
        (g) => !g.isGuest && phaseBlocksExit(g.getPhase())
      );
      if (blocking.length === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const onPageHide = () => {
      for (const gate of getBlockingExitGates()) {
        if (!gate.isGuest && gate.getPhase() === 'dirty') {
          void gate.flush();
        }
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);
}

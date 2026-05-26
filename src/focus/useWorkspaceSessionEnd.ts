import { useLayoutEffect } from 'react';
import type { WorkspaceId } from './focusModeRegistry';
import {
  registerWorkspaceSessionEnd,
  unregisterWorkspaceSessionEnd,
} from './workspaceSessionRegistry';

/**
 * Registers ModalContext.closeModal as the focus-layer session owner for a workspace.
 * useLayoutEffect ensures registration before the panel can interact each mount.
 */
export function useWorkspaceSessionEnd(
  workspaceId: WorkspaceId | null,
  endSession: () => void
): void {
  useLayoutEffect(() => {
    if (!workspaceId) return;

    registerWorkspaceSessionEnd(workspaceId, endSession);
    return () => unregisterWorkspaceSessionEnd(workspaceId);
  }, [workspaceId, endSession]);
}

import { useLayoutEffect, useRef } from 'react';
import type { WorkspaceId } from './focusModeRegistry';
import { registerWorkspaceClose, unregisterWorkspaceClose } from './workspaceCloseRegistry';

/**
 * Registers an animated close handler for a workspace session.
 * Unregister is identity-safe: only the matching ownerId is removed.
 */
export function useWorkspaceCloseRegistration(
  workspaceId: WorkspaceId,
  requestClose: () => void
): void {
  const ownerIdRef = useRef<symbol>(Symbol('workspace-close-owner'));

  useLayoutEffect(() => {
    const ownerId = ownerIdRef.current;
    registerWorkspaceClose({ workspaceId, ownerId, requestClose });
    return () => unregisterWorkspaceClose(workspaceId, ownerId);
  }, [workspaceId, requestClose]);
}

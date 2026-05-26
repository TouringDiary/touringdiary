import type { WorkspaceId } from './focusModeRegistry';

type WorkspaceSessionEndHandler = () => void;

/**
 * Focus-layer ownership of workspace session teardown (ModalContext.closeModal).
 * WorkspaceHost registers; animated shell completes via endWorkspaceSession().
 */
const sessionEndHandlers = new Map<WorkspaceId, WorkspaceSessionEndHandler>();

export function registerWorkspaceSessionEnd(
  workspaceId: WorkspaceId,
  endSession: WorkspaceSessionEndHandler
): void {
  sessionEndHandlers.set(workspaceId, endSession);
}

export function unregisterWorkspaceSessionEnd(workspaceId: WorkspaceId): void {
  sessionEndHandlers.delete(workspaceId);
}

/** Ends the workspace focus session — clears activeModal when registered. */
export function endWorkspaceSession(workspaceId: WorkspaceId): boolean {
  const handler = sessionEndHandlers.get(workspaceId);
  if (!handler) return false;
  handler();
  return true;
}

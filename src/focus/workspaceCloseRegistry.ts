import type { WorkspaceId } from './focusModeRegistry';

type WorkspaceCloseHandler = () => void;

export interface WorkspaceCloseRegistration {
  workspaceId: WorkspaceId;
  /** Stable per-mount identity; unregister only removes matching owner. */
  ownerId: symbol;
  requestClose: WorkspaceCloseHandler;
}

/**
 * LIFO stack of animated close handlers.
 * Top entry receives backdrop/ESC delegation when workspaceId is omitted.
 * Explicit workspaceId resolves the most recent matching registration.
 */
const closeStack: WorkspaceCloseRegistration[] = [];

export function registerWorkspaceClose(entry: WorkspaceCloseRegistration): void {
  const existingIndex = closeStack.findIndex(
    (item) => item.workspaceId === entry.workspaceId && item.ownerId === entry.ownerId
  );

  if (existingIndex >= 0) {
    closeStack[existingIndex] = entry;
    return;
  }

  closeStack.push(entry);
}

export function unregisterWorkspaceClose(workspaceId: WorkspaceId, ownerId: symbol): void {
  const index = closeStack.findIndex(
    (item) => item.workspaceId === workspaceId && item.ownerId === ownerId
  );
  if (index >= 0) {
    closeStack.splice(index, 1);
  }
}

/** Returns true when a registered handler consumed the close request. */
export function requestWorkspaceClose(workspaceId?: WorkspaceId): boolean {
  if (closeStack.length === 0) {
    return false;
  }

  if (workspaceId) {
    for (let index = closeStack.length - 1; index >= 0; index -= 1) {
      if (closeStack[index].workspaceId === workspaceId) {
        closeStack[index].requestClose();
        return true;
      }
    }
    return false;
  }

  const top = closeStack[closeStack.length - 1];
  top.requestClose();
  return true;
}

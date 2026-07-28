/** Sessioni focus della famiglia MyWorld (chooser + MySpace + hub Workspace). */
export const MY_WORLD_FAMILY_MODAL_KEYS = [
  'myWorld',
  'mySpace',
  'collaborationWorkspace',
] as const;

export type MyWorldFamilyModalKey = (typeof MY_WORLD_FAMILY_MODAL_KEYS)[number];

export function isMyWorldFamilyModal(activeModal: string | null | undefined): boolean {
  if (!activeModal) return false;
  return (MY_WORLD_FAMILY_MODAL_KEYS as readonly string[]).includes(activeModal);
}

const lastSurfaceKey = (userId: string) => `td.myworld.last.${userId}`;

/**
 * Ultima superficie MyWorld visitata (chooser / MySpace / Workspace).
 * Sopravvive a closeModal; usata dal binder MyWorld per ripristinare il path (DOC 35 §11).
 */
export function saveLastMyWorldSurface(userId: string, surface: MyWorldFamilyModalKey): void {
  if (!userId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(lastSurfaceKey(userId), surface);
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadLastMyWorldSurface(userId: string): MyWorldFamilyModalKey | null {
  if (!userId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(lastSurfaceKey(userId));
    if (!raw) return null;
    if ((MY_WORLD_FAMILY_MODAL_KEYS as readonly string[]).includes(raw)) {
      return raw as MyWorldFamilyModalKey;
    }
    return null;
  } catch {
    return null;
  }
}

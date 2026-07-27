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

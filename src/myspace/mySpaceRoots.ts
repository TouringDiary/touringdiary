/**
 * Root MySpace — ordine definitivo DOC 35 / DOC 36.
 * Root «trips» = catalogo/cartella Viaggio. Altre root = Preferiti / Esploratore / Strumenti / Inviti (MP-02 STEP-3).
 */

export const MY_SPACE_ROOT_IDS = [
  'trips',
  'explorer',
  'favorites',
  'tools',
  'invites',
] as const;

export type MySpaceRootId = (typeof MY_SPACE_ROOT_IDS)[number];

export const MY_SPACE_DEFAULT_ROOT: MySpaceRootId = 'trips';

export interface MySpaceRootDefinition {
  id: MySpaceRootId;
  label: string;
  /** Empty-state silenzioso — niente CTA M2–M4, niente XP/feed. */
  placeholder: string;
}

export const MY_SPACE_ROOTS: readonly MySpaceRootDefinition[] = [
  {
    id: 'trips',
    label: 'I miei Viaggi',
    placeholder: 'Qui troverai i tuoi viaggi.',
  },
  {
    id: 'explorer',
    label: 'Esploratore',
    placeholder: 'Qui troverai la misura della tua storia.',
  },
  {
    id: 'favorites',
    label: 'Preferiti',
    placeholder: 'Qui troverai i luoghi che hai scelto di tenere.',
  },
  {
    id: 'tools',
    label: 'Strumenti',
    placeholder: 'Qui troverai i tuoi strumenti di viaggio.',
  },
  {
    id: 'invites',
    label: 'Inviti Workspace',
    placeholder: 'Qui troverai gli inviti ai Workspace.',
  },
] as const;

export function getMySpaceRoot(id: MySpaceRootId): MySpaceRootDefinition {
  const found = MY_SPACE_ROOTS.find((root) => root.id === id);
  if (!found) return MY_SPACE_ROOTS[0];
  return found;
}

export function isMySpaceRootId(value: string): value is MySpaceRootId {
  return (MY_SPACE_ROOT_IDS as readonly string[]).includes(value);
}

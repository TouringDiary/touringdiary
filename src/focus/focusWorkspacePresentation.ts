/** Etichette UI dei workspace focus (registry). Punto unico per localizzazione futura. */
export const FOCUS_WORKSPACE_LABELS = {
  packingList: 'Valigia',
  collaborationWorkspace: 'Workspace',
} as const;

/** Componenti owner del surface focusActive — literal type condiviso anti-typo. */
export const FOCUS_ACTIVE_OWNERS = {
  packingList: 'SuitcaseFloatingPanel',
  collaborationWorkspace: 'CollaborationWorkspacePanel',
} as const;

export type FocusActiveOwner =
  (typeof FOCUS_ACTIVE_OWNERS)[keyof typeof FOCUS_ACTIVE_OWNERS];

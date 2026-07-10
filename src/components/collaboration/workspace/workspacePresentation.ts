import type { WorkspaceResourceAccess } from '@/domain/collaboration';

export type WorkspacePanelTab = 'resources' | 'members' | 'invites' | 'activity' | 'attachments';

export const WORKSPACE_PANEL_TAB_LABELS: Record<WorkspacePanelTab, string> = {
  resources: 'Risorse',
  members: 'Utenti',
  invites: 'Inviti',
  activity: 'Attività',
  attachments: 'Allegati',
};

export const WORKSPACE_ACCESS_LABELS: Record<WorkspaceResourceAccess, string> = {
  none: 'Nessun accesso',
  viewer: 'Visualizzatore',
  collaborator: 'Collaboratore',
};

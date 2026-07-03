import type { WorkspaceResourceAccess } from '@/domain/collaboration';

export type WorkspacePanelTab = 'resources' | 'members' | 'invites';

export const WORKSPACE_PANEL_TAB_LABELS: Record<WorkspacePanelTab, string> = {
  resources: 'Risorse',
  members: 'Utenti',
  invites: 'Inviti',
};

export const WORKSPACE_ACCESS_LABELS: Record<WorkspaceResourceAccess, string> = {
  none: 'Nessun accesso',
  viewer: 'Visualizzatore',
  collaborator: 'Collaboratore',
};

export const WORKSPACE_FUTURE_MODULES = [
  { id: 'documents', label: 'Documenti' },
  { id: 'tickets', label: 'Biglietti' },
  { id: 'bookings', label: 'Prenotazioni' },
  { id: 'expenses', label: 'Spese' },
  { id: 'attachments', label: 'Allegati' },
] as const;

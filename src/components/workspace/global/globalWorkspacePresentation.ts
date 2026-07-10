import type { WorkspaceAttachmentCategory } from '@/domain/collaboration/workspaceAttachment';

export type WorkspacePanelSection =
  | 'workspace'
  | 'condivisione'
  | 'allegati'
  | 'attivita'
  | 'utenti'
  | 'inviti';

export type WorkspaceActiveRole = 'owner' | 'member';

export const WORKSPACE_PANEL_SECTIONS: WorkspacePanelSection[] = [
  'workspace',
  'condivisione',
  'allegati',
  'attivita',
  'utenti',
  'inviti',
];

export const WORKSPACE_PANEL_SECTION_LABELS: Record<WorkspacePanelSection, string> = {
  workspace: 'Workspace',
  condivisione: 'Condivisione',
  allegati: 'Allegati',
  attivita: 'Attività',
  utenti: 'Utenti',
  inviti: 'Inviti',
};

/** Sezioni che richiedono un workspace attivo. */
export const WORKSPACE_OPERATIONAL_SECTIONS: WorkspacePanelSection[] = [
  'condivisione',
  'allegati',
  'attivita',
  'utenti',
];

export const WORKSPACE_SECTION_REQUIRES_ACTIVE: Record<WorkspacePanelSection, boolean> = {
  workspace: false,
  condivisione: true,
  allegati: true,
  attivita: true,
  utenti: true,
  inviti: false,
};

export const WORKSPACE_ATTACHMENT_CATEGORY_LABELS: Record<WorkspaceAttachmentCategory, string> = {
  documents: 'Documenti',
  tickets: 'Biglietti',
  bookings: 'Prenotazioni',
  expenses: 'Spese',
  misc: 'Varie',
};

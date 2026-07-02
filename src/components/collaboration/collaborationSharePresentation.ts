import type { CollaborativeMemberRole, ResourceInvite, SharingMode } from '@/domain/collaboration';

export type SharePath = 'simple' | 'create_workspace' | 'add_workspace';
export type WizardStep = 'path' | 'mode' | 'invite' | 'workspace_notice';
export type ModalView = 'wizard' | 'management';

export const ROLE_LABELS: Record<CollaborativeMemberRole, string> = {
  collaborator: 'Collaboratore',
  viewer: 'Visualizzatore',
};

export const MODE_LABELS: Record<SharingMode, string> = {
  collaborative: 'Collaborativa',
  personal: 'Personale',
};

export const INVITE_STATUS_LABELS: Record<ResourceInvite['status'], string> = {
  pending: 'In attesa',
  accepted: 'Accettato',
  rejected: 'Rifiutato',
  revoked: 'Revocato',
};

export interface PendingInvite {
  userId: string;
  name: string;
  slug?: string;
  role: CollaborativeMemberRole;
}

export function getWizardStepTitle(wizardStep: WizardStep): string {
  if (wizardStep === 'path') return 'Come vuoi condividere?';
  if (wizardStep === 'mode') return 'Scegli la modalità';
  if (wizardStep === 'invite') return 'Invita collaboratori';
  return 'Workspace';
}

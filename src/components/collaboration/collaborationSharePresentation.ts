import type { CollaborativeMemberRole, ResourceInvite, SharingMode } from '@/domain/collaboration';
import type { WorkspaceResourcePermissionEntry } from '@/domain/collaboration';

export type SharePath = 'simple' | 'create_workspace' | 'add_workspace';
export type ShareIntent = 'duplicate_and_share' | 'share_current';
export type WizardStep =
  | 'path'
  | 'mode'
  | 'share_intent'
  | 'invite'
  | 'workspace_setup'
  | 'workspace_composition'
  | 'workspace_select'
  | 'workspace_invite';
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

export interface WorkspacePendingInvite {
  userId: string;
  name: string;
  slug?: string;
  permissions: WorkspaceResourcePermissionEntry[];
}

export function getWizardStepTitle(wizardStep: WizardStep, sharePath?: SharePath): string {
  if (wizardStep === 'path') return 'Come vuoi condividere?';
  if (wizardStep === 'mode') return 'Scegli la modalità';
  if (wizardStep === 'share_intent') return 'Cosa vuoi condividere?';
  if (wizardStep === 'invite') return 'Invita collaboratori';
  if (wizardStep === 'workspace_setup') return 'Configura il Workspace';
  if (wizardStep === 'workspace_composition') return 'Composizione risorse';
  if (wizardStep === 'workspace_select') return 'Scegli un Workspace';
  if (wizardStep === 'workspace_invite') return 'Invita al Workspace';
  return 'Workspace';
}

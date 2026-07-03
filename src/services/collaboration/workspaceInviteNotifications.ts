import { supabase } from '@/services/supabaseClient';
import type { Workspace } from '@/domain/collaboration';
import { getWorkspace } from './workspaceService';
import {
  notifyWorkspaceInviteAccepted,
  notifyWorkspaceInviteReceived,
  notifyWorkspaceInviteRejected,
} from './workspaceNotificationHelper';

export async function notifyWorkspaceInviteReceivedForSentInvite(
  ownerId: string,
  inviteeId: string,
  workspaceId: string,
  inviteId: string
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', ownerId)
    .maybeSingle();

  try {
    await notifyWorkspaceInviteReceived(
      inviteeId,
      inviterProfile?.name?.trim() || 'Un collaboratore',
      workspace?.name ?? 'Workspace',
      inviteId
    );
  } catch (notificationError) {
    console.error('[workspaceInviteService] notifyWorkspaceInviteReceived:', notificationError);
  }
}

export async function notifyWorkspaceInviteAcceptedForInvitee(
  workspaceOwnerId: string,
  inviteeId: string,
  workspaceName: string,
  inviteId: string
): Promise<void> {
  const { data: inviteeProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', inviteeId)
    .maybeSingle();

  try {
    await notifyWorkspaceInviteAccepted(
      workspaceOwnerId,
      inviteeProfile?.name?.trim() || 'Un collaboratore',
      workspaceName,
      inviteId
    );
  } catch (notificationError) {
    console.error('[workspaceInviteService] notifyWorkspaceInviteAccepted:', notificationError);
  }
}

export async function notifyWorkspaceInviteRejectedForInvitee(
  workspace: Workspace | null,
  inviteeId: string,
  inviteId: string
): Promise<void> {
  if (!workspace) return;

  const { data: inviteeProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', inviteeId)
    .maybeSingle();

  try {
    await notifyWorkspaceInviteRejected(
      workspace.ownerId,
      inviteeProfile?.name?.trim() || 'Un collaboratore',
      workspace.name,
      inviteId
    );
  } catch (notificationError) {
    console.error('[workspaceInviteService] notifyWorkspaceInviteRejected:', notificationError);
  }
}

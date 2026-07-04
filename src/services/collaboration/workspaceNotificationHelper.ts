import { supabase } from '@/services/supabaseClient';
import { addNotification } from '@/services/notificationService';
import { shouldDeliverCollaborationNotification } from './collaborationNotificationPrefsService';
import { getWorkspace } from './workspaceService';

async function getProfileName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle();
  return data?.name?.trim() || 'Un collaboratore';
}

async function notifyIfAllowed(
  userId: string,
  category: 'invites' | 'resource_updates' | 'workspace_updates' | 'friend_requests',
  title: string,
  message: string,
  linkData?: Parameters<typeof addNotification>[4]
): Promise<void> {
  if (!(await shouldDeliverCollaborationNotification(userId, category))) return;
  await addNotification(userId, 'collaboration', title, message, linkData);
}

export async function notifyWorkspaceInviteReceived(
  inviteeId: string,
  inviterName: string,
  workspaceName: string,
  inviteId: string,
  workspaceId: string
): Promise<void> {
  await notifyIfAllowed(
    inviteeId,
    'invites',
    `${inviterName} ti ha invitato`,
    `Hai ricevuto un invito al workspace "${workspaceName}".`,
    {
      section: 'collaboration',
      intent: 'workspace',
      workspaceId,
      inviteId,
      targetId: inviteId,
    }
  );
}

export async function notifyWorkspaceInviteAccepted(
  ownerId: string,
  inviteeName: string,
  workspaceName: string,
  inviteId: string,
  workspaceId: string
): Promise<void> {
  await notifyIfAllowed(
    ownerId,
    'workspace_updates',
    `${inviteeName} ha accettato il tuo invito`,
    `Ora partecipa al workspace "${workspaceName}".`,
    {
      section: 'collaboration',
      intent: 'workspace',
      workspaceId,
      inviteId,
      targetId: inviteId,
    }
  );
}

export async function notifyWorkspaceInviteRejected(
  ownerId: string,
  inviteeName: string,
  workspaceName: string,
  inviteId: string,
  workspaceId: string
): Promise<void> {
  await notifyIfAllowed(
    ownerId,
    'workspace_updates',
    `${inviteeName} ha rifiutato il tuo invito`,
    `L'invito al workspace "${workspaceName}" non è stato accettato.`,
    {
      section: 'collaboration',
      intent: 'workspace',
      workspaceId,
      inviteId,
      targetId: inviteId,
    }
  );
}

/** §15 — notifica al proprietario workspace quando un partecipante aggiunge una Valigia. */
export async function notifyWorkspaceSuitcaseAdded(
  workspaceId: string,
  actorId: string,
  suitcaseId: string
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace || workspace.ownerId === actorId) return;

  const actorName = await getProfileName(actorId);
  const { data: suitcaseRow } = await supabase
    .from('suitcases')
    .select('title')
    .eq('id', suitcaseId)
    .maybeSingle();
  const suitcaseTitle = suitcaseRow?.title?.trim() || 'Valigia';

  await notifyIfAllowed(
    workspace.ownerId,
    'workspace_updates',
    `${actorName} ha aggiunto una Valigia al workspace`,
    `"${suitcaseTitle}" è stata collegata al workspace "${workspace.name}".`,
    {
      section: 'collaboration',
      intent: 'workspace',
      workspaceId,
      targetId: workspaceId,
      resourceKind: 'suitcase',
    }
  );
}

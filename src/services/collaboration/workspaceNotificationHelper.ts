import { supabase } from '@/services/supabaseClient';
import { addNotification } from '@/services/notificationService';
import { getWorkspace } from './workspaceService';

async function getProfileName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle();
  return data?.name?.trim() || 'Un collaboratore';
}

export async function notifyWorkspaceInviteReceived(
  inviteeId: string,
  inviterName: string,
  workspaceName: string,
  inviteId: string
): Promise<void> {
  await addNotification(
    inviteeId,
    'collaboration',
    `${inviterName} ti ha invitato`,
    `Hai ricevuto un invito al workspace "${workspaceName}".`,
    { section: 'collaboration', inviteId, targetId: inviteId }
  );
}

export async function notifyWorkspaceInviteAccepted(
  ownerId: string,
  inviteeName: string,
  workspaceName: string,
  inviteId: string
): Promise<void> {
  await addNotification(
    ownerId,
    'collaboration',
    `${inviteeName} ha accettato il tuo invito`,
    `Ora partecipa al workspace "${workspaceName}".`,
    { section: 'collaboration', inviteId, targetId: inviteId }
  );
}

export async function notifyWorkspaceInviteRejected(
  ownerId: string,
  inviteeName: string,
  workspaceName: string,
  inviteId: string
): Promise<void> {
  await addNotification(
    ownerId,
    'collaboration',
    `${inviteeName} ha rifiutato il tuo invito`,
    `L'invito al workspace "${workspaceName}" non è stato accettato.`,
    { section: 'collaboration', inviteId, targetId: inviteId }
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

  await addNotification(
    workspace.ownerId,
    'collaboration',
    `${actorName} ha aggiunto una Valigia al workspace`,
    `"${suitcaseTitle}" è stata collegata al workspace "${workspace.name}".`,
    {
      section: 'collaboration',
      targetId: workspaceId,
      resourceKind: 'suitcase',
    }
  );
}

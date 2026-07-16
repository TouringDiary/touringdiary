import { addNotification } from '@/services/notificationService';
import { getSharedResourceKindLabel, type SharedResourceKind } from '@/domain/collaboration';
import { getShareableResource } from './sharedResourceService';
import { listSharedResourceMembers } from './sharedResourceAclService';
import { listWorkspacesContainingResource } from './workspaceCompositionService';
import { shouldDeliverCollaborationNotification } from './collaborationNotificationPrefsService';
import { resolveAuthenticatedUserId } from '@/services/auth/authIdentity';
import { supabase } from '@/services/supabaseClient';

async function getActorDisplayName(actorId: string): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', actorId)
    .maybeSingle();

  if (error || !data?.name) return 'Un collaboratore';
  return data.name;
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

export async function notifyResourceInviteReceived(
  inviteeId: string,
  inviterName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await notifyIfAllowed(
    inviteeId,
    'invites',
    `${inviterName} ti ha invitato`,
    `Hai ricevuto un invito a collaborare su un ${getSharedResourceKindLabel(resourceKind)}.`,
    { section: 'collaboration', inviteId, targetId: inviteId, resourceKind }
  );
}

export async function notifyResourceInviteAccepted(
  inviterId: string,
  inviteeName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await notifyIfAllowed(
    inviterId,
    'invites',
    `${inviteeName} ha accettato il tuo invito`,
    `Ora può collaborare al ${getSharedResourceKindLabel(resourceKind)} condiviso.`,
    { section: 'collaboration', inviteId, targetId: inviteId, resourceKind }
  );
}

export async function notifyResourceInviteRejected(
  inviterId: string,
  inviteeName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await notifyIfAllowed(
    inviterId,
    'invites',
    `${inviteeName} ha rifiutato il tuo invito`,
    `L'invito al ${getSharedResourceKindLabel(resourceKind)} non è stato accettato.`,
    { section: 'collaboration', inviteId, targetId: inviteId, resourceKind }
  );
}

/** §19 — notifica ai collaboratori quando il contenuto viene modificato. */
export async function notifySharedResourceContentModified(
  resourceKind: SharedResourceKind,
  resourceId: string,
  resourceTitle: string
): Promise<void> {
  if (
    resourceKind !== 'suitcase' &&
    resourceKind !== 'user_template' &&
    resourceKind !== 'diary'
  ) {
    return;
  }

  const resolvedActorId = await resolveAuthenticatedUserId();
  if (!resolvedActorId) return;

  const resource = await getShareableResource(resourceKind, resourceId);
  if (!resource || resource.sharingMode !== 'collaborative') return;

  const actorName = await getActorDisplayName(resolvedActorId);
  const members = await listSharedResourceMembers(resource.id);
  const recipientIds = new Set<string>([resource.ownerId]);
  for (const member of members) {
    recipientIds.add(member.userId);
  }
  recipientIds.delete(resolvedActorId);

  const workspaces = await listWorkspacesContainingResource(resourceKind, resourceId);
  const primaryWorkspace = workspaces[0] ?? null;

  let title: string;
  let body: string;

  if (resourceKind === 'diary' && primaryWorkspace) {
    title = `${actorName} ha aggiornato il Diario condiviso`;
    body = `Il diario "${resourceTitle}" è stato aggiornato nel workspace "${primaryWorkspace.name}".`;
  } else if (resourceKind === 'diary') {
    title = `${actorName} ha aggiornato il Diario condiviso`;
    body = `Il diario "${resourceTitle}" è stato aggiornato.`;
  } else if (resourceKind === 'suitcase') {
    title = `${actorName} ha modificato la Valigia`;
    body = `La valigia "${resourceTitle}" è stata aggiornata.`;
  } else {
    title = `${actorName} ha modificato il Template`;
    body = `Il template "${resourceTitle}" è stato aggiornato.`;
  }

  const linkData = primaryWorkspace
    ? {
        section: 'collaboration' as const,
        intent: 'workspace' as const,
        workspaceId: primaryWorkspace.id,
        targetId: resourceId,
        resourceKind,
      }
    : {
        section: 'collaboration' as const,
        targetId: resourceId,
        resourceKind,
      };

  await Promise.all(
    [...recipientIds].map((recipientId) =>
      notifyIfAllowed(recipientId, primaryWorkspace ? 'workspace_updates' : 'resource_updates', title, body, linkData)
    )
  );
}

/** §19 — notifica al destinatario dopo copia personale di un Template. */
export async function notifyPersonalTemplateReceived(
  inviteeId: string,
  inviterName: string,
  templateTitle: string,
  copiedResourceId: string
): Promise<void> {
  await notifyIfAllowed(
    inviteeId,
    'resource_updates',
    'Hai ricevuto un nuovo Template',
    `${inviterName} ti ha condiviso il template "${templateTitle}".`,
    {
      section: 'collaboration',
      targetId: copiedResourceId,
      resourceKind: 'user_template',
    }
  );
}

export async function notifyFriendRequestReceived(
  addresseeId: string,
  requesterName: string,
  requestId: string
): Promise<void> {
  await notifyIfAllowed(
    addresseeId,
    'friend_requests',
    `${requesterName} ti ha inviato una richiesta di amicizia`,
    'Puoi accettare o rifiutare dalla sezione Amici del profilo.',
    { section: 'profile', tab: 'friends', targetId: requestId }
  );
}

export async function notifyFriendRequestAccepted(
  requesterId: string,
  addresseeName: string
): Promise<void> {
  await notifyIfAllowed(
    requesterId,
    'friend_requests',
    `${addresseeName} ha accettato la tua richiesta di amicizia`,
    'Ora siete amici su TouringDiary.',
    { section: 'profile', tab: 'friends' }
  );
}

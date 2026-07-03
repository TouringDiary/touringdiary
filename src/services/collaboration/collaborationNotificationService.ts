import { addNotification } from '@/services/notificationService';
import { getSharedResourceKindLabel, type SharedResourceKind } from '@/domain/collaboration';
import { getShareableResource } from './sharedResourceService';
import { listSharedResourceMembers } from './sharedResourceAclService';
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

export async function notifyResourceInviteReceived(
  inviteeId: string,
  inviterName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await addNotification(
    inviteeId,
    'collaboration',
    `${inviterName} ti ha invitato`,
    `Hai ricevuto un invito a collaborare su un ${getSharedResourceKindLabel(resourceKind)}.`,
    { section: 'collaboration', inviteId, targetId: inviteId }
  );
}

export async function notifyResourceInviteAccepted(
  inviterId: string,
  inviteeName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await addNotification(
    inviterId,
    'collaboration',
    `${inviteeName} ha accettato il tuo invito`,
    `Ora può collaborare al ${getSharedResourceKindLabel(resourceKind)} condiviso.`,
    { section: 'collaboration', inviteId, targetId: inviteId }
  );
}

export async function notifyResourceInviteRejected(
  inviterId: string,
  inviteeName: string,
  resourceKind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  await addNotification(
    inviterId,
    'collaboration',
    `${inviteeName} ha rifiutato il tuo invito`,
    `L'invito al ${getSharedResourceKindLabel(resourceKind)} non è stato accettato.`,
    { section: 'collaboration', inviteId, targetId: inviteId }
  );
}

/** §19 — notifica ai collaboratori quando il contenuto viene modificato. */
export async function notifySharedResourceContentModified(
  actorId: string,
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

  const resource = await getShareableResource(resourceKind, resourceId);
  if (!resource || resource.sharingMode !== 'collaborative') return;

  const actorName = await getActorDisplayName(actorId);
  const members = await listSharedResourceMembers(resource.id);
  const recipientIds = new Set<string>([resource.ownerId]);
  for (const member of members) {
    recipientIds.add(member.userId);
  }
  recipientIds.delete(actorId);

  let title: string;
  let body: string;

  if (resourceKind === 'diary') {
    title = `${actorName} ha aggiornato il Diario condiviso`;
    body = `Il diario "${resourceTitle}" è stato aggiornato.`;
  } else if (resourceKind === 'suitcase') {
    title = `${actorName} ha modificato la Valigia`;
    body = `La valigia "${resourceTitle}" è stata aggiornata.`;
  } else {
    title = `${actorName} ha modificato il Template`;
    body = `Il template "${resourceTitle}" è stato aggiornato.`;
  }

  await Promise.all(
    [...recipientIds].map((recipientId) =>
      addNotification(recipientId, 'collaboration', title, body, {
        section: 'collaboration',
        targetId: resourceId,
        resourceKind,
      })
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
  await addNotification(
    inviteeId,
    'collaboration',
    'Hai ricevuto un nuovo Template',
    `${inviterName} ti ha condiviso il template "${templateTitle}".`,
    {
      section: 'collaboration',
      targetId: copiedResourceId,
      resourceKind: 'user_template',
    }
  );
}

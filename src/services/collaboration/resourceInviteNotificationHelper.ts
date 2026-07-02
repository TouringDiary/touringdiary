import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind } from '@/domain/collaboration';
import {
  notifyPersonalTemplateReceived,
  notifyResourceInviteAccepted,
  notifyResourceInviteReceived,
  notifyResourceInviteRejected,
} from './collaborationNotificationService';

async function getProfileSummary(userId: string): Promise<{ name: string; slug?: string }> {
  const { data } = await supabase
    .from('profiles')
    .select('name, slug')
    .eq('id', userId)
    .maybeSingle();

  return {
    name: data?.name?.trim() || 'Utente',
    slug: data?.slug ?? undefined,
  };
}

export async function notifyResourceInviteSent(
  inviteeId: string,
  ownerId: string,
  kind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  const inviter = await getProfileSummary(ownerId);
  await notifyResourceInviteReceived(inviteeId, inviter.name, kind, inviteId);
}

export async function notifyResourceInviteAcceptedByInvitee(
  ownerId: string,
  inviteeId: string,
  kind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  const invitee = await getProfileSummary(inviteeId);
  await notifyResourceInviteAccepted(ownerId, invitee.name, kind, inviteId);
}

export async function notifyResourceInviteRejectedByInvitee(
  ownerId: string,
  inviteeId: string,
  kind: SharedResourceKind,
  inviteId: string
): Promise<void> {
  const invitee = await getProfileSummary(inviteeId);
  await notifyResourceInviteRejected(ownerId, invitee.name, kind, inviteId);
}

export async function notifyPersonalTemplateReceivedAfterInvite(
  inviteeId: string,
  ownerId: string,
  sourceResourceId: string,
  copiedResourceId: string
): Promise<void> {
  const inviter = await getProfileSummary(ownerId);
  const { data: templateRow } = await supabase
    .from('suitcases')
    .select('title')
    .eq('id', sourceResourceId)
    .maybeSingle();
  const templateTitle = templateRow?.title?.trim() || 'Template';
  await notifyPersonalTemplateReceived(
    inviteeId,
    inviter.name,
    templateTitle,
    copiedResourceId
  );
}

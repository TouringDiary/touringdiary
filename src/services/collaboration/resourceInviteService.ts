import { supabase } from '@/services/supabaseClient';
import type {
  CollaborativeMemberRole,
  ResourceInvite,
  SharedResourceKind,
} from '@/domain/collaboration';
import { isCollaborativeMemberRole, isSharedResourceKind, isSharingMode } from '@/domain/collaboration';
import { userNeedsUsername } from '@/domain/profile/username';
import {
  ensureShareableResource,
  getShareableResource,
} from './sharedResourceService';
import {
  getSharedResourceMember,
  setSharedResourceMember,
} from './sharedResourceAclService';
import { canUserManageCollaboration } from './permissionService';
import { areUsersBlocked } from './userBlockService';
import {
  resolveUserIdByEmail,
  resolveUserIdByUsername,
} from './collaborationUserSearchService';
import { mapResourceInviteRow } from './resourceInviteMappers';
import {
  notifyPersonalTemplateReceivedAfterInvite,
  notifyResourceInviteAcceptedByInvitee,
  notifyResourceInviteRejectedByInvitee,
  notifyResourceInviteSent,
} from './resourceInviteNotificationHelper';
import { duplicateSharedResourceForInvitee } from './personalShareService';

export type InviteTarget =
  | { userId: string }
  | { email: string }
  | { username: string };

export type ResourceInviteResult =
  | { success: true; invite: ResourceInvite }
  | { success: false; error: string };

type ResolveInviteeResult =
  | { success: true; inviteeId: string }
  | { success: false; error: string };

async function resolveInviteeId(target: InviteTarget): Promise<string | null> {
  if ('userId' in target) return target.userId;
  if ('email' in target) return resolveUserIdByEmail(target.email);
  return resolveUserIdByUsername(target.username);
}

async function validateInvitee(
  ownerId: string,
  inviteeId: string
): Promise<string | null> {
  if (inviteeId === ownerId) {
    return 'Non puoi invitare te stesso.';
  }

  if (await areUsersBlocked(ownerId, inviteeId)) {
    return 'Non è possibile inviare inviti a questo utente.';
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('id', inviteeId)
    .maybeSingle();

  if (error || !profile) {
    return 'Utente non trovato.';
  }
  if (userNeedsUsername(profile.slug)) {
    return 'L\'utente non ha ancora un Nome utente e non può collaborare.';
  }

  return null;
}

async function resolveAndValidateInvitee(
  ownerId: string,
  target: InviteTarget
): Promise<ResolveInviteeResult> {
  const inviteeId = await resolveInviteeId(target);
  if (!inviteeId) {
    return { success: false, error: 'Utente non trovato.' };
  }

  const inviteeError = await validateInvitee(ownerId, inviteeId);
  if (inviteeError) {
    return { success: false, error: inviteeError };
  }

  return { success: true, inviteeId };
}

export async function getResourceInvite(inviteId: string): Promise<ResourceInvite | null> {
  const { data, error } = await supabase
    .from('resource_invites')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();

  if (error) {
    console.error('[resourceInviteService] getResourceInvite:', error.message);
    return null;
  }
  if (!data) return null;
  return mapResourceInviteRow(data);
}

export async function listResourceInvites(
  kind: SharedResourceKind,
  resourceId: string,
  requesterId: string
): Promise<ResourceInvite[]> {
  const resource = await getShareableResource(kind, resourceId);
  if (!resource || resource.ownerId !== requesterId) {
    return [];
  }

  const { data, error } = await supabase
    .from('resource_invites')
    .select('*')
    .eq('shared_resource_id', resource.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[resourceInviteService] listResourceInvites:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapResourceInviteRow)
    .filter((invite): invite is ResourceInvite => invite !== null);
}

export async function listPendingInvitesForUser(userId: string): Promise<ResourceInvite[]> {
  const { data, error } = await supabase
    .from('resource_invites')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[resourceInviteService] listPendingInvitesForUser:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapResourceInviteRow)
    .filter((invite): invite is ResourceInvite => invite !== null);
}

/**
 * Invia un invito a risorsa (§6). Il destinatario non ha accesso finché non accetta.
 */
export async function sendResourceInvite(
  ownerId: string,
  kind: SharedResourceKind,
  resourceId: string,
  target: InviteTarget,
  role: CollaborativeMemberRole
): Promise<ResourceInviteResult> {
  if (!isCollaborativeMemberRole(role)) {
    return { success: false, error: 'Ruolo collaborativo non valido.' };
  }

  const canManage = await canUserManageCollaboration(ownerId, kind, resourceId);
  if (!canManage) {
    return { success: false, error: 'Solo il proprietario può invitare collaboratori.' };
  }

  const registerResult = await ensureShareableResource(kind, resourceId, ownerId);
  if (registerResult.success !== true) {
    return { success: false, error: registerResult.error };
  }

  const sharedResource = registerResult.resource;
  const inviteeResolution = await resolveAndValidateInvitee(ownerId, target);
  if (inviteeResolution.success !== true) {
    return { success: false, error: inviteeResolution.error };
  }

  const { inviteeId } = inviteeResolution;

  const existingMember = await getSharedResourceMember(sharedResource.id, inviteeId);
  if (existingMember) {
    return { success: false, error: 'Questo utente ha già accesso alla risorsa.' };
  }

  const { data: existingInvite } = await supabase
    .from('resource_invites')
    .select('*')
    .eq('shared_resource_id', sharedResource.id)
    .eq('invitee_id', inviteeId)
    .maybeSingle();

  if (existingInvite?.status === 'pending') {
    return { success: false, error: 'Esiste già un invito in attesa per questo utente.' };
  }
  if (existingInvite?.status === 'accepted') {
    return { success: false, error: 'Questo utente ha già accettato un invito precedente.' };
  }

  let data;
  let error;

  if (
    existingInvite &&
    (existingInvite.status === 'rejected' || existingInvite.status === 'revoked')
  ) {
    ({ data, error } = await supabase
      .from('resource_invites')
      .update({
        role,
        status: 'pending',
        inviter_id: ownerId,
        responded_at: null,
      })
      .eq('id', existingInvite.id)
      .select('*')
      .single());
  } else {
    ({ data, error } = await supabase
      .from('resource_invites')
      .insert({
        shared_resource_id: sharedResource.id,
        inviter_id: ownerId,
        invitee_id: inviteeId,
        role,
        status: 'pending',
      })
      .select('*')
      .single());
  }

  if (error) {
    console.error('[resourceInviteService] sendResourceInvite:', error.message);
    return { success: false, error: 'Impossibile inviare l\'invito.' };
  }

  if (!data) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  const invite = mapResourceInviteRow(data);
  if (!invite) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  try {
    await notifyResourceInviteSent(inviteeId, ownerId, kind, invite.id);
  } catch (notificationError) {
    console.error('[resourceInviteService] notifyResourceInviteSent:', notificationError);
  }

  return { success: true, invite };
}

export async function acceptResourceInvite(
  inviteeId: string,
  inviteId: string
): Promise<ResourceInviteResult> {
  const invite = await getResourceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (invite.inviteeId !== inviteeId) {
    return { success: false, error: 'Non sei il destinatario di questo invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Questo invito non è più valido.' };
  }

  const { data: resource, error: resourceError } = await supabase
    .from('shared_resources')
    .select('id, owner_id, kind, sharing_mode, resource_id')
    .eq('id', invite.sharedResourceId)
    .maybeSingle();

  if (resourceError || !resource) {
    return { success: false, error: 'Risorsa condivisibile non trovata.' };
  }

  if (!isSharedResourceKind(resource.kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  if (await areUsersBlocked(inviteeId, resource.owner_id)) {
    return { success: false, error: 'Non è possibile accettare questo invito.' };
  }

  const isPersonalShare =
    isSharingMode(resource.sharing_mode) && resource.sharing_mode === 'personal';

  let copiedResourceId: string | null = null;

  if (isPersonalShare) {
    const copyResult = await duplicateSharedResourceForInvitee(
      resource.kind,
      resource.resource_id,
      resource.owner_id,
      inviteeId
    );
    if (copyResult.success !== true) {
      return { success: false, error: copyResult.error };
    }
    copiedResourceId = copyResult.copiedResourceId;
  } else {
    const memberResult = await setSharedResourceMember(
      invite.sharedResourceId,
      resource.owner_id,
      inviteeId,
      invite.role
    );
    if (memberResult.success !== true) {
      return { success: false, error: memberResult.error };
    }
  }

  // Se l'aggiornamento invito fallisce dopo setSharedResourceMember (collaborativa),
  // l'ACL resta attivo ma lo stato invito può restare pending (nessuna transazione DB in Fase 3).
  const { data, error } = await supabase
    .from('resource_invites')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('invitee_id', inviteeId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) {
    console.error('[resourceInviteService] acceptResourceInvite:', error.message);
    return { success: false, error: 'Impossibile accettare l\'invito.' };
  }

  const accepted = mapResourceInviteRow(data);
  if (!accepted) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  try {
    await notifyResourceInviteAcceptedByInvitee(
      resource.owner_id,
      inviteeId,
      resource.kind,
      inviteId
    );
  } catch (notificationError) {
    console.error('[resourceInviteService] notifyResourceInviteAcceptedByInvitee:', notificationError);
  }

  if (isPersonalShare && resource.kind === 'user_template' && copiedResourceId) {
    try {
      await notifyPersonalTemplateReceivedAfterInvite(
        inviteeId,
        resource.owner_id,
        resource.resource_id,
        copiedResourceId
      );
    } catch (notificationError) {
      console.error('[resourceInviteService] notifyPersonalTemplateReceivedAfterInvite:', notificationError);
    }
  }

  return { success: true, invite: accepted };
}

export async function rejectResourceInvite(
  inviteeId: string,
  inviteId: string
): Promise<ResourceInviteResult> {
  const invite = await getResourceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (invite.inviteeId !== inviteeId) {
    return { success: false, error: 'Non sei il destinatario di questo invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Questo invito non è più valido.' };
  }

  const { data: resource } = await supabase
    .from('shared_resources')
    .select('owner_id, kind')
    .eq('id', invite.sharedResourceId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('resource_invites')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .eq('invitee_id', inviteeId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) {
    console.error('[resourceInviteService] rejectResourceInvite:', error.message);
    return { success: false, error: 'Impossibile rifiutare l\'invito.' };
  }

  const rejected = mapResourceInviteRow(data);
  if (!rejected) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  if (resource && isSharedResourceKind(resource.kind)) {
    try {
      await notifyResourceInviteRejectedByInvitee(
        resource.owner_id,
        inviteeId,
        resource.kind,
        inviteId
      );
    } catch (notificationError) {
      console.error('[resourceInviteService] notifyResourceInviteRejectedByInvitee:', notificationError);
    }
  }

  return { success: true, invite: rejected };
}

export async function revokeResourceInvite(
  ownerId: string,
  inviteId: string
): Promise<ResourceInviteResult> {
  const invite = await getResourceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }

  const { data: resource } = await supabase
    .from('shared_resources')
    .select('owner_id')
    .eq('id', invite.sharedResourceId)
    .maybeSingle();

  if (!resource || resource.owner_id !== ownerId) {
    return { success: false, error: 'Solo il proprietario può revocare l\'invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Solo gli inviti in attesa possono essere revocati.' };
  }

  const { data, error } = await supabase
    .from('resource_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)
    .select('*')
    .single();

  if (error) {
    console.error('[resourceInviteService] revokeResourceInvite:', error.message);
    return { success: false, error: 'Impossibile revocare l\'invito.' };
  }

  const revoked = mapResourceInviteRow(data);
  if (!revoked) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  return { success: true, invite: revoked };
}

/** Reinvio dopo rifiuto (§6, §8). */
export async function resendResourceInvite(
  ownerId: string,
  inviteId: string,
  role?: CollaborativeMemberRole
): Promise<ResourceInviteResult> {
  const invite = await getResourceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }

  const { data: resource } = await supabase
    .from('shared_resources')
    .select('owner_id, kind, resource_id')
    .eq('id', invite.sharedResourceId)
    .maybeSingle();

  if (!resource || resource.owner_id !== ownerId) {
    return { success: false, error: 'Solo il proprietario può reinviare l\'invito.' };
  }
  if (invite.status !== 'rejected' && invite.status !== 'revoked') {
    return { success: false, error: 'Solo gli inviti rifiutati o revocati possono essere reinviati.' };
  }

  if (!isSharedResourceKind(resource.kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  const nextRole = role ?? invite.role;
  return sendResourceInvite(
    ownerId,
    resource.kind,
    resource.resource_id,
    { userId: invite.inviteeId },
    nextRole
  );
}

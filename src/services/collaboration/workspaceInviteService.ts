import { supabase } from '@/services/supabaseClient';
import type { WorkspaceInvite, WorkspaceResourcePermissionEntry } from '@/domain/collaboration';
import { isWorkspaceResourceAccess } from '@/domain/collaboration';
import { areUsersBlocked } from './userBlockService';
import { mapWorkspaceInviteRow } from './workspaceMappers';
import { getWorkspace, isWorkspaceOwner } from './workspaceService';
import { setWorkspaceResourcePermission } from './workspaceResourceService';
import { getWorkspaceResourceByKindAndId } from './workspaceResourceLinkLookup';
import type { InviteTarget } from './resourceInviteService';
import { resolveInviteeId, validateInvitee } from './workspaceInviteValidation';
import {
  fetchInvitePermissions,
  fetchInvitePermissionsByInviteIds,
  loadWorkspaceInvite,
  restoreWorkspaceInvitePermissions,
  rollbackWorkspaceMembership,
} from './workspaceInvitePersistence';
import {
  notifyWorkspaceInviteAcceptedForInvitee,
  notifyWorkspaceInviteReceivedForSentInvite,
  notifyWorkspaceInviteRejectedForInvitee,
} from './workspaceInviteNotifications';
import { syncSharedResourceAccessFromWorkspacePermission } from './workspaceMemberAclSync';

export type WorkspaceInviteResult =
  | { success: true; invite: WorkspaceInvite }
  | { success: false; error: string };

export async function getWorkspaceInvite(inviteId: string): Promise<WorkspaceInvite | null> {
  return loadWorkspaceInvite(inviteId);
}

export async function listWorkspaceInvites(
  workspaceId: string,
  requesterId: string
): Promise<WorkspaceInvite[]> {
  if (!(await isWorkspaceOwner(workspaceId, requesterId))) {
    return [];
  }

  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[workspaceInviteService] listWorkspaceInvites:', error.message);
    return [];
  }

  const invites: WorkspaceInvite[] = [];
  const rows = data ?? [];
  const permissionsByInvite = await fetchInvitePermissionsByInviteIds(rows.map((row) => row.id));
  for (const row of rows) {
    const permissions = permissionsByInvite.get(row.id) ?? [];
    const invite = mapWorkspaceInviteRow(row, permissions);
    if (invite) invites.push(invite);
  }
  return invites;
}

export async function listPendingWorkspaceInvitesForUser(
  userId: string
): Promise<WorkspaceInvite[]> {
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[workspaceInviteService] listPendingWorkspaceInvitesForUser:', error.message);
    return [];
  }

  const invites: WorkspaceInvite[] = [];
  const rows = data ?? [];
  const permissionsByInvite = await fetchInvitePermissionsByInviteIds(rows.map((row) => row.id));
  for (const row of rows) {
    const permissions = permissionsByInvite.get(row.id) ?? [];
    const invite = mapWorkspaceInviteRow(row, permissions);
    if (invite) invites.push(invite);
  }
  return invites;
}

export async function sendWorkspaceInvite(
  ownerId: string,
  workspaceId: string,
  target: InviteTarget,
  permissions: WorkspaceResourcePermissionEntry[]
): Promise<WorkspaceInviteResult> {
  if (!(await isWorkspaceOwner(workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario del workspace può invitare.' };
  }
  if (!permissions.length) {
    return { success: false, error: 'Definisci almeno un permesso per risorsa.' };
  }

  for (const entry of permissions) {
    if (!isWorkspaceResourceAccess(entry.accessLevel)) {
      return { success: false, error: 'Livello di accesso non valido.' };
    }
    const linked = await getWorkspaceResourceByKindAndId(
      workspaceId,
      entry.kind,
      entry.resourceId
    );
    if (!linked) {
      return { success: false, error: 'Risorsa non presente nel workspace.' };
    }
  }

  const inviteeId = await resolveInviteeId(target);
  if (!inviteeId) {
    return { success: false, error: 'Utente non trovato.' };
  }

  const inviteeError = await validateInvitee(ownerId, inviteeId);
  if (inviteeError) {
    return { success: false, error: inviteeError };
  }

  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', inviteeId)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: 'Questo utente è già membro del workspace.' };
  }

  const { data: existingInvite } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('invitee_id', inviteeId)
    .maybeSingle();

  if (existingInvite?.status === 'pending') {
    return { success: false, error: 'Esiste già un invito in attesa per questo utente.' };
  }
  if (existingInvite?.status === 'accepted') {
    return { success: false, error: 'Questo utente ha già accettato un invito precedente.' };
  }

  let inviteRow;
  let inviteError;
  let previousInvitePermissions: WorkspaceResourcePermissionEntry[] = [];
  let previousInviteStatus: WorkspaceInvite['status'] | null = null;

  if (
    existingInvite &&
    (existingInvite.status === 'rejected' || existingInvite.status === 'revoked')
  ) {
    previousInvitePermissions = await fetchInvitePermissions(existingInvite.id);
    previousInviteStatus = existingInvite.status;
    ({ data: inviteRow, error: inviteError } = await supabase
      .from('workspace_invites')
      .update({
        status: 'pending',
        inviter_id: ownerId,
        responded_at: null,
      })
      .eq('id', existingInvite.id)
      .select('*')
      .single());

    if (!inviteError && inviteRow) {
      await supabase.from('workspace_invite_permissions').delete().eq('invite_id', inviteRow.id);
    }
  } else {
    ({ data: inviteRow, error: inviteError } = await supabase
      .from('workspace_invites')
      .insert({
        workspace_id: workspaceId,
        inviter_id: ownerId,
        invitee_id: inviteeId,
        status: 'pending',
      })
      .select('*')
      .single());
  }

  if (inviteError || !inviteRow) {
    console.error('[workspaceInviteService] sendWorkspaceInvite:', inviteError?.message);
    return { success: false, error: 'Impossibile inviare l\'invito.' };
  }

  const permissionRows = permissions.map((entry) => ({
    invite_id: inviteRow.id,
    kind: entry.kind,
    resource_id: entry.resourceId,
    access_level: entry.accessLevel,
  }));

  const { error: permissionsError } = await supabase
    .from('workspace_invite_permissions')
    .insert(permissionRows);

  if (permissionsError) {
    console.error('[workspaceInviteService] sendWorkspaceInvite permissions:', permissionsError.message);
    if (previousInviteStatus) {
      // Rollback logico: ripristina stato e permessi dell'invito precedente.
      await supabase
        .from('workspace_invites')
        .update({
          status: previousInviteStatus,
          responded_at: existingInvite?.responded_at ?? null,
        })
        .eq('id', inviteRow.id);
      await restoreWorkspaceInvitePermissions(inviteRow.id, previousInvitePermissions);
    } else {
      await supabase.from('workspace_invites').delete().eq('id', inviteRow.id);
    }
    return { success: false, error: 'Impossibile salvare i permessi dell\'invito.' };
  }

  const invite = await loadWorkspaceInvite(inviteRow.id);
  if (!invite) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  void notifyWorkspaceInviteReceivedForSentInvite(ownerId, inviteeId, workspaceId, invite.id).catch(
    (notificationError) => {
      console.error('[workspaceInviteService] notifyWorkspaceInviteReceived:', notificationError);
    }
  );

  return { success: true, invite };
}

async function applyInvitePermissionsToMember(
  workspaceId: string,
  ownerId: string,
  userId: string,
  permissions: WorkspaceResourcePermissionEntry[]
): Promise<string | null> {
  for (const entry of permissions) {
    const linked = await getWorkspaceResourceByKindAndId(
      workspaceId,
      entry.kind,
      entry.resourceId
    );
    if (!linked) continue;

    const result = await setWorkspaceResourcePermission(
      workspaceId,
      ownerId,
      linked.id,
      userId,
      entry.accessLevel
    );
    if (!result.success) {
      return result.error ?? 'Impossibile applicare i permessi.';
    }

    await syncSharedResourceAccessFromWorkspacePermission(
      entry.kind,
      entry.resourceId,
      userId,
      entry.accessLevel
    );
  }
  return null;
}

export async function acceptWorkspaceInvite(
  inviteeId: string,
  inviteId: string
): Promise<WorkspaceInviteResult> {
  const invite = await loadWorkspaceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (invite.inviteeId !== inviteeId) {
    return { success: false, error: 'Non sei il destinatario di questo invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Questo invito non è più valido.' };
  }

  const workspace = await getWorkspace(invite.workspaceId);
  if (!workspace) {
    return { success: false, error: 'Workspace non trovato.' };
  }

  if (await areUsersBlocked(inviteeId, workspace.ownerId)) {
    return { success: false, error: 'Non è possibile accettare questo invito.' };
  }

  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: invite.workspaceId,
    user_id: inviteeId,
  });

  if (memberError) {
    console.error('[workspaceInviteService] acceptWorkspaceInvite member:', memberError.message);
    return { success: false, error: 'Impossibile entrare nel workspace.' };
  }

  const permError = await applyInvitePermissionsToMember(
    invite.workspaceId,
    workspace.ownerId,
    inviteeId,
    invite.permissions
  );
  if (permError) {
    await rollbackWorkspaceMembership(invite.workspaceId, inviteeId);
    return { success: false, error: permError };
  }

  const { data, error } = await supabase
    .from('workspace_invites')
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
    console.error('[workspaceInviteService] acceptWorkspaceInvite:', error.message);
    await rollbackWorkspaceMembership(invite.workspaceId, inviteeId);
    return { success: false, error: 'Impossibile accettare l\'invito.' };
  }

  const permissions = await fetchInvitePermissions(inviteId);
  const accepted = mapWorkspaceInviteRow(data, permissions);
  if (!accepted) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  void notifyWorkspaceInviteAcceptedForInvitee(
    workspace.ownerId,
    inviteeId,
    workspace.name,
    inviteId,
    workspace.id
  ).catch((notificationError) => {
    console.error('[workspaceInviteService] notifyWorkspaceInviteAccepted:', notificationError);
  });

  return { success: true, invite: accepted };
}

export async function rejectWorkspaceInvite(
  inviteeId: string,
  inviteId: string
): Promise<WorkspaceInviteResult> {
  const invite = await loadWorkspaceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (invite.inviteeId !== inviteeId) {
    return { success: false, error: 'Non sei il destinatario di questo invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Questo invito non è più valido.' };
  }

  const workspace = await getWorkspace(invite.workspaceId);

  const { data, error } = await supabase
    .from('workspace_invites')
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
    console.error('[workspaceInviteService] rejectWorkspaceInvite:', error.message);
    return { success: false, error: 'Impossibile rifiutare l\'invito.' };
  }

  const permissions = await fetchInvitePermissions(inviteId);
  const rejected = mapWorkspaceInviteRow(data, permissions);
  if (!rejected) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  void notifyWorkspaceInviteRejectedForInvitee(workspace, inviteeId, inviteId).catch(
    (notificationError) => {
      console.error('[workspaceInviteService] notifyWorkspaceInviteRejected:', notificationError);
    }
  );

  return { success: true, invite: rejected };
}

export async function revokeWorkspaceInvite(
  ownerId: string,
  inviteId: string
): Promise<WorkspaceInviteResult> {
  const invite = await loadWorkspaceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (!(await isWorkspaceOwner(invite.workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario può revocare l\'invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Solo gli inviti in attesa possono essere revocati.' };
  }

  const { data, error } = await supabase
    .from('workspace_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)
    .select('*')
    .single();

  if (error) {
    console.error('[workspaceInviteService] revokeWorkspaceInvite:', error.message);
    return { success: false, error: 'Impossibile revocare l\'invito.' };
  }

  const permissions = await fetchInvitePermissions(inviteId);
  const revoked = mapWorkspaceInviteRow(data, permissions);
  if (!revoked) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  return { success: true, invite: revoked };
}

export async function resendWorkspaceInvite(
  ownerId: string,
  inviteId: string,
  permissions?: WorkspaceResourcePermissionEntry[]
): Promise<WorkspaceInviteResult> {
  const invite = await loadWorkspaceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (!(await isWorkspaceOwner(invite.workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario può reinviare l\'invito.' };
  }
  if (invite.status !== 'rejected' && invite.status !== 'revoked') {
    return { success: false, error: 'Solo gli inviti rifiutati o revocati possono essere reinviati.' };
  }

  return sendWorkspaceInvite(
    ownerId,
    invite.workspaceId,
    { userId: invite.inviteeId },
    permissions ?? invite.permissions
  );
}

export async function removeWorkspaceMember(
  workspaceId: string,
  ownerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isWorkspaceOwner(workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario può rimuovere membri.' };
  }

  const workspace = await getWorkspace(workspaceId);
  if (!workspace || userId === workspace.ownerId) {
    return { success: false, error: 'Operazione non consentita.' };
  }

  const { error: permError } = await supabase
    .from('workspace_resource_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (permError) {
    console.error('[workspaceInviteService] removeWorkspaceMember permissions:', permError.message);
    return { success: false, error: 'Impossibile rimuovere i permessi del membro.' };
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('[workspaceInviteService] removeWorkspaceMember:', error.message);
    return { success: false, error: 'Impossibile rimuovere il membro.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Membro non trovato.' };
  }

  return { success: true };
}

export async function updateWorkspaceInvitePermissions(
  ownerId: string,
  inviteId: string,
  permissions: WorkspaceResourcePermissionEntry[]
): Promise<WorkspaceInviteResult> {
  const invite = await loadWorkspaceInvite(inviteId);
  if (!invite) {
    return { success: false, error: 'Invito non trovato.' };
  }
  if (!(await isWorkspaceOwner(invite.workspaceId, ownerId))) {
    return { success: false, error: 'Solo il proprietario può modificare l\'invito.' };
  }
  if (invite.status !== 'pending') {
    return { success: false, error: 'Solo gli inviti in attesa possono essere modificati.' };
  }

  const previousPermissions = invite.permissions;

  await supabase.from('workspace_invite_permissions').delete().eq('invite_id', inviteId);

  const permissionRows = permissions.map((entry) => ({
    invite_id: inviteId,
    kind: entry.kind,
    resource_id: entry.resourceId,
    access_level: entry.accessLevel,
  }));

  const { error } = await supabase.from('workspace_invite_permissions').insert(permissionRows);
  if (error) {
    console.error('[workspaceInviteService] updateWorkspaceInvitePermissions:', error.message);
    await restoreWorkspaceInvitePermissions(inviteId, previousPermissions);
    return { success: false, error: 'Impossibile aggiornare i permessi dell\'invito.' };
  }

  const updated = await loadWorkspaceInvite(inviteId);
  if (!updated) {
    return { success: false, error: 'Dati invito non validi.' };
  }

  return { success: true, invite: updated };
}

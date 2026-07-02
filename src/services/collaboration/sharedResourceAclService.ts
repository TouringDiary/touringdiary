import { supabase } from '@/services/supabaseClient';
import type {
  CollaborativeMemberRole,
  SharedResourceMember,
  SharedResourceMemberWithProfile,
} from '@/domain/collaboration';
import { isCollaborativeMemberRole } from '@/domain/collaboration';
import {
  mapMemberWithProfile,
  mapSharedResourceMemberRow,
  type MemberWithProfileRow,
} from './sharedResourceMappers';

export async function listSharedResourceMembers(
  sharedResourceId: string
): Promise<SharedResourceMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('shared_resource_members')
    .select(
      'id, shared_resource_id, user_id, role, created_at, updated_at, profiles(name, slug, avatar_url)'
    )
    .eq('shared_resource_id', sharedResourceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[sharedResourceAclService] listSharedResourceMembers:', error.message);
    return [];
  }

  return (data as MemberWithProfileRow[] | null)
    ?.map(mapMemberWithProfile)
    .filter((member): member is SharedResourceMemberWithProfile => member !== null) ?? [];
}

export async function getSharedResourceMember(
  sharedResourceId: string,
  userId: string
): Promise<SharedResourceMember | null> {
  const { data, error } = await supabase
    .from('shared_resource_members')
    .select('*')
    .eq('shared_resource_id', sharedResourceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[sharedResourceAclService] getSharedResourceMember:', error.message);
    return null;
  }
  if (!data) return null;
  return mapSharedResourceMemberRow(data);
}

export type SetSharedResourceMemberResult =
  | { success: true; member: SharedResourceMember }
  | { success: false; error: string };

/**
 * Imposta o aggiorna un membro ACL (§8).
 * Usato dal motore inviti (Fase 3) dopo accettazione; in Fase 2 è l'API diretta dell'ACL.
 */
export async function setSharedResourceMember(
  sharedResourceId: string,
  ownerId: string,
  userId: string,
  role: CollaborativeMemberRole
): Promise<SetSharedResourceMemberResult> {
  if (!isCollaborativeMemberRole(role)) {
    return { success: false, error: 'Ruolo collaborativo non valido.' };
  }
  if (userId === ownerId) {
    return { success: false, error: 'Il proprietario non può essere aggiunto come membro.' };
  }

  const { data: resource, error: resourceError } = await supabase
    .from('shared_resources')
    .select('id, owner_id')
    .eq('id', sharedResourceId)
    .maybeSingle();

  if (resourceError || !resource) {
    return { success: false, error: 'Risorsa condivisibile non trovata.' };
  }
  if (resource.owner_id !== ownerId) {
    return { success: false, error: 'Solo il proprietario può gestire i collaboratori.' };
  }

  const { data, error } = await supabase
    .from('shared_resource_members')
    .upsert(
      {
        shared_resource_id: sharedResourceId,
        user_id: userId,
        role,
      },
      { onConflict: 'shared_resource_id,user_id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('[sharedResourceAclService] setSharedResourceMember:', error.message);
    return { success: false, error: 'Impossibile aggiornare il collaboratore.' };
  }

  const member = mapSharedResourceMemberRow(data);
  if (!member) {
    return { success: false, error: 'Dati del collaboratore non validi.' };
  }

  return { success: true, member };
}

export async function removeSharedResourceMember(
  sharedResourceId: string,
  ownerId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: resource } = await supabase
    .from('shared_resources')
    .select('owner_id')
    .eq('id', sharedResourceId)
    .maybeSingle();

  if (!resource || resource.owner_id !== ownerId) {
    return { success: false, error: 'Solo il proprietario può revocare l\'accesso.' };
  }

  const { data, error } = await supabase
    .from('shared_resource_members')
    .delete()
    .eq('shared_resource_id', sharedResourceId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('[sharedResourceAclService] removeSharedResourceMember:', error.message);
    return { success: false, error: 'Impossibile revocare l\'accesso.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Membro non trovato.' };
  }

  return { success: true };
}

export async function countSharedResourceMembers(sharedResourceId: string): Promise<number> {
  const { count, error } = await supabase
    .from('shared_resource_members')
    .select('id', { count: 'exact', head: true })
    .eq('shared_resource_id', sharedResourceId);

  if (error) {
    console.error('[sharedResourceAclService] countSharedResourceMembers:', error.message);
    return 0;
  }

  return count ?? 0;
}

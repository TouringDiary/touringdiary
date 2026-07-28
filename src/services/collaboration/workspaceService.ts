import { supabase } from '@/services/supabaseClient';
import type { Json } from '@/types/supabase';
import type { Workspace } from '@/domain/collaboration';
import { mapWorkspaceRow } from './workspaceMappers';

export type CreateWorkspaceResult =
  | { success: true; workspace: Workspace }
  | { success: false; error: string };

export interface CreateWorkspaceInput {
  ownerId: string;
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
}

/** Vincolo business: massimo workspace di proprietà per utente (§7.1.1 GLOBAL_WORKSPACE_PANEL). */
export const MAX_OWNED_WORKSPACES_PER_USER = 2;

export const OWNED_WORKSPACE_LIMIT_MESSAGE =
  'Hai raggiunto il limite massimo di 2 workspace di proprietà. Elimina un workspace per crearne uno nuovo.';

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceService] getWorkspace:', error.message);
    return null;
  }
  if (!data) return null;
  return mapWorkspaceRow(data);
}

/** Nomi workspace per id (1 query batch; fallback «Workspace» lato UI). */
export async function getWorkspaceNamesByIds(
  workspaceIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(workspaceIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return {};

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name')
    .in('id', unique);

  if (error) {
    console.error('[workspaceService] getWorkspaceNamesByIds:', error.message);
    return {};
  }

  const names: Record<string, string> = {};
  for (const row of data ?? []) {
    names[row.id] = row.name;
  }
  return names;
}

export async function listWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const [ownedResult, memberResult] = await Promise.all([
    supabase.from('workspaces').select('*').eq('owner_id', userId).order('updated_at', {
      ascending: false,
    }),
    supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', userId),
  ]);

  if (ownedResult.error) {
    console.error('[workspaceService] listWorkspacesForUser owned:', ownedResult.error.message);
  }
  if (memberResult.error) {
    console.error('[workspaceService] listWorkspacesForUser member:', memberResult.error.message);
  }

  const byId = new Map<string, Workspace>();

  for (const row of ownedResult.data ?? []) {
    byId.set(row.id, mapWorkspaceRow(row));
  }

  for (const row of memberResult.data ?? []) {
    const workspace = row.workspaces;
    if (workspace && !Array.isArray(workspace)) {
      byId.set(workspace.id, mapWorkspaceRow(workspace));
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function countOwnedWorkspaces(ownerId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId);

  if (error) {
    console.error('[workspaceService] countOwnedWorkspaces:', error.message);
    return null;
  }

  return count ?? 0;
}

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<CreateWorkspaceResult> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Il nome del workspace è obbligatorio.' };
  }

  const ownedCount = await countOwnedWorkspaces(input.ownerId);
  if (ownedCount === null) {
    return { success: false, error: 'Impossibile verificare il limite workspace.' };
  }
  if (ownedCount >= MAX_OWNED_WORKSPACES_PER_USER) {
    return { success: false, error: OWNED_WORKSPACE_LIMIT_MESSAGE };
  }

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      owner_id: input.ownerId,
      name: trimmedName,
      description: input.description?.trim() || null,
      settings: (input.settings ?? {}) as Json,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[workspaceService] createWorkspace:', error.message);
    return { success: false, error: 'Impossibile creare il workspace.' };
  }

  return { success: true, workspace: mapWorkspaceRow(data) };
}

export async function updateWorkspace(
  workspaceId: string,
  ownerId: string,
  updates: { name?: string; description?: string; settings?: Record<string, unknown> }
): Promise<CreateWorkspaceResult> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace || workspace.ownerId !== ownerId) {
    return { success: false, error: 'Solo il proprietario può modificare il workspace.' };
  }

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      return { success: false, error: 'Il nome del workspace è obbligatorio.' };
    }
    payload.name = trimmed;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description.trim() || null;
  }
  if (updates.settings !== undefined) {
    payload.settings = updates.settings as Json;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(payload)
    .eq('id', workspaceId)
    .eq('owner_id', ownerId)
    .select('*')
    .single();

  if (error) {
    console.error('[workspaceService] updateWorkspace:', error.message);
    return { success: false, error: 'Impossibile aggiornare il workspace.' };
  }

  return { success: true, workspace: mapWorkspaceRow(data) };
}

export async function isWorkspaceOwner(workspaceId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceService] isWorkspaceOwner:', error.message);
    return false;
  }

  return Boolean(data);
}

export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  if (await isWorkspaceOwner(workspaceId, userId)) return true;

  const { data, error } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceService] isWorkspaceMember:', error.message);
    return false;
  }

  return Boolean(data);
}

/** Elimina un workspace. Solo il proprietario indicato può completare l'operazione. */
export async function deleteWorkspace(
  workspaceId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('owner_id', ownerId)
    .select('id');

  if (error) {
    console.error('[workspaceService] deleteWorkspace:', error.message);
    return { success: false, error: 'Impossibile eliminare il workspace.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Workspace non trovato.' };
  }

  return { success: true };
}

/** Conteggio membri tabella `workspace_members` per workspace (owner non incluso). */
export async function getWorkspaceMemberCounts(
  workspaceIds: string[]
): Promise<Record<string, number>> {
  if (workspaceIds.length === 0) return {};

  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .in('workspace_id', workspaceIds);

  if (error) {
    console.error('[workspaceService] getWorkspaceMemberCounts:', error.message);
    return {};
  }

  const counts: Record<string, number> = Object.fromEntries(
    workspaceIds.map((id) => [id, 0])
  );

  for (const row of data ?? []) {
    counts[row.workspace_id] += 1;
  }

  return counts;
}

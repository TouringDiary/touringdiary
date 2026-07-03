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

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<CreateWorkspaceResult> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { success: false, error: 'Il nome del workspace è obbligatorio.' };
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
  const workspace = await getWorkspace(workspaceId);
  return workspace?.ownerId === userId;
}

export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return false;
  if (workspace.ownerId === userId) return true;

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

/** Elimina un workspace (CASCADE su risorse, membri, permessi, inviti). Solo proprietario. */
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

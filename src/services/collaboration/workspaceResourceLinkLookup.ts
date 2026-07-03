import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind, WorkspaceResource } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { mapWorkspaceResourceRow } from './workspaceMappers';

export async function getWorkspaceResourceByKindAndId(
  workspaceId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<WorkspaceResource | null> {
  const { data, error } = await supabase
    .from('workspace_resources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('kind', kind)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceResourceLinkLookup] getWorkspaceResourceByKindAndId:', error.message);
    return null;
  }
  if (!data) return null;
  return mapWorkspaceResourceRow(data);
}

export async function listWorkspaceResourceLinks(
  workspaceId: string
): Promise<WorkspaceResource[]> {
  const { data, error } = await supabase
    .from('workspace_resources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[workspaceResourceLinkLookup] listWorkspaceResourceLinks:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapWorkspaceResourceRow)
    .filter((resource): resource is WorkspaceResource => resource !== null);
}

export async function isResourceLinkedInWorkspace(
  workspaceId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<boolean> {
  if (!isSharedResourceKind(kind)) return false;
  const linked = await getWorkspaceResourceByKindAndId(workspaceId, kind, resourceId);
  return linked !== null;
}

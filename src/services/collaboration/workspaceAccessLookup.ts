import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind, WorkspaceResourceAccess } from '@/domain/collaboration';
import { isWorkspaceResourceAccess } from '@/domain/collaboration';
import { getWorkspace } from './workspaceService';
import { getWorkspaceResourceByKindAndId } from '@/services/collaboration/workspaceResourceLinkLookup';

export async function getWorkspaceResourceAccessForUser(
  userId: string,
  workspaceId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<WorkspaceResourceAccess> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return 'none';
  if (workspace.ownerId === userId) return 'collaborator';

  const linked = await getWorkspaceResourceByKindAndId(workspaceId, kind, resourceId);
  if (!linked) return 'none';

  const { data, error } = await supabase
    .from('workspace_resource_permissions')
    .select('access_level')
    .eq('workspace_resource_id', linked.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[workspaceAccessLookup] getWorkspaceResourceAccessForUser:', error.message);
    return 'none';
  }
  if (!data?.access_level || !isWorkspaceResourceAccess(data.access_level)) {
    return 'none';
  }

  return data.access_level;
}

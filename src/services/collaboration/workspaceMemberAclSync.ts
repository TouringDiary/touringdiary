import type { SharedResourceKind, WorkspaceResourceAccess } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { ensureShareableResource } from './sharedResourceService';
import { setSharedResourceMember, removeSharedResourceMember } from './sharedResourceAclService';
import { getShareableResource } from './sharedResourceService';
import { resolveResourceOwnerId } from './shareableResourceOwnerLookup';

/**
 * Allinea shared_resource_members all'ACL workspace (Fase 10).
 * Necessario perché l'RLS sul contenuto legge shared_resource_members, non workspace_resource_permissions.
 */
export async function syncSharedResourceAccessFromWorkspacePermission(
  kind: SharedResourceKind,
  resourceId: string,
  userId: string,
  accessLevel: WorkspaceResourceAccess
): Promise<void> {
  if (!isSharedResourceKind(kind)) return;

  const ownerId = await resolveResourceOwnerId(kind, resourceId);
  if (!ownerId || ownerId === userId) return;

  const resource = await getShareableResource(kind, resourceId);

  if (accessLevel === 'none') {
    if (resource) {
      await removeSharedResourceMember(resource.id, ownerId, userId);
    }
    return;
  }

  const registerResult = await ensureShareableResource(kind, resourceId, ownerId, 'collaborative');
  if (registerResult.success !== true) return;

  const role = accessLevel === 'collaborator' ? 'collaborator' : 'viewer';
  await setSharedResourceMember(registerResult.resource.id, ownerId, userId, role);
}

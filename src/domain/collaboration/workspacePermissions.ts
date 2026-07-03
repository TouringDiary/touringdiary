import type { ResourceCapabilities, ResolvedResourcePermission } from './sharedResource';
import { deriveResourceCapabilities } from './permissions';

/**
 * Regole Valigia/Risorsa Personale nel Workspace (§12.5, §15).
 * Contenuto accessibile solo al proprietario salvo permesso workspace esplicito di collaboratore.
 * Un visualizzatore workspace vede il contenuto ma non può modificarlo.
 */
export function applyPersonalModeWorkspaceContentRules(
  permission: ResolvedResourcePermission,
  isResourceOwner: boolean
): ResolvedResourcePermission {
  if (permission.sharingMode !== 'personal' || isResourceOwner) {
    return permission;
  }

  if (permission.workspaceAccess === 'collaborator') {
    return {
      ...permission,
      accessLevel: 'collaborator',
      capabilities: deriveResourceCapabilities('collaborator'),
    };
  }

  if (permission.workspaceAccess === 'viewer') {
    const capabilities: ResourceCapabilities = {
      canView: true,
      canModifyContent: false,
      canDeleteResource: false,
      canManageCollaboration: false,
    };
    return {
      ...permission,
      accessLevel: 'viewer',
      capabilities,
    };
  }

  return {
    ...permission,
    accessLevel: 'none',
    capabilities: deriveResourceCapabilities('none'),
  };
}

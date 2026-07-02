import type {
  AccessLevel,
  CollaborativeMemberRole,
  ResourceCapabilities,
  SharedResourceMember,
  WorkspaceResourceAccess,
} from './sharedResource';

const ACCESS_RANK: Record<AccessLevel, number> = {
  none: 0,
  viewer: 1,
  collaborator: 2,
  owner: 3,
};

function accessLevelFromResourceRole(
  isOwner: boolean,
  memberRole: CollaborativeMemberRole | null
): AccessLevel {
  if (isOwner) return 'owner';
  if (memberRole === 'collaborator') return 'collaborator';
  if (memberRole === 'viewer') return 'viewer';
  return 'none';
}

function accessLevelFromWorkspace(workspaceAccess: WorkspaceResourceAccess): AccessLevel {
  if (workspaceAccess === 'collaborator') return 'collaborator';
  if (workspaceAccess === 'viewer') return 'viewer';
  return 'none';
}

function rankToAccessLevel(rank: number, isOwner: boolean): AccessLevel {
  if (isOwner && rank >= ACCESS_RANK.owner) return 'owner';
  if (rank >= ACCESS_RANK.collaborator) return 'collaborator';
  if (rank >= ACCESS_RANK.viewer) return 'viewer';
  return 'none';
}

/**
 * Risolve il permesso effettivo unendo ACL risorsa e ACL workspace (§12.5, segnalazione S2).
 * Regola: prevale il livello più elevato (Collaboratore > Visualizzatore > Nessun accesso).
 * Il ruolo Proprietario non è mai concesso dal Workspace.
 */
export function resolveEffectiveAccessLevel(
  isOwner: boolean,
  resourceMemberRole: CollaborativeMemberRole | null,
  workspaceAccess: WorkspaceResourceAccess = 'none'
): AccessLevel {
  const resourceLevel = accessLevelFromResourceRole(isOwner, resourceMemberRole);
  const workspaceLevel = accessLevelFromWorkspace(workspaceAccess);

  const rank = Math.max(ACCESS_RANK[resourceLevel], ACCESS_RANK[workspaceLevel]);
  return rankToAccessLevel(rank, isOwner);
}

/** Capacità derivate dal livello effettivo (§7). */
export function deriveResourceCapabilities(accessLevel: AccessLevel): ResourceCapabilities {
  return {
    canView: accessLevel !== 'none',
    canModifyContent: accessLevel === 'owner' || accessLevel === 'collaborator',
    canDeleteResource: accessLevel === 'owner',
    canManageCollaboration: accessLevel === 'owner',
  };
}

/**
 * Stato «condiviso» a livello dati (§11.1).
 * True quando esiste almeno un Collaboratore o Visualizzatore oltre al proprietario.
 */
export function isResourceSharedByMembers(members: Pick<SharedResourceMember, 'role'>[]): boolean {
  return members.length > 0;
}

/**
 * I ruoli piattaforma (Admin, Business, User) non concedono accesso collaborativo.
 * L'override admin è limitato alla governance del sistema (Fase 10), non all'uso dei contenuti.
 */
export function platformRoleGrantsCollaborationAccess(): boolean {
  return false;
}

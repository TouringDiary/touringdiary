import type {
  ResolvedResourcePermission,
  SharedResourceKind,
  WorkspaceResourceAccess,
} from '@/domain/collaboration';
import {
  deriveResourceCapabilities,
  resolveEffectiveAccessLevel,
} from '@/domain/collaboration';
import { getShareableResource } from './sharedResourceService';
import {
  getSharedResourceMember,
  countSharedResourceMembers,
} from './sharedResourceAclService';

export interface ResolvePermissionOptions {
  /** ACL workspace per risorsa (Fase 7). Default `none` = nessun contesto workspace. */
  workspaceAccess?: WorkspaceResourceAccess;
}

/**
 * Servizio centrale di risoluzione permessi (§7, §12.5, S2).
 * Unico punto di verità per tutti i moduli collaborativi.
 */
export async function resolveResourcePermission(
  userId: string,
  kind: SharedResourceKind,
  resourceId: string,
  options: ResolvePermissionOptions = {}
): Promise<ResolvedResourcePermission> {
  const workspaceAccess = options.workspaceAccess ?? 'none';
  const resource = await getShareableResource(kind, resourceId);

  if (!resource) {
    return buildResolvedPermission({
      accessLevel: 'none',
      isOwner: false,
      isShared: false,
      sharingMode: null,
      resourceRole: null,
      workspaceAccess,
    });
  }

  const isOwner = resource.ownerId === userId;

  // Modalità Personale (§4.2, §15): solo il proprietario accede all'istanza originale.
  if (resource.sharingMode === 'personal' && !isOwner) {
    return buildResolvedPermission({
      accessLevel: 'none',
      isOwner: false,
      isShared: false,
      sharingMode: resource.sharingMode,
      resourceRole: null,
      workspaceAccess,
    });
  }

  const member = isOwner ? null : await getSharedResourceMember(resource.id, userId);
  const resourceRole = member?.role ?? null;

  const accessLevel = resolveEffectiveAccessLevel(isOwner, resourceRole, workspaceAccess);
  const memberCount = await countSharedResourceMembers(resource.id);
  const isShared = memberCount > 0;

  return buildResolvedPermission({
    accessLevel,
    isOwner,
    isShared,
    sharingMode: resource.sharingMode,
    resourceRole,
    workspaceAccess,
  });
}

function buildResolvedPermission(input: {
  accessLevel: ResolvedResourcePermission['accessLevel'];
  isOwner: boolean;
  isShared: boolean;
  sharingMode: ResolvedResourcePermission['sharingMode'];
  resourceRole: ResolvedResourcePermission['resourceRole'];
  workspaceAccess: WorkspaceResourceAccess;
}): ResolvedResourcePermission {
  return {
    ...input,
    capabilities: deriveResourceCapabilities(input.accessLevel),
  };
}

/** Stato «condiviso» derivabile per le card (§11.1) — solo dato, senza UI. */
export async function isResourceShared(
  kind: SharedResourceKind,
  resourceId: string
): Promise<boolean> {
  const resource = await getShareableResource(kind, resourceId);
  if (!resource) return false;
  const count = await countSharedResourceMembers(resource.id);
  return count > 0;
}

/** Verifica rapida capacità modifica contenuto. */
export async function canUserModifyResource(
  userId: string,
  kind: SharedResourceKind,
  resourceId: string,
  options?: ResolvePermissionOptions
): Promise<boolean> {
  const permission = await resolveResourcePermission(userId, kind, resourceId, options);
  return permission.capabilities.canModifyContent;
}

/** Verifica rapida capacità eliminazione risorsa. */
export async function canUserDeleteResource(
  userId: string,
  kind: SharedResourceKind,
  resourceId: string,
  options?: ResolvePermissionOptions
): Promise<boolean> {
  const permission = await resolveResourcePermission(userId, kind, resourceId, options);
  return permission.capabilities.canDeleteResource;
}

/** Verifica rapida gestione collaboratori (solo Proprietario). */
export async function canUserManageCollaboration(
  userId: string,
  kind: SharedResourceKind,
  resourceId: string
): Promise<boolean> {
  const permission = await resolveResourcePermission(userId, kind, resourceId);
  return permission.capabilities.canManageCollaboration;
}

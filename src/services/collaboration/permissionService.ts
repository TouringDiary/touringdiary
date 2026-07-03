import type {
  ResolvedResourcePermission,
  SharedResourceKind,
  WorkspaceResourceAccess,
} from '@/domain/collaboration';
import {
  deriveResourceCapabilities,
  resolveEffectiveAccessLevel,
  applyPersonalModeWorkspaceContentRules,
} from '@/domain/collaboration';
import { getShareableResource } from './sharedResourceService';
import {
  getSharedResourceMember,
  countSharedResourceMembers,
} from './sharedResourceAclService';
import { isShareableResourceOwner } from './sharedResourceOwnershipVerifiers';
import { getWorkspaceResourceAccessForUser } from './workspaceAccessLookup';

export interface ResolvePermissionOptions {
  /** ACL workspace per risorsa (Fase 7). Default `none` = nessun contesto workspace. */
  workspaceAccess?: WorkspaceResourceAccess;
  /** Se impostato, risolve automaticamente l'ACL workspace dal database. */
  workspaceId?: string;
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
  let workspaceAccess = options.workspaceAccess ?? 'none';
  if (options.workspaceId && workspaceAccess === 'none') {
    workspaceAccess = await getWorkspaceResourceAccessForUser(
      userId,
      options.workspaceId,
      kind,
      resourceId
    );
  }

  const resource = await getShareableResource(kind, resourceId);

  if (!resource) {
    const isOwner = await isShareableResourceOwner(kind, resourceId, userId);
    if (isOwner) {
      return buildResolvedPermission({
        accessLevel: 'owner',
        isOwner: true,
        isShared: false,
        sharingMode: null,
        resourceRole: null,
        workspaceAccess,
      });
    }

    if (workspaceAccess !== 'none') {
      const permission = buildResolvedPermission({
        accessLevel: resolveEffectiveAccessLevel(false, null, workspaceAccess),
        isOwner: false,
        isShared: false,
        sharingMode: null,
        resourceRole: null,
        workspaceAccess,
      });
      return applyPersonalModeWorkspaceContentRules(permission, false);
    }

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

  if (resource.sharingMode === 'personal' && !isOwner) {
    if (workspaceAccess === 'none') {
      return buildResolvedPermission({
        accessLevel: 'none',
        isOwner: false,
        isShared: false,
        sharingMode: resource.sharingMode,
        resourceRole: null,
        workspaceAccess,
      });
    }

    const permission = buildResolvedPermission({
      accessLevel: resolveEffectiveAccessLevel(false, null, workspaceAccess),
      isOwner: false,
      isShared: false,
      sharingMode: resource.sharingMode,
      resourceRole: null,
      workspaceAccess,
    });
    return applyPersonalModeWorkspaceContentRules(permission, false);
  }

  const member = isOwner ? null : await getSharedResourceMember(resource.id, userId);
  const resourceRole = member?.role ?? null;

  const accessLevel = resolveEffectiveAccessLevel(isOwner, resourceRole, workspaceAccess);
  const memberCount = await countSharedResourceMembers(resource.id);
  const isShared = memberCount > 0;

  const permission = buildResolvedPermission({
    accessLevel,
    isOwner,
    isShared,
    sharingMode: resource.sharingMode,
    resourceRole,
    workspaceAccess,
  });

  return applyPersonalModeWorkspaceContentRules(permission, isOwner);
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

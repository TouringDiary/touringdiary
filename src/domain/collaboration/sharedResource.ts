/** Tipi di Risorsa Condivisibile supportati in v1 (§3). Estendibile senza cambiare il modello. */
export const SHARED_RESOURCE_KINDS = ['diary', 'suitcase', 'user_template'] as const;
export type SharedResourceKind = (typeof SHARED_RESOURCE_KINDS)[number];

/** Ruoli collaborativi su una risorsa (§7) — distinti dai ruoli piattaforma. */
export const COLLABORATIVE_MEMBER_ROLES = ['collaborator', 'viewer'] as const;
export type CollaborativeMemberRole = (typeof COLLABORATIVE_MEMBER_ROLES)[number];

/** Modalità di condivisione (§4). */
export const SHARING_MODES = ['collaborative', 'personal'] as const;
export type SharingMode = (typeof SHARING_MODES)[number];

/**
 * Livello di accesso effettivo su una risorsa.
 * `owner` è sempre legato al proprietario della risorsa, mai concesso dal Workspace.
 */
export const ACCESS_LEVELS = ['none', 'viewer', 'collaborator', 'owner'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/**
 * Permesso workspace per risorsa (§12.5).
 * Predisposto per Fase 7 — nessuna tabella workspace in Fase 2.
 */
export const WORKSPACE_RESOURCE_ACCESS_LEVELS = ['none', 'viewer', 'collaborator'] as const;
export type WorkspaceResourceAccess = (typeof WORKSPACE_RESOURCE_ACCESS_LEVELS)[number];

export interface SharedResource {
  id: string;
  kind: SharedResourceKind;
  resourceId: string;
  ownerId: string;
  sharingMode: SharingMode;
  createdAt: string;
  updatedAt: string;
}

export interface SharedResourceMember {
  id: string;
  sharedResourceId: string;
  userId: string;
  role: CollaborativeMemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface SharedResourceMemberWithProfile extends SharedResourceMember {
  userName: string;
  userSlug?: string;
  userAvatarUrl?: string;
}

export interface ResourceCapabilities {
  canView: boolean;
  canModifyContent: boolean;
  canDeleteResource: boolean;
  canManageCollaboration: boolean;
}

export interface ResolvedResourcePermission {
  accessLevel: AccessLevel;
  isOwner: boolean;
  isShared: boolean;
  sharingMode: SharingMode | null;
  resourceRole: CollaborativeMemberRole | null;
  workspaceAccess: WorkspaceResourceAccess;
  capabilities: ResourceCapabilities;
}

export function isSharedResourceKind(value: string): value is SharedResourceKind {
  return (SHARED_RESOURCE_KINDS as readonly string[]).includes(value);
}

export function isCollaborativeMemberRole(value: string): value is CollaborativeMemberRole {
  return (COLLABORATIVE_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isSharingMode(value: string): value is SharingMode {
  return (SHARING_MODES as readonly string[]).includes(value);
}

/** Etichette utente per tipo risorsa (UI, notifiche, wizard). */
export const SHARED_RESOURCE_KIND_LABELS: Record<SharedResourceKind, string> = {
  diary: 'Diario',
  suitcase: 'Valigia',
  user_template: 'Template',
};

export function getSharedResourceKindLabel(kind: SharedResourceKind): string {
  return SHARED_RESOURCE_KIND_LABELS[kind];
}

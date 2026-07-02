import type {
  SharedResource,
  SharedResourceMember,
  SharedResourceMemberWithProfile,
} from '@/domain/collaboration';
import {
  isCollaborativeMemberRole,
  isSharedResourceKind,
  isSharingMode,
} from '@/domain/collaboration';
import type { Database } from '@/types/supabase';

type SharedResourceRow = Database['public']['Tables']['shared_resources']['Row'];
type SharedResourceMemberRow = Database['public']['Tables']['shared_resource_members']['Row'];

export interface MemberWithProfileRow extends SharedResourceMemberRow {
  profiles: {
    name: string | null;
    slug: string | null;
    avatar_url: string | null;
  } | null;
}

export function mapSharedResourceRow(row: SharedResourceRow): SharedResource | null {
  if (!isSharedResourceKind(row.kind)) {
    console.error('[sharedResourceMappers] kind non valido:', row.kind);
    return null;
  }
  if (!isSharingMode(row.sharing_mode)) {
    console.error('[sharedResourceMappers] sharing_mode non valido:', row.sharing_mode);
    return null;
  }

  return {
    id: row.id,
    kind: row.kind,
    resourceId: row.resource_id,
    ownerId: row.owner_id,
    sharingMode: row.sharing_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSharedResourceMemberRow(
  row: SharedResourceMemberRow
): SharedResourceMember | null {
  if (!isCollaborativeMemberRole(row.role)) {
    console.error('[sharedResourceMappers] role non valido:', row.role);
    return null;
  }

  return {
    id: row.id,
    sharedResourceId: row.shared_resource_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMemberWithProfile(row: MemberWithProfileRow): SharedResourceMemberWithProfile | null {
  const base = mapSharedResourceMemberRow(row);
  if (!base) return null;

  return {
    ...base,
    userName: row.profiles?.name?.trim() || 'Utente',
    userSlug: row.profiles?.slug ?? undefined,
    userAvatarUrl: row.profiles?.avatar_url ?? undefined,
  };
}

export function sharedResourceRef(kind: SharedResource['kind'], resourceId: string) {
  return { kind, resourceId };
}

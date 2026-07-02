import type { ResourceInvite } from '@/domain/collaboration';
import { isCollaborativeMemberRole, isResourceInviteStatus } from '@/domain/collaboration';
import type { Database } from '@/types/supabase';

type ResourceInviteRow = Database['public']['Tables']['resource_invites']['Row'];

export function mapResourceInviteRow(row: ResourceInviteRow): ResourceInvite | null {
  if (!isCollaborativeMemberRole(row.role)) {
    console.error('[resourceInviteMappers] role non valido:', row.role);
    return null;
  }
  if (!isResourceInviteStatus(row.status)) {
    console.error('[resourceInviteMappers] status non valido:', row.status);
    return null;
  }

  return {
    id: row.id,
    sharedResourceId: row.shared_resource_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

import type { CollaborativeMemberRole } from './sharedResource';

/** Stati del ciclo di vita invito a risorsa (§6). */
export const RESOURCE_INVITE_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'revoked',
] as const;
export type ResourceInviteStatus = (typeof RESOURCE_INVITE_STATUSES)[number];

export interface ResourceInvite {
  id: string;
  sharedResourceId: string;
  inviterId: string;
  inviteeId: string;
  role: CollaborativeMemberRole;
  status: ResourceInviteStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

export interface CollaborationUserSearchResult {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string;
}

export function isResourceInviteStatus(value: string): value is ResourceInviteStatus {
  return (RESOURCE_INVITE_STATUSES as readonly string[]).includes(value);
}

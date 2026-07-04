export const FRIEND_REQUEST_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export type FriendRequestStatus = (typeof FRIEND_REQUEST_STATUSES)[number];

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface FriendRequestWithProfile extends FriendRequest {
  requesterName: string;
  requesterSlug?: string;
  requesterAvatarUrl?: string;
  addresseeName: string;
  addresseeSlug?: string;
  addresseeAvatarUrl?: string;
}

export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
}

export interface FriendWithProfile extends FriendConnection {
  friendName: string;
  friendSlug?: string;
  friendAvatarUrl?: string;
}

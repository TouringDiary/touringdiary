import type {
  FriendConnection,
  FriendRequest,
  FriendRequestStatus,
  FriendRequestWithProfile,
  FriendWithProfile,
} from '@/domain/collaboration/friendship';
import { supabase } from '@/services/supabaseClient';
import { areUsersBlocked } from './userBlockService';
import { searchUsersForCollaborationInvite } from './collaborationUserSearchService';
import {
  notifyFriendRequestAccepted,
  notifyFriendRequestReceived,
} from './collaborationNotificationService';

interface FriendRequestRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
}

interface ProfileSnippet {
  name: string | null;
  slug: string | null;
  avatar_url: string | null;
}

function mapFriendRequest(row: FriendRequestRow): FriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

async function loadProfiles(userIds: string[]): Promise<Map<string, ProfileSnippet>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, name, slug, avatar_url')
    .in('id', userIds);
  const map = new Map<string, ProfileSnippet>();
  for (const row of data ?? []) {
    map.set(row.id, {
      name: row.name,
      slug: row.slug,
      avatar_url: row.avatar_url,
    });
  }
  return map;
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<{ success: boolean; error?: string }> {
  if (requesterId === addresseeId) {
    return { success: false, error: 'Non puoi inviare una richiesta a te stesso.' };
  }

  if (await areUsersBlocked(requesterId, addresseeId)) {
    return { success: false, error: 'Non è possibile inviare la richiesta a questo utente.' };
  }

  const { data: existingFriend } = await supabase
    .from('user_friends')
    .select('id')
    .eq('user_id', requesterId)
    .eq('friend_id', addresseeId)
    .maybeSingle();

  if (existingFriend) {
    return { success: false, error: 'Siete già amici.' };
  }

  const { error } = await supabase.from('user_friend_requests').upsert(
    {
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: 'pending',
      responded_at: null,
    },
    { onConflict: 'requester_id,addressee_id' }
  );

  if (error) {
    console.error('[friendService] sendFriendRequest:', error.message);
    return { success: false, error: 'Impossibile inviare la richiesta.' };
  }

  const requesterProfiles = await loadProfiles([requesterId]);
  const requesterName = requesterProfiles.get(requesterId)?.name?.trim() || 'Un utente';

  const { data: requestRow } = await supabase
    .from('user_friend_requests')
    .select('id')
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .maybeSingle();

  if (requestRow?.id) {
    void notifyFriendRequestReceived(addresseeId, requesterName, requestRow.id).catch(
      (notificationError) => {
        console.error('[friendService] notifyFriendRequestReceived:', notificationError);
      }
    );
  }

  return { success: true };
}

async function insertFriendPair(userA: string, userB: string): Promise<boolean> {
  const { error } = await supabase.from('user_friends').upsert(
    [
      { user_id: userA, friend_id: userB },
      { user_id: userB, friend_id: userA },
    ],
    { onConflict: 'user_id,friend_id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('[friendService] insertFriendPair:', error.message);
    return false;
  }

  return true;
}

export async function acceptFriendRequest(
  addresseeId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('user_friend_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error || !data) {
    return { success: false, error: 'Richiesta non valida o già gestita.' };
  }

  const pairInserted = await insertFriendPair(data.requester_id, data.addressee_id);
  if (!pairInserted) {
    return { success: false, error: 'Impossibile registrare l\'amicizia.' };
  }

  const addresseeProfiles = await loadProfiles([addresseeId]);
  const addresseeName = addresseeProfiles.get(addresseeId)?.name?.trim() || 'Un utente';
  void notifyFriendRequestAccepted(data.requester_id, addresseeName).catch((notificationError) => {
    console.error('[friendService] notifyFriendRequestAccepted:', notificationError);
  });

  return { success: true };
}

export async function rejectFriendRequest(
  addresseeId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('user_friend_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: 'Impossibile rifiutare la richiesta.' };
  }

  return { success: true };
}

export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  const { error: a } = await supabase
    .from('user_friends')
    .delete()
    .eq('user_id', userId)
    .eq('friend_id', friendId);
  const { error: b } = await supabase
    .from('user_friends')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', userId);

  if (a || b) {
    return { success: false, error: 'Impossibile rimuovere l\'amicizia.' };
  }

  return { success: true };
}

export async function listFriends(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from('user_friends')
    .select('id, user_id, friend_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[friendService] listFriends:', error.message);
    return [];
  }

  const friendIds = (data ?? []).map((row) => row.friend_id);
  const profiles = await loadProfiles(friendIds);

  return (data ?? []).map((row) => {
    const profile = profiles.get(row.friend_id);
    return {
      id: row.id,
      userId: row.user_id,
      friendId: row.friend_id,
      createdAt: row.created_at,
      friendName: profile?.name?.trim() || 'Utente',
      friendSlug: profile?.slug ?? undefined,
      friendAvatarUrl: profile?.avatar_url ?? undefined,
    };
  });
}

export async function listIncomingFriendRequests(userId: string): Promise<FriendRequestWithProfile[]> {
  const { data, error } = await supabase
    .from('user_friend_requests')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return [];

  const ids = new Set<string>();
  for (const row of data ?? []) {
    ids.add(row.requester_id);
    ids.add(row.addressee_id);
  }
  const profiles = await loadProfiles([...ids]);

  return (data as FriendRequestRow[]).map((row) => {
    const requester = profiles.get(row.requester_id);
    const addressee = profiles.get(row.addressee_id);
    const base = mapFriendRequest(row);
    return {
      ...base,
      requesterName: requester?.name?.trim() || 'Utente',
      requesterSlug: requester?.slug ?? undefined,
      requesterAvatarUrl: requester?.avatar_url ?? undefined,
      addresseeName: addressee?.name?.trim() || 'Utente',
      addresseeSlug: addressee?.slug ?? undefined,
      addresseeAvatarUrl: addressee?.avatar_url ?? undefined,
    };
  });
}

export async function listOutgoingFriendRequests(userId: string): Promise<FriendRequestWithProfile[]> {
  const { data, error } = await supabase
    .from('user_friend_requests')
    .select('*')
    .eq('requester_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return [];

  const ids = new Set<string>();
  for (const row of data ?? []) {
    ids.add(row.requester_id);
    ids.add(row.addressee_id);
  }
  const profiles = await loadProfiles([...ids]);

  return (data as FriendRequestRow[]).map((row) => {
    const requester = profiles.get(row.requester_id);
    const addressee = profiles.get(row.addressee_id);
    const base = mapFriendRequest(row);
    return {
      ...base,
      requesterName: requester?.name?.trim() || 'Utente',
      requesterSlug: requester?.slug ?? undefined,
      requesterAvatarUrl: requester?.avatar_url ?? undefined,
      addresseeName: addressee?.name?.trim() || 'Utente',
      addresseeSlug: addressee?.slug ?? undefined,
      addresseeAvatarUrl: addressee?.avatar_url ?? undefined,
    };
  });
}

export async function searchUsersForFriendRequest(
  actorId: string,
  query: string
): Promise<Awaited<ReturnType<typeof searchUsersForCollaborationInvite>>> {
  return searchUsersForCollaborationInvite(actorId, query);
}

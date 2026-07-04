import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import type { User } from '@/types/users';
import {
  acceptFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
  rejectFriendRequest,
  removeFriend,
  searchUsersForFriendRequest,
  sendFriendRequest,
} from '@/services/collaboration/friendService';
import type { FriendRequestWithProfile, FriendWithProfile } from '@/domain/collaboration/friendship';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { listBlockedUserIds, unblockUser, blockUser } from '@/services/collaboration/userBlockService';
import { supabase } from '@/services/supabaseClient';

interface BlockedUserRow {
  id: string;
  name: string;
  slug?: string;
}

interface Props {
  user: User;
}

export const UserFriendsTab: React.FC<Props> = ({ user }) => {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestWithProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestWithProfile[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CollaborationUserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendList, incomingList, outgoingList, blocked] = await Promise.all([
        listFriends(user.id),
        listIncomingFriendRequests(user.id),
        listOutgoingFriendRequests(user.id),
        listBlockedUserIds(user.id),
      ]);
      setFriends(friendList);
      setIncoming(incomingList);
      setOutgoing(outgoingList);

      if (blocked.length === 0) {
        setBlockedUsers([]);
      } else {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, slug')
          .in('id', blocked);
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
        setBlockedUsers(
          blocked.map((id) => {
            const profile = profileById.get(id);
            return {
              id,
              name: profile?.name?.trim() || 'Utente',
              slug: profile?.slug ?? undefined,
            };
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3 && !trimmed.includes('@')) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersForFriendRequest(user.id, trimmed);
        const excluded = new Set([user.id, ...friends.map((f) => f.friendId), ...blockedUsers.map((b) => b.id)]);
        setSearchResults(results.filter((r) => !excluded.has(r.id)));
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, user.id, friends, blockedUsers]);

  const handleSendRequest = async (target: CollaborationUserSearchResult) => {
    setActionError(null);
    const result = await sendFriendRequest(user.id, target.id);
    if (!result.success) {
      setActionError(result.error ?? 'Invio non riuscito.');
      return;
    }
    setSearchQuery('');
    setSearchResults([]);
    await refresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Amici</h2>
          <p className="text-sm text-slate-400">Cerca utenti per Nome utente o email.</p>
        </div>
      </header>

      <section className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Cerca utente</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Email o Nome utente"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white"
          />
        </div>
        {isSearching && (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Ricerca...
          </p>
        )}
        {searchResults.length > 0 && (
          <ul className="rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
            {searchResults.map((result) => (
              <li key={result.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{result.name}</p>
                  {result.slug && <p className="text-xs text-slate-400">@{result.slug}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSendRequest(result)}
                  className="text-xs font-semibold text-indigo-300 hover:text-white inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Aggiungi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {isLoading ? (
        <div className="flex justify-center py-8 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Richieste ricevute</h3>
            {incoming.length === 0 ? (
              <p className="text-sm text-slate-500">Nessuna richiesta in attesa.</p>
            ) : (
              incoming.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-800"
                >
                  <p className="text-sm text-white">{request.requesterName}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void acceptFriendRequest(user.id, request.id).then(refresh)}
                      className="text-xs px-2 py-1 rounded bg-emerald-600/20 text-emerald-300"
                    >
                      Accetta
                    </button>
                    <button
                      type="button"
                      onClick={() => void rejectFriendRequest(user.id, request.id).then(refresh)}
                      className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300"
                    >
                      Rifiuta
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Richieste inviate</h3>
            {outgoing.length === 0 ? (
              <p className="text-sm text-slate-500">Nessuna richiesta in attesa di risposta.</p>
            ) : (
              outgoing.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{request.addresseeName}</p>
                    {request.addresseeSlug && (
                      <p className="text-xs text-slate-400">@{request.addresseeSlug}</p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/90 shrink-0">
                    In attesa
                  </span>
                </div>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">I tuoi amici</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-500">Nessun amico ancora.</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-800"
                >
                  <div>
                    <p className="text-sm text-white">{friend.friendName}</p>
                    {friend.friendSlug && (
                      <p className="text-xs text-slate-400">@{friend.friendSlug}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void blockUser(user.id, friend.friendId).then(refresh)}
                      className="text-xs text-slate-400 hover:text-amber-400"
                    >
                      Blocca
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFriend(user.id, friend.friendId).then(refresh)}
                      className="text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1"
                    >
                      <UserMinus className="w-3 h-3" />
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {blockedUsers.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Utenti bloccati</h3>
              {blockedUsers.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{blocked.name}</p>
                    {blocked.slug && <p className="text-xs text-slate-400">@{blocked.slug}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void unblockUser(user.id, blocked.id).then(refresh)}
                    className="text-xs font-semibold text-indigo-300 hover:text-white shrink-0"
                  >
                    Sblocca
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

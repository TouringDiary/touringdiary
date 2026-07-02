import { supabase } from '@/services/supabaseClient';
import { normalizeUsernameToSlug } from '@/domain/profile/username';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { getMutuallyBlockedUserIds } from './userBlockService';

const SEARCH_LIMIT = 10;
const MIN_USERNAME_QUERY_LENGTH = 3;

interface ProfileSearchRow {
  id: string;
  name: string | null;
  slug: string | null;
  avatar_url: string | null;
}

function mapProfileSearchRow(row: ProfileSearchRow): CollaborationUserSearchResult {
  return {
    id: row.id,
    name: row.name?.trim() || 'Utente',
    slug: row.slug ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

function isEligibleInviteProfile(profile: ProfileSearchRow, searcherId: string): boolean {
  return profile.id !== searcherId && Boolean(profile.slug?.trim());
}

async function toInviteSearchResults(
  searcherId: string,
  profiles: ProfileSearchRow[]
): Promise<CollaborationUserSearchResult[]> {
  const eligible = profiles.filter((profile) => isEligibleInviteProfile(profile, searcherId));
  if (eligible.length === 0) return [];

  const blockedIds = await getMutuallyBlockedUserIds(
    searcherId,
    eligible.map((profile) => profile.id)
  );

  const results: CollaborationUserSearchResult[] = [];
  for (const profile of eligible) {
    if (blockedIds.has(profile.id)) continue;
    results.push(mapProfileSearchRow(profile));
    if (results.length >= SEARCH_LIMIT) break;
  }

  return results;
}

export async function resolveUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();

  if (error) {
    console.error('[collaborationUserSearch] resolveUserIdByEmail:', error.message);
    return null;
  }

  return data?.id ?? null;
}

export async function resolveUserIdByUsername(username: string): Promise<string | null> {
  const slug = normalizeUsernameToSlug(username);
  if (!slug) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[collaborationUserSearch] resolveUserIdByUsername:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Ricerca utenti per inviti (§6): email esatta o prefisso Nome utente.
 * Esclude sé stessi, utenti senza Nome utente e utenti bloccati.
 */
export async function searchUsersForCollaborationInvite(
  searcherId: string,
  query: string
): Promise<CollaborationUserSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (trimmed.includes('@')) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, slug, avatar_url')
      .eq('email', trimmed.toLowerCase())
      .limit(1);

    if (error) {
      console.error('[collaborationUserSearch] searchByEmail:', error.message);
      return [];
    }

    return toInviteSearchResults(searcherId, data ?? []);
  }

  const slugPrefix = normalizeUsernameToSlug(trimmed);
  if (slugPrefix.length < MIN_USERNAME_QUERY_LENGTH) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, slug, avatar_url')
    .ilike('slug', `${slugPrefix}%`)
    .limit(SEARCH_LIMIT + 5);

  if (error) {
    console.error('[collaborationUserSearch] searchByUsername:', error.message);
    return [];
  }

  return toInviteSearchResults(searcherId, data ?? []);
}

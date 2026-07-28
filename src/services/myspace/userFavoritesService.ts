/**
 * Preferiti — attributo trasversale (DOC 35 §7 / PV-003).
 * Non crea entità, copie, raccolte o cartelle.
 */
import { supabase } from '@/services/supabaseClient';

export const USER_FAVORITE_ENTITY_KINDS = [
  'city',
  'poi',
  'shop',
  'guide',
  'tour_operator',
  'character',
  'viaggio',
  'suitcase',
  'template',
] as const;

export type UserFavoriteEntityKind = (typeof USER_FAVORITE_ENTITY_KINDS)[number];

export interface UserFavorite {
  userId: string;
  entityKind: UserFavoriteEntityKind;
  entityId: string;
  createdAt: string;
}

function isEntityKind(value: string): value is UserFavoriteEntityKind {
  return (USER_FAVORITE_ENTITY_KINDS as readonly string[]).includes(value);
}

function mapRow(row: {
  user_id: string;
  entity_kind: string;
  entity_id: string;
  created_at: string;
}): UserFavorite | null {
  if (!isEntityKind(row.entity_kind)) return null;
  return {
    userId: row.user_id,
    entityKind: row.entity_kind,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}

export async function listUserFavorites(userId: string): Promise<UserFavorite[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('user_id, entity_kind, entity_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[userFavoritesService] listUserFavorites:', error.message);
    return [];
  }

  return (data ?? [])
    .map(mapRow)
    .filter((row): row is UserFavorite => row !== null);
}

export async function isUserFavorite(
  userId: string,
  entityKind: UserFavoriteEntityKind,
  entityId: string,
): Promise<boolean> {
  const id = entityId.trim();
  if (!id) return false;

  const { data, error } = await supabase
    .from('user_favorites')
    .select('entity_id')
    .eq('user_id', userId)
    .eq('entity_kind', entityKind)
    .eq('entity_id', id)
    .maybeSingle();

  if (error) {
    console.error('[userFavoritesService] isUserFavorite:', error.message);
    return false;
  }
  return Boolean(data);
}

export async function addUserFavorite(
  userId: string,
  entityKind: UserFavoriteEntityKind,
  entityId: string,
): Promise<boolean> {
  const id = entityId.trim();
  if (!id) return false;

  const { error } = await supabase.from('user_favorites').upsert(
    {
      user_id: userId,
      entity_kind: entityKind,
      entity_id: id,
    },
    { onConflict: 'user_id,entity_kind,entity_id', ignoreDuplicates: true },
  );

  if (error) {
    console.error('[userFavoritesService] addUserFavorite:', error.message);
    return false;
  }
  return true;
}

export async function removeUserFavorite(
  userId: string,
  entityKind: UserFavoriteEntityKind,
  entityId: string,
): Promise<boolean> {
  const id = entityId.trim();
  if (!id) return false;

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_kind', entityKind)
    .eq('entity_id', id);

  if (error) {
    console.error('[userFavoritesService] removeUserFavorite:', error.message);
    return false;
  }
  return true;
}

export async function toggleUserFavorite(
  userId: string,
  entityKind: UserFavoriteEntityKind,
  entityId: string,
): Promise<{ ok: boolean; isFavorite: boolean }> {
  const currently = await isUserFavorite(userId, entityKind, entityId);
  if (currently) {
    const ok = await removeUserFavorite(userId, entityKind, entityId);
    return { ok, isFavorite: ok ? false : true };
  }
  const ok = await addUserFavorite(userId, entityKind, entityId);
  return { ok, isFavorite: ok ? true : false };
}

import { supabase } from '@/services/supabaseClient';

function blockBetweenOrFilter(userA: string, userB: string): string {
  return [
    `and(blocker_id.eq.${userA},blocked_id.eq.${userB})`,
    `and(blocker_id.eq.${userB},blocked_id.eq.${userA})`,
  ].join(',');
}

export async function areUsersBlocked(userA: string, userB: string): Promise<boolean> {
  if (userA === userB) return false;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('id')
    .or(blockBetweenOrFilter(userA, userB))
    .limit(1);

  if (error) {
    console.error('[userBlockService] areUsersBlocked:', error.message);
    return true;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Blocchi bidirezionali tra userId e candidateIds (max 2 query).
 * In caso di errore restituisce tutti i candidati come bloccati (conservativo).
 */
export async function getMutuallyBlockedUserIds(
  userId: string,
  candidateIds: string[]
): Promise<Set<string>> {
  const ids = [...new Set(candidateIds.filter((id) => id !== userId))];
  if (ids.length === 0) return new Set();

  const [outgoing, incoming] = await Promise.all([
    supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId).in('blocked_id', ids),
    supabase.from('user_blocks').select('blocker_id').eq('blocked_id', userId).in('blocker_id', ids),
  ]);

  if (outgoing.error || incoming.error) {
    console.error(
      '[userBlockService] getMutuallyBlockedUserIds:',
      outgoing.error?.message ?? incoming.error?.message
    );
    return new Set(ids);
  }

  const blocked = new Set<string>();
  for (const row of outgoing.data ?? []) blocked.add(row.blocked_id);
  for (const row of incoming.data ?? []) blocked.add(row.blocker_id);
  return blocked;
}

export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  if (blockerId === blockedId) {
    return { success: false, error: 'Non puoi bloccare te stesso.' };
  }

  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: true };
    }
    console.error('[userBlockService] blockUser:', error.message);
    return { success: false, error: 'Impossibile bloccare l\'utente.' };
  }

  return { success: true };
}

export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .select('id');

  if (error) {
    console.error('[userBlockService] unblockUser:', error.message);
    return { success: false, error: 'Impossibile sbloccare l\'utente.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Blocco non trovato.' };
  }

  return { success: true };
}

export async function listBlockedUserIds(blockerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId);

  if (error) {
    console.error('[userBlockService] listBlockedUserIds:', error.message);
    return [];
  }

  return data?.map((row) => row.blocked_id) ?? [];
}

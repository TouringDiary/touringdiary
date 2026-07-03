import { supabase } from '@/services/supabaseClient';

/**
 * Lock minimo Diario v1 (§13) — solo infrastruttura dati.
 * Enforcement UI, timeout e presenza live: Fase 9.
 */

export async function tryAcquireDiaryEditLock(sharedResourceId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('try_acquire_shared_resource_edit_lock', {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error('[diaryLockService] tryAcquireDiaryEditLock:', error.message);
    return false;
  }

  return data === true;
}

export async function releaseDiaryEditLock(sharedResourceId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('release_shared_resource_edit_lock', {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error('[diaryLockService] releaseDiaryEditLock:', error.message);
    return false;
  }

  return data === true;
}

export async function getDiaryEditLockHolder(sharedResourceId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_shared_resource_edit_lock_holder', {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error('[diaryLockService] getDiaryEditLockHolder:', error.message);
    return null;
  }

  return typeof data === 'string' ? data : null;
}

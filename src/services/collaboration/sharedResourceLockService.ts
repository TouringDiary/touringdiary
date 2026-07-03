import { supabase } from '@/services/supabaseClient';
import type { SharedResourceEditLockState } from '@/domain/collaboration/collaborationLive';

type LockBooleanRpc =
  | 'try_acquire_shared_resource_edit_lock'
  | 'refresh_shared_resource_edit_lock'
  | 'release_shared_resource_edit_lock';

function parseLockState(data: unknown): SharedResourceEditLockState {
  if (!data || typeof data !== 'object') {
    return { lockedBy: null, lockedAt: null };
  }

  const record = data as Record<string, unknown>;
  return {
    lockedBy: typeof record.locked_by === 'string' ? record.locked_by : null,
    lockedAt: typeof record.locked_at === 'string' ? record.locked_at : null,
  };
}

async function callLockBooleanRpc(
  rpcName: LockBooleanRpc,
  sharedResourceId: string,
  logLabel: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc(rpcName, {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error(`[sharedResourceLockService] ${logLabel}:`, error.message);
    return false;
  }

  return data === true;
}

export async function tryAcquireSharedResourceEditLock(sharedResourceId: string): Promise<boolean> {
  return callLockBooleanRpc('try_acquire_shared_resource_edit_lock', sharedResourceId, 'tryAcquire');
}

export async function refreshSharedResourceEditLock(sharedResourceId: string): Promise<boolean> {
  return callLockBooleanRpc('refresh_shared_resource_edit_lock', sharedResourceId, 'refresh');
}

export async function releaseSharedResourceEditLock(sharedResourceId: string): Promise<boolean> {
  return callLockBooleanRpc('release_shared_resource_edit_lock', sharedResourceId, 'release');
}

export async function getSharedResourceEditLockHolder(sharedResourceId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_shared_resource_edit_lock_holder', {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error('[sharedResourceLockService] getHolder:', error.message);
    return null;
  }

  return typeof data === 'string' ? data : null;
}

export async function getSharedResourceEditLockState(
  sharedResourceId: string
): Promise<SharedResourceEditLockState> {
  const { data, error } = await supabase.rpc('get_shared_resource_edit_lock_state', {
    p_shared_resource_id: sharedResourceId,
  });

  if (error) {
    console.error('[sharedResourceLockService] getState:', error.message);
    return { lockedBy: null, lockedAt: null };
  }

  return parseLockState(data);
}

import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

export type Mf3RpcName =
  | 'transition_media_asset_status'
  | 'get_ai_verify_queue_counts'
  | 'list_ai_verify_queue'
  | 'record_image_verification_run'
  | 'complete_ai_verify_admin_decision'
  | 'save_wikimedia_validation_notes'
  | 'set_wikimedia_validation'
  | 'set_media_asset_admin_block'
  | 'hard_delete_media_photo'
  | 'release_media_hard_delete_objects';

export async function mf3Rpc<T>(
  fn: Mf3RpcName,
  args: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const client = supabase as unknown as {
    rpc: (name: string, params: Record<string, unknown>) => Promise<RpcResult<T>>;
  };
  return client.rpc(fn, args);
}

export function mf3MediaAssetsTable() {
  return supabase.from('media_assets');
}

export function mf3ImageVerificationRunsTable() {
  return supabase.from('image_verification_runs');
}

export function mf3ImageVerificationStepsTable() {
  return supabase.from('image_verification_steps');
}

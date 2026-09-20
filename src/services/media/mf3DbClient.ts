import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

export type Mf3RpcName =
  | 'transition_media_asset_status'
  | 'get_ai_verify_queue_counts'
  | 'list_ai_verify_queue'
  | 'record_image_verification_run'
  | 'complete_ai_verify_admin_decision';

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
  const client = supabase as unknown as {
    from: (table: 'media_assets') => ReturnType<typeof supabase.from>;
  };
  return client.from('media_assets');
}

export function mf3ImageVerificationRunsTable() {
  const client = supabase as unknown as {
    from: (table: 'image_verification_runs') => ReturnType<typeof supabase.from>;
  };
  return client.from('image_verification_runs');
}

export function mf3ImageVerificationStepsTable() {
  const client = supabase as unknown as {
    from: (table: 'image_verification_steps') => ReturnType<typeof supabase.from>;
  };
  return client.from('image_verification_steps');
}

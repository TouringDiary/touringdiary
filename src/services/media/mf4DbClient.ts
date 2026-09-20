import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

export type Mf4RpcName = 'safe_archive_media_asset' | 'append_entity_image_history';

export async function mf4Rpc<T>(
  fn: Mf4RpcName,
  args: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const client = supabase as unknown as {
    rpc: (name: string, params: Record<string, unknown>) => Promise<RpcResult<T>>;
  };
  return client.rpc(fn, args);
}

export function mf4MediaCatalogView() {
  const client = supabase as unknown as {
    from: (table: 'media_assets_with_usage_count') => ReturnType<typeof supabase.from>;
  };
  return client.from('media_assets_with_usage_count');
}

export function mf4EntityImageHistoryTable() {
  const client = supabase as unknown as {
    from: (table: 'entity_image_history') => ReturnType<typeof supabase.from>;
  };
  return client.from('entity_image_history');
}

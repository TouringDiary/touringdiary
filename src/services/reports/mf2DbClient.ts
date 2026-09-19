import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Invoca RPC MF2 fino a rigenerazione tipi supabase.ts post-migration MF2.
 * Boundary unico temporaneo — rimuovere i cast quando `src/types/supabase.ts` include
 * content_reports e le RPC create_content_report_group / transition_report_status / ecc.
 */
export async function mf2Rpc<T>(
  fn:
    | 'create_content_report_group'
    | 'transition_report_status'
    | 'get_report_admin_context'
    | 'capture_report_evidence'
    | 'upsert_entity_image_assignment_dual_write',
  args: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const client = supabase as unknown as {
    rpc: (name: string, params: Record<string, unknown>) => Promise<RpcResult<T>>;
  };
  return client.rpc(fn, args);
}

/** Query tabella content_reports fino a tipi Supabase rigenerati. */
export function mf2ContentReportsTable() {
  const client = supabase as unknown as {
    from: (table: 'content_reports') => ReturnType<typeof supabase.from>;
  };
  return client.from('content_reports');
}

/** Query tabella entity_image_assignments fino a tipi Supabase rigenerati. */
export function mf2EntityImageAssignmentsTable() {
  const client = supabase as unknown as {
    from: (table: 'entity_image_assignments') => ReturnType<typeof supabase.from>;
  };
  return client.from('entity_image_assignments');
}

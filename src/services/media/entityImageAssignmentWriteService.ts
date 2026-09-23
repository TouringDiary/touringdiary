import type { PostgrestError } from '@supabase/supabase-js';
import type { MediaOriginTypeDb } from '@/constants/governance';
import { supabase } from '../supabaseClient';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

/** RPC transitoria MF5 (non in `mf2DbClient` union — decommission STEP 10). */
const TRANSITORY_ASSIGNMENT_RPC = 'upsert_entity_image_assignment_dual_write';

export type EntityImageAssignmentEntityType = 'city_person' | 'poi' | 'patron' | 'photo_submission';

export type EntityImageAssignmentRole = 'primary' | 'gallery';

export type UpsertEntityImageAssignmentFromSourceInput = {
  entityType: EntityImageAssignmentEntityType;
  entityId: string;
  cityId: string;
  assignmentRole?: EntityImageAssignmentRole;
  source: {
    imageUrl: string | null;
    storageBucket: string | null;
    storagePath: string | null;
    originType: MediaOriginTypeDb;
  };
};

type TransitoryAssignmentRpcArgs = {
  p_entity_type: EntityImageAssignmentEntityType;
  p_entity_id: string;
  p_city_id: string;
  p_image_url: string | null;
  p_storage_bucket: string | null;
  p_storage_path: string | null;
  p_assignment_role: EntityImageAssignmentRole;
  p_origin_type: MediaOriginTypeDb;
};

/** Client Supabase minimo: RPC transitoria assente da `src/types/supabase.ts` (STEP 10 MF5). */
type TransitoryAssignmentSupabaseClient = {
  rpc: (
    name: typeof TRANSITORY_ASSIGNMENT_RPC,
    args: TransitoryAssignmentRpcArgs,
  ) => Promise<RpcResult<string>>;
};

async function invokeTransitoryAssignmentRpc(
  params: TransitoryAssignmentRpcArgs,
): Promise<RpcResult<string>> {
  const client = supabase as unknown as TransitoryAssignmentSupabaseClient;
  return client.rpc(TRANSITORY_ASSIGNMENT_RPC, params);
}

/**
 * Materializza `media_assets` + `entity_image_assignments` via RPC server-side (SECURITY DEFINER).
 * Per flussi senza D90 dedicato (photo, patron gallery, wikimedia, portrait AI library).
 * Non aggiorna colonne legacy entità; non sostituisce save person/POI D90.
 */
export async function upsertEntityImageAssignmentFromSource(
  input: UpsertEntityImageAssignmentFromSourceInput,
): Promise<string> {
  const entityId = input.entityId.trim();
  const cityId = input.cityId.trim();
  if (!entityId || !cityId) {
    throw new Error('entity_id e city_id obbligatori per materializzazione assignment.');
  }
  if (input.entityType === 'patron' && entityId !== cityId) {
    throw new Error('Patrono: entity_id deve coincidere con city_id.');
  }

  const imageUrl = input.source.imageUrl?.trim() ? input.source.imageUrl.trim() : null;
  const storageBucket = input.source.storageBucket?.trim()
    ? input.source.storageBucket.trim()
    : null;
  const storagePath = input.source.storagePath?.trim() ? input.source.storagePath.trim() : null;
  if (!imageUrl && !storagePath) {
    throw new Error('Immagine sorgente assente (URL o storage path).');
  }

  const assignmentRole: EntityImageAssignmentRole = input.assignmentRole ?? 'primary';

  const { data, error } = await invokeTransitoryAssignmentRpc({
    p_entity_type: input.entityType,
    p_entity_id: entityId,
    p_city_id: cityId,
    p_image_url: imageUrl,
    p_storage_bucket: storageBucket,
    p_storage_path: storagePath,
    p_assignment_role: assignmentRole,
    p_origin_type: input.source.originType,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error(`${TRANSITORY_ASSIGNMENT_RPC}: identificativo assignment assente.`);
  }
  return data;
}

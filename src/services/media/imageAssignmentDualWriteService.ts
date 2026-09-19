import { mf2Rpc } from '@/services/reports/mf2DbClient';

export type DualWriteEntityType = 'city_person' | 'poi' | 'patron' | 'photo_submission';
export type DualWriteAssignmentRole = 'primary' | 'gallery';

/** Valori canonici media_assets.origin_type (MF2 §42.1 / audit). */
export type DualWriteImageOriginType = 'admin' | 'ai' | 'wikimedia' | 'community' | 'placeholder';

export type DualWriteImageSource = {
  imageUrl: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  originType?: DualWriteImageOriginType;
};

export type DualWriteTarget = {
  entityType: DualWriteEntityType;
  entityId: string;
  cityId: string;
  assignmentRole?: DualWriteAssignmentRole;
  source: DualWriteImageSource;
};

function hasResolvableSource(source: DualWriteImageSource): boolean {
  const url = source.imageUrl?.trim() ?? '';
  const path = source.storagePath?.trim() ?? '';
  return url.length > 0 || path.length > 0;
}

/**
 * MF2 §42.15 — materializza media_assets + entity_image_assignments via RPC SECURITY DEFINER.
 * Fail-closed: errori RPC propagati al caller (nessun silenziamento).
 */
export async function upsertEntityImageAssignmentDualWrite(
  target: DualWriteTarget,
): Promise<string> {
  if (!hasResolvableSource(target.source)) {
    throw new Error('Dual-write: sorgente immagine assente.');
  }

  const { data, error } = await mf2Rpc<string>('upsert_entity_image_assignment_dual_write', {
    p_entity_type: target.entityType,
    p_entity_id: target.entityId,
    p_city_id: target.cityId,
    p_image_url: target.source.imageUrl?.trim() ?? null,
    p_storage_bucket: target.source.storageBucket?.trim() ?? null,
    p_storage_path: target.source.storagePath?.trim() ?? null,
    p_assignment_role: target.assignmentRole ?? 'primary',
    p_origin_type: target.source.originType ?? 'admin',
  });

  if (error) {
    throw new Error(`Dual-write assignment fallito: ${error.message}`);
  }
  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Dual-write assignment: RPC non ha restituito un id valido.');
  }

  return data;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  resolvePatronGalleryOriginType,
  upsertPatronGalleryImageAssignmentRpc,
} from './patronGalleryImageAssignmentRpc';

export type RepairPatronGalleryAssignmentsResult = {
  scanned: number;
  /** Assignment materializzati in modalità execute. */
  repaired: number;
  /** Assignment che verrebbero materializzati in dry-run. */
  wouldRepair: number;
  skipped: number;
  errors: number;
};

type GalleryRow = {
  id: string;
  city_id: string;
  image_url: string;
  storage_path: string | null;
  source_suggestion_item_id: string | null;
};

/** Bucket canonico upload city_patron_gallery (uploadPublicMediaDetailed). */
export const PATRON_GALLERY_PUBLIC_MEDIA_BUCKET = 'public-media';

export type GalleryAssignmentLookup =
  | { kind: 'none' }
  | { kind: 'single'; id: string }
  | { kind: 'ambiguous'; count: number };

function trimSourceField(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

/**
 * Coerente con upsert_patron_gallery_image_assignment:
 * - gallery con storagePath → path + bucket public-media;
 * - gallery senza storagePath → source_image_url (assignment può avere anche path).
 */
export function assignmentMatchesGalleryRow(
  row: {
    source_image_url: string | null;
    source_storage_bucket: string | null;
    source_storage_path: string | null;
  },
  imageUrl: string,
  storagePath: string,
): boolean {
  const rowPath = trimSourceField(row.source_storage_path);
  const rowBucket = trimSourceField(row.source_storage_bucket);
  const rowUrl = trimSourceField(row.source_image_url);

  if (storagePath.length > 0) {
    return rowPath === storagePath && rowBucket === PATRON_GALLERY_PUBLIC_MEDIA_BUCKET;
  }
  if (imageUrl.length > 0) {
    return rowUrl === imageUrl;
  }
  return false;
}

export async function findActivePatronGalleryAssignment(
  sb: SupabaseClient,
  cityId: string,
  imageUrl: string,
  storagePath: string,
): Promise<GalleryAssignmentLookup> {
  let query = sb
    .from('entity_image_assignments')
    .select('id, source_image_url, source_storage_bucket, source_storage_path')
    .eq('entity_type', 'patron')
    .eq('entity_id', cityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active');

  if (storagePath.length > 0) {
    query = query
      .eq('source_storage_path', storagePath)
      .eq('source_storage_bucket', PATRON_GALLERY_PUBLIC_MEDIA_BUCKET);
  } else if (imageUrl.length > 0) {
    query = query.eq('source_image_url', imageUrl);
  }

  const { data, error } = await query;

  if (error) throw error;

  const matches = (data ?? []).filter((row) =>
    assignmentMatchesGalleryRow(row, imageUrl, storagePath),
  );

  if (matches.length === 0) return { kind: 'none' };
  const first = matches[0];
  if (typeof first.id !== 'string') {
    throw new Error('Risposta entity_image_assignments inattesa per gallery Patrono.');
  }
  if (matches.length === 1) return { kind: 'single', id: first.id };
  return { kind: 'ambiguous', count: matches.length };
}

function postgresErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** Percorso canonico riparazione assignment gallery Patrono (CLI + servizio). */
export async function runPatronGalleryAssignmentRepair(
  sb: SupabaseClient,
  execute: boolean,
): Promise<RepairPatronGalleryAssignmentsResult> {
  const result: RepairPatronGalleryAssignmentsResult = {
    scanned: 0,
    repaired: 0,
    wouldRepair: 0,
    skipped: 0,
    errors: 0,
  };

  const { data, error } = await sb
    .from('city_patron_gallery')
    .select('id, city_id, image_url, storage_path, source_suggestion_item_id')
    .order('created_at', { ascending: true });

  if (error) throw error;

  for (const raw of data ?? []) {
    result.scanned += 1;
    const row = raw as GalleryRow;
    const cityId = row.city_id;
    const imageUrl = row.image_url?.trim() ?? '';
    const storagePath = row.storage_path?.trim() ?? '';
    if (!imageUrl && !storagePath) {
      result.skipped += 1;
      continue;
    }

    try {
      const existing = await findActivePatronGalleryAssignment(sb, cityId, imageUrl, storagePath);
      if (existing.kind === 'ambiguous') {
        console.error(
          `[repair-patron-gallery] incoerenza photo=${row.id}: ${existing.count} assignment attivi corrispondenti.`,
        );
        result.errors += 1;
        continue;
      }
      if (existing.kind === 'single') {
        result.skipped += 1;
        continue;
      }

      const originType = resolvePatronGalleryOriginType(row.source_suggestion_item_id);

      if (!execute) {
        console.log(
          `[dry-run] would materialize gallery assignment city=${cityId} photo=${row.id} origin=${originType}`,
        );
        result.wouldRepair += 1;
        continue;
      }

      await upsertPatronGalleryImageAssignmentRpc(
        cityId,
        { imageUrl, storagePath },
        originType,
        sb,
      );
      result.repaired += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code = postgresErrorCode(err);
      if (code === '23505') {
        const after = await findActivePatronGalleryAssignment(sb, cityId, imageUrl, storagePath);
        if (after.kind === 'single') {
          result.skipped += 1;
          continue;
        }
        console.error(
          `[repair-patron-gallery] unique violation (23505) senza assignment corrispondente photo=${row.id}:`,
          message,
        );
        result.errors += 1;
        continue;
      }
      console.error('[repair-patron-gallery] materialize failed', row.id, message);
      result.errors += 1;
    }
  }

  return result;
}

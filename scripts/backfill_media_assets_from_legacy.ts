/**
 * MF5 §42.15 — backfill legacy → media_assets + entity_image_assignments
 *
 * Default: DRY-RUN (nessuna scrittura).
 * Esempio:
 *   npx tsx scripts/backfill_media_assets_from_legacy.ts
 *   npx tsx scripts/backfill_media_assets_from_legacy.ts --execute --entity-type=city_person
 *   npx tsx scripts/backfill_media_assets_from_legacy.ts --verify
 */

import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

type EntityKind = 'city_person' | 'poi' | 'patron';

type LegacySource = {
  entityType: EntityKind;
  entityId: string;
  cityId: string;
  label: string;
  imageUrl: string | null;
  storagePath: string | null;
};

type BackfillCounters = {
  scanned: number;
  created: number;
  skipped: number;
  conflicts: number;
  errors: number;
  partialFailures: number;
};

type MaterializeOutcome = 'created' | 'skipped' | 'conflict' | 'error' | 'partial_failure';

const BATCH_SIZE_DEFAULT = 100;
const PAUSE_MS_DEFAULT = 250;
const ENTITY_KINDS: EntityKind[] = ['city_person', 'poi', 'patron'];

function parsePositiveInt(raw: string | undefined, fallback: number, label: string): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    console.error(`[backfill] ${label} non valido: ${raw}`);
    process.exit(1);
  }
  return n;
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const getValue = (prefix: string): string | undefined => {
    const direct = argv.find((a) => a.startsWith(`${prefix}=`));
    return direct?.slice(prefix.length + 1);
  };

  const entityRaw = getValue('--entity-type') ?? 'all';
  const entityTypeTokens =
    entityRaw === 'all' ? [...ENTITY_KINDS] : entityRaw.split(',').map((s) => s.trim());

  for (const kind of entityTypeTokens) {
    if (!ENTITY_KINDS.includes(kind as EntityKind)) {
      console.error(
        `[backfill] entity-type non valido: ${kind}. Valori ammessi: ${ENTITY_KINDS.join(', ')}, all`,
      );
      process.exit(1);
    }
  }

  const batchSize = parsePositiveInt(getValue('--batch-size'), BATCH_SIZE_DEFAULT, 'batch-size');
  if (batchSize === 0) {
    console.error('[backfill] batch-size deve essere > 0');
    process.exit(1);
  }

  return {
    execute: flags.has('--execute'),
    verifyOnly: flags.has('--verify'),
    batchSize,
    pauseMs: parsePositiveInt(getValue('--pause-ms'), PAUSE_MS_DEFAULT, 'pause-ms'),
    offset: parsePositiveInt(getValue('--offset'), 0, 'offset'),
    cityIdFilter: getValue('--city-id')?.trim() || null,
    entityTypes: entityTypeTokens as EntityKind[],
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePublicMediaPathFromUrl(url: string): { bucket: string; path: string } | null {
  const trimmed = url.trim();
  const publicMediaMarker = '/object/public/public-media/';
  const communityMarker = '/object/public/community-photos/';
  let bucket = 'public-media';
  let marker = publicMediaMarker;
  if (trimmed.includes(communityMarker)) {
    bucket = 'community-photos';
    marker = communityMarker;
  } else if (!trimmed.includes(publicMediaMarker)) {
    return null;
  }
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = trimmed.slice(idx + marker.length).split('?')[0];
  if (!rawPath) return null;
  try {
    return { bucket, path: decodeURIComponent(rawPath) };
  } catch {
    return null;
  }
}

function assertLegacyStorageCompatible(imageUrl: string | null, storagePath: string | null): void {
  const url = imageUrl?.trim() || null;
  const pathTrim = storagePath?.trim() || null;
  if (!url || !pathTrim) return;

  const parsed = parsePublicMediaPathFromUrl(url);
  if (!parsed) return;

  if (parsed.bucket === 'public-media' && parsed.path !== pathTrim) {
    throw new Error(
      `Legacy storage conflict: image_url public-media path "${parsed.path}" ≠ image_storage_path "${pathTrim}"`,
    );
  }

  if (parsed.bucket === 'community-photos') {
    throw new Error(
      `Legacy storage conflict: image_url community-photos path "${parsed.path}" incompatibile con image_storage_path legacy "${pathTrim}" (atteso public-media)`,
    );
  }
}

function resolveLegacyStorage(
  imageUrl: string | null,
  storagePath: string | null,
): { url: string | null; bucket: string | null; path: string | null } {
  assertLegacyStorageCompatible(imageUrl, storagePath);

  const url = imageUrl?.trim() || null;
  const pathTrim = storagePath?.trim() || null;
  if (pathTrim) {
    return { url, bucket: 'public-media', path: pathTrim };
  }
  if (url) {
    const parsed = parsePublicMediaPathFromUrl(url);
    if (parsed) {
      return { url, bucket: parsed.bucket, path: parsed.path };
    }
    return { url, bucket: null, path: null };
  }
  return { url: null, bucket: null, path: null };
}

async function hasPrimaryCurrentAssignment(
  sb: SupabaseClient,
  source: LegacySource,
): Promise<boolean> {
  const { data, error } = await sb
    .from('entity_image_assignments')
    .select('id')
    .eq('entity_type', source.entityType)
    .eq('entity_id', source.entityId)
    .eq('city_id', source.cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

function assignmentHasMediaAssetId(assignment: {
  id?: string | null;
  media_asset_id?: string | null;
}): boolean {
  return (
    typeof assignment.id === 'string' &&
    assignment.id.length > 0 &&
    typeof assignment.media_asset_id === 'string' &&
    assignment.media_asset_id.trim().length > 0
  );
}

async function materializeAssignment(
  sb: SupabaseClient,
  source: LegacySource,
  dryRun: boolean,
): Promise<MaterializeOutcome> {
  const resolved = resolveLegacyStorage(source.imageUrl, source.storagePath);
  if (!resolved.url && !resolved.path) return 'skipped';

  try {
    const already = await hasPrimaryCurrentAssignment(sb, source);
    if (already) return 'skipped';

    if (dryRun) {
      console.log(
        `[dry-run] would backfill ${source.entityType} ${source.label} (${source.entityId}) city=${source.cityId}`,
      );
      return 'created';
    }

    const { data: assetId, error: assetError } = await sb.rpc('ensure_media_asset_from_source', {
      p_image_url: resolved.url,
      p_storage_bucket: resolved.bucket,
      p_storage_path: resolved.path,
      p_origin_type: 'admin',
    });

    if (assetError) {
      console.error(
        `[error] ensure_media_asset_from_source ${source.entityId}:`,
        assetError.message,
      );
      return 'error';
    }
    if (typeof assetId !== 'string' || !assetId) {
      console.error(`[error] asset id invalid for ${source.entityId}`);
      return 'error';
    }

    const { error: insertError } = await sb.from('entity_image_assignments').insert({
      media_asset_id: assetId,
      entity_type: source.entityType,
      entity_id: source.entityId,
      city_id: source.cityId,
      assignment_role: 'primary',
      assignment_status: 'active',
      is_current: true,
      source_image_url: resolved.url,
      source_storage_bucket: resolved.bucket,
      source_storage_path: resolved.path,
    });

    if (insertError) {
      if (insertError.code === '23505') return 'conflict';
      console.error(
        `[partial_failure] media_asset ${assetId} creato ma insert assignment fallito — ${source.entityType} ${source.entityId} city=${source.cityId}: ${insertError.message}`,
      );
      return 'partial_failure';
    }

    return 'created';
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('Legacy storage conflict')) {
      console.error(`[conflict] ${source.entityType} ${source.entityId}:`, message);
      return 'conflict';
    }
    console.error(`[error] ${source.entityType} ${source.entityId}:`, e);
    return 'error';
  }
}

function cityPersonHasLegacyImage(row: {
  image_url: string | null;
  image_storage_path: string | null;
}): boolean {
  const url = (row.image_url as string | null)?.trim() ?? '';
  const storagePath = (row.image_storage_path as string | null)?.trim() ?? '';
  return url.length > 0 || storagePath.length > 0;
}

async function fetchCityPersonBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacySource[]> {
  let query = sb
    .from('city_people')
    .select('id, city_id, name, image_url, image_storage_path')
    .or('image_url.not.is.null,image_storage_path.not.is.null')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (cityIdFilter) query = query.eq('city_id', cityIdFilter);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .filter((row) => cityPersonHasLegacyImage(row))
    .map((row) => ({
      entityType: 'city_person' as const,
      entityId: row.id as string,
      cityId: row.city_id as string,
      label: (row.name as string) ?? row.id,
      imageUrl: (row.image_url as string) ?? null,
      storagePath: (row.image_storage_path as string) ?? null,
    }));
}

async function fetchPoiBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacySource[]> {
  let query = sb
    .from('pois')
    .select('id, city_id, name, image_url')
    .not('image_url', 'is', null)
    .neq('image_url', '')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (cityIdFilter) query = query.eq('city_id', cityIdFilter);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    entityType: 'poi' as const,
    entityId: row.id as string,
    cityId: row.city_id as string,
    label: (row.name as string) ?? row.id,
    imageUrl: (row.image_url as string) ?? null,
    storagePath: null,
  }));
}

async function fetchPatronBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacySource[]> {
  let query = sb
    .from('cities')
    .select('id, name, patron_details')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (cityIdFilter) query = query.eq('id', cityIdFilter);

  const { data, error } = await query;
  if (error) throw error;

  const out: LegacySource[] = [];
  for (const row of data ?? []) {
    const details = row.patron_details as Record<string, unknown> | null;
    const imageUrl =
      typeof details?.imageUrl === 'string'
        ? details.imageUrl
        : typeof details?.image_url === 'string'
          ? details.image_url
          : null;
    if (!imageUrl?.trim()) continue;
    out.push({
      entityType: 'patron',
      entityId: row.id as string,
      cityId: row.id as string,
      label: (row.name as string) ?? row.id,
      imageUrl,
      storagePath: null,
    });
  }
  return out;
}

function entityKey(entityType: EntityKind, cityId: string, entityId: string): string {
  return `${entityType}:${cityId}:${entityId}`;
}

const VERIFY_PAGE_SIZE = 1000;

async function assertPrimaryCurrentAssignment(
  sb: SupabaseClient,
  entityType: EntityKind,
  entityId: string,
  cityId: string,
): Promise<void> {
  const { data, error } = await sb
    .from('entity_image_assignments')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true);

  if (error) {
    throw new Error(
      `[verify] query primary assignment fallita (${entityType} ${entityId}): ${error.message}`,
    );
  }

  const rows = data ?? [];
  if (rows.length > 1) {
    throw new Error(
      `[verify] primary assignment corrente duplicato (${entityType} city=${cityId} entity=${entityId})`,
    );
  }
}

async function runVerify(sb: SupabaseClient, cityIdFilter: string | null): Promise<boolean> {
  const missingPrimary: string[] = [];

  let peopleOffset = 0;
  for (;;) {
    let peopleQuery = sb
      .from('city_people')
      .select('id, city_id, name, image_url, image_storage_path')
      .or('image_url.not.is.null,image_storage_path.not.is.null')
      .order('id', { ascending: true })
      .range(peopleOffset, peopleOffset + VERIFY_PAGE_SIZE - 1);
    if (cityIdFilter) peopleQuery = peopleQuery.eq('city_id', cityIdFilter);
    const { data: people, error: peopleError } = await peopleQuery;
    if (peopleError) throw peopleError;
    const rawBatch = people ?? [];
    if (rawBatch.length === 0) break;
    const batch = rawBatch.filter((row) => cityPersonHasLegacyImage(row));

    for (const row of batch) {
      const entityId = row.id as string;
      const cityId = row.city_id as string;
      await assertPrimaryCurrentAssignment(sb, 'city_person', entityId, cityId);
      const { data: assignment, error: assignmentError } = await sb
        .from('entity_image_assignments')
        .select('id, media_asset_id')
        .eq('entity_type', 'city_person')
        .eq('entity_id', entityId)
        .eq('city_id', cityId)
        .eq('assignment_role', 'primary')
        .eq('is_current', true)
        .maybeSingle();
      if (assignmentError) {
        throw new Error(`[verify] city_person ${entityId}: ${assignmentError.message}`);
      }
      if (!assignmentHasMediaAssetId(assignment ?? {})) {
        missingPrimary.push(entityKey('city_person', cityId, entityId));
      }
    }

    if (rawBatch.length < VERIFY_PAGE_SIZE) break;
    peopleOffset += rawBatch.length;
  }

  let poiOffset = 0;
  for (;;) {
    let poiQuery = sb
      .from('pois')
      .select('id, city_id, name, image_url')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .order('id', { ascending: true })
      .range(poiOffset, poiOffset + VERIFY_PAGE_SIZE - 1);
    if (cityIdFilter) poiQuery = poiQuery.eq('city_id', cityIdFilter);
    const { data: pois, error: poisError } = await poiQuery;
    if (poisError) throw poisError;
    const poiBatch = pois ?? [];
    if (poiBatch.length === 0) break;

    for (const row of poiBatch) {
      const entityId = row.id as string;
      const cityId = row.city_id as string;
      await assertPrimaryCurrentAssignment(sb, 'poi', entityId, cityId);
      const { data: assignment, error: assignmentError } = await sb
        .from('entity_image_assignments')
        .select('id, media_asset_id')
        .eq('entity_type', 'poi')
        .eq('entity_id', entityId)
        .eq('city_id', cityId)
        .eq('assignment_role', 'primary')
        .eq('is_current', true)
        .maybeSingle();
      if (assignmentError) {
        throw new Error(`[verify] poi ${entityId}: ${assignmentError.message}`);
      }
      if (!assignmentHasMediaAssetId(assignment ?? {})) {
        missingPrimary.push(entityKey('poi', cityId, entityId));
      }
    }

    if (poiBatch.length < VERIFY_PAGE_SIZE) break;
    poiOffset += VERIFY_PAGE_SIZE;
  }

  let citiesOffset = 0;
  let patronLegacyWithImage = 0;
  for (;;) {
    let citiesQuery = sb
      .from('cities')
      .select('id, name, patron_details')
      .order('id', { ascending: true })
      .range(citiesOffset, citiesOffset + VERIFY_PAGE_SIZE - 1);
    if (cityIdFilter) citiesQuery = citiesQuery.eq('id', cityIdFilter);
    const { data: cities, error: citiesError } = await citiesQuery;
    if (citiesError) throw citiesError;
    const cityBatch = cities ?? [];
    if (cityBatch.length === 0) break;

    for (const row of cityBatch) {
      const details = row.patron_details as Record<string, unknown> | null;
      const imageUrl =
        typeof details?.imageUrl === 'string'
          ? details.imageUrl
          : typeof details?.image_url === 'string'
            ? details.image_url
            : null;
      if (!imageUrl?.trim()) continue;
      patronLegacyWithImage += 1;
      const cityId = row.id as string;
      await assertPrimaryCurrentAssignment(sb, 'patron', cityId, cityId);
      const { data: assignment, error: assignmentError } = await sb
        .from('entity_image_assignments')
        .select('id, media_asset_id')
        .eq('entity_type', 'patron')
        .eq('entity_id', cityId)
        .eq('city_id', cityId)
        .eq('assignment_role', 'primary')
        .eq('is_current', true)
        .maybeSingle();
      if (assignmentError) {
        throw new Error(`[verify] patron ${cityId}: ${assignmentError.message}`);
      }
      if (!assignmentHasMediaAssetId(assignment ?? {})) {
        missingPrimary.push(entityKey('patron', cityId, cityId));
      }
    }

    if (cityBatch.length < VERIFY_PAGE_SIZE) break;
    citiesOffset += VERIFY_PAGE_SIZE;
  }

  console.log(
    '[verify] legacy con immagine ma senza primary assignment corrente:',
    missingPrimary.length,
  );
  if (missingPrimary.length > 0) {
    for (const key of missingPrimary.slice(0, 50)) {
      console.log(`  - ${key}`);
    }
    if (missingPrimary.length > 50) {
      console.log(`  ... +${missingPrimary.length - 50} altri`);
    }
  }
  console.log(`[verify] patron legacy con imageUrl in patron_details: ${patronLegacyWithImage}`);

  if (missingPrimary.length > 0) {
    console.error(
      `[verify] FAILED — ${missingPrimary.length} entità legacy con immagine senza primary assignment corrente valida (media_asset_id richiesto).`,
    );
    return false;
  }

  return true;
}

async function backfillEntityType(
  sb: SupabaseClient,
  entityType: EntityKind,
  options: ReturnType<typeof parseArgs>,
): Promise<BackfillCounters> {
  const counters: BackfillCounters = {
    scanned: 0,
    created: 0,
    skipped: 0,
    conflicts: 0,
    errors: 0,
    partialFailures: 0,
  };

  let offset = options.offset;
  const fetchBatch =
    entityType === 'city_person'
      ? fetchCityPersonBatch
      : entityType === 'poi'
        ? fetchPoiBatch
        : fetchPatronBatch;

  for (;;) {
    const batch = await fetchBatch(sb, offset, options.batchSize, options.cityIdFilter);
    if (batch.length === 0) break;

    for (const source of batch) {
      counters.scanned += 1;
      const outcome = await materializeAssignment(sb, source, !options.execute);
      if (outcome === 'created') counters.created += 1;
      else if (outcome === 'skipped') counters.skipped += 1;
      else if (outcome === 'conflict') counters.conflicts += 1;
      else if (outcome === 'partial_failure') counters.partialFailures += 1;
      else if (outcome === 'error') counters.errors += 1;
    }

    offset += batch.length;
    if (batch.length < options.batchSize) break;
    if (options.pauseMs > 0) await sleep(options.pauseMs);
  }

  return counters;
}

async function main(): Promise<void> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  const sb = createClient(url, key);

  console.log(
    `[backfill] mode=${options.execute ? 'EXECUTE' : 'DRY-RUN'} entityTypes=${options.entityTypes.join(',')} batch=${options.batchSize}`,
  );

  if (options.verifyOnly) {
    const verifyOk = await runVerify(sb, options.cityIdFilter);
    if (!verifyOk) process.exit(1);
    return;
  }

  const totals: BackfillCounters = {
    scanned: 0,
    created: 0,
    skipped: 0,
    conflicts: 0,
    errors: 0,
    partialFailures: 0,
  };

  for (const entityType of options.entityTypes) {
    const result = await backfillEntityType(sb, entityType, options);
    console.log(`[backfill:${entityType}]`, result);
    for (const key of Object.keys(totals) as (keyof BackfillCounters)[]) {
      totals[key] += result[key];
    }
  }

  console.log('[backfill:totals]', totals);
  const verifyOk = await runVerify(sb, options.cityIdFilter);

  if (totals.errors > 0 || totals.partialFailures > 0 || !verifyOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

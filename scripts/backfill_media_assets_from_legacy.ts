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
import {
  PLATFORM_PLACEHOLDER_SETTING_KEYS,
  type PlatformPlaceholderSettingsSnapshot,
} from '../src/domain/placeholders/platformPlaceholderOrigin.ts';
import {
  createPlatformPlaceholderRegistry,
  isPlatformPlaceholderUrl,
  type PlatformPlaceholderRegistry,
} from '../src/domain/placeholders/platformPlaceholderRegistry.ts';

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
  wouldCreate: number;
  skipped: number;
  needsReview: number;
  conflicts: number;
  errors: number;
};

type MaterializeOutcome =
  | 'created'
  | 'would_create'
  | 'skipped'
  | 'needs_review'
  | 'conflict'
  | 'error';

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

function parseSettingValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

async function loadPlatformPlaceholderRegistry(
  sb: SupabaseClient,
): Promise<PlatformPlaceholderRegistry> {
  const { data, error } = await sb
    .from('global_settings')
    .select('key, value')
    .in('key', [...PLATFORM_PLACEHOLDER_SETTING_KEYS]);
  if (error) throw error;

  const snapshot: PlatformPlaceholderSettingsSnapshot = {};
  for (const row of data ?? []) {
    const key = row.key as keyof PlatformPlaceholderSettingsSnapshot;
    snapshot[key] = parseSettingValue(row.value) as PlatformPlaceholderSettingsSnapshot[typeof key];
  }
  return createPlatformPlaceholderRegistry(snapshot);
}

function isAdminAssetsLegacyUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? '';
  return trimmed.includes('/admin_assets/') || trimmed.includes('/admin_assets%2F');
}

function isLegacyPlaceholderSource(
  source: LegacySource,
  registry: PlatformPlaceholderRegistry,
): boolean {
  const resolved = resolveLegacyStorage(source.imageUrl, source.storagePath, source.entityType);
  const url = (resolved.url ?? source.imageUrl)?.trim() ?? '';
  const path = (resolved.path ?? source.storagePath)?.trim() ?? '';
  if (url.length === 0 && path.length === 0) return false;
  if (url.length > 0 && isPlatformPlaceholderUrl(url, registry)) return true;
  if (path.length > 0 && isPlatformPlaceholderUrl(path, registry)) return true;
  if (source.entityType === 'poi') {
    if (isAdminAssetsLegacyUrl(url) || isAdminAssetsLegacyUrl(path)) return true;
  }
  return false;
}

type LegacyOriginType = 'admin' | 'community' | 'wikimedia' | 'ai';

function inferLegacyOriginType(
  source: LegacySource,
  resolved: { url: string | null; bucket: string | null; path: string | null },
): LegacyOriginType | null {
  const url = (resolved.url ?? source.imageUrl ?? '').toLowerCase();
  const storagePath = (resolved.path ?? source.storagePath ?? '').toLowerCase();

  if (storagePath.includes('wikimedia/') || url.includes('wikimedia')) return 'wikimedia';
  if (storagePath.includes('verified/wikimedia')) return 'wikimedia';
  if (storagePath.includes('people_portraits/') || url.includes('people_portraits')) {
    return 'ai';
  }
  if (
    storagePath.startsWith('famous_person_photo_suggestions/') ||
    storagePath.startsWith('patron_photo_suggestions/')
  ) {
    return 'community';
  }
  if (storagePath.startsWith('community-photos/')) return 'community';

  if (source.entityType === 'patron' || source.entityType === 'city_person') {
    if (isAdminAssetsLegacyUrl(resolved.url ?? source.imageUrl)) return null;
    return 'admin';
  }

  if (source.entityType === 'poi') {
    return null;
  }

  return null;
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

/**
 * Path-only legacy → public-media solo per city_person/poi/patron (uploadPublicMedia / storage colonne storiche).
 * Altri domini o URL community-photos + path incompatibile → needs_review via classify/assert.
 */
function resolveLegacyStorage(
  imageUrl: string | null,
  storagePath: string | null,
  entityType?: EntityKind,
): { url: string | null; bucket: string | null; path: string | null } {
  assertLegacyStorageCompatible(imageUrl, storagePath);

  const url = imageUrl?.trim() || null;
  const pathTrim = storagePath?.trim() || null;
  if (pathTrim) {
    if (
      entityType != null &&
      entityType !== 'city_person' &&
      entityType !== 'poi' &&
      entityType !== 'patron'
    ) {
      throw new Error(
        `Legacy path-only senza contratto public-media per entity_type=${entityType}`,
      );
    }
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

type PrimaryAssignmentBackfillState =
  | 'none'
  | 'skip_match'
  | 'conflict'
  | 'duplicate_primary'
  | 'suspended_primary';

async function evaluatePrimaryForBackfill(
  sb: SupabaseClient,
  source: LegacySource,
  resolved: { url: string | null; bucket: string | null; path: string | null },
): Promise<PrimaryAssignmentBackfillState> {
  const { data, error } = await sb
    .from('entity_image_assignments')
    .select(
      'id, media_asset_id, source_image_url, source_storage_bucket, source_storage_path, assignment_status',
    )
    .eq('entity_type', source.entityType)
    .eq('entity_id', source.entityId)
    .eq('city_id', source.cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true);

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length > 1) return 'duplicate_primary';
  if (rows.length === 0) return 'none';

  const assignment = rows[0];
  const status = (assignment.assignment_status as string | null)?.trim() ?? '';
  if (status === 'suspended') {
    return 'suspended_primary';
  }
  if (status !== 'active') {
    return 'conflict';
  }

  if (!assignmentMatchesResolvedLegacySource(assignment, resolved)) {
    return 'conflict';
  }
  if (assignmentHasMediaAssetId(assignment)) {
    return 'skip_match';
  }
  return 'none';
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
  placeholderRegistry: PlatformPlaceholderRegistry,
): Promise<MaterializeOutcome> {
  let resolved: { url: string | null; bucket: string | null; path: string | null };
  try {
    resolved = resolveLegacyStorage(source.imageUrl, source.storagePath, source.entityType);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('Legacy storage conflict')) {
      console.error(`[conflict] ${source.entityType} ${source.entityId}:`, message);
      return 'conflict';
    }
    throw e;
  }

  const eligibility = classifyLegacyBackfillResolved(source, placeholderRegistry, resolved);
  if (eligibility === 'no_image') return 'skipped';
  if (eligibility === 'placeholder') {
    console.log(
      `[skip:placeholder] ${source.entityType} ${source.entityId} city=${source.cityId} — non migrare Asset Globali/placeholder`,
    );
    return 'skipped';
  }
  if (eligibility === 'needs_review') {
    console.warn(
      `[needs_review] ${source.entityType} ${source.entityId} city=${source.cityId} — sorgente non eleggibile per backfill automatico`,
    );
    return 'needs_review';
  }

  const originType = inferLegacyOriginType(source, resolved);
  if (!originType) {
    console.warn(
      `[needs_review:origin-unknown] ${source.entityType} ${source.entityId} city=${source.cityId} — provenance non determinabile; non inventata`,
    );
    return 'needs_review';
  }

  try {
    const primaryState = await evaluatePrimaryForBackfill(sb, source, resolved);
    if (primaryState === 'duplicate_primary') {
      console.error(
        `[conflict] ${source.entityType} ${source.entityId}: più di un primary corrente.`,
      );
      return 'conflict';
    }
    if (primaryState === 'suspended_primary') {
      console.error(
        `[conflict] ${source.entityType} ${source.entityId}: primary corrente sospeso; backfill non materializza una nuova primary.`,
      );
      return 'conflict';
    }
    if (primaryState === 'skip_match') return 'skipped';
    if (primaryState === 'conflict') {
      console.error(
        `[conflict] ${source.entityType} ${source.entityId}: primary esistente incompatibile con sorgente legacy.`,
      );
      return 'conflict';
    }

    if (dryRun) {
      console.log(
        `[dry-run] would backfill ${source.entityType} ${source.label} (${source.entityId}) city=${source.cityId} origin=${originType}`,
      );
      return 'would_create';
    }

    const rpcArgs = {
      p_image_url: resolved.url,
      p_storage_bucket: resolved.bucket,
      p_storage_path: resolved.path,
      p_origin_type: originType,
    };

    if (source.entityType === 'city_person') {
      const { error: rpcError } = await sb.rpc('upsert_entity_primary_image_assignment', {
        p_entity_id: source.entityId,
        p_city_id: source.cityId,
        ...rpcArgs,
      });
      if (rpcError) {
        console.error(
          `[error] upsert_entity_primary_image_assignment ${source.entityId}:`,
          rpcError.message,
        );
        return classifyRpcMaterializeError(rpcError);
      }
      return 'created';
    }

    if (source.entityType === 'poi') {
      const { error: rpcError } = await sb.rpc('upsert_poi_primary_image_assignment', {
        p_entity_id: source.entityId,
        p_city_id: source.cityId,
        ...rpcArgs,
      });
      if (rpcError) {
        console.error(
          `[error] upsert_poi_primary_image_assignment ${source.entityId}:`,
          rpcError.message,
        );
        return classifyRpcMaterializeError(rpcError);
      }
      return 'created';
    }

    const { error: rpcError } = await sb.rpc('upsert_patron_primary_image_assignment', {
      p_city_id: source.cityId,
      ...rpcArgs,
    });
    if (rpcError) {
      console.error(
        `[error] upsert_patron_primary_image_assignment ${source.cityId}:`,
        rpcError.message,
      );
      return classifyRpcMaterializeError(rpcError);
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

type LegacyFetchPage = {
  sources: LegacySource[];
  consumed: number;
};

async function fetchCityPersonBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacyFetchPage> {
  let query = sb
    .from('city_people')
    .select('id, city_id, name, image_url, image_storage_path')
    .or('image_url.not.is.null,image_storage_path.not.is.null')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (cityIdFilter) query = query.eq('city_id', cityIdFilter);

  const { data, error } = await query;
  if (error) throw error;

  const rawRows = data ?? [];
  const sources = rawRows
    .filter((row) => cityPersonHasLegacyImage(row))
    .map((row) => ({
      entityType: 'city_person' as const,
      entityId: row.id as string,
      cityId: row.city_id as string,
      label: (row.name as string) ?? row.id,
      imageUrl: (row.image_url as string) ?? null,
      storagePath: (row.image_storage_path as string) ?? null,
    }));
  return { sources, consumed: rawRows.length };
}

async function fetchPoiBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacyFetchPage> {
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

  const rawRows = data ?? [];
  const sources = rawRows.map((row) => ({
    entityType: 'poi' as const,
    entityId: row.id as string,
    cityId: row.city_id as string,
    label: (row.name as string) ?? row.id,
    imageUrl: (row.image_url as string) ?? null,
    storagePath: null,
  }));
  return { sources, consumed: rawRows.length };
}

async function fetchPatronBatch(
  sb: SupabaseClient,
  offset: number,
  limit: number,
  cityIdFilter: string | null,
): Promise<LegacyFetchPage> {
  let query = sb
    .from('cities')
    .select('id, name, patron_details')
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (cityIdFilter) query = query.eq('id', cityIdFilter);

  const { data, error } = await query;
  if (error) throw error;

  const rawRows = data ?? [];
  const out: LegacySource[] = [];
  for (const row of rawRows) {
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
  return { sources: out, consumed: rawRows.length };
}

function entityKey(entityType: EntityKind, cityId: string, entityId: string): string {
  return `${entityType}:${cityId}:${entityId}`;
}

/** Stesse regole di eleggibilità del backfill (placeholder / origin unknown). */
type LegacyBackfillEligibility = 'eligible' | 'placeholder' | 'needs_review' | 'no_image';

function classifyLegacyBackfillResolved(
  source: LegacySource,
  registry: PlatformPlaceholderRegistry,
  resolved: { url: string | null; bucket: string | null; path: string | null },
): LegacyBackfillEligibility {
  if (!resolved.url && !resolved.path) return 'no_image';
  if (isLegacyPlaceholderSource(source, registry)) return 'placeholder';
  // URL-only legacy: niente path → backfill automatico non eleggibile (no bucket Storage inventato).
  if ((resolved.path?.trim() ?? '').length === 0) {
    if ((resolved.url?.trim() ?? '').length > 0 && resolved.bucket === 'community-photos') {
      return 'needs_review';
    }
    return 'needs_review';
  }
  // path-only: public-media solo se resolveLegacyStorage ha accettato il dominio (city_person/poi/patron).
  if (inferLegacyOriginType(source, resolved) === null) return 'needs_review';
  return 'eligible';
}

function classifyLegacyBackfillSource(
  source: LegacySource,
  registry: PlatformPlaceholderRegistry,
): LegacyBackfillEligibility {
  let resolved: { url: string | null; bucket: string | null; path: string | null };
  try {
    resolved = resolveLegacyStorage(source.imageUrl, source.storagePath, source.entityType);
  } catch {
    return 'needs_review';
  }
  return classifyLegacyBackfillResolved(source, registry, resolved);
}

function assignmentMatchesResolvedLegacySource(
  assignment: {
    source_image_url: string | null;
    source_storage_bucket: string | null;
    source_storage_path: string | null;
  },
  resolved: { url: string | null; bucket: string | null; path: string | null },
): boolean {
  const path = resolved.path?.trim() ?? '';
  const url = resolved.url?.trim() ?? '';
  const bucket = resolved.bucket?.trim() ?? '';
  const aPath = assignment.source_storage_path?.trim() ?? '';
  const aUrl = assignment.source_image_url?.trim() ?? '';
  const aBucket = assignment.source_storage_bucket?.trim() ?? '';

  if (path.length > 0 && aPath === path) {
    if (bucket.length > 0) {
      return aBucket === bucket;
    }
    return true;
  }
  if (path.length === 0 && url.length > 0) {
    if (aUrl !== url) return false;
    if (bucket.length > 0) return aBucket === bucket;
    return true;
  }
  return false;
}

function postgresErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function classifyRpcMaterializeError(rpcError: {
  message: string;
  code?: string;
}): MaterializeOutcome {
  const code = postgresErrorCode(rpcError) ?? rpcError.code;
  if (code === '23505') {
    return 'conflict';
  }
  return 'error';
}

const VERIFY_PAGE_SIZE = 1000;

type PrimaryVerifyDiagnosis =
  | 'ok'
  | 'missing_primary'
  | 'suspended_primary'
  | 'duplicate_primary'
  | 'missing_media_asset_id'
  | 'media_asset_missing'
  | 'assignment_media_incoherent'
  | 'legacy_source_incoherent'
  | 'not_publicly_usable';

async function diagnosePrimaryVerifyFailure(
  sb: SupabaseClient,
  entityType: EntityKind,
  entityId: string,
  cityId: string,
  legacySource: LegacySource | null,
): Promise<PrimaryVerifyDiagnosis> {
  const { data, error } = await sb
    .from('entity_image_assignments')
    .select('id, media_asset_id, assignment_status, source_image_url, source_storage_bucket, source_storage_path')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true);

  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return 'missing_primary';
  if (rows.length > 1) return 'duplicate_primary';

  const row = rows[0];
  if ((row.assignment_status as string) === 'suspended') return 'suspended_primary';
  if ((row.assignment_status as string) !== 'active') return 'missing_primary';

  if (!assignmentHasMediaAssetId(row)) return 'missing_media_asset_id';

  const assetId = row.media_asset_id as string;
  const { data: assetRow, error: assetError } = await sb
    .from('media_assets')
    .select('id, storage_bucket, storage_path')
    .eq('id', assetId)
    .maybeSingle();
  if (assetError) throw assetError;
  if (!assetRow?.id) return 'media_asset_missing';

  const assignPath = row.source_storage_path?.trim() ?? '';
  const assignBucket = row.source_storage_bucket?.trim() ?? '';
  const assetPath = (assetRow.storage_path as string | null)?.trim() ?? '';
  const assetBucket = (assetRow.storage_bucket as string | null)?.trim() ?? '';
  if (assignPath.length > 0) {
    if (assetPath !== assignPath) return 'assignment_media_incoherent';
    if (assignBucket.length > 0 && assetBucket !== assignBucket) return 'assignment_media_incoherent';
  }

  const { data: usable, error: usableError } = await sb.rpc('is_media_asset_publicly_usable', {
    p_asset_id: assetId,
  });
  if (usableError) throw usableError;
  if (usable !== true) return 'not_publicly_usable';

  if (legacySource) {
    let resolved: { url: string | null; bucket: string | null; path: string | null };
    try {
      resolved = resolveLegacyStorage(legacySource.imageUrl, legacySource.storagePath);
    } catch {
      return 'legacy_source_incoherent';
    }
    if (!assignmentMatchesResolvedLegacySource(row, resolved)) {
      return 'legacy_source_incoherent';
    }
  }

  return 'ok';
}

async function verifyBackfilledPrimaryAssignment(
  sb: SupabaseClient,
  entityType: EntityKind,
  entityId: string,
  cityId: string,
  legacySource: LegacySource | null,
): Promise<boolean> {
  const { data, error } = await sb
    .from('entity_image_assignments')
    .select('id, media_asset_id, source_image_url, source_storage_bucket, source_storage_path')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .eq('assignment_status', 'active');

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
  if (rows.length === 0) return false;

  const assignment = rows[0];
  if (!assignmentHasMediaAssetId(assignment)) return false;

  const assetId = assignment.media_asset_id as string;
  const { data: assetRow, error: assetError } = await sb
    .from('media_assets')
    .select('id, storage_bucket, storage_path')
    .eq('id', assetId)
    .maybeSingle();
  if (assetError) {
    throw new Error(`[verify] media_assets ${assetId}: ${assetError.message}`);
  }
  if (!assetRow?.id) return false;

  const assignPath = assignment.source_storage_path?.trim() ?? '';
  const assignBucket = assignment.source_storage_bucket?.trim() ?? '';
  const assignUrl = assignment.source_image_url?.trim() ?? '';
  const assetPath = (assetRow.storage_path as string | null)?.trim() ?? '';
  const assetBucket = (assetRow.storage_bucket as string | null)?.trim() ?? '';
  if (assignPath.length > 0) {
    if (assetPath !== assignPath) return false;
    if (assignBucket.length > 0 && assetBucket !== assignBucket) return false;
  } else if (legacySource) {
    let resolved: { url: string | null; bucket: string | null; path: string | null };
    try {
      resolved = resolveLegacyStorage(
        legacySource.imageUrl,
        legacySource.storagePath,
        legacySource.entityType,
      );
    } catch {
      return false;
    }
    const legacyPath = resolved.path?.trim() ?? '';
    const legacyUrl = resolved.url?.trim() ?? '';
    if (legacyPath.length > 0) {
      if (assetPath !== legacyPath) return false;
      const legacyBucket = resolved.bucket?.trim() ?? '';
      if (legacyBucket.length > 0 && assetBucket !== legacyBucket) return false;
    } else if (legacyUrl.length > 0) {
      if (assignUrl.length > 0 && assignUrl !== legacyUrl) return false;
      if (assetPath.length === 0) return false;
    }
  }

  const { data: usable, error: usableError } = await sb.rpc('is_media_asset_publicly_usable', {
    p_asset_id: assetId,
  });
  if (usableError) {
    throw new Error(`[verify] is_media_asset_publicly_usable ${assetId}: ${usableError.message}`);
  }
  if (usable !== true) return false;

  if (!legacySource) return true;

  let resolved: { url: string | null; bucket: string | null; path: string | null };
  try {
    resolved = resolveLegacyStorage(
      legacySource.imageUrl,
      legacySource.storagePath,
      legacySource.entityType,
    );
  } catch {
    return false;
  }
  if (!resolved.path && !resolved.url) return true;

  return assignmentMatchesResolvedLegacySource(assignment, resolved);
}

async function runVerify(
  sb: SupabaseClient,
  cityIdFilter: string | null,
  placeholderRegistry: PlatformPlaceholderRegistry,
  entityTypes: EntityKind[],
): Promise<boolean> {
  const missingPrimary: { key: string; reason: PrimaryVerifyDiagnosis }[] = [];
  const verifyStats = {
    verifiedEligible: 0,
    skippedPlaceholder: 0,
    needsReview: 0,
    noLegacyImage: 0,
    byReason: {} as Partial<Record<PrimaryVerifyDiagnosis, number>>,
  };

  const recordVerifyFailure = async (
    entityType: EntityKind,
    entityId: string,
    cityId: string,
    legacySource: LegacySource,
  ) => {
    const reason = await diagnosePrimaryVerifyFailure(
      sb,
      entityType,
      entityId,
      cityId,
      legacySource,
    );
    verifyStats.byReason[reason] = (verifyStats.byReason[reason] ?? 0) + 1;
    missingPrimary.push({ key: entityKey(entityType, cityId, entityId), reason });
  };

  let peopleOffset = 0;
  if (entityTypes.includes('city_person')) {
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
        const legacySource: LegacySource = {
          entityType: 'city_person',
          entityId,
          cityId,
          label: (row.name as string) ?? entityId,
          imageUrl: (row.image_url as string) ?? null,
          storagePath: (row.image_storage_path as string) ?? null,
        };
        const eligibility = classifyLegacyBackfillSource(legacySource, placeholderRegistry);
        if (eligibility === 'no_image') {
          verifyStats.noLegacyImage += 1;
          continue;
        }
        if (eligibility === 'placeholder') {
          verifyStats.skippedPlaceholder += 1;
          continue;
        }
        if (eligibility === 'needs_review') {
          verifyStats.needsReview += 1;
          continue;
        }
        const ok = await verifyBackfilledPrimaryAssignment(
          sb,
          'city_person',
          entityId,
          cityId,
          legacySource,
        );
        if (!ok) await recordVerifyFailure('city_person', entityId, cityId, legacySource);
        else verifyStats.verifiedEligible += 1;
      }

      if (rawBatch.length < VERIFY_PAGE_SIZE) break;
      peopleOffset += rawBatch.length;
    }
  }

  let poiOffset = 0;
  if (entityTypes.includes('poi')) {
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
        const legacyUrl = (row.image_url as string) ?? null;
        const legacySource: LegacySource = {
          entityType: 'poi',
          entityId,
          cityId,
          label: row.name as string,
          imageUrl: legacyUrl,
          storagePath: null,
        };
        const eligibility = classifyLegacyBackfillSource(legacySource, placeholderRegistry);
        if (eligibility === 'no_image') {
          verifyStats.noLegacyImage += 1;
          continue;
        }
        if (eligibility === 'placeholder') {
          verifyStats.skippedPlaceholder += 1;
          continue;
        }
        if (eligibility === 'needs_review') {
          verifyStats.needsReview += 1;
          continue;
        }
        const ok = await verifyBackfilledPrimaryAssignment(
          sb,
          'poi',
          entityId,
          cityId,
          legacySource,
        );
        if (!ok) await recordVerifyFailure('poi', entityId, cityId, legacySource);
        else verifyStats.verifiedEligible += 1;
      }

      if (poiBatch.length < VERIFY_PAGE_SIZE) break;
      poiOffset += poiBatch.length;
    }
  }

  let citiesOffset = 0;
  let patronLegacyWithImage = 0;
  if (entityTypes.includes('patron')) {
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
        const legacySource: LegacySource = {
          entityType: 'patron',
          entityId: cityId,
          cityId,
          label: (row.name as string) ?? cityId,
          imageUrl,
          storagePath: null,
        };
        const eligibility = classifyLegacyBackfillSource(legacySource, placeholderRegistry);
        if (eligibility === 'placeholder') {
          verifyStats.skippedPlaceholder += 1;
          continue;
        }
        if (eligibility === 'needs_review') {
          verifyStats.needsReview += 1;
          continue;
        }
        const ok = await verifyBackfilledPrimaryAssignment(
          sb,
          'patron',
          cityId,
          cityId,
          legacySource,
        );
        if (!ok) await recordVerifyFailure('patron', cityId, cityId, legacySource);
        else verifyStats.verifiedEligible += 1;
      }

      if (cityBatch.length < VERIFY_PAGE_SIZE) break;
      citiesOffset += VERIFY_PAGE_SIZE;
    }
  }

  console.log('[verify] stats', verifyStats);
  console.log(
    '[verify] legacy con immagine ma senza primary assignment corrente:',
    missingPrimary.length,
  );
  if (missingPrimary.length > 0) {
    for (const item of missingPrimary.slice(0, 50)) {
      console.log(`  - [${item.reason}] ${item.key}`);
    }
    if (missingPrimary.length > 50) {
      console.log(`  ... +${missingPrimary.length - 50} altri`);
    }
  }
  if (entityTypes.includes('patron')) {
    console.log(`[verify] patron legacy con imageUrl in patron_details: ${patronLegacyWithImage}`);
  }

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
  placeholderRegistry: PlatformPlaceholderRegistry,
): Promise<BackfillCounters> {
  const counters: BackfillCounters = {
    scanned: 0,
    created: 0,
    wouldCreate: 0,
    skipped: 0,
    needsReview: 0,
    conflicts: 0,
    errors: 0,
  };

  let offset = options.offset;
  const fetchBatch =
    entityType === 'city_person'
      ? fetchCityPersonBatch
      : entityType === 'poi'
        ? fetchPoiBatch
        : fetchPatronBatch;

  for (;;) {
    const page = await fetchBatch(sb, offset, options.batchSize, options.cityIdFilter);
    if (page.consumed === 0) break;

    for (const source of page.sources) {
      counters.scanned += 1;
      const outcome = await materializeAssignment(
        sb,
        source,
        !options.execute,
        placeholderRegistry,
      );
      if (outcome === 'created') counters.created += 1;
      else if (outcome === 'would_create') counters.wouldCreate += 1;
      else if (outcome === 'skipped') counters.skipped += 1;
      else if (outcome === 'needs_review') counters.needsReview += 1;
      else if (outcome === 'conflict') counters.conflicts += 1;
      else if (outcome === 'error') counters.errors += 1;
    }

    offset += page.consumed;
    if (page.consumed < options.batchSize) break;
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
  const placeholderRegistry = await loadPlatformPlaceholderRegistry(sb);

  console.log(
    `[backfill] mode=${options.execute ? 'EXECUTE' : 'DRY-RUN'} entityTypes=${options.entityTypes.join(',')} batch=${options.batchSize} placeholderRegistrySize=${placeholderRegistry.size}`,
  );

  if (options.verifyOnly) {
    const verifyOk = await runVerify(
      sb,
      options.cityIdFilter,
      placeholderRegistry,
      options.entityTypes,
    );
    if (!verifyOk) process.exit(1);
    return;
  }

  const totals: BackfillCounters = {
    scanned: 0,
    created: 0,
    wouldCreate: 0,
    skipped: 0,
    needsReview: 0,
    conflicts: 0,
    errors: 0,
  };

  for (const entityType of options.entityTypes) {
    const result = await backfillEntityType(sb, entityType, options, placeholderRegistry);
    console.log(`[backfill:${entityType}]`, result);
    for (const key of Object.keys(totals) as (keyof BackfillCounters)[]) {
      totals[key] += result[key];
    }
  }

  console.log('[backfill:totals]', totals);

  if (totals.needsReview > 0) {
    console.warn(
      `[backfill] ${totals.needsReview} entità in needs_review — NON migrate; backfill non completamente chiuso finché non gestite manualmente.`,
    );
  }

  if (options.execute) {
    const verifyOk = await runVerify(
      sb,
      options.cityIdFilter,
      placeholderRegistry,
      options.entityTypes,
    );
    if (totals.conflicts > 0) {
      console.error(`[backfill] execute completato con ${totals.conflicts} conflict(s); exit non-zero.`);
    }
    if (totals.needsReview > 0) {
      console.error(
        `[backfill] execute completato con ${totals.needsReview} needs_review; exit non-zero.`,
      );
    }
    if (totals.errors > 0 || totals.conflicts > 0 || totals.needsReview > 0 || !verifyOk) {
      process.exit(1);
    }
  } else if (totals.errors > 0 || totals.conflicts > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { parseGallery } from '@/services/city/parsers/media/parseGallery';
import { mf2EntityImageAssignmentsTable } from '@/services/reports/mf2DbClient';
import { supabase } from '@/services/supabaseClient';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';
import { fetchMediaAssetsByIds } from './mediaAssetService';

type AssignmentUsageRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  city_id: string;
  media_asset_id: string;
  assignment_role: string;
  source_image_url: string | null;
  source_storage_bucket: string | null;
  source_storage_path: string | null;
};

const USAGE_MAP_PAGE_SIZE = 1000;
const IN_QUERY_CHUNK_SIZE = 200;

function normalizeUsageUrl(url: string): string {
  return url.split('?')[0].trim();
}

function addToMap(
  usageMap: Record<string, string[]>,
  url: string | null | undefined,
  context: string,
): void {
  if (!url?.trim()) return;
  const cleanUrl = normalizeUsageUrl(url);
  if (!cleanUrl) return;
  if (!usageMap[cleanUrl]) usageMap[cleanUrl] = [];
  if (!usageMap[cleanUrl].includes(context)) usageMap[cleanUrl].push(context);
}

function isAssignmentUsageRow(value: unknown): value is AssignmentUsageRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.entity_type === 'string' &&
    typeof row.entity_id === 'string' &&
    typeof row.city_id === 'string' &&
    typeof row.media_asset_id === 'string' &&
    typeof row.assignment_role === 'string' &&
    (row.source_image_url === null || typeof row.source_image_url === 'string') &&
    (row.source_storage_bucket === null || typeof row.source_storage_bucket === 'string') &&
    (row.source_storage_path === null || typeof row.source_storage_path === 'string')
  );
}

function assignmentContextLabel(row: AssignmentUsageRow, entityLabel: string | null): string {
  const role = row.assignment_role === 'gallery' ? 'Gallery' : 'Primary';
  const typeLabel =
    row.entity_type === 'city_person'
      ? 'Person'
      : row.entity_type === 'poi'
        ? 'POI'
        : row.entity_type === 'patron'
          ? 'Patron'
          : row.entity_type === 'photo_submission'
            ? 'Community'
            : row.entity_type;
  const name = entityLabel?.trim() || row.entity_id;
  return `${typeLabel} ${role}: ${name}`;
}

async function fetchEntityLabelsByIdChunked(
  table: 'city_people' | 'pois' | 'cities',
  ids: string[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  const uniqueIds = [...new Set(ids.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) return labels;

  for (let i = 0; i < uniqueIds.length; i += IN_QUERY_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + IN_QUERY_CHUNK_SIZE);
    const { data, error } = await supabase.from(table).select('id, name').in('id', chunk);
    if (error) throw new Error(`Usage map ${table} labels fallita: ${error.message}`);
    for (const row of data ?? []) {
      if (row?.id && typeof row.name === 'string') {
        labels.set(row.id, row.name);
      }
    }
  }

  return labels;
}

async function fetchCurrentAssignmentPage(
  offset: number,
): Promise<{ rows: AssignmentUsageRow[]; fetchedCount: number }> {
  const { data, error } = await mf2EntityImageAssignmentsTable()
    .select(
      'id, entity_type, entity_id, city_id, media_asset_id, assignment_role, source_image_url, source_storage_bucket, source_storage_path',
    )
    .eq('is_current', true)
    .in('assignment_status', ['active', 'suspended'])
    .order('id', { ascending: true })
    .range(offset, offset + USAGE_MAP_PAGE_SIZE - 1);

  if (error) {
    throw new Error(`Usage map assignment fallita: ${error.message}`);
  }

  const batch = data ?? [];
  const rows: AssignmentUsageRow[] = [];
  for (const raw of batch) {
    if (isAssignmentUsageRow(raw)) rows.push(raw);
  }

  return { rows, fetchedCount: batch.length };
}

function mergeAssignmentRowIntoUsageMap(
  usageMap: Record<string, string[]>,
  row: AssignmentUsageRow,
  personNameById: Map<string, string>,
  poiNameById: Map<string, string>,
  cityNameById: Map<string, string>,
  pageAssets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>,
): void {
  let entityLabel: string | null = null;
  if (row.entity_type === 'city_person') {
    entityLabel = personNameById.get(row.entity_id) ?? null;
  } else if (row.entity_type === 'poi') {
    entityLabel = poiNameById.get(row.entity_id) ?? null;
  } else if (row.entity_type === 'patron') {
    entityLabel = cityNameById.get(row.city_id) ?? 'Patron';
  }

  const context = assignmentContextLabel(row, entityLabel);
  const asset = pageAssets.get(row.media_asset_id);

  addToMap(usageMap, row.source_image_url, context);

  const bucket = row.source_storage_bucket?.trim() || asset?.storage_bucket?.trim() || '';
  const path = row.source_storage_path?.trim() || asset?.storage_path?.trim() || '';
  if (bucket && path) {
    addToMap(usageMap, buildPublicStorageUrl(bucket, path), context);
  }
}

async function ensureEntityLabels(
  table: 'city_people' | 'pois' | 'cities',
  ids: string[],
  cache: Map<string, string>,
): Promise<void> {
  const missing = [...new Set(ids.filter((id) => id.trim().length > 0 && !cache.has(id)))];
  if (missing.length === 0) return;
  const fetched = await fetchEntityLabelsByIdChunked(table, missing);
  for (const [id, name] of fetched) {
    cache.set(id, name);
  }
}

async function forEachPaginatedBatch<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
  consume: (batch: T[]) => void,
): Promise<void> {
  let offset = 0;
  for (;;) {
    const batch = await fetchPage(offset, USAGE_MAP_PAGE_SIZE);
    if (batch.length === 0) break;
    consume(batch);
    if (batch.length < USAGE_MAP_PAGE_SIZE) break;
    offset += batch.length;
  }
}

async function buildAssignmentUsageEntries(): Promise<Record<string, string[]>> {
  const usageMap: Record<string, string[]> = {};
  const personNameById = new Map<string, string>();
  const poiNameById = new Map<string, string>();
  const cityNameById = new Map<string, string>();

  let offset = 0;
  for (;;) {
    const { rows, fetchedCount } = await fetchCurrentAssignmentPage(offset);
    if (fetchedCount === 0) break;

    const assetIds = [...new Set(rows.map((r) => r.media_asset_id))];
    const pageAssets = await fetchMediaAssetsByIds(assetIds);

    await ensureEntityLabels(
      'city_people',
      rows.filter((r) => r.entity_type === 'city_person').map((r) => r.entity_id),
      personNameById,
    );
    await ensureEntityLabels(
      'pois',
      rows.filter((r) => r.entity_type === 'poi').map((r) => r.entity_id),
      poiNameById,
    );
    await ensureEntityLabels(
      'cities',
      rows.map((r) => r.city_id),
      cityNameById,
    );

    for (const row of rows) {
      mergeAssignmentRowIntoUsageMap(
        usageMap,
        row,
        personNameById,
        poiNameById,
        cityNameById,
        pageAssets,
      );
    }

    if (fetchedCount < USAGE_MAP_PAGE_SIZE) break;
    offset += fetchedCount;
  }

  return usageMap;
}

async function mergeLegacyUrlUsage(usageMap: Record<string, string[]>): Promise<void> {
  await forEachPaginatedBatch(
    async (offset, limit) => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, image_url, hero_image, gallery')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`Usage map cities media fallita: ${error.message}`);
      return data ?? [];
    },
    (batch) => {
      for (const c of batch) {
        addToMap(usageMap, c.image_url, `City Card: ${c.name}`);
        addToMap(usageMap, c.hero_image, `City Hero: ${c.name}`);
        for (const asset of parseGallery(c.gallery)) {
          addToMap(usageMap, asset.url, `City Gallery: ${c.name}`);
        }
      }
    },
  );

  await forEachPaginatedBatch(
    async (offset, limit) => {
      const { data, error } = await supabase
        .from('shops')
        .select('name, image_url')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    (batch) => {
      for (const shop of batch) {
        addToMap(usageMap, shop.image_url, `Shop: ${shop.name}`);
      }
    },
  );

  await forEachPaginatedBatch(
    async (offset, limit) => {
      const { data, error } = await supabase
        .from('city_events')
        .select('name, image_url')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    (batch) => {
      for (const event of batch) {
        addToMap(usageMap, event.image_url, `Event: ${event.name}`);
      }
    },
  );

  await forEachPaginatedBatch(
    async (offset, limit) => {
      const { data, error } = await supabase
        .from('city_guides')
        .select('name, image_url')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    (batch) => {
      for (const guide of batch) {
        addToMap(usageMap, guide.image_url, `Guide: ${guide.name}`);
      }
    },
  );

  await forEachPaginatedBatch(
    async (offset, limit) => {
      const { data, error } = await supabase
        .from('social_templates')
        .select('name, bg_url')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    (batch) => {
      for (const template of batch) {
        addToMap(usageMap, template.bg_url, `Template: ${template.name}`);
      }
    },
  );
}

/**
 * POST-MF5 — usage map per Media Library (solo caller: `mediaService.getAssetUsageMap` → AdminAssetLibrary).
 * Person/POI/Patron: URL da `entity_image_assignments` (is_current + active/suspended) + `media_assets`.
 * `suspended` resta «in uso» per la Libreria (l’asset non va trattato come orfano); il cutover read UI usa solo `active`.
 * City/Shop/Event/Guide/Template: colonne legacy URL (fuori cutover MF5 Person/POI).
 *
 * `scripts/cleanup_orphan_storage.ts` NON usa questa funzione: indicizza legacy Person/POI via `buildReferenceIndex`.
 * La rimozione del merge legacy Person/POI qui non abilita l’orphan script a cancellare storage pre-backfill.
 * In Libreria, delete fisico resta manuale e fail-closed su catalogo MF4; l’overlay «in uso» segue assignment SoT.
 */
export async function buildAssetUsageMap(): Promise<Record<string, string[]>> {
  const usageMap = await buildAssignmentUsageEntries();
  await mergeLegacyUrlUsage(usageMap);
  return usageMap;
}

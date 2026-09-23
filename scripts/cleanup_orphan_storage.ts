/**
 * MF5 — orphan Storage audit (default DRY-RUN, policy conservativa).
 */

import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PUBLIC_BUCKET = 'public-media';
const DEFAULT_FOLDERS = [
  'people_portraits',
  'famous_person_photo_suggestions',
  'patron_photo_suggestions',
  'city_patron_gallery',
] as const;

const ALLOWED_ROOT_FOLDERS = new Set<string>([...DEFAULT_FOLDERS]);

const BLOCKED_PREFIXES = ['verified/', 'wikimedia/'] as const;
const REFERENCE_INDEX_PAGE_SIZE = 1000;

type ReferenceIndex = {
  publicMediaPaths: Set<string>;
  publicMediaUrls: Set<string>;
};

type OrphanCandidate = {
  bucket: string;
  storagePath: string;
  reason: string;
  checkedReferences: string[];
};

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const getValue = (prefix: string): string | undefined =>
    argv.find((a) => a.startsWith(`${prefix}=`))?.slice(prefix.length + 1);

  const folderArg = getValue('--folder');
  const folders =
    folderArg != null && folderArg.length > 0
      ? folderArg.split(',').map((f) => f.trim())
      : [...DEFAULT_FOLDERS];

  for (const folder of folders) {
    if (
      BLOCKED_PREFIXES.some(
        (prefix) => folder.startsWith(prefix) || folder === prefix.replace(/\/$/, ''),
      )
    ) {
      console.error(`[orphan-cleanup] folder non ammesso (namespace MF4): ${folder}`);
      process.exit(1);
    }
    if (!ALLOWED_ROOT_FOLDERS.has(folder.split('/')[0] ?? '')) {
      console.error(
        `[orphan-cleanup] folder non in whitelist: ${folder}. Ammessi: ${[...ALLOWED_ROOT_FOLDERS].join(', ')}`,
      );
      process.exit(1);
    }
  }

  const limit = Number(getValue('--limit') ?? 500);
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isInteger(limit)) {
    console.error(
      '[orphan-cleanup] --limit deve essere un intero positivo (page size listing Storage)',
    );
    process.exit(1);
  }

  const maxObjectsRaw = getValue('--max-objects');
  let maxObjects: number | null = null;
  if (maxObjectsRaw !== undefined) {
    const parsedMax = Number(maxObjectsRaw);
    if (!Number.isFinite(parsedMax) || parsedMax <= 0 || !Number.isInteger(parsedMax)) {
      console.error(
        '[orphan-cleanup] --max-objects deve essere un intero positivo (massimo oggetti analizzati)',
      );
      process.exit(1);
    }
    maxObjects = parsedMax;
  }

  return {
    execute: flags.has('--execute'),
    pageSize: Math.min(Math.trunc(limit), 1000),
    maxObjects,
    folders,
  };
}

function normalizeUrlKey(url: string): string {
  return url.split('?')[0].trim();
}

function parsePublicMediaObjectPathFromUrl(url: string): string | null {
  const trimmed = normalizeUrlKey(url);
  const marker = '/object/public/public-media/';
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return null;
  const raw = trimmed.slice(idx + marker.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/** Raccoglie file fino a `maxToCollect` (budget globale residuo); null = illimitato. */
async function listAllFilesUnderPrefix(
  sb: SupabaseClient,
  prefix: string,
  pageSize: number,
  maxToCollect: number | null,
): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [prefix.replace(/\/+$/, '')];

  while (queue.length > 0) {
    if (maxToCollect != null && files.length >= maxToCollect) {
      return files;
    }

    const folder = queue.shift();
    if (!folder) continue;

    let offset = 0;
    for (;;) {
      const { data, error } = await sb.storage.from(PUBLIC_BUCKET).list(folder, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw error;
      const entries = data ?? [];
      if (entries.length === 0) break;

      for (const entry of entries) {
        if (!entry.name) continue;
        const childPath = `${folder}/${entry.name}`;
        const isFolder = entry.id == null;
        if (isFolder) {
          queue.push(childPath);
          continue;
        }
        files.push(childPath);
        if (maxToCollect != null && files.length >= maxToCollect) {
          return files;
        }
      }

      if (entries.length < pageSize) break;
      offset += entries.length;
    }
  }

  return files;
}

async function fetchAllPaginatedRows<T>(
  sb: SupabaseClient,
  table: 'media_assets' | 'entity_image_assignments' | 'city_people' | 'pois' | 'content_reports',
  select: string,
  orderColumn: string,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await sb
      .from(table)
      .select(select)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + REFERENCE_INDEX_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`[orphan-cleanup] reference index ${table} page failed: ${error.message}`);
    }

    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < REFERENCE_INDEX_PAGE_SIZE) break;
    offset += batch.length;
  }

  return rows;
}

async function buildReferenceIndex(sb: SupabaseClient): Promise<ReferenceIndex> {
  const publicMediaPaths = new Set<string>();
  const publicMediaUrls = new Set<string>();

  const addPublicPath = (
    bucket: string | null | undefined,
    storagePath: string | null | undefined,
  ) => {
    const p = storagePath?.trim();
    if (!p) return;
    if (!bucket || bucket === PUBLIC_BUCKET) {
      publicMediaPaths.add(p);
    }
  };

  const addUrl = (url: string | null | undefined) => {
    const u = url?.trim();
    if (!u) return;
    publicMediaUrls.add(normalizeUrlKey(u));
    const objectPath = parsePublicMediaObjectPathFromUrl(u);
    if (objectPath) publicMediaPaths.add(objectPath);
  };

  type MediaAssetRefRow = {
    storage_bucket: string | null;
    storage_path: string | null;
    source_url: string | null;
  };
  type AssignmentRefRow = {
    source_image_url: string | null;
    source_storage_bucket: string | null;
    source_storage_path: string | null;
  };
  type PeopleRefRow = { image_url: string | null; image_storage_path: string | null };
  type PoiRefRow = { image_url: string | null };
  type ReportRefRow = {
    snapshot_image_url: string | null;
    snapshot_storage_path: string | null;
    evidence_storage_path: string | null;
  };

  const assets = await fetchAllPaginatedRows<MediaAssetRefRow>(
    sb,
    'media_assets',
    'storage_bucket, storage_path, source_url',
    'id',
  );
  for (const row of assets) {
    addPublicPath(row.storage_bucket, row.storage_path);
    addUrl(row.source_url);
  }

  const assignments = await fetchAllPaginatedRows<AssignmentRefRow>(
    sb,
    'entity_image_assignments',
    'source_image_url, source_storage_bucket, source_storage_path',
    'id',
  );
  for (const row of assignments) {
    addUrl(row.source_image_url);
    addPublicPath(row.source_storage_bucket, row.source_storage_path);
  }

  const people = await fetchAllPaginatedRows<PeopleRefRow>(
    sb,
    'city_people',
    'image_url, image_storage_path',
    'id',
  );
  for (const row of people) {
    addUrl(row.image_url);
    addPublicPath(PUBLIC_BUCKET, row.image_storage_path);
  }

  const pois = await fetchAllPaginatedRows<PoiRefRow>(sb, 'pois', 'image_url', 'id');
  for (const row of pois) addUrl(row.image_url);

  const reports = await fetchAllPaginatedRows<ReportRefRow>(
    sb,
    'content_reports',
    'snapshot_image_url, snapshot_storage_path, evidence_storage_path',
    'id',
  );
  for (const row of reports) {
    addUrl(row.snapshot_image_url);
    addPublicPath(PUBLIC_BUCKET, row.snapshot_storage_path);
    // evidence_storage_path: bucket evidenze separato — non indicizzato come public-media
  }

  return { publicMediaPaths, publicMediaUrls };
}

function pathReferenced(
  storagePath: string,
  refs: ReferenceIndex,
): { referenced: boolean; checked: string[] } {
  const checked = [
    'media_assets (public-media paths)',
    'entity_image_assignments source paths/urls',
    'city_people legacy paths/urls',
    'pois legacy urls',
    'content_reports snapshot',
  ];
  if (refs.publicMediaPaths.has(storagePath)) {
    return { referenced: true, checked };
  }
  for (const url of refs.publicMediaUrls) {
    const parsed = parsePublicMediaObjectPathFromUrl(url);
    if (parsed === storagePath) {
      return { referenced: true, checked };
    }
  }
  return { referenced: false, checked };
}

async function revalidateOrphans(
  sb: SupabaseClient,
  candidates: OrphanCandidate[],
): Promise<OrphanCandidate[]> {
  const refs = await buildReferenceIndex(sb);
  return candidates.filter((candidate) => !pathReferenced(candidate.storagePath, refs).referenced);
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
    `[orphan-cleanup] mode=${options.execute ? 'EXECUTE' : 'DRY-RUN'} folders=${options.folders.join(',')} pageSize=${options.pageSize}`,
  );

  const refs = await buildReferenceIndex(sb);
  const orphans: OrphanCandidate[] = [];
  let analyzedObjects = 0;

  for (const folder of options.folders) {
    if (options.maxObjects != null && analyzedObjects >= options.maxObjects) {
      break;
    }

    const remainingBudget =
      options.maxObjects != null ? options.maxObjects - analyzedObjects : null;

    const objectPaths = await listAllFilesUnderPrefix(
      sb,
      folder,
      options.pageSize,
      remainingBudget,
    );

    for (const storagePath of objectPaths) {
      analyzedObjects += 1;
      const { referenced, checked } = pathReferenced(storagePath, refs);
      if (!referenced) {
        orphans.push({
          bucket: PUBLIC_BUCKET,
          storagePath,
          reason:
            'Nessun riferimento trovato nelle fonti controllate (non verificato orphan certo al 100%)',
          checkedReferences: checked,
        });
      }
      if (options.maxObjects != null && analyzedObjects >= options.maxObjects) {
        break;
      }
    }
  }

  if (options.maxObjects != null) {
    console.log(
      `[orphan-cleanup] analyzed=${analyzedObjects} max-objects=${options.maxObjects} (budget globale condiviso)`,
    );
  }

  console.log(`[orphan-cleanup] candidates=${orphans.length} (no known DB reference)`);
  for (const orphan of orphans.slice(0, 100)) {
    console.log(`  - ${orphan.bucket}/${orphan.storagePath}`);
    console.log(`    reason: ${orphan.reason}`);
  }
  if (orphans.length > 100) {
    console.log(`  ... +${orphans.length - 100} altri (output troncato)`);
  }

  if (!options.execute) {
    console.log('[orphan-cleanup] DRY-RUN — nessun file rimosso. Usare --execute per cancellare.');
    return;
  }

  if (orphans.length === 0) return;

  // Revalidation immediata prima della cancellazione (non atomica rispetto a write concorrenti).
  const confirmed = await revalidateOrphans(sb, orphans);
  if (confirmed.length === 0) {
    console.log(
      '[orphan-cleanup] EXECUTE abortito: nessun candidato confermato dopo revalidation.',
    );
    return;
  }

  const DELETE_BATCH = 100;
  const failed: string[] = [];
  let removed = 0;

  for (let i = 0; i < confirmed.length; i += DELETE_BATCH) {
    const batchCandidates = confirmed.slice(i, i + DELETE_BATCH);
    // Revalidation per batch: riduce il rischio tra revalidation globale e remove (limite noto, non TX Storage).
    const batchStillOrphan = await revalidateOrphans(sb, batchCandidates);
    if (batchStillOrphan.length === 0) {
      continue;
    }
    const batch = batchStillOrphan.map((o) => o.storagePath);
    const { error } = await sb.storage.from(PUBLIC_BUCKET).remove(batch);
    if (error) {
      console.error('[orphan-cleanup] remove batch failed:', error.message);
      failed.push(...batch);
    } else {
      removed += batchStillOrphan.length;
    }
  }

  console.log(`[orphan-cleanup] removed=${removed} failed=${failed.length}`);
  if (failed.length > 0) {
    for (const path of failed.slice(0, 20)) {
      console.log(`  failed: ${path}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

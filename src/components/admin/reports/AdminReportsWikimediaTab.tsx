import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_GEO_REPORT_FILTER,
  GeoReportFilters,
  type GeoReportFilterValue,
} from '@/components/admin/shared/GeoReportFilters';
import { isImageAssetStatusDb } from '@/constants/governance';
import { wikimediaFunctionalStatusLabel } from '@/domain/media/imagePublicationPolicy';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import { mf3MediaAssetsTable } from '@/services/media/mf3DbClient';
import { supabase } from '@/services/supabaseClient';

type QueueRow = {
  assetId: string;
  label: string;
  sourceRef: string | null;
  cityName: string;
  technicalStatus: string;
};

const QUEUE_PAGE = 40;
const LINK_PAGE = 100;
const QUEUE_ASSET_STATUSES = ['active', 'suspended', 'restored'] as const;

type QueueAssetStatus = (typeof QUEUE_ASSET_STATUSES)[number];

function isQueueAssetStatus(value: string): value is QueueAssetStatus {
  return (QUEUE_ASSET_STATUSES as readonly string[]).includes(value);
}

function geoIsActive(geo: GeoReportFilterValue): boolean {
  return Boolean(geo.continent || geo.nation || geo.region || geo.zone || geo.cityId);
}

function isAbortError(
  error: { name?: string; message?: string } | null,
  signal: AbortSignal,
): boolean {
  return signal.aborted || error?.name === 'AbortError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cityNamesLabel(names: Iterable<string>): string {
  const unique = [...new Set(names)]
    .filter((name) => name.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
  return unique.length > 0 ? unique.join(', ') : 'Senza città';
}

function queueLabel(input: {
  assetStatus: string;
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
}): string {
  const status = isImageAssetStatusDb(input.assetStatus) ? input.assetStatus : null;
  return (
    wikimediaFunctionalStatusLabel({
      assetStatus: status,
      wikimediaValidated: input.wikimediaValidated,
      adminBlocked: input.adminBlocked,
    }) ?? 'DA VALIDARE'
  );
}

async function loadCityNames(cityIds: string[], signal: AbortSignal): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const ids = [...new Set(cityIds.filter((id) => id.trim().length > 0))];
  for (let index = 0; index < ids.length; index += LINK_PAGE) {
    const chunk = ids.slice(index, index + LINK_PAGE);
    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .in('id', chunk)
      .order('id', { ascending: true })
      .abortSignal(signal);
    if (isAbortError(error, signal)) throw new DOMException('Aborted', 'AbortError');
    if (error) throw new Error(error.message);
    for (const city of data ?? []) {
      names.set(city.id, city.name);
    }
  }
  return names;
}

async function loadCurrentPoiCities(
  assetIds: string[],
  signal: AbortSignal,
): Promise<Map<string, string[]>> {
  const cityIdsByAsset = new Map<string, string[]>();
  for (const assetId of assetIds) cityIdsByAsset.set(assetId, []);
  for (let index = 0; index < assetIds.length; index += LINK_PAGE) {
    const chunk = assetIds.slice(index, index + LINK_PAGE);
    let offset = 0;
    for (;;) {
      const { data, error } = await entityImageAssignmentsQuery()
        .select('media_asset_id, city_id')
        .in('media_asset_id', chunk)
        .eq('entity_type', 'poi')
        .eq('is_current', true)
        .order('id', { ascending: true })
        .range(offset, offset + LINK_PAGE - 1)
        .abortSignal(signal);
      if (isAbortError(error, signal)) throw new DOMException('Aborted', 'AbortError');
      if (error) throw new Error(error.message);
      const links = data ?? [];
      for (const link of links) {
        const cities = cityIdsByAsset.get(link.media_asset_id) ?? [];
        cities.push(link.city_id);
        cityIdsByAsset.set(link.media_asset_id, cities);
      }
      if (links.length < LINK_PAGE) break;
      offset += LINK_PAGE;
    }
  }
  return cityIdsByAsset;
}

async function loadAssetPage(
  offset: number,
  signal: AbortSignal,
): Promise<{ rows: QueueRow[]; nextCursor: number; hasMore: boolean }> {
  const { data, error } = await mf3MediaAssetsTable()
    .select('id, asset_status, source_ref, wikimedia_validated, admin_blocked')
    .eq('origin_type', 'wikimedia')
    .in('asset_status', [...QUEUE_ASSET_STATUSES])
    .or('wikimedia_validated.is.null,wikimedia_validated.eq.false')
    .order('id', { ascending: true })
    .range(offset, offset + QUEUE_PAGE - 1)
    .abortSignal(signal);
  if (isAbortError(error, signal)) throw new DOMException('Aborted', 'AbortError');
  if (error) throw new Error(error.message);
  const assets = (data ?? []).filter(
    (asset) => isQueueAssetStatus(asset.asset_status) && asset.wikimedia_validated !== true,
  );
  const cityIdsByAsset = await loadCurrentPoiCities(
    assets.map((asset) => asset.id),
    signal,
  );
  const cityNames = await loadCityNames([...cityIdsByAsset.values()].flat(), signal);
  const rows = assets.map((asset) => ({
    assetId: asset.id,
    label: queueLabel({
      assetStatus: asset.asset_status,
      wikimediaValidated: asset.wikimedia_validated,
      adminBlocked: asset.admin_blocked !== false,
    }),
    sourceRef: asset.source_ref,
    cityName: cityNamesLabel(
      (cityIdsByAsset.get(asset.id) ?? []).map((cityId) => cityNames.get(cityId) ?? ''),
    ),
    technicalStatus: asset.asset_status,
  }));
  return {
    rows,
    nextCursor: offset + (data ?? []).length,
    hasMore: (data ?? []).length === QUEUE_PAGE,
  };
}

function readEmbeddedName(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = readEmbeddedName(item);
      if (name) return name;
    }
    return '';
  }
  if (!isRecord(value) || typeof value.name !== 'string') return '';
  return value.name;
}

function readEmbeddedAsset(value: unknown): {
  id: string;
  assetStatus: string;
  sourceRef: string | null;
  wikimediaValidated: boolean | null;
  adminBlocked: boolean;
} | null {
  const record = Array.isArray(value) ? value.find(isRecord) : isRecord(value) ? value : null;
  if (!record || typeof record.id !== 'string' || typeof record.asset_status !== 'string')
    return null;
  if (record.origin_type !== 'wikimedia' || !isQueueAssetStatus(record.asset_status)) return null;
  if (record.wikimedia_validated === true) return null;
  const wikimediaValidated =
    record.wikimedia_validated === true
      ? true
      : record.wikimedia_validated === false
        ? false
        : null;
  return {
    id: record.id,
    assetStatus: record.asset_status,
    sourceRef: typeof record.source_ref === 'string' ? record.source_ref : null,
    wikimediaValidated,
    adminBlocked: record.admin_blocked !== false,
  };
}

async function loadGeoPage(
  geo: GeoReportFilterValue,
  cursor: number,
  signal: AbortSignal,
): Promise<{ rows: QueueRow[]; nextCursor: number; hasMore: boolean }> {
  const collected = new Map<string, { row: QueueRow; cities: Set<string> }>();
  let offset = cursor;
  let hasMore = true;

  while (collected.size < QUEUE_PAGE && hasMore) {
    let query = entityImageAssignmentsQuery()
      .select(
        'id, media_asset_id, cities!entity_image_assignments_city_id_fkey!inner(name, continent, nation, admin_region, zone), media_assets!entity_image_assignments_media_asset_id_fkey!inner(id, origin_type, asset_status, source_ref, wikimedia_validated, admin_blocked)',
      )
      .eq('is_current', true)
      .eq('entity_type', 'poi')
      .eq('media_assets.origin_type', 'wikimedia')
      .in('media_assets.asset_status', [...QUEUE_ASSET_STATUSES])
      .or('wikimedia_validated.is.null,wikimedia_validated.eq.false', {
        referencedTable: 'media_assets',
      })
      .order('media_asset_id', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + QUEUE_PAGE - 1)
      .abortSignal(signal);
    if (geo.continent) query = query.eq('cities.continent', geo.continent);
    if (geo.nation) query = query.eq('cities.nation', geo.nation);
    if (geo.region) query = query.eq('cities.admin_region', geo.region);
    if (geo.zone) query = query.eq('cities.zone', geo.zone);
    if (geo.cityId) query = query.eq('city_id', geo.cityId);

    const { data, error } = await query;
    if (isAbortError(error, signal)) throw new DOMException('Aborted', 'AbortError');
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    let consumed = 0;
    for (const item of batch) {
      consumed += 1;
      const asset = readEmbeddedAsset(item.media_assets);
      const cityName = readEmbeddedName(item.cities);
      if (!asset) continue;
      const existing = collected.get(asset.id);
      if (existing) {
        if (cityName) existing.cities.add(cityName);
        continue;
      }
      if (collected.size >= QUEUE_PAGE) {
        consumed -= 1;
        break;
      }
      const cities = new Set<string>();
      if (cityName) cities.add(cityName);
      collected.set(asset.id, {
        cities,
        row: {
          assetId: asset.id,
          label: queueLabel({
            assetStatus: asset.assetStatus,
            wikimediaValidated: asset.wikimediaValidated,
            adminBlocked: asset.adminBlocked,
          }),
          sourceRef: asset.sourceRef,
          cityName: '',
          technicalStatus: asset.assetStatus,
        },
      });
    }

    offset += consumed;
    if (consumed < batch.length) break;
    if (batch.length < QUEUE_PAGE) hasMore = false;
  }

  return {
    rows: [...collected.values()].map((entry) => ({
      ...entry.row,
      cityName: cityNamesLabel(entry.cities),
    })),
    nextCursor: offset,
    hasMore,
  };
}

function mergeRows(current: QueueRow[], incoming: QueueRow[]): QueueRow[] {
  const byId = new Map(current.map((row) => [row.assetId, row]));
  for (const row of incoming) {
    const existing = byId.get(row.assetId);
    if (!existing) {
      byId.set(row.assetId, row);
      continue;
    }
    const names = new Set(
      `${existing.cityName}, ${row.cityName}`
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0 && name !== 'Senza città'),
    );
    byId.set(row.assetId, { ...existing, cityName: cityNamesLabel(names) });
  }
  return [...byId.values()];
}

export const AdminReportsWikimediaTab = () => {
  const [geo, setGeo] = useState<GeoReportFilterValue>(EMPTY_GEO_REPORT_FILTER);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setRows([]);
    setCursor(0);
    setHasMore(false);
    const load = geoIsActive(geo)
      ? loadGeoPage(geo, 0, controller.signal)
      : loadAssetPage(0, controller.signal);
    void load
      .then((page) => {
        if (controller.signal.aborted) return;
        setRows(page.rows);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Lettura coda Wikimedia fallita.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [geo]);

  const loadMore = () => {
    const controller = abortRef.current;
    if (!controller || loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const load = geoIsActive(geo)
      ? loadGeoPage(geo, cursor, controller.signal)
      : loadAssetPage(cursor, controller.signal);
    void load
      .then((page) => {
        if (controller.signal.aborted) return;
        setRows((current) => mergeRows(current, page.rows));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Lettura coda Wikimedia fallita.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Validare Wikimedia
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Foto Wikimedia non ancora validate. È una coda separata da Verificare immagine AI.
        </p>
      </div>
      <GeoReportFilters value={geo} onChange={setGeo} />
      {loading ? <p className="text-sm text-slate-400">Lettura...</p> : null}
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="min-w-0 space-y-2">
        {rows.map((row) => (
          <li
            key={row.assetId}
            className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200"
          >
            <p className="font-semibold">{row.label}</p>
            <p className="break-words">Città: {row.cityName}</p>
            <p className="break-words">Wikidata: {row.sourceRef ?? '—'}</p>
            <p className="text-xs text-slate-500">Tecnico: {row.technicalStatus}</p>
          </li>
        ))}
      </ul>
      {!loading && !error && rows.length === 0 ? (
        <p className="text-sm text-slate-400">Nessuna Wikimedia da validare con questi filtri.</p>
      ) : null}
      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading || loadingMore}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-700 px-4 text-xs font-bold uppercase text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {loadingMore ? 'Lettura...' : 'Mostra altri'}
        </button>
      ) : null}
    </div>
  );
};

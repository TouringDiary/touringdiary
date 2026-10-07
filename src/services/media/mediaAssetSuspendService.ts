import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import { mf3MediaAssetsTable, mf3Rpc } from '@/services/media/mf3DbClient';
import { supabase } from '@/services/supabaseClient';

export type MediaAssetUsage = {
  assignmentId: string;
  entityType: string;
  entityLabel: string;
  cityName: string;
  role: string;
  assignmentStatus: string;
  isCurrent: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  poi: 'POI',
  city_person: 'Personaggio',
  patron: 'Santo Patrono',
  photo_submission: 'Community',
  city: 'Città',
};

async function namesById(
  table: 'pois' | 'city_people' | 'cities',
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id) => id.trim().length > 0))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { data, error } = await supabase.from(table).select('id, name').in('id', unique);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (!row || typeof row !== 'object') continue;
    const record = row as { id?: string; name?: string };
    if (typeof record.id === 'string' && typeof record.name === 'string') {
      names.set(record.id, record.name);
    }
  }
  return names;
}

export async function listMediaAssetUsages(mediaAssetId: string): Promise<MediaAssetUsage[]> {
  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, entity_type, entity_id, city_id, assignment_role, assignment_status, is_current')
    .eq('media_asset_id', mediaAssetId);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    city_id: string;
    assignment_role: string;
    assignment_status: string;
    is_current: boolean;
  }>;

  const poiIds = rows.filter((row) => row.entity_type === 'poi').map((row) => row.entity_id);
  const personIds = rows
    .filter((row) => row.entity_type === 'city_person')
    .map((row) => row.entity_id);
  const submissionIds = rows
    .filter((row) => row.entity_type === 'photo_submission')
    .map((row) => row.entity_id);
  const cityIds = rows.map((row) => row.city_id);
  const [poiNames, personNames, cityNames, submissionNames] = await Promise.all([
    namesById('pois', poiIds),
    namesById('city_people', personIds),
    namesById('cities', cityIds),
    submissionLabels(submissionIds),
  ]);

  return rows.map((row) => {
    const cityName = cityNames.get(row.city_id) ?? row.city_id;
    let entityLabel = row.entity_id;
    if (row.entity_type === 'poi') entityLabel = poiNames.get(row.entity_id) ?? entityLabel;
    if (row.entity_type === 'city_person') {
      entityLabel = personNames.get(row.entity_id) ?? entityLabel;
    }
    if (row.entity_type === 'patron') entityLabel = cityNames.get(row.city_id) ?? entityLabel;
    if (row.entity_type === 'photo_submission') {
      entityLabel = submissionNames.get(row.entity_id) ?? entityLabel;
    }
    return {
      assignmentId: row.id,
      entityType: TYPE_LABEL[row.entity_type] ?? row.entity_type,
      entityLabel,
      cityName,
      role: row.assignment_role,
      assignmentStatus: row.assignment_status,
      isCurrent: row.is_current,
    };
  });
}

async function submissionLabels(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id) => id.trim().length > 0))];
  const names = new Map<string, string>();
  if (unique.length === 0) return names;
  const { data, error } = await supabase
    .from('photo_submissions')
    .select('id, location_name')
    .in('id', unique);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (!row || typeof row !== 'object') continue;
    const record = row as { id?: string; location_name?: string };
    if (typeof record.id === 'string' && typeof record.location_name === 'string') {
      names.set(record.id, record.location_name);
    }
  }
  return names;
}

export async function findCurrentNonWikimediaAssetForPoi(
  poiId: string,
  cityId: string,
): Promise<{ assetId: string; adminBlocked: boolean } | null> {
  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, media_asset_id')
    .eq('entity_type', 'poi')
    .eq('entity_id', poiId)
    .eq('city_id', cityId)
    .eq('assignment_role', 'primary')
    .eq('is_current', true)
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => row.media_asset_id).filter((id) => id.length > 0);
  if (ids.length === 0) return null;
  const { data: assets, error: assetError } = await mf3MediaAssetsTable()
    .select('id, origin_type, admin_blocked')
    .in('id', ids);
  if (assetError) throw new Error(assetError.message);
  const nonWikimedia = new Map<string, boolean>();
  for (const row of assets ?? []) {
    const record = row as { id?: string; origin_type?: string; admin_blocked?: boolean };
    if (record.origin_type === 'wikimedia' || typeof record.id !== 'string') continue;
    nonWikimedia.set(record.id, record.admin_blocked === true);
  }
  const assetId = ids.find((id) => nonWikimedia.has(id));
  if (!assetId) return null;
  return { assetId, adminBlocked: nonWikimedia.get(assetId) === true };
}

export async function readMediaAssetAdminBlocked(mediaAssetId: string): Promise<boolean> {
  const { data, error } = await mf3MediaAssetsTable()
    .select('admin_blocked')
    .eq('id', mediaAssetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const record = data as { admin_blocked?: boolean } | null;
  return record?.admin_blocked === true;
}

export async function setMediaAssetAdminBlock(
  mediaAssetId: string,
  blocked: boolean,
  adminRationale: string,
): Promise<void> {
  const { error } = await mf3Rpc<boolean>('set_media_asset_admin_block', {
    p_media_asset_id: mediaAssetId,
    p_blocked: blocked,
    p_admin_rationale: adminRationale,
  });
  if (error) throw new Error(error.message);
}

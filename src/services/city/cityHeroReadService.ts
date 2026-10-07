import {
  type AssignmentStatusDb,
  isAssignmentStatusDb,
  parseImageAssetStatusDb,
} from '@/constants/governance';
import {
  type CityHeroAssignmentCandidate,
  type CityHeroResolutionContext,
  resolveCityHeroDisplayUrl,
} from '@/domain/city/resolveCityHeroDisplayUrl';
import { parseMediaAsset } from '@/services/city/parsers/media/parseMediaAsset';
import { entityImageAssignmentsQuery } from '@/services/media/entityImageAssignmentsQuery';
import {
  fetchMediaAssetsByIds,
  mediaAssetOriginForImageResolver,
} from '@/services/media/mediaAssetService';
import { getSetting, SETTINGS_KEYS } from '@/services/settingsService';
import { supabase } from '@/services/supabaseClient';
import type { CityDetails, CitySummary, MediaAsset } from '@/types/index';
import { buildPublicStorageUrl, samePublicStorageObject } from '@/utils/storagePathFromPublicUrl';

type CityHeroRow = {
  id: string;
  media_asset_id: string;
  assignment_status: AssignmentStatusDb;
  is_current: boolean;
};

function parseCityHeroAssignmentRow(raw: unknown): { cityId: string; row: CityHeroRow } | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const entityId = typeof record.entity_id === 'string' ? record.entity_id.trim() : '';
  const mediaAssetId =
    typeof record.media_asset_id === 'string' ? record.media_asset_id.trim() : '';
  if (!id || !entityId || !mediaAssetId) return null;
  const assignmentStatusRaw = record.assignment_status;
  if (typeof assignmentStatusRaw !== 'string' || !isAssignmentStatusDb(assignmentStatusRaw)) {
    return null;
  }
  if (record.is_current !== true) return null;
  return {
    cityId: entityId,
    row: {
      id,
      media_asset_id: mediaAssetId,
      assignment_status: assignmentStatusRaw,
      is_current: true,
    },
  };
}

async function loadCityHeroRowsByCityIds(cityIds: string[]): Promise<Map<string, CityHeroRow[]>> {
  const out = new Map<string, CityHeroRow[]>();
  const ids = [...new Set(cityIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return out;

  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, entity_id, media_asset_id, assignment_status, is_current')
    .eq('entity_type', 'city')
    .in('entity_id', ids)
    .in('city_id', ids)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .in('assignment_status', ['active', 'restored']);

  if (error) {
    throw new Error(`Lettura assignment City Hero fallita: ${error.message}`);
  }

  for (const raw of data ?? []) {
    const parsed = parseCityHeroAssignmentRow(raw);
    if (!parsed) continue;
    const list = out.get(parsed.cityId) ?? [];
    list.push(parsed.row);
    out.set(parsed.cityId, list);
  }
  return out;
}

/**
 * Tier ADMIN da `cities.hero_image` (D-CONS-25; Execution §40.5, §41.5, §42.3).
 * L'upload Admin scrive la colonna e `hero_status = real` e non crea un assignment:
 * il resolver deve leggere quel URL come livello ADMIN, insieme agli assignment gallery.
 * Non esiste un `media_asset`, quindi assignment_status, asset_status, admin_blocked
 * e isAssetEligibleForPublicUse non si applicano a questa colonna.
 * Se un assignment Admin ha già lo stesso URL, anche non pubblicabile, la colonna
 * non viene usata e resta il lifecycle del candidato.
 */
function adminColumnUrlWhenUnmatched(input: {
  adminHeroUrl: string;
  heroStatus: string | null | undefined;
  adminCandidates: CityHeroAssignmentCandidate[];
}): string | null {
  if (input.heroStatus !== 'real') return null;
  const raw = input.adminHeroUrl.trim();
  if (!raw) return null;
  const matched = input.adminCandidates.some((candidate) => {
    const url = candidate.publicUrl?.trim() ?? '';
    return url.length > 0 && (url === raw || samePublicStorageObject(url, raw));
  });
  if (matched) return null;
  return raw;
}

function buildHeroContextFromRows(input: {
  adminHeroUrl: string | null;
  heroStatus: string | null | undefined;
  wikimediaHeroPublicEnabled: boolean;
  rows: CityHeroRow[];
  assets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>;
  platformPlaceholderUrl: string | null;
}): CityHeroResolutionContext {
  const adminCandidates: CityHeroAssignmentCandidate[] = [];
  const wikimediaGalleryCandidates: CityHeroAssignmentCandidate[] = [];
  const communityCandidates: CityHeroAssignmentCandidate[] = [];
  const aiCandidates: CityHeroAssignmentCandidate[] = [];

  for (const row of input.rows) {
    const mediaAssetId = row.media_asset_id.trim();
    if (!mediaAssetId) continue;
    const asset = input.assets.get(mediaAssetId);
    if (!asset) continue;
    const originType = mediaAssetOriginForImageResolver(asset.origin_type);
    if (!originType) continue;
    const bucket = asset.storage_bucket.trim();
    const path = asset.storage_path.trim();
    if (!bucket || !path) continue;
    let assetStatus: CityHeroAssignmentCandidate['assetStatus'];
    try {
      assetStatus = parseImageAssetStatusDb(asset.asset_status);
    } catch {
      continue;
    }
    const publicUrl = buildPublicStorageUrl(bucket, path);
    if (publicUrl == null || publicUrl.trim().length === 0) continue;
    const origin = originType.trim().toLowerCase();

    if (origin === 'wikimedia' || origin === 'verified_real') {
      wikimediaGalleryCandidates.push({
        originType,
        isCurrent: row.is_current,
        assignmentStatus: row.assignment_status,
        assetStatus,
        wikimediaValidated: asset.wikimedia_validated,
        adminBlocked: asset.admin_blocked,
        publicUrl,
        stableId: row.id,
      });
      continue;
    }

    const candidate: CityHeroAssignmentCandidate = {
      originType,
      isCurrent: row.is_current,
      assignmentStatus: row.assignment_status,
      assetStatus,
      wikimediaValidated: asset.wikimedia_validated,
      adminBlocked: asset.admin_blocked,
      publicUrl,
      stableId: row.id,
    };

    if (origin === 'admin' || origin === 'admin_upload') {
      adminCandidates.push(candidate);
      continue;
    }

    if (origin === 'community') {
      communityCandidates.push(candidate);
      continue;
    }

    if (origin === 'ai' || origin === 'ai_generated') {
      aiCandidates.push(candidate);
    }
  }

  const rawAdminUrl = input.adminHeroUrl?.trim() ?? '';
  const matchedAdminCandidates = rawAdminUrl
    ? adminCandidates.filter((candidate) => {
        const url = candidate.publicUrl?.trim() ?? '';
        return url === rawAdminUrl || samePublicStorageObject(url, rawAdminUrl);
      })
    : [];
  matchedAdminCandidates.sort((a, b) => (a.stableId ?? '').localeCompare(b.stableId ?? ''));
  wikimediaGalleryCandidates.sort((a, b) => (a.stableId ?? '').localeCompare(b.stableId ?? ''));
  communityCandidates.sort((a, b) => (a.stableId ?? '').localeCompare(b.stableId ?? ''));
  aiCandidates.sort((a, b) => (a.stableId ?? '').localeCompare(b.stableId ?? ''));

  return {
    adminHeroUrl: input.adminHeroUrl,
    adminColumnUrl: adminColumnUrlWhenUnmatched({
      adminHeroUrl: rawAdminUrl,
      heroStatus: input.heroStatus,
      adminCandidates,
    }),
    wikimediaHeroPublicEnabled: input.wikimediaHeroPublicEnabled,
    adminCandidates: matchedAdminCandidates,
    wikimediaGalleryCandidates,
    communityCandidates,
    aiCandidates,
    platformPlaceholderUrl: input.platformPlaceholderUrl,
  };
}

async function loadPlatformHeroPlaceholderUrl(): Promise<string | null> {
  const value = await getSetting<unknown>(SETTINGS_KEYS.HERO_IMAGE);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Allinea heroAsset all'URL D-22 usando solo metadati già presenti sulla città (parseMediaAsset). */
function heroAssetAlignedWithUrl(input: {
  url: string | undefined;
  heroStatus: CitySummary['hero_status'];
  imageCredit: CitySummary['imageCredit'];
  imageLicense: CitySummary['imageLicense'];
  existing?: MediaAsset;
}): MediaAsset | undefined {
  const trimmed = input.url?.trim() ?? '';
  if (!trimmed) {
    return parseMediaAsset(undefined, input.heroStatus, input.imageCredit, input.imageLicense);
  }
  if (input.existing?.url === trimmed) {
    return input.existing;
  }
  return parseMediaAsset(trimmed, input.heroStatus, input.imageCredit, input.imageLicense);
}

export async function applyCityHeroD22ToSummaries(
  summaries: CitySummary[],
): Promise<CitySummary[]> {
  if (summaries.length === 0) return summaries;

  const cityIds = summaries.map((c) => c.id.trim()).filter(Boolean);
  const rowsByCity = await loadCityHeroRowsByCityIds(cityIds);

  const assetIds = new Set<string>();
  for (const rows of rowsByCity.values()) {
    for (const row of rows) {
      const id = row.media_asset_id.trim();
      if (id) assetIds.add(id);
    }
  }
  const assets = await fetchMediaAssetsByIds([...assetIds]);
  const platformPlaceholderUrl = await loadPlatformHeroPlaceholderUrl();

  return summaries.map((city) => {
    const cityId = city.id.trim();
    const adminRaw = city.heroImage?.trim() ?? '';
    const context = buildHeroContextFromRows({
      adminHeroUrl: adminRaw ? adminRaw : null,
      heroStatus: city.hero_status,
      wikimediaHeroPublicEnabled: city.wikimediaHeroPublicEnabled === true,
      rows: rowsByCity.get(cityId) ?? [],
      assets,
      platformPlaceholderUrl,
    });
    const { url } = resolveCityHeroDisplayUrl(context);
    const heroAsset = heroAssetAlignedWithUrl({
      url,
      heroStatus: city.hero_status,
      imageCredit: city.imageCredit,
      imageLicense: city.imageLicense,
      existing: city.heroAsset,
    });
    if (!url) {
      return { ...city, heroImage: undefined, heroAsset };
    }
    return { ...city, heroImage: url, heroAsset };
  });
}

export async function applyCityHeroD22ToDetails(city: CityDetails): Promise<CityDetails> {
  const cityId = city.id?.trim() ?? '';
  if (!cityId) return city;

  const { data: cityRow, error } = await supabase
    .from('cities')
    .select('wikimedia_hero_public_enabled, hero_image, hero_status')
    .eq('id', cityId)
    .maybeSingle();

  if (error) {
    throw new Error(`Lettura città per City Hero fallita: ${error.message}`);
  }

  const rowsByCity = await loadCityHeroRowsByCityIds([cityId]);
  const rows = rowsByCity.get(cityId) ?? [];
  const assetIds = [...new Set(rows.map((r) => r.media_asset_id.trim()).filter(Boolean))];
  const assets = await fetchMediaAssetsByIds(assetIds);
  const platformPlaceholderUrl = await loadPlatformHeroPlaceholderUrl();

  const adminHeroRaw = cityRow?.hero_image?.trim() ?? '';
  const context = buildHeroContextFromRows({
    adminHeroUrl: adminHeroRaw ? adminHeroRaw : null,
    heroStatus: cityRow?.hero_status,
    wikimediaHeroPublicEnabled: cityRow?.wikimedia_hero_public_enabled === true,
    rows,
    assets,
    platformPlaceholderUrl,
  });

  const { url } = resolveCityHeroDisplayUrl(context);
  const heroImage = url ?? '';

  const summaryHeroAsset = heroAssetAlignedWithUrl({
    url,
    heroStatus: city.hero_status,
    imageCredit: city.imageCredit,
    imageLicense: city.imageLicense,
    existing: city.heroAsset,
  });
  const detailsHeroAsset = heroAssetAlignedWithUrl({
    url: heroImage || undefined,
    heroStatus: city.details.hero_status ?? city.hero_status,
    imageCredit: city.imageCredit,
    imageLicense: city.imageLicense,
    existing: city.details.heroAsset,
  });

  return {
    ...city,
    heroImage: url,
    heroAsset: summaryHeroAsset,
    details: {
      ...city.details,
      heroImage,
      heroAsset: detailsHeroAsset,
    },
  };
}

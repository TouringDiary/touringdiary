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
import { supabase } from '@/services/supabaseClient';
import type { CityDetails, CitySummary, MediaAsset } from '@/types/index';
import { buildPublicStorageUrl } from '@/utils/storagePathFromPublicUrl';

type CityHeroRow = {
  id: string;
  media_asset_id: string;
  assignment_status: AssignmentStatusDb;
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
  return {
    cityId: entityId,
    row: {
      id,
      media_asset_id: mediaAssetId,
      assignment_status: assignmentStatusRaw,
    },
  };
}

async function loadCityHeroRowsByCityIds(cityIds: string[]): Promise<Map<string, CityHeroRow[]>> {
  const out = new Map<string, CityHeroRow[]>();
  const ids = [...new Set(cityIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return out;

  const { data, error } = await entityImageAssignmentsQuery()
    .select('id, entity_id, media_asset_id, assignment_status')
    .eq('entity_type', 'city')
    .in('entity_id', ids)
    .in('city_id', ids)
    .eq('assignment_role', 'gallery')
    .eq('is_current', true)
    .eq('assignment_status', 'active');

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

function buildHeroContextFromRows(input: {
  adminHeroUrl: string | null;
  wikimediaHeroPublicEnabled: boolean;
  rows: CityHeroRow[];
  assets: Awaited<ReturnType<typeof fetchMediaAssetsByIds>>;
}): CityHeroResolutionContext {
  const wikimediaGalleryCandidates: CityHeroAssignmentCandidate[] = [];
  const communityCandidates: { url: string; stableId: string }[] = [];
  const aiCandidates: { url: string; stableId: string }[] = [];

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
        isCurrent: true,
        assignmentStatus: row.assignment_status,
        assetStatus,
        publicUrl,
        stableId: row.id,
      });
      continue;
    }

    if (origin === 'community') {
      communityCandidates.push({ url: publicUrl, stableId: row.id });
      continue;
    }

    if (origin === 'ai' || origin === 'ai_generated') {
      aiCandidates.push({ url: publicUrl, stableId: row.id });
    }
  }

  wikimediaGalleryCandidates.sort((a, b) => (a.stableId ?? '').localeCompare(b.stableId ?? ''));
  communityCandidates.sort((a, b) => a.stableId.localeCompare(b.stableId));
  aiCandidates.sort((a, b) => a.stableId.localeCompare(b.stableId));

  return {
    adminHeroUrl: input.adminHeroUrl,
    wikimediaHeroPublicEnabled: input.wikimediaHeroPublicEnabled,
    wikimediaGalleryCandidates,
    communityHeroUrl: communityCandidates[0]?.url ?? null,
    aiHeroUrl: aiCandidates[0]?.url ?? null,
    platformPlaceholderUrl: null,
  };
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

  return summaries.map((city) => {
    const cityId = city.id.trim();
    const adminRaw = city.heroImage?.trim() ?? '';
    const context = buildHeroContextFromRows({
      adminHeroUrl: adminRaw ? adminRaw : null,
      wikimediaHeroPublicEnabled: city.wikimediaHeroPublicEnabled === true,
      rows: rowsByCity.get(cityId) ?? [],
      assets,
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
    .select('wikimedia_hero_public_enabled, hero_image')
    .eq('id', cityId)
    .maybeSingle();

  if (error) {
    throw new Error(`Lettura città per City Hero fallita: ${error.message}`);
  }

  const rowsByCity = await loadCityHeroRowsByCityIds([cityId]);
  const rows = rowsByCity.get(cityId) ?? [];
  const assetIds = [...new Set(rows.map((r) => r.media_asset_id.trim()).filter(Boolean))];
  const assets = await fetchMediaAssetsByIds(assetIds);

  const adminHeroRaw = cityRow?.hero_image?.trim() ?? '';
  const context = buildHeroContextFromRows({
    adminHeroUrl: adminHeroRaw ? adminHeroRaw : null,
    wikimediaHeroPublicEnabled: cityRow?.wikimedia_hero_public_enabled === true,
    rows,
    assets,
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

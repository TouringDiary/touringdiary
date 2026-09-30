/**
 * poiWrite.ts
 *
 * RESPONSABILITÀ: Persistenza di PointOfInterest verso Supabase.
 *
 * POST-MF5 / FASE 1 (DEC-P10): save D90 server-side — `save_poi_with_image_assignment`
 * (pois + primary assignment/revoke in transazione). `image_url` nel payload RPC è null;
 * la colonna legacy può restare in DB fino a FASE 2 decommission.
 */

import type { PoiCategory, PointOfInterest } from '../../../types/index';
import type { User } from '../../../types/users';
import type { PoiUpsertPayload } from '../../../types/write';
import {
  serializeAffiliateLinks,
  serializeLinkMetadataRecord,
  serializeOpeningHours,
} from '../../../utils/jsonSerialization';
import { sanitizeMediaStatus } from '../../../utils/media';
import { parseStorageLocationFromPublicUrl } from '../../../utils/storagePathFromPublicUrl';
import { mf2Rpc } from '../../reports/mf2DbClient';
import { clearCacheKey, invalidateCityCache } from '../cityCache';
import { evaluateAndUpdateCityStatus } from '../cityUpdateService';

const SAVE_POI_WITH_IMAGE_RPC = 'save_poi_with_image_assignment';
/** RPC introdotta in 20260923153000; firma con p_skip_primary_image_update in 20260928210000. */
const SAVE_POI_WITH_IMAGE_MIGRATION =
  '20260923153000_poi_d90_save_with_image_assignment.sql, poi 20260928210000_save_poi_skip_primary_image_update.sql';
const DELETE_POI_WITH_IMAGE_RPC = 'delete_poi_with_image_cleanup';
const DELETE_POI_WITH_IMAGE_MIGRATION = '20260923153000_poi_d90_save_with_image_assignment.sql';

function isSavePoiWithImageRpcMissing(error: { code?: string; message?: string }): boolean {
  if (error.code !== 'PGRST202') return false;
  const message = error.message ?? '';
  return message.includes(SAVE_POI_WITH_IMAGE_RPC);
}

function isDeletePoiWithImageRpcMissing(error: { code?: string; message?: string }): boolean {
  if (error.code !== 'PGRST202') return false;
  const message = error.message ?? '';
  return message.includes(DELETE_POI_WITH_IMAGE_RPC);
}

const POI_SAVE_ALLOWED_CATEGORIES: readonly PoiCategory[] = [
  'monument',
  'food',
  'hotel',
  'nature',
  'discovery',
  'leisure',
  'shop',
] as const;

function isPoiCategoryValue(cat: string): cat is PoiCategory {
  return (POI_SAVE_ALLOWED_CATEGORIES as readonly string[]).includes(cat);
}

function isHttpImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Primary Admin: path canonico oppure URL HTTP esterno (Link URL Admin).
 * Esclude path/URL che corrispondono a namespace non-Admin (wikimedia, verified, …).
 */
function isAdminPrimaryImageSource(imageUrl: string, storagePath: string): boolean {
  const trimmedUrl = imageUrl.trim();
  const trimmedPath = storagePath.trim();
  if (trimmedPath.length > 0) {
    return isCanonicalAdminPoiStoragePath(trimmedPath);
  }
  if (trimmedUrl.length === 0 || !isHttpImageUrl(trimmedUrl)) {
    return false;
  }
  const parsed = parseStorageLocationFromPublicUrl(trimmedUrl);
  if (parsed?.storagePath) {
    return isCanonicalAdminPoiStoragePath(parsed.storagePath);
  }
  return true;
}

/** Path Storage riservato agli upload Admin (AdminImageInput → admin_uploads). */
function isCanonicalAdminPoiStoragePath(storagePath: string): boolean {
  const trimmed = storagePath.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('verified/') || trimmed.startsWith('wikimedia/')) return false;
  const root = trimmed.split('/')[0] ?? '';
  return root === 'admin_uploads' || root === 'admin_assets';
}

/** Come trattare la primary MF4 in save_poi_with_image_assignment (D90). */
export type SaveSinglePoiPrimaryImageMode =
  /** Salva solo dati POI; non revocare né sostituire assignment esistente. */
  | 'preserve_assignment'
  /** Revoca primary se non si materializza un nuovo upload Admin (bulk reset / clear esplicito). */
  | 'revoke_if_cleared'
  /** Materializza primary Admin solo se imageUrl punta a path admin_uploads/admin_assets. */
  | 'materialize_admin_if_present';

export type SaveSinglePoiOptions = {
  primaryImage?: SaveSinglePoiPrimaryImageMode;
};

export const saveSinglePoi = async (
  poi: PointOfInterest,
  cityId: string,
  currentUser?: User,
  options?: SaveSinglePoiOptions,
): Promise<void> => {
  const realId =
    poi.id && !poi.id.startsWith('temp_')
      ? poi.id
      : `poi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const now = new Date().toISOString();
  const authorName = currentUser?.name || 'Sistema';

  const categoryLower = (poi.category || 'monument').toLowerCase().trim();
  const safeCategory: PoiCategory = isPoiCategoryValue(categoryLower) ? categoryLower : 'discovery';

  const lat = poi.coords?.lat;
  const lng = poi.coords?.lng;
  const hasValidCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const payload: PoiUpsertPayload = {
    id: realId,
    name: poi.name || 'Senza Nome',
    city_id: cityId,
    category: safeCategory,
    sub_category: poi.subCategory ?? null,
    description: poi.description || '',
    address: poi.address ?? null,
    image_url: '',
    image_status: sanitizeMediaStatus(poi.image_status),
    image_credit: poi.imageCredit ?? null,
    image_license: poi.imageLicense ?? null,
    coords_lat: hasValidCoords ? lat : null,
    coords_lng: hasValidCoords ? lng : null,
    rating: poi.rating ?? 0,
    votes: poi.votes ?? 0,
    status: poi.status || 'published',
    visit_duration: poi.visitDuration ?? null,
    price_level: poi.priceLevel ?? null,
    is_sponsored: poi.isSponsored ?? false,
    tier: poi.tier ?? null,
    showcase_expiry: poi.showcaseExpiry ?? null,
    ai_reliability: poi.aiReliability ?? null,
    tourism_interest: poi.tourismInterest ?? null,
    last_verified: poi.lastVerified ?? null,
    opening_hours: serializeOpeningHours(poi.openingHours),
    affiliate: serializeAffiliateLinks(poi.affiliate),
    link_metadata: serializeLinkMetadataRecord(poi.linkMetadata),
    date_added: poi.dateAdded || now,
    created_at: poi.createdAt || now,
    created_by: poi.createdBy || authorName,
    updated_at: now,
    updated_by: authorName,
  };

  const imageUrl = poi.imageUrl?.trim() ?? '';
  const parsedStorage = imageUrl.length > 0 ? parseStorageLocationFromPublicUrl(imageUrl) : null;
  const storagePath = parsedStorage?.storagePath?.trim() ?? '';
  const primaryImageMode: SaveSinglePoiPrimaryImageMode =
    options?.primaryImage ?? 'materialize_admin_if_present';

  const revokePrimaryOnClear = primaryImageMode === 'revoke_if_cleared';
  const preservePrimaryAssignment = primaryImageMode === 'preserve_assignment';

  const shouldMaterializePrimary =
    !preservePrimaryAssignment &&
    imageUrl.length > 0 &&
    isAdminPrimaryImageSource(imageUrl, storagePath);

  const adminPrimaryUsesStoragePath =
    shouldMaterializePrimary &&
    storagePath.length > 0 &&
    isCanonicalAdminPoiStoragePath(storagePath);

  /** Editorial / D-22: skip esplicito o assenza materialize/revoke intenzionale. */
  const skipPrimaryImageUpdate =
    preservePrimaryAssignment || (!shouldMaterializePrimary && !revokePrimaryOnClear);

  const rpcImageUrl = shouldMaterializePrimary ? imageUrl : null;

  const { error } = await mf2Rpc<string>(SAVE_POI_WITH_IMAGE_RPC, {
    p_poi: payload,
    p_image_url: rpcImageUrl,
    p_storage_bucket: adminPrimaryUsesStoragePath ? (parsedStorage?.storageBucket ?? null) : null,
    p_storage_path: adminPrimaryUsesStoragePath ? storagePath : null,
    p_origin_type: shouldMaterializePrimary ? 'admin' : null,
    p_skip_primary_image_update: skipPrimaryImageUpdate,
  });

  if (error) {
    if (isSavePoiWithImageRpcMissing(error)) {
      throw new Error(
        `[saveSinglePoi] RPC ${SAVE_POI_WITH_IMAGE_RPC} assente. Applicare migration ${SAVE_POI_WITH_IMAGE_MIGRATION}.`,
      );
    }
    throw error;
  }

  invalidateCityCache(cityId);
  clearCacheKey(`pois_multi_`);

  const onCreateIdPrefixes = ['temp_', 'draft_', 'audit_', 'top_tier_'] as const;
  const shouldRunOnCreateDiscovery =
    !poi.id?.trim() ||
    onCreateIdPrefixes.some(
      (prefix) => realId.startsWith(prefix) || (poi.id ?? '').startsWith(prefix),
    );
  if (shouldRunOnCreateDiscovery) {
    const { schedulePoiRealImageDiscovery } = await import(
      '../../poi/poiRealImageDiscoveryService'
    );
    schedulePoiRealImageDiscovery(realId, cityId, 'on_create', poi.name);
  }

  evaluateAndUpdateCityStatus(cityId).catch((err) =>
    console.error(`Errore ricalcolo stato città ${cityId}:`, err),
  );
};

export const deleteSinglePoi = async (poiId: string): Promise<void> => {
  const trimmedId = poiId.trim();
  if (trimmedId.length === 0) {
    throw new Error('deleteSinglePoi: id POI obbligatorio.');
  }

  const { data: cityId, error } = await mf2Rpc<string>(DELETE_POI_WITH_IMAGE_RPC, {
    p_poi_id: trimmedId,
  });

  if (error) {
    if (isDeletePoiWithImageRpcMissing(error)) {
      throw new Error(
        `[deleteSinglePoi] RPC ${DELETE_POI_WITH_IMAGE_RPC} assente. Applicare migration ${DELETE_POI_WITH_IMAGE_MIGRATION}.`,
      );
    }
    throw error;
  }

  clearCacheKey(`city_details_`);
  clearCacheKey(`pois_multi_`);

  if (typeof cityId === 'string' && cityId.length > 0) {
    evaluateAndUpdateCityStatus(cityId).catch((err) =>
      console.error(`Errore ricalcolo stato città ${cityId}:`, err),
    );
  }
};

const ADJUST_POI_VOTE_RPC = 'adjust_poi_vote';

export const votePoiAsync = async (poiId: string, increment: boolean): Promise<number> => {
  const trimmedId = poiId.trim();
  if (!trimmedId) {
    throw new Error('votePoiAsync: id POI obbligatorio.');
  }
  const delta = increment ? 1 : -1;
  const { data, error } = await mf2Rpc<number>(ADJUST_POI_VOTE_RPC, {
    p_poi_id: trimmedId,
    p_delta: delta,
  });
  if (error) {
    throw new Error(`votePoiAsync: ${error.message}`);
  }
  if (typeof data !== 'number' || !Number.isFinite(data)) {
    throw new Error('votePoiAsync: risposta RPC non valida.');
  }
  return data;
};

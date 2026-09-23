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
import { supabase } from '../../supabaseClient';
import { clearCacheKey, invalidateCityCache } from '../cityCache';
import { evaluateAndUpdateCityStatus } from '../cityUpdateService';

const SAVE_POI_WITH_IMAGE_RPC = 'save_poi_with_image_assignment';
const SAVE_POI_WITH_IMAGE_MIGRATION = '20260923153000_poi_d90_save_with_image_assignment.sql';
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

export const saveSinglePoi = async (
  poi: PointOfInterest,
  cityId: string,
  currentUser?: User,
): Promise<void> => {
  invalidateCityCache(cityId);
  clearCacheKey(`pois_multi_`);

  const realId =
    poi.id && !poi.id.startsWith('temp_')
      ? poi.id
      : `poi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const now = new Date().toISOString();
  const authorName = currentUser?.name || 'Sistema';

  const categoryLower = (poi.category || 'monument').toLowerCase().trim();
  const allowedCats: PoiCategory[] = [
    'monument',
    'food',
    'hotel',
    'nature',
    'discovery',
    'leisure',
    'shop',
  ];
  const isPoiCategory = (cat: string): cat is PoiCategory =>
    (allowedCats as string[]).includes(cat);

  const safeCategory: PoiCategory = isPoiCategory(categoryLower) ? categoryLower : 'discovery';

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
    coords_lat: poi.coords?.lat ?? 0,
    coords_lng: poi.coords?.lng ?? 0,
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

  const { error } = await mf2Rpc<string>(SAVE_POI_WITH_IMAGE_RPC, {
    p_poi: payload,
    p_image_url:
      imageUrl.length > 0 && (parsedStorage?.storagePath || imageUrl.startsWith('http'))
        ? imageUrl
        : null,
    p_storage_bucket: parsedStorage?.storageBucket ?? null,
    p_storage_path: parsedStorage?.storagePath ?? null,
    p_origin_type: 'admin',
  });

  if (error) {
    if (isSavePoiWithImageRpcMissing(error)) {
      throw new Error(
        `[saveSinglePoi] RPC ${SAVE_POI_WITH_IMAGE_RPC} assente. Applicare migration ${SAVE_POI_WITH_IMAGE_MIGRATION}.`,
      );
    }
    throw error;
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

  clearCacheKey(`city_details_`);
  clearCacheKey(`pois_multi_`);

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

  if (typeof cityId === 'string' && cityId.length > 0) {
    evaluateAndUpdateCityStatus(cityId).catch((err) =>
      console.error(`Errore ricalcolo stato città ${cityId}:`, err),
    );
  }
};

export const votePoiAsync = async (poiId: string, increment: boolean): Promise<number> => {
  const { data: poi } = await supabase.from('pois').select('votes').eq('id', poiId).maybeSingle();
  const newVotes = Math.max(0, (poi?.votes || 0) + (increment ? 1 : -1));
  await supabase.from('pois').update({ votes: newVotes }).eq('id', poiId);
  return newVotes;
};

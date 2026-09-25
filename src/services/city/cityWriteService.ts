/**
 * cityWriteService.ts
 *
 * Persistenza CityDetails verso Supabase via admin API (service role server-side).
 * Nessuna write client-side diretta sulla tabella `cities`.
 */

import type { CityDetails } from '../../types/index';
import { parseStorageLocationFromPublicUrl } from '../../utils/storagePathFromPublicUrl';
import { supabase } from '../supabaseClient';
import { callCityAdminApi } from './cityAdminApi';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { reclaimOrphanedItems } from './cityLifecycleService';
import { buildCityWritePayload } from './cityPayloadMapper';
import { resolvePatronPrimaryOriginTypeForCitySave } from './patronPrimaryImageWriteHelpers';

export { buildCityWritePayload } from './cityPayloadMapper';

async function upsertPatronPrimaryImageAssignment(
  cityId: string,
  imageUrl: string,
  originType: ReturnType<typeof resolvePatronPrimaryOriginTypeForCitySave>,
): Promise<void> {
  const parsedStorage = parseStorageLocationFromPublicUrl(imageUrl);
  const client = supabase as unknown as {
    rpc: (
      fn: 'upsert_patron_primary_image_assignment',
      args: Record<string, string | null>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>;
  };

  const { error } = await client.rpc('upsert_patron_primary_image_assignment', {
    p_city_id: cityId,
    p_image_url: imageUrl,
    p_storage_bucket: parsedStorage?.storageBucket ?? null,
    p_storage_path: parsedStorage?.storagePath ?? null,
    p_origin_type: originType,
  });
  if (error) {
    throw new Error(`Assignment Patrono primary fallito: ${error.message}`);
  }
}

/** Revoca atomica primary Patrono (assignment + history) — RPC POST-MF5. */
async function revokePatronPrimaryAssignment(cityId: string): Promise<void> {
  const client = supabase as unknown as {
    rpc: (
      fn: 'revoke_patron_primary_image_assignment',
      args: { p_city_id: string },
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { error } = await client.rpc('revoke_patron_primary_image_assignment', {
    p_city_id: cityId,
  });
  if (error) {
    throw new Error(`Revoca assignment Patrono primary fallita: ${error.message}`);
  }
}

export const saveCityDetails = async (
  city: CityDetails,
  options: { skipReclaim?: boolean } = {},
): Promise<void> => {
  invalidateCityCache(city.id);
  clearCacheKey('manifest');

  const payload = buildCityWritePayload(city);

  await callCityAdminApi<{ id: string; updated_at: string }>(
    `/cities/${encodeURIComponent(city.id)}/details`,
    'PATCH',
    payload,
  );

  const patronImageUrl = city.details.patronDetails?.imageUrl?.trim() ?? '';
  try {
    if (patronImageUrl.length > 0) {
      await upsertPatronPrimaryImageAssignment(
        city.id,
        patronImageUrl,
        resolvePatronPrimaryOriginTypeForCitySave(city.details.patronDetails),
      );
    } else {
      await revokePatronPrimaryAssignment(city.id);
    }
  } catch (patronImageErr) {
    console.error(
      '[saveCityDetails] Salvataggio città riuscito; assignment immagine Patrono primary fallito:',
      patronImageErr,
    );
  }

  if (city.id && city.name && !options.skipReclaim) {
    void reclaimOrphanedItems(city.id, city.name).catch((err: unknown) => {
      console.warn('[saveCityDetails] reclaimOrphanedItems failed:', err);
    });
  }
};

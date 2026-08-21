/**
 * cityWriteService.ts
 *
 * Persistenza CityDetails verso Supabase via admin API (service role server-side).
 * Nessuna write client-side diretta sulla tabella `cities`.
 */

import type { CityDetails } from '../../types/index';
import { callCityAdminApi } from './cityAdminApi';
import { clearCacheKey, invalidateCityCache } from './cityCache';
import { reclaimOrphanedItems } from './cityLifecycleService';
import { buildCityWritePayload } from './cityPayloadMapper';

export { buildCityWritePayload } from './cityPayloadMapper';

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

  if (city.id && city.name && !options.skipReclaim) {
    void reclaimOrphanedItems(city.id, city.name).catch((err: unknown) => {
      console.warn('[saveCityDetails] reclaimOrphanedItems failed:', err);
    });
  }
};

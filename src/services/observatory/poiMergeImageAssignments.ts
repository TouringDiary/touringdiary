import { mf4Rpc } from '@/services/media/mf4DbClient';
import type { PointOfInterest } from '@/types/index';

/**
 * POST-MF5 D90 — RPC atomica: trasferimento primary (priorità origin), revoca assignment victim,
 * history append-only e DELETE del POI victim (no DELETE media_assets).
 */
export async function reconcilePoiImageAssignmentsBeforeVictimDelete(
  survivor: PointOfInterest,
  victim: PointOfInterest,
): Promise<void> {
  const survivorCityId = survivor.cityId?.trim() ?? '';
  const victimCityId = victim.cityId?.trim() ?? '';
  const survivorId = survivor.id?.trim() ?? '';
  const victimId = victim.id?.trim() ?? '';
  if (!survivorId || !victimId || !survivorCityId || !victimCityId) {
    throw new Error(
      'Riconciliazione immagini POI merge: survivor/victim id e city_id obbligatori prima del delete del victim.',
    );
  }

  const { error } = await mf4Rpc<null>('reconcile_poi_image_assignments_for_merge', {
    p_survivor_id: survivorId,
    p_survivor_city_id: survivorCityId,
    p_victim_id: victimId,
    p_victim_city_id: victimCityId,
  });

  if (error) {
    throw new Error(`Riconciliazione immagini POI merge fallita: ${error.message}`);
  }
}

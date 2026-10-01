import { supabase } from '@/services/supabaseClient';

export async function updatePoiWikimediaPublicEnabled(
  poiId: string,
  cityId: string,
  enabled: boolean,
): Promise<void> {
  const trimmedPoiId = poiId.trim();
  const trimmedCityId = cityId.trim();
  if (!trimmedPoiId || !trimmedCityId) {
    throw new Error('poiId e cityId obbligatori per aggiornare il toggle Wikimedia POI.');
  }

  const { error } = await supabase.rpc('set_poi_wikimedia_public_enabled', {
    p_poi_id: trimmedPoiId,
    p_city_id: trimmedCityId,
    p_enabled: enabled,
  });

  if (error) {
    throw new Error(error.message);
  }
}

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

  const { data, error } = await supabase
    .from('pois')
    .update({ wikimedia_public_enabled: enabled })
    .eq('id', trimmedPoiId)
    .eq('city_id', trimmedCityId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error('Aggiornamento toggle Wikimedia POI: POI non trovato o non autorizzato.');
  }
}

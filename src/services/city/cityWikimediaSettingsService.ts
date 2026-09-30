import { supabase } from '@/services/supabaseClient';

export async function updateCityWikimediaHeroPublicEnabled(
  cityId: string,
  enabled: boolean,
): Promise<void> {
  const trimmedId = cityId.trim();
  if (!trimmedId) {
    throw new Error('cityId obbligatorio per aggiornare il toggle Wikimedia Hero.');
  }

  const { data, error } = await supabase
    .from('cities')
    .update({ wikimedia_hero_public_enabled: enabled })
    .eq('id', trimmedId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error('Aggiornamento toggle Wikimedia Hero: città non trovata o non autorizzata.');
  }
}

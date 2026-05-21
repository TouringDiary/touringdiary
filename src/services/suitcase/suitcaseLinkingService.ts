import { supabase } from '../supabaseClient';

/**
 * Recupera tutte le valigie collegate a un itinerario.
 */
export const fetchLinkedSuitcaseIdsAsync = async (itineraryId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('suitcase_id')
    .eq('itinerary_id', itineraryId);

  if (error) throw error;
  return (data?.map(d => d.suitcase_id) || []) as string[];
};

/**
 * Collega una valigia ad un itinerario.
 */
export const linkSuitcaseToTripAsync = async (
  itineraryId: string,
  suitcaseId: string,
  userId?: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('itinerary_suitcases')
    .upsert({ 
      itinerary_id: itineraryId, 
      suitcase_id: suitcaseId,
      user_id: userId || null
    }, { onConflict: 'itinerary_id,suitcase_id' });

  if (error) throw error;
};

/**
 * Scollega una valigia da un itinerario.
 */
export const unlinkSuitcaseAsync = async (itineraryId: string, suitcaseId: string): Promise<void> => {
  const { error } = await supabase
    .from('itinerary_suitcases')
    .delete()
    .eq('itinerary_id', itineraryId)
    .eq('suitcase_id', suitcaseId);

  if (error) throw error;
};

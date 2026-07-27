import { supabase } from '../supabaseClient';
import { linkSuitcaseToViaggio } from '../viaggio/viaggioSuitcaseService';

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
 * Dual-write STEP-3: se il Diario ha viaggio_id, collega anche a viaggio_suitcases.
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

  let viaggioIdForLog: string | null = null;
  try {
    const { data: diary } = await supabase
      .from('itineraries')
      .select('viaggio_id')
      .eq('id', itineraryId)
      .maybeSingle();
    viaggioIdForLog = diary?.viaggio_id ?? null;
    if (viaggioIdForLog) {
      await linkSuitcaseToViaggio(viaggioIdForLog, suitcaseId, userId);
    }
  } catch (e) {
    console.warn('[suitcaseLinkingService] dual-write viaggio_suitcases non riuscito', {
      operation: 'linkSuitcaseToViaggio',
      itineraryId,
      suitcaseId,
      viaggioId: viaggioIdForLog,
      error: e,
    });
  }
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

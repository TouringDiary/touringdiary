import { supabase } from '../supabaseClient';
import { mapDiaryRowFromDb } from '../viaggio/viaggioDiaryService';
import type { Itinerary } from '../../types/index';

/**
 * Diari collegati a una valigia tramite pivot `itinerary_suitcases`.
 */
export async function listDiariesBySuitcaseId(suitcaseId: string): Promise<Itinerary[]> {
  const { data: links, error: linkErr } = await supabase
    .from('itinerary_suitcases')
    .select('itinerary_id')
    .eq('suitcase_id', suitcaseId);

  if (linkErr) {
    console.error('[suitcaseDiaryReadService] listDiariesBySuitcaseId links:', linkErr.message);
    return [];
  }

  const diaryIds = [...new Set((links ?? []).map((r) => r.itinerary_id).filter(Boolean))];
  if (diaryIds.length === 0) return [];

  const { data, error } = await supabase.from('itineraries').select('*').in('id', diaryIds);

  if (error) {
    console.error('[suitcaseDiaryReadService] listDiariesBySuitcaseId:', error.message);
    return [];
  }

  return (data ?? []).map(mapDiaryRowFromDb);
}

import { supabase } from '../supabaseClient';
import type { Suitcase } from '../../types/suitcase';
import { fetchSuitcasesByIdsAsync } from '../suitcase/suitcaseCoreService';

/** ID valigie collegate al Viaggio (SoT STEP-3). */
export async function listSuitcaseIdsByViaggio(viaggioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('viaggio_suitcases')
    .select('suitcase_id')
    .eq('viaggio_id', viaggioId);

  if (error) throw error;
  return (data?.map((d) => d.suitcase_id) || []) as string[];
}

/** Valigie del Viaggio (0..N). */
export async function listSuitcasesByViaggio(viaggioId: string): Promise<Suitcase[]> {
  const ids = await listSuitcaseIdsByViaggio(viaggioId);
  if (ids.length === 0) return [];
  return fetchSuitcasesByIdsAsync(ids);
}

export async function linkSuitcaseToViaggio(
  viaggioId: string,
  suitcaseId: string,
  userId?: string | null,
): Promise<void> {
  const { error } = await supabase.from('viaggio_suitcases').upsert(
    {
      viaggio_id: viaggioId,
      suitcase_id: suitcaseId,
      user_id: userId || null,
    },
    { onConflict: 'viaggio_id,suitcase_id' },
  );
  if (error) throw error;
}

export async function unlinkSuitcaseFromViaggio(
  viaggioId: string,
  suitcaseId: string,
): Promise<void> {
  const { error } = await supabase
    .from('viaggio_suitcases')
    .delete()
    .eq('viaggio_id', viaggioId)
    .eq('suitcase_id', suitcaseId);
  if (error) throw error;
}

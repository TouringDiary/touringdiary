import { supabase } from '../supabaseClient';
import type { Suitcase } from '../../types/suitcase';
import { fetchSuitcasesByIdsAsync } from '../suitcase/suitcaseCoreService';
import { listDiariesByViaggio } from './viaggioDiaryService';

/** ID valigie collegate al Viaggio (SoT STEP-3). */
export async function listSuitcaseIdsByViaggio(viaggioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('viaggio_suitcases')
    .select('suitcase_id')
    .eq('viaggio_id', viaggioId);

  if (error) throw error;
  return (data?.map((d) => d.suitcase_id) || []) as string[];
}

/**
 * ID valigie associate ai Diari del Viaggio (`itinerary_suitcases`).
 * Associazioni già esistenti — nessun nuovo dominio.
 */
export async function listSuitcaseIdsFromViaggioDiaries(viaggioId: string): Promise<string[]> {
  const diaries = await listDiariesByViaggio(viaggioId);
  const diaryIds = diaries.map((d) => d.id);
  if (diaryIds.length === 0) return [];

  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('suitcase_id')
    .in('itinerary_id', diaryIds);

  if (error) throw error;
  return (data?.map((d) => d.suitcase_id) || []) as string[];
}

/**
 * Valigie del Viaggio: unione di `viaggio_suitcases` + valigie già collegate ai Diari.
 * Nessun heal automatico verso `viaggio_suitcases` (WF-13: multi-link / heal senza copia vietati).
 */
export async function listSuitcasesByViaggio(viaggioId: string): Promise<Suitcase[]> {
  const [fromViaggio, fromDiaries] = await Promise.all([
    listSuitcaseIdsByViaggio(viaggioId),
    listSuitcaseIdsFromViaggioDiaries(viaggioId),
  ]);
  const ids = [...new Set([...fromViaggio, ...fromDiaries])];
  if (ids.length === 0) return [];

  return fetchSuitcasesByIdsAsync(ids);
}

/**
 * Collega una Valigia a un Viaggio.
 * Enforcement applicativo: rifiuta se la stessa Valigia è già su un altro Viaggio
 * (DOC 31 / DOC 35 — una Valigia ↔ un Viaggio; per conflitto usare linkSuitcaseToViaggioSafe).
 */
export async function linkSuitcaseToViaggio(
  viaggioId: string,
  suitcaseId: string,
  userId?: string | null,
): Promise<void> {
  const { data: existing, error: readErr } = await supabase
    .from('viaggio_suitcases')
    .select('viaggio_id')
    .eq('suitcase_id', suitcaseId);

  if (readErr) throw readErr;

  const onOther = (existing ?? []).some((r) => r.viaggio_id !== viaggioId);
  if (onOther) {
    throw new Error(
      '[viaggioSuitcaseService] Valigia già associata ad un altro Viaggio. Usare copia (linkSuitcaseToViaggioSafe).',
    );
  }

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

/**
 * Scollega dal Viaggio e dai Diari del Viaggio (stesse associazioni esistenti).
 * La valigia non viene eliminata. Nessun import da suitcaseLinkingService (anti-ciclo).
 */
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

  try {
    const diaries = await listDiariesByViaggio(viaggioId);
    const diaryIds = diaries.map((d) => d.id);
    if (diaryIds.length === 0) return;
    const { error: diaryErr } = await supabase
      .from('itinerary_suitcases')
      .delete()
      .eq('suitcase_id', suitcaseId)
      .in('itinerary_id', diaryIds);
    if (diaryErr) throw diaryErr;
  } catch (e) {
    console.warn('[viaggioSuitcaseService] unlink from diaries failed', {
      viaggioId,
      suitcaseId,
      error: e,
    });
  }
}

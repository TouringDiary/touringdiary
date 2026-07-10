import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind } from '@/domain/collaboration';
import { resolveSuitcaseSharedResourceKind } from '@/collaboration/suitcaseResourceKind';

export interface SuitcaseGraphRow {
  id: string;
  title: string | null;
  is_user_template: boolean | null;
  user_id: string | null;
  source_template_id: string | null;
}

export interface DiaryGraphRow {
  id: string;
  title: string | null;
}

export async function fetchDiaryTitlesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('itineraries')
    .select('id, title')
    .in('id', ids);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchDiaryTitlesByIds:', error.message);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row) => [row.id, row.title?.trim() || 'Diario'])
  );
}

export async function fetchSuitcaseRowsByIds(ids: string[]): Promise<SuitcaseGraphRow[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('suitcases')
    .select('id, title, is_user_template, user_id, source_template_id')
    .in('id', ids);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchSuitcaseRowsByIds:', error.message);
    return [];
  }

  return data ?? [];
}

export async function fetchLinkedSuitcaseIdsForDiary(diaryId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('suitcase_id')
    .eq('itinerary_id', diaryId);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchLinkedSuitcaseIdsForDiary:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.suitcase_id).filter(Boolean) as string[];
}

export async function fetchDiaryIdsForSuitcase(suitcaseId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('itinerary_id')
    .eq('suitcase_id', suitcaseId);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchDiaryIdsForSuitcase:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.itinerary_id).filter(Boolean) as string[];
}

export async function fetchDiaryIdsForSuitcases(suitcaseIds: string[]): Promise<string[]> {
  if (suitcaseIds.length === 0) return [];

  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('itinerary_id')
    .in('suitcase_id', suitcaseIds);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchDiaryIdsForSuitcases:', error.message);
    return [];
  }

  const unique = new Set<string>();
  for (const row of data ?? []) {
    if (row.itinerary_id) unique.add(row.itinerary_id);
  }
  return [...unique];
}

/** Valigie operative derivate da un Template User (source_template_id). */
export async function fetchOperationalSuitcaseIdsForTemplate(
  templateId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('suitcases')
    .select('id, is_user_template, user_id')
    .eq('source_template_id', templateId);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchOperationalSuitcaseIdsForTemplate:', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => resolveSuitcaseSharedResourceKind(row) === 'suitcase')
    .map((row) => row.id);
}

export function classifySuitcaseRow(
  row: SuitcaseGraphRow
): SharedResourceKind | null {
  return resolveSuitcaseSharedResourceKind(row);
}

export async function fetchUserTemplateRow(
  templateId: string
): Promise<SuitcaseGraphRow | null> {
  const rows = await fetchSuitcaseRowsByIds([templateId]);
  const row = rows[0];
  if (!row || classifySuitcaseRow(row) !== 'user_template') return null;
  return row;
}

export async function fetchDiaryRow(diaryId: string): Promise<DiaryGraphRow | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('id, title')
    .eq('id', diaryId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('[workspaceCompositionGraph] fetchDiaryRow:', error.message);
    }
    return null;
  }

  return data;
}

/** Pivot diary↔suitcase per un insieme di coppie note. */
export async function fetchDiarySuitcasePairsForDiary(
  diaryId: string
): Promise<Array<{ diaryId: string; suitcaseId: string }>> {
  const suitcaseIds = await fetchLinkedSuitcaseIdsForDiary(diaryId);
  return suitcaseIds.map((suitcaseId) => ({ diaryId, suitcaseId }));
}

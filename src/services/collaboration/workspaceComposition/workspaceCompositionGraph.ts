/**
 * Query layer per la composizione Workspace.
 *
 * Tre gruppi di responsabilità (stesso file, nessun layer aggiuntivo):
 * - **Shared** — tipi e helper riusati da seed graph e catalogo
 * - **Seed Graph** — espansione blueprint da risorsa origine (`resolveWorkspaceCompositionBlueprint`)
 * - **Catalog** — inventario personale completo (`resolveWorkspaceCompositionCatalog`)
 */

import { resolveSuitcaseSharedResourceKind } from '@/collaboration/suitcaseResourceKind';
import type { SharedResourceKind } from '@/domain/collaboration';
import { supabase } from '@/services/supabaseClient';

// -----------------------------------------------------------------------------
// Shared — tipi
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Shared — query e classificazione
// -----------------------------------------------------------------------------

export async function fetchDiaryTitlesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.from('itineraries').select('id, title').in('id', ids);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchDiaryTitlesByIds:', error.message);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.id, row.title?.trim() || 'Diario']));
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

export function classifySuitcaseRow(row: SuitcaseGraphRow): SharedResourceKind | null {
  return resolveSuitcaseSharedResourceKind({
    user_id: row.user_id,
    is_user_template: row.is_user_template ?? false,
  });
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

// -----------------------------------------------------------------------------
// Seed Graph — espansione da seed (wizard Condividi)
// -----------------------------------------------------------------------------

/** Valigie operative derivate da un Template User (source_template_id). */
export async function fetchOperationalSuitcaseIdsForTemplate(
  templateId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('suitcases')
    .select('id, is_user_template, user_id')
    .eq('source_template_id', templateId);

  if (error) {
    console.error(
      '[workspaceCompositionGraph] fetchOperationalSuitcaseIdsForTemplate:',
      error.message,
    );
    return [];
  }

  return (data ?? [])
    .filter(
      (row) =>
        resolveSuitcaseSharedResourceKind({
          user_id: row.user_id,
          is_user_template: row.is_user_template ?? false,
        }) === 'suitcase',
    )
    .map((row) => row.id);
}

export async function fetchUserTemplateRow(templateId: string): Promise<SuitcaseGraphRow | null> {
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
  diaryId: string,
): Promise<Array<{ diaryId: string; suitcaseId: string }>> {
  const suitcaseIds = await fetchLinkedSuitcaseIdsForDiary(diaryId);
  return suitcaseIds.map((suitcaseId) => ({ diaryId, suitcaseId }));
}

// -----------------------------------------------------------------------------
// Catalog — inventario personale (wizard Crea Workspace)
// -----------------------------------------------------------------------------

export interface DiaryCatalogRow {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SuitcaseCatalogRow extends SuitcaseGraphRow {
  created_at: string | null;
  updated_at: string | null;
}

/** Diari personali di proprietà (inventario catalogo create Workspace). */
export async function fetchOwnedPersonalDiariesForCatalog(
  userId: string,
): Promise<DiaryCatalogRow[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('itineraries')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .eq('type', 'personal')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(
      '[workspaceCompositionGraph] fetchOwnedPersonalDiariesForCatalog:',
      error.message,
    );
    return [];
  }

  return data ?? [];
}

/** Valigie operative di proprietà (esclude template user). */
export async function fetchOwnedOperationalSuitcasesForCatalog(
  userId: string,
): Promise<SuitcaseCatalogRow[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('suitcases')
    .select('id, title, is_user_template, user_id, source_template_id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_user_template', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(
      '[workspaceCompositionGraph] fetchOwnedOperationalSuitcasesForCatalog:',
      error.message,
    );
    return [];
  }

  return data ?? [];
}

/** Template user di proprietà. */
export async function fetchOwnedUserTemplatesForCatalog(
  userId: string,
): Promise<SuitcaseCatalogRow[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('suitcases')
    .select('id, title, is_user_template, user_id, source_template_id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_user_template', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[workspaceCompositionGraph] fetchOwnedUserTemplatesForCatalog:', error.message);
    return [];
  }

  return data ?? [];
}

/** Pivot diary↔suitcase per più diari (archi catalogo). */
export async function fetchDiarySuitcasePairsForDiaryIds(
  diaryIds: string[],
): Promise<Array<{ diaryId: string; suitcaseId: string }>> {
  if (diaryIds.length === 0) return [];

  const { data, error } = await supabase
    .from('itinerary_suitcases')
    .select('itinerary_id, suitcase_id')
    .in('itinerary_id', diaryIds);

  if (error) {
    console.error('[workspaceCompositionGraph] fetchDiarySuitcasePairsForDiaryIds:', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.itinerary_id && row.suitcase_id)
    .map((row) => ({
      diaryId: row.itinerary_id as string,
      suitcaseId: row.suitcase_id as string,
    }));
}

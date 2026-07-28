import { supabase } from '../supabaseClient';
import type { Itinerary } from '../../types/index';
import { setActiveDiary } from './viaggioService';

export type PersistedItinerary = Itinerary & { id: string };

function mapDiaryRow(db: {
  id: string;
  user_id: string | null;
  title: string | null;
  duration_days: number | null;
  items_json: unknown;
  created_at: string | null;
  updated_at: string | null;
  suitcase_id: string | null;
  last_modified_by?: string | null;
  viaggio_id?: string | null;
}): PersistedItinerary {
  const raw = db.items_json;
  let items: Itinerary['items'] = [];
  let startDate: string | null = null;
  let endDate: string | null = null;
  let dayStyles: Record<number, string> | undefined;
  let roadbook: Itinerary['roadbook'];
  let diaryNotes: Itinerary['diaryNotes'];

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const data = raw as Record<string, unknown>;
    if (Array.isArray(data.items)) items = data.items as Itinerary['items'];
    if (typeof data.startDate === 'string') startDate = data.startDate;
    if (typeof data.endDate === 'string') endDate = data.endDate;
    if (data.dayStyles && typeof data.dayStyles === 'object' && !Array.isArray(data.dayStyles)) {
      dayStyles = data.dayStyles as Record<number, string>;
    }
    if (Array.isArray(data.roadbook)) roadbook = data.roadbook as Itinerary['roadbook'];
    if (data.diaryNotes != null) diaryNotes = data.diaryNotes as Itinerary['diaryNotes'];
  } else if (Array.isArray(raw)) {
    items = raw as Itinerary['items'];
  }

  return {
    id: db.id,
    userId: db.user_id ?? undefined,
    viaggioId: db.viaggio_id ?? null,
    name: db.title ?? '',
    startDate,
    endDate,
    items,
    createdAt: db.created_at ? new Date(db.created_at).getTime() : Date.now(),
    updatedAt: db.updated_at ? new Date(db.updated_at).getTime() : undefined,
    lastModifiedBy: db.last_modified_by ?? undefined,
    dayStyles,
    diaryNotes,
    roadbook,
    suitcase_id: db.suitcase_id,
  };
}

export { mapDiaryRow as mapDiaryRowFromDb };

/** Elenca i Diari personali di un Viaggio (0..N). */
export async function listDiariesByViaggio(viaggioId: string): Promise<PersistedItinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .eq('type', 'personal')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDiaryRow);
}

/** Elenca i Diari personali per più Viaggi (1 query). */
export async function listDiariesByViaggioIds(viaggioIds: string[]): Promise<PersistedItinerary[]> {
  const unique = [...new Set(viaggioIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .in('viaggio_id', unique)
    .eq('type', 'personal')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDiaryRow);
}

/** Un Diario personale del Viaggio, o null se assente / non appartenente. */
export async function getDiaryOfViaggio(
  viaggioId: string,
  diaryId: string,
): Promise<PersistedItinerary | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', diaryId)
    .eq('viaggio_id', viaggioId)
    .eq('type', 'personal')
    .maybeSingle();

  if (error) throw error;
  return data ? mapDiaryRow(data) : null;
}

export async function setViaggioActiveDiary(
  viaggioId: string,
  diaryId: string,
): Promise<void> {
  await setActiveDiary(viaggioId, diaryId);
}

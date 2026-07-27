import { supabase } from '../supabaseClient';
import type { Itinerary } from '../../types/index';
import type { Json } from '../../types/supabase';
import { setActiveDiary, getViaggio } from './viaggioService';

const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? null));

/** Giorni di durata dal periodo Viaggio; fallback minimo = 1 se non ricavabile. */
function durationDaysFromViaggioPeriod(
  periodStart: string | null,
  periodEnd: string | null,
): number {
  if (periodStart && periodEnd) {
    const start = Date.parse(periodStart);
    const end = Date.parse(periodEnd);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      return Math.floor((end - start) / 86_400_000) + 1;
    }
  }
  return 1;
}

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
}): Itinerary {
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

/** Elenca i Diari personali di un Viaggio (0..N). */
export async function listDiariesByViaggio(viaggioId: string): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .eq('type', 'personal')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDiaryRow);
}

/** Un Diario personale del Viaggio, o null se assente / non appartenente. */
export async function getDiaryOfViaggio(
  viaggioId: string,
  diaryId: string,
): Promise<Itinerary | null> {
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

/**
 * Crea un Diario vuoto già collegato al Viaggio.
 * Se non c’è Diario attivo, imposta questo come attivo (non è auto-promote su delete).
 */
export async function createEmptyDiaryForViaggio(params: {
  viaggioId: string;
  userId: string;
  title?: string;
}): Promise<Itinerary> {
  const viaggio = await getViaggio(params.viaggioId);
  if (!viaggio) throw new Error('[viaggioDiaryService] Viaggio non trovato');
  if (viaggio.userId !== params.userId) {
    throw new Error('[viaggioDiaryService] Viaggio non appartenente all’utente');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const title = (params.title || 'Nuovo diario').trim() || 'Nuovo diario';
  const packed = {
    items: [],
    startDate: viaggio.periodStart,
    endDate: viaggio.periodEnd,
  };
  const durationDays = durationDaysFromViaggioPeriod(viaggio.periodStart, viaggio.periodEnd);
  const mainCity = viaggio.destination?.trim() || null;

  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      id,
      user_id: params.userId,
      title,
      description: 'Bozza',
      duration_days: durationDays,
      type: 'personal',
      status: 'draft',
      items_json: toDbJson(packed),
      main_city: mainCity,
      viaggio_id: params.viaggioId,
      created_at: now,
      updated_at: now,
      last_modified_by: params.userId,
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioDiaryService] createEmptyDiaryForViaggio: nessuna riga');

  if (viaggio.activeDiaryId == null) {
    await setActiveDiary(params.viaggioId, id);
  }

  return mapDiaryRow(data);
}

export async function setViaggioActiveDiary(
  viaggioId: string,
  diaryId: string,
): Promise<void> {
  await setActiveDiary(viaggioId, diaryId);
}

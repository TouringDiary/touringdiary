import { supabase } from '../supabaseClient';
import type { Json } from '../../types/supabase';
import type { RoadbookDay } from '../../types/models/Itinerary';
import type { ViaggioRoadbookArtifact } from '../../types/models/ViaggioRoadbookArtifact';
import { generateRoadbook } from '../ai/aiPlanner';
import { getCityNameById } from '../geoRegistryService';
import { getViaggio } from './viaggioService';
import { getDiaryOfViaggio } from './viaggioDiaryService';
import type { ItineraryItem } from '../../types/models/Itinerary';

const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? []));

function mapRow(db: {
  id: string;
  viaggio_id: string;
  source_diary_id: string;
  user_id: string;
  name: string;
  snapshot: unknown;
  created_at: string;
}): ViaggioRoadbookArtifact {
  const snapshot = Array.isArray(db.snapshot) ? (db.snapshot as RoadbookDay[]) : [];
  return {
    id: db.id,
    viaggioId: db.viaggio_id,
    sourceDiaryId: db.source_diary_id,
    userId: db.user_id,
    name: db.name,
    snapshot,
    createdAt: db.created_at,
  };
}

export async function listRoadbookArtifactsByViaggio(
  viaggioId: string,
): Promise<ViaggioRoadbookArtifact[]> {
  const { data, error } = await supabase
    .from('viaggio_roadbook_artifacts')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getRoadbookArtifact(
  artifactId: string,
): Promise<ViaggioRoadbookArtifact | null> {
  const { data, error } = await supabase
    .from('viaggio_roadbook_artifacts')
    .select('*')
    .eq('id', artifactId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

/**
 * Genera un artifact immutabile da un Diario del Viaggio.
 * Preferisce snapshot del roadbook già presente sul Diario; altrimenti chiama AI.
 * Non muta il Diario.
 */
export async function createRoadbookArtifactFromDiary(params: {
  viaggioId: string;
  diaryId: string;
  userId: string;
  name?: string;
  /** Se true, forza generazione AI anche se il Diario ha già un roadbook. */
  forceGenerate?: boolean;
}): Promise<ViaggioRoadbookArtifact> {
  const viaggio = await getViaggio(params.viaggioId);
  if (!viaggio) throw new Error('[viaggioRoadbookService] Viaggio non trovato');

  const diary = await getDiaryOfViaggio(params.viaggioId, params.diaryId);
  if (!diary) {
    throw new Error('[viaggioRoadbookService] Diario non appartenente al Viaggio');
  }

  let snapshot: RoadbookDay[] = [];
  if (!params.forceGenerate && diary.roadbook && diary.roadbook.length > 0) {
    snapshot = diary.roadbook;
  } else if (diary.items.length === 0) {
    snapshot = [];
  } else {
    // generateRoadbook richiede il nome città (non cityId).
    let cityName = viaggio.destination?.trim() || '';
    if (!cityName) {
      const cityId = diary.items[0]?.cityId;
      if (cityId) {
        cityName = (await getCityNameById(cityId))?.trim() || '';
      }
    }
    if (!cityName) {
      throw new Error(
        '[viaggioRoadbookService] Nome città non disponibile (Viaggio.destination o città del Diario)',
      );
    }
    snapshot = await generateRoadbook(diary.items as ItineraryItem[], cityName);
  }

  const name =
    (params.name || '').trim() ||
    `Roadbook — ${diary.name || 'Diario'} — ${new Date().toLocaleDateString('it-IT')}`;

  const { data, error } = await supabase
    .from('viaggio_roadbook_artifacts')
    .insert({
      viaggio_id: params.viaggioId,
      source_diary_id: params.diaryId,
      user_id: params.userId,
      name,
      snapshot: toDbJson(snapshot),
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioRoadbookService] insert fallito');
  return mapRow(data);
}

/** Persistenza diretta di uno snapshot già noto (test / import). Immutabile dopo insert. */
export async function insertRoadbookArtifactSnapshot(params: {
  viaggioId: string;
  diaryId: string;
  userId: string;
  name: string;
  snapshot: RoadbookDay[];
}): Promise<ViaggioRoadbookArtifact> {
  const { data, error } = await supabase
    .from('viaggio_roadbook_artifacts')
    .insert({
      viaggio_id: params.viaggioId,
      source_diary_id: params.diaryId,
      user_id: params.userId,
      name: params.name,
      snapshot: toDbJson(params.snapshot),
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioRoadbookService] insert snapshot fallito');
  return mapRow(data);
}

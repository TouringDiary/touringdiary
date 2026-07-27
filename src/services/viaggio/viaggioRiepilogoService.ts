import { supabase, type Json } from '../supabaseClient';
import type { Viaggio } from '@/types/models/Viaggio';
import type {
  ViaggioRiepilogoAnnotations,
  ViaggioRiepilogoComputed,
  ViaggioRiepilogoDayAnnotations,
  ViaggioRiepilogoGeneralAnnotations,
} from '@/types/models/ViaggioRiepilogo';
import { getViaggio } from './viaggioService';
import { listDiariesByViaggio } from './viaggioDiaryService';
import { listRicordiDayNotesByViaggio, listRicordiMediaByViaggio } from './viaggioRicordiService';
import { listViaggioAttachments } from './viaggioAttachmentService';
import { listViaggioMapPins } from './viaggioMappaService';

const DAY_MS = 86_400_000;

/** Costruisce un oggetto Json senza serializzazione (stesso approccio di reviewService.criteriaToJson). */
function generalToJson(value: ViaggioRiepilogoGeneralAnnotations): Json {
  const out: { [key: string]: Json | undefined } = {};
  if (value.preferredPlace !== undefined) out.preferredPlace = value.preferredPlace;
  if (value.notes !== undefined) out.notes = value.notes;
  return out;
}

function byDayToJson(value: Record<string, ViaggioRiepilogoDayAnnotations>): Json {
  const out: { [key: string]: Json | undefined } = {};
  for (const [key, day] of Object.entries(value)) {
    const dayOut: { [key: string]: Json | undefined } = {};
    if (day.notes !== undefined) dayOut.notes = day.notes;
    out[key] = dayOut;
  }
  return out;
}

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asGeneral(raw: Json): ViaggioRiepilogoGeneralAnnotations {
  if (!isJsonObject(raw)) return {};
  const preferredPlace = raw.preferredPlace;
  const notes = raw.notes;
  return {
    preferredPlace: typeof preferredPlace === 'string' ? preferredPlace : undefined,
    notes: typeof notes === 'string' ? notes : undefined,
  };
}

function asByDay(raw: Json): Record<string, ViaggioRiepilogoDayAnnotations> {
  if (!isJsonObject(raw)) return {};
  const out: Record<string, ViaggioRiepilogoDayAnnotations> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || !isJsonObject(value)) continue;
    const notes = value.notes;
    out[key] = { notes: typeof notes === 'string' ? notes : undefined };
  }
  return out;
}

function periodDayCount(viaggio: Viaggio): number | null {
  if (!viaggio.periodStart || !viaggio.periodEnd) return null;
  const start = Date.parse(viaggio.periodStart);
  const end = Date.parse(viaggio.periodEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / DAY_MS) + 1;
}

/**
 * Aggregato calcolato della View Riepilogo (DOC 37 §10) — non persistito come Resource.
 */
export async function computeViaggioRiepilogo(viaggioId: string): Promise<ViaggioRiepilogoComputed | null> {
  const viaggio = await getViaggio(viaggioId);
  if (!viaggio) return null;

  const [diaries, media, notes, attachments, pins] = await Promise.all([
    listDiariesByViaggio(viaggioId),
    listRicordiMediaByViaggio(viaggioId),
    listRicordiDayNotesByViaggio(viaggioId),
    listViaggioAttachments(viaggioId),
    listViaggioMapPins(viaggioId),
  ]);

  const cityIds = new Set<string>();
  const categories = new Set<string>();
  let poiCount = 0;
  for (const diary of diaries) {
    for (const item of diary.items ?? []) {
      if (item.type === 'memo') continue;
      poiCount += 1;
      if (item.cityId) cityIds.add(item.cityId);
      if (item.poi?.category) categories.add(String(item.poi.category));
    }
  }

  return {
    title: viaggio.title,
    destination: viaggio.destination,
    periodStart: viaggio.periodStart,
    periodEnd: viaggio.periodEnd,
    diaryCount: diaries.length,
    activeDiaryId: viaggio.activeDiaryId,
    poiCount,
    cityIds: [...cityIds],
    categories: [...categories],
    ricordiMediaCount: media.length,
    ricordiNoteCount: notes.filter((n) => n.body.trim().length > 0).length,
    attachmentCount: attachments.length,
    mapPinCount: pins.length,
    periodDayCount: periodDayCount(viaggio),
  };
}

export async function getViaggioRiepilogoAnnotations(
  viaggioId: string,
): Promise<ViaggioRiepilogoAnnotations | null> {
  const { data, error } = await supabase
    .from('viaggio_riepilogo_annotations')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .maybeSingle();

  if (error) {
    console.error('[viaggioRiepilogoService] get:', error.message);
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    viaggioId: data.viaggio_id,
    userId: data.user_id,
    general: asGeneral(data.general),
    byDay: asByDay(data.by_day),
    updatedAt: data.updated_at,
  };
}

export async function upsertViaggioRiepilogoAnnotations(params: {
  viaggioId: string;
  userId: string;
  general: ViaggioRiepilogoGeneralAnnotations;
  byDay: Record<string, ViaggioRiepilogoDayAnnotations>;
}): Promise<ViaggioRiepilogoAnnotations> {
  const { data, error } = await supabase
    .from('viaggio_riepilogo_annotations')
    .upsert(
      {
        viaggio_id: params.viaggioId,
        user_id: params.userId,
        general: generalToJson(params.general),
        by_day: byDayToJson(params.byDay),
      },
      { onConflict: 'viaggio_id' },
    )
    .select('*')
    .single();

  if (error || !data) {
    console.error('[viaggioRiepilogoService] upsert:', error?.message);
    throw new Error(error?.message ?? 'Salvataggio annotazioni Riepilogo non riuscito.');
  }
  return {
    viaggioId: data.viaggio_id,
    userId: data.user_id,
    general: asGeneral(data.general),
    byDay: asByDay(data.by_day),
    updatedAt: data.updated_at,
  };
}

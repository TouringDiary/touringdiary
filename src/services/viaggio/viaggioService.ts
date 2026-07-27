import { supabase } from '../supabaseClient';
import type { Json } from '../../types/supabase';
import type { CreateViaggioInput, UpdateViaggioInput, Viaggio } from '../../types/models/Viaggio';
import { mapDbViaggioToRuntime } from './viaggioMappers';

export { mapDbViaggioToRuntime } from './viaggioMappers';

const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? {}));

/** Crea un Viaggio senza Diario attivo (empty ammesso). */
export async function createViaggio(input: CreateViaggioInput): Promise<Viaggio> {
  const title = (input.title || '').trim() || 'Viaggio';
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('viaggi')
    .insert({
      user_id: input.userId,
      title,
      destination: input.destination ?? null,
      period_start: input.periodStart ?? null,
      period_end: input.periodEnd ?? null,
      cover_image: input.coverImage ?? null,
      active_diary_id: null,
      metadata: toDbJson(input.metadata ?? {}),
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioService] createViaggio: nessuna riga restituita');
  return mapDbViaggioToRuntime(data);
}

/** Empty Viaggio persistito (0 diari, active_diary_id NULL). */
export async function createEmptyViaggio(userId: string, title = 'Viaggio'): Promise<Viaggio> {
  return createViaggio({ userId, title });
}

export async function getViaggio(viaggioId: string): Promise<Viaggio | null> {
  const { data, error } = await supabase
    .from('viaggi')
    .select('*')
    .eq('id', viaggioId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDbViaggioToRuntime(data) : null;
}

export async function listViaggiByUser(userId: string): Promise<Viaggio[]> {
  const { data, error } = await supabase
    .from('viaggi')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbViaggioToRuntime);
}

export async function updateViaggio(viaggioId: string, patch: UpdateViaggioInput): Promise<Viaggio> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) payload.title = (patch.title || '').trim() || 'Viaggio';
  if (patch.destination !== undefined) payload.destination = patch.destination;
  if (patch.periodStart !== undefined) payload.period_start = patch.periodStart;
  if (patch.periodEnd !== undefined) payload.period_end = patch.periodEnd;
  if (patch.coverImage !== undefined) payload.cover_image = patch.coverImage;
  if (patch.metadata !== undefined) payload.metadata = toDbJson(patch.metadata);

  const { data, error } = await supabase
    .from('viaggi')
    .update(payload)
    .eq('id', viaggioId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioService] updateViaggio: nessuna riga restituita');
  return mapDbViaggioToRuntime(data);
}

export async function deleteViaggio(viaggioId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('viaggi')
    .delete({ count: 'exact' })
    .eq('id', viaggioId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Imposta il Diario attivo. Il Diario deve già avere viaggio_id = viaggioId (trigger DB).
 * Nessuna auto-promozione altrove.
 */
export async function setActiveDiary(viaggioId: string, diaryId: string): Promise<Viaggio> {
  const { data, error } = await supabase
    .from('viaggi')
    .update({
      active_diary_id: diaryId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viaggioId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioService] setActiveDiary: nessuna riga restituita');
  return mapDbViaggioToRuntime(data);
}

/** Clear Diario attivo — nessun altro Diario viene promosso. */
export async function clearActiveDiary(viaggioId: string): Promise<Viaggio> {
  const { data, error } = await supabase
    .from('viaggi')
    .update({
      active_diary_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viaggioId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioService] clearActiveDiary: nessuna riga restituita');
  return mapDbViaggioToRuntime(data);
}

/**
 * Garantisce un Viaggio per un Diario personale owner.
 * Ordine sicuro rispetto al trigger active_diary: crea con active NULL, poi il caller
 * collega itineraries.viaggio_id, poi può chiamare setActiveDiary.
 */
export async function ensureViaggioForPersonalDiary(params: {
  userId: string;
  diaryId: string | null;
  existingViaggioId?: string | null;
  title: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  coverImage?: string | null;
}): Promise<{ viaggioId: string; created: boolean }> {
  if (params.existingViaggioId) {
    return { viaggioId: params.existingViaggioId, created: false };
  }

  if (params.diaryId) {
    const { data: existing, error } = await supabase
      .from('itineraries')
      .select('viaggio_id')
      .eq('id', params.diaryId)
      .maybeSingle();
    if (error) throw error;
    if (existing?.viaggio_id) {
      return { viaggioId: existing.viaggio_id, created: false };
    }
  }

  const viaggio = await createViaggio({
    userId: params.userId,
    title: params.title,
    periodStart: params.periodStart ?? null,
    periodEnd: params.periodEnd ?? null,
    coverImage: params.coverImage ?? null,
  });

  return { viaggioId: viaggio.id, created: true };
}

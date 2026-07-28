import { supabase } from '../supabaseClient';
import type { Json } from '../../types/supabase';
import type { CreateViaggioInput, UpdateViaggioInput, Viaggio } from '../../types/models/Viaggio';
import {
  computeRicordamiNextAt,
  computeRicordamiNextYearlyAt,
  DEFAULT_VIAGGIO_RICORDAMI_CONFIG,
  getViaggioRicordamiConfig,
  normalizeRicordamiIntervalMonths,
  RICORDAMI_DEFAULT_INTERVAL_MONTHS,
  withViaggioRicordamiConfig,
} from '../../types/models/Viaggio';
import { mapDbViaggioToRuntime } from './viaggioMappers';

export { mapDbViaggioToRuntime } from './viaggioMappers';

const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? {}));

export type ListViaggiSort = 'updated_at' | 'created_at' | 'title';

/** Crea un Viaggio senza Diario attivo (empty ammesso). */
export async function createViaggio(input: CreateViaggioInput): Promise<Viaggio> {
  const title = (input.title || '').trim() || 'Viaggio';
  const now = new Date();
  const nowIso = now.toISOString();
  const ricordamiEnabled = input.ricordamiEnabled ?? true;
  const rawInterval = input.ricordamiIntervalMonths ?? RICORDAMI_DEFAULT_INTERVAL_MONTHS;
  const interval = normalizeRicordamiIntervalMonths(rawInterval);
  const nextAt = ricordamiEnabled
    ? computeRicordamiNextAt(now, interval)
    : null;
  const metadata = withViaggioRicordamiConfig(
    input.metadata ?? {},
    DEFAULT_VIAGGIO_RICORDAMI_CONFIG,
  );

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
      ricordami_enabled: ricordamiEnabled,
      ricordami_interval_months: interval,
      ricordami_next_at: nextAt,
      metadata: toDbJson(metadata),
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new Error('[viaggioService] createViaggio: nessuna riga restituita');
  return mapDbViaggioToRuntime(data);
}

/** Empty Viaggio persistito (0 diari, active_diary_id NULL). */
export async function createEmptyViaggio(
  userId: string,
  title = 'Viaggio',
  options?: { ricordamiEnabled?: boolean },
): Promise<Viaggio> {
  return createViaggio({
    userId,
    title,
    ricordamiEnabled: options?.ricordamiEnabled,
  });
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

export async function listViaggiByUser(
  userId: string,
  sort: ListViaggiSort = 'updated_at',
): Promise<Viaggio[]> {
  let query = supabase.from('viaggi').select('*').eq('user_id', userId);

  if (sort === 'title') {
    query = query.order('title', { ascending: true });
  } else if (sort === 'created_at') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapDbViaggioToRuntime);
}

export async function updateViaggio(viaggioId: string, patch: UpdateViaggioInput): Promise<Viaggio> {
  const current = await getViaggio(viaggioId);
  if (!current) {
    throw new Error('[viaggioService] updateViaggio: viaggio non trovato');
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  let nextMetadata = patch.metadata ?? current.metadata;
  let nextRicordamiConfig = getViaggioRicordamiConfig(nextMetadata);
  if (patch.title !== undefined) payload.title = (patch.title || '').trim() || 'Viaggio';
  if (patch.destination !== undefined) payload.destination = patch.destination;
  if (patch.periodStart !== undefined) payload.period_start = patch.periodStart;
  if (patch.periodEnd !== undefined) payload.period_end = patch.periodEnd;
  if (patch.coverImage !== undefined) payload.cover_image = patch.coverImage;
  if (patch.ricordamiEnabled !== undefined) payload.ricordami_enabled = patch.ricordamiEnabled;
  let normalizedInterval: number | undefined;
  if (patch.ricordamiIntervalMonths !== undefined) {
    normalizedInterval = normalizeRicordamiIntervalMonths(patch.ricordamiIntervalMonths);
    payload.ricordami_interval_months = normalizedInterval;
  }
  if (patch.ricordamiNextAt !== undefined) payload.ricordami_next_at = patch.ricordamiNextAt;
  if (patch.metadata !== undefined) {
    nextMetadata = patch.metadata;
    nextRicordamiConfig = getViaggioRicordamiConfig(nextMetadata);
  }

  // Autosave Ricordami: se si riaccende senza next_at, schedula da ora.
  if (patch.ricordamiEnabled === true && patch.ricordamiNextAt === undefined) {
    const currentNextAtMs = current.ricordamiNextAt
      ? new Date(current.ricordamiNextAt).getTime()
      : Number.NaN;
    const hasValidFutureNextAt =
      Number.isFinite(currentNextAtMs) && currentNextAtMs > Date.now();

    if (!hasValidFutureNextAt) {
      const now = new Date();
      if (nextRicordamiConfig.mode === 'interval') {
        const months =
          normalizedInterval ??
          normalizeRicordamiIntervalMonths(current.ricordamiIntervalMonths);
        payload.ricordami_next_at = computeRicordamiNextAt(now, months);
      } else if (nextRicordamiConfig.mode === 'yearly_date') {
        payload.ricordami_next_at = computeRicordamiNextYearlyAt(
          now,
          nextRicordamiConfig.yearlyDay,
          nextRicordamiConfig.yearlyMonth,
        );
      }
    }
  }
  if (patch.ricordamiEnabled === false) {
    payload.ricordami_next_at = null;
  }
  if (
    patch.ricordamiIntervalMonths !== undefined &&
    patch.ricordamiEnabled !== false &&
    patch.ricordamiNextAt === undefined
  ) {
    if (nextRicordamiConfig.mode === 'interval') {
      payload.ricordami_next_at = computeRicordamiNextAt(
        new Date(),
        normalizedInterval ?? RICORDAMI_DEFAULT_INTERVAL_MONTHS,
      );
    }
  }

  payload.metadata = toDbJson(
    withViaggioRicordamiConfig(nextMetadata, nextRicordamiConfig),
  );

  if (
    nextRicordamiConfig.mode === 'custom_date' &&
    patch.ricordamiNextAt === undefined &&
    patch.ricordamiEnabled !== false
  ) {
    if (nextRicordamiConfig.customDateIso) {
      const customDateMs = new Date(nextRicordamiConfig.customDateIso).getTime();
      payload.ricordami_next_at =
        Number.isNaN(customDateMs) || customDateMs <= Date.now()
          ? null
          : nextRicordamiConfig.customDateIso;
    } else {
      payload.ricordami_next_at = null;
    }
  }

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

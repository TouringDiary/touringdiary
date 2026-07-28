import { supabase } from '../supabaseClient';
import type { Itinerary } from '../../types/index';
import type { Json } from '../../types/supabase';
import type {
  CreateDiaryInput,
  CreateSuitcaseInput,
  DiaryAssociationConflict,
  SaveAsViaggioOptions,
  SuitcaseLinkConflict,
} from '../../types/resourceAssociation';
import { SuitcaseLinkConflictError, ResourceAssociationError } from '../../types/resourceAssociation';
import { createViaggio, setActiveDiary, getViaggio } from './viaggioService';
import {
  mapDiaryRowFromDb,
  type PersistedItinerary,
} from './viaggioDiaryService';
import { linkSuitcaseToViaggio } from './viaggioSuitcaseService';
import { duplicatePersonalDiary } from '../collaboration/personalShareService';
import { duplicateSuitcaseEntityAsync } from '../suitcase/suitcaseTemplateService';
import { createSuitcaseAsync, deleteSuitcaseAsync } from '../suitcase/suitcaseCoreService';
import { deleteUserDraft, getUserDrafts } from '../community/itineraryService';

const toDbJson = (value: unknown): Json => JSON.parse(JSON.stringify(value ?? null));

function durationDaysFromPeriod(startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
    return Math.floor((end - start) / 86_400_000) + 1;
  }
  return 1;
}

async function resolveViaggioIdForCreate(
  input: Pick<
    CreateDiaryInput | CreateSuitcaseInput,
    'userId' | 'viaggioChoice' | 'existingViaggioId' | 'fixedViaggioId'
  > & { title: string; periodStart?: string | null; periodEnd?: string | null },
): Promise<string | null> {
  if (input.fixedViaggioId) {
    const viaggio = await getViaggio(input.fixedViaggioId);
    if (!viaggio || viaggio.userId !== input.userId) {
      throw new ResourceAssociationError(
        '[resourceAssociation] Viaggio non trovato o non appartenente all’utente',
      );
    }
    return input.fixedViaggioId;
  }

  if (input.viaggioChoice === 'none') return null;

  if (input.viaggioChoice === 'existing') {
    const id = input.existingViaggioId?.trim();
    if (!id) throw new ResourceAssociationError('[resourceAssociation] Seleziona un Viaggio.');
    const viaggio = await getViaggio(id);
    if (!viaggio || viaggio.userId !== input.userId) {
      throw new ResourceAssociationError('[resourceAssociation] Viaggio selezionato non valido.');
    }
    return id;
  }

  // Opzione C: nuovo Viaggio. periodStart/periodEnd sono opzionali di proposito:
  // - Diario: tipicamente valorizzati dalle date del Diario;
  // - Valigia: non ha periodo proprio; il Viaggio può nascere senza date (null).
  // Non interpretare l’assenza di periodo come errore di dominio.
  const created = await createViaggio({
    userId: input.userId,
    title: input.title,
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
  });
  return created.id;
}

/** Tutti i diari personali dell’utente (catalogo Strumenti). */
export async function listAllPersonalDiaries(userId: string): Promise<Itinerary[]> {
  return getUserDrafts(userId);
}

/** Diari associabili a un Viaggio (senza viaggio o già su quel viaggio). */
export async function listDiariesAssociableToViaggio(
  userId: string,
  viaggioId: string,
): Promise<PersistedItinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'personal')
    .or(`viaggio_id.is.null,viaggio_id.eq.${viaggioId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDiaryRowFromDb);
}

export async function getDiaryAssociationConflict(
  diaryId: string,
  targetViaggioId: string,
  userId: string,
): Promise<DiaryAssociationConflict> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('viaggio_id, user_id')
    .eq('id', diaryId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId) {
    throw new ResourceAssociationError('[resourceAssociation] Diario non trovato.');
  }

  if (!data.viaggio_id || data.viaggio_id === targetViaggioId) {
    return { type: 'none' };
  }

  return { type: 'other_viaggio', currentViaggioId: data.viaggio_id };
}

export async function associateDiaryToViaggio(params: {
  diaryId: string;
  viaggioId: string;
  userId: string;
}): Promise<PersistedItinerary> {
  const conflict = await getDiaryAssociationConflict(
    params.diaryId,
    params.viaggioId,
    params.userId,
  );
  if (conflict.type === 'other_viaggio') {
    throw new ResourceAssociationError(
      '[resourceAssociation] Diario già associato ad un altro Viaggio.',
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('itineraries')
    .update({ viaggio_id: params.viaggioId, updated_at: now })
    .eq('id', params.diaryId)
    .eq('user_id', params.userId)
    .select('*')
    .single();

  if (error) throw error;
  if (!data) {
    throw new ResourceAssociationError('[resourceAssociation] Associazione diario non riuscita.');
  }

  const viaggio = await getViaggio(params.viaggioId);
  if (viaggio?.activeDiaryId == null) {
    await setActiveDiary(params.viaggioId, params.diaryId);
  }

  return mapDiaryRowFromDb(data);
}

export async function copyDiaryAndAssociateToViaggio(params: {
  sourceDiaryId: string;
  viaggioId: string;
  userId: string;
  title?: string;
}): Promise<PersistedItinerary> {
  const dup = await duplicatePersonalDiary(
    params.sourceDiaryId,
    params.userId,
    params.title,
  );
  if (dup.success === false) {
    throw new ResourceAssociationError(dup.error);
  }

  // Copia + associazione non sono atomiche a livello DB: se l’associazione fallisce
  // eliminiamo la copia appena creata per non lasciare un Diario orfano.
  try {
    return await associateDiaryToViaggio({
      diaryId: dup.copiedResourceId,
      viaggioId: params.viaggioId,
      userId: params.userId,
    });
  } catch (associateError) {
    try {
      await deleteUserDraft(dup.copiedResourceId, params.userId);
    } catch (rollbackError) {
      console.error(
        '[resourceAssociation] Rollback copia Diario fallito dopo associazione:',
        rollbackError,
      );
    }
    throw associateError;
  }
}

export async function createDiaryWithAssociation(input: CreateDiaryInput): Promise<PersistedItinerary> {
  const title = input.name.trim() || 'Nuovo diario';
  const viaggioId = await resolveViaggioIdForCreate({
    userId: input.userId,
    viaggioChoice: input.fixedViaggioId ? 'existing' : input.viaggioChoice,
    existingViaggioId: input.fixedViaggioId ?? input.existingViaggioId,
    fixedViaggioId: input.fixedViaggioId,
    title,
    periodStart: input.startDate,
    periodEnd: input.endDate,
  });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const packed = {
    items: [],
    startDate: input.startDate,
    endDate: input.endDate,
  };
  const durationDays = durationDaysFromPeriod(input.startDate, input.endDate);

  let mainCity: string | null = null;
  if (viaggioId) {
    const viaggio = await getViaggio(viaggioId);
    mainCity = viaggio?.destination?.trim() || null;
  }

  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      id,
      user_id: input.userId,
      title,
      description: 'Bozza',
      duration_days: durationDays,
      type: 'personal',
      status: 'draft',
      items_json: toDbJson(packed),
      main_city: mainCity,
      viaggio_id: viaggioId,
      created_at: now,
      updated_at: now,
      last_modified_by: input.userId,
    })
    .select('*')
    .single();

  if (error) throw error;
  if (!data) throw new ResourceAssociationError('[resourceAssociation] Creazione diario non riuscita.');

  if (viaggioId) {
    const viaggio = await getViaggio(viaggioId);
    if (viaggio?.activeDiaryId == null) {
      await setActiveDiary(viaggioId, id);
    }
  }

  return mapDiaryRowFromDb(data);
}

export async function getSuitcaseLinkConflict(
  suitcaseId: string,
  targetViaggioId: string,
): Promise<SuitcaseLinkConflict> {
  const { data: viaggioLinks, error: vErr } = await supabase
    .from('viaggio_suitcases')
    .select('viaggio_id')
    .eq('suitcase_id', suitcaseId);

  if (vErr) throw vErr;

  const onOtherViaggio = (viaggioLinks ?? []).some((r) => r.viaggio_id !== targetViaggioId);
  if (onOtherViaggio) {
    return { type: 'other_viaggio' };
  }

  const { data: diaryLinks, error: dErr } = await supabase
    .from('itinerary_suitcases')
    .select('itinerary_id')
    .eq('suitcase_id', suitcaseId);

  if (dErr) throw dErr;

  if ((diaryLinks ?? []).length > 0) {
    return { type: 'linked_to_diary_or_viaggio' };
  }

  const alreadyOnTarget = (viaggioLinks ?? []).some((r) => r.viaggio_id === targetViaggioId);
  if (alreadyOnTarget) {
    return { type: 'none' };
  }

  return { type: 'none' };
}

export async function linkSuitcaseToViaggioSafe(params: {
  viaggioId: string;
  suitcaseId: string;
  userId: string;
  useCopy?: boolean;
}): Promise<{ suitcaseId: string; copied: boolean }> {
  const conflict = await getSuitcaseLinkConflict(params.suitcaseId, params.viaggioId);

  if (conflict.type !== 'none' && !params.useCopy) {
    throw new SuitcaseLinkConflictError(conflict);
  }

  let targetId = params.suitcaseId;
  let copied = false;

  if (conflict.type !== 'none') {
    targetId = await duplicateSuitcaseEntityAsync(params.suitcaseId, params.userId);
    copied = true;
  }

  // Copia + link non sono atomici: se il link fallisce dopo una copia, rimuoviamo la copia.
  try {
    await linkSuitcaseToViaggio(params.viaggioId, targetId, params.userId);
  } catch (linkError) {
    if (copied) {
      try {
        await deleteSuitcaseAsync(targetId);
      } catch (rollbackError) {
        console.error(
          '[resourceAssociation] Rollback copia Valigia fallito dopo link:',
          rollbackError,
        );
      }
    }
    throw linkError;
  }

  return { suitcaseId: targetId, copied };
}

export async function createSuitcaseWithAssociation(
  input: CreateSuitcaseInput,
): Promise<{ suitcaseId: string; viaggioId: string | null }> {
  const title = input.name.trim() || 'Nuova valigia';
  const viaggioId = await resolveViaggioIdForCreate({
    userId: input.userId,
    viaggioChoice: input.fixedViaggioId ? 'existing' : input.viaggioChoice,
    existingViaggioId: input.fixedViaggioId ?? input.existingViaggioId,
    fixedViaggioId: input.fixedViaggioId,
    title,
  });

  const created = await createSuitcaseAsync(input.userId, title, input.icon ?? '🎒');
  if (!created?.id) {
    throw new ResourceAssociationError('[resourceAssociation] Creazione valigia non riuscita.');
  }

  if (viaggioId) {
    await linkSuitcaseToViaggio(viaggioId, created.id, input.userId);
  }

  return { suitcaseId: created.id, viaggioId };
}

/** Collega una valigia appena salvata/copiata a un Viaggio (Salva con nome esteso). */
export async function applyViaggioAssociationToSuitcase(params: {
  suitcaseId: string;
  userId: string;
  viaggioOptions: SaveAsViaggioOptions;
  title: string;
}): Promise<void> {
  const viaggioId = await resolveViaggioIdForCreate({
    userId: params.userId,
    viaggioChoice: params.viaggioOptions.viaggioChoice,
    existingViaggioId: params.viaggioOptions.existingViaggioId,
    title: params.title,
  });

  if (viaggioId) {
    await linkSuitcaseToViaggio(viaggioId, params.suitcaseId, params.userId);
  }
}

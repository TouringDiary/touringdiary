import type { SharedResourceKind } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { supabase } from '@/services/supabaseClient';
import { duplicateSuitcaseEntityAsync } from '@/services/suitcaseService';
import { randomUUID } from '@/utils/runtimeId';

/** Esito di una copia personale (invito personale o duplicazione pre-condivisione). */
export type PersonalResourceDuplicateResult =
  | { success: true; copiedResourceId: string }
  | { success: false; error: string };

/** @deprecated Usare PersonalResourceDuplicateResult */
export type DuplicateSharedResourceForInviteeResult = PersonalResourceDuplicateResult;

/**
 * Kind collaborativi che persistono sulla tabella `suitcases`.
 * Valigia operativa (`suitcase`) e Template Utente (`user_template`) sono la stessa
 * struttura dati, distinte dal flag `is_user_template` (§3, suitcaseDomain).
 */
type SuitcaseTableEntityKind = Extract<SharedResourceKind, 'suitcase' | 'user_template'>;

function isSuitcaseTableEntityKind(kind: SharedResourceKind): kind is SuitcaseTableEntityKind {
  return kind === 'suitcase' || kind === 'user_template';
}

function rowMatchesSuitcaseTableKind(
  row: { is_user_template: boolean | null },
  kind: SuitcaseTableEntityKind
): boolean {
  const isUserTemplateRow = row.is_user_template === true;
  return kind === 'user_template' ? isUserTemplateRow : !isUserTemplateRow;
}

function kindMismatchMessage(kind: SuitcaseTableEntityKind): string {
  return kind === 'user_template'
    ? 'La risorsa non è un Template Utente.'
    : 'La risorsa non è una Valigia operativa.';
}

function defaultTitleForKind(kind: SharedResourceKind): string {
  if (kind === 'diary') return 'Diario';
  if (kind === 'user_template') return 'Template';
  return 'Valigia';
}

/**
 * Copia personale del Diario (Tab Note incluso; senza pivot valigie).
 */
async function duplicateDiaryCopy(
  resourceId: string,
  ownerId: string,
  targetUserId: string,
  title?: string
): Promise<PersonalResourceDuplicateResult> {
  const { data: source, error } = await supabase
    .from('itineraries')
    .select(
      'id, user_id, title, description, duration_days, type, status, items_json, main_city'
    )
    .eq('id', resourceId)
    .eq('user_id', ownerId)
    .eq('type', 'personal')
    .maybeSingle();

  if (error) {
    console.error('[personalShareService] duplicateDiaryCopy:', error.message);
    return { success: false, error: 'Impossibile verificare il Diario da copiare.' };
  }
  if (!source) {
    return { success: false, error: 'Diario non trovato o accesso negato.' };
  }

  const copiedResourceId = randomUUID();
  const now = new Date().toISOString();
  const copiedItemsJson =
    source.items_json != null ? JSON.parse(JSON.stringify(source.items_json)) : null;

  const { error: insertError } = await supabase.from('itineraries').insert({
    id: copiedResourceId,
    user_id: targetUserId,
    title: title ?? source.title ?? defaultTitleForKind('diary'),
    description: source.description ?? 'Bozza salvata',
    duration_days: source.duration_days ?? 1,
    type: 'personal',
    status: source.status ?? 'draft',
    items_json: copiedItemsJson,
    main_city: source.main_city,
    suitcase_id: null,
    created_at: now,
    updated_at: now,
    last_modified_by: targetUserId,
  });

  if (insertError) {
    console.error('[personalShareService] duplicateDiaryCopy insert:', insertError.message);
    return { success: false, error: 'Impossibile creare la copia personale del Diario.' };
  }

  return { success: true, copiedResourceId };
}

/**
 * Copia personale per righe `suitcases` (Valigia o Template Utente).
 */
async function duplicateSuitcaseTableEntityCopy(
  kind: SuitcaseTableEntityKind,
  resourceId: string,
  ownerId: string,
  targetUserId: string,
  title: string
): Promise<PersonalResourceDuplicateResult> {
  const { data: source, error } = await supabase
    .from('suitcases')
    .select('id, user_id, title, is_user_template')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[personalShareService] duplicateSuitcaseTableEntityCopy:', error.message);
    return { success: false, error: 'Impossibile verificare la risorsa da copiare.' };
  }
  if (!source || source.user_id !== ownerId) {
    return { success: false, error: 'Risorsa non trovata o accesso negato.' };
  }
  if (!rowMatchesSuitcaseTableKind(source, kind)) {
    return { success: false, error: kindMismatchMessage(kind) };
  }

  try {
    const copiedResourceId = await duplicateSuitcaseEntityAsync(resourceId, targetUserId, title);
    return { success: true, copiedResourceId };
  } catch (copyError) {
    console.error('[personalShareService] duplicateSuitcaseTableEntityCopy:', copyError);
    return { success: false, error: 'Impossibile creare la copia personale.' };
  }
}

/**
 * Modalità Personale (§4.2): copia completa indipendente per il destinatario invito.
 */
export async function duplicateSharedResourceForInvitee(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string,
  inviteeId: string
): Promise<PersonalResourceDuplicateResult> {
  if (!isSharedResourceKind(kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  if (kind === 'diary') {
    return duplicateDiaryCopy(resourceId, ownerId, inviteeId);
  }

  if (isSuitcaseTableEntityKind(kind)) {
    const { data: source, error } = await supabase
      .from('suitcases')
      .select('title')
      .eq('id', resourceId)
      .maybeSingle();
    if (error) {
      return { success: false, error: 'Impossibile verificare la risorsa da copiare.' };
    }
    const fallback = defaultTitleForKind(kind);
    return duplicateSuitcaseTableEntityCopy(
      kind,
      resourceId,
      ownerId,
      inviteeId,
      source?.title?.trim() || fallback
    );
  }

  return { success: false, error: 'Tipo di risorsa non supportato.' };
}

/**
 * Duplica una risorsa per lo stesso proprietario prima della condivisione collaborativa
 * (wizard «Duplica e condividi»). La risorsa originale resta invariata.
 */
export async function duplicateSharedResourceForOwner(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string
): Promise<PersonalResourceDuplicateResult> {
  if (!isSharedResourceKind(kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  if (kind === 'diary') {
    const { data: source, error } = await supabase
      .from('itineraries')
      .select('title')
      .eq('id', resourceId)
      .eq('user_id', ownerId)
      .maybeSingle();
    if (error) {
      return { success: false, error: 'Diario non trovato o accesso negato.' };
    }
    const baseTitle = source?.title?.trim() || defaultTitleForKind('diary');
    return duplicateDiaryCopy(resourceId, ownerId, ownerId, baseTitle);
  }

  if (isSuitcaseTableEntityKind(kind)) {
    const { data: source, error } = await supabase
      .from('suitcases')
      .select('id, user_id, title, is_user_template')
      .eq('id', resourceId)
      .maybeSingle();

    if (error || !source || source.user_id !== ownerId) {
      return { success: false, error: 'Risorsa non trovata o accesso negato.' };
    }
    if (!rowMatchesSuitcaseTableKind(source, kind)) {
      return { success: false, error: kindMismatchMessage(kind) };
    }

    const baseTitle = source.title?.trim() || defaultTitleForKind(kind);
    return duplicateSuitcaseTableEntityCopy(
      kind,
      resourceId,
      ownerId,
      ownerId,
      baseTitle
    );
  }

  return { success: false, error: 'Tipo di risorsa non supportato.' };
}

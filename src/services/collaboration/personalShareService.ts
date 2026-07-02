import type { SharedResourceKind } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { supabase } from '@/services/supabaseClient';
import { duplicateSuitcaseEntityAsync } from '@/services/suitcaseService';

export type DuplicateSharedResourceForInviteeResult =
  | { success: true; copiedResourceId: string }
  | { success: false; error: string };

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

/**
 * Copia personale per righe `suitcases` (Valigia o Template Utente).
 * `duplicateSuitcaseEntityAsync` applica già la logica corretta per tipo sorgente.
 */
async function duplicateSuitcaseTableEntityForInvitee(
  kind: SuitcaseTableEntityKind,
  resourceId: string,
  ownerId: string,
  inviteeId: string
): Promise<DuplicateSharedResourceForInviteeResult> {
  const { data: source, error } = await supabase
    .from('suitcases')
    .select('id, user_id, title, is_user_template')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[personalShareService] duplicateSuitcaseTableEntityForInvitee:', error.message);
    return { success: false, error: 'Impossibile verificare la risorsa da copiare.' };
  }
  if (!source || source.user_id !== ownerId) {
    return { success: false, error: 'Risorsa non trovata o accesso negato.' };
  }
  if (!rowMatchesSuitcaseTableKind(source, kind)) {
    return { success: false, error: kindMismatchMessage(kind) };
  }

  const fallbackTitle = kind === 'user_template' ? 'Template' : 'Valigia';

  try {
    const copiedResourceId = await duplicateSuitcaseEntityAsync(
      resourceId,
      inviteeId,
      source.title ?? fallbackTitle
    );
    return { success: true, copiedResourceId };
  } catch (copyError) {
    console.error('[personalShareService] duplicateSuitcaseTableEntityForInvitee:', copyError);
    return { success: false, error: 'Impossibile creare la copia personale.' };
  }
}

/**
 * Modalità Personale (§4.2): copia completa indipendente per il destinatario.
 * Valigie e Template Utente in Fase 4; Diario in Fase 6.
 */
export async function duplicateSharedResourceForInvitee(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string,
  inviteeId: string
): Promise<DuplicateSharedResourceForInviteeResult> {
  if (!isSharedResourceKind(kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }

  if (kind === 'diary') {
    return {
      success: false,
      error: 'La condivisione personale del Diario sarà disponibile nella prossima fase.',
    };
  }

  if (isSuitcaseTableEntityKind(kind)) {
    return duplicateSuitcaseTableEntityForInvitee(kind, resourceId, ownerId, inviteeId);
  }

  return { success: false, error: 'Tipo di risorsa non supportato.' };
}

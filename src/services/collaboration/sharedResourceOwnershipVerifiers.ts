import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind } from '@/domain/collaboration';

type OwnershipVerifier = (
  resourceId: string,
  ownerId: string
) => Promise<string | null>;

async function verifyDiaryOwnership(
  resourceId: string,
  ownerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('id, user_id, type')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[sharedResourceOwnership] diary:', error.message);
    return 'Impossibile verificare il Diario.';
  }
  if (!data) return 'Diario non trovato.';
  if (data.type !== 'personal') return 'Solo i Diari personali possono essere condivisi.';
  if (data.user_id !== ownerId) return 'Non sei il proprietario di questo Diario.';
  return null;
}

async function verifySuitcaseEntityOwnership(
  resourceId: string,
  ownerId: string,
  kind: 'suitcase' | 'user_template'
): Promise<string | null> {
  const { data, error } = await supabase
    .from('suitcases')
    .select('id, user_id, is_user_template')
    .eq('id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[sharedResourceOwnership] suitcase entity:', error.message);
    return 'Impossibile verificare la risorsa.';
  }

  const notFoundMessage =
    kind === 'user_template' ? 'Template non trovato.' : 'Valigia non trovata.';
  if (!data) return notFoundMessage;
  if (data.user_id === null) return 'I template di sistema non sono condivisibili.';
  if (data.user_id !== ownerId) {
    return kind === 'user_template'
      ? 'Non sei il proprietario di questo Template.'
      : 'Non sei il proprietario di questa Valigia.';
  }
  if (kind === 'user_template' && !data.is_user_template) {
    return 'La risorsa non è un Template Utente.';
  }
  if (kind === 'suitcase' && data.is_user_template) {
    return 'La risorsa non è una Valigia operativa.';
  }

  return null;
}

/** Registro estensibile: un verifier per kind (§3). */
const OWNERSHIP_VERIFIERS: Record<SharedResourceKind, OwnershipVerifier> = {
  diary: verifyDiaryOwnership,
  suitcase: (resourceId, ownerId) =>
    verifySuitcaseEntityOwnership(resourceId, ownerId, 'suitcase'),
  user_template: (resourceId, ownerId) =>
    verifySuitcaseEntityOwnership(resourceId, ownerId, 'user_template'),
};

export async function verifyShareableResourceOwnership(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string
): Promise<string | null> {
  return OWNERSHIP_VERIFIERS[kind](resourceId, ownerId);
}

/** Proprietario dell'entità sottostante (valigia, template utente, diario). */
export async function isShareableResourceOwner(
  kind: SharedResourceKind,
  resourceId: string,
  userId: string
): Promise<boolean> {
  return (await verifyShareableResourceOwnership(kind, resourceId, userId)) === null;
}

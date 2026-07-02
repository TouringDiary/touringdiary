import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind, SharingMode } from '@/domain/collaboration';
import { isSharingMode, isSharedResourceKind } from '@/domain/collaboration';
import { mapSharedResourceRow } from './sharedResourceMappers';
import type { SharedResource } from '@/domain/collaboration';
import { verifyShareableResourceOwnership } from './sharedResourceOwnershipVerifiers';

export type RegisterShareableResourceResult =
  | { success: true; resource: SharedResource }
  | { success: false; error: string };

export async function getShareableResource(
  kind: SharedResourceKind,
  resourceId: string
): Promise<SharedResource | null> {
  const { data, error } = await supabase
    .from('shared_resources')
    .select('*')
    .eq('kind', kind)
    .eq('resource_id', resourceId)
    .maybeSingle();

  if (error) {
    console.error('[sharedResourceService] getShareableResource:', error.message);
    return null;
  }
  if (!data) return null;
  return mapSharedResourceRow(data);
}

/**
 * Crea il record di registro per una Risorsa Condivisibile (§3).
 * Idempotente: se esiste già, restituisce il record esistente.
 */
export async function ensureShareableResource(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string,
  sharingMode: SharingMode = 'collaborative'
): Promise<RegisterShareableResourceResult> {
  const existing = await getShareableResource(kind, resourceId);
  if (existing) {
    return { success: true, resource: existing };
  }
  return registerShareableResource(kind, resourceId, ownerId, sharingMode);
}

export async function registerShareableResource(
  kind: SharedResourceKind,
  resourceId: string,
  ownerId: string,
  sharingMode: SharingMode = 'collaborative'
): Promise<RegisterShareableResourceResult> {
  if (!isSharedResourceKind(kind)) {
    return { success: false, error: 'Tipo di risorsa non valido.' };
  }
  if (!isSharingMode(sharingMode)) {
    return { success: false, error: 'Modalità di condivisione non valida.' };
  }

  const ownershipError = await verifyShareableResourceOwnership(kind, resourceId, ownerId);
  if (ownershipError) {
    return { success: false, error: ownershipError };
  }

  const { data, error } = await supabase
    .from('shared_resources')
    .insert({
      kind,
      resource_id: resourceId,
      owner_id: ownerId,
      sharing_mode: sharingMode,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await getShareableResource(kind, resourceId);
      if (existing) return { success: true, resource: existing };
    }
    console.error('[sharedResourceService] registerShareableResource:', error.message);
    return { success: false, error: 'Impossibile registrare la risorsa condivisibile.' };
  }

  const resource = mapSharedResourceRow(data);
  if (!resource) {
    return { success: false, error: 'Dati della risorsa condivisibile non validi.' };
  }

  return { success: true, resource };
}

export async function updateShareableResourceMode(
  sharedResourceId: string,
  ownerId: string,
  sharingMode: SharingMode
): Promise<{ success: boolean; error?: string }> {
  if (!isSharingMode(sharingMode)) {
    return { success: false, error: 'Modalità di condivisione non valida.' };
  }

  const { data, error } = await supabase
    .from('shared_resources')
    .update({ sharing_mode: sharingMode })
    .eq('id', sharedResourceId)
    .eq('owner_id', ownerId)
    .select('id');

  if (error) {
    console.error('[sharedResourceService] updateShareableResourceMode:', error.message);
    return { success: false, error: 'Impossibile aggiornare la modalità di condivisione.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Risorsa non trovata o accesso negato.' };
  }

  return { success: true };
}

export async function deleteShareableResource(
  sharedResourceId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('shared_resources')
    .delete()
    .eq('id', sharedResourceId)
    .eq('owner_id', ownerId)
    .select('id');

  if (error) {
    console.error('[sharedResourceService] deleteShareableResource:', error.message);
    return { success: false, error: 'Impossibile rimuovere la risorsa condivisibile.' };
  }
  if (!data?.length) {
    return { success: false, error: 'Risorsa non trovata o accesso negato.' };
  }

  return { success: true };
}

import { supabase } from '@/services/supabaseClient';
import { isSharingMode } from '@/domain/collaboration';

/**
 * ID Diari in modalità Collaborativa accessibili come membro (non proprietario).
 * Il proprietario non è mai in `shared_resource_members` (vincolo WITH CHECK Fase 2).
 */
export async function fetchCollaborativeDiaryIdsForMember(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('shared_resource_members')
    .select('shared_resources!inner(resource_id, kind, sharing_mode)')
    .eq('user_id', userId);

  if (error) {
    console.error('[diaryCollaborationService] fetchCollaborativeDiaryIdsForMember:', error.message);
    return [];
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const resource = row.shared_resources;
    if (!resource || Array.isArray(resource)) continue;
    const kind = resource.kind;
    const sharingMode = resource.sharing_mode;
    if (
      kind === 'diary' &&
      typeof sharingMode === 'string' &&
      isSharingMode(sharingMode) &&
      sharingMode === 'collaborative' &&
      typeof resource.resource_id === 'string'
    ) {
      ids.add(resource.resource_id);
    }
  }

  return [...ids];
}

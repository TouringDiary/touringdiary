import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind } from '@/domain/collaboration';
import { isSharingMode } from '@/domain/collaboration';

const COLLABORATIVE_SUITCASE_KINDS: SharedResourceKind[] = ['suitcase', 'user_template'];

function isCollaborativeSuitcaseKind(kind: string): kind is SharedResourceKind {
  return COLLABORATIVE_SUITCASE_KINDS.includes(kind as SharedResourceKind);
}

/**
 * ID valigie/template in modalità Collaborativa accessibili come membro (non proprietario).
 */
export async function fetchCollaborativeSuitcaseIdsForMember(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('shared_resource_members')
    .select(
      'shared_resources!inner(resource_id, kind, sharing_mode, owner_id)'
    )
    .eq('user_id', userId);

  if (error) {
    console.error('[suitcaseCollaborationService] fetchCollaborativeSuitcaseIdsForMember:', error.message);
    return [];
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const resource = row.shared_resources;
    if (!resource || Array.isArray(resource)) continue;
    const kind = resource.kind;
    const sharingMode = resource.sharing_mode;
    if (
      typeof kind === 'string' &&
      isCollaborativeSuitcaseKind(kind) &&
      typeof sharingMode === 'string' &&
      isSharingMode(sharingMode) &&
      sharingMode === 'collaborative' &&
      resource.owner_id !== userId &&
      typeof resource.resource_id === 'string'
    ) {
      ids.add(resource.resource_id);
    }
  }

  return [...ids];
}

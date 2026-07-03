import { supabase } from '@/services/supabaseClient';
import type { SharedResourceKind } from '@/domain/collaboration';
import { workspaceResourceKey } from '@/domain/collaboration';
import type { WorkspaceCompositionResource } from '@/services/collaboration';

export interface WorkspaceResourceLabel {
  kind: SharedResourceKind;
  resourceId: string;
  title: string;
}

/**
 * Risolve titoli leggibili per le risorse collegate a un workspace (UI dashboard).
 */
export async function resolveWorkspaceResourceLabels(
  resources: WorkspaceCompositionResource[]
): Promise<WorkspaceResourceLabel[]> {
  if (resources.length === 0) return [];

  const diaryIds = resources.filter((r) => r.kind === 'diary').map((r) => r.resourceId);
  const suitcaseIds = resources
    .filter((r) => r.kind === 'suitcase' || r.kind === 'user_template')
    .map((r) => r.resourceId);

  const [diaryResult, suitcaseResult] = await Promise.all([
    diaryIds.length > 0
      ? supabase.from('itineraries').select('id, title').in('id', diaryIds)
      : Promise.resolve({ data: [], error: null }),
    suitcaseIds.length > 0
      ? supabase.from('suitcases').select('id, title, is_template').in('id', suitcaseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const diaryTitles = new Map(
    (diaryResult.data ?? []).map((row) => [row.id, row.title?.trim() || 'Diario'])
  );
  const suitcaseTitles = new Map(
    (suitcaseResult.data ?? []).map((row) => [row.id, row.title?.trim() || 'Valigia'])
  );

  return resources.map((resource) => {
    let title = 'Risorsa';
    if (resource.kind === 'diary') {
      title = diaryTitles.get(resource.resourceId) ?? 'Diario';
    } else if (resource.kind === 'suitcase') {
      title = suitcaseTitles.get(resource.resourceId) ?? 'Valigia';
    } else if (resource.kind === 'user_template') {
      title = suitcaseTitles.get(resource.resourceId) ?? 'Template';
    }

    return {
      kind: resource.kind,
      resourceId: resource.resourceId,
      title,
    };
  });
}

export function findWorkspaceResourceLabel(
  labels: WorkspaceResourceLabel[],
  kind: SharedResourceKind,
  resourceId: string
): WorkspaceResourceLabel | undefined {
  const key = workspaceResourceKey(kind, resourceId);
  return labels.find((label) => workspaceResourceKey(label.kind, label.resourceId) === key);
}

export function buildWorkspaceResourceLabelMap(
  labels: WorkspaceResourceLabel[]
): Map<string, WorkspaceResourceLabel> {
  return new Map(
    labels.map((label) => [workspaceResourceKey(label.kind, label.resourceId), label])
  );
}

export interface CollaborationUserProfileSummary {
  name: string;
  slug?: string;
}

/** Profili utente per UI collaborativa (proprietario workspace, invitati, ecc.). */
export async function fetchCollaborationUserProfiles(
  userIds: string[]
): Promise<Record<string, CollaborationUserProfileSummary>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, slug')
    .in('id', userIds);

  if (error) {
    console.error('[workspaceResourcePresentation] fetchCollaborationUserProfiles:', error.message);
    return {};
  }

  const profileMap: Record<string, CollaborationUserProfileSummary> = {};
  for (const profile of data ?? []) {
    profileMap[profile.id] = {
      name: profile.name ?? 'Utente',
      slug: profile.slug ?? undefined,
    };
  }
  return profileMap;
}

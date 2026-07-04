import type { SharedResourceKind, ResourceInvite, Workspace } from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';
import { supabase } from '@/services/supabaseClient';
import { listPendingInvitesForUser, listResourceInvites } from './resourceInviteService';
import { listPendingWorkspaceInvitesForUser, listWorkspaceInvites } from './workspaceInviteService';
import { listWorkspacesForUser } from './workspaceService';
import { fetchCollaborativeDiaryIdsForMember } from './diaryCollaborationService';

export interface SharingProfileResourceRow {
  id: string;
  kind: SharedResourceKind;
  resourceId: string;
  title: string;
  role: 'owner' | 'collaborator' | 'viewer';
  sharingMode: 'collaborative' | 'personal' | null;
  hasDiary: boolean;
  hasNotes: boolean;
  hasSuitcase: boolean;
  hasTemplate: boolean;
  workspaceIds: string[];
  isShared: boolean;
}

export interface SharingProfileOverview {
  ownedResources: SharingProfileResourceRow[];
  memberResources: SharingProfileResourceRow[];
  workspaces: Workspace[];
  incomingResourceInvites: ResourceInvite[];
  outgoingResourceInvites: Awaited<ReturnType<typeof listResourceInvites>>;
  incomingWorkspaceInvites: Awaited<ReturnType<typeof listPendingWorkspaceInvitesForUser>>;
}

type ResourceRef = { kind: SharedResourceKind; resourceId: string };

function resourceRefKey(kind: SharedResourceKind, resourceId: string): string {
  return `${kind}:${resourceId}`;
}

async function batchResolveResourceTitles(
  refs: ResourceRef[]
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  if (refs.length === 0) return titles;

  const diaryIds = [...new Set(refs.filter((r) => r.kind === 'diary').map((r) => r.resourceId))];
  const suitcaseIds = [
    ...new Set(refs.filter((r) => r.kind !== 'diary').map((r) => r.resourceId)),
  ];

  const [diaryRows, suitcaseRows] = await Promise.all([
    diaryIds.length
      ? supabase.from('itineraries').select('id, title').in('id', diaryIds)
      : Promise.resolve({ data: [] as { id: string; title: string | null }[] }),
    suitcaseIds.length
      ? supabase.from('suitcases').select('id, title').in('id', suitcaseIds)
      : Promise.resolve({ data: [] as { id: string; title: string | null }[] }),
  ]);

  for (const row of diaryRows.data ?? []) {
    titles.set(
      resourceRefKey('diary', row.id),
      row.title?.trim() || getSharedResourceKindLabel('diary')
    );
  }

  for (const ref of refs) {
    if (ref.kind === 'diary') continue;
    const row = (suitcaseRows.data ?? []).find((s) => s.id === ref.resourceId);
    titles.set(
      resourceRefKey(ref.kind, ref.resourceId),
      row?.title?.trim() || getSharedResourceKindLabel(ref.kind)
    );
  }

  return titles;
}

async function batchListWorkspaceIdsByResource(
  refs: ResourceRef[]
): Promise<Map<string, string[]>> {
  const workspaceIdsByRef = new Map<string, string[]>();
  if (refs.length === 0) return workspaceIdsByRef;

  const orFilter = refs
    .map((ref) => `and(kind.eq.${ref.kind},resource_id.eq.${ref.resourceId})`)
    .join(',');

  const { data, error } = await supabase
    .from('workspace_resources')
    .select('kind, resource_id, workspace_id')
    .or(orFilter);

  if (error) {
    console.error('[collaborationProfileService] batchListWorkspaceIdsByResource:', error.message);
    return workspaceIdsByRef;
  }

  for (const row of data ?? []) {
    const key = resourceRefKey(row.kind as SharedResourceKind, row.resource_id);
    const list = workspaceIdsByRef.get(key) ?? [];
    list.push(row.workspace_id);
    workspaceIdsByRef.set(key, list);
  }

  return workspaceIdsByRef;
}

function buildSharingProfileResourceRow(
  input: {
    id: string;
    kind: SharedResourceKind;
    resourceId: string;
    role: SharingProfileResourceRow['role'];
    sharingMode: SharingProfileResourceRow['sharingMode'];
    isShared: boolean;
  },
  titles: Map<string, string>,
  workspaceIdsByRef: Map<string, string[]>
): SharingProfileResourceRow {
  const refKey = resourceRefKey(input.kind, input.resourceId);
  return {
    id: input.id,
    kind: input.kind,
    resourceId: input.resourceId,
    title: titles.get(refKey) ?? getSharedResourceKindLabel(input.kind),
    role: input.role,
    sharingMode: input.sharingMode,
    hasDiary: input.kind === 'diary',
    hasNotes: input.kind === 'diary',
    hasSuitcase: input.kind === 'suitcase',
    hasTemplate: input.kind === 'user_template',
    workspaceIds: workspaceIdsByRef.get(refKey) ?? [],
    isShared: input.isShared,
  };
}

async function fetchOwnedSharedResources(userId: string): Promise<SharingProfileResourceRow[]> {
  const { data, error } = await supabase
    .from('shared_resources')
    .select('id, kind, resource_id, sharing_mode, shared_resource_members(id)')
    .eq('owner_id', userId);

  if (error) {
    console.error('[collaborationProfileService] fetchOwnedSharedResources:', error.message);
    return [];
  }

  const rawRows = (data ?? []).map((resource) => {
    const kind = resource.kind as SharedResourceKind;
    const memberCount = Array.isArray(resource.shared_resource_members)
      ? resource.shared_resource_members.length
      : 0;
    return {
      id: resource.id,
      kind,
      resourceId: resource.resource_id,
      role: 'owner' as const,
      sharingMode: resource.sharing_mode as SharingProfileResourceRow['sharingMode'],
      isShared: memberCount > 0,
    };
  });

  const refs = rawRows.map((row) => ({ kind: row.kind, resourceId: row.resourceId }));
  const [titles, workspaceIdsByRef] = await Promise.all([
    batchResolveResourceTitles(refs),
    batchListWorkspaceIdsByResource(refs),
  ]);

  return rawRows.map((row) =>
    buildSharingProfileResourceRow(row, titles, workspaceIdsByRef)
  );
}

async function fetchMemberSharedResources(userId: string): Promise<SharingProfileResourceRow[]> {
  const { data, error } = await supabase
    .from('shared_resource_members')
    .select('role, shared_resources(id, kind, resource_id, sharing_mode, owner_id)')
    .eq('user_id', userId);

  if (error) return [];

  const rawRows: Array<{
    id: string;
    kind: SharedResourceKind;
    resourceId: string;
    role: 'collaborator' | 'viewer';
    sharingMode: SharingProfileResourceRow['sharingMode'];
    isShared: boolean;
  }> = [];

  for (const row of data ?? []) {
    const resource = row.shared_resources;
    if (!resource || Array.isArray(resource)) continue;
    rawRows.push({
      id: resource.id,
      kind: resource.kind as SharedResourceKind,
      resourceId: resource.resource_id,
      role: row.role as 'collaborator' | 'viewer',
      sharingMode: resource.sharing_mode as SharingProfileResourceRow['sharingMode'],
      isShared: true,
    });
  }

  const diaryIds = await fetchCollaborativeDiaryIdsForMember(userId);
  for (const diaryId of diaryIds) {
    if (rawRows.some((r) => r.kind === 'diary' && r.resourceId === diaryId)) continue;
    rawRows.push({
      id: diaryId,
      kind: 'diary',
      resourceId: diaryId,
      role: 'collaborator',
      sharingMode: 'collaborative',
      isShared: true,
    });
  }

  const refs = rawRows.map((row) => ({ kind: row.kind, resourceId: row.resourceId }));
  const [titles, workspaceIdsByRef] = await Promise.all([
    batchResolveResourceTitles(refs),
    batchListWorkspaceIdsByResource(refs),
  ]);

  return rawRows.map((row) =>
    buildSharingProfileResourceRow(row, titles, workspaceIdsByRef)
  );
}

export async function loadSharingProfileOverview(userId: string): Promise<SharingProfileOverview> {
  const [
    ownedResources,
    memberResources,
    workspaces,
    incomingResourceInvites,
    incomingWorkspaceInvites,
  ] = await Promise.all([
    fetchOwnedSharedResources(userId),
    fetchMemberSharedResources(userId),
    listWorkspacesForUser(userId),
    listPendingInvitesForUser(userId),
    listPendingWorkspaceInvitesForUser(userId),
  ]);

  const outgoingResourceInvites: SharingProfileOverview['outgoingResourceInvites'] = [];
  for (const owned of ownedResources) {
    const invites = await listResourceInvites(owned.kind, owned.resourceId, userId);
    outgoingResourceInvites.push(...invites.filter((i) => i.status === 'pending'));
  }

  return {
    ownedResources,
    memberResources,
    workspaces,
    incomingResourceInvites,
    outgoingResourceInvites,
    incomingWorkspaceInvites,
  };
}

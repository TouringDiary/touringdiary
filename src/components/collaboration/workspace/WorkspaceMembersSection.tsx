import React, { useMemo, useState } from 'react';
import { Crown, UserMinus } from 'lucide-react';
import type {
  WorkspaceMemberWithProfile,
  WorkspaceResource,
  WorkspaceResourcePermission,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import { workspaceResourceKey } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { buildWorkspaceResourceLabelMap } from '@/services/collaboration';
import { WorkspaceResourcePermissionSelect } from './WorkspaceResourcePermissionSelect';
import { CollaborationUserInviteSearch } from '../CollaborationUserInviteSearch';

interface Props {
  resources: WorkspaceResource[];
  resourceLabels: WorkspaceResourceLabel[];
  members: WorkspaceMemberWithProfile[];
  permissions: WorkspaceResourcePermission[];
  ownerProfile?: { name: string; slug?: string };
  isOwner: boolean;
  isSubmitting: boolean;
  searchQuery: string;
  searchResults: CollaborationUserSearchResult[];
  isSearching: boolean;
  onSearchQueryChange: (query: string) => void;
  onInviteUser: (target: CollaborationUserSearchResult) => void;
  onRequestRemoveMember: (userId: string) => void;
  onUpdateMemberPermissions: (
    userId: string,
    permissions: WorkspaceResourcePermissionEntry[]
  ) => void;
}

export const WorkspaceMembersSection: React.FC<Props> = ({
  resources,
  resourceLabels,
  members,
  permissions,
  ownerProfile,
  isOwner,
  isSubmitting,
  searchQuery,
  searchResults,
  isSearching,
  onSearchQueryChange,
  onInviteUser,
  onRequestRemoveMember,
  onUpdateMemberPermissions,
}) => {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const defaultPermissionEntries = useMemo(
    () =>
      resources.map((resource) => ({
        kind: resource.kind,
        resourceId: resource.resourceId,
        accessLevel: 'none' as const,
      })),
    [resources]
  );

  const labelMap = useMemo(
    () => buildWorkspaceResourceLabelMap(resourceLabels),
    [resourceLabels]
  );

  const permissionsByUser = useMemo(() => {
    const resourceIdByWorkspaceResourceId = new Map(
      resources.map((resource) => [resource.id, resource])
    );
    const map = new Map<string, WorkspaceResourcePermissionEntry[]>();

    for (const permission of permissions) {
      const linked = resourceIdByWorkspaceResourceId.get(permission.workspaceResourceId);
      if (!linked) continue;
      const entries = map.get(permission.userId) ?? [];
      entries.push({
        kind: linked.kind,
        resourceId: linked.resourceId,
        accessLevel: permission.accessLevel,
      });
      map.set(permission.userId, entries);
    }

    return map;
  }, [permissions, resources]);

  const handlePermissionChange = (
    userId: string,
    kind: WorkspaceResource['kind'],
    resourceId: string,
    accessLevel: WorkspaceResourcePermissionEntry['accessLevel']
  ) => {
    const current = permissionsByUser.get(userId) ?? defaultPermissionEntries;

    const key = workspaceResourceKey(kind, resourceId);
    const updated = current.some(
      (entry) => workspaceResourceKey(entry.kind, entry.resourceId) === key
    )
      ? current.map((entry) =>
          workspaceResourceKey(entry.kind, entry.resourceId) === key
            ? { ...entry, accessLevel }
            : entry
        )
      : [...current, { kind, resourceId, accessLevel }];

    onUpdateMemberPermissions(userId, updated);
  };

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Proprietario
        </h3>
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {ownerProfile?.name ?? 'Proprietario'}
            </p>
            {ownerProfile?.slug && (
              <p className="text-xs text-slate-500 truncate">@{ownerProfile.slug}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Membri ({members.length})
        </h3>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun membro oltre al proprietario.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => {
              const memberPermissions = permissionsByUser.get(member.userId) ?? [];
              const isExpanded = expandedMemberId === member.userId;

              return (
                <li
                  key={member.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {member.userName}
                      </p>
                      {member.userSlug && (
                        <p className="text-xs text-slate-500 truncate">@{member.userSlug}</p>
                      )}
                    </div>
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMemberId(isExpanded ? null : member.userId)
                          }
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Permessi
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onRequestRemoveMember(member.userId)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          title="Rimuovi membro"
                          aria-label="Rimuovi membro"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {isOwner && isExpanded && (
                    <div className="border-t border-slate-800 px-3 py-2 space-y-2 bg-slate-950/40">
                      {resources.map((resource) => {
                        const label = labelMap.get(
                          workspaceResourceKey(resource.kind, resource.resourceId)
                        );
                        const entry = memberPermissions.find(
                          (perm) =>
                            workspaceResourceKey(perm.kind, perm.resourceId) ===
                            workspaceResourceKey(resource.kind, resource.resourceId)
                        );

                        return (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-xs text-slate-400 truncate">
                              {label?.title ?? resource.kind}
                            </span>
                            <WorkspaceResourcePermissionSelect
                              value={entry?.accessLevel ?? 'none'}
                              disabled={isSubmitting}
                              onChange={(accessLevel) =>
                                handlePermissionChange(
                                  member.userId,
                                  resource.kind,
                                  resource.resourceId,
                                  accessLevel
                                )
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isOwner && (
        <section className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Invita utente
          </h3>
          <CollaborationUserInviteSearch
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            searchResults={searchResults}
            isSearching={isSearching}
            isSubmitting={isSubmitting}
            onSelectUser={onInviteUser}
          />
        </section>
      )}
    </div>
  );
};

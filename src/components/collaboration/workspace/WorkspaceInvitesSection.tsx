import React, { useMemo } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import type { WorkspaceInvite } from '@/domain/collaboration';
import { getSharedResourceKindLabel, workspaceResourceKey } from '@/domain/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { buildWorkspaceResourceLabelMap } from '@/services/collaboration';
import { INVITE_STATUS_LABELS } from '../collaborationSharePresentation';
import { WORKSPACE_ACCESS_LABELS } from './workspacePresentation';

interface Props {
  invites: WorkspaceInvite[];
  inviteeProfiles: Record<string, { name: string; slug?: string }>;
  resourceLabels: WorkspaceResourceLabel[];
  isSubmitting: boolean;
  onRequestRevokeInvite: (inviteId: string) => void;
  onResendInvite: (inviteId: string) => void;
}

export const WorkspaceInvitesSection: React.FC<Props> = ({
  invites,
  inviteeProfiles,
  resourceLabels,
  isSubmitting,
  onRequestRevokeInvite,
  onResendInvite,
}) => {
  const labelByKey = useMemo(
    () => buildWorkspaceResourceLabelMap(resourceLabels),
    [resourceLabels]
  );

  return (
  <div className="space-y-3">
    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
      Inviti al Workspace
    </h3>
    {invites.length === 0 ? (
      <p className="text-sm text-slate-500">Nessun invito inviato.</p>
    ) : (
      <ul className="space-y-2">
        {invites.map((invite) => {
          const profile = inviteeProfiles[invite.inviteeId];
          return (
          <li
            key={invite.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.name ?? `Utente ${invite.inviteeId.slice(0, 8)}…`}
                </p>
                {profile?.slug && (
                  <p className="text-xs text-slate-500 truncate">@{profile.slug}</p>
                )}
                <p className="text-xs text-slate-500">
                  {INVITE_STATUS_LABELS[invite.status]}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {invite.status === 'pending' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onRequestRevokeInvite(invite.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    title="Revoca invito"
                    aria-label="Revoca invito"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                {(invite.status === 'rejected' || invite.status === 'revoked') && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onResendInvite(invite.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50"
                    title="Reinvia invito"
                    aria-label="Reinvia invito"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {invite.permissions.length > 0 && (
              <ul className="text-[11px] text-slate-500 space-y-0.5">
                {invite.permissions.map((perm) => {
                  const resourceLabel = labelByKey.get(
                    workspaceResourceKey(perm.kind, perm.resourceId)
                  );
                  const displayName =
                    resourceLabel?.title ?? getSharedResourceKindLabel(perm.kind);
                  return (
                    <li key={`${perm.kind}:${perm.resourceId}`}>
                      {displayName}: {WORKSPACE_ACCESS_LABELS[perm.accessLevel]}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
          );
        })}
      </ul>
    )}
  </div>
  );
};

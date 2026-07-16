import React from 'react';
import type { SharedResourceKind, WorkspaceResourceAccess } from '@/domain/collaboration';
import type { WorkspacePendingInvite } from './collaborationSharePresentation';
import { WorkspaceResourcePermissionSelect } from './workspace/WorkspaceResourcePermissionSelect';

interface WorkspaceInviteStepProps {
  pendingInvites: WorkspacePendingInvite[];
  compositionElements: Array<{ kind: SharedResourceKind; resourceId: string; title: string }>;
  introClassName: string;
  onRemoveInvite: (userId: string) => void;
  onUpdateInvitePermission: (
    userId: string,
    kind: SharedResourceKind,
    resourceId: string,
    accessLevel: WorkspaceResourceAccess
  ) => void;
}

export const WorkspaceInviteStep: React.FC<WorkspaceInviteStepProps> = ({
  pendingInvites,
  compositionElements,
  introClassName,
  onRemoveInvite,
  onUpdateInvitePermission,
}) => (
  <div className="space-y-3">
    <p className={`${introClassName} text-slate-400 leading-relaxed`}>
      Invita utenti al Workspace e imposta il livello di accesso per ogni elemento incluso.
      Potrai modificare inviti e permessi in qualsiasi momento dalla gestione del Workspace.
    </p>
    {pendingInvites.length === 0 ? (
      <p className="text-sm text-slate-500">Nessun invito aggiunto (opzionale).</p>
    ) : (
      <ul className="space-y-3">
        {pendingInvites.map((invite) => (
          <li
            key={invite.userId}
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{invite.name}</p>
                {invite.slug && (
                  <p className="text-xs text-slate-500 truncate">@{invite.slug}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveInvite(invite.userId)}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                Rimuovi
              </button>
            </div>
            {compositionElements.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nessun elemento nella composizione: l&apos;invito non include permessi su elementi
                specifici.
              </p>
            ) : (
              <ul className="space-y-2">
                {compositionElements.map((element) => {
                  const permission = invite.permissions.find(
                    (entry) =>
                      entry.kind === element.kind && entry.resourceId === element.resourceId
                  );
                  return (
                    <li
                      key={`${invite.userId}-${element.kind}-${element.resourceId}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-slate-400 truncate min-w-0">
                        {element.title}
                      </span>
                      <WorkspaceResourcePermissionSelect
                        value={permission?.accessLevel ?? 'none'}
                        onChange={(accessLevel) =>
                          onUpdateInvitePermission(
                            invite.userId,
                            element.kind,
                            element.resourceId,
                            accessLevel
                          )
                        }
                        className="shrink-0 max-w-[9.5rem]"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

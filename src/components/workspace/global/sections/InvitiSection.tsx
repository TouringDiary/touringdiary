import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  acceptWorkspaceInvite,
  fetchCollaborationUserProfiles,
  getWorkspace,
  listPendingWorkspaceInvitesForUser,
  rejectWorkspaceInvite,
} from '@/services/collaboration';
import type { WorkspaceInvite } from '@/domain/collaboration';
import { useWorkspacePanelState } from '../WorkspacePanelContext';

/** Layout condiviso per stati placeholder della sezione Inviti. */
const PLACEHOLDER_LAYOUT_CLASS = 'p-6 h-full min-h-0 flex items-center';
const PLACEHOLDER_TEXT_CLASS = `${PLACEHOLDER_LAYOUT_CLASS} text-sm text-slate-500`;
const PLACEHOLDER_LOADING_CLASS = `${PLACEHOLDER_LAYOUT_CLASS} gap-2 text-slate-500`;

export const InvitiSection: React.FC = () => {
  const { user } = useUser();
  const { selectWorkspace } = useWorkspacePanelState();
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; slug?: string }>>({});
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadInvites = useCallback(async () => {
    if (!user) return;

    const seq = ++loadSeqRef.current;
    if (isMountedRef.current) setIsLoading(true);

    try {
      const list = await listPendingWorkspaceInvitesForUser(user.id);
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;

      setInvites(list);
      const inviterIds = [...new Set(list.map((invite) => invite.inviterId))];
      const workspaceIds = [...new Set(list.map((invite) => invite.workspaceId))];
      const [loadedProfiles, loadedWorkspaces] = await Promise.all([
        fetchCollaborationUserProfiles(inviterIds),
        Promise.all(
          workspaceIds.map(async (workspaceId) => {
            const workspace = await getWorkspace(workspaceId);
            return [workspaceId, workspace?.name ?? 'Workspace'] as const;
          })
        ),
      ]);
      if (!isMountedRef.current || seq !== loadSeqRef.current) return;

      setProfiles(loadedProfiles);
      setWorkspaceNames(Object.fromEntries(loadedWorkspaces));
    } finally {
      if (isMountedRef.current && seq === loadSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  const handleAccept = async (inviteId: string) => {
    if (!user) return;
    setProcessingId(inviteId);
    try {
      const result = await acceptWorkspaceInvite(user.id, inviteId);
      if (result.success === true && result.invite) {
        const workspace = await getWorkspace(result.invite.workspaceId);
        if (workspace) {
          selectWorkspace(workspace, 'member');
        }
        await loadInvites();
      }
    } finally {
      if (isMountedRef.current) setProcessingId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    if (!user) return;
    setProcessingId(inviteId);
    try {
      const result = await rejectWorkspaceInvite(user.id, inviteId);
      if (result.success) await loadInvites();
    } finally {
      if (isMountedRef.current) setProcessingId(null);
    }
  };

  if (!user) {
    return (
      <div className={PLACEHOLDER_TEXT_CLASS}>
        Accedi per visualizzare gli inviti ricevuti.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={PLACEHOLDER_LOADING_CLASS}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento inviti...
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className={PLACEHOLDER_TEXT_CLASS}>
        Nessun invito a workspace in attesa.
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-4 h-full overflow-y-auto custom-scrollbar">
      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {invites.map((invite) => {
          const profile = profiles[invite.inviterId];
          const isProcessing = processingId === invite.id;

          return (
            <li
              key={invite.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex flex-col gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {workspaceNames[invite.workspaceId] ?? 'Workspace'}
                </p>
                <p className="text-xs text-slate-500">
                  Invito a workspace · Da: {profile?.name ?? 'Utente'}
                  {profile?.slug ? ` (@${profile.slug})` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleAccept(invite.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Accetta
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleReject(invite.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  Rifiuta
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

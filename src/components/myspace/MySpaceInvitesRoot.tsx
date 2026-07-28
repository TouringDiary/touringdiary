import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Mail, X } from 'lucide-react';
import type { WorkspaceInvite } from '@/domain/collaboration';
import {
  acceptWorkspaceInvite,
  fetchCollaborationUserProfiles,
  getWorkspaceNamesByIds,
  listIncomingWorkspaceInvitesForUser,
  listOutgoingWorkspaceInvitesForUser,
  rejectWorkspaceInvite,
  revokeWorkspaceInvite,
} from '@/services/collaboration';
import { useModal } from '@/context/ModalContext';
import { showGlobalAlert } from '@/services/ui/toastService';

type InviteTab = 'received' | 'sent' | 'pending';

function statusLabel(status: WorkspaceInvite['status']): string {
  switch (status) {
    case 'pending':
      return 'In attesa';
    case 'accepted':
      return 'Accettato';
    case 'rejected':
      return 'Rifiutato';
    case 'revoked':
      return 'Revocato';
    default:
      return status;
  }
}

interface Props {
  userId: string;
  onBeforeLeaveMySpace?: () => void;
}

/**
 * Root Inviti Workspace — ricevuti / inviati / pendenti (DOC 35 §10 · DOC 28).
 */
export const MySpaceInvitesRoot: React.FC<Props> = ({ userId, onBeforeLeaveMySpace }) => {
  const { openModal } = useModal();
  const [tab, setTab] = useState<InviteTab>('pending');
  const [incoming, setIncoming] = useState<WorkspaceInvite[]>([]);
  const [outgoing, setOutgoing] = useState<WorkspaceInvite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; slug?: string }>>({});
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const [inList, outList] = await Promise.all([
        listIncomingWorkspaceInvitesForUser(userId),
        listOutgoingWorkspaceInvitesForUser(userId),
      ]);
      if (seq !== loadSeqRef.current) return;
      setIncoming(inList);
      setOutgoing(outList);

      const profileIds = [
        ...new Set([
          ...inList.map((i) => i.inviterId),
          ...outList.map((i) => i.inviteeId),
        ]),
      ];
      const workspaceIds = [
        ...new Set([...inList, ...outList].map((i) => i.workspaceId)),
      ];

      try {
        const [loadedProfiles, loadedWorkspaceNames] = await Promise.all([
          fetchCollaborationUserProfiles(profileIds),
          getWorkspaceNamesByIds(workspaceIds),
        ]);
        if (seq !== loadSeqRef.current) return;
        setProfiles(loadedProfiles);
        setWorkspaceNames(loadedWorkspaceNames);
      } catch (presentationError) {
        console.error('[MySpaceInvitesRoot] presentation data load failed:', presentationError);
        showGlobalAlert(
          'Inviti caricati, ma alcuni nomi (utente o Workspace) non sono disponibili. Verranno mostrati i valori generici.',
        );
      }
    } catch (inviteError) {
      console.error('[MySpaceInvitesRoot] invites load failed:', inviteError);
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pending = useMemo(
    () => incoming.filter((i) => i.status === 'pending'),
    [incoming],
  );

  const visible = useMemo(() => {
    if (tab === 'pending') return pending;
    if (tab === 'received') return incoming;
    return outgoing;
  }, [tab, pending, incoming, outgoing]);

  const openWorkspacePanel = () => {
    onBeforeLeaveMySpace?.();
    openModal('workspace');
  };

  const handleAccept = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const result = await acceptWorkspaceInvite(userId, inviteId);
      if (result.success !== true) {
        showGlobalAlert(result.error || 'Accettazione non riuscita.');
        return;
      }
      showGlobalAlert('Invito accettato. Aprendo Workspace…');
      await reload();
      openWorkspacePanel();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const result = await rejectWorkspaceInvite(userId, inviteId);
      if (result.success !== true) {
        showGlobalAlert(result.error || 'Rifiuto non riuscito.');
        return;
      }
      await reload();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setProcessingId(inviteId);
    try {
      const result = await revokeWorkspaceInvite(userId, inviteId);
      if (result.success !== true) {
        showGlobalAlert(result.error || 'Revoca non riuscita.');
        return;
      }
      await reload();
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 min-h-0 flex items-center justify-center gap-2 text-slate-500 text-sm"
        data-testid="myspace-section-invites"
        role="tabpanel"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento inviti...
      </div>
    );
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3"
      data-testid="myspace-section-invites"
      role="tabpanel"
      aria-label="Inviti Workspace"
    >
      <header className="space-y-1">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-300" aria-hidden />
          Inviti Workspace
        </h2>
        <p className="text-[11px] text-slate-500">
          Ponte verso Workspace (copie DOC 28). Accettare un invito apre il mondo Workspace.
        </p>
      </header>

      <div
        className="flex gap-1 overflow-x-auto custom-scrollbar pb-1"
        role="tablist"
        aria-label="Filtri inviti"
      >
        {(
          [
            { id: 'pending' as const, label: `Pendenti (${pending.length})` },
            { id: 'received' as const, label: `Ricevuti (${incoming.length})` },
            { id: 'sent' as const, label: `Inviati (${outgoing.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              tab === t.id
                ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            data-testid={`myspace-invites-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">
          {tab === 'pending'
            ? 'Nessun invito in attesa.'
            : tab === 'received'
              ? 'Nessun invito ricevuto.'
              : 'Nessun invito inviato.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((invite) => {
            const isProcessing = processingId === invite.id;
            const counterpartId = tab === 'sent' ? invite.inviteeId : invite.inviterId;
            const profile = profiles[counterpartId];
            const counterpartLabel = tab === 'sent' ? 'A' : 'Da';

            return (
              <li
                key={invite.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex flex-col gap-2"
                data-testid={`myspace-invite-${invite.id}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {workspaceNames[invite.workspaceId] ?? 'Workspace'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {counterpartLabel}: {profile?.name ?? 'Utente'}
                    {profile?.slug ? ` (@${profile.slug})` : ''}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {statusLabel(invite.status)} ·{' '}
                    {new Date(invite.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>

                {tab === 'pending' && invite.status === 'pending' ? (
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => void handleAccept(invite.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Accetta
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => void handleReject(invite.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Rifiuta
                    </button>
                  </div>
                ) : null}

                {tab === 'sent' && invite.status === 'pending' ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => void handleRevoke(invite.id)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Revoca
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

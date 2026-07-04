import React, { useEffect, useState } from 'react';
import { BookOpen, Briefcase, FileText, FolderKanban, Loader2, Share2, StickyNote } from 'lucide-react';
import type { User } from '@/types/users';
import type { SharingProfileResourceRow } from '@/services/collaboration/collaborationProfileService';
import { loadSharingProfileOverview } from '@/services/collaboration/collaborationProfileService';
import {
  acceptResourceInvite,
  rejectResourceInvite,
  acceptWorkspaceInvite,
  rejectWorkspaceInvite,
} from '@/services/collaboration';
import { useOpenCollaborationShare } from '@/hooks/useOpenCollaborationShare';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import { useItinerary } from '@/context/ItineraryContext';
import { fetchDiariesByIds } from '@/services/community/itineraryService';
import { useModal } from '@/context/ModalContext';

interface Props {
  user: User;
  onClose: () => void;
}

function ResourceKindIcons({ row }: { row: SharingProfileResourceRow }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-500">
      {row.hasDiary && <BookOpen className="w-3.5 h-3.5" aria-label="Diario" />}
      {row.hasNotes && <StickyNote className="w-3.5 h-3.5" aria-label="Note" />}
      {row.hasSuitcase && <Briefcase className="w-3.5 h-3.5" aria-label="Valigia" />}
      {row.hasTemplate && <FileText className="w-3.5 h-3.5" aria-label="Template" />}
    </div>
  );
}

export const UserSharingTab: React.FC<Props> = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof loadSharingProfileOverview>> | null>(null);
  const openShare = useOpenCollaborationShare();
  const openWorkspace = useOpenCollaborationWorkspace();
  const { loadProject } = useItinerary();
  const { openModal } = useModal();

  useEffect(() => {
    setIsLoading(true);
    void loadSharingProfileOverview(user.id)
      .then(setOverview)
      .finally(() => setIsLoading(false));
  }, [user.id]);

  const reloadOverview = () => {
    void loadSharingProfileOverview(user.id).then(setOverview);
  };

  const handleAcceptResourceInvite = async (inviteId: string) => {
    const result = await acceptResourceInvite(user.id, inviteId);
    if (result.success) reloadOverview();
  };

  const handleRejectResourceInvite = async (inviteId: string) => {
    const result = await rejectResourceInvite(user.id, inviteId);
    if (result.success) reloadOverview();
  };

  const handleAcceptWorkspaceInvite = async (inviteId: string) => {
    const result = await acceptWorkspaceInvite(user.id, inviteId);
    if (result.success) reloadOverview();
  };

  const handleRejectWorkspaceInvite = async (inviteId: string) => {
    const result = await rejectWorkspaceInvite(user.id, inviteId);
    if (result.success) reloadOverview();
  };

  const handleOpen = async (row: SharingProfileResourceRow) => {
    if (row.kind === 'diary') {
      const diaries = await fetchDiariesByIds([row.resourceId]);
      if (diaries[0]) {
        loadProject(diaries[0]);
        onClose();
      }
      return;
    }
    onClose();
    openModal('packingList', { suitcaseId: row.resourceId });
  };

  const allRows = [
    ...(overview?.ownedResources ?? []),
    ...(overview?.memberResources ?? []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Condivisione</h2>
          <p className="text-sm text-slate-400">Risorse condivise, inviti e workspace.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Caricamento...
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Collaborazioni</h3>
            {allRows.length === 0 ? (
              <p className="text-sm text-slate-500">Nessuna collaborazione attiva.</p>
            ) : (
              <ul className="space-y-2">
                {allRows.map((row) => (
                  <li
                    key={`${row.kind}:${row.resourceId}:${row.role}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{row.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ResourceKindIcons row={row} />
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">{row.role}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleOpen(row)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        Apri
                      </button>
                      {row.role === 'owner' && (
                        <button
                          type="button"
                          onClick={() =>
                            openShare({
                              kind: row.kind,
                              resourceId: row.resourceId,
                              resourceTitle: row.title,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300"
                        >
                          Condividi
                        </button>
                      )}
                      {row.workspaceIds[0] && (
                        <button
                          type="button"
                          onClick={() => openWorkspace({ workspaceId: row.workspaceIds[0] })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center gap-1"
                        >
                          <FolderKanban className="w-3 h-3" />
                          Workspace
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Inviti ricevuti</h3>
            {(overview?.incomingResourceInvites.length ?? 0) === 0 &&
            (overview?.incomingWorkspaceInvites.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">Nessun invito in attesa.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-300">
                {overview?.incomingResourceInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                  >
                    <span>Invito a collaborare ({invite.role})</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAcceptResourceInvite(invite.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300"
                      >
                        Accetta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRejectResourceInvite(invite.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
                      >
                        Rifiuta
                      </button>
                    </div>
                  </li>
                ))}
                {overview?.incomingWorkspaceInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                  >
                    <span>Invito a un workspace</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAcceptWorkspaceInvite(invite.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300"
                      >
                        Accetta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRejectWorkspaceInvite(invite.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
                      >
                        Rifiuta
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Workspace</h3>
            {(overview?.workspaces.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">Nessun workspace.</p>
            ) : (
              <ul className="space-y-2">
                {overview?.workspaces.map((workspace) => (
                  <li key={workspace.id}>
                    <button
                      type="button"
                      onClick={() => openWorkspace({ workspaceId: workspace.id })}
                      className="w-full text-left p-3 rounded-xl border border-slate-800 hover:border-indigo-500/40 bg-slate-900/40"
                    >
                      <p className="text-sm font-semibold text-white">{workspace.name}</p>
                      {workspace.description && (
                        <p className="text-xs text-slate-500 truncate">{workspace.description}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

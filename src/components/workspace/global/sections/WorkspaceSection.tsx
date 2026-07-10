import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderKanban, Loader2, Plus } from 'lucide-react';
import type { Workspace } from '@/domain/collaboration';
import {
  listWorkspacesForUser,
  getWorkspaceMemberCounts,
  leaveWorkspace,
  deleteWorkspace,
  MAX_OWNED_WORKSPACES_PER_USER,
  OWNED_WORKSPACE_LIMIT_MESSAGE,
} from '@/services/collaboration';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useUser } from '@/context/UserContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useOpenCollaborationShare } from '@/hooks/useOpenCollaborationShare';
import { isGuestUser } from '@/collaboration/guestGate';
import { useModal } from '@/context/ModalContext';
import { useWorkspacePanelState } from '../WorkspacePanelContext';
import type { WorkspaceActiveRole } from '../globalWorkspacePresentation';
import { WorkspaceCard } from './WorkspaceCard';

export const WorkspaceSection: React.FC = () => {
  const { user } = useUser();
  const { openModal } = useModal();
  const { itinerary } = useItinerary();
  const openShare = useOpenCollaborationShare();
  const { activeWorkspaceId, selectWorkspace, clearActiveWorkspace } = useWorkspacePanelState();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'leave' | 'delete'; workspace: Workspace }
    | null
  >(null);

  useEffect(() => {
    if (!user || isGuestUser(user)) return;

    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const list = await listWorkspacesForUser(user.id);
        if (cancelled) return;
        setWorkspaces(list);
        const counts = await getWorkspaceMemberCounts(list.map((w) => w.id));
        if (cancelled) return;
        setMemberCounts(counts);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const { owned, member } = useMemo(() => {
    if (!user) return { owned: [] as Workspace[], member: [] as Workspace[] };
    const ownedList = workspaces.filter((w) => w.ownerId === user.id);
    const memberList = workspaces.filter((w) => w.ownerId !== user.id);
    return { owned: ownedList, member: memberList };
  }, [workspaces, user]);

  const isOwnerLimitReached = owned.length >= MAX_OWNED_WORKSPACES_PER_USER;

  const handleCreateWorkspace = () => {
    if (!itinerary.id || isOwnerLimitReached) return;
    openShare({
      kind: 'diary',
      resourceId: itinerary.id,
      resourceTitle: itinerary.name?.trim() || 'Diario di Viaggio',
    });
  };

  const reloadWorkspaces = useCallback(async () => {
    if (!user || isGuestUser(user)) return;
    setIsLoading(true);
    try {
      const list = await listWorkspacesForUser(user.id);
      setWorkspaces(list);
      const counts = await getWorkspaceMemberCounts(list.map((w) => w.id));
      setMemberCounts(counts);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleConfirmAction = async () => {
    if (!pendingAction || !user) return;
    setIsActionSubmitting(true);
    setActionError(null);
    try {
      const result =
        pendingAction.type === 'leave'
          ? await leaveWorkspace(pendingAction.workspace.id, user.id)
          : await deleteWorkspace(pendingAction.workspace.id, user.id);
      if (result.success) {
        setPendingAction(null);
        clearActiveWorkspace();
        await reloadWorkspaces();
      } else {
        setActionError(result.error ?? 'Operazione fallita.');
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  if (!user || isGuestUser(user)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 h-full min-h-[8rem]">
        <FolderKanban className="w-10 h-10 text-indigo-400 mb-3 opacity-60" />
        <h3 className="text-base font-bold text-white mb-1">Accedi ai tuoi Workspace</h3>
        <p className="text-sm text-slate-400 max-w-md mb-4">
          Effettua l&apos;accesso per visualizzare e gestire i tuoi spazi di collaborazione.
        </p>
        <button
          type="button"
          onClick={() => openModal('auth', { returnTo: 'collaborationWorkspace' })}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm uppercase tracking-wide transition-colors"
        >
          Accedi
        </button>
      </div>
    );
  }

  const renderColumn = (
    title: string,
    list: Workspace[],
    role: WorkspaceActiveRole,
    emptyMessage: string,
  ) => (
    <section className="flex flex-col min-h-0 min-w-0 rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
      <header className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400/90">
          {title}
        </h3>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {list.length} workspace
        </p>
      </header>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-[6rem] max-h-[11rem] lg:max-h-none">
        {list.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 px-1 leading-relaxed">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {list.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                role={role}
                memberCount={memberCounts[workspace.id] ?? 0}
                isActive={activeWorkspaceId === workspace.id}
                onSelect={() => selectWorkspace(workspace, role)}
                compact
                onLeave={
                  activeWorkspaceId === workspace.id && role === 'member'
                    ? () => {
                        setActionError(null);
                        setPendingAction({ type: 'leave', workspace });
                      }
                    : undefined
                }
                onDelete={
                  activeWorkspaceId === workspace.id && role === 'owner'
                    ? () => {
                        setActionError(null);
                        setPendingAction({ type: 'delete', workspace });
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="p-3 lg:p-4 h-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          I tuoi Workspace
        </h2>
        <button
          type="button"
          onClick={handleCreateWorkspace}
          disabled={!itinerary.id || isOwnerLimitReached}
          title={isOwnerLimitReached ? OWNED_WORKSPACE_LIMIT_MESSAGE : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Crea Workspace
        </button>
      </div>

      {isOwnerLimitReached && (
        <p className="text-xs text-amber-400/90 mb-3 leading-relaxed">
          {OWNED_WORKSPACE_LIMIT_MESSAGE}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Caricamento...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {renderColumn(
            'Workspace Proprietario',
            owned,
            'owner',
            'Non hai creato ancora Workspace. Crea un Workspace per condividere e modificare i documenti con altri utenti.',
          )}
          {renderColumn(
            'Workspace Membro',
            member,
            'member',
            'Non sei membro di nessun Workspace.',
          )}
        </div>
      )}

      {pendingAction && (
        <DeleteConfirmationModal
          isOpen
          onClose={() => {
            setActionError(null);
            setPendingAction(null);
          }}
          onConfirm={handleConfirmAction}
          title={pendingAction.type === 'leave' ? 'Abbandona Workspace' : 'Elimina Workspace'}
          message={
            pendingAction.type === 'leave'
              ? `Stai per uscire definitivamente dal workspace "${pendingAction.workspace.name}". Perderai l'accesso a tutte le risorse condivise. Potrai rientrare solo con un nuovo invito.`
              : `Eliminando il Workspace verranno eliminate definitivamente tutti gli elementi condivisi (Diari, Valigie, Allegati e altri contenuti).\n\nQuesta operazione è irreversibile e coinvolgerà anche tutti i membri del Workspace.`
          }
          isDeleting={isActionSubmitting}
          confirmLabel={pendingAction.type === 'leave' ? 'Abbandona' : 'Elimina'}
          cancelLabel="Annulla"
          variant={pendingAction.type === 'leave' ? 'warning' : 'danger'}
        >
          {actionError && (
            <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {actionError}
            </div>
          )}
        </DeleteConfirmationModal>
      )}
    </div>
  );
};

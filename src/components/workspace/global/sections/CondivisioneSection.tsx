import React, { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Z_MODAL_NESTED } from '@/constants/zIndex';
import { useUser } from '@/context/UserContext';
import { useWorkspaceDashboard } from '@/hooks/useWorkspaceDashboard';
import { useWorkspaceResourceNavigation } from '@/hooks/useWorkspaceResourceNavigation';
import { useOpenAddElementToWorkspace } from '@/hooks/useOpenAddElementToWorkspace';
import { WorkspaceResourcesSection } from '@/components/collaboration/workspace/WorkspaceResourcesSection';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { SharedResourceKind } from '@/domain/collaboration';
import { getSharedResourceKindLabel, workspaceResourceKey } from '@/domain/collaboration';
import { readWorkspaceViaggioShellSettings } from '@/domain/collaboration/workspaceViaggioShell';
import { savePersonalCopyFromWorkspace } from '@/services/collaboration';
import { useWorkspacePanelState } from '../WorkspacePanelContext';
import { WorkspaceViaggioShellNav } from '../WorkspaceViaggioShellNav';

interface PendingPersonalCopy {
  kind: SharedResourceKind;
  resourceId: string;
  title: string;
}

export const CondivisioneSection: React.FC = () => {
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspacePanelState();
  const { openResource } = useWorkspaceResourceNavigation();
  const openAddElementToWorkspace = useOpenAddElementToWorkspace();

  const dashboard = useWorkspaceDashboard(activeWorkspaceId, user?.id);

  const [pendingCopy, setPendingCopy] = useState<PendingPersonalCopy | null>(null);
  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(null);
  const [savingCopyResourceKey, setSavingCopyResourceKey] = useState<string | null>(null);

  const resolveResourceTitle = useCallback(
    (kind: SharedResourceKind, resourceId: string): string => {
      const label = dashboard.resourceLabels.find(
        (entry) => entry.kind === kind && entry.resourceId === resourceId
      );
      return label?.title ?? getSharedResourceKindLabel(kind);
    },
    [dashboard.resourceLabels]
  );

  const handleRequestSavePersonalCopy = useCallback(
    (kind: SharedResourceKind, resourceId: string) => {
      setCopyError(null);
      setCopySuccessMessage(null);
      setPendingCopy({
        kind,
        resourceId,
        title: resolveResourceTitle(kind, resourceId),
      });
    },
    [resolveResourceTitle]
  );

  const handleConfirmSavePersonalCopy = useCallback(async () => {
    if (!pendingCopy || !user?.id || !activeWorkspaceId || isSavingCopy) {
      return;
    }

    const resourceKey = workspaceResourceKey(pendingCopy.kind, pendingCopy.resourceId);
    setIsSavingCopy(true);
    setSavingCopyResourceKey(resourceKey);
    setCopyError(null);

    const result = await savePersonalCopyFromWorkspace(
      user.id,
      activeWorkspaceId,
      pendingCopy.kind,
      pendingCopy.resourceId
    );

    setIsSavingCopy(false);
    setSavingCopyResourceKey(null);

    if (result.success !== true) {
      setCopyError(result.error);
      return;
    }

    setPendingCopy(null);
    setCopySuccessMessage(
      `Copia personale di «${pendingCopy.title}» creata nel tuo spazio. È indipendente da questo Workspace.`
    );
  }, [activeWorkspaceId, isSavingCopy, pendingCopy, user?.id]);

  const viaggioShell = readWorkspaceViaggioShellSettings(dashboard.workspace?.settings);
  const shellResources = useMemo(() => {
    return dashboard.resources.map((resource) => {
      const label = dashboard.resourceLabels.find(
        (entry) => entry.kind === resource.kind && entry.resourceId === resource.resourceId
      );
      return {
        kind: resource.kind,
        resourceId: resource.resourceId,
        title: label?.title ?? getSharedResourceKindLabel(resource.kind),
      };
    });
  }, [dashboard.resourceLabels, dashboard.resources]);

  if (!activeWorkspaceId || !user) {
    return null;
  }

  if (dashboard.isLoading && !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-slate-500 h-full min-h-0 flex items-center">
        Caricamento condivisione...
      </div>
    );
  }

  if (dashboard.error || !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-red-300 h-full min-h-0 flex items-center">
        {dashboard.error ?? 'Workspace non disponibile.'}
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-4 h-full min-h-0 overflow-y-auto custom-scrollbar space-y-4">
      {dashboard.isOwner && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => openAddElementToWorkspace(activeWorkspaceId)}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Aggiungi elemento
          </button>
        </div>
      )}

      {copySuccessMessage && (
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          role="status"
        >
          {copySuccessMessage}
        </div>
      )}

      {viaggioShell && (
        <WorkspaceViaggioShellNav
          shell={viaggioShell}
          resources={shellResources}
          onOpenResource={(kind, resourceId) => void openResource(kind, resourceId)}
        />
      )}

      <WorkspaceResourcesSection
        resources={dashboard.resources}
        resourceLabels={dashboard.resourceLabels}
        isOwner={dashboard.isOwner}
        isSubmitting={isSavingCopy}
        onOpenResource={(kind, resourceId) => void openResource(kind, resourceId)}
        onRequestRemoveResource={() => {}}
        onRequestSavePersonalCopy={handleRequestSavePersonalCopy}
        savingCopyResourceKey={savingCopyResourceKey}
        sectionTitle={viaggioShell ? 'RISORSE CONDIVISE (elenco)' : 'IN CONDIVISIONE'}
        layout="hub"
        hideRemoveActions
      />

      {pendingCopy && (
        <DeleteConfirmationModal
          isOpen
          zIndex={Z_MODAL_NESTED}
          onClose={() => {
            if (isSavingCopy) return;
            setCopyError(null);
            setPendingCopy(null);
          }}
          onConfirm={() => void handleConfirmSavePersonalCopy()}
          title="Salva una copia"
          message={`Stai per creare una copia personale di «${pendingCopy.title}» nel tuo spazio.\n\nLa copia sarà completamente indipendente da questo Workspace: non resterà collegata al gruppo e le modifiche future non saranno condivise con gli altri membri.`}
          isDeleting={isSavingCopy}
          confirmLabel="Crea copia"
          cancelLabel="Annulla"
          variant="info"
          loadingLabel="Creazione copia..."
        >
          {copyError && (
            <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {copyError}
            </div>
          )}
        </DeleteConfirmationModal>
      )}
    </div>
  );
};

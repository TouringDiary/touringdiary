import React from 'react';
import { useUser } from '@/context/UserContext';
import { useWorkspaceDashboard } from '@/hooks/useWorkspaceDashboard';
import { useWorkspaceResourceNavigation } from '@/hooks/useWorkspaceResourceNavigation';
import { WorkspaceResourcesSection } from '@/components/collaboration/workspace/WorkspaceResourcesSection';
import { useWorkspacePanelState } from '../WorkspacePanelContext';

export const CondivisioneSection: React.FC = () => {
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspacePanelState();
  const { openResource } = useWorkspaceResourceNavigation();

  const dashboard = useWorkspaceDashboard(activeWorkspaceId, user?.id);

  if (!activeWorkspaceId || !user) {
    return null;
  }

  if (dashboard.isLoading && !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-slate-500">Caricamento condivisione...</div>
    );
  }

  if (dashboard.error || !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-red-300">{dashboard.error ?? 'Workspace non disponibile.'}</div>
    );
  }

  return (
    <div className="p-3 lg:p-4 h-full">
      <WorkspaceResourcesSection
        resources={dashboard.resources}
        resourceLabels={dashboard.resourceLabels}
        isOwner={dashboard.isOwner}
        isSubmitting={false}
        onOpenResource={(kind, resourceId) => void openResource(kind, resourceId)}
        onRequestRemoveResource={() => {}}
        sectionTitle="IN CONDIVISIONE"
        layout="hub"
        hideRemoveActions
      />
    </div>
  );
};

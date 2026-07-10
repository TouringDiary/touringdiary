import React from 'react';
import { CollaborationActivityFeed } from '@/components/collaboration/live/CollaborationActivityFeed';
import { useWorkspacePanelState } from '../WorkspacePanelContext';

export const AttivitaSection: React.FC = () => {
  const { activeWorkspaceId } = useWorkspacePanelState();

  if (!activeWorkspaceId) return null;

  return (
    <div className="p-3 lg:p-4 h-full">
      <CollaborationActivityFeed
        workspaceId={activeWorkspaceId}
        layout="hub"
        className="h-full"
      />
    </div>
  );
};

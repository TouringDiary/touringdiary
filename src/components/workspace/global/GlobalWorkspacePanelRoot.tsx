import React from 'react';
import { useModal } from '@/context/ModalContext';
import { GlobalWorkspacePanel } from './GlobalWorkspacePanel';
import { WorkspacePanelProvider } from './WorkspacePanelContext';
import type { WorkspacePanelSection } from './globalWorkspacePresentation';

/**
 * Entry lazy del hub Workspace: Provider + panel nello stesso chunk.
 * Fuori dal bootstrap Home — montato solo quando `activeModal === collaborationWorkspace`.
 */
export const GlobalWorkspacePanelRoot: React.FC = () => {
  const { activeModal, modalProps } = useModal();
  const isPanelOpen = activeModal === 'collaborationWorkspace';

  return (
    <WorkspacePanelProvider
      isPanelOpen={isPanelOpen}
      initialWorkspaceId={
        typeof modalProps?.workspaceId === 'string' ? modalProps.workspaceId : undefined
      }
      initialSection={modalProps?.initialSection as WorkspacePanelSection | undefined}
    >
      <GlobalWorkspacePanel />
    </WorkspacePanelProvider>
  );
};

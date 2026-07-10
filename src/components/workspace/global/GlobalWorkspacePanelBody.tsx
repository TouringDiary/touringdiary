import React from 'react';
import {
  WORKSPACE_OPERATIONAL_SECTIONS,
  type WorkspacePanelSection,
} from './globalWorkspacePresentation';
import { useWorkspacePanelState } from './WorkspacePanelContext';
import { WorkspaceSectionNav } from './WorkspaceSectionNav';
import { WorkspaceActiveContextBar } from './WorkspaceActiveContextBar';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { CondivisioneSection } from './sections/CondivisioneSection';
import { AttivitaSection } from './sections/AttivitaSection';
import { UtentiSection } from './sections/UtentiSection';
import { InvitiSection } from './sections/InvitiSection';
import { AllegatiSection } from './sections/AllegatiSection';

export const GlobalWorkspacePanelBody: React.FC = () => {
  const {
    activeSection,
    activeWorkspace,
    activeWorkspaceRole,
    navigateToSection,
  } = useWorkspacePanelState();

  const showContextBar =
    activeWorkspace &&
    activeWorkspaceRole &&
    WORKSPACE_OPERATIONAL_SECTIONS.includes(activeSection);

  const renderSection = () => {
    const panelId = `workspace-hub-panel-${activeSection}`;
    switch (activeSection) {
      case 'workspace':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <WorkspaceSection />
          </div>
        );
      case 'condivisione':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <CondivisioneSection />
          </div>
        );
      case 'attivita':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <AttivitaSection />
          </div>
        );
      case 'allegati':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <AllegatiSection />
          </div>
        );
      case 'utenti':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <UtentiSection />
          </div>
        );
      case 'inviti':
        return (
          <div id={panelId} role="tabpanel" aria-labelledby={`workspace-hub-tab-${activeSection}`}>
            <InvitiSection />
          </div>
        );
      default: {
        const exhaustive: never = activeSection;
        return exhaustive;
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden rounded-b-xl h-full">
      <div className="flex flex-col xl:flex-row shrink-0 border-b border-slate-800">
        <WorkspaceSectionNav activeSection={activeSection} onNavigate={navigateToSection} />
        {showContextBar && (
          <WorkspaceActiveContextBar
            workspaceName={activeWorkspace.name}
            role={activeWorkspaceRole}
            layout="inline"
          />
        )}
      </div>
      {showContextBar && (
        <WorkspaceActiveContextBar
          workspaceName={activeWorkspace.name}
          role={activeWorkspaceRole}
          layout="bar"
        />
      )}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">{renderSection()}</div>
    </div>
  );
};

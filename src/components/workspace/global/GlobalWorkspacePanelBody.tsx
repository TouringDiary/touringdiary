import type React from 'react';
import { WORKSPACE_HUB_TABPANEL_CLASS } from '@/constants/workspacePanelLayout';
import { WORKSPACE_OPERATIONAL_SECTIONS } from './globalWorkspacePresentation';
import { AllegatiSection } from './sections/AllegatiSection';
import { AttivitaSection } from './sections/AttivitaSection';
import { CondivisioneSection } from './sections/CondivisioneSection';
import { InvitiSection } from './sections/InvitiSection';
import { UtentiSection } from './sections/UtentiSection';
import { WorkspaceSection } from './sections/WorkspaceSection';
import { WorkspaceActiveContextBar } from './WorkspaceActiveContextBar';
import { useWorkspacePanelState } from './WorkspacePanelContext';
import { WorkspaceSectionNav } from './WorkspaceSectionNav';

export const GlobalWorkspacePanelBody: React.FC = () => {
  const { activeSection, activeWorkspace, activeWorkspaceRole, navigateToSection } =
    useWorkspacePanelState();

  const showContextBar =
    activeWorkspace &&
    activeWorkspaceRole &&
    WORKSPACE_OPERATIONAL_SECTIONS.includes(activeSection);

  const renderSection = () => {
    const panelId = `workspace-hub-panel-${activeSection}`;
    // Scroll delegato alle singole *Section* — vedi WORKSPACE_HUB_TABPANEL_CLASS in workspacePanelLayout.
    switch (activeSection) {
      case 'workspace':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
            <WorkspaceSection />
          </div>
        );
      case 'condivisione':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
            <CondivisioneSection />
          </div>
        );
      case 'attivita':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
            <AttivitaSection />
          </div>
        );
      case 'allegati':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
            <AllegatiSection />
          </div>
        );
      case 'utenti':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
            <UtentiSection />
          </div>
        );
      case 'inviti':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`workspace-hub-tab-${activeSection}`}
            className={WORKSPACE_HUB_TABPANEL_CLASS}
          >
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
    <div className="flex flex-col flex-1 min-h-0 bg-slate-900 border border-indigo-500/20 shadow-2xl overflow-hidden rounded-b-xl">
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
      {/* Area sezione: altezza fissa ereditata dal binder; overflow solo nelle *Section*. */}
      <div className="flex-1 min-h-0 overflow-hidden">{renderSection()}</div>
    </div>
  );
};

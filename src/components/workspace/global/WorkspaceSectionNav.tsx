import React from 'react';
import {
  WORKSPACE_PANEL_SECTIONS,
  WORKSPACE_PANEL_SECTION_LABELS,
  type WorkspacePanelSection,
} from './globalWorkspacePresentation';

interface Props {
  activeSection: WorkspacePanelSection;
  onNavigate: (section: WorkspacePanelSection) => void;
}

/**
 * Barra sezioni hub — griglia su desktop largo, scroll orizzontale su mobile.
 */
export const WorkspaceSectionNav: React.FC<Props> = ({ activeSection, onNavigate }) => (
  <nav
    className="
      flex lg:grid lg:grid-cols-6
      border-b border-slate-800 bg-slate-950/80 shrink-0 overflow-x-auto lg:overflow-visible
      flex-1 min-w-0
    "
    role="tablist"
    aria-label="Sezioni workspace"
  >
    {WORKSPACE_PANEL_SECTIONS.map((section) => {
      const isActive = activeSection === section;
      return (
        <button
          key={section}
          type="button"
          role="tab"
          aria-selected={isActive}
          id={`workspace-hub-tab-${section}`}
          aria-controls={`workspace-hub-panel-${section}`}
          onClick={() => onNavigate(section)}
          className={`
            relative px-3 lg:px-2 xl:px-4 py-2.5 text-[10px] xl:text-xs font-bold uppercase tracking-wider whitespace-nowrap
            transition-colors shrink-0 border-b-2 text-center
            ${isActive
              ? 'border-indigo-500 text-white bg-slate-900/60'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'}
          `}
        >
          {WORKSPACE_PANEL_SECTION_LABELS[section]}
        </button>
      );
    })}
  </nav>
);

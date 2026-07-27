import React from 'react';
import { useUser } from '@/context/UserContext';
import { useWorkspaceDashboard } from '@/hooks/useWorkspaceDashboard';
import { useWorkspacePanelState } from '../WorkspacePanelContext';
import { WORKSPACE_ATTACHMENT_CATEGORY_LABELS } from '../globalWorkspacePresentation';
import { WORKSPACE_ATTACHMENT_CATEGORIES } from '@/domain/collaboration/workspaceAttachment';
import { AllegatiCategoryPanel } from './AllegatiCategoryPanel';

export const AllegatiSection: React.FC = () => {
  const { user } = useUser();
  const { activeWorkspaceId, allegatiCategory, setAllegatiCategory } = useWorkspacePanelState();
  const dashboard = useWorkspaceDashboard(activeWorkspaceId, user?.id);

  if (!activeWorkspaceId || !user) {
    return (
      <div className="p-6 text-sm text-slate-500 h-full min-h-0 flex items-center">
        Seleziona un workspace per gestire gli allegati.
      </div>
    );
  }

  if (dashboard.isLoading && !dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-slate-500 h-full min-h-0 flex items-center">
        Caricamento allegati...
      </div>
    );
  }

  if (!dashboard.workspace) {
    return (
      <div className="p-6 text-sm text-red-300 h-full min-h-0 flex items-center">
        Workspace non disponibile.
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-4 h-full flex flex-col min-h-0">
      <p className="text-[11px] text-slate-500 px-1 mb-2 shrink-0">
        Allegati di questo Workspace (gruppo). Non sono gli Allegati del Viaggio in MySpace:
        ownership e lifecycle restano separati.
      </p>
      <nav
        className="flex gap-1 overflow-x-auto pb-3 mb-3 border-b border-slate-800 shrink-0 custom-scrollbar"
        role="tablist"
        aria-label="Categorie allegati"
      >
        {WORKSPACE_ATTACHMENT_CATEGORIES.map((category) => {
          const isActive = allegatiCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`workspace-allegati-tab-${category}`}
              aria-controls={`workspace-allegati-panel-${category}`}
              onClick={() => setAllegatiCategory(category)}
              className={`
                shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors
                ${isActive
                  ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'}
              `}
            >
              {WORKSPACE_ATTACHMENT_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </nav>

      <div
        id={`workspace-allegati-panel-${allegatiCategory}`}
        role="tabpanel"
        aria-labelledby={`workspace-allegati-tab-${allegatiCategory}`}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
      >
        <AllegatiCategoryPanel
          workspaceId={activeWorkspaceId}
          workspaceOwnerId={dashboard.workspace.ownerId}
          category={allegatiCategory}
          user={user}
          isOwner={dashboard.isOwner}
        />
      </div>
    </div>
  );
};

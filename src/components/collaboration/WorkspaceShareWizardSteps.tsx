import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Workspace } from '@/domain/collaboration';
import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import { CollaborationUserInviteSearch } from './CollaborationUserInviteSearch';
import {
  buildCompositionCandidateMetadata,
  CompositionSelectableRow,
} from './compositionSelectableRow';

export { WorkspaceInviteStep } from './WorkspaceInviteStep';
export {
  WorkspacePickElementStep,
  type WorkspacePickedElement,
} from './WorkspacePickElementStep';

interface WorkspaceSetupStepProps {
  workspaceName: string;
  workspaceDescription: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const WorkspaceSetupStep: React.FC<WorkspaceSetupStepProps> = ({
  workspaceName,
  workspaceDescription,
  onNameChange,
  onDescriptionChange,
}) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Nome Workspace
      </label>
      <input
        type="text"
        value={workspaceName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Es. Giappone 2028"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
      />
    </div>
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Descrizione (opzionale)
      </label>
      <textarea
        value={workspaceDescription}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={3}
        placeholder="Breve descrizione del progetto condiviso"
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none"
      />
    </div>
  </div>
);

interface WorkspaceCompositionStepProps {
  blueprint: WorkspaceCompositionBlueprint;
  draft: WorkspaceCompositionDraft;
  isExpandingDiary?: boolean;
  catalogMode?: boolean;
  onSelectDiary: (diaryId: string | null) => void;
  onToggleSuitcase: (suitcaseId: string) => void;
  onToggleUserTemplate: (templateId: string) => void;
}

export const WorkspaceCompositionStep: React.FC<WorkspaceCompositionStepProps> = ({
  blueprint,
  draft,
  isExpandingDiary = false,
  catalogMode = false,
  onSelectDiary,
  onToggleSuitcase,
  onToggleUserTemplate,
}) => {
  const diaryCount = blueprint.diary.candidates.length;
  const suitcaseCount = blueprint.suitcases.candidates.length;
  const templateCount = blueprint.userTemplates.candidates.length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400 leading-relaxed">
        {catalogMode
          ? 'Scegli quali elementi includere nel Workspace.'
          : 'Scegli quali risorse includere nel Workspace. Puoi modificarle liberamente prima della creazione.'}
      </p>

      <section className="space-y-2" aria-labelledby="workspace-composition-diary-heading">
        <h4
          id="workspace-composition-diary-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Diario di Viaggio ({diaryCount})
        </h4>
        {blueprint.diary.candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            {catalogMode ? 'Nessun elemento Diario disponibile.' : 'Nessun Diario collegato disponibile.'}
          </p>
        ) : (
          <ul
            className="space-y-2"
            role={blueprint.diary.mode === 'single_optional' ? 'radiogroup' : undefined}
            aria-label="Diario di Viaggio"
          >
            {blueprint.diary.mode === 'single_optional' && (
              <li>
                <CompositionSelectableRow
                  inputType="radio"
                  selected={draft.selectedDiaryId === null}
                  title="Nessun Diario"
                  subtitle="Non includere un Diario"
                  onClick={() => onSelectDiary(null)}
                />
              </li>
            )}
            {blueprint.diary.candidates.map((candidate) => (
              <li key={candidate.resourceId}>
                <CompositionSelectableRow
                  inputType={blueprint.diary.mode === 'fixed' ? 'checkbox' : 'radio'}
                  selected={draft.selectedDiaryId === candidate.resourceId}
                  title={candidate.title}
                  subtitle={buildCompositionCandidateMetadata('Diario', candidate, catalogMode)}
                  disabled={blueprint.diary.mode === 'fixed'}
                  onClick={() => {
                    if (blueprint.diary.mode === 'fixed') return;
                    onSelectDiary(
                      draft.selectedDiaryId === candidate.resourceId
                        ? null
                        : candidate.resourceId
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="workspace-composition-suitcases-heading">
        <h4
          id="workspace-composition-suitcases-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Valigie ({suitcaseCount})
        </h4>
        {isExpandingDiary ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Caricamento valigie collegate…
          </div>
        ) : blueprint.suitcases.candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            {catalogMode ? 'Nessun elemento Valigia disponibile.' : 'Nessuna Valigia disponibile.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {blueprint.suitcases.candidates.map((candidate) => (
              <li key={candidate.resourceId}>
                <CompositionSelectableRow
                  inputType="checkbox"
                  selected={draft.selectedSuitcaseIds.has(candidate.resourceId)}
                  title={candidate.title}
                  subtitle={buildCompositionCandidateMetadata('Valigia', candidate, catalogMode)}
                  onClick={() => onToggleSuitcase(candidate.resourceId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="workspace-composition-templates-heading">
        <h4
          id="workspace-composition-templates-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          Template User ({templateCount})
        </h4>
        {isExpandingDiary ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Caricamento template collegati…
          </div>
        ) : blueprint.userTemplates.candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            {catalogMode
              ? 'Nessun elemento Template disponibile.'
              : 'Nessun Template User disponibile.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {blueprint.userTemplates.candidates.map((candidate) => (
              <li key={candidate.resourceId}>
                <CompositionSelectableRow
                  inputType="checkbox"
                  selected={draft.selectedUserTemplateIds.has(candidate.resourceId)}
                  title={candidate.title}
                  subtitle={buildCompositionCandidateMetadata('Template', candidate, catalogMode)}
                  onClick={() => onToggleUserTemplate(candidate.resourceId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

interface WorkspaceSelectStepProps {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
}

export const WorkspaceSelectStep: React.FC<WorkspaceSelectStepProps> = ({
  workspaces,
  selectedWorkspaceId,
  onSelect,
}) => (
  <div className="space-y-3">
    {workspaces.length === 0 ? (
      <p className="text-sm text-slate-500">Non hai ancora Workspace disponibili.</p>
    ) : (
      <ul className="space-y-2">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <button
              type="button"
              onClick={() => onSelect(workspace.id)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                selectedWorkspaceId === workspace.id
                  ? 'border-indigo-500/60 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <p className="text-sm font-semibold text-white truncate">{workspace.name}</p>
              {workspace.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{workspace.description}</p>
              )}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

interface WorkspaceInviteSearchProps {
  searchQuery: string;
  searchResults: CollaborationUserSearchResult[];
  isSearching: boolean;
  onSearchQueryChange: (query: string) => void;
  onAddInvite: (result: CollaborationUserSearchResult) => void;
}

export const WorkspaceInviteSearch: React.FC<WorkspaceInviteSearchProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  onSearchQueryChange,
  onAddInvite,
}) => (
  <CollaborationUserInviteSearch
    searchQuery={searchQuery}
    onSearchQueryChange={onSearchQueryChange}
    searchResults={searchResults}
    isSearching={isSearching}
    onSelectUser={onAddInvite}
    placeholder="Cerca per email o Nome utente"
    showSearchIcon={false}
  />
);

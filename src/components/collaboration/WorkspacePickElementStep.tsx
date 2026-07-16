import React from 'react';
import type { SharedResourceKind } from '@/domain/collaboration';
import { getSharedResourceKindLabel } from '@/domain/collaboration';
import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionCandidate,
} from '@/domain/collaboration/workspaceComposition';
import {
  buildCompositionCandidateMetadata,
  CompositionSelectableRow,
} from './compositionSelectableRow';

export interface WorkspacePickedElement {
  kind: SharedResourceKind;
  resourceId: string;
}

interface WorkspacePickElementStepProps {
  blueprint: WorkspaceCompositionBlueprint;
  selected: WorkspacePickedElement | null;
  onSelect: (element: WorkspacePickedElement | null) => void;
}

export const WorkspacePickElementStep: React.FC<WorkspacePickElementStepProps> = ({
  blueprint,
  selected,
  onSelect,
}) => {
  const isSelected = (kind: SharedResourceKind, resourceId: string) =>
    selected?.kind === kind && selected.resourceId === resourceId;

  const togglePick = (kind: SharedResourceKind, candidate: WorkspaceCompositionCandidate) => {
    if (isSelected(kind, candidate.resourceId)) {
      onSelect(null);
      return;
    }
    onSelect({ kind, resourceId: candidate.resourceId });
  };

  const renderSection = (
    heading: string,
    kind: SharedResourceKind,
    candidates: WorkspaceCompositionCandidate[],
    emptyLabel: string
  ) => (
    <section className="space-y-2" aria-labelledby={`workspace-pick-${kind}-heading`}>
      <h4
        id={`workspace-pick-${kind}-heading`}
        className="text-xs font-bold uppercase tracking-wider text-slate-400"
      >
        {heading} ({candidates.length})
      </h4>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2" role="radiogroup" aria-label={heading}>
          {candidates.map((candidate) => (
            <li key={candidate.resourceId}>
              <CompositionSelectableRow
                inputType="radio"
                selected={isSelected(kind, candidate.resourceId)}
                title={candidate.title}
                subtitle={buildCompositionCandidateMetadata(
                  getSharedResourceKindLabel(kind),
                  candidate,
                  true
                )}
                onClick={() => togglePick(kind, candidate)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400 leading-relaxed">
        Scegli un elemento personale da aggiungere al Workspace.
      </p>
      {renderSection(
        'Diario di Viaggio',
        'diary',
        blueprint.diary.candidates,
        'Nessun elemento Diario disponibile.'
      )}
      {renderSection(
        'Valigie',
        'suitcase',
        blueprint.suitcases.candidates,
        'Nessun elemento Valigia disponibile.'
      )}
      {renderSection(
        'Template User',
        'user_template',
        blueprint.userTemplates.candidates,
        'Nessun elemento Template disponibile.'
      )}
    </div>
  );
};

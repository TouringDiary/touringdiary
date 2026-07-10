import React, { useMemo } from 'react';
import { BookOpen, Briefcase, ExternalLink, FileStack, Trash2 } from 'lucide-react';
import type { SharedResourceKind } from '@/domain/collaboration';
import { getSharedResourceKindLabel, workspaceResourceKey } from '@/domain/collaboration';
import type { WorkspaceResource } from '@/domain/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { buildWorkspaceResourceLabelMap } from '@/services/collaboration';

const KIND_ICONS: Record<SharedResourceKind, React.ReactNode> = {
  diary: <BookOpen className="w-4 h-4" />,
  suitcase: <Briefcase className="w-4 h-4" />,
  user_template: <FileStack className="w-4 h-4" />,
};

interface Props {
  resources: WorkspaceResource[];
  resourceLabels: WorkspaceResourceLabel[];
  isOwner: boolean;
  isSubmitting: boolean;
  onOpenResource: (kind: SharedResourceKind, resourceId: string) => void;
  onRequestRemoveResource: (workspaceResourceId: string) => void;
  /** Override titolo sezione (default: Risorse nel Workspace). */
  sectionTitle?: string;
  /** hub = griglia orizzontale senza moduli futuri; legacy = lista verticale + moduli futuri. */
  layout?: 'hub' | 'legacy';
  hideRemoveActions?: boolean;
}

export const WorkspaceResourcesSection: React.FC<Props> = ({
  resources,
  resourceLabels,
  isOwner,
  isSubmitting,
  onOpenResource,
  onRequestRemoveResource,
  sectionTitle = 'Risorse nel Workspace',
  layout = 'legacy',
  hideRemoveActions = false,
}) => {
  const labelByKey = useMemo(
    () => buildWorkspaceResourceLabelMap(resourceLabels),
    [resourceLabels]
  );

  const isHub = layout === 'hub';

  const listClass = isHub
    ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2'
    : 'space-y-2';

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          {sectionTitle}
        </h3>
        {resources.length === 0 ? (
          <p className="text-sm text-slate-500">Nessuna risorsa collegata.</p>
        ) : (
          <ul className={listClass}>
            {resources.map((resource) => {
              const label = labelByKey.get(
                workspaceResourceKey(resource.kind, resource.resourceId)
              );
              return (
                <li
                  key={resource.id}
                  className={`flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 ${
                    isHub ? 'min-h-[5.5rem]' : 'flex-row items-center py-2.5'
                  }`}
                >
                  <div className={`flex items-start gap-3 ${isHub ? 'flex-1' : 'min-w-0 flex-1'}`}>
                    <span className="text-indigo-400 shrink-0 mt-0.5">{KIND_ICONS[resource.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {label?.title ?? getSharedResourceKindLabel(resource.kind)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        {getSharedResourceKindLabel(resource.kind)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${isHub ? 'mt-auto' : 'shrink-0'}`}>
                    <button
                      type="button"
                      onClick={() => onOpenResource(resource.kind, resource.resourceId)}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Apri
                    </button>
                    {isOwner && !hideRemoveActions && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onRequestRemoveResource(resource.id)}
                        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        title="Rimuovi dal Workspace"
                        aria-label="Rimuovi dal Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

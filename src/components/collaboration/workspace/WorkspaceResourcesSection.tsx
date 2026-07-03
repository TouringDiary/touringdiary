import React, { useMemo } from 'react';
import { BookOpen, Briefcase, ExternalLink, FileStack, Loader2, Trash2 } from 'lucide-react';
import type { SharedResourceKind } from '@/domain/collaboration';
import { getSharedResourceKindLabel, workspaceResourceKey } from '@/domain/collaboration';
import type { WorkspaceResource } from '@/domain/collaboration';
import type { WorkspaceResourceLabel } from '@/services/collaboration';
import { buildWorkspaceResourceLabelMap } from '@/services/collaboration';
import { WORKSPACE_FUTURE_MODULES } from './workspacePresentation';

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
  onRemoveResource: (workspaceResourceId: string) => void;
}

export const WorkspaceResourcesSection: React.FC<Props> = ({
  resources,
  resourceLabels,
  isOwner,
  isSubmitting,
  onOpenResource,
  onRemoveResource,
}) => {
  const labelByKey = useMemo(
    () => buildWorkspaceResourceLabelMap(resourceLabels),
    [resourceLabels]
  );

  return (
  <div className="space-y-4">
    <section className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
        Risorse nel Workspace
      </h3>
      {resources.length === 0 ? (
        <p className="text-sm text-slate-500">Nessuna risorsa collegata.</p>
      ) : (
        <ul className="space-y-2">
          {resources.map((resource) => {
            const label = labelByKey.get(
              workspaceResourceKey(resource.kind, resource.resourceId)
            );
            return (
              <li
                key={resource.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
              >
                <span className="text-indigo-400 shrink-0">{KIND_ICONS[resource.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {label?.title ?? getSharedResourceKindLabel(resource.kind)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {getSharedResourceKindLabel(resource.kind)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenResource(resource.kind, resource.resourceId)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Apri
                </button>
                {isOwner && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onRemoveResource(resource.id)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    title="Rimuovi dal Workspace"
                    aria-label="Rimuovi dal Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>

    <section className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
        Moduli futuri
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {WORKSPACE_FUTURE_MODULES.map((module) => (
          <div
            key={module.id}
            className="rounded-lg border border-dashed border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-600"
          >
            {module.label}
            <span className="block text-[10px] text-slate-700 mt-0.5">In arrivo</span>
          </div>
        ))}
      </div>
    </section>
  </div>
  );
};

export const WorkspaceResourcesLoading: React.FC = () => (
  <div className="flex justify-center py-8 text-slate-500">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
);

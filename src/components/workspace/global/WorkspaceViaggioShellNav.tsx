import React, { useEffect, useMemo, useState } from 'react';
import {
  VIAGGIO_FOLDER_SECTIONS,
  type ViaggioFolderSectionId,
} from '@/myspace/viaggioFolderSections';
import type { WorkspaceViaggioShellSettings } from '@/domain/collaboration/workspaceViaggioShell';
import type { SharedResourceKind } from '@/domain/collaboration';
import { sectionIdForSharedResourceKind } from '@/domain/collaboration/workspaceViaggioShell';

export interface WorkspaceViaggioShellResource {
  kind: SharedResourceKind;
  resourceId: string;
  title: string;
}

interface Props {
  shell: WorkspaceViaggioShellSettings;
  resources: WorkspaceViaggioShellResource[];
  onOpenResource: (kind: SharedResourceKind, resourceId: string) => void;
}

function defaultShellSection(shell: WorkspaceViaggioShellSettings): ViaggioFolderSectionId {
  return shell.populatedSections[0] ?? 'diario';
}

/**
 * Nav isomorfa DOC 37 per Workspace da Viaggio.
 * Sezioni non in `populatedSections` restano vuote (placeholder).
 */
export const WorkspaceViaggioShellNav: React.FC<Props> = ({
  shell,
  resources,
  onOpenResource,
}) => {
  const [activeSection, setActiveSection] = useState<ViaggioFolderSectionId>(() =>
    defaultShellSection(shell),
  );

  // Identità shell = sourceViaggioId. Su cambio workspace/reload di un altro Viaggio
  // riallinea il tab iniziale; su refresh risorse dello stesso Viaggio la selezione resta.
  useEffect(() => {
    setActiveSection(defaultShellSection(shell));
  }, [shell.sourceViaggioId]);

  const populated = useMemo(
    () => new Set(shell.populatedSections),
    [shell.populatedSections],
  );

  const sectionResources = useMemo(() => {
    return resources.filter((resource) => {
      const section = sectionIdForSharedResourceKind(resource.kind);
      return section === activeSection;
    });
  }, [activeSection, resources]);

  const isPopulated = populated.has(activeSection);
  const current = VIAGGIO_FOLDER_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="flex flex-col min-h-0 gap-3" data-testid="workspace-viaggio-shell">
      <p className="text-[11px] text-slate-500 px-1">
        Shell Viaggio (copie dedicate). Le sezioni senza risorse copiate restano vuote.
      </p>
      <nav
        className="flex overflow-x-auto border border-slate-800 rounded-lg bg-slate-950/60 min-w-0"
        role="tablist"
        aria-label="Sezioni shell viaggio del workspace"
      >
        {VIAGGIO_FOLDER_SECTIONS.map((section) => {
          const isActive = section.id === activeSection;
          const hasContent = populated.has(section.id);
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(section.id)}
              className={`
                px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                border-b-2 transition-colors shrink-0
                ${isActive
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'}
                ${hasContent ? '' : 'opacity-60'}
              `}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-[6rem] rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        {!isPopulated || sectionResources.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            {current?.placeholder ?? 'Sezione vuota in questo Workspace.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {sectionResources.map((resource) => (
              <li key={`${resource.kind}:${resource.resourceId}`}>
                <button
                  type="button"
                  onClick={() => onOpenResource(resource.kind, resource.resourceId)}
                  className="w-full text-left px-3 py-2 rounded-md bg-slate-800/80 hover:bg-slate-800 text-sm text-slate-200 transition-colors"
                >
                  {resource.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

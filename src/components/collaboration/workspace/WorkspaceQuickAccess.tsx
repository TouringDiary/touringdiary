import React, { useEffect, useState } from 'react';
import { FolderKanban, Loader2 } from 'lucide-react';
import type { Workspace } from '@/domain/collaboration';
import { listWorkspacesForUser } from '@/services/collaboration';
import { useOpenCollaborationWorkspace } from '@/hooks/useOpenCollaborationWorkspace';
import { useUser } from '@/context/UserContext';

interface Props {
  title?: string;
  className?: string;
  maxItems?: number;
}

/**
 * Accesso rapido ai Workspace (§12.1) — usato in Home e Profilo (Fase 8).
 * La sezione completa "Condivisione" è prevista in Fase 10.
 */
export const WorkspaceQuickAccess: React.FC<Props> = ({
  title = 'I tuoi Workspace',
  className = '',
  maxItems = 5,
}) => {
  const { user } = useUser();
  const openWorkspace = useOpenCollaborationWorkspace();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'guest') return;
    setIsLoading(true);
    void listWorkspacesForUser(user.id)
      .then(setWorkspaces)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user || user.role === 'guest') return null;

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <FolderKanban className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{title}</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Caricamento...
        </div>
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nessun Workspace ancora. Creane uno dalla condivisione di una risorsa.
        </p>
      ) : (
        <ul className="space-y-2">
          {workspaces.slice(0, maxItems).map((workspace) => (
            <li key={workspace.id}>
              <button
                type="button"
                onClick={() => openWorkspace({ workspaceId: workspace.id })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 hover:border-indigo-500/40 hover:bg-slate-900 px-3 py-2.5 text-left transition-colors"
              >
                <p className="text-sm font-semibold text-white truncate">{workspace.name}</p>
                {workspace.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{workspace.description}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

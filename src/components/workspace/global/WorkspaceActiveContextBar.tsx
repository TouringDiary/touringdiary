import React from 'react';
import { FolderKanban } from 'lucide-react';
import type { WorkspaceActiveRole } from './globalWorkspacePresentation';

interface Props {
  workspaceName: string;
  role: WorkspaceActiveRole;
  /** Compatto: inline accanto alla nav su desktop largo. */
  layout?: 'bar' | 'inline';
}

export const WorkspaceActiveContextBar: React.FC<Props> = ({
  workspaceName,
  role,
  layout = 'bar',
}) => {
  if (layout === 'inline') {
    return (
      <div
        className="hidden xl:flex items-center gap-2 px-4 py-2 border-l border-indigo-500/20 bg-indigo-950/30 shrink-0 min-w-[12rem] max-w-xs"
        data-testid="workspace-active-context"
      >
        <FolderKanban className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80 truncate">
            Attivo
          </p>
          <p className="text-xs font-semibold text-white truncate">{workspaceName}</p>
        </div>
        <span
          className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
            role === 'owner'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {role === 'owner' ? 'Owner' : 'Membro'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 shrink-0 xl:hidden"
      data-testid="workspace-active-context"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 shrink-0">
        <FolderKanban className="w-4 h-4 text-indigo-400" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/90">
          Workspace attivo
        </p>
        <p className="text-sm font-semibold text-white truncate">{workspaceName}</p>
      </div>
      <span
        className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          role === 'owner'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}
      >
        {role === 'owner' ? 'Owner' : 'Membro'}
      </span>
    </div>
  );
};

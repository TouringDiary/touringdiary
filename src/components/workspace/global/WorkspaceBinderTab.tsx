import React from 'react';
import { FolderKanban } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  /** sidebar = slot griglia Home (#tour-sidebar-buttons col 1). */
  variant?: 'sidebar' | 'standalone';
}

/**
 * Maniglia fisica MyWorld (desktop) — apre il chooser MySpace | Workspace.
 * Non è navigazione: è il segnapagina del raccoglitore nello stesso slot storico.
 */
export const WorkspaceBinderTab: React.FC<Props> = ({
  isOpen,
  onToggle,
  variant = 'sidebar',
}) => {
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        id="tour-workspace-binder"
        aria-expanded={isOpen}
        aria-controls="myworld-chooser-panel"
        onClick={onToggle}
        className={`
          w-full min-w-0 h-8 flex items-center justify-center gap-1.5 group
          bg-gradient-to-b from-slate-800 to-slate-900
          border border-slate-800 hover:border-indigo-500/50
          ${isOpen ? 'rounded-t-lg rounded-b-none border-b-indigo-500/30' : 'rounded-lg'}
          shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
          transition-colors
        `}
      >
        <FolderKanban className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden />
        <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-white truncate">
          MyWorld
        </span>
        <span className="text-[8px] text-indigo-400/90 shrink-0" aria-hidden>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id="tour-workspace-binder"
      aria-expanded={isOpen}
      aria-controls="myworld-chooser-panel"
      onClick={onToggle}
      className="
        group relative flex items-center gap-2 pl-3 pr-4
        h-[var(--workspace-binder-tab-height)]
        bg-gradient-to-b from-slate-800 to-slate-900
        border border-slate-700 border-b-slate-800
        rounded-b-lg rounded-tr-lg
        shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]
        text-indigo-300 hover:text-indigo-100
        transition-colors shrink-0
        before:absolute before:-left-1 before:top-0 before:bottom-0 before:w-1
        before:bg-indigo-500/40 before:rounded-l-sm
      "
    >
      <FolderKanban className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 group-hover:text-white">
        MyWorld
      </span>
      <span className="text-[9px] text-indigo-400/80" aria-hidden>
        {isOpen ? '▲' : '▼'}
      </span>
    </button>
  );
};

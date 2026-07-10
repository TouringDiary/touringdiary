import React from 'react';
import { Calendar, Clock, LogOut, Trash2, Users } from 'lucide-react';
import type { Workspace } from '@/domain/collaboration';
import type { WorkspaceActiveRole } from '../globalWorkspacePresentation';
import { formatRelativeActivity, formatWorkspaceCreated } from '@/utils/formatRelativeActivity';

interface Props {
  workspace: Workspace;
  role: WorkspaceActiveRole;
  memberCount: number;
  isActive: boolean;
  onSelect: () => void;
  compact?: boolean;
  onLeave?: () => void;
  onDelete?: () => void;
}

export const WorkspaceCard: React.FC<Props> = ({
  workspace,
  role,
  memberCount,
  isActive,
  onSelect,
  compact = false,
  onLeave,
  onDelete,
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`
      w-full text-left rounded-lg border transition-all
      ${compact ? 'px-3 py-2.5' : 'px-4 py-3 rounded-xl'}
      ${isActive
        ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40 shadow-[0_0_16px_rgba(99,102,241,0.12)]'
        : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900'}
    `}
  >
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <p className={`font-semibold text-white truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {workspace.name}
      </p>
      <span
        className={`shrink-0 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
          role === 'owner'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}
      >
        {role === 'owner' ? 'Owner' : 'Membro'}
      </span>
    </div>

    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-slate-500 ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <Users className="w-3 h-3" aria-hidden />
        {memberCount}
      </span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="w-3 h-3" aria-hidden />
        <span>📅 Creato</span>
        {formatWorkspaceCreated(workspace.createdAt)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3 h-3" aria-hidden />
        <span>🕒 Ultima attività</span>
        {formatRelativeActivity(workspace.updatedAt)}
      </span>
    </div>

    {isActive && (
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-400">
        Workspace aperto
      </p>
    )}

    {isActive && (onLeave || onDelete) && (
      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-800/80">
        {onLeave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLeave();
            }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Abbandona
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Elimina
          </button>
        )}
      </div>
    )}
  </button>
);

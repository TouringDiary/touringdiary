import React from 'react';
import type { CollaborationPresencePeer } from '@/domain/collaboration/collaborationLive';

export interface CollaborationLiveBarProps {
  peers: CollaborationPresencePeer[];
  editingStatusMessage?: string | null;
  className?: string;
}

function PresenceAvatar({ peer }: { peer: CollaborationPresencePeer }) {
  const initial = peer.displayName.trim().charAt(0).toUpperCase() || '?';
  const isEditing = peer.mode === 'editing';

  return (
    <span
      className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-semibold text-indigo-100 shrink-0"
      title={peer.displayName}
      aria-label={isEditing ? `${peer.displayName}, in modifica` : peer.displayName}
    >
      {initial}
      {isEditing && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"
          aria-hidden
        />
      )}
    </span>
  );
}

/** Presenza live e stato modifica (§17, §17.1). */
export const CollaborationLiveBar: React.FC<CollaborationLiveBarProps> = ({
  peers,
  editingStatusMessage,
  className = '',
}) => {
  if (peers.length === 0 && !editingStatusMessage) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/70 border border-white/10 rounded-lg ${className}`}
      role="status"
      aria-live="polite"
    >
      {peers.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">Presenti</span>
          <div className="flex items-center -space-x-1">
            {peers.slice(0, 5).map((peer) => (
              <PresenceAvatar key={peer.userId} peer={peer} />
            ))}
          </div>
          {peers.length > 5 && (
            <span className="text-slate-400">+{peers.length - 5}</span>
          )}
        </div>
      )}
      {editingStatusMessage && (
        <span className="text-slate-300 italic">{editingStatusMessage}</span>
      )}
    </div>
  );
};

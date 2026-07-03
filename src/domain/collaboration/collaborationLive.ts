import type { SharedResourceKind } from './sharedResource';

export interface CollaborationLiveConfig {
  editLockTimeoutMinutes: number;
  editLockHeartbeatSeconds: number;
}

export const DEFAULT_COLLABORATION_LIVE_CONFIG: CollaborationLiveConfig = {
  editLockTimeoutMinutes: 5,
  editLockHeartbeatSeconds: 30,
};

export interface SharedResourceEditLockState {
  lockedBy: string | null;
  lockedAt: string | null;
}

export type CollaborationPresenceMode = 'viewing' | 'editing';

export interface CollaborationPresencePeer {
  userId: string;
  displayName: string;
  mode: CollaborationPresenceMode;
}

export interface CollaborationLiveSessionState {
  isEnabled: boolean;
  isLoading: boolean;
  holdsLock: boolean;
  isLockedByOther: boolean;
  lockHolderId: string | null;
  lockHolderName: string | null;
  lockLockedAt: string | null;
  presencePeers: CollaborationPresencePeer[];
  editingStatusMessage: string | null;
  lockBlockedMessage: string | null;
}

export function buildCollaborationResourceChannelName(sharedResourceId: string): string {
  return `collaboration:resource:${sharedResourceId}`;
}

export function isCollaborativeLiveKind(kind: SharedResourceKind): boolean {
  return kind === 'diary' || kind === 'suitcase' || kind === 'user_template';
}

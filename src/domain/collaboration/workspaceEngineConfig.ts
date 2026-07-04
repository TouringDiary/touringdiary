import type { SharedResourceKind } from './sharedResource';
import { SHARED_RESOURCE_KINDS } from './sharedResource';
import type { StorageLimitsConfig } from '@/domain/storage/storageLimits';

export interface CollaborationNotificationCategoryPrefs {
  invites: boolean;
  resource_updates: boolean;
  workspace_updates: boolean;
  friend_requests: boolean;
}

export const DEFAULT_COLLABORATION_NOTIFICATION_PREFS: CollaborationNotificationCategoryPrefs = {
  invites: true,
  resource_updates: true,
  workspace_updates: true,
  friend_requests: true,
};

export interface WorkspaceEngineConfig {
  collaborationEnabled: boolean;
  livePresenceEnabled: boolean;
  enabledSharedResourceKinds: SharedResourceKind[];
  notificationCategories: CollaborationNotificationCategoryPrefs;
}

export const DEFAULT_WORKSPACE_ENGINE_CONFIG: WorkspaceEngineConfig = {
  collaborationEnabled: true,
  livePresenceEnabled: true,
  enabledSharedResourceKinds: [...SHARED_RESOURCE_KINDS],
  notificationCategories: { ...DEFAULT_COLLABORATION_NOTIFICATION_PREFS },
};

export interface WorkspaceAdminConfigBundle {
  engine: WorkspaceEngineConfig;
  live: {
    editLockTimeoutMinutes: number;
    editLockHeartbeatSeconds: number;
  };
  storage: StorageLimitsConfig;
}

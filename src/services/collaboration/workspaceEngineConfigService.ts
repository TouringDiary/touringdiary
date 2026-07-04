import type {
  CollaborationNotificationCategoryPrefs,
  WorkspaceEngineConfig,
  WorkspaceAdminConfigBundle,
} from '@/domain/collaboration/workspaceEngineConfig';
import {
  DEFAULT_COLLABORATION_NOTIFICATION_PREFS,
  DEFAULT_WORKSPACE_ENGINE_CONFIG,
} from '@/domain/collaboration/workspaceEngineConfig';
import type { StorageLimitsConfig } from '@/domain/storage/storageLimits';
import type { SharedResourceKind } from '@/domain/collaboration';
import { isSharedResourceKind } from '@/domain/collaboration';
import { getCachedSetting, SETTINGS_KEYS } from '@/services/settingsService';
import { resolveCollaborationLiveConfig } from './collaborationLiveConfig';
import { resolveStorageLimitsConfig } from './workspaceAttachmentService';

/** Valori vuoti per il form admin quando `storage_limits` non è ancora in global_settings. */
const UNCONFIGURED_STORAGE_LIMITS: StorageLimitsConfig = {
  maxAttachmentBytes: 0,
  maxAccountBytes: 0,
  maxWorkspaceBytes: 0,
};

function parseEngineConfig(raw: unknown): WorkspaceEngineConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_WORKSPACE_ENGINE_CONFIG;
  }

  const record = raw as Record<string, unknown>;
  const kindsRaw = record.enabled_shared_resource_kinds;
  const enabledSharedResourceKinds = Array.isArray(kindsRaw)
    ? kindsRaw.filter((k): k is SharedResourceKind => typeof k === 'string' && isSharedResourceKind(k))
    : DEFAULT_WORKSPACE_ENGINE_CONFIG.enabledSharedResourceKinds;

  const notifRaw = record.notification_categories;
  let notificationCategories = DEFAULT_COLLABORATION_NOTIFICATION_PREFS;
  if (notifRaw && typeof notifRaw === 'object') {
    const n = notifRaw as Record<string, unknown>;
    notificationCategories = {
      invites: n.invites !== false,
      resource_updates: n.resource_updates !== false,
      workspace_updates: n.workspace_updates !== false,
      friend_requests: n.friend_requests !== false,
    };
  }

  return {
    collaborationEnabled: record.collaboration_enabled !== false,
    livePresenceEnabled: record.live_presence_enabled !== false,
    enabledSharedResourceKinds:
      enabledSharedResourceKinds.length > 0
        ? enabledSharedResourceKinds
        : DEFAULT_WORKSPACE_ENGINE_CONFIG.enabledSharedResourceKinds,
    notificationCategories,
  };
}

export function resolveWorkspaceEngineConfig(
  raw: unknown = getCachedSetting(SETTINGS_KEYS.WORKSPACE_ENGINE_CONFIG)
): WorkspaceEngineConfig {
  return parseEngineConfig(raw);
}

export function isCollaborationEngineEnabled(): boolean {
  return resolveWorkspaceEngineConfig().collaborationEnabled;
}

export function isSharedResourceKindEnabled(kind: SharedResourceKind): boolean {
  return resolveWorkspaceEngineConfig().enabledSharedResourceKinds.includes(kind);
}

export function resolveWorkspaceAdminConfigBundle(): WorkspaceAdminConfigBundle {
  const liveResolved = resolveCollaborationLiveConfig();
  // Limiti storage solo da global_settings (migration seed); nessun fallback runtime numerico.
  const storage = resolveStorageLimitsConfig() ?? UNCONFIGURED_STORAGE_LIMITS;

  return {
    engine: resolveWorkspaceEngineConfig(),
    live: {
      editLockTimeoutMinutes: liveResolved.editLockTimeoutMinutes,
      editLockHeartbeatSeconds: liveResolved.editLockHeartbeatSeconds,
    },
    storage,
  };
}

export function serializeWorkspaceEngineConfig(config: WorkspaceEngineConfig): Record<string, unknown> {
  return {
    collaboration_enabled: config.collaborationEnabled,
    live_presence_enabled: config.livePresenceEnabled,
    enabled_shared_resource_kinds: config.enabledSharedResourceKinds,
    notification_categories: config.notificationCategories,
  };
}

export function serializeCollaborationLiveConfig(live: WorkspaceAdminConfigBundle['live']): Record<string, unknown> {
  return {
    edit_lock_timeout_minutes: live.editLockTimeoutMinutes,
    edit_lock_heartbeat_seconds: live.editLockHeartbeatSeconds,
  };
}

export function serializeStorageLimits(storage: StorageLimitsConfig): Record<string, unknown> {
  return { ...storage };
}

export type { CollaborationNotificationCategoryPrefs };

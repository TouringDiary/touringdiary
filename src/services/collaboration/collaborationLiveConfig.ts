import type { CollaborationLiveConfig } from '@/domain/collaboration/collaborationLive';
import { DEFAULT_COLLABORATION_LIVE_CONFIG } from '@/domain/collaboration/collaborationLive';
import { getCachedSetting, SETTINGS_KEYS } from '@/services/settingsService';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function resolveCollaborationLiveConfig(
  raw: unknown = getCachedSetting(SETTINGS_KEYS.COLLABORATION_LIVE_CONFIG)
): CollaborationLiveConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_COLLABORATION_LIVE_CONFIG;
  }

  const record = raw as Record<string, unknown>;
  return {
    editLockTimeoutMinutes: parsePositiveInt(
      record.edit_lock_timeout_minutes,
      DEFAULT_COLLABORATION_LIVE_CONFIG.editLockTimeoutMinutes
    ),
    editLockHeartbeatSeconds: parsePositiveInt(
      record.edit_lock_heartbeat_seconds,
      DEFAULT_COLLABORATION_LIVE_CONFIG.editLockHeartbeatSeconds
    ),
  };
}

export function collaborationLockTimeoutMs(config: CollaborationLiveConfig): number {
  return config.editLockTimeoutMinutes * 60_000;
}

export function collaborationLockHeartbeatMs(config: CollaborationLiveConfig): number {
  return config.editLockHeartbeatSeconds * 1_000;
}

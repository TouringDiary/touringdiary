import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SharedResourceKind } from '@/domain/collaboration';
import type {
  CollaborationLiveSessionState,
  CollaborationPresencePeer,
} from '@/domain/collaboration/collaborationLive';
import { buildCollaborationResourceChannelName } from '@/domain/collaboration/collaborationLive';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';
import { getShareableResource } from '@/services/collaboration/sharedResourceService';
import {
  getSharedResourceEditLockState,
  refreshSharedResourceEditLock,
  releaseSharedResourceEditLock,
  tryAcquireSharedResourceEditLock,
} from '@/services/collaboration/sharedResourceLockService';
import { fetchCollaborationUserProfiles } from '@/services/collaboration/workspaceResourcePresentation';
import {
  buildCollaborationEditingStatusMessage,
  buildCollaborationLockBlockedMessage,
} from '@/services/collaboration/collaborationLivePresentation';
import {
  collaborationLockHeartbeatMs,
  collaborationLockTimeoutMs,
  resolveCollaborationLiveConfig,
} from '@/services/collaboration/collaborationLiveConfig';
import { supabase } from '@/services/supabaseClient';

export interface UseCollaborationLiveSessionOptions {
  kind: SharedResourceKind | null;
  resourceId: string | null;
  resourceTitle?: string | null;
  userId: string | null;
  userDisplayName: string;
  canModifyContent: boolean;
  /** True quando l'utente è in sessione di modifica attiva (editor valigia o diario modificabile). */
  isEditSessionActive: boolean;
  onAutoSaveBeforeLockRelease?: () => Promise<void>;
  onExitEditMode?: () => void;
  onRemoteContentRefresh?: () => void | Promise<void>;
}

const EMPTY_STATE: CollaborationLiveSessionState = {
  isEnabled: false,
  isLoading: false,
  holdsLock: false,
  isLockedByOther: false,
  lockHolderId: null,
  lockHolderName: null,
  lockLockedAt: null,
  presencePeers: [],
  editingStatusMessage: null,
  lockBlockedMessage: null,
};

function logAsyncFailure(scope: string, error: unknown): void {
  console.error(`[useCollaborationLiveSession] ${scope}:`, error);
}

/** Fire-and-forget intenzionale: non blocca la UI, ma non perde rejection silenziose. */
function detach(promise: Promise<unknown>, scope: string): void {
  void promise.catch((error) => logAsyncFailure(scope, error));
}

export function useCollaborationLiveSession(
  options: UseCollaborationLiveSessionOptions
): CollaborationLiveSessionState & {
  notifyLocalActivity: () => void;
  retryAcquireLock: () => Promise<boolean>;
} {
  const {
    kind,
    resourceId,
    resourceTitle,
    userId,
    userDisplayName,
    canModifyContent,
    isEditSessionActive,
    onAutoSaveBeforeLockRelease,
    onExitEditMode,
    onRemoteContentRefresh,
  } = options;

  const { configs } = useConfig();
  const liveConfig = useMemo(
    () => resolveCollaborationLiveConfig(configs[SETTINGS_KEYS.COLLABORATION_LIVE_CONFIG]),
    [configs]
  );

  const [sharedResourceId, setSharedResourceId] = useState<string | null>(null);
  const [sharingMode, setSharingMode] = useState<'collaborative' | 'personal' | null>(null);
  const [lockHolderId, setLockHolderId] = useState<string | null>(null);
  const [lockLockedAt, setLockLockedAt] = useState<string | null>(null);
  const [holdsLock, setHoldsLock] = useState(false);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [presencePeers, setPresencePeers] = useState<CollaborationPresencePeer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const holdsLockRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemoteContentRefreshRef = useRef(onRemoteContentRefresh);
  const onAutoSaveRef = useRef(onAutoSaveBeforeLockRelease);
  const onExitEditModeRef = useRef(onExitEditMode);

  holdsLockRef.current = holdsLock;
  onRemoteContentRefreshRef.current = onRemoteContentRefresh;
  onAutoSaveRef.current = onAutoSaveBeforeLockRelease;
  onExitEditModeRef.current = onExitEditMode;

  const isCollaborativeSession =
    !!kind &&
    !!resourceId &&
    !!userId &&
    sharingMode === 'collaborative' &&
    !!sharedResourceId;

  const applyLockState = useCallback(
    (lockedBy: string | null, lockedAt: string | null) => {
      setLockHolderId(lockedBy);
      setLockLockedAt(lockedAt);
      setHoldsLock(!!userId && lockedBy === userId);
    },
    [userId]
  );

  const loadLockState = useCallback(async () => {
    if (!sharedResourceId) return;
    const state = await getSharedResourceEditLockState(sharedResourceId);
    applyLockState(state.lockedBy, state.lockedAt);
  }, [applyLockState, sharedResourceId]);

  const notifyLocalActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const retryAcquireLock = useCallback(async () => {
    if (!sharedResourceId || !canModifyContent) return false;
    const acquired = await tryAcquireSharedResourceEditLock(sharedResourceId);
    if (acquired) {
      await loadLockState();
      notifyLocalActivity();
    }
    return acquired;
  }, [canModifyContent, loadLockState, notifyLocalActivity, sharedResourceId]);

  // Resolve shared resource metadata
  useEffect(() => {
    if (!kind || !resourceId || !userId) {
      setSharedResourceId(null);
      setSharingMode(null);
      setLockHolderId(null);
      setLockLockedAt(null);
      setHoldsLock(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getShareableResource(kind, resourceId)
      .then((resource) => {
        if (cancelled) return;
        setSharedResourceId(resource?.id ?? null);
        setSharingMode(resource?.sharingMode ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        logAsyncFailure('resolveShareableResource', error);
        setSharedResourceId(null);
        setSharingMode(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, resourceId, userId]);

  // Initial lock state
  useEffect(() => {
    if (!sharedResourceId || sharingMode !== 'collaborative') return;
    detach(loadLockState(), 'loadLockState');
  }, [loadLockState, sharedResourceId, sharingMode]);

  // Acquire / release lock when edit session toggles
  useEffect(() => {
    if (!sharedResourceId || sharingMode !== 'collaborative' || !userId) return;

    let cancelled = false;

    const syncLock = async () => {
      if (!canModifyContent || !isEditSessionActive) {
        if (holdsLockRef.current) {
          await releaseSharedResourceEditLock(sharedResourceId);
          if (!cancelled) {
            setHoldsLock(false);
            await loadLockState();
          }
        }
        return;
      }

      const acquired = await tryAcquireSharedResourceEditLock(sharedResourceId);
      if (cancelled) return;

      if (acquired) {
        notifyLocalActivity();
        await loadLockState();
        return;
      }

      await loadLockState();
      onExitEditModeRef.current?.();
    };

    detach(syncLock(), 'syncLock');

    return () => {
      cancelled = true;
    };
  }, [
    canModifyContent,
    isEditSessionActive,
    loadLockState,
    notifyLocalActivity,
    sharedResourceId,
    sharingMode,
    userId,
  ]);

  // Release lock on unmount
  useEffect(() => {
    const resourceIdForCleanup = sharedResourceId;
    return () => {
      if (resourceIdForCleanup && holdsLockRef.current) {
        detach(releaseSharedResourceEditLock(resourceIdForCleanup), 'releaseLockOnUnmount');
      }
    };
  }, [sharedResourceId]);

  // Heartbeat + inactivity timeout
  useEffect(() => {
    if (!sharedResourceId || !isCollaborativeSession || !holdsLock || !isEditSessionActive) {
      return;
    }

    const heartbeatMs = collaborationLockHeartbeatMs(liveConfig);
    const timeoutMs = collaborationLockTimeoutMs(liveConfig);

    const intervalId = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= timeoutMs) {
        detach(
          (async () => {
            try {
              await onAutoSaveRef.current?.();
            } finally {
              await releaseSharedResourceEditLock(sharedResourceId);
              setHoldsLock(false);
              await loadLockState();
              onExitEditModeRef.current?.();
            }
          })(),
          'lockInactivityTimeout'
        );
        return;
      }

      detach(refreshSharedResourceEditLock(sharedResourceId), 'refreshLockHeartbeat');
    }, heartbeatMs);

    return () => window.clearInterval(intervalId);
  }, [
    holdsLock,
    isCollaborativeSession,
    isEditSessionActive,
    liveConfig,
    loadLockState,
    sharedResourceId,
  ]);

  // Activity listeners
  useEffect(() => {
    if (!holdsLock || !isEditSessionActive) return;

    const handleActivity = () => notifyLocalActivity();
    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [holdsLock, isEditSessionActive, notifyLocalActivity]);

  // Realtime: lock + content sync
  useEffect(() => {
    if (!sharedResourceId || sharingMode !== 'collaborative' || !userId) {
      return;
    }

    const channelName = buildCollaborationResourceChannelName(sharedResourceId);
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_resources',
          filter: `id=eq.${sharedResourceId}`,
        },
        (payload) => {
          const next = payload.new as {
            edit_locked_by?: string | null;
            edit_locked_at?: string | null;
          };
          applyLockState(next.edit_locked_by ?? null, next.edit_locked_at ?? null);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{
          userId: string;
          displayName: string;
          mode: CollaborationPresencePeer['mode'];
        }>();
        const peers: CollaborationPresencePeer[] = [];
        for (const presences of Object.values(state)) {
          for (const presence of presences) {
            if (!presence.userId || presence.userId === userId) continue;
            peers.push({
              userId: presence.userId,
              displayName: presence.displayName || 'Collaboratore',
              mode: presence.mode === 'editing' ? 'editing' : 'viewing',
            });
          }
        }
        setPresencePeers(peers);
      });

    if (kind === 'diary' && resourceId) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'itineraries',
          filter: `id=eq.${resourceId}`,
        },
        (payload) => {
          const row = payload.new as { last_modified_by?: string | null };
          if (row.last_modified_by && row.last_modified_by !== userId && !holdsLockRef.current) {
            detach(Promise.resolve(onRemoteContentRefreshRef.current?.()), 'remoteDiaryRefresh');
          }
        }
      );
    }

    if ((kind === 'suitcase' || kind === 'user_template') && resourceId) {
      const refreshIfRemote = (modifiedBy: string | null | undefined) => {
        if (modifiedBy && modifiedBy !== userId && !holdsLockRef.current) {
          detach(Promise.resolve(onRemoteContentRefreshRef.current?.()), 'remoteSuitcaseRefresh');
        }
      };

      channel
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'suitcases',
            filter: `id=eq.${resourceId}`,
          },
          (payload) => {
            const row = payload.new as { last_modified_by?: string | null };
            refreshIfRemote(row.last_modified_by);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'suitcase_items',
            filter: `suitcase_id=eq.${resourceId}`,
          },
          () => {
            if (!holdsLockRef.current) {
              detach(Promise.resolve(onRemoteContentRefreshRef.current?.()), 'remoteSuitcaseItemsRefresh');
            }
          }
        );
    }

    void channel.subscribe(async (status) => {
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        console.warn(`[useCollaborationLiveSession] realtime channel ${status}`);
        return;
      }
      if (status !== 'SUBSCRIBED') return;
      try {
        await channel.track({
          userId,
          displayName: userDisplayName,
          mode: holdsLockRef.current && isEditSessionActive ? 'editing' : 'viewing',
        });
      } catch (error) {
        logAsyncFailure('channelSubscribe', error);
      }
    });

    channelRef.current = channel;

    return () => {
      try {
        void supabase.removeChannel(channel);
      } catch (error) {
        logAsyncFailure('removeChannel', error);
      }
      channelRef.current = null;
      setPresencePeers([]);
    };
  }, [
    applyLockState,
    isEditSessionActive,
    kind,
    resourceId,
    sharedResourceId,
    sharingMode,
    userDisplayName,
    userId,
  ]);

  // Keep presence mode in sync with lock
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !userId) return;
    void channel
      .track({
        userId,
        displayName: userDisplayName,
        mode: holdsLock && isEditSessionActive ? 'editing' : 'viewing',
      })
      .catch((error) => logAsyncFailure('presenceTrack', error));
  }, [holdsLock, isEditSessionActive, userDisplayName, userId]);

  // Resolve profile names for lock holder + presence
  useEffect(() => {
    const ids = new Set<string>();
    if (lockHolderId) ids.add(lockHolderId);
    for (const peer of presencePeers) ids.add(peer.userId);

    if (ids.size === 0) {
      setProfileNames({});
      return;
    }

    let cancelled = false;
    detach(
      fetchCollaborationUserProfiles([...ids]).then((profiles) => {
        if (cancelled) return;
        const names: Record<string, string> = {};
        for (const [id, profile] of Object.entries(profiles)) {
          names[id] = profile.name;
        }
        setProfileNames(names);
      }),
      'fetchCollaborationUserProfiles'
    );

    return () => {
      cancelled = true;
    };
  }, [lockHolderId, presencePeers]);

  const lockHolderName = lockHolderId ? profileNames[lockHolderId] ?? 'Un collaboratore' : null;
  const isLockedByOther = !!lockHolderId && lockHolderId !== userId;

  const editingStatusMessage = useMemo(() => {
    if (!lockHolderId || !kind) return null;
    const editorName = profileNames[lockHolderId] ?? 'Un collaboratore';
    return buildCollaborationEditingStatusMessage(editorName, kind, resourceTitle);
  }, [kind, lockHolderId, profileNames, resourceTitle]);

  const lockBlockedMessage = useMemo(() => {
    if (!isLockedByOther || !lockHolderName) return null;
    return buildCollaborationLockBlockedMessage(lockHolderName, lockLockedAt);
  }, [isLockedByOther, lockHolderName, lockLockedAt]);

  const resolvedPresencePeers = useMemo(
    () =>
      presencePeers.map((peer) => ({
        ...peer,
        displayName: profileNames[peer.userId] ?? peer.displayName,
      })),
    [presencePeers, profileNames]
  );

  if (!isCollaborativeSession) {
    return {
      ...EMPTY_STATE,
      isLoading,
      notifyLocalActivity,
      retryAcquireLock,
    };
  }

  return {
    isEnabled: true,
    isLoading,
    holdsLock,
    isLockedByOther,
    lockHolderId,
    lockHolderName,
    lockLockedAt,
    presencePeers: resolvedPresencePeers,
    editingStatusMessage: isLockedByOther ? editingStatusMessage : null,
    lockBlockedMessage,
    notifyLocalActivity,
    retryAcquireLock,
  };
}

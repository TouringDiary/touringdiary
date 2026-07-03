import React, { createContext, useContext } from 'react';
import type { CollaborationLiveSessionState } from '@/domain/collaboration/collaborationLive';
import { useCollaborationLiveSession } from '@/hooks/collaboration/useCollaborationLiveSession';
import type { UseCollaborationLiveSessionOptions } from '@/hooks/collaboration/useCollaborationLiveSession';

interface CollaborationLiveContextValue extends CollaborationLiveSessionState {
  notifyLocalActivity: () => void;
  retryAcquireLock: () => Promise<boolean>;
}

const CollaborationLiveContext = createContext<CollaborationLiveContextValue | null>(null);

export interface CollaborationLiveProviderProps extends UseCollaborationLiveSessionOptions {
  children: React.ReactNode;
}

export const CollaborationLiveProvider: React.FC<CollaborationLiveProviderProps> = ({
  children,
  ...sessionOptions
}) => {
  const session = useCollaborationLiveSession(sessionOptions);
  return (
    <CollaborationLiveContext.Provider value={session}>{children}</CollaborationLiveContext.Provider>
  );
};

export function useCollaborationLive(): CollaborationLiveContextValue {
  const context = useContext(CollaborationLiveContext);
  if (!context) {
    return {
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
      notifyLocalActivity: () => undefined,
      retryAcquireLock: async () => false,
    };
  }
  return context;
}

export function useCollaborationLiveRequired(): CollaborationLiveContextValue {
  const context = useContext(CollaborationLiveContext);
  if (!context) {
    throw new Error('useCollaborationLiveRequired must be used within CollaborationLiveProvider');
  }
  return context;
}

/** True quando la risorsa collaborativa è in sola lettura per lock altrui. */
export function useCollaborationReadOnly(): boolean {
  const live = useCollaborationLive();
  return live.isEnabled && live.isLockedByOther;
}

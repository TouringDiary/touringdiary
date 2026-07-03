import { useCallback, useEffect, useState } from 'react';
import type { SharedResourceKind, Workspace } from '@/domain/collaboration';
import { listWorkspacesContainingResource } from '@/services/collaboration';

export function useResourceWorkspaces(
  kind: SharedResourceKind | null,
  resourceId: string | null | undefined
) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!kind || !resourceId) {
      setWorkspaces([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await listWorkspacesContainingResource(kind, resourceId);
      setWorkspaces(result);
    } finally {
      setIsLoading(false);
    }
  }, [kind, resourceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { workspaces, isLoading, refresh };
}

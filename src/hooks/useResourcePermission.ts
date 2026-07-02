import { useEffect, useState } from 'react';
import type { ResolvedResourcePermission, SharedResourceKind } from '@/domain/collaboration';
import { resolveResourcePermission } from '@/services/collaboration';

export interface UseResourcePermissionResult {
  permission: ResolvedResourcePermission | null;
  isLoading: boolean;
}

export function useResourcePermission(
  kind: SharedResourceKind | null | undefined,
  resourceId: string | null | undefined,
  userId: string | null | undefined
): UseResourcePermissionResult {
  const [permission, setPermission] = useState<ResolvedResourcePermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!kind || !resourceId || !userId) {
      setPermission(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    resolveResourcePermission(userId, kind, resourceId).then((resolved) => {
      if (cancelled) return;
      setPermission(resolved);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [kind, resourceId, userId]);

  return { permission, isLoading };
}

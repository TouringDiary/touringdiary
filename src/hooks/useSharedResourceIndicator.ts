import { useEffect, useState } from 'react';
import type { SharedResourceKind } from '@/domain/collaboration';
import { isResourceShared } from '@/services/collaboration';

export function useSharedResourceIndicator(
  kind: SharedResourceKind | null | undefined,
  resourceId: string | null | undefined
): boolean {
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (!kind || !resourceId) {
      setIsShared(false);
      return;
    }

    let cancelled = false;
    isResourceShared(kind, resourceId).then((shared) => {
      if (!cancelled) setIsShared(shared);
    });

    return () => {
      cancelled = true;
    };
  }, [kind, resourceId]);

  return isShared;
}

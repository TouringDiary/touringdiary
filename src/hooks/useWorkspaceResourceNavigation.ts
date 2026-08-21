import { useCallback } from 'react';
import { useItinerary } from '@/context/ItineraryContext';
import { useModal } from '@/context/ModalContext';
import type { SharedResourceKind } from '@/domain/collaboration';
import { endWorkspaceSession } from '@/focus/workspaceSessionRegistry';
import { fetchDiariesByIds } from '@/services/community/itineraryService';

/**
 * Azioni di navigazione verso risorse dal dashboard Workspace (§12.4).
 */
export function useWorkspaceResourceNavigation() {
  const { openModal } = useModal();
  const { loadProject } = useItinerary();

  const openResource = useCallback(
    async (kind: SharedResourceKind, resourceId: string) => {
      if (kind === 'diary') {
        const diaries = await fetchDiariesByIds([resourceId]);
        const diary = diaries[0];
        if (diary) {
          loadProject(diary);
          endWorkspaceSession('collaborationWorkspace');
        }
        return;
      }

      if (kind === 'suitcase' || kind === 'user_template') {
        endWorkspaceSession('collaborationWorkspace');
        openModal('packingList', { suitcaseId: resourceId });
      }
    },
    [loadProject, openModal],
  );

  return { openResource };
}

/**
 * Callback composizione + inviti workspace pending — solo CollaborationShareModal.
 */
import { useCallback, useEffect, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { SharedResourceKind, WorkspaceResourcePermissionEntry } from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import {
  type WorkspaceCompositionBlueprint,
  type WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import { draftToCompositionResources } from '@/domain/collaboration/workspaceComposition';
import type { WorkspaceCompositionResource } from '@/services/collaboration';
import { resolveWorkspaceCompositionBlueprint } from '@/services/collaboration';
import {
  buildDefaultWorkspaceInvitePermissions,
  resolveCompositionResourceTitles,
  syncWorkspacePendingInvitePermissions,
  type WorkspacePendingInvite,
} from './collaborationSharePresentation';
import { mergeCompositionDraftWithBlueprint } from './collaborationShareDraft';

export function useCollaborationShareCompositionHandlers(input: {
  isCreateEntry: boolean;
  compositionBlueprint: WorkspaceCompositionBlueprint | null;
  compositionDraft: WorkspaceCompositionDraft | null;
  compositionExpansionGenRef: MutableRefObject<number>;
  setCompositionBlueprint: Dispatch<SetStateAction<WorkspaceCompositionBlueprint | null>>;
  setCompositionDraft: Dispatch<SetStateAction<WorkspaceCompositionDraft | null>>;
  setIsExpandingCompositionDiary: Dispatch<SetStateAction<boolean>>;
  setWorkspacePendingInvites: Dispatch<SetStateAction<WorkspacePendingInvite[]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}) {
  const {
    isCreateEntry,
    compositionBlueprint,
    compositionDraft,
    compositionExpansionGenRef,
    setCompositionBlueprint,
    setCompositionDraft,
    setIsExpandingCompositionDiary,
    setWorkspacePendingInvites,
    setSearchQuery,
  } = input;

  const selectedComposition = useMemo((): WorkspaceCompositionResource[] => {
    if (!compositionDraft) return [];
    return draftToCompositionResources(compositionDraft);
  }, [compositionDraft]);

  const compositionInviteElements = useMemo(() => {
    if (!compositionBlueprint) return [];
    return resolveCompositionResourceTitles(compositionBlueprint, selectedComposition);
  }, [compositionBlueprint, selectedComposition]);

  useEffect(() => {
    setWorkspacePendingInvites((current) => {
      if (current.length === 0) return current;
      return syncWorkspacePendingInvitePermissions(current, selectedComposition);
    });
  }, [selectedComposition, setWorkspacePendingInvites]);

  const buildWorkspaceInvitePermissions = useCallback(
    () => buildDefaultWorkspaceInvitePermissions(selectedComposition),
    [selectedComposition]
  );

  const refreshCompositionBlueprint = useCallback(
    async (seed: WorkspaceCompositionBlueprint['seed'], selectedDiaryId: string | null) => {
      const generation = ++compositionExpansionGenRef.current;

      setIsExpandingCompositionDiary(true);
      try {
        const nextBlueprint = await resolveWorkspaceCompositionBlueprint({
          seed,
          selectedDiaryId,
        });
        if (generation !== compositionExpansionGenRef.current) return;

        setCompositionBlueprint(nextBlueprint);
        setCompositionDraft((current) =>
          mergeCompositionDraftWithBlueprint(current, nextBlueprint, selectedDiaryId)
        );
      } finally {
        if (generation === compositionExpansionGenRef.current) {
          setIsExpandingCompositionDiary(false);
        }
      }
    },
    [
      compositionExpansionGenRef,
      setCompositionBlueprint,
      setCompositionDraft,
      setIsExpandingCompositionDiary,
    ]
  );

  const handleSelectCompositionDiary = useCallback(
    (diaryId: string | null) => {
      if (isCreateEntry) {
        setCompositionDraft((current) =>
          current ? { ...current, selectedDiaryId: diaryId } : current
        );
        return;
      }

      if (!compositionBlueprint || compositionBlueprint.seed.kind === 'diary') return;
      void refreshCompositionBlueprint(compositionBlueprint.seed, diaryId);
    },
    [compositionBlueprint, isCreateEntry, refreshCompositionBlueprint, setCompositionDraft]
  );

  const handleToggleCompositionSuitcase = useCallback((suitcaseId: string) => {
    setCompositionDraft((current) => {
      if (!current) return current;
      const next = new Set(current.selectedSuitcaseIds);
      if (next.has(suitcaseId)) next.delete(suitcaseId);
      else next.add(suitcaseId);
      return { ...current, selectedSuitcaseIds: next };
    });
  }, [setCompositionDraft]);

  const handleToggleCompositionUserTemplate = useCallback((templateId: string) => {
    setCompositionDraft((current) => {
      if (!current) return current;
      const next = new Set(current.selectedUserTemplateIds);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return { ...current, selectedUserTemplateIds: next };
    });
  }, [setCompositionDraft]);

  const handleAddWorkspacePendingInvite = (result: CollaborationUserSearchResult) => {
    setWorkspacePendingInvites((current) => [
      ...current,
      {
        userId: result.id,
        name: result.name,
        slug: result.slug,
        permissions: buildWorkspaceInvitePermissions(),
      },
    ]);
    setSearchQuery('');
  };

  const handleRemoveWorkspacePendingInvite = (userId: string) => {
    setWorkspacePendingInvites((current) => current.filter((invite) => invite.userId !== userId));
  };

  const handleUpdateWorkspacePendingInvitePermission = useCallback(
    (
      userId: string,
      kind: SharedResourceKind,
      resourceId: string,
      accessLevel: WorkspaceResourcePermissionEntry['accessLevel']
    ) => {
      setWorkspacePendingInvites((current) =>
        current.map((invite) => {
          if (invite.userId !== userId) return invite;

          const hasEntry = invite.permissions.some(
            (entry) => entry.kind === kind && entry.resourceId === resourceId
          );
          const permissions = hasEntry
            ? invite.permissions.map((entry) =>
                entry.kind === kind && entry.resourceId === resourceId
                  ? { ...entry, accessLevel }
                  : entry
              )
            : [...invite.permissions, { kind, resourceId, accessLevel }];

          return { ...invite, permissions };
        })
      );
    },
    [setWorkspacePendingInvites]
  );

  return {
    selectedComposition,
    compositionInviteElements,
    handleSelectCompositionDiary,
    handleToggleCompositionSuitcase,
    handleToggleCompositionUserTemplate,
    handleAddWorkspacePendingInvite,
    handleRemoveWorkspacePendingInvite,
    handleUpdateWorkspacePendingInvitePermission,
  };
}

import type {
  SharedResourceKind,
  Workspace,
  WorkspaceResourcePermissionEntry,
} from '@/domain/collaboration';
import type {
  WorkspaceCompositionBlueprint,
  WorkspaceCompositionDraft,
} from '@/domain/collaboration/workspaceComposition';
import {
  createWorkspaceWithComposition,
  materializeWorkspaceComposition,
  rollbackDuplicatedCompositionResources,
  sendWorkspaceInvite,
  type WorkspaceCompositionResource,
} from '@/services/collaboration';
import {
  mapWorkspaceInvitePermissionsToMaterialized,
  type ShareIntent,
  type WorkspacePendingInvite,
} from './collaborationSharePresentation';

export type StepResult<T> = { success: true; value: T } | { success: false; error: string };

export async function materializeSelectedComposition(input: {
  hasSelectedResources: boolean;
  ownerId: string;
  shareIntent: ShareIntent;
  draft: WorkspaceCompositionDraft;
  blueprint: WorkspaceCompositionBlueprint;
}): Promise<StepResult<WorkspaceCompositionResource[]>> {
  if (!input.hasSelectedResources) {
    return { success: true, value: [] };
  }

  const materializeResult = await materializeWorkspaceComposition({
    ownerId: input.ownerId,
    shareIntent: input.shareIntent,
    draft: input.draft,
    blueprint: input.blueprint,
  });

  if (materializeResult.success !== true) {
    return { success: false, error: materializeResult.error };
  }

  return { success: true, value: materializeResult.resources };
}

export async function createWorkspaceFromMaterialized(input: {
  ownerId: string;
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  resources: WorkspaceCompositionResource[];
  rollbackDuplicatesOnFailure: boolean;
}): Promise<StepResult<Workspace>> {
  const createResult = await createWorkspaceWithComposition(input.ownerId, {
    name: input.name,
    description: input.description,
    settings: input.settings,
    resources: input.resources,
  });

  if (createResult.success !== true) {
    if (input.rollbackDuplicatesOnFailure) {
      await rollbackDuplicatedCompositionResources(input.resources);
    }
    return { success: false, error: createResult.error };
  }

  return { success: true, value: createResult.workspace };
}

export async function sendPendingWorkspaceInvites(input: {
  ownerId: string;
  workspaceId: string;
  invites: WorkspacePendingInvite[];
  mapPermissions?: (
    permissions: WorkspaceResourcePermissionEntry[]
  ) => WorkspaceResourcePermissionEntry[];
}): Promise<StepResult<void>> {
  for (const pending of input.invites) {
    const permissions = input.mapPermissions
      ? input.mapPermissions(pending.permissions)
      : pending.permissions;

    const inviteResult = await sendWorkspaceInvite(
      input.ownerId,
      input.workspaceId,
      { userId: pending.userId },
      permissions
    );
    if (inviteResult.success !== true) {
      return { success: false, error: inviteResult.error };
    }
  }

  return { success: true, value: undefined };
}

export async function finalizeCreateWorkspacePipeline(input: {
  hasSelectedResources: boolean;
  ownerId: string;
  shareIntent: ShareIntent;
  draft: WorkspaceCompositionDraft;
  blueprint: WorkspaceCompositionBlueprint;
  workspaceName: string;
  workspaceDescription?: string;
  settings?: Record<string, unknown>;
  invitesToSend: WorkspacePendingInvite[];
  compositionOriginals: Array<{ kind: SharedResourceKind; resourceId: string }>;
}): Promise<StepResult<Workspace>> {
  const materialized = await materializeSelectedComposition({
    hasSelectedResources: input.hasSelectedResources,
    ownerId: input.ownerId,
    shareIntent: input.shareIntent,
    draft: input.draft,
    blueprint: input.blueprint,
  });
  if (materialized.success === false) {
    return { success: false, error: materialized.error };
  }

  const materializedResources = materialized.value;
  const created = await createWorkspaceFromMaterialized({
    ownerId: input.ownerId,
    name: input.workspaceName.trim(),
    description: input.workspaceDescription,
    settings: input.settings,
    resources: materializedResources,
    rollbackDuplicatesOnFailure:
      input.hasSelectedResources && input.shareIntent === 'duplicate_and_share',
  });
  if (created.success === false) {
    return { success: false, error: created.error };
  }

  const invitePermissionsMapper = input.hasSelectedResources
    ? (permissions: WorkspaceResourcePermissionEntry[]) =>
        mapWorkspaceInvitePermissionsToMaterialized(
          permissions,
          input.compositionOriginals,
          materializedResources
        )
    : undefined;

  const invitesSent = await sendPendingWorkspaceInvites({
    ownerId: input.ownerId,
    workspaceId: created.value.id,
    invites: input.invitesToSend,
    mapPermissions: invitePermissionsMapper,
  });
  if (invitesSent.success === false) {
    return { success: false, error: invitesSent.error };
  }

  return { success: true, value: created.value };
}

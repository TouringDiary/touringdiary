/**
 * Inviti risorsa + management — solo CollaborationShareModal.
 */
import type { Dispatch, SetStateAction } from 'react';
import type {
  CollaborativeMemberRole,
  ResourceInvite,
  SharedResource,
  SharedResourceKind,
  SharedResourceMemberWithProfile,
  SharingMode,
} from '@/domain/collaboration';
import type { CollaborationUserSearchResult } from '@/domain/collaboration';
import {
  ensureShareableResource,
  resendResourceInvite,
  sendResourceInvite,
  setSharedResourceMember,
  updateShareableResourceMode,
} from '@/services/collaboration';
import type { PendingInvite } from './collaborationSharePresentation';

export function useCollaborationShareResourceHandlers(input: {
  userId: string;
  shareKind: SharedResourceKind;
  shareResourceId: string;
  sharingMode: SharingMode;
  sharedResource: SharedResource | null;
  selectedRole: CollaborativeMemberRole;
  pendingInvites: PendingInvite[];
  effectiveResourceId: string;
  setPendingInvites: Dispatch<SetStateAction<PendingInvite[]>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSharingMode: Dispatch<SetStateAction<SharingMode>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  runSubmittingAction: (action: () => Promise<void>) => Promise<void>;
  resolveShareTargetResourceId: () => Promise<string | null>;
  refreshCollaborationState: () => Promise<void>;
}) {
  const {
    userId,
    shareKind,
    shareResourceId,
    sharingMode,
    sharedResource,
    selectedRole,
    pendingInvites,
    effectiveResourceId,
    setPendingInvites,
    setSearchQuery,
    setSharingMode,
    setActionError,
    runSubmittingAction,
    resolveShareTargetResourceId,
    refreshCollaborationState,
  } = input;

  const handleAddPendingInvite = (result: CollaborationUserSearchResult) => {
    setPendingInvites((current) => [
      ...current,
      {
        userId: result.id,
        name: result.name,
        slug: result.slug,
        role: selectedRole,
      },
    ]);
    setSearchQuery('');
  };

  const handleRemovePendingInvite = (userIdToRemove: string) => {
    setPendingInvites((current) => current.filter((invite) => invite.userId !== userIdToRemove));
  };

  const handleSendInvites = async () => {
    if (pendingInvites.length === 0) {
      setActionError('Aggiungi almeno un utente da invitare.');
      return;
    }

    await runSubmittingAction(async () => {
      const targetResourceId =
        sharingMode === 'collaborative'
          ? await resolveShareTargetResourceId()
          : effectiveResourceId;
      if (!targetResourceId) return;

      const registerResult = await ensureShareableResource(
        shareKind,
        targetResourceId,
        userId,
        sharingMode
      );
      if (registerResult.success !== true) {
        setActionError(registerResult.error);
        return;
      }

      if (registerResult.resource.sharingMode !== sharingMode) {
        const modeResult = await updateShareableResourceMode(
          registerResult.resource.id,
          userId,
          sharingMode
        );
        if (!modeResult.success) {
          setActionError(modeResult.error ?? 'Impossibile aggiornare la modalità.');
          return;
        }
      }

      for (const pending of pendingInvites) {
        const result = await sendResourceInvite(
          userId,
          shareKind,
          targetResourceId,
          { userId: pending.userId },
          pending.role
        );
        if (result.success !== true) {
          setActionError(result.error);
          return;
        }
      }

      await refreshCollaborationState();
    });
  };

  const handleRoleChange = async (memberUserId: string, role: CollaborativeMemberRole) => {
    if (!sharedResource) return;
    await runSubmittingAction(async () => {
      const result = await setSharedResourceMember(
        sharedResource.id,
        userId,
        memberUserId,
        role
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    });
  };

  const handleResendInvite = async (inviteId: string) => {
    await runSubmittingAction(async () => {
      const result = await resendResourceInvite(userId, inviteId);
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      await refreshCollaborationState();
    });
  };

  const handleSharingModeChange = async (mode: SharingMode) => {
    if (!sharedResource || sharedResource.sharingMode === mode) return;
    await runSubmittingAction(async () => {
      const result = await updateShareableResourceMode(sharedResource.id, userId, mode);
      if (!result.success) {
        setActionError(result.error ?? 'Impossibile aggiornare la modalità.');
        return;
      }
      setSharingMode(mode);
      await refreshCollaborationState();
    });
  };

  const handleManagementInvite = async (target: CollaborationUserSearchResult) => {
    await runSubmittingAction(async () => {
      const result = await sendResourceInvite(
        userId,
        shareKind,
        shareResourceId,
        { userId: target.id },
        selectedRole
      );
      if (result.success !== true) {
        setActionError(result.error);
        return;
      }
      setSearchQuery('');
      await refreshCollaborationState();
    });
  };

  return {
    handleAddPendingInvite,
    handleRemovePendingInvite,
    handleSendInvites,
    handleRoleChange,
    handleResendInvite,
    handleSharingModeChange,
    handleManagementInvite,
  };
}

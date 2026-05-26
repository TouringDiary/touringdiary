import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useModal } from '@/context/ModalContext';
import { useNavigation } from '@/context/useNavigation';
import {
  deriveFocusState,
  getOverlayKind,
  getSurfacePolicy,
  resolveWorkspaceId,
  shouldDismissWorkspaceOnViewModeChange,
  type DerivedFocusState,
  type FocusSurface,
  type OverlayKind,
  type SurfacePolicy,
  type UIMode,
  type WorkspaceId,
} from './focusModeRegistry';
import { requestWorkspaceClose } from './workspaceCloseRegistry';
import { endWorkspaceSession } from './workspaceSessionRegistry';

export interface FocusModeContextValue extends DerivedFocusState {
  /** Policy helper for a semantic surface in the current mode. */
  getPolicy: (surface: FocusSurface) => SurfacePolicy;
  /** Whether the current mode is a workspace focus session. */
  isWorkspace: boolean;
  /** Closes the active focus session (workspace, modal, or preview). */
  closeFocus: () => void;
}

const FocusModeContext = createContext<FocusModeContextValue | undefined>(undefined);

function dismissWorkspaceSession(workspaceId: WorkspaceId, closeModal: () => void): void {
  if (requestWorkspaceClose(workspaceId)) return;
  if (!endWorkspaceSession(workspaceId)) closeModal();
}

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeModal, closeModal } = useModal();
  const { viewMode, activePreview, setActivePreview } = useNavigation();

  const derived = useMemo(
    () =>
      deriveFocusState({
        viewMode,
        activeModal,
        activePreviewOpen: activePreview?.isOpen === true,
      }),
    [viewMode, activeModal, activePreview?.isOpen]
  );

  const closeFocus = useCallback(() => {
    if (derived.mode === 'preview') {
      setActivePreview((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    if (derived.mode === 'workspace' && derived.workspaceId) {
      dismissWorkspaceSession(derived.workspaceId, closeModal);
      return;
    }
    if (derived.mode === 'modal') {
      closeModal();
    }
  }, [derived.mode, derived.workspaceId, closeModal, setActivePreview]);

  useEffect(() => {
    if (!shouldDismissWorkspaceOnViewModeChange(viewMode)) return;

    const workspaceId = resolveWorkspaceId(activeModal);
    if (!workspaceId) return;

    dismissWorkspaceSession(workspaceId, closeModal);
  }, [viewMode, activeModal, closeModal]);

  const value = useMemo<FocusModeContextValue>(
    () => ({
      ...derived,
      overlayKind: getOverlayKind(derived.mode),
      getPolicy: (surface: FocusSurface) => getSurfacePolicy(derived.mode, surface),
      isWorkspace: derived.mode === 'workspace',
      closeFocus,
    }),
    [derived, closeFocus]
  );

  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>;
};

export function useFocusMode(): FocusModeContextValue {
  const ctx = useContext(FocusModeContext);
  if (!ctx) {
    throw new Error('useFocusMode must be used within FocusModeProvider');
  }
  return ctx;
}

/** Safe variant for components that may mount outside the provider tree. */
export function useFocusModeOptional(): FocusModeContextValue | null {
  return useContext(FocusModeContext) ?? null;
}

export type { UIMode, WorkspaceId, FocusSurface, OverlayKind, SurfacePolicy };

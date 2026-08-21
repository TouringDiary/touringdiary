export { FocusIdleBoundary } from './FocusIdleBoundary';

export {
  type FocusModeContextValue,
  FocusModeProvider,
  useFocusMode,
  useFocusModeOptional,
} from './FocusModeContext';

export { FocusOverlay } from './FocusOverlay';
export {
  blocksAppKeyboardShortcuts,
  type DerivedFocusState,
  deriveFocusState,
  diaryHandlesKeyboardShortcuts,
  FOCUS_SURFACE_ATTR,
  type FocusSurface,
  focusSessionOwnsKeyboardShortcuts,
  getOverlayKind,
  getSurfacePolicy,
  isAppFocusShell,
  type KeyboardShortcutContext,
  type OverlayKind,
  resolveWorkspaceId,
  type SurfacePolicy,
  shouldDismissWorkspaceOnViewModeChange,
  type UIMode,
  WORKSPACE_REGISTRY,
  type WorkspaceId,
  workspaceOwnsKeyboardShortcuts,
  workspaceRequiresStableSidebar,
  workspaceUsesCompanionPortal,
} from './focusModeRegistry';
export { useWorkspaceCloseRegistration } from './useWorkspaceCloseRegistration';
export { useWorkspaceSessionEnd } from './useWorkspaceSessionEnd';
export { WorkspaceHost } from './WorkspaceHost';
export {
  registerWorkspaceClose,
  requestWorkspaceClose,
  unregisterWorkspaceClose,
  type WorkspaceCloseRegistration,
} from './workspaceCloseRegistry';
export {
  endWorkspaceSession,
  registerWorkspaceSessionEnd,
  unregisterWorkspaceSessionEnd,
} from './workspaceSessionRegistry';

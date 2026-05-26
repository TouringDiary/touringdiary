export {
  deriveFocusState,
  getOverlayKind,
  getSurfacePolicy,
  resolveWorkspaceId,
  blocksAppKeyboardShortcuts,
  focusSessionOwnsKeyboardShortcuts,
  workspaceOwnsKeyboardShortcuts,
  diaryHandlesKeyboardShortcuts,
  shouldDismissWorkspaceOnViewModeChange,
  isAppFocusShell,
  workspaceRequiresStableSidebar,
  type KeyboardShortcutContext,
  WORKSPACE_REGISTRY,
  FOCUS_SURFACE_ATTR,
  type UIMode,
  type FocusSurface,
  type OverlayKind,
  type WorkspaceId,
  type SurfacePolicy,
  type DerivedFocusState,
} from './focusModeRegistry';

export {
  FocusModeProvider,
  useFocusMode,
  useFocusModeOptional,
  type FocusModeContextValue,
} from './FocusModeContext';

export { FocusOverlay } from './FocusOverlay';
export { WorkspaceHost } from './WorkspaceHost';
export { useWorkspaceCloseRegistration } from './useWorkspaceCloseRegistration';
export { useWorkspaceSessionEnd } from './useWorkspaceSessionEnd';
export {
  registerWorkspaceClose,
  unregisterWorkspaceClose,
  requestWorkspaceClose,
  type WorkspaceCloseRegistration,
} from './workspaceCloseRegistry';
export {
  registerWorkspaceSessionEnd,
  unregisterWorkspaceSessionEnd,
  endWorkspaceSession,
} from './workspaceSessionRegistry';

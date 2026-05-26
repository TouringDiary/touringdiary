/**
 * Focus Mode Registry — Touring Diary
 *
 * Source of truth for UI modes, workspace definitions, and surface policies.
 * Separates application focus state from visual overlay rendering.
 *
 * MODES:
 *   home       — default; no dimming overlay
 *   workspace  — split-view focus (Valigia, future Roadbook/Planner/AI workspace)
 *   modal      — classic fullscreen consumer modal + #focus-overlay dim stack
 *   preview    — Esplora section preview (NavigationContext-driven)
 *   immersive  — reserved (maps, editors, full-bleed experiences)
 *
 * SURFACES (semantic, not z-index):
 *   baseContent       — normal app flow
 *   dimmedBackground  — home hero, sidebar widgets, secondary home sections
 *   globalChrome      — news ticker + header/nav (always visible)
 *   focusCompanion    — diary + sponsor rail (workspace companions)
 *   focusActive       — primary workspace panel (Valigia, etc.)
 */

import type { NavigationViewMode } from '@/types/navigationViewMode';

export type UIMode = 'home' | 'workspace' | 'modal' | 'preview' | 'immersive';

export type FocusSurface =
  | 'baseContent'
  | 'dimmedBackground'
  | 'globalChrome'
  | 'focusCompanion'
  | 'focusActive';

export type OverlayKind = 'none' | 'workspaceDim' | 'modalDim';

interface WorkspaceDefinitionBase {
  id: string;
  modalKey: string;
  label: string;
  focusActiveOwner: string;
}

/** Registry of workspace-style focus sessions (NOT classic modals). */
export const WORKSPACE_REGISTRY = {
  packingList: {
    id: 'packingList',
    modalKey: 'packingList',
    label: 'Valigia',
    focusActiveOwner: 'SuitcaseFloatingPanel',
  },
} as const satisfies Record<string, WorkspaceDefinitionBase>;

type WorkspaceRegistry = typeof WORKSPACE_REGISTRY;
export type WorkspaceId = keyof WorkspaceRegistry;
export type WorkspaceModalKey = WorkspaceRegistry[WorkspaceId]['modalKey'];

export interface WorkspaceDefinition extends WorkspaceDefinitionBase {
  id: WorkspaceId;
}

/** modalKey → registry id; derived at runtime from WORKSPACE_REGISTRY modalKey literals. */
type WorkspaceByModalKey = {
  [K in WorkspaceId as WorkspaceRegistry[K]['modalKey']]: K;
};

const WORKSPACE_BY_MODAL_KEY: WorkspaceByModalKey = {
  packingList: 'packingList',
};

function isWorkspaceModalKey(key: string): key is WorkspaceModalKey {
  return Object.prototype.hasOwnProperty.call(WORKSPACE_BY_MODAL_KEY, key);
}

export function resolveWorkspaceId(activeModal: string | null): WorkspaceId | null {
  if (!activeModal) return null;
  if (isWorkspaceModalKey(activeModal)) {
    return WORKSPACE_BY_MODAL_KEY[activeModal];
  }
  return null;
}

export interface SurfacePolicy {
  dimmed: boolean;
  interactive: boolean;
}

type ModeSurfaceMatrix = Record<FocusSurface, SurfacePolicy>;

const HOME_POLICIES: ModeSurfaceMatrix = {
  baseContent: { dimmed: false, interactive: true },
  dimmedBackground: { dimmed: false, interactive: true },
  globalChrome: { dimmed: false, interactive: true },
  focusCompanion: { dimmed: false, interactive: true },
  focusActive: { dimmed: false, interactive: true },
};

const WORKSPACE_POLICIES: ModeSurfaceMatrix = {
  baseContent: { dimmed: true, interactive: false },
  dimmedBackground: { dimmed: true, interactive: false },
  globalChrome: { dimmed: false, interactive: true },
  focusCompanion: { dimmed: false, interactive: true },
  focusActive: { dimmed: false, interactive: true },
};

const MODAL_POLICIES: ModeSurfaceMatrix = {
  baseContent: { dimmed: true, interactive: false },
  dimmedBackground: { dimmed: true, interactive: false },
  globalChrome: { dimmed: false, interactive: true },
  focusCompanion: { dimmed: true, interactive: false },
  focusActive: { dimmed: true, interactive: false },
};

const PREVIEW_POLICIES: ModeSurfaceMatrix = MODAL_POLICIES;

const IMMERSIVE_POLICIES: ModeSurfaceMatrix = {
  baseContent: { dimmed: true, interactive: false },
  dimmedBackground: { dimmed: true, interactive: false },
  globalChrome: { dimmed: false, interactive: true },
  focusCompanion: { dimmed: true, interactive: false },
  focusActive: { dimmed: false, interactive: true },
};

const MODE_POLICIES: Record<UIMode, ModeSurfaceMatrix> = {
  home: HOME_POLICIES,
  workspace: WORKSPACE_POLICIES,
  modal: MODAL_POLICIES,
  preview: PREVIEW_POLICIES,
  immersive: IMMERSIVE_POLICIES,
};

export function getSurfacePolicy(mode: UIMode, surface: FocusSurface): SurfacePolicy {
  return MODE_POLICIES[mode][surface];
}

export function getOverlayKind(mode: UIMode): OverlayKind {
  switch (mode) {
    case 'workspace':
      return 'workspaceDim';
    case 'modal':
    case 'preview':
      return 'modalDim';
    default:
      return 'none';
  }
}

export interface DerivedFocusState {
  mode: UIMode;
  workspaceId: WorkspaceId | null;
  overlayKind: OverlayKind;
}

/**
 * Global app keyboard shortcuts (diary undo/redo, etc.) must not fire when
 * modal/preview overlay (modalDim) owns focus.
 */
export function blocksAppKeyboardShortcuts(mode: UIMode): boolean {
  return getOverlayKind(mode) === 'modalDim';
}

export type KeyboardShortcutContext = Pick<DerivedFocusState, 'overlayKind' | 'workspaceId'>;

/** Active registry-resolved workspace session owns global undo/redo. */
export function focusSessionOwnsKeyboardShortcuts(ctx: KeyboardShortcutContext): boolean {
  return ctx.workspaceId !== null;
}

/**
 * Diary companion may handle global undo/redo when no overlay blocks and
 * no focus session owns the keyboard.
 */
export function diaryHandlesKeyboardShortcuts(ctx: KeyboardShortcutContext): boolean {
  if (ctx.overlayKind === 'modalDim') return false;
  if (focusSessionOwnsKeyboardShortcuts(ctx)) return false;
  return true;
}

/** Mode-level helper for workspace keyboard owner (equivalent when deriveFocusState is in sync). */
export function workspaceOwnsKeyboardShortcuts(mode: UIMode): boolean {
  return mode === 'workspace';
}

/** Workspace focus requires sidebar expanded for stable companion layout. */
export function workspaceRequiresStableSidebar(ctx: Pick<DerivedFocusState, 'workspaceId'>): boolean {
  return ctx.workspaceId !== null;
}

/** Whether the app shell supports focus policy derivation (workspace/modal/preview). */
export function isAppFocusShell(viewMode: NavigationViewMode): boolean {
  switch (viewMode) {
    case 'app':
      return true;
    case 'admin':
      return false;
    default: {
      const exhaustive: never = viewMode;
      return exhaustive;
    }
  }
}

/** Whether entering this view mode should dismiss an open workspace session. */
export function shouldDismissWorkspaceOnViewModeChange(viewMode: NavigationViewMode): boolean {
  switch (viewMode) {
    case 'app':
      return false;
    case 'admin':
      return true;
    default: {
      const exhaustive: never = viewMode;
      return exhaustive;
    }
  }
}

export function deriveFocusState(input: {
  viewMode: NavigationViewMode;
  activeModal: string | null;
  activePreviewOpen: boolean;
}): DerivedFocusState {
  let result: DerivedFocusState;

  if (!isAppFocusShell(input.viewMode)) {
    result = { mode: 'home', workspaceId: null, overlayKind: 'none' };
  } else {
    // activeModal owns workspace sessions — must take precedence over preview.
    const workspaceId = resolveWorkspaceId(input.activeModal);
    if (workspaceId) {
      result = { mode: 'workspace', workspaceId, overlayKind: 'workspaceDim' };
    } else if (input.activePreviewOpen) {
      result = { mode: 'preview', workspaceId: null, overlayKind: 'modalDim' };
    } else if (input.activeModal !== null) {
      result = { mode: 'modal', workspaceId: null, overlayKind: 'modalDim' };
    } else {
      result = { mode: 'home', workspaceId: null, overlayKind: 'none' };
    }
  }

  return result;
}

/** data-focus-surface attribute values used in markup for debugging & policy alignment. */
export const FOCUS_SURFACE_ATTR = {
  baseContent: 'base-content',
  dimmedBackground: 'dimmed-background',
  globalChrome: 'global-chrome',
  focusCompanion: 'focus-companion',
  focusActive: 'focus-active',
} as const;

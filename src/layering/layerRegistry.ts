/**
 * Layer Registry — Touring Diary
 *
 * Source of truth for z-index semantics AND ownership.
 * UI mode / focus policy: src/focus/focusModeRegistry.ts
 *
 * RULES:
 *  – DO NOT add tiers without defining ownership and portal policy.
 *  – DO NOT import this file in runtime components — use @/constants/zIndex for values.
 *  – DO NOT use Z_ERROR_BOUNDARY for UI layering.
 *
 * FOCUS WORKSPACE STACK (9000–9399):
 *  focusDim (9000) dims inline dimmedBackground surfaces.
 *  focusCompanion (9100), globalChrome (9200), focusActive (9300) bypass workspace dim.
 *  Modal/preview uses separate overlay tier at 14000 (modalDim).
 *
 * BACKDROP-FILTER WARNING:
 *  backdrop-filter creates a GPU compositing layer. When applied to a persistent overlay
 *  at opacity:0, it blurs content at lower z. FocusOverlay mounts/unmounts per mode;
 *  if reverting to persistent nodes, conditional-apply blur on active state only.
 */

export type LayerTier =
  | 'base'
  | 'stickyInScroll'
  | 'focusDim'
  | 'focusCompanion'
  | 'globalChrome'
  | 'focusActive'
  | 'dropdown'
  | 'popover'
  | 'modal'
  | 'modalNested'
  | 'adminModal'
  | 'adminModalNested'
  | 'adminModalTop'
  | 'overlay'
  | 'lightbox'
  | 'toast'
  | 'errorBoundary';

export interface LayerSpec {
  z: number;
  owner: string;
  description: string;
  bypassesOverlay: boolean;
  portalTarget: 'inline' | 'body';
  escHandling: 'none' | 'stack';
}

export const LAYER_REGISTRY: Record<LayerTier, LayerSpec> = {
  base: {
    z: 0,
    owner: 'document',
    description: 'Normal document flow. Sidebar shell, main content, home sections.',
    bypassesOverlay: false,
    portalTarget: 'inline',
    escHandling: 'none',
  },
  stickyInScroll: {
    z: 100,
    owner: 'Scroll container (DiaryTimeline)',
    description:
      'Sticky rows inside overflow-y-auto. z is relative to scroll container, NOT document root.',
    bypassesOverlay: false,
    portalTarget: 'inline',
    escHandling: 'none',
  },
  focusDim: {
    z: 9000,
    owner: 'FocusOverlay (workspace mode)',
    description:
      'Workspace focus dim overlay. Active when UIMode=workspace. ' +
      'Dims dimmedBackground (sidebar widgets, home hero). ' +
      'Bypassed by focusCompanion, globalChrome, focusActive.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'none',
  },
  focusCompanion: {
    z: 9100,
    owner: 'Sidebar.tsx (workspace companion portal)',
    description:
      'Portaled diary panel + sponsor rail during workspace focus. ' +
      'createPortal(_, document.body), fixed, keyed to --sidebar-diary-top.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'none',
  },
  globalChrome: {
    z: 9200,
    owner: 'AppShell.tsx (news + header)',
    description:
      'Persistent app chrome. Geometrically above overlay top edge; z tier for portaled menus.',
    bypassesOverlay: true,
    portalTarget: 'inline',
    escHandling: 'none',
  },
  focusActive: {
    z: 9300,
    owner: 'WorkspaceHost → SuitcaseFloatingPanel (+ future workspaces)',
    description:
      'Primary workspace panel during UIMode=workspace. NOT a classic modal.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  dropdown: {
    z: 10000,
    owner: 'Header.tsx, inline chrome menus',
    description: 'Portaled header menus and inline dropdowns. CSS class: z-dropdown.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  popover: {
    z: 10500,
    owner: 'AnchoredPopover, inline dropdowns',
    description: 'Anchored popovers. For overflow-hidden ancestors use portal + anchorRef.',
    bypassesOverlay: false,
    portalTarget: 'inline',
    escHandling: 'stack',
  },
  modal: {
    z: 11000,
    owner: 'ModalManager / ModalContext',
    description:
      'Classic fullscreen consumer modals (nested inside td-modal-overlay at Z_OVERLAY). ' +
      'Does NOT include workspace focus panels (see focusActive).',
    bypassesOverlay: false,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  modalNested: {
    z: 12000,
    owner: 'Individual modals / DiaryHeader',
    description: 'Nested confirmations, CustomCalendar (portaled), inline pickers.',
    bypassesOverlay: false,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  adminModal: {
    z: 13000,
    owner: 'AdminDashboard sub-components',
    description: 'Admin super-layer above consumer modal stack.',
    bypassesOverlay: false,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  adminModalNested: {
    z: 13100,
    owner: 'AdminPhotoInspector, PartnerDetailModal (nested)',
    description: 'Nested confirmations inside admin modals.',
    bypassesOverlay: false,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  adminModalTop: {
    z: 13200,
    owner: 'AdminPhotoInspector (top actions)',
    description: 'Topmost admin layer for inspector actions.',
    bypassesOverlay: false,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  overlay: {
    z: 14000,
    owner: 'FocusOverlay (modal/preview mode) + td-modal-overlay',
    description:
      'Modal & preview dimming. Active when UIMode=modal|preview. ' +
      'Chrome-safe: top at var(--header-height).',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'none',
  },
  lightbox: {
    z: 15000,
    owner: 'GalleryLightbox, ShopPage',
    description: 'Full-viewport media lightbox.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'stack',
  },
  toast: {
    z: 16000,
    owner: 'GlobalAlert, SuitcaseToast, DiaryModals success toast',
    description: 'Non-blocking notification toasts.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'none',
  },
  errorBoundary: {
    z: 99999,
    owner: 'Error boundary ONLY',
    description: 'DO NOT USE for UI layering.',
    bypassesOverlay: true,
    portalTarget: 'body',
    escHandling: 'none',
  },
} as const;

export const ESC_POLICY = {
  hook: 'useGlobalModalEscape (delegates to useCloseOnEscape)',
  stack: 'LIFO module-level escapeStack[] in src/hooks/useCloseOnEscape.ts',
  rule: 'Only escapeStack[stack.length - 1] fires. Others return early.',
  forbidden: 'window.addEventListener("keydown") for Escape in modal/overlay components.',
} as const;

export const PORTAL_POLICY = {
  workspaceCompanion: 'document.body (Sidebar diary + sponsor)',
  workspaceActive: 'document.body (WorkspaceHost panels)',
  modal: 'document.body',
  adminDrawer: 'document.body (SideEditorPanel, PartnerDetailModal)',
  calendarInDiary: 'document.body via anchorRef (inside overflow-hidden)',
  lightbox: 'document.body',
  toast: 'document.body',
} as const;

/**
 * FOCUS MODE POLICY
 *
 * UIMode derivation: src/focus/focusModeRegistry.ts → deriveFocusState()
 * Visual overlay: src/focus/FocusOverlay.tsx
 * Workspace panels: src/focus/WorkspaceHost.tsx
 *
 * Workspaces (packingList, future roadbook/planner) are NOT modal exceptions.
 * They activate UIMode=workspace via WORKSPACE_REGISTRY.modalKey lookup.
 */
export const FOCUS_MODE_POLICY = {
  registry: 'src/focus/focusModeRegistry.ts',
  provider: 'FocusModeProvider',
  overlay: 'FocusOverlay (workspaceDim | modalDim | none)',
  workspaceHost: 'WorkspaceHost',
} as const;

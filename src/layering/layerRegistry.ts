/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  TOURING DIARY — LAYER SYSTEM                                                 ║
 * ║  Single source of truth for z-index semantics, ownership & rules.            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * This file is TECHNICAL DOCUMENTATION, not just a list of constants.
 *  • Numeric values:        src/constants/zIndex.ts
 *  • Tailwind CSS classes:  src/index.css (@theme → --z-index-* → z-*)
 *  • UI mode / focus policy: src/focus/focusModeRegistry.ts
 *  • Enforcement:           `npm run lint:layers` (scripts/check-layers.ts)
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. THE MODEL — TWO CLASSES + CONTAINMENT
 * ──────────────────────────────────────────────────────────────────────────────
 * Every layer belongs to exactly one CLASS:
 *
 *   LOCAL  (0–999)   Lives inside a component's OWN stacking context. Its numeric
 *                    value only orders it against its siblings. It is physically
 *                    incapable of covering a global layer because of the
 *                    Containment Boundary (below). LOCAL layers are NEVER portaled.
 *
 *   GLOBAL (9000+)   Lives in the document/body root stacking context. One strictly
 *                    ordered scale shared by the whole app. GLOBAL layers are ALWAYS
 *                    portaled to document.body, OR are part of the fixed app chrome.
 *
 * THE CONTAINMENT BOUNDARY (the keystone)
 *   The page-content surface (MainLayout → AppRouter wrapper) sets `isolation: isolate`.
 *   Everything rendered as page content is therefore trapped below the first global
 *   tier — no matter how high its local z-index. Consequence:
 *
 *        PORTALING == PROMOTION TO THE GLOBAL STACK.
 *
 *   A component escapes page content into the global band ONLY by portaling to
 *   document.body. A component that does not portal is, by definition, local and can
 *   never exceed the focus band. This turns z-index from "a global number war" into
 *   "local role + explicit promotion" — which is what makes the system scalable.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 2. HOW TO USE A TIER (decision guide)
 * ──────────────────────────────────────────────────────────────────────────────
 *   Q: Does my element need to cover OTHER components / the whole app?
 *      NO  → it is LOCAL. Do NOT portal. Then pick by role:
 *            • surface's own content over its own media        → raised
 *            • detached badge/control stamped on media         → overlay
 *            • panel/nav-bar/pill with its OWN opaque surface  → chrome
 *            • anchored transient menu within the parent       → flyout
 *            • bar pinned in a scroll container                → sticky
 *            • drawer covering the surface body, above sticky  → drawer
 *      YES → it is GLOBAL. It MUST portal to body. Pick popover / modal / lightbox /
 *            toast, or a focus-band tier if it is a workspace surface.
 *
 *   Q: overlay or chrome? → Does it have its OWN opaque container surface (a panel/bar)?
 *            YES → chrome.  NO (bare badge/control) → overlay.
 *
 *   Q: My local menu gets clipped by an overflow-hidden / isolated ancestor.
 *      → Promote it: portal to body with an anchorRef and use `popover` (global).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 3. BACKDROP-FILTER WARNING
 * ──────────────────────────────────────────────────────────────────────────────
 *   backdrop-filter creates a GPU compositing layer. On a persistent overlay at
 *   opacity:0 it still blurs lower content. FocusOverlay mounts/unmounts per mode;
 *   if reverting to persistent nodes, apply blur conditionally on active state only.
 */

export type LayerClass = 'local' | 'global';

export type LayerTier =
  // ── LOCAL ──
  | 'base'
  | 'localRaised'
  | 'localOverlay'
  | 'localChrome'
  | 'localFlyout'
  | 'localSticky'
  | 'homeHero'
  | 'localDrawer'
  // ── GLOBAL ──
  | 'focusDim'
  | 'focusCompanion'
  | 'globalChrome'
  | 'focusActive'
  | 'popover'
  | 'modal'
  | 'modalNested'
  | 'adminModal'
  | 'adminModalNested'
  | 'adminModalTop'
  | 'overlayBackdrop'
  | 'overlay'
  | 'lightbox'
  | 'toast'
  | 'errorBoundary';

export interface LayerSpec {
  /** Numeric value (mirror of src/constants/zIndex.ts). */
  z: number;
  /** local = confined to own stacking context; global = root/body scale. */
  class: LayerClass;
  /** CSS utility class (Tailwind) and/or constant name. */
  token: string;
  /** Who is allowed to own/produce elements at this tier. */
  owner: string;
  /** What this tier is FOR. */
  purpose: string;
  /** Concrete example components. */
  examples: string;
  /** Components that MUST NOT use this tier (with the reason). */
  forbidden: string;
  /**
   * Portal policy:
   *   'forbidden' — must stay inline in its own stacking context (LOCAL).
   *   'required'  — must createPortal(document.body) (GLOBAL).
   *   'chrome'    — fixed app chrome, rendered inline at the shell root (GLOBAL).
   */
  portal: 'forbidden' | 'required' | 'chrome';
  /** Does it intentionally paint above the workspace focus dim? */
  bypassesOverlay: boolean;
  /** Escape-key handling: 'none' or LIFO 'stack' (see ESC_POLICY). */
  escHandling: 'none' | 'stack';
}

export const LAYER_REGISTRY: Record<LayerTier, LayerSpec> = {
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║ LOCAL STACK (0–999) — confined; portal forbidden                           ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  base: {
    z: 0,
    class: 'local',
    token: 'z-0 / Z_BASE (implicit)',
    owner: 'Document flow',
    purpose: 'Media, decorative backgrounds and normal in-flow content.',
    examples: 'Hero image, card image, gradients, page sections, sidebar shell.',
    forbidden: 'Nothing — this is the default.',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localRaised: {
    z: 10,
    class: 'local',
    token: 'z-local-raised / Z_LOCAL_RAISED',
    owner: 'Any self-contained surface (card, hero, tile, widget)',
    purpose:
      "The surface's OWN primary content above its OWN background/media (non-interactive, in-flow). " +
      'USE WHEN: lifting a surface\'s text/content over its own image or gradient.',
    examples: 'CityHeader mobile text overlay, ShowcaseCards text content, WeatherWidget content, NearbyCitiesRow content over its gradient.',
    forbidden:
      'Detached badges/controls (use localOverlay). Panels/bars with their own surface (use localChrome). ' +
      'Anything that must cover OTHER components — that is global (popover/modal).',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localOverlay: {
    z: 20,
    class: 'local',
    token: 'z-local-overlay / Z_LOCAL_OVERLAY',
    owner: 'Any self-contained surface',
    purpose:
      'Detached MARKERS / CONTROLS stamped on media WITHOUT their own grouping surface. ' +
      'USE WHEN: badges, labels or individual floating buttons sit over media.',
    examples: 'Sponsor/distance/"Novità" badges, like & add buttons, CityHeader top-right cluster & quick-actions column, desktop action bar (transparent container).',
    forbidden:
      'Anything with its OWN opaque container surface (a panel/bar/pill) — use localChrome. ' +
      'Global menus/dialogs — those portal and use popover/modal.',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localChrome: {
    z: 30,
    class: 'local',
    token: 'z-local-chrome / Z_LOCAL_CHROME',
    owner: 'Any self-contained surface that frames a region over its media',
    purpose:
      'Opaque LOCAL CHROME with its OWN grouping surface: floating panels, nav/menu bars, toolbars, pills ' +
      'that have their own background and frame a region over the media. ' +
      'USE WHEN: the element is a panel/bar (own opaque backdrop), not a bare badge/control.',
    examples: 'CityHeader info side-panel, "DNA Città" panel, mobile secondary nav pill, desktop secondary nav bar.',
    forbidden:
      'Bare badges/controls without a container (use localOverlay). Anchored transient menus (use localFlyout). ' +
      'Anything that must cover OTHER components/app — that is global (popover/modal/focus band).',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localFlyout: {
    z: 40,
    class: 'local',
    token: 'z-local-flyout / Z_LOCAL_FLYOUT',
    owner: 'Local chrome that opens an anchored menu within its own bounds',
    purpose:
      'Anchored transient menu rendered WITHIN the parent (no portal, no clipping risk). Sits ABOVE localChrome ' +
      'so a menu opened from a bar covers it. USE WHEN: a small menu fits inside a non-clipping parent.',
    examples: 'CityCategoryTab inline Sort / Contribute menus.',
    forbidden: 'Menus that must escape an overflow-hidden/isolated ancestor — promote to popover (global). Persistent chrome (use localChrome).',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localSticky: {
    z: 100,
    class: 'local',
    token: 'z-local-sticky / Z_LOCAL_STICKY',
    owner: 'Scroll container chrome',
    purpose:
      'Sticky bar pinned within a scroll container while siblings scroll (position: sticky), relative to the ' +
      'scroll container, NOT the document root. USE WHEN: a bar must stay pinned while content scrolls under it.',
    examples: 'CityDetailContent tab bar, CityShowcaseTab headers, CityCategoryTab toolbar.',
    forbidden: 'Absolute floating chrome that does not scroll-pin (use localChrome). Anything needing to cover global surfaces.',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  homeHero: {
    z: 200,
    class: 'local',
    token: 'z-home-hero / Z_HOME_HERO',
    owner: 'HomeContent.tsx hero wrapper',
    purpose:
      'DEPRECATED specialised localSticky: home hero sticky shell — above scrolling cards/badges, below the ' +
      'focus band. USE WHEN: never in new code — migrate to localSticky.',
    examples: 'HomeContent hero shell.',
    forbidden: 'Non-home components. New code must use localSticky.',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  localDrawer: {
    z: 300,
    class: 'local',
    token: 'z-local-drawer / Z_LOCAL_DRAWER',
    owner: 'A parent surface that hosts an in-surface drawer (e.g. a workspace editor)',
    purpose:
      'In-surface DRAWER / covering panel that overlays its sibling content (including sticky headers) WITHIN a ' +
      'parent surface — confined, never portaled, above localSticky. ' +
      'USE WHEN: a drawer/expanding panel must cover the surface body but stay inside it.',
    examples: 'SuitcaseMobileSuggestionsDrawer over the Valigia editor body.',
    forbidden:
      'A drawer that must cover the whole APP — that is global (portal + modal/overlay), NOT this tier. ' +
      'Bars/panels that do not cover sibling content (use localChrome/localSticky).',
    portal: 'forbidden',
    bypassesOverlay: false,
    escHandling: 'none',
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║ GLOBAL STACK (9000+) — root/body context; portal required or chrome        ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // ── Focus workspace band (9000–9399) ──
  focusDim: {
    z: 9000,
    class: 'global',
    token: 'z-focus-dim / Z_FOCUS_DIM',
    owner: 'FocusOverlay (workspace mode)',
    purpose: 'Dims dimmedBackground while a workspace is active. Bypassed by companion/chrome/active.',
    examples: 'FocusOverlay workspaceDim.',
    forbidden: 'Anything other than the single workspace dim overlay.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'none',
  },
  focusCompanion: {
    z: 9100,
    class: 'global',
    token: 'z-focus-companion / Z_FOCUS_COMPANION',
    owner: 'Sidebar.tsx (workspace companion portal), MainLayout mobile diary/weather overlays',
    purpose: 'Portaled diary panel + sponsor rail that stay visible beside an active workspace.',
    examples: 'Diary companion, mobile diary fullscreen overlay, weather overlay.',
    forbidden: 'Page content. Companion surfaces only.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'none',
  },
  globalChrome: {
    z: 9200,
    class: 'global',
    token: 'z-global-chrome / Z_GLOBAL_CHROME',
    owner: 'AppShell.tsx (news ticker + header + mobile nav)',
    purpose: 'Persistent app chrome. Always reachable above workspaces; tier for portaled header menus.',
    examples: 'Header, NewsTicker, MobileNavBar.',
    forbidden: 'Feature/page components. App shell chrome only.',
    portal: 'chrome',
    bypassesOverlay: true,
    escHandling: 'none',
  },
  focusActive: {
    z: 9300,
    class: 'global',
    token: 'z-focus-active / Z_FOCUS_ACTIVE',
    owner: 'WorkspaceHost → SuitcaseFloatingPanel (+ future workspaces)',
    purpose: 'Primary workspace panel. NOT a modal: uses the focus dim, coexists with chrome/companion.',
    examples: 'Valigia (SuitcaseFloatingPanel); future Roadbook / Planner.',
    forbidden: 'Classic modals/dialogs (use the modal surface). Non-workspace components.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'stack',
  },

  // ── Anchored transient menus (single tier; absorbs legacy "dropdown") ──
  popover: {
    z: 10000,
    class: 'global',
    token: 'z-popover / Z_POPOVER (legacy alias: z-dropdown / Z_DROPDOWN)',
    owner: 'Header menus, anchored dropdowns/popovers',
    purpose: 'Anchored, dismiss-on-outside transient menus above chrome & workspaces, below modals.',
    examples: 'Header menu, NearbyCitiesRow filter menu (portaled), any promoted local flyout.',
    forbidden: 'Inline menus that fit within their parent — keep those local (localFlyout).',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'stack',
  },

  // ── Consumer modal surface (panel values are local to the td-modal-overlay backdrop) ──
  modal: {
    z: 11000,
    class: 'global',
    token: 'z-modal / Z_MODAL',
    owner: 'ModalManager / BaseFullscreenModalShell',
    purpose: 'Fullscreen consumer modal panel, rendered inside the modal backdrop (Z_OVERLAY).',
    examples: 'PoiDetailModal, AuthModal, ShareModal, etc.',
    forbidden: 'Workspace panels (use focusActive). Page chrome.',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'stack',
  },
  modalNested: {
    z: 12000,
    class: 'global',
    token: 'z-modal-nested / Z_MODAL_NESTED',
    owner: 'Individual modals / pickers',
    purpose: 'Confirmation/picker stacked above a modal panel (local depth within the modal backdrop).',
    examples: 'CustomCalendar (portaled), nested confirmations.',
    forbidden: 'Standalone overlays unrelated to an open modal.',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'stack',
  },

  // ── Admin super-band (separate view-mode) ──
  adminModal: {
    z: 13000,
    class: 'global',
    token: 'z-admin-modal / Z_ADMIN_MODAL',
    owner: 'Admin Dashboard sub-components',
    purpose: 'Admin modal surface. Admin is its own view-mode; does not coexist with consumer modals.',
    examples: 'AdminCityEditor, EditUserModal, PartnerDetailModal.',
    forbidden: 'Consumer components. (See MIGRATION_NOTES: some suitcase tabs borrow this — tech-debt.)',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'stack',
  },
  adminModalNested: {
    z: 13100,
    class: 'global',
    token: 'z-admin-modal-nested / Z_ADMIN_MODAL_NESTED',
    owner: 'Admin nested dialogs',
    purpose: 'Nested confirmations inside admin modals.',
    examples: 'AdminGamification reward editor, PhotoModeration nested.',
    forbidden: 'Consumer components.',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'stack',
  },
  adminModalTop: {
    z: 13200,
    class: 'global',
    token: 'z-admin-modal-top / Z_ADMIN_MODAL_TOP',
    owner: 'Admin topmost actions',
    purpose: 'Topmost admin layer (inspector actions, toasts within admin).',
    examples: 'AdminPhotoInspector actions, AdminSocialStudio top bar.',
    forbidden: 'Consumer components.',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'stack',
  },

  // ── Top global surfaces ──
  overlayBackdrop: {
    z: 13900,
    class: 'global',
    token: 'z-overlay-backdrop / Z_OVERLAY_BACKDROP',
    owner: 'Spare',
    purpose: 'Reserved backdrop tier between admin and the modal/preview dim.',
    examples: '(spare)',
    forbidden: 'Do not use without documenting here first.',
    portal: 'required',
    bypassesOverlay: false,
    escHandling: 'none',
  },
  overlay: {
    z: 14000,
    class: 'global',
    token: 'z-overlay / Z_OVERLAY',
    owner: 'FocusOverlay (modal/preview mode) + td-modal-overlay',
    purpose: 'Modal & preview dimming backdrop. Consumer modal panels render INSIDE this.',
    examples: 'td-modal-overlay backdrop, FocusOverlay modalDim.',
    forbidden: 'Content panels (they go inside, at modal). Non-modal features.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'none',
  },
  lightbox: {
    z: 15000,
    class: 'global',
    token: 'z-lightbox / Z_LIGHTBOX',
    owner: 'GalleryLightbox, ShopPage',
    purpose: 'Full-viewport media lightbox above modals.',
    examples: 'GalleryLightbox.',
    forbidden: 'Non-media-fullscreen surfaces.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'stack',
  },
  toast: {
    z: 16000,
    class: 'global',
    token: 'z-toast / Z_TOAST',
    owner: 'GlobalAlert, SuitcaseToast, success toasts',
    purpose: 'Non-blocking notifications above all interactive surfaces.',
    examples: 'GlobalAlert, SuitcaseToast.',
    forbidden: 'Blocking content. Toasts must not trap interaction.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'none',
  },
  errorBoundary: {
    z: 99999,
    class: 'global',
    token: 'z-error-boundary / Z_ERROR_BOUNDARY',
    owner: 'Error boundary ONLY',
    purpose: 'Crash overlay.',
    examples: 'Top-level error boundary.',
    forbidden: 'EVERYTHING else. Never use for UI layering.',
    portal: 'required',
    bypassesOverlay: true,
    escHandling: 'none',
  },
} as const;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * 4. PERMANENT ARCHITECTURAL RULES
 * ──────────────────────────────────────────────────────────────────────────────
 * These are invariants. New features (Roadbook, Marketplace, Planner, dashboards,
 * widgets…) must comply without exceptions. Enforced by `npm run lint:layers`.
 */
export const ARCHITECTURAL_RULES = [
  'R1 — A LOCAL component must NEVER use a GLOBAL tier (9000+). If it needs to cover other components, it must become global (portal).',
  'R2 — A GLOBAL component must NEVER use a LOCAL tier. Global surfaces portal to body (or are app chrome).',
  'R3 — No numeric z-index in components: `z-10`, `z-[999]`, `style={{ zIndex: 50 }}` are forbidden. Use a semantic token / CSS class only.',
  'R4 — Every new layer is added to constants/zIndex.ts + index.css AND documented here BEFORE use. No ad-hoc tiers.',
  'R5 — Portaling == promotion to the global stack. To escape the page Containment Boundary you MUST portal to document.body.',
  'R6 — Local menus that risk clipping by an overflow-hidden/isolated ancestor must be promoted to `popover` (global, portaled with anchorRef).',
  'R7 — Each tier must keep an owner, a purpose, examples and a forbidden-list in this registry.',
] as const;

/** The single CSS rule that makes LOCAL layers safe. Do not remove. */
export const CONTAINMENT_BOUNDARY = {
  where: 'MainLayout.tsx → AppRouter wrapper div',
  how: 'isolation: isolate (Tailwind `isolate`)',
  why: 'Caps all page-content z-indexes below the global band, so page elements can never cover workspaces/modals.',
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
  modal: 'document.body (BaseFullscreenModalShell)',
  adminDrawer: 'document.body (SideEditorPanel, PartnerDetailModal)',
  calendarInDiary: 'document.body via anchorRef (inside overflow-hidden)',
  lightbox: 'document.body',
  toast: 'document.body',
} as const;

export const FOCUS_MODE_POLICY = {
  registry: 'src/focus/focusModeRegistry.ts',
  provider: 'FocusModeProvider',
  overlay: 'FocusOverlay (workspaceDim | modalDim | none)',
  workspaceHost: 'WorkspaceHost',
  workspaceElevation: 'src/layering/resolveWorkspacePanelZIndex.ts',
  workspaceShellGeometry: 'src/layering/resolveWorkspaceShellGeometry.ts',
} as const;

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * 5. MIGRATION NOTES / KNOWN TECH-DEBT
 * ──────────────────────────────────────────────────────────────────────────────
 */
export const MIGRATION_NOTES = {
  deprecatedTokens: {
    'z-dropdown / Z_DROPDOWN': 'Alias of popover. Migrate usages to z-popover / Z_POPOVER.',
    'z-sticky-in-scroll / Z_STICKY_IN_SCROLL': 'Alias of localSticky. Migrate to z-local-sticky.',
    'z-home-hero-surface / Z_HOME_HERO_SURFACE': 'Alias of localRaised. Migrate to z-local-raised.',
    'z-home-card-overlay / Z_HOME_CARD_OVERLAY': 'Alias of localOverlay. Migrate to z-local-overlay.',
    'z-home-hero-popover / Z_HOME_HERO_POPOVER': 'Alias of localFlyout. Migrate to z-local-flyout.',
    'z-floating-panel / Z_FLOATING_PANEL': 'Alias of focusCompanion.',
  },
  adminTierBorrowers: [
    'src/components/features/diary/packing_list/suitcase/tabs/TemplateSpecificItemsTab.tsx',
    'src/components/features/diary/packing_list/suitcase/tabs/AiCatalogTab.tsx',
    'src/components/features/diary/packing_list/suitcase/tabs/StandardItemsTab.tsx',
    'src/components/features/diary/packing_list/suitcase/tabs/TemplateLibraryTab.tsx',
  ],
  adminTierBorrowersNote:
    'These CONSUMER suitcase tabs import Z_ADMIN_MODAL_NESTED. Admin & consumer modals do not ' +
    'coexist as dashboards, but consumer code must not depend on the admin band. Migrate to the ' +
    'consumer modal surface (modal/modalNested) in a dedicated pass.',
  numericZIndexDebt:
    'Legacy numeric z-index (z-10/z-20/…) still exists in admin/diary areas. `npm run lint:layers` ' +
    'ratchets against a baseline so NEW numeric z-index fails while legacy is tracked for cleanup.',
} as const;

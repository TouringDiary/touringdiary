/**
 * Z-index constants — Touring Diary
 *
 * Authoritative numerical values. Semantics and ownership are defined in
 * src/layering/layerRegistry.ts — refer there before adding new tiers.
 *
 * ── Focus workspace stack (9000–9399) ─────────────────────────────────────
 *   9000  focusDim          — workspace dim overlay (FocusOverlay, workspace mode)
 *   9100  focusCompanion    — portaled diary + sponsor rail (Sidebar)
 *   9200  globalChrome      — news ticker + header shell (AppShell)
 *   9300  focusActive       — workspace panels: Valigia, future Roadbook/Planner
 *
 * ── Consumer stack (10000+) ─────────────────────────────────────────────────
 *  10000  dropdown          — header menus, inline chrome popovers (z-dropdown)
 *  10500  popover           — anchored / inline dropdowns
 *  11000  modal             — classic fullscreen consumer modals (NOT workspaces)
 *  12000  modalNested       — nested confirmations, portaled pickers
 *  13000  adminModal        — admin slide-over panel
 *  13100  adminModalNested
 *  13200  adminModalTop
 *  13900  overlayBackdrop   — spare
 *  14000  overlay           — modal/preview dim overlay (FocusOverlay, modal mode)
 *  15000  lightbox
 *  16000  toast
 *  99999  errorBoundary     — crash overlay ONLY
 */

// ── Tier: base ────────────────────────────────────────────────────────────────
export const Z_BASE = 0;

// ── Tier: stickyInScroll (local to scroll container only) ─────────────────────
export const Z_STICKY_IN_SCROLL = 100;

// ── Focus workspace stack ─────────────────────────────────────────────────────
/** Workspace dim overlay. Dims dimmedBackground; bypassed by companion/chrome/active. */
export const Z_FOCUS_DIM = 9000;

/** Portaled diary + sponsor during workspace focus. Above Z_FOCUS_DIM. */
export const Z_FOCUS_COMPANION = 9100;

/** News ticker + header. Above workspace dim; geometrically above overlay top edge. */
export const Z_GLOBAL_CHROME = 9200;

/** Primary workspace panel (SuitcaseFloatingPanel, future workspaces). */
export const Z_FOCUS_ACTIVE = 9300;

/**
 * @deprecated Use Z_FOCUS_COMPANION. Kept for incremental migration of CSS classes.
 */
export const Z_FLOATING_PANEL = Z_FOCUS_COMPANION;

// ── Tier: dropdown (inline chrome popovers) ───────────────────────────────────
/** Header menus and inline chrome popovers. CSS class: z-dropdown */
export const Z_DROPDOWN = 10000;

// ── Tier: popover ─────────────────────────────────────────────────────────────
export const Z_POPOVER = 10500;

// ── Tier: modal (classic fullscreen — NOT workspace focus) ────────────────────
export const Z_MODAL = 11000;

// ── Tier: modalNested ─────────────────────────────────────────────────────────
export const Z_MODAL_NESTED = 12000;

// ── Tier: adminModal ──────────────────────────────────────────────────────────
export const Z_ADMIN_MODAL = 13000;
export const Z_ADMIN_MODAL_NESTED = 13100;
export const Z_ADMIN_MODAL_TOP = 13200;

// ── Tier: overlayBackdrop (spare) ─────────────────────────────────────────────
export const Z_OVERLAY_BACKDROP = 13900;

// ── Tier: overlay (modal / preview dim) ───────────────────────────────────────
/**
 * Modal & preview dimming backdrop (FocusOverlay modalDim).
 * CRITICAL: backdrop-filter MUST be conditional on active state when using
 * a persistent DOM node — workspace/modal overlays mount/unmount instead.
 */
export const Z_OVERLAY = 14000;

// ── Tier: lightbox ────────────────────────────────────────────────────────────
export const Z_LIGHTBOX = 15000;
export const Z_LIGHTBOX_CONTENT = 15100;
export const Z_LIGHTBOX_CLOSE = 15200;

// ── Tier: toast ───────────────────────────────────────────────────────────────
export const Z_TOAST = 16000;

// ── Tier: errorBoundary ───────────────────────────────────────────────────────
export const Z_ERROR_BOUNDARY = 99999;

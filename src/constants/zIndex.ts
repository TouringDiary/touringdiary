/**
 * Z-index constants — Touring Diary Layer System
 *
 * AUTHORITATIVE NUMERIC VALUES. Semantics, ownership, allowed/forbidden users and
 * portal policy are documented in src/layering/layerRegistry.ts — read it before
 * adding, changing or using any tier.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE LAYER SYSTEM IN ONE RULE
 * ──────────────────────────────────────────────────────────────────────────────
 * Layers are split into two classes:
 *
 *   • LOCAL  (0–999)     — live INSIDE a component's own stacking context. Their
 *                          value is meaningful ONLY among siblings. They are capped
 *                          below the global band by the page Containment Boundary
 *                          (AppRouter wrapper: `isolation: isolate`). NEVER portaled.
 *
 *   • GLOBAL (9000+)     — live in the document/body root stacking context. Single
 *                          ordered scale. ALWAYS portaled to document.body (or part
 *                          of the fixed app chrome). Portaling == promotion to global.
 *
 * Hard rules (see layerRegistry.ts → ARCHITECTURAL_RULES):
 *   1. A local component MUST NOT use a global tier.
 *   2. A global component MUST NOT use a local tier.
 *   3. NO numeric z-index in components (`z-10`, `z-[999]`, `zIndex: 50`). Use a
 *      semantic token / CSS class only. Enforced by `npm run lint:layers`.
 *   4. New layers are added HERE + in index.css + documented in layerRegistry.ts
 *      BEFORE use. No ad-hoc tiers in components.
 */

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ LOCAL STACK (0–999) — confined to a component's own stacking context       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/** Document flow: media, decorative backgrounds, normal content. Implicit default. */
export const Z_BASE = 0;

/**
 * The surface's OWN primary content sitting above its OWN background/media, within the
 * SAME surface. Non-interactive, in-flow content — NOT a stamped marker/control.
 * CSS: z-local-raised. e.g. hero title over hero image, card text over card media,
 * NearbyCitiesRow content over its own gradient.
 * Discriminator vs overlay: this is the surface's content, not a detached marker.
 */
export const Z_LOCAL_RAISED = 10;

/**
 * Detached MARKERS / CONTROLS stamped on top of media — without their own grouping
 * surface. Badges, labels and individual floating controls.
 * CSS: z-local-overlay. e.g. sponsor/distance/"Novità" badges, like & add buttons,
 * hero action-button clusters with a transparent container.
 * Discriminator vs chrome: NO own opaque container surface (just bare markers/controls).
 */
export const Z_LOCAL_OVERLAY = 20;

/**
 * Opaque LOCAL CHROME with its OWN grouping surface: floating panels, nav/menu bars,
 * toolbars and pills that have their own background and frame a region over the media.
 * CSS: z-local-chrome. e.g. CityHeader info side-panel, "DNA Città" panel, secondary
 * nav pills/bars.
 * Discriminator vs overlay: HAS an own opaque container surface (a panel/bar, not a badge).
 */
export const Z_LOCAL_CHROME = 30;

/**
 * Locally-anchored menu opened from local chrome and rendered WITHIN the parent's
 * bounds (NOT portaled). Sits ABOVE local chrome so a menu opened from a bar covers it.
 * CSS: z-local-flyout. e.g. inline Sort / Contribute menus.
 * If the menu must escape an overflow-hidden / isolated ancestor → promote to Z_POPOVER.
 */
export const Z_LOCAL_FLYOUT = 40;

/**
 * Sticky bar pinned to an edge of a scroll container while siblings scroll.
 * CSS: z-local-sticky. e.g. city tab bar, section headers, home hero sticky shell.
 * Value is relative to the scroll container, never to the document root.
 */
export const Z_LOCAL_STICKY = 100;

/**
 * In-surface DRAWER / covering panel that overlays its SIBLING content (including sticky
 * headers) WITHIN a parent surface — confined, never portaled. Above Z_LOCAL_STICKY.
 * CSS: z-local-drawer. e.g. SuitcaseMobileSuggestionsDrawer over the Valigia editor body.
 * Discriminator vs global modal/overlay: a drawer that must cover the whole APP is global
 * (portal + modal/overlay), NOT this tier.
 */
export const Z_LOCAL_DRAWER = 300;

// ── Deprecated local aliases (kept for incremental migration — DO NOT use in new code) ──
/** @deprecated Use Z_LOCAL_STICKY. */
export const Z_STICKY_IN_SCROLL = Z_LOCAL_STICKY;
/** @deprecated Use Z_LOCAL_RAISED. */
export const Z_HOME_HERO_SURFACE = 10;
/** @deprecated Use Z_LOCAL_OVERLAY. */
export const Z_HOME_CARD_OVERLAY = 10;
/** @deprecated Use Z_LOCAL_FLYOUT. */
export const Z_HOME_HERO_POPOVER = 20;
/** @deprecated Use Z_LOCAL_STICKY. Home hero sticky shell (specialised localSticky; fold into localSticky). */
export const Z_HOME_HERO = 200;

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ GLOBAL STACK (9000+) — root/body context, portaled or fixed app chrome     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Focus workspace band (9000–9399) ──────────────────────────────────────────
/** Workspace dim overlay. Dims dimmedBackground; bypassed by companion/chrome/active. */
export const Z_FOCUS_DIM = 9000;

/** Portaled diary + sponsor rail during workspace focus. Above Z_FOCUS_DIM. */
export const Z_FOCUS_COMPANION = 9100;

/** News ticker + header + mobile nav. Persistent app chrome. */
export const Z_GLOBAL_CHROME = 9200;

/** Primary workspace panel (Valigia, future Roadbook/Planner). NOT a modal. */
export const Z_FOCUS_ACTIVE = 9300;

/** @deprecated Use Z_FOCUS_COMPANION. Kept for incremental migration of CSS classes. */
export const Z_FLOATING_PANEL = Z_FOCUS_COMPANION;

// ── Anchored transient menus (single tier) ────────────────────────────────────
/**
 * Anchored, dismiss-on-outside transient menus: header menus, inline dropdowns,
 * anchored popovers. Portaled to body. CSS class: z-popover.
 */
export const Z_POPOVER = 10000;

/** @deprecated Use Z_POPOVER. Same tier (anchored transient menu). CSS: z-dropdown. */
export const Z_DROPDOWN = Z_POPOVER;

// ── Modal surface (consumer) ──────────────────────────────────────────────────
/**
 * Classic fullscreen consumer modal panel. Rendered INSIDE the modal backdrop
 * (td-modal-overlay at Z_OVERLAY) — so this value is local to that backdrop's
 * stacking context, NOT a global competitor. Does NOT include workspace panels.
 */
export const Z_MODAL = 11000;

/** Nested confirmation / picker stacked above a modal panel (local to modal backdrop). */
export const Z_MODAL_NESTED = 12000;

// ── Admin super-band (separate view-mode) ─────────────────────────────────────
// Admin Dashboard is its own top-level view-mode; admin modals do not coexist with
// consumer modals as dashboards. NOTE: a few consumer suitcase tabs borrow these
// tiers (tech-debt — see layerRegistry.ts → MIGRATION_NOTES).
export const Z_ADMIN_MODAL = 13000;
export const Z_ADMIN_MODAL_NESTED = 13100;
export const Z_ADMIN_MODAL_TOP = 13200;

// ── Top global surfaces ───────────────────────────────────────────────────────
/** Spare backdrop tier. */
export const Z_OVERLAY_BACKDROP = 13900;

/**
 * Modal & preview dimming backdrop (FocusOverlay modalDim + td-modal-overlay).
 * CRITICAL: backdrop-filter MUST be conditional on active state for persistent nodes.
 */
export const Z_OVERLAY = 14000;

/** Full-viewport media lightbox. Above modals. */
export const Z_LIGHTBOX = 15000;
export const Z_LIGHTBOX_CONTENT = 15100;
export const Z_LIGHTBOX_CLOSE = 15200;

/** Non-blocking notification toasts. Above all interactive surfaces. */
export const Z_TOAST = 16000;

/** Crash overlay ONLY. NEVER use for UI layering. */
export const Z_ERROR_BOUNDARY = 99999;

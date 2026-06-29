/** Max viewport width (px) for compact typography / small-screen hero internals. */
export const MOBILE_COMPACT_MAX_WIDTH_PX = 767;

/** Media query for compact typography — single source of truth. */
export const MOBILE_COMPACT_QUERY = `(max-width: ${MOBILE_COMPACT_MAX_WIDTH_PX}px)`;

/** Max viewport width (px) for stacked hero modules (mobile + tablet, below desktop). */
export const HERO_STACKED_MAX_WIDTH_PX = 1023;

/** Media query for stacked hero layout (mobile + tablet). */
export const HERO_STACKED_QUERY = `(max-width: ${HERO_STACKED_MAX_WIDTH_PX}px)`;

/** Slide panel animation duration — matches SuitcaseFloatingPanel. */
export const SLIDE_PANEL_DURATION_MS = 500;

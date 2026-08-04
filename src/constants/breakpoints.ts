import { LAYOUT } from '@/constants/layout';

/**
 * Derived viewport thresholds — single SoT is LAYOUT.BREAKPOINTS.
 * Compact = phone typography band (below MD).
 * Stacked hero / shell "below desktop" = below LG (mobile + tablet).
 */

/** Max viewport width (px) for compact typography / small-screen hero internals. */
export const MOBILE_COMPACT_MAX_WIDTH_PX = LAYOUT.BREAKPOINTS.MD - 1;

/** Media query for compact typography — single source of truth. */
export const MOBILE_COMPACT_QUERY = `(max-width: ${MOBILE_COMPACT_MAX_WIDTH_PX}px)`;

/** Max viewport width (px) for stacked hero modules (mobile + tablet, below desktop). */
export const HERO_STACKED_MAX_WIDTH_PX = LAYOUT.BREAKPOINTS.LG - 1;

/** Media query for stacked hero layout (mobile + tablet). */
export const HERO_STACKED_QUERY = `(max-width: ${HERO_STACKED_MAX_WIDTH_PX}px)`;

/** Media query for desktop shell (sidebar, no MobileNavBar). */
export const DESKTOP_MIN_QUERY = `(min-width: ${LAYOUT.BREAKPOINTS.LG}px)`;

/** Slide panel animation duration — matches SuitcaseFloatingPanel. */
export const SLIDE_PANEL_DURATION_MS = 500;

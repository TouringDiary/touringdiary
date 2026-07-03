import type { CSSProperties } from 'react';

/** Larghezza pannello Workspace su desktop (§12.3 — laterale da destra). */
const DESKTOP_PANEL_WIDTH = '28rem';

/**
 * Geometry for the collaboration Workspace dashboard panel.
 * Desktop: right-rail, full height below header.
 * Mobile: bottom sheet (same chrome rules as other workspace shells).
 */
export function resolveCollaborationWorkspaceShellGeometry(
  isMobileViewport: boolean,
  reserveBottomNav = false,
): CSSProperties {
  if (!isMobileViewport) {
    return {
      top: 'var(--header-height)',
      right: 0,
      width: DESKTOP_PANEL_WIDTH,
      maxWidth: '100vw',
      height: `calc(100dvh - var(--header-height))`,
      maxHeight: `calc(100dvh - var(--header-height))`,
    };
  }

  const bottomReserve = reserveBottomNav ? ' - 4rem' : '';

  return {
    top: 'var(--header-height)',
    left: 0,
    right: 0,
    height: `calc(100dvh - var(--header-height)${bottomReserve})`,
    maxHeight: `calc(100dvh - var(--header-height)${bottomReserve})`,
  };
}

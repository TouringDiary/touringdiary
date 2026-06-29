import type { CSSProperties } from 'react';

/** Altezza della bottom navigation mobile (coerente con `bottom-16` di Sidebar / `h-16` di MobileNavBar). */
const MOBILE_NAV_HEIGHT = '4rem';

/**
 * Chrome-safe geometry for portaled workspace shells.
 *
 * Mobile: panel starts below news + header (--header-height from AppShell).
 * Quando la bottom navigation è visibile, riserva la sua altezza così che il
 * contenuto non finisca coperto dalla navbar.
 * Desktop: bottom-anchored panel uses lg:h-[70vh] in the component class list.
 */
export function resolveWorkspaceShellGeometry(
  isMobileViewport: boolean,
  reserveBottomNav = false,
): CSSProperties {
  if (!isMobileViewport) {
    return {};
  }

  const bottomReserve = reserveBottomNav ? ` - ${MOBILE_NAV_HEIGHT}` : '';

  return {
    top: 'var(--header-height)',
    height: `calc(100dvh - var(--header-height)${bottomReserve})`,
    maxHeight: `calc(100dvh - var(--header-height)${bottomReserve})`,
  };
}

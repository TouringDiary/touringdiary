import type { CSSProperties } from 'react';
import {
  MOBILE_NAV_HEIGHT_CSS,
  WORKSPACE_GLOBAL_PANEL_WIDTH_RATIO,
} from '@/constants/workspacePanelLayout';

/**
 * Geometry for the global Workspace hub panel.
 * Desktop: ~95% width, fixed max height below header (top-origin binder).
 * Mobile/tablet: full width, height above bottom nav.
 */
export function resolveGlobalWorkspacePanelGeometry(
  isMobileViewport: boolean,
  reserveBottomNav = true,
): CSSProperties {
  const top = 'var(--header-height)';

  if (!isMobileViewport) {
    const widthPercent = `${WORKSPACE_GLOBAL_PANEL_WIDTH_RATIO * 100}%`;
    return {
      top,
      left: 0,
      right: 0,
      marginLeft: 'auto',
      marginRight: 'auto',
      width: widthPercent,
      maxWidth: widthPercent,
    };
  }

  const bottomReserve = reserveBottomNav ? ` - ${MOBILE_NAV_HEIGHT_CSS}` : '';

  return {
    top,
    left: 0,
    right: 0,
    bottom: reserveBottomNav ? 'var(--mobile-nav-height)' : 0,
    height: reserveBottomNav
      ? undefined
      : `calc(100dvh - var(--header-height)${bottomReserve})`,
    maxHeight: reserveBottomNav
      ? undefined
      : `calc(100dvh - var(--header-height)${bottomReserve})`,
  };
}

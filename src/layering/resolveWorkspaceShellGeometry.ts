import type { CSSProperties } from 'react';

/**
 * Chrome-safe geometry for portaled workspace shells.
 *
 * Mobile: panel starts below news + header (--header-height from AppShell).
 * Desktop: bottom-anchored panel uses lg:h-[70vh] in the component class list.
 */
export function resolveWorkspaceShellGeometry(isMobileViewport: boolean): CSSProperties {
  if (!isMobileViewport) {
    return {};
  }

  return {
    top: 'var(--header-height)',
    height: 'calc(100dvh - var(--header-height))',
    maxHeight: 'calc(100dvh - var(--header-height))',
  };
}

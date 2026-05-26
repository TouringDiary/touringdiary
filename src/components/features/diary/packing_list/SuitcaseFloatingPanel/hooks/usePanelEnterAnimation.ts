import { useLayoutEffect, type RefObject } from 'react';

interface UsePanelEnterAnimationOptions {
  panelRef: RefObject<HTMLDivElement | null>;
  isPortalReady: boolean;
  setIsEntered: (value: boolean) => void;
}

/**
 * Layout-safe enter lifecycle: commit off-screen transform, then promote on next frame.
 * Replaces nested requestAnimationFrame with a single frame after layout flush.
 */
export function usePanelEnterAnimation({
  panelRef,
  isPortalReady,
  setIsEntered,
}: UsePanelEnterAnimationOptions): void {
  useLayoutEffect(() => {
    if (!isPortalReady) return;

    const element = panelRef.current;
    if (!element) return;

    // Force the browser to apply the initial translate-y-full before entering.
    void element.getBoundingClientRect();

    const frameId = requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isPortalReady, panelRef, setIsEntered]);
}

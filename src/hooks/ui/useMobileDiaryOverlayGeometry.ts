import { useEffect, type RefObject } from 'react';

function getHeaderHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 64;
}

/**
 * True when il layout viewport si è ridotto con la tastiera
 * (`interactive-widget=resizes-content` o equivalente).
 */
function layoutViewportTracksVisualViewport(
  innerHeight: number,
  offsetTop: number,
  visualHeight: number,
): boolean {
  return Math.abs(innerHeight - visualHeight - offsetTop) < 80;
}

function applyOverlayGeometry(panel: HTMLElement): void {
  const visualViewport = window.visualViewport;
  if (!visualViewport) return;

  const { offsetTop, height: visualHeight } = visualViewport;
  const innerHeight = window.innerHeight;
  const keyboardLikelyOpen = visualHeight < innerHeight * 0.85;

  if (keyboardLikelyOpen && layoutViewportTracksVisualViewport(innerHeight, offsetTop, visualHeight)) {
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.bottom = '0';
    return;
  }

  const visibleBottom = offsetTop + visualHeight;
  const overlayHeightPx = Math.max(0, visibleBottom - getHeaderHeightPx());

  panel.style.bottom = 'auto';
  panel.style.height = `${overlayHeightPx}px`;
  panel.style.maxHeight = `${overlayHeightPx}px`;
}

function clearOverlayGeometry(panel: HTMLElement): void {
  panel.style.height = '';
  panel.style.maxHeight = '';
  panel.style.bottom = '';
}

/**
 * Sincronizza la geometria dell'overlay Diario mobile con il visual viewport.
 *
 * - Con `interactive-widget=resizes-content` il layout viewport si riduce: `bottom: 0` basta.
 * - In modalità overlay (fallback) l'altezza segue `offsetTop + height` del visual viewport.
 * - Gli eventi resize/scroll vengono coalescati nello stesso turno per evitare coppie
 *   offsetTop/height desincronizzate (tipico al focus link → tastiera su iOS).
 */
export function useMobileDiaryOverlayGeometry(
  panelRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const hasVisualViewport = typeof window !== 'undefined' && window.visualViewport != null;

  useEffect(() => {
    if (!enabled) {
      const panel = panelRef.current;
      if (panel) clearOverlayGeometry(panel);
      return;
    }

    const visualViewport = window.visualViewport;
    const panel = panelRef.current;
    if (!visualViewport || !panel) return;

    let coalescePending = false;

    const sync = () => {
      const currentPanel = panelRef.current;
      if (!currentPanel) return;
      applyOverlayGeometry(currentPanel);
    };

    const scheduleSync = () => {
      if (coalescePending) return;
      coalescePending = true;
      queueMicrotask(() => {
        coalescePending = false;
        sync();
      });
    };

    sync();
    visualViewport.addEventListener('resize', scheduleSync);
    visualViewport.addEventListener('scroll', scheduleSync);

    return () => {
      visualViewport.removeEventListener('resize', scheduleSync);
      visualViewport.removeEventListener('scroll', scheduleSync);
      clearOverlayGeometry(panel);
    };
  }, [enabled, panelRef]);

  return hasVisualViewport;
}

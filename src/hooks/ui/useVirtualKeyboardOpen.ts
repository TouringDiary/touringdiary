import { useEffect, useRef, useState } from 'react';

const SHRINK_RATIO = 0.85;

function orientationKey(): string {
  const type = window.screen?.orientation?.type;
  if (type) return type;
  // Legacy fallback (iOS Safari / older WebViews).
  const angle = typeof window.orientation === 'number' ? window.orientation : 'na';
  return `legacy:${angle}`;
}

/**
 * True when the soft keyboard is likely open.
 *
 * Supports both viewport policies used by the app:
 * - `interactive-widget=resizes-content`: layout `innerHeight` shrinks vs a
 *   per-orientation baseline of the full layout height.
 * - overlay / visual-only resize: `visualViewport.height` shrinks vs layout.
 *
 * Baseline is refreshed when the keyboard is closed, when layout grows, and
 * independently per orientation (rotate / foldable posture) — no timeouts.
 *
 * Same signal class as `useMobileDiaryOverlayGeometry` — no timeouts/retries.
 */
export function useVirtualKeyboardOpen(enabled: boolean): boolean {
  const [open, setOpen] = useState(false);
  /** Full layout height per orientation key — avoids stale portrait baselines in landscape. */
  const baselinesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!enabled) {
      baselinesRef.current.clear();
      setOpen(false);
      return;
    }

    const sync = () => {
      const key = orientationKey();
      const layoutH = window.innerHeight;
      const visualH = window.visualViewport?.height ?? layoutH;
      // Overlay-mode: visual shrinks while layout stays — definitive soft-keyboard signal.
      const visualShrunk = visualH < layoutH * SHRINK_RATIO;

      if (visualShrunk) {
        setOpen(true);
        return;
      }

      // visual ≈ layout: either keyboard closed, or resizes-content (both shrunk together).
      let baseline = baselinesRef.current.get(key);
      if (baseline == null || layoutH > baseline) {
        baseline = layoutH;
        baselinesRef.current.set(key, baseline);
      }

      const layoutShrunk = layoutH < baseline * SHRINK_RATIO;
      setOpen(layoutShrunk);

      // Keyboard closed (or permanent layout change: physical keyboard, split view, unfold):
      // keep this orientation's baseline equal to the current full layout height.
      if (!layoutShrunk) {
        baselinesRef.current.set(key, layoutH);
      }
    };

    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', sync);
    visualViewport?.addEventListener('scroll', sync);
    const screenOrientation = window.screen?.orientation;
    screenOrientation?.addEventListener?.('change', sync);

    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      visualViewport?.removeEventListener('resize', sync);
      visualViewport?.removeEventListener('scroll', sync);
      screenOrientation?.removeEventListener?.('change', sync);
    };
  }, [enabled]);

  return open;
}

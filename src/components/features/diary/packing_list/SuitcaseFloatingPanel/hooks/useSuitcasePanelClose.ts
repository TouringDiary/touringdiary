import { useCallback, useLayoutEffect, useRef } from 'react';

function parseMaxTransitionDurationMs(transitionDuration: string): number {
  if (!transitionDuration || transitionDuration === 'none') return 0;
  return Math.max(
    ...transitionDuration.split(',').map((part) => {
      const value = part.trim();
      if (value.endsWith('ms')) return parseFloat(value);
      if (value.endsWith('s')) return parseFloat(value) * 1000;
      return parseFloat(value) || 0;
    }),
    0
  );
}

interface UseSuitcasePanelCloseOptions {
  isClosing: boolean;
  isEntered: boolean;
  setIsClosing: (value: boolean) => void;
  onCloseComplete: () => void;
}

/**
 * Single animated close flow for the floating suitcase panel.
 * Waits for the CSS transform transition to finish before unmounting.
 */
export function useSuitcasePanelClose({
  isClosing,
  isEntered,
  setIsClosing,
  onCloseComplete,
}: UseSuitcasePanelCloseOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closePendingRef = useRef(false);

  const finalizeClose = useCallback(() => {
    if (!closePendingRef.current) return;
    closePendingRef.current = false;
    onCloseComplete();
  }, [onCloseComplete]);

  const requestClose = useCallback(() => {
    if (closePendingRef.current || isClosing) return;
    closePendingRef.current = true;
    setIsClosing(true);
  }, [isClosing, setIsClosing]);

  useLayoutEffect(() => {
    if (!isClosing || !closePendingRef.current) return;

    const el = panelRef.current;
    if (!el) {
      finalizeClose();
      return;
    }

    const style = window.getComputedStyle(el);
    const durationMs = parseMaxTransitionDurationMs(style.transitionDuration);

    // No transition configured, or panel never entered (already off-screen).
    if (durationMs === 0 || !isEntered) {
      finalizeClose();
      return;
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== el) return;
      // Tailwind translate-* animates the `translate` property (not `transform`).
      const prop = event.propertyName;
      if (prop !== 'translate' && !prop.includes('transform')) return;
      if (!closePendingRef.current) return;
      finalizeClose();
    };

    el.addEventListener('transitionend', onTransitionEnd);
    return () => {
      el.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [isClosing, isEntered, finalizeClose]);

  return {
    panelRef,
    requestClose,
  };
}

import { useEffect, useState, type RefObject } from 'react';

/** Movimento minimo (px) per considerare un cambio di direzione: filtra micro-oscillazioni. */
const SCROLL_DELTA_THRESHOLD = 6;
/** Entro questa distanza dalla cima la barra resta sempre visibile. */
const TOP_REVEAL_ZONE = 8;

/**
 * Nasconde un elemento in base alla DIREZIONE dello scroll del container indicato:
 * - scroll verso il basso → `true` (nascondi);
 * - scroll verso l'alto → `false` (mostra);
 * - vicino alla cima → sempre `false` (visibile).
 *
 * Caratteristiche:
 * - ascolta SOLO il container passato (mai `window`), con listener passivo;
 * - registrato solo quando `enabled` è true (es. <lg + vista editor/viewer);
 * - aggiorna lo stato solo quando la visibilità cambia davvero (niente re-render inutili);
 * - nessun timer/polling/manipolazione DOM; cleanup completo al cambio deps/unmount.
 */
export function useHideOnScrollDown(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean
): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let lastScrollTop = el.scrollTop;

    const onScroll = () => {
      const current = el.scrollTop;
      const previous = lastScrollTop;
      if (Math.abs(current - previous) < SCROLL_DELTA_THRESHOLD) return;
      lastScrollTop = current;
      const nextHidden = current > previous && current > TOP_REVEAL_ZONE;
      setHidden((prev) => (prev === nextHidden ? prev : nextHidden));
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, enabled]);

  return hidden;
}

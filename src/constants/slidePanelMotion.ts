import { SLIDE_PANEL_DURATION_MS } from './breakpoints';

/**
 * Motion condivisa dei pannelli slide (Diario, Valigia, Suggerimenti, Template, pannelli interni).
 *
 * Riferimento: chiusura del Diario di Viaggio — durata {@link SLIDE_PANEL_DURATION_MS} (500ms).
 * - Apertura: il pannello sale dal basso (`translate-y-full` → `translate-y-0`) con easing `ease-out`.
 * - Chiusura: il pannello scende (`translate-y-0` → `translate-y-full`) con easing `ease-in`.
 *
 * Centralizza esclusivamente durata ed easing: nessun refactoring architetturale, i pannelli
 * continuano a gestire il proprio ciclo di vita tramite gli hook esistenti.
 */
export { SLIDE_PANEL_DURATION_MS };

/** Transizione base condivisa (proprietà animata + durata). Coerente con `SLIDE_PANEL_DURATION_MS`. */
export const SLIDE_PANEL_TRANSITION_CLASS = 'transition-transform duration-500';

/** Easing coerente: apertura `ease-out`, chiusura `ease-in`. */
export const slidePanelEaseClass = (isClosing: boolean): string =>
  isClosing ? 'ease-in' : 'ease-out';

/** Posizione: a riposo fuori schermo in basso, da aperto a 0. */
export const slidePanelTransformClass = (isRaised: boolean): string =>
  isRaised ? 'translate-y-0' : 'translate-y-full';

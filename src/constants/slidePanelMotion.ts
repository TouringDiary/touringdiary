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

/** Asse di scorrimento del pannello slide. */
export type SlidePanelAxis = 'x' | 'y';

const OFF_SCREEN_BY_AXIS: Record<SlidePanelAxis, string> = {
  y: 'translate-y-full',
  x: 'translate-x-full',
};

const OPEN_BY_AXIS: Record<SlidePanelAxis, string> = {
  y: 'translate-y-0',
  x: 'translate-x-0',
};

/**
 * Classe transform condivisa: fuori schermo sull'asse indicato → aperto a 0.
 * `y`: dal basso (default storico). `x`: da destra.
 */
export const slidePanelTransformClassByAxis = (
  axis: SlidePanelAxis,
  isRaised: boolean
): string => (isRaised ? OPEN_BY_AXIS[axis] : OFF_SCREEN_BY_AXIS[axis]);

/** Posizione: a riposo fuori schermo in basso, da aperto a 0. */
export const slidePanelTransformClass = (isRaised: boolean): string =>
  slidePanelTransformClassByAxis('y', isRaised);

/** Posizione: fuori schermo in alto → aperto a 0 (stesso lifecycle Valigia, direzione invertita). */
export const slidePanelTransformClassFromTop = (isRaised: boolean): string =>
  isRaised ? OPEN_BY_AXIS.y : '-translate-y-full';

/**
 * Pannello binder (Workspace globale): espansione top-origin via max-height.
 * Non usare translate-y — il pannello nasce sotto l'header e scende, non "sale" dal fondo.
 */
export const BINDER_PANEL_TRANSITION_CLASS = 'transition-[max-height] duration-500 overflow-hidden';

type BinderPanelRaisedVariant = 'desktop' | 'mobileWithNav' | 'mobileFull';

const BINDER_PANEL_MAX_HEIGHT_RAISED: Record<BinderPanelRaisedVariant, string> = {
  desktop: 'max-h-[var(--workspace-panel-height)]',
  mobileWithNav: 'max-h-[calc(100dvh-var(--header-height)-var(--mobile-nav-height))]',
  mobileFull: 'max-h-[calc(100dvh-var(--header-height))]',
};

const BINDER_PANEL_MIN_HEIGHT_RAISED: Record<BinderPanelRaisedVariant, string> = {
  desktop: 'min-h-[var(--workspace-panel-height)]',
  mobileWithNav: 'min-h-[calc(100dvh-var(--header-height)-var(--mobile-nav-height))]',
  mobileFull: 'min-h-[calc(100dvh-var(--header-height))]',
};

function resolveBinderPanelRaisedVariant(
  isMobileViewport: boolean,
  reserveBottomNav: boolean,
): BinderPanelRaisedVariant {
  if (!isMobileViewport) return 'desktop';
  return reserveBottomNav ? 'mobileWithNav' : 'mobileFull';
}

/** Max-height del pannello binder (animazione top-origin). */
export const binderPanelMaxHeightClass = (
  isRaised: boolean,
  isMobileViewport: boolean,
  reserveBottomNav = true,
): string => {
  if (!isRaised) return 'max-h-0';
  return BINDER_PANEL_MAX_HEIGHT_RAISED[resolveBinderPanelRaisedVariant(isMobileViewport, reserveBottomNav)];
};

/** Min-height del pannello binder — stessa metrica del max quando aperto, per altezza fissa del hub. */
export const binderPanelMinHeightClass = (
  isRaised: boolean,
  isMobileViewport: boolean,
  reserveBottomNav = true,
): string => {
  if (!isRaised) return '';
  return BINDER_PANEL_MIN_HEIGHT_RAISED[resolveBinderPanelRaisedVariant(isMobileViewport, reserveBottomNav)];
};

/** @deprecated Preferire {@link slidePanelTransformClassByAxis}('x', …). Mantenuto per retrocompatibilità. */
export const slidePanelTransformClassFromRight = (isRaised: boolean): string =>
  slidePanelTransformClassByAxis('x', isRaised);

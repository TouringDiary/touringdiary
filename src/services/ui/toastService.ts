/**
 * Toast piattaforma — unico ingresso verso `GlobalAlert` (evento `global-alert`).
 * Aspetto/animazioni = componente `GlobalAlert` montato in AppCoordinator.
 *
 * Nota Valigia: `SuitcaseToast` è un toast locale al floating panel packing (varianti
 * success/destructive) e non è il sistema globale. MySpace e messaggi app-wide usano questo helper.
 */
export function showGlobalAlert(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('global-alert', { detail: { message } }));
}

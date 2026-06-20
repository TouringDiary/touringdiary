/** Tab di navigazione della Dashboard Valigia (selector). */
export type SuitcaseSourceTab = 'start' | 'trip' | 'saved' | 'default';

export const SUITCASE_DASHBOARD_TAB_ORDER: SuitcaseSourceTab[] = [
  'start',
  'trip',
  'saved',
  'default',
];

export function getSuitcaseTabLabel(tab: SuitcaseSourceTab): string {
  switch (tab) {
    case 'start':
      return 'Inizia';
    case 'trip':
      return 'Diario';
    case 'saved':
      return 'Salvate';
    case 'default':
      return 'Template';
  }
}

/**
 * Tab iniziale per utenti con contenuti (valigie di viaggio o salvate).
 * Per guest/auth senza valigie usare sempre `'start'`.
 */
export function resolveInitialSuitcaseTab(
  tripSuitcaseCount: number,
  savedSuitcaseCount: number
): SuitcaseSourceTab {
  if (tripSuitcaseCount > 0) return 'trip';
  if (savedSuitcaseCount > 0) return 'saved';
  return 'default';
}

/** True se l'utente non ha ancora valigie operative (viaggio o salvate). */
export function isSuitcaseDashboardEmpty(
  tripSuitcaseCount: number,
  savedSuitcaseCount: number
): boolean {
  return tripSuitcaseCount === 0 && savedSuitcaseCount === 0;
}

export function resolveDefaultSuitcaseTab(
  tripSuitcaseCount: number,
  savedSuitcaseCount: number
): SuitcaseSourceTab {
  if (isSuitcaseDashboardEmpty(tripSuitcaseCount, savedSuitcaseCount)) {
    return 'start';
  }
  return resolveInitialSuitcaseTab(tripSuitcaseCount, savedSuitcaseCount);
}

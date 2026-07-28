/**
 * Preferenza ordinamento catalogo «I miei Viaggi» (persistente — DOC 35 PV-008).
 */

export type MySpaceTripsSortMode = 'updated_at' | 'created_at' | 'title';

const DEFAULT_SORT: MySpaceTripsSortMode = 'updated_at';

const storageKey = (userId: string) => `td.myspace.trips.sort.${userId}`;

export function getDefaultTripsSortMode(): MySpaceTripsSortMode {
  return DEFAULT_SORT;
}

export function loadTripsSortMode(userId: string): MySpaceTripsSortMode {
  if (!userId || typeof localStorage === 'undefined') return DEFAULT_SORT;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw === 'updated_at' || raw === 'created_at' || raw === 'title') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_SORT;
}

export function saveTripsSortMode(userId: string, mode: MySpaceTripsSortMode): void {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), mode);
  } catch {
    /* ignore */
  }
}

/** Prossimi = non conclusi; Passati = period_end < oggi (UTC date). Senza fine → Prossimi. */
export function isViaggioPast(
  periodEnd: string | null,
  todayIsoDate = new Date().toISOString().slice(0, 10),
): boolean {
  if (!periodEnd) return false;
  return periodEnd < todayIsoDate;
}

/**
 * Filtri puri Ricordi (no I/O) — DOC 37 §6.3.
 */
import type { ViaggioRicordoMedia } from '@/types/models/ViaggioRicordi';

/** Filtro libreria: tutto il viaggio oppure solo media linkati al giorno. */
export function filterRicordiMediaForScope(
  media: ViaggioRicordoMedia[],
  selectedDayKey: string | null,
): ViaggioRicordoMedia[] {
  if (!selectedDayKey) return media;
  return media.filter((m) => m.dayKeys.includes(selectedDayKey));
}

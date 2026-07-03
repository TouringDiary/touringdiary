import type { DiaryNoteTab } from '@/types/models/DiaryNotes';
import type { ItineraryItem } from '@/types/models/Itinerary';

function isoNow(): string {
  return new Date().toISOString();
}

/** Conserva autore su elemento itinerario (§21 — POI aggiunto da). */
export function stampItineraryItemAuthor(
  item: ItineraryItem,
  userId: string | null | undefined
): ItineraryItem {
  if (!userId) return item;
  return {
    ...item,
    addedBy: userId,
    addedAt: isoNow(),
  };
}

/** Conserva autore su tab Nota alla creazione (§21 — Nota creata da). */
export function stampDiaryNoteTabCreated(
  tab: DiaryNoteTab,
  userId: string | null | undefined
): DiaryNoteTab {
  if (!userId) return tab;
  const now = isoNow();
  return {
    ...tab,
    createdBy: userId,
    createdAt: now,
    lastModifiedBy: userId,
    lastModifiedAt: now,
  };
}

/** Conserva ultima modifica su tab Nota (§21). */
export function stampDiaryNoteTabModified(
  tab: DiaryNoteTab,
  userId: string | null | undefined
): DiaryNoteTab {
  if (!userId) return tab;
  return {
    ...tab,
    lastModifiedBy: userId,
    lastModifiedAt: isoNow(),
  };
}

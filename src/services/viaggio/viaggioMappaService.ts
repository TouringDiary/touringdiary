import { listDiariesByViaggio } from './viaggioDiaryService';
import { listRicordiMediaByViaggio } from './viaggioRicordiService';
import { unionViaggioMapPins } from './viaggioMappaUnion';
import type { ViaggioMapPin } from '@/types/models/ViaggioMappa';

/**
 * Vista Mappa — unione geolocalizzata del patrimonio Viaggio (DOC 37 §9).
 * Non crea entità CRUD; aggrega Diari + Ricordi con GPS.
 */
export async function listViaggioMapPins(viaggioId: string): Promise<ViaggioMapPin[]> {
  const [diaries, media] = await Promise.all([
    listDiariesByViaggio(viaggioId),
    listRicordiMediaByViaggio(viaggioId),
  ]);
  return unionViaggioMapPins(diaries, media);
}

export { unionViaggioMapPins } from './viaggioMappaUnion';

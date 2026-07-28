import { listDiariesByViaggio, listDiariesByViaggioIds } from './viaggioDiaryService';

function collectCityIdsFromDiaries(
  diaries: Awaited<ReturnType<typeof listDiariesByViaggio>>,
  ids: Set<string>,
): void {
  for (const diary of diaries) {
    for (const item of diary.items ?? []) {
      const cityId = item.cityId?.trim();
      if (cityId) ids.add(cityId);
    }
  }
}

/**
 * Id città del Viaggio: destination (Aggregate) ∪ cityId degli item dei Diari collegati.
 * Nessuna deduzione da stringhe display.
 * I Diari sono solo sorgente dati; la responsabilità è del dominio Viaggio.
 */
export async function listCityIdsForViaggio(viaggioId: string, destination: string | null): Promise<string[]> {
  const ids = new Set<string>();
  const dest = destination?.trim();
  if (dest) ids.add(dest);

  const diaries = await listDiariesByViaggio(viaggioId);
  collectCityIdsFromDiaries(diaries, ids);
  return [...ids];
}

/** Id città per più Viaggi: 1 query diari invece di N. */
export async function listCityIdsForViaggi(
  viaggi: ReadonlyArray<{ id: string; destination: string | null }>,
): Promise<string[]> {
  const ids = new Set<string>();
  const viaggioIds: string[] = [];
  for (const v of viaggi) {
    viaggioIds.push(v.id);
    const dest = v.destination?.trim();
    if (dest) ids.add(dest);
  }

  const diaries = await listDiariesByViaggioIds(viaggioIds);
  collectCityIdsFromDiaries(diaries, ids);
  return [...ids];
}

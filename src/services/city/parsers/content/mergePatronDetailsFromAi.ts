import type { PatronDetails } from '../../../../types';
import type { CityPatronAiPatron } from '../../../../types/ai/cityGeneration';
import { parseMediaAsset } from '../media/parseMediaAsset';

/**
 * Unisce un payload AI parziale (CityPatronAiPatron) con i PatronDetails esistenti.
 * Preserva solo `imageUrl` già presente (foto specifica città); non inietta fallback Master.
 */
export const mergePatronDetailsFromAi = (
  existing: PatronDetails | undefined,
  aiPatron: CityPatronAiPatron,
): PatronDetails => {
  const imageUrl = existing?.imageUrl?.trim() ?? '';
  const mediaAsset = parseMediaAsset(imageUrl, existing?.image_status);

  return {
    name: aiPatron.name,
    date: aiPatron.date ?? existing?.date ?? '',
    history: aiPatron.history ?? existing?.history ?? '',
    imageUrl: mediaAsset.url,
    image_status: mediaAsset.mediaStatus,
    imageAsset: mediaAsset,
  };
};

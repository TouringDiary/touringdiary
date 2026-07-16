
import type { PatronDetails } from '../../../../types';
import type { CityPatronAiPatron } from '../../../../types/ai/cityGeneration';
import { parseMediaAsset } from '../media/parseMediaAsset';

/**
 * Unisce un payload AI parziale (CityPatronAiPatron) con i PatronDetails esistenti,
 * producendo sempre un PatronDetails completo per il dominio applicativo.
 */
export const mergePatronDetailsFromAi = (
    existing: PatronDetails | undefined,
    aiPatron: CityPatronAiPatron,
    imageUrl: string,
): PatronDetails => {
    const preservedStatus = existing?.imageUrl === imageUrl ? existing.image_status : undefined;
    const mediaAsset = parseMediaAsset(imageUrl, preservedStatus);

    return {
        name: aiPatron.name,
        date: aiPatron.date ?? existing?.date ?? '',
        history: aiPatron.history ?? existing?.history ?? '',
        imageUrl: mediaAsset.url || imageUrl,
        image_status: mediaAsset.mediaStatus,
        imageAsset: mediaAsset,
    };
};

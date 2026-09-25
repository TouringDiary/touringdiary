import type { MediaOriginTypeDb } from '@/constants/governance';
import type { PatronDetails } from '@/types/models/City';

/**
 * Provenance Patrono primary al save città (admin API).
 * `PatronDetails.image_status` (MediaStatus: real | placeholder | missing) + hint MF3 su imageAsset.
 */
export function resolvePatronPrimaryOriginTypeForCitySave(
  patronDetails: PatronDetails | undefined,
): MediaOriginTypeDb {
  if (patronDetails?.imageAsset?.generatedByAi === true) {
    return 'ai';
  }
  if (patronDetails?.image_status === 'real') {
    return 'admin';
  }
  return 'admin';
}

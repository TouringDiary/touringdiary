import { unlinkSuitcaseAsync, linkSuitcaseToTripAsync } from '@/services/suitcaseService';

export const unlinkSuitcase = async (itineraryId: string, suitcaseId: string) => {
  if (suitcaseId.startsWith('guest-')) return;
  await unlinkSuitcaseAsync(itineraryId, suitcaseId);
};

export const linkSuitcaseToTrip = async (itineraryId: string, suitcaseId: string, userId?: string) => {
  if (suitcaseId.startsWith('guest-')) return;
  await linkSuitcaseToTripAsync(itineraryId, suitcaseId, userId);
};

import { unlinkSuitcaseAsync, linkSuitcaseToTripAsync } from '@/services/suitcaseService';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';

export const unlinkSuitcase = async (itineraryId: string, suitcaseId: string) => {
  if (isDraftWorkspaceId(suitcaseId)) return;
  await unlinkSuitcaseAsync(itineraryId, suitcaseId);
};

export const linkSuitcaseToTrip = async (itineraryId: string, suitcaseId: string, userId?: string) => {
  if (isDraftWorkspaceId(suitcaseId)) return;
  await linkSuitcaseToTripAsync(itineraryId, suitcaseId, userId);
};

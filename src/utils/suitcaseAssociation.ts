import { Itinerary } from '@/types';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';

export type AssociationCase = 'A' | 'B' | 'C' | 'D';

const TEMP_ID_PREFIXES = ['imported-', 'ai-it-', 'draft_', 'it-'] as const;

export const isDiaryTempId = (id: string | null | undefined): boolean => {
  if (!id) return true;
  return TEMP_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
};

export const isDiaryPersisted = (
  itinerary: Pick<Itinerary, 'id'>,
  savedProjects: Itinerary[]
): boolean => {
  if (!itinerary.id || isDiaryTempId(itinerary.id)) return false;
  return savedProjects.some((project) => project.id === itinerary.id);
};

export const isSuitcasePersisted = (suitcaseId: string): boolean =>
  !isDraftWorkspaceId(suitcaseId);

export const resolveAssociationCase = (
  diaryPersisted: boolean,
  suitcasePersisted: boolean
): AssociationCase => {
  if (diaryPersisted && suitcasePersisted) return 'A';
  if (!diaryPersisted && suitcasePersisted) return 'B';
  if (diaryPersisted && !suitcasePersisted) return 'C';
  return 'D';
};

export type LinkModalVariant = 'diary-only' | 'suitcase-only' | 'both';

export const associationCaseToModalVariant = (
  associationCase: AssociationCase
): LinkModalVariant | null => {
  switch (associationCase) {
    case 'B':
      return 'diary-only';
    case 'C':
      return 'suitcase-only';
    case 'D':
      return 'both';
    default:
      return null;
  }
};

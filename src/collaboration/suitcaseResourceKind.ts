import type { SharedResourceKind } from '@/domain/collaboration';
import type { Suitcase } from '@/types/suitcase';
import { isTdTemplate, isUserTemplate } from '@/utils/suitcaseDomain';

/** Risolve il kind collaborativo per una riga `suitcases`, o null se non condivisibile (es. TD). */
export function resolveSuitcaseSharedResourceKind(
  suitcase: Pick<Suitcase, 'user_id' | 'is_user_template'>,
): SharedResourceKind | null {
  if (isTdTemplate(suitcase)) return null;
  return isUserTemplate(suitcase) ? 'user_template' : 'suitcase';
}

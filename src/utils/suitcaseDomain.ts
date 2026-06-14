import { Suitcase, DraftWorkspaceKind } from '@/types/suitcase';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';

export type { DraftWorkspaceKind };

/** Template editoriale Touring Diary (catalogo globale). */
export const isTdTemplate = (suitcase: Pick<Suitcase, 'user_id' | 'is_user_template'>): boolean =>
  suitcase.user_id === null;

/** Template personale dell'utente. */
export const isUserTemplate = (
  suitcase: Pick<Suitcase, 'user_id' | 'is_user_template'>
): boolean =>
  suitcase.user_id !== null && suitcase.is_user_template === true;

/** Valigia operativa associabile al diario. */
export const isValigia = (suitcase: Pick<Suitcase, 'user_id' | 'is_user_template' | 'id'>): boolean =>
  suitcase.user_id !== null &&
  suitcase.is_user_template !== true &&
  !isDraftWorkspaceId(suitcase.id);

/** Qualsiasi template (TD o USER), inclusi draft template in workspace. */
export const isTemplateEntity = (suitcase: Suitcase): boolean => {
  if (suitcase.workspace_kind === 'user_template') return true;
  if (isTdTemplate(suitcase)) return true;
  return isUserTemplate(suitcase);
};

/** Valigia o draft valigia — associabile al diario dopo il save. */
export const isAssociableSuitcase = (suitcase: Suitcase): boolean => {
  if (isDraftWorkspaceId(suitcase.id)) {
    return suitcase.workspace_kind !== 'user_template';
  }
  return isValigia(suitcase);
};

export const resolveRuntimeIsTemplate = (
  suitcase: Pick<Suitcase, 'user_id' | 'is_user_template'>
): boolean => isTdTemplate(suitcase) || isUserTemplate(suitcase);

export const getDraftWorkspaceKind = (suitcase: Suitcase): DraftWorkspaceKind =>
  suitcase.workspace_kind ?? 'suitcase';

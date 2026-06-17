import { useMemo } from 'react';
import { Suitcase } from '@/types/suitcase';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';
import { isUserTemplate, isValigia } from '@/utils/suitcaseDomain';

export const useSuitcaseSelectors = (
  userSuitcases: Suitcase[],
  globalTemplates: Suitcase[],
  linkedSuitcaseIds: string[] | null,
  activeTabId: string | null,
  userId: string | null | undefined
) => {

  /**
   * Valigie associate al diario
   *
   * Se linkedSuitcaseIds === null significa:
   * dati non ancora caricati → NON filtriamo ancora
   */

  const tripSuitcases = useMemo(() => {
    if (linkedSuitcaseIds === null) return [];
    return userSuitcases.filter(
      s => linkedSuitcaseIds.includes(s.id) && isValigia(s)
    );
  }, [userSuitcases, linkedSuitcaseIds]);

  /**
   * Valigie salvate (non associate al diario)
   *
   * IMPORTANTE:
   * se linkedSuitcaseIds === null NON sappiamo ancora
   * quali siano collegate al diario → ritorniamo []
   * invece di userSuitcases
   *
   * così evitiamo selezioni premature del tab
   */

  const savedSuitcases = useMemo(() => {
    if (linkedSuitcaseIds === null || !userId) return [];
    return userSuitcases.filter(
      s =>
        !linkedSuitcaseIds.includes(s.id) &&
        s.user_id !== null &&
        s.user_id !== 'guest' &&
        !isDraftWorkspaceId(s.id) &&
        !isUserTemplate(s)
    );
  }, [userSuitcases, linkedSuitcaseIds, userId]);

  const userOwnedTemplates = useMemo(() => {
    if (!userId) return [];
    return userSuitcases
      .filter(
        (s) => s.user_id === userId && isUserTemplate(s) && !isDraftWorkspaceId(s.id)
      )
      .sort(
        (a, b) =>
          new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
      );
  }, [userSuitcases, userId]);


  /**
   * Valigia attualmente aperta
   */

  const activeSuitcase = useMemo(() => {
    if (!activeTabId) return undefined;
    return (
      userSuitcases.find((s) => s.id === activeTabId) ??
      globalTemplates.find((s) => s.id === activeTabId)
    );
  }, [userSuitcases, globalTemplates, activeTabId]);

  return {
    tripSuitcases,
    savedSuitcases,
    userOwnedTemplates,
    activeSuitcase
  };

};
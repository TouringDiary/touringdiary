import { useMemo } from 'react';
import { Suitcase } from '@/types/suitcase';

export const useSuitcaseSelectors = (
  userSuitcases: Suitcase[],
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
      s => linkedSuitcaseIds.includes(s.id)
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
      s => !linkedSuitcaseIds.includes(s.id) && s.user_id !== null
    );
  }, [userSuitcases, linkedSuitcaseIds, userId]);


  /**
   * Valigia attualmente aperta
   */

  const activeSuitcase = useMemo(() =>
    userSuitcases.find(
      s => s.id === activeTabId
    ),
    [userSuitcases, activeTabId]
  );

  return {
    tripSuitcases,
    savedSuitcases,
    activeSuitcase
  };

};
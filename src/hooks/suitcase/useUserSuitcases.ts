import { useState, useCallback, useEffect } from 'react';
import { fetchUserSuitcasesAsync } from '@/services/suitcaseService';
import { Suitcase } from '@/types/suitcase';
import { isDraftWorkspaceId, preserveDraftLocalStorageFields } from '@/utils/guestSuitcaseHelper';

const LOCAL_DRAFT_STORAGE_KEY = 'GUEST_LOCAL_SUITCASE';

/**
 * Main hook to fetch all suitcases owned by the current user.
 */
export const useUserSuitcases = (userId: string | undefined) => {
  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuitcases = useCallback(async () => {
    setIsLoading(true);
    try {
      let finalSuitcases: Suitcase[] = [];

      // Solo se l'utente ha un UUID effettivo scarichiamo da Supabase
      if (userId && userId !== 'guest') {
        const data = await fetchUserSuitcasesAsync(userId);
        finalSuitcases = [...data];
      }
      
      // Inseriamo la valigia guest locale se esiste (Merge per loggati, Fetch base per anonimi)
      const localData = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
      if (localData) {
        try {
          const draftSc = JSON.parse(localData) as Suitcase;
          if (
            isDraftWorkspaceId(draftSc.id) &&
            !finalSuitcases.some((s) => s.id === draftSc.id)
          ) {
            finalSuitcases = [draftSc, ...finalSuitcases];
          }
        } catch (e) {
          console.error('Error parsing draft workspace during merge', e);
        }
      }

      setSuitcases(finalSuitcases);
    } catch (e) {
      console.error('Error fetching user suitcases:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Reagisce a mutazioni localStorage della workspace draft (anche per utenti autenticati).
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_DRAFT_STORAGE_KEY) fetchSuitcases();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchSuitcases]);

  useEffect(() => {
    setIsLoading(true);
    fetchSuitcases();
  }, [userId, fetchSuitcases]);

  const setSuitcasesIntercepted = useCallback((value: React.SetStateAction<Suitcase[]>) => {
    setSuitcases((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      
      // Sincronizzazione localStorage per workspace draft (guest e auth).
      const draftSc = next.find((s) => isDraftWorkspaceId(s.id));

      if (draftSc) {
        const preserved = preserveDraftLocalStorageFields(draftSc);
        localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(preserved));
        return next.map((s) => (s.id === preserved.id ? preserved : s));
      }

      const hadDraftBefore = prev.some((s) => isDraftWorkspaceId(s.id));
      if (hadDraftBefore) {
        localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
      }

      return next;
    });
  }, []);

  return { suitcases, setSuitcases: setSuitcasesIntercepted, isLoading, fetchSuitcases };
};

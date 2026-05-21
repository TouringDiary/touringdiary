import { useState, useCallback, useEffect } from 'react';
import { fetchUserSuitcasesAsync } from '@/services/suitcaseService';
import { Suitcase } from '@/types/suitcase';

/**
 * Main hook to fetch all suitcases owned by the current user.
 */
export const useUserSuitcases = (userId: string | undefined) => {
  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const localData = localStorage.getItem('GUEST_LOCAL_SUITCASE');
      if (localData) {
        try {
          const guestSc = JSON.parse(localData);
          // Evitiamo duplicati se per caso la guest ha lo stesso ID di una in DB (improbabile)
          if (!finalSuitcases.some(s => s.id === guestSc.id)) {
            finalSuitcases = [guestSc, ...finalSuitcases];
          }
        } catch (e) {
          console.error("Error parsing guest suitcase during merge", e);
        }
      }

      setSuitcases(finalSuitcases);
    } catch (e) {
      console.error('Error fetching user suitcases:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Hook aggiuntivo per reagire a eventi localStorage (es. se mutata in altra tab)
  useEffect(() => {
    if (!userId || userId === 'guest') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'GUEST_LOCAL_SUITCASE') fetchSuitcases();
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [userId, fetchSuitcases]);

  useEffect(() => {
    fetchSuitcases();
  }, [userId, fetchSuitcases]);

  const setSuitcasesIntercepted = useCallback((value: React.SetStateAction<Suitcase[]>) => {
    setSuitcases((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      
      // Sincronizzazione localStorage: se c'è una valigia guest nell'array, la salviamo.
      // Questo deve funzionare ANCHE dopo il login finché la valigia non viene persistita (cambio ID).
      const guestSc = next.find(s => s.id.startsWith('guest-'));
      
      if (guestSc) {
        localStorage.setItem('GUEST_LOCAL_SUITCASE', JSON.stringify(guestSc));
      } else {
        // Se non c'è più nell'array ma c'era prima, o se siamo in modalità anonima e l'abbiamo svuotata
        const hadGuestBefore = prev.some(s => s.id.startsWith('guest-'));
        if (hadGuestBefore) {
          localStorage.removeItem('GUEST_LOCAL_SUITCASE');
        }
      }
      
      return next;
    });
  }, []);

  return { suitcases, setSuitcases: setSuitcasesIntercepted, isLoading, fetchSuitcases };
};

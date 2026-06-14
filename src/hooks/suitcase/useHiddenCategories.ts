import { useState, useEffect, useCallback, useRef } from 'react';
import { updateHiddenCategoriesAsync } from '@/services/suitcaseService';
import { isDraftWorkspaceId } from '@/utils/guestSuitcaseHelper';

/**
 * Hook per gestire le categorie nascoste di una valigia o template.
 * Include logica di persistenza debounced su colonna ui_state.
 */
export const useHiddenCategories = (
  suitcaseId: string | undefined,
  initialHiddenIds: string[] = [],
  onSync?: (hiddenIds: string[]) => void
) => {
  const [hiddenIds, setHiddenIds] = useState<string[]>(initialHiddenIds);
  const isInitialMount = useRef(true);

  // Sincronizza lo stato locale quando cambia la valigia o i dati iniziali
  useEffect(() => {
    if (!initialHiddenIds) return;

    setHiddenIds(prev => {
      if (JSON.stringify(prev) === JSON.stringify(initialHiddenIds)) {
        return prev;
      }
      return initialHiddenIds;
    });
  }, [suitcaseId, initialHiddenIds]);

  // Toggle visibilità categoria
  const toggleCategory = useCallback((categoryId: string) => {
    const newIds = hiddenIds.includes(categoryId)
      ? hiddenIds.filter(id => id !== categoryId)
      : [...hiddenIds, categoryId];

    setHiddenIds(newIds);
    if (onSync) onSync(newIds);
  }, [hiddenIds, onSync]);

  // Ripristina tutte le categorie
  const showAll = useCallback(() => {
    setHiddenIds([]);
    if (onSync) onSync([]);
  }, [onSync]);

  // Verifica se una categoria è nascosta
  const isHidden = useCallback((categoryId: string) => {
    return hiddenIds.includes(categoryId);
  }, [hiddenIds]);

  // Persistenza su Database (Debounced 800ms)
  useEffect(() => {
    // Salta il primo render per evitare update inutili all'avvio
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!suitcaseId) return;
    if (isDraftWorkspaceId(suitcaseId)) {
      // Workspace draft: persistenza solo in localStorage
      const timer = setTimeout(() => {
        const localData = localStorage.getItem('GUEST_LOCAL_SUITCASE');
        if (localData) {
          try {
            const guestSc = JSON.parse(localData);
            if (guestSc.id === suitcaseId) {
              const updated = { 
                ...guestSc, 
                ui_state: { ...guestSc.ui_state, hidden_category_ids: hiddenIds } 
              };
              localStorage.setItem('GUEST_LOCAL_SUITCASE', JSON.stringify(updated));
            }
          } catch (e) {
            console.error("[useHiddenCategories] Error updating guest ui_state", e);
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      try {
        await updateHiddenCategoriesAsync(suitcaseId, hiddenIds);
        console.log(`[useHiddenCategories] Stato salvato per ${suitcaseId}`);
      } catch (error) {
        console.error("[useHiddenCategories] Errore salvataggio ui_state:", error);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [hiddenIds, suitcaseId]);

  return { hiddenIds, toggleCategory, showAll, isHidden };
};

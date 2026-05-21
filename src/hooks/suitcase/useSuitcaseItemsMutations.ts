import {
  updateSuitcaseItemAsync,
  addSuitcaseItemAsync,
  deleteSuitcaseItemAsync,
  updateSuitcaseAsync,
  checkProfileExistsAsync,
  createEmergencyProfileAsync,
  createSuitcaseAsync,
  addSuitcaseItemsBulkAsync,
  getAuthUserAsync
} from '@/services/suitcaseService';
import {
  getGuestSuitcase,
  saveGuestSuitcase,
  deleteGuestSuitcase
} from '@/utils/guestSuitcaseHelper';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { deleteSuitcase } from './useSuitcaseCrud';
import { unlinkSuitcase, linkSuitcaseToTrip } from './useSuitcaseLinking';

export const useSuitcaseItemsMutations = () => {
  const updateItem = async (itemId: string, updates: Partial<SuitcaseItem>) => {
    if (itemId.startsWith('guest-item-')) return;
    await updateSuitcaseItemAsync(itemId, updates);
  };

  const addItem = async (suitcaseId: string, name: string, category: string, metadata: Partial<SuitcaseItem> = {}) => {
    if (suitcaseId.startsWith('guest-suitcase-')) {
      return {
        id: metadata.id || `guest-item-${Date.now()}`,
        suitcase_id: suitcaseId,
        name, category,
        is_checked: metadata.is_checked ?? false,
        is_ai_suggestion: metadata.is_ai_suggestion ?? false,
        quantity: metadata.quantity ?? 1,
        ai_suggestion_context: metadata.ai_suggestion_context || null,
        suggested_at: metadata.suggested_at || null
      };
    }
    return await addSuitcaseItemAsync(suitcaseId, name, category, metadata);
  };

  const deleteItem = async (itemId: string) => {
    if (itemId.startsWith('guest-item-')) return;
    await deleteSuitcaseItemAsync(itemId);
  };

  const updateSuitcase = async (suitcaseId: string, updates: Partial<Suitcase>) => {
    if (suitcaseId.startsWith('guest-suitcase-')) {
      const guestSc = getGuestSuitcase();
      if (guestSc && guestSc.id === suitcaseId) {
        saveGuestSuitcase({ ...guestSc, ...updates });
      }
      return;
    }
    await updateSuitcaseAsync(suitcaseId, updates);
  };

  const persistGuestSuitcase = async (userId: string, itineraryId: string | null = null): Promise<Suitcase | null> => {
    const guestSc = getGuestSuitcase();
    if (!guestSc) return null;

    try {
      // 0. Verifica attiva del profilo per evitare FK violation silenziose (admin bypass bug)
      const profileCheck = await checkProfileExistsAsync(userId);

      if (!profileCheck) {
        console.warn(`[persistGuestSuitcase] Profilo (public.profiles) mancante per user_id: ${userId}. Avvio auto-provisioning di emergenza...`);
        const user = await getAuthUserAsync();

        if (user) {
          const email = user.email || '';
          const name = user.user_metadata?.full_name || email.split('@')[0] || 'Nuovo Utente';

          await createEmergencyProfileAsync(userId, email, name);
          console.log("[persistGuestSuitcase] ✅ Profilo auto-creato con successo.");
        } else {
          throw new Error("Impossibile sincronizzare la valigia: Sessione auth invalida per recupero profilo.");
        }
      }

      // 1. Creiamo la valigia su Supabase
      const suitcase = await createSuitcaseAsync(userId, guestSc.title, guestSc.icon);

      if (!suitcase) {
        throw new Error("[persistGuestSuitcase] Valigia non inserita.");
      }

      // 2. Se ci sono item, li inseriamo
      if (guestSc.suitcase_items && guestSc.suitcase_items.length > 0) {
        const itemsToInsert = guestSc.suitcase_items.map((item) => ({
          suitcase_id: suitcase.id,
          name: item.name,
          category: item.category,
          is_checked: item.is_checked,
          quantity: item.quantity || 1,
          is_ai_suggestion: item.is_ai_suggestion || false,
          ai_suggestion_context: item.ai_suggestion_context || null
        }));

        await addSuitcaseItemsBulkAsync(itemsToInsert);
      }

      // 3. Colleghiamo all'itinerario se necessario
      if (itineraryId) {
        await linkSuitcaseToTrip(itineraryId, suitcase.id, userId);
      }

      // 4. CLEANUP: Rimuoviamo dal localStorage dopo successo
      deleteGuestSuitcase();

      return suitcase;
    } catch (e) {
      console.error("Error persisting guest suitcase", e);
      throw e;
    }
  };

  return {
    updateItem,
    addItem,
    deleteItem,
    updateSuitcase,
    persistGuestSuitcase,
    deleteSuitcase,
    unlinkSuitcase,
    linkSuitcaseToTrip
  };
};

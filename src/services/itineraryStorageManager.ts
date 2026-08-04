import type { Itinerary, User } from '../types/index';
import type { SaveUserDraftViaggioOptions } from '../types/resourceAssociation';
import {
  deleteUserDraft,
  getAccessibleDiariesForUser,
  saveUserDraft,
} from './community/itineraryService';
import { getStorageItem, setStorageItem } from './storageService';

/**
 * Storage Manager Centralizzato
 * Gestisce salvataggio/caricamento/cancellazione dei Diari personali.
 * Cloud path: `saveUserDraft` crea/collega il Viaggio (Aggregate Root).
 * Guest LS: lista Diari; materializzazione Viaggio al primo save cloud (ST-4).
 */

const LOCAL_STORAGE_KEY = 'saved_itineraries';

/**
 * Workaround temporaneo — Ghost IDs.
 *
 * Elenco locale di id Diario che risultano ancora leggibili dal cloud ma che l’utente
 * ha già “cancellato” in UI. Serve solo per account / sessioni in cui la RLS impedisce
 * la DELETE sul DB, mantenendo comunque una UX di rimozione coerente (nascondendo il
 * Diario al reload).
 *
 * Da rimuovere quando autenticazione + RLS delete saranno definitivamente consolidati:
 * a quel punto la cancellazione cloud sarà affidabile e questo filtro non servirà più.
 */
const GHOST_STORAGE_KEY = 'ghost_deleted_ids';

export const ItineraryStorageManager = {
  /**
   * Carica tutti i progetti dell'utente corrente.
   */
  async loadProjects(user: User | null): Promise<Itinerary[]> {
    if (!user || user.role === 'guest' || !user.id) {
      // OSPITE: Usa LocalStorage
      const allLocal = getStorageItem<Itinerary[]>(LOCAL_STORAGE_KEY, []);
      // Filtra solo quelli senza userId o specifici guest per sicurezza
      return allLocal.filter((p) => !p.userId || p.userId === 'guest');
    }

    // UTENTE LOGGATO: Usa Database Supabase
    try {
      const drafts = await getAccessibleDiariesForUser(user.id);
      const ghosts = getStorageItem<string[]>(GHOST_STORAGE_KEY, []);
      const cloudDrafts = drafts.filter((d) => d.id != null && !ghosts.includes(d.id));

      return cloudDrafts;
    } catch (e) {
      console.error('Errore caricamento progetti cloud:', e);
      // Se c'è un errore di rete, potremmo ritornare un array vuoto o lanciare l'errore
      return [];
    }
  },

  /**
   * Salva un progetto.
   */
  async saveProject(
    itinerary: Itinerary,
    user: User | null,
    viaggioOptions?: SaveUserDraftViaggioOptions,
  ): Promise<boolean> {
    const isGuest = !user || user.role === 'guest' || !user.id;

    if (isGuest) {
      // OSPITE: Salva in LocalStorage
      const allLocal = getStorageItem<Itinerary[]>(LOCAL_STORAGE_KEY, []);
      const existingIndex = allLocal.findIndex((p) => p.id === itinerary.id);

      const toSave = { ...itinerary, userId: 'guest', updatedAt: Date.now() };

      if (existingIndex >= 0) {
        allLocal[existingIndex] = toSave;
      } else {
        allLocal.push(toSave);
      }

      setStorageItem(LOCAL_STORAGE_KEY, allLocal);
      return true;
    } else {
      // UTENTE LOGGATO: Salva su Supabase
      try {
        const success = await saveUserDraft(itinerary, user, viaggioOptions);
        return success;
      } catch (e) {
        console.error('Errore salvataggio progetto cloud:', e);
        // Rimuoviamo il fallback su LocalStorage per gli utenti loggati
        // in modo che l'errore sia evidente e non ci sia un falso senso di successo.
        throw e;
      }
    }
  },

  /**
   * Elimina un progetto.
   */
  async deleteProject(targetId: string, user: User | null): Promise<boolean> {
    const isGuest = !user || user.role === 'guest' || !user.id;
    const cleanId = targetId.trim();

    if (isGuest) {
      // OSPITE: Cancella da LocalStorage
      const allLocal = getStorageItem<Itinerary[]>(LOCAL_STORAGE_KEY, []);
      const updatedAll = allLocal.filter((p) => p.id !== cleanId);
      setStorageItem(LOCAL_STORAGE_KEY, updatedAll);
      return true;
    } else {
      // UTENTE LOGGATO: Cancella da Supabase
      try {
        const success = await deleteUserDraft(cleanId, user.id);

        if (!success) {
          // Se la cancellazione fallisce (es. count=0), verifichiamo se l'elemento esiste ancora.
          const fresh = await getAccessibleDiariesForUser(user.id);
          if (!fresh.find((p) => p.id === cleanId)) {
            // Successo effettivo (non esiste più)
            return true;
          } else {
            // Workaround Ghost IDs (temporaneo): RLS ha bloccato la DELETE ma la riga
            // resta leggibile. Registriamo l’id in GHOST_STORAGE_KEY per nasconderlo
            // al prossimo loadProjects e non lasciare l’utente bloccato. Rimuovere
            // insieme a GHOST_STORAGE_KEY quando RLS/auth delete sarà consolidata.
            console.warn('[StorageManager] RLS blocked deletion, hiding locally as ghost.');
            const ghosts = getStorageItem<string[]>(GHOST_STORAGE_KEY, []);
            if (!ghosts.includes(cleanId)) {
              setStorageItem(GHOST_STORAGE_KEY, [...ghosts, cleanId]);
            }
            return true; // Ritorniamo true per aggiornare la UI ottimisticamente
          }
        }

        return true;
      } catch (e) {
        console.error('Errore cancellazione progetto cloud', e);
        return false;
      }
    }
  },
};

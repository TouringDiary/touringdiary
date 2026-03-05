import { Itinerary, User } from '../types/index';
import { getStorageItem, setStorageItem } from './storageService';
import { saveUserDraft, getUserDrafts, deleteUserDraft } from './communityService';

/**
 * Storage Manager Centralizzato
 * Gestisce il salvataggio, caricamento e cancellazione degli itinerari
 * decidendo automaticamente se usare il LocalStorage (ospiti) o Supabase (utenti loggati).
 */

const LOCAL_STORAGE_KEY = 'saved_itineraries';
const GHOST_STORAGE_KEY = 'ghost_deleted_ids';

export const ItineraryStorageManager = {
    /**
     * Carica tutti i progetti dell'utente corrente.
     */
    async loadProjects(user: User | null): Promise<Itinerary[]> {
        const isGuest = !user || user.role === 'guest' || !user.id;

        if (isGuest) {
            // OSPITE: Usa LocalStorage
            const allLocal = getStorageItem<Itinerary[]>(LOCAL_STORAGE_KEY, []);
            // Filtra solo quelli senza userId o specifici guest per sicurezza
            return allLocal.filter(p => !p.userId || p.userId === 'guest');
        } else {
            // UTENTE LOGGATO: Usa Database Supabase
            try {
                const drafts = await getUserDrafts(user.id);
                const ghosts = getStorageItem<string[]>(GHOST_STORAGE_KEY, []);
                const cloudDrafts = drafts.filter(d => !ghosts.includes(d.id));
                
                return cloudDrafts;
            } catch (e) {
                console.error("Errore caricamento progetti cloud:", e);
                // Se c'è un errore di rete, potremmo ritornare un array vuoto o lanciare l'errore
                return [];
            }
        }
    },

    /**
     * Salva un progetto.
     */
    async saveProject(itinerary: Itinerary, user: User | null): Promise<boolean> {
        const isGuest = !user || user.role === 'guest' || !user.id;

        if (isGuest) {
            // OSPITE: Salva in LocalStorage
            const allLocal = getStorageItem<Itinerary[]>(LOCAL_STORAGE_KEY, []);
            const existingIndex = allLocal.findIndex(p => p.id === itinerary.id);
            
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
                const success = await saveUserDraft(itinerary, user);
                return success;
            } catch (e) {
                console.error("Errore salvataggio progetto cloud:", e);
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
            const updatedAll = allLocal.filter(p => p.id !== cleanId);
            setStorageItem(LOCAL_STORAGE_KEY, updatedAll);
            return true;
        } else {
            // UTENTE LOGGATO: Cancella da Supabase
            try {
                const success = await deleteUserDraft(cleanId, user.id);
                
                if (!success) {
                    // Se la cancellazione fallisce (es. count=0), verifichiamo se l'elemento esiste ancora.
                    const fresh = await getUserDrafts(user.id);
                    if (!fresh.find(p => p.id === cleanId)) {
                        // Successo effettivo (non esiste più)
                        return true;
                    } else {
                        // L'elemento esiste ancora nel DB (RLS ha bloccato, es. account di test senza sessione).
                        // Per non bloccare l'utente, lo nascondiamo localmente salvandolo nei ghost.
                        console.warn("[StorageManager] RLS blocked deletion, hiding locally as ghost.");
                        const ghosts = getStorageItem<string[]>(GHOST_STORAGE_KEY, []);
                        if (!ghosts.includes(cleanId)) {
                            setStorageItem(GHOST_STORAGE_KEY, [...ghosts, cleanId]);
                        }
                        return true; // Ritorniamo true per aggiornare la UI ottimisticamente
                    }
                }
                
                return true;
            } catch (e) {
                console.error("Errore cancellazione progetto cloud", e);
                return false;
            }
        }
    }
};

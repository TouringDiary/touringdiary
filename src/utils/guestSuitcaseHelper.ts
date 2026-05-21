import { Suitcase, SuitcaseItem } from '../types/suitcase';

const GUEST_STORAGE_KEY = 'GUEST_LOCAL_SUITCASE';

/**
 * Dispatcha l'evento storage per allineare reattivamente i listener React di altre schede/componenti.
 */
export const dispatchGuestStorageEvent = (): void => {
  window.dispatchEvent(new StorageEvent('storage', { key: GUEST_STORAGE_KEY }));
};

/**
 * Recupera la valigia guest dal localStorage effettuando un parsing sicuro.
 */
export const getGuestSuitcase = (): Suitcase | null => {
  const localData = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!localData) return null;
  try {
    return JSON.parse(localData) as Suitcase;
  } catch (e) {
    console.error("[guestSuitcaseHelper] Errore parsing localStorage per guest suitcase:", e);
    return null;
  }
};

/**
 * Salva la valigia guest nel localStorage e notifica i componenti.
 */
export const saveGuestSuitcase = (suitcase: Suitcase): void => {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(suitcase));
  dispatchGuestStorageEvent();
};

/**
 * Rimuove la valigia guest dal localStorage e notifica i componenti.
 */
export const deleteGuestSuitcase = (): void => {
  localStorage.removeItem(GUEST_STORAGE_KEY);
  dispatchGuestStorageEvent();
};

/**
 * Genera una nuova struttura dati per una valigia guest.
 */
export const createGuestSuitcaseObject = (title: string, icon: string, items: SuitcaseItem[] = []): Suitcase => {
  return {
    id: `guest-suitcase-${Date.now()}`,
    title,
    icon,
    user_id: 'guest',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suitcase_items: items,
    custom_categories: [],
    ui_state: { hidden_category_ids: [] },
    source_template_id: null
  };
};

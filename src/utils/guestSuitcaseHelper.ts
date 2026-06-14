import {
  Suitcase,
  SuitcaseItem,
  DraftLocalRejection,
  SuitcaseRejection,
  DraftWorkspaceKind,
} from '../types/suitcase';
import { normalizeItemName } from './tagDerivation';

const GUEST_STORAGE_KEY = 'GUEST_LOCAL_SUITCASE';

/** Prefisso ID per workspace temporanee (auth e guest, creazione nuova). */
export const DRAFT_SUITCASE_ID_PREFIX = 'draft-suitcase-';

/** Prefisso legacy — workspace guest create prima della generalizzazione draft. */
export const LEGACY_GUEST_SUITCASE_ID_PREFIX = 'guest-suitcase-';

/** Prefisso ID item in workspace draft (nuove creazioni). */
export const DRAFT_ITEM_ID_PREFIX = 'draft-item-';

/** Prefisso legacy item guest. */
export const LEGACY_GUEST_ITEM_ID_PREFIX = 'guest-item-';

/** Prefisso ID rejection AI in workspace draft (pre-save). */
export const DRAFT_REJECTION_ID_PREFIX = 'draft-rejection-';

/**
 * Item in ingresso a createDraftWorkspaceObject: campi runtime senza ID persistiti obbligatori.
 * Gli ID draft-item-* vengono assegnati dal factory.
 */
export type DraftWorkspaceSeedItem = Omit<SuitcaseItem, 'id' | 'suitcase_id'> & {
  id?: string;
  suitcase_id?: string;
};

/** Rimuove ID persistiti dagli item sorgente prima di popolare una draft workspace. */
export const toDraftWorkspaceSeedItems = (
  items: SuitcaseItem[],
  overrides: Partial<Pick<SuitcaseItem, 'is_checked' | 'is_ai_suggestion'>> = {}
): DraftWorkspaceSeedItem[] =>
  items.map((item) => {
    const { id: _id, suitcase_id: _suitcaseId, ...fields } = item;
    return { ...fields, ...overrides };
  });

/**
 * True se l'ID identifica una workspace temporanea (non persistita in DB).
 * Accetta il prefisso corrente e il legacy guest-suitcase-*.
 */
export const isDraftWorkspaceId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return (
    id.startsWith(DRAFT_SUITCASE_ID_PREFIX) ||
    id.startsWith(LEGACY_GUEST_SUITCASE_ID_PREFIX)
  );
};

/**
 * True se l'ID identifica un item runtime in workspace temporanea.
 * Accetta draft-item-* e il legacy guest-item-*.
 */
export const isDraftItemId = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return (
    id.startsWith(DRAFT_ITEM_ID_PREFIX) ||
    id.startsWith(LEGACY_GUEST_ITEM_ID_PREFIX)
  );
};

/**
 * Indica se esiste una workspace temporanea serializzata in localStorage.
 */
export const hasDraftWorkspaceInStorage = (): boolean => {
  const draft = getGuestSuitcase();
  return draft !== null && isDraftWorkspaceId(draft.id);
};

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
 * Abbandona la workspace draft in localStorage senza toccare il DB.
 * Usato da «Esci senza salvare» (Discard), non da «Elimina valigia» (Delete).
 */
export const abandonDraftWorkspace = (): void => {
  deleteGuestSuitcase();
};

export const getDraftLocalRejections = (draft?: Suitcase | null): DraftLocalRejection[] => {
  const source = draft ?? getGuestSuitcase();
  return source?.local_rejections ?? [];
};

/**
 * Preserva campi draft-only (es. local_rejections) già presenti in LS
 * quando si riserializza la workspace da React state.
 */
export const preserveDraftLocalStorageFields = (draft: Suitcase): Suitcase => {
  if (!isDraftWorkspaceId(draft.id)) return draft;

  const fromStorage = getGuestSuitcase();
  if (!fromStorage || fromStorage.id !== draft.id) return draft;

  const rejections = draft.local_rejections?.length
    ? draft.local_rejections
    : (fromStorage.local_rejections ?? []);

  if (rejections === draft.local_rejections) return draft;
  return { ...draft, local_rejections: rejections };
};

export const mapDraftLocalRejectionsToRuntime = (
  rejections: DraftLocalRejection[],
  suitcaseId: string
): SuitcaseRejection[] =>
  rejections.map((r) => ({
    id: r.id,
    suitcase_id: suitcaseId,
    name: r.name,
    category: r.category,
    created_at: r.created_at,
    ai_suggestion_context: r.ai_suggestion_context ?? null,
  }));

export const appendDraftLocalRejection = (
  suitcaseId: string,
  item: { name: string; category: string; ai_suggestion_context?: string | null }
): void => {
  const draft = getGuestSuitcase();
  if (!draft || draft.id !== suitcaseId || !isDraftWorkspaceId(suitcaseId)) return;

  const processedName = normalizeItemName(item.name, { preserveCase: true });
  const normalizedKey = normalizeItemName(processedName);
  const existing = draft.local_rejections ?? [];

  if (existing.some((r) => normalizeItemName(r.name) === normalizedKey)) {
    return;
  }

  const rejection: DraftLocalRejection = {
    id: `${DRAFT_REJECTION_ID_PREFIX}${Date.now()}`,
    name: processedName,
    category: item.category,
    ai_suggestion_context: item.ai_suggestion_context ?? null,
    created_at: new Date().toISOString(),
  };

  saveGuestSuitcase({ ...draft, local_rejections: [...existing, rejection] });
};

export const removeDraftLocalRejectionById = (rejectionId: string): void => {
  const draft = getGuestSuitcase();
  if (!draft?.local_rejections?.length) return;

  saveGuestSuitcase({
    ...draft,
    local_rejections: draft.local_rejections.filter((r) => r.id !== rejectionId),
  });
};

export const removeDraftLocalRejectionByName = (suitcaseId: string, name: string): void => {
  const draft = getGuestSuitcase();
  if (!draft || draft.id !== suitcaseId) return;

  const normalized = normalizeItemName(name);
  const next = (draft.local_rejections ?? []).filter(
    (r) => normalizeItemName(r.name) !== normalized
  );

  saveGuestSuitcase({ ...draft, local_rejections: next });
};

/**
 * Inserisce candidati AI nella workspace draft (Direct Mode) senza toccare il DB.
 */
export const insertDraftAiSuggestions = (
  suitcaseId: string,
  candidates: { name: string; category: string }[],
  suggestionContext?: string
): SuitcaseItem[] => {
  const draft = getGuestSuitcase();
  if (!draft || draft.id !== suitcaseId || !isDraftWorkspaceId(suitcaseId)) return [];

  const itemIdPrefix = suitcaseId.startsWith(DRAFT_SUITCASE_ID_PREFIX)
    ? DRAFT_ITEM_ID_PREFIX
    : LEGACY_GUEST_ITEM_ID_PREFIX;
  const now = new Date().toISOString();
  const baseTs = Date.now();

  const newItems: SuitcaseItem[] = candidates.map((candidate, index) => ({
    id: `${itemIdPrefix}${baseTs}-${index}`,
    suitcase_id: suitcaseId,
    name: candidate.name,
    category: candidate.category,
    is_checked: false,
    is_ai_suggestion: true,
    quantity: 1,
    ai_suggestion_context: suggestionContext ?? null,
    suggested_at: now,
  }));

  saveGuestSuitcase({
    ...draft,
    suitcase_items: [...(draft.suitcase_items ?? []), ...newItems],
  });

  return newItems;
};

export const removeDraftItemFromWorkspace = (suitcaseId: string, itemId: string): void => {
  const draft = getGuestSuitcase();
  if (!draft || draft.id !== suitcaseId) return;

  saveGuestSuitcase({
    ...draft,
    suitcase_items: (draft.suitcase_items ?? []).filter((item) => item.id !== itemId),
  });
};

/**
 * Genera una nuova workspace temporanea (draft) con ID draft-suitcase-*.
 * @param userId UUID utente autenticato oppure 'guest' per sessione anonima.
 */
export const createDraftWorkspaceObject = (
  userId: string,
  title: string,
  icon: string,
  items: DraftWorkspaceSeedItem[] = [],
  workspaceKind: DraftWorkspaceKind = 'suitcase'
): Suitcase => {
  const draftId = `${DRAFT_SUITCASE_ID_PREFIX}${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: draftId,
    title,
    icon,
    user_id: userId,
    created_at: now,
    updated_at: now,
    suitcase_items: items.map((item, index) => ({
      ...item,
      id: item.id ?? `${DRAFT_ITEM_ID_PREFIX}${Date.now()}-${index}`,
      suitcase_id: draftId,
    })),
    custom_categories: [],
    ui_state: { hidden_category_ids: [] },
    source_template_id: null,
    workspace_kind: workspaceKind,
    is_user_template: workspaceKind === 'user_template',
  };
};

/**
 * Genera una nuova struttura dati per una valigia guest (legacy ID guest-suitcase-*).
 * I caller esistenti restano invariati fino alle PR successive.
 * Per nuove workspace auth usare createDraftWorkspaceObject.
 */
export const createGuestSuitcaseObject = (title: string, icon: string, items: SuitcaseItem[] = []): Suitcase => {
  return {
    id: `${LEGACY_GUEST_SUITCASE_ID_PREFIX}${Date.now()}`,
    title,
    icon,
    user_id: 'guest',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suitcase_items: items,
    custom_categories: [],
    ui_state: { hidden_category_ids: [] },
    source_template_id: null,
  };
};

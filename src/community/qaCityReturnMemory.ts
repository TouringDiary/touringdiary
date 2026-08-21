/**
 * Memoria ritorno Q&A Local → città → Indietro.
 * sessionStorage: sopravvive a closeModal + navigateToCity.
 * Una sola pending per sessione (`td.qa.cityReturn`): save sovrascrive; consume è one-shot.
 * Validità: cityId reale del post + ciclo save/consume (niente TTL artificiale).
 * `savedAt`: timestamp di scrittura del payload (integrità parse); non usato come scadenza.
 * Restore UX: tab Q&A + filtro + scroll lista; postId = ancora logica opzionale.
 */

export type QaCityReturnMemory = {
  section: 'community';
  tab: 'qa';
  /** Città di destinazione reale (post.cityId). */
  cityId: string;
  /** Post di origine (lista), se disponibile. */
  postId?: string;
  showMyPostsOnly: boolean;
  /** Scroll della lista domande (px). */
  listScrollTop: number;
  savedAt: number;
};

export type QaCityReturnSaveInput = {
  cityId: string;
  postId?: string;
  showMyPostsOnly: boolean;
  listScrollTop: number;
};

const STORAGE_KEY = 'td.qa.cityReturn';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseQaCityReturnMemory(raw: string): QaCityReturnMemory | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  if (parsed.section !== 'community') return null;
  if (parsed.tab !== 'qa') return null;
  if (typeof parsed.cityId !== 'string' || parsed.cityId.trim() === '') return null;
  if (
    parsed.postId !== undefined &&
    (typeof parsed.postId !== 'string' || parsed.postId.trim() === '')
  ) {
    return null;
  }
  if (typeof parsed.showMyPostsOnly !== 'boolean') return null;
  if (
    typeof parsed.listScrollTop !== 'number' ||
    !Number.isFinite(parsed.listScrollTop) ||
    parsed.listScrollTop < 0
  ) {
    return null;
  }
  if (
    typeof parsed.savedAt !== 'number' ||
    !Number.isFinite(parsed.savedAt) ||
    parsed.savedAt <= 0
  ) {
    return null;
  }

  const memory: QaCityReturnMemory = {
    section: 'community',
    tab: 'qa',
    cityId: parsed.cityId,
    showMyPostsOnly: parsed.showMyPostsOnly,
    listScrollTop: parsed.listScrollTop,
    savedAt: parsed.savedAt,
  };
  if (typeof parsed.postId === 'string') {
    memory.postId = parsed.postId;
  }
  return memory;
}

export function saveQaCityReturn(memory: QaCityReturnSaveInput): void {
  if (typeof sessionStorage === 'undefined') return;
  if (typeof memory.cityId !== 'string' || memory.cityId.trim() === '') return;
  if (
    memory.postId !== undefined &&
    (typeof memory.postId !== 'string' || memory.postId.trim() === '')
  ) {
    return;
  }
  if (typeof memory.showMyPostsOnly !== 'boolean') return;
  if (
    typeof memory.listScrollTop !== 'number' ||
    !Number.isFinite(memory.listScrollTop) ||
    memory.listScrollTop < 0
  ) {
    return;
  }

  try {
    const payload: QaCityReturnMemory = {
      section: 'community',
      tab: 'qa',
      cityId: memory.cityId,
      showMyPostsOnly: memory.showMyPostsOnly,
      listScrollTop: memory.listScrollTop,
      savedAt: Date.now(),
    };
    if (memory.postId) {
      payload.postId = memory.postId;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekQaCityReturn(): QaCityReturnMemory | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseQaCityReturnMemory(raw);
  } catch {
    return null;
  }
}

export function consumeQaCityReturn(): QaCityReturnMemory | null {
  const memory = peekQaCityReturn();
  clearQaCityReturn();
  return memory;
}

export function clearQaCityReturn(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

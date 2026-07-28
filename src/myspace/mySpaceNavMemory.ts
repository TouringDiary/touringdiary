/**
 * Memoria di navigazione MySpace — path completo (DOC 35 §3.13 / §11).
 * Persistenza sessionStorage: sopravvive a closeModal / remount.
 */

import type { MySpaceRootId } from './mySpaceRoots';
import type { MySpaceTripsView } from './mySpaceTripsSession';

export type MySpaceNavMemory = {
  activeRoot: MySpaceRootId;
  tripsView: MySpaceTripsView;
  /** Titolo cartella (breadcrumb); opzionale. */
  folderTitle?: string | null;
  /**
   * Estensione path interno sezione (es. Ricordi → Foto Giorno X).
   * STEP-1: riservato; popolato da STEP-2+.
   */
  sectionSubPath?: string | null;
  savedAt: number;
};

const storageKey = (userId: string) => `td.myspace.nav.${userId}`;

export function saveMySpaceNavMemory(userId: string, memory: Omit<MySpaceNavMemory, 'savedAt'>): void {
  if (!userId || typeof sessionStorage === 'undefined') return;
  try {
    const payload: MySpaceNavMemory = { ...memory, savedAt: Date.now() };
    sessionStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadMySpaceNavMemory(userId: string): MySpaceNavMemory | null {
  if (!userId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MySpaceNavMemory;
    if (!parsed || !parsed.activeRoot || !parsed.tripsView) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearMySpaceNavMemory(userId: string): void {
  if (!userId || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}

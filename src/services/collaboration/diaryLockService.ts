import {
  tryAcquireSharedResourceEditLock,
  releaseSharedResourceEditLock,
  getSharedResourceEditLockHolder,
} from './sharedResourceLockService';

/**
 * Lock Diario v1 (§13) — delegato al servizio lock risorsa condivisibile (Fase 9).
 * @deprecated Preferire sharedResourceLockService per nuovo codice.
 */
export const tryAcquireDiaryEditLock = tryAcquireSharedResourceEditLock;
export const releaseDiaryEditLock = releaseSharedResourceEditLock;
export const getDiaryEditLockHolder = getSharedResourceEditLockHolder;

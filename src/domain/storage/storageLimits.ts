/**
 * Limiti di storage configurabili dall'Admin (Sistema → Impostazioni Globali).
 * Chiave: `SETTINGS_KEYS.STORAGE_LIMITS` (`global_settings.storage_limits`).
 * Lettura futura: `getSetting` / `getCachedSetting` o `useConfig().configs.storage_limits`.
 * Nessun valore hardcoded: se assente in DB, i consumer restano disabilitati.
 */
export interface StorageLimitsConfig {
  /** Dimensione massima singolo allegato (byte). */
  maxAttachmentBytes: number;
  /** Spazio massimo per account utente (byte). */
  maxAccountBytes: number;
  /** Spazio massimo per Workspace (byte). Fase 7+. */
  maxWorkspaceBytes: number;
}

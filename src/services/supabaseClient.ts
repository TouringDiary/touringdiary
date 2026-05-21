import { createClient } from '@supabase/supabase-js';
import { Database, Json } from '../types/supabase';

export type { Json };

/**
 * ------------------------------------------------------------------
 * 🔒 SECURITY NOTICE
 * Credenziali Demo. In produzione usare variabili d'ambiente.
 * ------------------------------------------------------------------
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://iyncirtysrjrmqwfmkbm.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_12o2VzkveewDpHKYRUPiaQ_ZzkI3cyl';

console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + "...");

// Chiave storage FISSA per lo sviluppo: evita che la sessione si perda
// quando si passa tra localhost, 127.0.0.1 o IP di rete.
const STORAGE_KEY = `td_auth_dev_v1`;
console.log("[Supabase] Using storage key:", STORAGE_KEY);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY,
  }
});

export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && SUPABASE_KEY.length > 20;
};

/**
 * ------------------------------------------------------------------
 * 🔒 AUTH CONCURRENCY CONTROL
 * In ambiente dev, operazioni concorrenti su Auth (es. setSession + getSession)
 * possono causare lock contention ("Lock not released", "Lock broken").
 * Questo flag segnala quando un'operazione manuale è in corso.
 * ------------------------------------------------------------------
 */
export let isAuthOperationInProgress = false;
let authLockTimeout: any = null;

export const setAuthOperationInProgress = (value: boolean) => {
  isAuthOperationInProgress = value;

  if (authLockTimeout) {
    clearTimeout(authLockTimeout);
    authLockTimeout = null;
  }

  if (value) {
    console.log(`[SupabaseClient] 🔒 Auth internal lock ACTIVE`);
    // Safety timeout: reset flag dopo 10 secondi per evitare blocchi permanenti
    authLockTimeout = setTimeout(() => {
      if (isAuthOperationInProgress) {
        console.warn("[SupabaseClient] ⚠️ Auth lock safety timeout reached. Auto-resetting flag.");
        isAuthOperationInProgress = false;
      }
    }, 10000);
  } else {
    console.log(`[SupabaseClient] 🔓 Auth internal lock RELEASED`);
  }
};

/**
 * Valida la sessione corrente. 
 * Orchestrazione reale: se un'operazione auth è in corso, attende lo sblocco 
 * invece di falsificare il risultato.
 */
export const validateSession = async (): Promise<boolean> => {
  // Attesa attiva (polling) se un'operazione critica è in corso
  let retryCount = 0;
  while (isAuthOperationInProgress && retryCount < 10) {
    console.log(`[SupabaseClient] validateSession waiting for auth lock... (${retryCount + 1}/10)`);
    await new Promise(resolve => setTimeout(resolve, 500));
    retryCount++;
  }

  if (isAuthOperationInProgress) {
    console.error("[SupabaseClient] validateSession ABORTED: Auth lock did not release in time.");
    return false; // Non mentiamo più: se è bloccato, la validazione è fallita/indeterminata
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return false;

    // Verifica che il token non sia scaduto
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;

    const nowSec = Math.floor(Date.now() / 1000);
    const isValid = expiresAt > nowSec;

    if (!isValid) {
      console.warn("[Supabase] Sessione scaduta (token exp:", new Date(expiresAt * 1000).toISOString(), ")");
    }

    return isValid;
  } catch (e) {
    console.error("[Supabase] validateSession error:", e);
    return false;
  }
};

import { createClient } from '@supabase/supabase-js';

/**
 * ------------------------------------------------------------------
 * 🔒 SECURITY NOTICE
 * Credenziali Demo. In produzione usare variabili d'ambiente.
 * ------------------------------------------------------------------
 */
const SUPABASE_URL = 'https://iyncirtysrjrmqwfmkbm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bmNpcnR5c3Jqcm1xd2Zta2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODEyMTAsImV4cCI6MjA4MTg1NzIxMH0.jUb0olX8fe-vC_XUpX_QRcA-zorVIcbFBbkWM-DXPFg';

// SAFE HYBRID STORAGE ADAPTER
// Tenta di usare localStorage per la persistenza.
// Se fallisce (es. Iframe, Privacy Mode), usa la RAM come fallback trasparente.
class SafeStorageAdapter {
  private memoryStore: Map<string, string>;

  constructor() {
    this.memoryStore = new Map();
  }

  getItem(key: string): string | null {
    // 1. Prova LocalStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignora errore accesso
    }
    // 2. Fallback Memoria
    return this.memoryStore.get(key) || null;
  }

  setItem(key: string, value: string): void {
    // 1. Prova LocalStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignora errore accesso
    }
    // 2. Scrivi sempre anche in memoria per coerenza sessione corrente
    this.memoryStore.set(key, value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Ignora
    }
    this.memoryStore.delete(key);
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: new SafeStorageAdapter(), // Usa l'adapter ibrido
    persistSession: true, // ABILITA LA PERSISTENZA (Cruciale!)
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (url, options) => {
      try {
        return await fetch(url, options);
      } catch (e: any) {
        // Intercetta l'errore di rete prima che diventi un'eccezione non gestita
        // e restituisce una risposta "finta" 503 (Service Unavailable).
        // In questo modo Supabase gestirà l'errore in modo pulito senza far
        // comparire "TypeError: Failed to fetch" in rosso nella console.
        return new Response(JSON.stringify({ error: "Database irraggiungibile (Offline Mode)" }), {
          status: 503,
          statusText: "Service Unavailable",
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});

export const isSupabaseConfigured = () => {
    return !!SUPABASE_URL && SUPABASE_KEY.length > 20;
};

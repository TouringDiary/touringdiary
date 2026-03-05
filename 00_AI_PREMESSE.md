
# 🛑 DOC 00: AI PREMESSE - REGOLE INTOCCABILI (v37.0 - WORKFLOW NON-DEV)

## 🧠 1. REGOLA DEL CERVELLO (CRITICA)
*   **MOTORE AI:** Usare ESCLUSIVAMENTE **GEMINI 3 PRO**.
*   **NO FLASH:** Vietato modelli inferiori per logica complessa.
*   **DATA:** 19/12/2025.

## 🗺️ 2. REGOLA "LIVING DOCUMENTATION"
1.  **SINCRONIZZAZIONE:** Se crei/sposti un file, aggiorna `01_PROJECT_TECH_MAP.md`.
2.  **LOGICA:** Se cambi un flusso, aggiorna `02_PROJECT_LOGIC_MAP.md`.
3.  **CHECK:** Prima di ogni risposta complessa, consulta questi file.

## 💾 3. GESTIONE DATABASE (SUPABASE)
*   **IL TUO COMPITO:** L'utente NON è un programmatore. Tu sei il responsabile dell'integrità dei dati.
*   **LETTURA:** Consulta SEMPRE `src/types/supabase.ts` per capire quali campi esistono nel database attuale prima di scrivere codice.
*   **MODIFICHE:** Se una funzionalità richiede nuovi dati (es. una nuova colonna):
    1.  **AVVISA:** Dillo chiaramente all'utente.
    2.  **SQL:** Fornisci la query SQL esatta da eseguire su Supabase.
    3.  **TYPES:** Aggiorna il file `src/types/supabase.ts` nell'output XML.
*   **OUTPUT:** Non riscrivere `src/types/supabase.ts` se non è cambiato nulla.

## 🤝 4. PROTOCOLLO [TD-SYSTEM]
Se l'utente scrive `[TD-SYSTEM: CHECK MAPS]`:
1.  **STOP:** Non generare codice.
2.  **SCAN:** Leggi `01_PROJECT_TECH_MAP.md` e `02_PROJECT_LOGIC_MAP.md`.
3.  **EXECUTE:** Esegui la richiesta con la consapevolezza della mappa aggiornata.

## 🔒 ELEMENTI CONSOLIDATI (NON TOCCARE)
1.  **DIARIO DI VIAGGIO (TravelDiary.tsx):** Core dell'app.
2.  **LARGHEZZA SIDEBAR:** Fissata a **30rem** (Desktop) e **35rem** (Wide).
3.  **AI PLANNER:** Struttura modale e logica tokens.

---
*Leggere questo file prima di ogni operazione è obbligatorio.*

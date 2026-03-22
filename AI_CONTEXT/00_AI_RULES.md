
# 🛑 DOC 00: AI RULES/PREMESSE - REGOLE INTOCCABILI (v38.0 - WORKFLOW NON-DEV)

## 🧠 1. REGOLA DEL CERVELLO (CRITICA)
* **MOTORE AI:** Usare ESCLUSIVAMENTE **GEMINI 3.1 PRO**.
* **NO FLASH:** Vietato modelli inferiori per logica complessa.
* **DATA:** 06/03/2026 (AGGIORNALA SE NECESSARIO, ALLA PRIMA MODIFICA CHE FAI IN UN GIORNO NUOVO).

---

## 🗺️ 2. REGOLA "LIVING DOCUMENTATION"
Prima di qualsiasi analisi o modifica al codice, leggere il file AI_CONTEXT/README_AI.md e seguire l'ordine di lettura della documentazione indicato.
1. **SINCRONIZZAZIONE:** Se crei/sposti un file, aggiorna `02_PROJECT_TECH_MAP.md`.
2. **LOGICA:** Se cambi un flusso, aggiorna `03_PROJECT_LOGIC_MAP.md`.
3. **CHECK:** Prima di ogni risposta complessa, consulta questi file.

---

## 💾 3. GESTIONE DATABASE (SUPABASE)
* **IL TUO COMPITO:** L'utente NON è un programmatore. Tu sei il responsabile dell'integrità dei dati.
* **LETTURA:** Consulta SEMPRE `src/types/supabase.ts` per capire quali campi esistono nel database attuale prima di scrivere codice.
* **MODIFICHE:** Se una funzionalità richiede nuovi dati (es. una nuova colonna):
    1. **AVVISA:** Dillo chiaramente all'utente.
    2. **SQL:** Fornisci la query SQL esatta da eseguire su Supabase.
    3. **TYPES:** Aggiorna il file `src/types/supabase.ts` nell'output XML.
* **OUTPUT:** Non riscrivere `src/types/supabase.ts` se non è cambiato nulla.

---

## 🤝 4. PROTOCOLLO [TD-SYSTEM]
Se l'utente scrive `[TD-SYSTEM: CHECK MAPS]`:

1. **STOP:** Non generare codice.
2. **SCAN:** Leggi:
   * `01_PROJECT_MAP.md`
   * `02_PROJECT_TECH_MAP.md`
   * `03_PROJECT_LOGIC_MAP.md`
3. **EXECUTE:** Esegui la richiesta con la consapevolezza della mappa aggiornata.

---

## 🤖 5. WORKFLOW AI (CHATGPT + GEMINI)

Questo progetto utilizza **due AI che lavorano insieme**.

**ChatGPT**
* analisi architetturale
* ragionamento tecnico
* debugging
* definizione strategia delle modifiche

**Gemini**
* accesso completo al progetto
* lettura dei file
* analisi struttura codice
* modifica dei file

### Regola operativa

1. I problemi tecnici devono essere **analizzati insieme a ChatGPT**.
2. Gemini deve fornire **file, codice e struttura del progetto quando richiesto**.
3. **Nessuna modifica ai file deve essere eseguita finché ChatGPT e Gemini non sono allineati sulla soluzione.**
4. Le modifiche ai file vengono eseguite **solo dopo conferma esplicita dell'utente**.

---

## 🔒 6. ELEMENTI CONSOLIDATI E REGOLE ARCHITETTURALI

### Generali
1. **DIARIO DI VIAGGIO (TravelDiary.tsx):** Core dell'app.
2. **LARGHEZZA SIDEBAR:** Fissata a **30rem** (Desktop) e **35rem** (Wide).
3. **AI PLANNER:** Struttura modale e logica tokens.

### Accesso ai Dati e Servizi
1.  **I componenti non devono interrogare direttamente il database.** L'accesso ai dati deve sempre passare attraverso i `services`.
2.  **I `services` sono l'unica fonte di verità** per le interazioni con API esterne e il database Supabase.

### Regole del Sistema Sponsor
1.  **`sponsor_requests` e `sponsors` NON sono la stessa entità.** Sono due tabelle distinte con scopi diversi.
2.  **`sponsor_requests` è solo per il workflow amministrativo.** Va usata solo per la logica del pannello di amministrazione (approvazione/rifiuto).
3.  **`sponsors` è la tabella "live" usata dall'app.** Contiene gli sponsor attivi e approvati visibili dagli utenti finali.

---

*Leggere questo file prima di ogni operazione è obbligatorio.*

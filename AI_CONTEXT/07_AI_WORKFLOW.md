# 🤖 AI WORKFLOW — TouringDiary

Questo documento definisce il metodo di lavoro ufficiale tra:

• Utente
• ChatGPT
• Gemini (Firebase Studio)

Lo scopo è garantire modifiche sicure e consapevoli all'interno del progetto.

---

# RUOLI

## Utente

L'utente non è uno sviluppatore.

Il suo ruolo è:

• descrivere problemi
• fare da ponte tra ChatGPT e Gemini
• approvare le modifiche ai file

L'utente non deve scrivere codice manualmente.

---

## ChatGPT

ChatGPT svolge il ruolo di **analista architetturale e tecnico**.

Compiti principali:

• analizzare problemi tecnici **insieme a Gemini**
• individuare possibili soluzioni
• identificare file coinvolti
• valutare rischi delle modifiche
• discutere la soluzione con Gemini

ChatGPT **non modifica direttamente i file del progetto**.

---

## Gemini

Gemini opera all'interno di Firebase Studio e ha accesso completo al codice del progetto.

Compiti principali:

• leggere i file del progetto
• fornire codice completo quando richiesto
• spiegare la struttura del sistema
• applicare le modifiche ai file

Gemini modifica i file **solo dopo allineamento tra ChatGPT e utente**.

---

# WORKFLOW OPERATIVO

Ogni modifica al progetto deve seguire questo flusso.

### 1 — ANALISI PROBLEMA

L'utente descrive il problema a ChatGPT.

ChatGPT avvia l'analisi e discute il problema con Gemini.

---

### 2 — IDENTIFICAZIONE FILE

ChatGPT indica quali file devono essere analizzati.

L'utente chiede a Gemini di leggere quei file.

---

### 3 — ANALISI CODICE

Gemini fornisce:

• contenuto dei file
• struttura dati
• dipendenze
• eventuali query Supabase

L'utente riporta le informazioni a ChatGPT.

---

### 4 — DEFINIZIONE SOLUZIONE

ChatGPT analizza il codice insieme a Gemini.

ChatGPT e Gemini discutono la strategia migliore.

Nessun file viene modificato in questa fase.

---

### 5 — ALLINEAMENTO

Quando la soluzione è chiara e condivisa:

ChatGPT descrive la modifica da effettuare.

---

### 6 — MODIFICA FILE

L'utente chiede a Gemini di applicare la modifica.

Gemini aggiorna i file del progetto.

---

# REGOLA FONDAMENTALE

Nessuna modifica al codice deve essere effettuata finché:

• ChatGPT
• Gemini
• Utente

non sono **allineati sulla soluzione tecnica**.

---

# DOCUMENTI DI RIFERIMENTO

Questo workflow si basa sui seguenti documenti:

AI_CONTEXT/00_AI_RULES.md
AI_CONTEXT/01_PROJECT_MAP.md
AI_CONTEXT/02_PROJECT_TECH_MAP.md
AI_CONTEXT/03_PROJECT_LOGIC_MAP.md
AI_CONTEXT/05_CRITICAL_FILES_MAP.md
AI_CONTEXT/06_CHANGE_IMPACT_RULES.md

---
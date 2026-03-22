
# 🧠 CHANGE IMPACT RULES — TouringDiary

Questo documento definisce il processo obbligatorio da seguire prima di effettuare qualsiasi modifica al codice del progetto TouringDiary.

Lo scopo è evitare modifiche isolate che possano generare bug in altre parti del sistema.

---

## REGOLA FONDAMENTALE

Nessuna modifica al codice deve essere effettuata senza prima eseguire una **analisi dell'impatto delle modifiche**.

L'analisi deve essere discussa con ChatGPT prima dell'applicazione delle modifiche.

---

## PROCESSO OBBLIGATORIO

Prima di modificare qualsiasi file del progetto, devono essere dichiarati i seguenti punti.

### 1 — PROBLEMA

Descrizione chiara del problema o della modifica richiesta.

Esempio:

• bug UI
• errore runtime
• nuova funzionalità
• refactoring

---

### 2 — FILE POTENZIALMENTE IMPATTATI

Elencare i file che potrebbero essere coinvolti nella modifica.

Devono essere considerati:

• componenti React
• hooks
• context
• services
• types
• utilità condivise

---

### 3 — RISCHI

Identificare i possibili effetti collaterali della modifica.

Esempi:

• rottura layout
• errori di stato globale
• problemi di routing
• regressioni nel diario di viaggio
• errori nelle chiamate Supabase
• problemi AI planner

---

### 4 — STRATEGIA DI MODIFICA

Descrivere il piano tecnico per risolvere il problema.

La strategia deve specificare:

• quali file verranno modificati
• perché vengono modificati
• quale approccio verrà utilizzato

---

### 5 — VALIDAZIONE

Le modifiche ai file possono essere effettuate **solo dopo conferma dell'utente**.

---
## VERIFICHE OBBLIGATORIE
Prima di ogni modifica, è fondamentale eseguire i seguenti controlli:

1.  **Analisi del Codice**: Analizza i componenti, gli hook e i servizi coinvolti.
2.  **Verifica dei Tipi**: Controlla i tipi (es. `src/types/supabase.ts`) per capire le strutture dati.
3.  **Analisi delle Policy RLS**: Verifica sempre le policy di Row-Level Security su Supabase per le tabelle coinvolte. L'assenza di una policy per un ruolo specifico (`authenticated`, `anon`) risulta in un blocco (DENY by default). Questo è un controllo di sicurezza critico.
4.  **Impatto sulla UI**: Valuta come la modifica influenzerà l'interfaccia utente.
5.  **Coerenza con la Documentazione**: Assicurati che il cambiamento sia coerente con `PROJECT_LOGIC_MAP.md`.

---

## OBIETTIVO

Ridurre:

• regressioni
• bug non intenzionali
• modifiche pericolose al core dell'app

Garantire che ogni modifica sia **consapevole dell'architettura completa del progetto**.

---

## AMBITO DI APPLICAZIONE

Questa regola si applica in particolare ai file indicati in:

AI_CONTEXT/05_CRITICAL_FILES_MAP.md

---
